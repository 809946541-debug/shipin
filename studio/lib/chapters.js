'use strict';
// 发布文案：把分镜整理成「摘要 + 章节列表」，时间戳直接取自 beats.json 的真实配音时长
const fs = require('fs');
const path = require('path');
const { chat, pickText } = require('./llm');
const { looseParseJSON } = require('./prompt');

const SYS = `你是中文短视频的发布文案编辑。用户会给你一份已定稿的竖屏财经分镜清单，请整理成发抖音用的「摘要 + 章节列表」。

【要求】
1. 摘要：90–140 字，一段话，概括这条视频讲了什么、按什么顺序讲。口语、克制，不用「本视频」「如图所示」这类词，不加表情、话题标签和标题党。
2. 章节：4–6 个，把连续的屏合并成一章。每章给出起始屏序号 from、标题 title（不超过 16 字）、描述 desc（一句话，不超过 50 字，说清这一章讲了什么）。
   标题优先「数字 + 人话」：清单里给了具体数字（家数、成交额、涨跌幅、板块）时，直接写进去，例如「上涨5204家，下跌168家」「涨停86家，跌停12家」；不要用「量能与涨跌」「短线情绪」这类后台标签。
3. from 必须取自清单里的屏序号；第一章 from 必须是 0；from 严格递增；结语那一屏不要单独成章。
4. 只使用清单里出现的信息，不编造数字、地名或结论。
5. 只输出 JSON：{"summary":"…","chapters":[{"from":0,"title":"…","desc":"…"}]}`;

function clean(s, n) {
  return String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, n);
}

function fmtTime(sec) {
  const s = Math.max(0, Math.round(Number(sec) || 0));
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}

function timeline(board, beats) {
  const scenes = board.scenes || [];
  const starts = [];
  let t = 0;
  scenes.forEach((s, i) => {
    starts.push(t);
    t += Number(beats[i] && beats[i].dur) || 0;
  });
  return { scenes, starts };
}

function fallbackSummary(board, chapters) {
  const meta = board.meta || {};
  const head = [meta.title, meta.subtitle].filter(Boolean).join('：');
  const names = chapters.slice(1).map(c => c.title).filter(Boolean);
  return head + (head ? '。' : '') + (names.length ? '视频按顺序讲了' + names.join('、') + '。' : '');
}

function fallbackChapters(scenes) {
  const idx = [];
  scenes.forEach((s, i) => { if (s.kind !== 'end') idx.push(i); });
  const n = idx.length;
  const k = Math.min(6, Math.max(4, Math.round(n / 5)));
  const out = [];
  for (let c = 0; c < k; c++) {
    const at = Math.min(Math.round(c * n / k), n - 1);
    const last = c === k - 1 ? n - 1 : Math.max(at, Math.round((c + 1) * n / k) - 1);
    const from = idx[at];
    const to = idx[Math.min(last, n - 1)];
    const head = scenes[from] || {};
    const parts = [];
    for (let i = from; i <= to && parts.length < 2; i++) {
      const s = scenes[i] || {};
      if (s.sub) parts.push(s.sub);
    }
    out.push({
      from,
      title: head.kind === 'cover' ? '引言' : clean(head.title || head.kicker || '要点', 12),
      desc: clean(parts.join('；'), 52),
    });
  }
  return out;
}

function sanitizePlan(plan, scenes) {
  if (!plan || !Array.isArray(plan.chapters)) return [];
  const out = [];
  const seen = new Set();
  for (const c of plan.chapters) {
    const from = Number(c && c.from);
    if (!Number.isInteger(from) || from < 0 || from >= scenes.length) continue;
    if (scenes[from].kind === 'end' || seen.has(from)) continue;
    const title = clean(c.title, 20);
    if (!title) continue;
    seen.add(from);
    out.push({ from, title: title.slice(0, 16), desc: clean(c.desc, 80).slice(0, 52) });
  }
  if (out.length < 3) return [];
  out.sort((a, b) => a.from - b.from);
  if (out[0].from !== 0) out.unshift({ from: 0, title: '引言', desc: clean(scenes[0] && scenes[0].sub, 52) });
  return out.slice(0, 8);
}

// 固定模式（每日播报）的章节由业务侧按真实数据算好后放在 meta.chapters，直接用，不再调模型
function usePreset(plan, scenes) {
  if (!Array.isArray(plan) || !plan.length) return [];
  const seen = new Set();
  const out = [];
  for (const c of plan) {
    const from = Number(c && c.from);
    if (!Number.isInteger(from) || from < 0 || from >= scenes.length) continue;
    if (scenes[from].kind === 'end' || seen.has(from)) continue;
    const title = clean(c.title, 16);
    if (!title) continue;
    seen.add(from);
    out.push({ from, title: title.slice(0, 16), desc: clean(c.desc, 52) });
  }
  if (out.length < 3) return [];
  out.sort((a, b) => a.from - b.from);
  if (out[0].from !== 0) out.unshift({ from: 0, title: '引言', desc: clean(scenes[0] && scenes[0].sub, 52) });
  return out.slice(0, 8);
}

function presetSummary(board, chapters) {
  const meta = board.meta || {};
  const head = [meta.title, meta.subtitle].filter(Boolean).join('：');
  const names = chapters.slice(1).map(c => c.title).filter(Boolean);
  return (head ? head + '。' : '') + '这条视频按「' + (names.length ? names.join('、') : '数据顺序') + '」的顺序，把今天的公开行情数据过一遍。';
}

async function askModel(board, scenes, starts, config) {
  if (!config || !config.baseUrl || !config.model) throw new Error('未配置大模型接口');
  const meta = board.meta || {};
  const list = [];
  scenes.forEach((s, i) => {
    if (s.kind === 'end') return;
    const facts = []
      .concat(Array.isArray(s.notes) ? s.notes : [])
      .concat(Array.isArray(s.stats) ? s.stats.map(x => `${x.l} ${x.v}`) : [])
      .concat(Array.isArray(s.bars) ? s.bars.map(x => `${x.label} ${x.note || x.value}`) : [])
      .concat(s.left && Array.isArray(s.left.items) ? s.left.items : [])
      .concat(s.right && Array.isArray(s.right.items) ? s.right.items : [])
      .join('；');
    list.push(`[${i}] ${fmtTime(starts[i])} ${clean(s.kicker, 8)}｜${clean(s.title, 20)}｜${clean(s.sub, 40)}${facts ? '｜' + clean(facts, 80) : ''}`);
  });
  const user = `视频标题：${clean(meta.title, 40)}\n副标题：${clean(meta.subtitle, 60)}\n\n分镜清单：\n${list.join('\n')}`;
  const res = await chat(config, [
    { role: 'system', content: SYS },
    { role: 'user', content: user },
  ], { temperature: 0.45 });
  const raw = pickText(res).replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try { return looseParseJSON(raw); } catch { return null; }
}

function buildText(scenes, starts, chapters, summary) {
  const lines = [
    '章节要点（摘要）',
    '',
    summary,
    '',
    '章节列表（时间戳取自视频中该章节画面出现的时刻）',
    '',
    '时间戳 标题 描述',
  ];
  for (const c of chapters) {
    const desc = c.desc ? ' ' + c.desc : '';
    lines.push(fmtTime(starts[c.from]) + ' ' + c.title + desc);
  }
  return lines.join('\n') + '\n';
}

async function buildChapters(dir, config, log = () => {}) {
  const file = path.join(dir, 'chapters.txt');
  if (fs.existsSync(file)) return { text: fs.readFileSync(file, 'utf8'), cached: true };
  const board = JSON.parse(fs.readFileSync(path.join(dir, 'storyboard.json'), 'utf8'));
  let beats = [];
  try { beats = JSON.parse(fs.readFileSync(path.join(dir, 'beats.json'), 'utf8')).beats || []; } catch { }
  if (!beats.length) throw new Error('配音还没生成，暂时不能生成章节文案');

  const { scenes, starts } = timeline(board, beats);

  const preset = usePreset(board.meta && board.meta.chapters, scenes);
  if (preset.length) {
    const text = buildText(scenes, starts, preset, presetSummary(board, preset));
    fs.writeFileSync(file, text);
    return { text, cached: false };
  }

  let plan = null;
  try {
    plan = await askModel(board, scenes, starts, config);
  } catch (e) {
    log('章节文案模型调用失败，改用规则生成：' + e.message);
  }

  let chapters = sanitizePlan(plan, scenes);
  if (!chapters.length) chapters = fallbackChapters(scenes);
  const summary = clean(plan && plan.summary, 400) || fallbackSummary(board, chapters);
  const text = buildText(scenes, starts, chapters, summary);
  fs.writeFileSync(file, text);
  return { text, cached: false };
}

module.exports = { buildChapters, fmtTime };
