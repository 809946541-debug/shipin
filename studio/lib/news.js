'use strict';
// 快讯抓取 + 选题生成：新浪财经 7x24、华尔街见闻（要闻 / A股）、中新网国际
const { chat, pickText } = require('./llm');

const CACHE_MS = 3 * 60 * 1000;
const TIMEOUT_MS = 8000;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';

function plain(s) {
  return String(s || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function cnTime(s) {
  // 新浪是 "2026-11-18 19:17:47"，按东八区解析
  const t = Date.parse(String(s || '').replace(' ', 'T') + '+08:00');
  return Number.isFinite(t) ? t : Date.now();
}

function rssDate(s) {
  const t = Date.parse(String(s || '').trim());
  return Number.isFinite(t) ? t : 0;
}

// 极简 RSS 解析，够用即可（title / link / description / pubDate）
function parseRSS(xml) {
  const out = [];
  const re = /<(?:item|entry)>([\s\S]*?)<\/(?:item|entry)>/g;
  let m;
  while ((m = re.exec(xml))) {
    const block = m[1];
    const tag = name => {
      const t = block.match(new RegExp('<' + name + '[^>]*>([\\s\\S]*?)</' + name + '>'));
      if (!t) return '';
      return plain(t[1].replace(/^\s*<!\[CDATA\[/, '').replace(/\]\]>\s*$/, ''));
    };
    out.push({
      title: tag('title'),
      link: tag('link'),
      desc: tag('description'),
      time: rssDate(tag('pubDate') || tag('dc:date')),
    });
  }
  return out;
}

const SOURCES = [
  {
    name: '新浪财经',
    cat: '财经',
    url: 'https://zhibo.sina.com.cn/api/zhibo/feed?page=1&page_size=50&zhibo_id=152&tag_id=0&dire=f&dpc=1',
    pick: j => (((j.result || {}).data || {}).feed || {}).list || [],
    map: it => {
      const text = plain(it.rich_text);
      return {
        id: 'sina-' + it.id,
        source: (it.tag && it.tag[0] && it.tag[0].name) ? '新浪财经·' + it.tag[0].name : '新浪财经',
        cat: '财经',
        time: cnTime(it.create_time),
        title: text.slice(0, 90),
        summary: text,
        url: it.docurl || '',
      };
    },
  },
  {
    name: '华尔街见闻',
    cat: '财经',
    url: 'https://api-one.wallstcn.com/apiv1/content/lives?channel=global-channel&limit=30',
    pick: j => (j.data || {}).items || [],
    map: it => ({
      id: 'wscn-' + it.id,
      source: '华尔街见闻',
      cat: '财经',
      time: (it.display_time || 0) * 1000,
      title: plain(it.title) || plain(it.content_text).slice(0, 90),
      summary: plain(it.content_text || it.content),
      url: it.uri || '',
    }),
  },
  {
    name: '华尔街见闻·A股',
    cat: 'A股',
    url: 'https://api-one.wallstcn.com/apiv1/content/lives?channel=a-stock-channel&limit=30',
    pick: j => (j.data || {}).items || [],
    map: it => ({
      id: 'wscn-a-' + it.id,
      source: '华尔街见闻·A股',
      cat: 'A股',
      time: (it.display_time || 0) * 1000,
      title: plain(it.title) || plain(it.content_text).slice(0, 90),
      summary: plain(it.content_text || it.content),
      url: it.uri || '',
    }),
  },
  {
    name: '中新网·国际',
    cat: '国际',
    kind: 'rss',
    url: 'https://www.chinanews.com.cn/rss/world.xml',
  },
];

async function get(url, asJSON) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctl.signal,
      headers: {
        'User-Agent': UA,
        Accept: asJSON ? 'application/json,text/plain,*/*' : 'application/rss+xml,application/xml,text/xml,*/*',
      },
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return asJSON ? await res.json() : await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function keyOf(title) {
  return title.replace(/[\s\p{P}\p{S}]/gu, '').slice(0, 28);
}

let cache = { at: 0, items: [], errors: [] };

async function listNews(force = false) {
  if (!force && cache.items.length && Date.now() - cache.at < CACHE_MS) return cache;

  const results = await Promise.all(SOURCES.map(async s => {
    try {
      if (s.kind === 'rss') {
        const xml = await get(s.url, false);
        const items = parseRSS(xml).map(it => ({
          id: 'rss-' + (it.link || it.title).slice(-48),
          source: s.name,
          cat: s.cat,
          time: it.time,
          title: it.title.slice(0, 90),
          summary: (it.desc || it.title).slice(0, 260),
          url: it.link,
        }));
        return { items: items.slice(0, 25), error: '' };
      }
      const data = await get(s.url, true);
      // 每个源只取最新的 25 条，避免财经快讯把国际新闻挤出列表
      return { items: s.pick(data).map(s.map).slice(0, 25), error: '' };
    } catch (e) {
      return { items: [], error: s.name + '：' + (e.name === 'AbortError' ? '请求超时' : e.message) };
    }
  }));

  const now = Date.now();
  const all = results.flatMap(r => r.items)
    // 丢掉旧闻，避免个别源长期不更新时混进历史条目
    .filter(x => x.title && x.title.length >= 10 && x.time && now - x.time < 72 * 3600 * 1000);

  const seen = new Set();
  const items = [];
  for (const x of all.sort((a, b) => b.time - a.time)) {
    const k = keyOf(x.title);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    items.push(x);
  }

  cache = {
    at: Date.now(),
    items: items.slice(0, 80),
    errors: results.map(r => r.error).filter(Boolean),
  };
  return cache;
}

const SYSTEM = `你是财经/时事竖版短视频的选题编辑。用户会给你几条刚抓取的快讯，可能是财报、政策、产业链，也可能是地缘冲突、国际热点。请从中提炼一个适合做 4-7 分钟复盘视频的选题。
只输出 JSON，结构：
{"title":"标题","intro":"一句话介绍","requirements":"补充要求","minutes":5}

要求：
- 地缘、战争、外交类选题，落点在「对中国、产业链、能源与供应链的影响」，不做战况推演；
- title 不超过 30 个汉字，点出现象背后的因果或悬念，可用冒号分隔，不夸张、不喊口号；
- intro 100-180 个字，按「现象 → 深层动因 → 对中国或产业链的影响 → 缓冲条件」组织，只陈述可查证的公开信息；
- requirements 写一句通用制作要求，如「内容客观，只做公开信息复盘，结尾注明不构成投资建议」；
- minutes 只能是 4、5、6、7 中的一个整数；
- 不预测战争胜负与军事行动，不推荐个股、不评价上市公司经营，不使用煽动性或站队式表述。`;

function buildUser(items) {
  const lines = items.map((x, i) => {
    const t = new Date(x.time || Date.now());
    const hm = `${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')} ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
    return `${i + 1}. [${x.source || ''} ${hm}] ${x.title}\n   ${String(x.summary || '').slice(0, 220)}`;
  });
  return '以下是选中的快讯：\n\n' + lines.join('\n') + '\n\n请提炼选题，只输出 JSON。';
}

function parseJSON(text) {
  const s = String(text || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const a = s.indexOf('{');
  const b = s.lastIndexOf('}');
  if (a < 0 || b <= a) throw new Error('模型没有返回 JSON');
  return JSON.parse(s.slice(a, b + 1));
}

async function generateTopic(items, config) {
  if (!config || !config.baseUrl || !config.model) throw new Error('请先在「大模型接口设置」里填写接口和模型');
  if (!config.apiKey) throw new Error('请先在「大模型接口设置」里填写 API Key');

  const messages = [
    { role: 'system', content: SYSTEM },
    { role: 'user', content: buildUser(items) },
  ];
  const res = await chat(config, messages, { temperature: 0.55 });
  const raw = parseJSON(pickText(res));

  const title = String(raw.title || '').trim();
  const intro = String(raw.intro || '').trim();
  if (!title) throw new Error('模型没有给出标题');
  if (!intro) throw new Error('模型没有给出一句话介绍');

  let minutes = Math.round(Number(raw.minutes));
  if (!Number.isFinite(minutes)) minutes = 5;
  minutes = Math.min(7, Math.max(4, minutes));

  return {
    title: title.slice(0, 60),
    intro: intro.slice(0, 400),
    requirements: String(raw.requirements || '内容客观，只做公开数据复盘，结尾注明不构成投资建议').slice(0, 200),
    minutes,
  };
}

module.exports = { listNews, generateTopic };
