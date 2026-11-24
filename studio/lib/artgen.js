'use strict';
// 按标题生成封面插画，支持三种方式：
//   svg         本地 AI 手绘：让大模型直接写 SVG，本地渲染，不依赖生图接口
//   pollinations 免费文生图接口（有限流，质感一般）
//   openai      OpenAI 兼容的 /images/generations（可接硅基流动、智谱、通义、OpenAI 等）
// 出图失败不阻塞流程，调用方会退回原来的素材封面。

const fs = require('fs');
const path = require('path');
const { chat, pickText } = require('./llm');
const { coverTheme, artBox } = require('./template');

const FREE_API = 'https://image.pollinations.ai/prompt/';

const PROVIDERS = ['svg', 'pollinations', 'openai'];
const PROVIDER_LABEL = { svg: '本地 AI 手绘', pollinations: '免费自动插画', openai: '第三方生图 API' };

// 分镜插图模式：素材库匹配 / 每屏 AI 手绘 / 每屏调生图接口
const SCENE_MODES = ['library', 'svg', 'api'];
const SCENE_MODE_LABEL = { library: '素材库 AI 匹配', svg: '每屏电脑手绘', api: '每屏生图 API' };
const SCENE_BOX = { w: 860, h: 400 };

function normalizeProvider(p) {
  return PROVIDERS.includes(p) ? p : 'svg';
}

function normalizeSceneMode(m) {
  return SCENE_MODES.includes(m) ? m : 'library';
}

// 本地手绘风格预设：只影响 SVG 手绘（封面 + 分镜），不影响素材库
const STYLES = {
  rough: {
    label: '手绘纸感',
    rule: '扁平手绘插画、粗描边（stroke 3-6）、少量排线阴影，颜色只用：描边 #2d2822，暖黄 #f0b968，赭金 #b08a3e，蓝 #8cb4d8，深蓝 #2b6b85，红 #b23a2a，玫红 #df938b。',
  },
  marker: {
    label: '马克笔扁平',
    rule: '马克笔平涂风格、大色块、不要排线和纹理，描边 4-7 且转角略圆，颜色只用：描边 #2b2723，红 #e2573f，黄 #f2c14e，蓝 #4f8fc0，绿 #6aa86b，米白 #f4efe2，色块边缘干净利落。',
  },
  ink: {
    label: '墨线淡彩',
    rule: '像报纸插图：黑色细线描边 2-4，用交叉排线画阴影，淡彩只做局部薄涂，颜色只用：线 #2d2822，淡彩 #d8c7a4、#c6d2dc、#dfc2b8、#c9d6c3，画面留白多、克制。',
  },
  blueprint: {
    label: '工程蓝图',
    rule: '工程制图/蓝图风格：线条以深蓝 #2b5f8a 为主，描边 2-4，结构线用虚线或双线表达，填充浅蓝 #dceaf3 与 #8cb4d8，少量 #2b6b85 加深，像零件示意图，不要写任何尺寸数字或文字。',
  },
  retro: {
    label: '复古海报',
    rule: '复古海报风格：粗黑描边 5-8，高饱和大色块，颜色只用：描边 #241f1a，砖红 #c8452f，芥末黄 #e8a33d，墨绿 #2f6b5e，米色 #e6dcc3，可以用半调圆点或斜条纹做装饰，但不要铺满背景。',
  },
};
const STYLE_KEYS = Object.keys(STYLES);
const STYLE_LABEL = {};
STYLE_KEYS.forEach(k => { STYLE_LABEL[k] = STYLES[k].label; });

function normalizeStyle(s) {
  return STYLES[s] ? s : 'rough';
}

function styleRule(meta, config) {
  const key = normalizeStyle((meta && meta.artStyle) || (config && config.artStyle));
  return STYLES[key].rule;
}

// 风格词放提示词末尾：实测出图接口只认简单的主体描述，长风格前缀会把画面带偏
const STYLE = ' flat vector illustration, thick clean outlines, no gradient, no shadow, warm cream beige background, minimal, centered with empty margins, no text, no watermark';

const SYS = '你是文生图提示词作者。给定一条中文竖屏短视频的标题和副标题，写一句英文画面描述，15-25 个英文单词。' +
  '画面必须是标题里最具体的那件实物构成的单一场景（具体到车、火箭、机器人、港口、人物这类能画出来的东西），' +
  '主体居中、四周留白充足。' +
  '只描述画面里有什么、怎么摆，禁止写任何风格或画质词（不要 realistic、photo、photography、3d、render、cinematic、detailed、studio lighting、illustration 之类），' +
  '也不要画图表、曲线、数字、K线，画面里不能出现文字、字母、数字。只输出这一句英文，不要引号，不要解释。';

const SVG_SYS = '你是手绘财经短视频的插画师。根据标题、副标题和内容线索，直接写一张封面插画的 SVG 代码。\n' +
  '硬性要求：\n' +
  '1. 只输出一个完整的 <svg>…</svg>，不要 markdown 代码块、不要解释文字。\n' +
  '2. 画布 viewBox="0 0 860 560"，横版构图，主体居中，四周至少留 40px 空白。\n' +
  '3. 手艺要求：{{STYLE}}**整张图不要背景色**：禁止铺满画布的底色矩形，只画物件本身，背景保持透明。\n' +
  '4. 画面必须是标题里最具体的事物组成的单一场景，能让观众一眼看出这条视频讲什么。公司/人物要落到具体业务物件：车企画汽车，芯片公司画晶圆/显卡，数据中心画机柜，发布会画讲台，航运画货轮，能源画油管/风机。\n' +
  '5. 除非标题主体就是机器人，否则禁止画人形机器人；不要因为提到 AI、智能、自动驾驶就画机器人。\n' +
  '6. 画面里禁止出现任何文字、字母、数字、Logo、水印；不要 <text>、<script>、<image>、<foreignObject>、<style>、外部链接和事件属性。\n' +
  '7. 用 8-30 个基础图形（path/rect/circle/line/polygon/ellipse）拼出来，不要超出画布，不要用渐变。';

const SCENE_SVG_SYS = '你是手绘财经短视频的分镜插画师。根据这一屏的文字内容，直接写一张分镜插画的 SVG 代码。\n' +
  '硬性要求：\n' +
  '1. 只输出一个完整的 <svg>…</svg>，不要 markdown 代码块、不要解释文字。\n' +
  '2. 画布 viewBox="0 0 860 380"，横版长条构图，主体居中，左右至少留 40px 空白。\n' +
  '3. 手艺要求：{{STYLE}}**整张图不要背景色**：禁止铺满画布的底色矩形，只画物件本身，背景保持透明。\n' +
  '4. 画面只表现这一屏最具体的那件事/物，不要堆砌；抽象概念用一两件具体物件加简单符号表达，能让观众一眼看懂这一屏在讲什么。\n' +
  '5. 除非这一屏讲的就是机器人，否则禁止画人形机器人；不要因为提到 AI、智能、自动驾驶就画机器人。\n' +
  '6. 画面里禁止出现任何文字、字母、数字、Logo、水印；不要 <text>、<script>、<image>、<foreignObject>、<style>、外部链接和事件属性。\n' +
  '7. 用 6-20 个基础图形（path/rect/circle/line/polygon/ellipse）拼出来，不要超出画布，不要用渐变。';

const SYS_SCENE = '你是文生图提示词作者。给定中文财经竖屏短视频的其中一屏内容，写一句英文画面描述，12-22 个英文单词。' +
  '只画这一屏最具体的那件事/物，单一场景，主体居中、四周留白。' +
  '禁止写任何风格或画质词，也不要画图表、曲线、数字、K线，画面里不能出现文字、字母、数字。只输出这一句英文，不要引号，不要解释。';

function contextText(meta, extra) {
  const bits = [`标题：${meta.title || ''}`, `副标题：${meta.subtitle || ''}`];
  if (extra) bits.push('内容线索：' + String(extra).slice(0, 300));
  return bits.join('\n');
}

function fallbackPrompt(meta) {
  // 没配大模型时退回首绘素材表里挑出的主体，至少方向不会跑偏
  const subject = coverTheme(meta.title || '', meta.subtitle || '', meta.cover);
  return `Illustration for a short video titled "${meta.title}", main subject: ${subject}.`;
}

async function scenePrompt(meta, config, log, context) {
  if (!config || !config.baseUrl || !config.model || !config.apiKey) return fallbackPrompt(meta);
  try {
    const res = await chat(config, [
      { role: 'system', content: SYS },
      { role: 'user', content: contextText(meta, context) + '\n请写出英文画面描述。' },
    ], { json: false, temperature: 0.7 });
    const t = String(pickText(res) || '')
      .replace(/^[\s"'「『]+|[\s"'」』]+$/g, '')
      .replace(/\s+/g, ' ').trim();
    if (t.length >= 20 && t.length <= 600) return t;
    log('模型给出的提示词不可用，改用默认提示词');
  } catch (e) {
    log('写封面提示词失败，改用默认提示词：' + e.message);
  }
  return fallbackPrompt(meta);
}

function apiError(status, body) {
  let msg = body;
  try {
    const j = JSON.parse(body);
    msg = (j.error && (j.error.message || j.error.code)) || j.message || body;
  } catch { }
  const e = new Error(String(msg).slice(0, 200));
  e.status = status;
  e.retryAfter = Number((String(msg).match(/Retry after (\d+)s/i) || [])[1]) || 0;
  return e;
}

async function fetchImage(url, timeoutMs = 150000) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctl.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
    const ct = String(res.headers.get('content-type') || '').toLowerCase();
    if (!res.ok || !ct.includes('image')) {
      throw apiError(res.status, await res.text().catch(() => ''));
    }
    return { buf: Buffer.from(await res.arrayBuffer()), mime: ct.split(';')[0] };
  } finally {
    clearTimeout(timer);
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// 免费接口又限流又时不时报忙：按它给的 Retry after 等一会再试，实在不行才放弃
async function requestPollinations(prompt, w, h, log) {
  const seed = Math.floor(Math.random() * 1e9);
  // enhance=false：不让接口改写提示词，避免主体被带偏
  const url = FREE_API + encodeURIComponent(prompt) + `?width=${w}&height=${h}&nologo=true&seed=${seed}&enhance=false`;
  let lastErr, wait = 0;
  for (let i = 0; i < 6; i++) {
    if (wait) await sleep(wait);
    try {
      return await fetchImage(url);
    } catch (e) {
      lastErr = e;
      log('出图第 ' + (i + 1) + ' 次失败：' + e.message);
      const retryable = [402, 429, 500, 502, 503, 504].includes(e.status);
      if (!retryable) break;
      // 402 是每 IP 45 秒一张的硬限流，至少等够 45 秒
      const base = e.status === 402 ? 45 : (e.retryAfter || 15);
      wait = Math.min(70000, (base + 5) * 1000);
    }
  }
  throw new Error('免费出图接口没成功（' + (lastErr.status || '网络错误') + '）：' + lastErr.message);
}

async function postJson(url, body, headers, timeoutMs = 180000) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST', signal: ctl.signal,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) throw apiError(res.status, text);
    try { return JSON.parse(text); } catch { throw new Error('生图接口返回不是 JSON：' + text.slice(0, 200)); }
  } finally {
    clearTimeout(timer);
  }
}

// OpenAI 兼容的图片生成：优先 b64_json，兼容只返回 url 的服务
async function requestOpenAI(prompt, config, log) {
  const base = String(config.artBaseUrl || '').replace(/\/+$/, '');
  const model = String(config.artModel || '').trim();
  const key = String(config.artApiKey || '').trim();
  if (!base || !model) throw new Error('还没配置生图接口，请在「生图设置」里填接口地址和模型');
  const size = String(config.artSize || '1024x1024');
  const headers = key ? { Authorization: 'Bearer ' + key } : {};
  const run = async (extra) => postJson(base + '/images/generations', { model, prompt, n: 1, size, ...extra }, headers);
  let data;
  try {
    data = await run({ response_format: 'b64_json' });
  } catch (e) {
    // 有些兼容服务不接受 response_format
    if (e.status === 400 || e.status === 422) data = await run({});
    else throw e;
  }
  const item = (data.data || [])[0] || {};
  if (item.b64_json) return { buf: Buffer.from(item.b64_json, 'base64'), mime: 'image/png' };
  if (item.url) return fetchImage(item.url);
  if (data.url) return fetchImage(data.url);
  throw new Error('生图接口没有返回图片数据');
}

/* 按魔数认出图格式，渲染时内嵌成 data URI */
function mimeOf(buf) {
  if (buf.length > 3 && buf[0] === 0x89 && buf[1] === 0x50) return 'image/png';
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8) return 'image/jpeg';
  if (buf.length > 11 && buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP') return 'image/webp';
  return 'image/jpeg';
}

/* 主体描述放前面、风格放后面，实测这样出图才认得主体 */
function buildPrompt(scene) {
  return `${scene.trim()}${STYLE}`;
}

/* 本地把照片感的出图量化成扁平插画，让不同视频的封面风格统一 */
function findFfmpeg() {
  const which = process.env.FFMPEG || '';
  if (which && fs.existsSync(which)) return which;
  for (const d of ['/opt/homebrew/bin', '/usr/local/bin', '/usr/bin']) {
    const p = path.join(d, 'ffmpeg');
    if (fs.existsSync(p)) return p;
  }
  // 没装 ffmpeg 时找 imageio-ffmpeg 自带的二进制，找不到就跳过后处理
  const roots = [];
  try {
    roots.push(path.join(path.dirname(require.resolve('imageio_ffmpeg')), 'binaries'));
  } catch { }
  for (const base of ['/opt/homebrew/lib', '/usr/local/lib', '/usr/lib']) {
    try {
      for (const d of fs.readdirSync(base)) {
        if (d.startsWith('python')) roots.push(path.join(base, d, 'site-packages', 'imageio_ffmpeg', 'binaries'));
      }
    } catch { }
  }
  for (const r of roots) {
    try {
      for (const f of fs.readdirSync(r)) if (f.startsWith('ffmpeg-')) return path.join(r, f);
    } catch { }
  }
  return '';
}

function flattenImage(buf, tmpIn, tmpOut) {
  const ff = findFfmpeg();
  if (!ff) return null;
  fs.writeFileSync(tmpIn, buf);
  // 先轻微模糊再量化到 16 色，照片感会变成扁平插画感；量化后提亮一点饱和度补回颜色
  const graph = '[0:v]gblur=sigma=1.4,split[a][b];[a]palettegen=max_colors=16[p];[b][p]paletteuse=dither=bayer:bayer_scale=4,eq=saturation=1.35:brightness=0.02:contrast=1.05';
  try {
    require('child_process').execFileSync(ff, ['-y', '-loglevel', 'error', '-i', tmpIn, '-filter_complex', graph, tmpOut], { timeout: 60000 });
    return fs.readFileSync(tmpOut);
  } catch {
    return null;
  } finally {
    try { fs.unlinkSync(tmpIn); } catch { }
    try { fs.unlinkSync(tmpOut); } catch { }
  }
}

/* ---------------- AI 手绘 SVG ---------------- */

// 大模型写的 SVG 不能直接塞进页面：去掉脚本、外链、文字和外部引用，只留基础图形
function viewBoxSize(viewBox) {
  const n = String(viewBox || '').split(/[\s,]+/).map(Number);
  return { w: n[2] > 0 ? n[2] : 860, h: n[3] > 0 ? n[3] : 560 };
}

// 删掉整块画布大小的背景矩形：手绘插图不要底色，直接透出页面纸纹
function stripCanvasRects(inner, vbW, vbH) {
  return String(inner || '').replace(/<rect\b[^>]*\/?>/gi, tag => {
    const get = n => {
      const r = tag.match(new RegExp('\\s' + n + '\\s*=\\s*"([^"]*)"', 'i'));
      return r ? r[1].trim() : '';
    };
    const w = get('width'), h = get('height'), x = get('x'), y = get('y');
    const fullW = w === '100%' || (Number(w) > 0 && Number(w) >= vbW - 1);
    const fullH = h === '100%' || (Number(h) > 0 && Number(h) >= vbH - 1);
    const origin = (x === '' || Number(x) <= 1) && (y === '' || Number(y) <= 1);
    return fullW && fullH && origin ? '' : tag;
  });
}

// 已生成的历史 SVG 也可能带底色，渲染前再剥一次
function stripSvgBg(svg) {
  const s = String(svg || '');
  const m = s.match(/(<svg\b[^>]*>)([\s\S]*)(<\/svg>\s*)$/i);
  if (!m) return s;
  const vb = (m[1].match(/viewBox\s*=\s*"([^"]+)"/i) || [])[1] || '';
  const { w, h } = viewBoxSize(vb);
  return m[1] + stripCanvasRects(m[2], w, h) + m[3];
}

function sanitizeSvg(raw, opts = {}) {
  const viewBox = opts.viewBox || '0 0 860 560';
  const bg = opts.bg || 'none';
  let s = String(raw || '').replace(/```[a-z]*/gi, '').replace(/```/g, '');
  const i = s.search(/<svg[\s>]/i);
  const j = s.lastIndexOf('</svg>');
  if (i < 0 || j < i) return null;
  s = s.slice(i, j + 6);
  s = s
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<image\b[^>]*\/?>/gi, '')
    .replace(/<use\b[^>]*\/?>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<text[\s\S]*?<\/text>/gi, '')
    .replace(/<defs[\s\S]*?<\/defs>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s(?:id|class)\s*=\s*("[^"]*"|'[^']*')/gi, '')
    .replace(/\sstyle\s*=\s*("[^"]*"|'[^']*')/gi, '')
    .replace(/\s(?:href|xlink:href)\s*=\s*("[^"]*"|'[^']*')/gi, '');
  // defs 被删掉后不能再引用内部 id，统一改成无填充
  s = s.replace(/url\(\s*#[^)]*\)/gi, 'none');
  s = s.replace(/url\(\s*['"]?(?:https?:)?\/\/[^)]*\)/gi, 'none');
  const m = s.match(/^<svg\b([^>]*)>([\s\S]*)<\/svg>$/i);
  if (!m) return null;
  let attrs = m[1]
    .replace(/\s(?:width|height|preserveAspectRatio)\s*=\s*("[^"]*"|'[^']*')/gi, '')
    .replace(/\sxmlns:xlink\s*=\s*("[^"]*"|'[^']*')/gi, '');
  if (!/viewBox\s*=/.test(attrs)) attrs += ` viewBox="${viewBox}"`;
  if (!/xmlns\s*=/.test(attrs)) attrs += ' xmlns="http://www.w3.org/2000/svg"';
  const size = viewBoxSize(viewBox);
  const inner = stripCanvasRects(m[2], size.w, size.h);
  const shapes = (inner.match(/<(path|rect|circle|ellipse|line|polygon|polyline)\b/gi) || []).length;
  if (shapes < 5) return null;
  const bgRect = bg === 'none' ? '' : `<rect x="0" y="0" width="100%" height="100%" fill="${bg}"/>`;
  const body = bgRect + inner;
  const out = `<svg${attrs} width="100%" height="100%" preserveAspectRatio="xMidYMid slice">${body}</svg>`;
  return out.length > 180000 ? null : out;
}

function customPrompt(meta, opts) {
  const p = opts && opts.prompt != null ? opts.prompt : (meta.artPrompt || '');
  return String(p || '').trim().slice(0, 400);
}

// 每次随机换一个视角，避免同一类主题画出完全相同的构图
const COMPOSITIONS = [
  '正面特写，主体占据画面中央大部分',
  '三分之四侧视，主体偏左，右侧留白放一点环境暗示',
  '俯视视角，主体在下方，上方留白',
  '剪影式大侧面，主体横向贯穿画面',
  '近景局部（例如车轮、机柜一角、舷窗）加一条环境线',
  '对称构图，左右各一件相关物件',
];
function pickComposition() {
  return COMPOSITIONS[Math.floor(Math.random() * COMPOSITIONS.length)];
}

async function svgPrompt(meta, config, log, context, custom) {
  if (!config || !config.baseUrl || !config.model || !config.apiKey) {
    throw new Error('本地 AI 手绘需要配置大模型接口');
  }
  const user = [
    contextText(meta, context),
    custom ? '用户指定的画面：' + custom : '',
    '这次请用这种构图：' + pickComposition(),
    '请直接输出 SVG。',
  ].filter(Boolean).join('\n');
  const sys = SVG_SYS.replace('{{STYLE}}', styleRule(meta, config));
  let lastErr = '';
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await chat(config, [
        { role: 'system', content: sys },
        {
          role: 'user',
          content: attempt === 0 ? user
            : user + '\n上一次输出不是合法 SVG（' + lastErr + '）。请只输出一个完整的 <svg>…</svg>，不要任何解释。',
        },
      ], { json: false, temperature: attempt === 0 ? 0.9 : 0.5 });
      const svg = sanitizeSvg(pickText(res));
      if (svg) return svg;
      lastErr = '缺少可用的基础图形或标签不完整';
      log('AI 手绘第 ' + (attempt + 1) + ' 次输出不可用：' + lastErr);
    } catch (e) {
      lastErr = e.message;
      log('AI 手绘第 ' + (attempt + 1) + ' 次失败：' + e.message);
    }
  }
  throw new Error('AI 手绘画不出来：' + lastErr);
}

async function generateSvgCover(dir, meta, config, log, context, custom) {
  log('按标题 AI 手绘插画…');
  const svg = await svgPrompt(meta, config, log, context, custom);
  const out = path.join(dir, 'covers', 'art.svg');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, svg);
  // 换方式时清掉旧的位图，避免渲染时两张图同时存在
  try { fs.unlinkSync(path.join(dir, 'covers', 'art.img')); } catch { }
  log('AI 手绘插画已生成 ' + (svg.length / 1024).toFixed(0) + 'KB');
}

/* 生成封面插画，写入 job 目录 covers/art.svg 或 covers/art.img；返回画框尺寸 */
async function generateCoverArt(dir, meta, config, log = () => {}, opts = {}) {
  const provider = normalizeProvider(opts.provider || meta.artProvider || (config && config.artProvider));
  const box = artBox(meta.coverLayout);
  const context = opts.context || meta.artContext || '';
  const custom = customPrompt(meta, opts);

  if (provider === 'svg') {
    await generateSvgCover(dir, meta, config, log, context, custom);
    return box;
  }

  const scene = custom || await scenePrompt(meta, config, log, context);
  log('插画画面：' + scene);
  // 比画框多要 25% 画面，渲染时居中放大一档，正好把接口角标裁在画框外
  log(provider === 'openai' ? '调用第三方生图接口…' : '调用免费出图接口…');
  const prompt = buildPrompt(scene);
  const { buf } = provider === 'openai'
    ? await requestOpenAI(prompt, config, log)
    : await requestPollinations(prompt, Math.round(box.w * 1.25), Math.round(box.h * 1.25), log);
  const out = path.join(dir, 'covers', 'art.img');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const flat = flattenImage(buf, path.join(dir, 'covers', 'flat-in'), path.join(dir, 'covers', 'flat-out.png'));
  fs.writeFileSync(out, flat || buf);
  // 换 provider 时清掉旧的 SVG，避免渲染时两张图同时存在
  try { fs.unlinkSync(path.join(dir, 'covers', 'art.svg')); } catch { }
  log(`封面插画已生成 ${((flat || buf).length / 1024).toFixed(0)}KB`);
  return box;
}

/* 供渲染时把插画内嵌进 HTML，避免 file:// 页面再去读外部文件 */
function artDataUri(dir) {
  const p = path.join(dir, 'covers', 'art.img');
  let buf;
  try { buf = fs.readFileSync(p); } catch { return null; }
  return `data:${mimeOf(buf)};base64,${buf.toString('base64')}`;
}

function artSvg(dir) {
  try { return fs.readFileSync(path.join(dir, 'covers', 'art.svg'), 'utf8'); } catch { return null; }
}

/* ---------------- 分镜插图：每屏按内容生成 ---------------- */

// 这一屏出现的所有文字，作为画插图的依据
function sceneTextOf(scene) {
  const out = [scene.title, scene.sub];
  (scene.points || []).forEach(p => out.push(p && p.t, p && p.d));
  (scene.steps || []).forEach(x => out.push(x));
  (scene.bars || []).forEach(b => out.push(b && b.label, b && b.note));
  if (scene.line && Array.isArray(scene.line.labels)) scene.line.labels.forEach(x => out.push(x));
  (scene.stats || []).forEach(x => out.push(x && x.v, x && x.l));
  [scene.left, scene.right].forEach(col => {
    if (!col) return;
    out.push(col.title);
    (col.items || []).forEach(x => out.push(x));
  });
  (scene.notes || []).forEach(x => out.push(x));
  return out.filter(Boolean).join('；').slice(0, 400);
}

const SCENE_COMPS = [
  '主体居中，左右各留一点环境暗示',
  '主体偏右，左侧留白放一条环境线',
  '主体偏左，右侧留白放一条环境线',
  '两个相关物件左右呼应，中间用简单符号连接',
];

function sceneFrameText(scene) {
  return [
    '本屏标题：' + (scene.title || ''),
    scene.sub ? '副标题：' + scene.sub : '',
    '本屏文字线索：' + sceneTextOf(scene),
  ].filter(Boolean).join('\n');
}

async function sceneSvgPrompt(scene, meta, config, log) {
  if (!config || !config.baseUrl || !config.model || !config.apiKey) {
    throw new Error('每屏电脑手绘需要配置大模型接口');
  }
  const user = [
    '整条视频标题：' + (meta.title || ''),
    sceneFrameText(scene),
    '这次请用这种构图：' + SCENE_COMPS[Math.floor(Math.random() * SCENE_COMPS.length)],
    '请直接输出 SVG。',
  ].join('\n');
  const sys = SCENE_SVG_SYS.replace('{{STYLE}}', styleRule(meta, config));
  let lastErr = '';
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await chat(config, [
        { role: 'system', content: sys },
        {
          role: 'user',
          content: attempt === 0 ? user
            : user + '\n上一次输出不是合法 SVG（' + lastErr + '）。请只输出一个完整的 <svg>…</svg>，不要任何解释。',
        },
      ], { json: false, temperature: attempt === 0 ? 0.9 : 0.5 });
      const svg = sanitizeSvg(pickText(res), { viewBox: '0 0 860 380', bg: 'none' });
      if (svg) return svg;
      lastErr = '缺少可用的基础图形或标签不完整';
      log('本屏第 ' + (attempt + 1) + ' 次手绘不可用：' + lastErr);
    } catch (e) {
      lastErr = e.message;
      log('本屏第 ' + (attempt + 1) + ' 次手绘失败：' + e.message);
    }
  }
  throw new Error('画不出来：' + lastErr);
}

async function sceneApiPrompt(scene, config, log) {
  if (!config || !config.baseUrl || !config.model || !config.apiKey) {
    throw new Error('每屏生图需要配置大模型接口来写提示词');
  }
  try {
    const res = await chat(config, [
      { role: 'system', content: SYS_SCENE },
      { role: 'user', content: sceneFrameText(scene) + '\n请写出英文画面描述。' },
    ], { json: false, temperature: 0.7 });
    const t = String(pickText(res) || '')
      .replace(/^[\s"'「『]+|[\s"'」』]+$/g, '')
      .replace(/\s+/g, ' ').trim();
    if (t.length >= 20 && t.length <= 600) return t;
    log('本屏提示词不可用，用文字线索兜底');
  } catch (e) {
    log('本屏写提示词失败，用文字线索兜底：' + e.message);
  }
  return sceneTextOf(scene);
}

function scenePath(dir, idx, ext) {
  return path.join(dir, 'scenes', `s${idx}.${ext}`);
}

function sceneFile(dir, idx) {
  if (fs.existsSync(scenePath(dir, idx, 'svg'))) return 'svg';
  if (fs.existsSync(scenePath(dir, idx, 'img'))) return 'img';
  return '';
}

function sceneArtSvg(dir, idx) {
  try { return fs.readFileSync(scenePath(dir, idx, 'svg'), 'utf8'); } catch { return null; }
}

function sceneArtDataUri(dir, idx) {
  let buf;
  try { buf = fs.readFileSync(scenePath(dir, idx, 'img')); } catch { return null; }
  return `data:${mimeOf(buf)};base64,${buf.toString('base64')}`;
}

function manifestPath(dir) { return path.join(dir, 'scenes', 'manifest.json'); }

function readManifest(dir) {
  try {
    const m = JSON.parse(fs.readFileSync(manifestPath(dir), 'utf8'));
    return m && typeof m === 'object' ? m : {};
  } catch { return {}; }
}

function writeManifest(dir, m) {
  fs.mkdirSync(path.join(dir, 'scenes'), { recursive: true });
  fs.writeFileSync(manifestPath(dir), JSON.stringify(m, null, 2));
}

// 生成一屏插图；写完当前格式的文件就删掉另一种，避免渲染时选错
async function generateOneSceneArt(dir, scene, idx, meta, config, log, opts = {}) {
  const mode = normalizeSceneMode(opts.mode || meta.sceneArtMode || (config && config.sceneArtMode));
  fs.mkdirSync(path.join(dir, 'scenes'), { recursive: true });
  const svgPath = scenePath(dir, idx, 'svg');
  const imgPath = scenePath(dir, idx, 'img');

  if (mode === 'svg') {
    const svg = await sceneSvgPrompt(scene, meta, config, log);
    fs.writeFileSync(svgPath, svg);
    try { fs.unlinkSync(imgPath); } catch { }
    return { kind: 'svg' };
  }

  if (mode === 'api') {
    const provider = normalizeProvider(opts.provider || meta.artProvider || (config && config.artProvider));
    const p = provider === 'svg' ? 'pollinations' : provider;
    const desc = await sceneApiPrompt(scene, config, log);
    log('第 ' + idx + ' 屏画面：' + desc);
    const prompt = buildPrompt(desc);
    const { buf } = p === 'openai'
      ? await requestOpenAI(prompt, config, log)
      : await requestPollinations(prompt, Math.round(SCENE_BOX.w * 1.25), Math.round(SCENE_BOX.h * 1.25), log);
    const flat = flattenImage(buf, scenePath(dir, idx, 'flat-in'), scenePath(dir, idx, 'flat-out.png'));
    fs.writeFileSync(imgPath, flat || buf);
    try { fs.unlinkSync(svgPath); } catch { }
    return { kind: 'img' };
  }

  throw new Error('素材库模式不需要逐屏生成');
}

async function mapLimit(items, limit, fn) {
  let i = 0;
  const n = Math.min(limit, items.length);
  const workers = Array.from({ length: n }, async () => {
    while (i < items.length) {
      const k = i++;
      await fn(items[k], k);
    }
  });
  await Promise.all(workers);
}

/* 给全片每个分镜生成插图；单屏失败只回退这一屏，不影响整片 */
async function generateSceneArts(dir, board, config, log = () => {}, opts = {}) {
  const mode = normalizeSceneMode(opts.mode || (board.meta && board.meta.sceneArtMode) || (config && config.sceneArtMode));
  if (mode === 'library') return { mode, total: 0, done: 0, failed: 0, skipped: 0 };

  const targets = (board.scenes || [])
    .map((s, i) => ({ s, i }))
    .filter(x => x.s && x.s.kind !== 'cover' && x.s.kind !== 'end');
  if (!targets.length) return { mode, total: 0, done: 0, failed: 0, skipped: 0 };

  const provider = normalizeProvider(opts.provider || (board.meta && board.meta.artProvider) || (config && config.artProvider));
  log(`分镜插图：共 ${targets.length} 屏，方式「${SCENE_MODE_LABEL[mode]}」${mode === 'svg' ? '，每屏约几十秒' : ''}`);

  const manifest = readManifest(dir);
  if (manifest.mode !== mode || !manifest.done || typeof manifest.done !== 'object') manifest.done = {};
  manifest.mode = mode;

  let done = 0, failed = 0, skipped = 0, seq = 0;
  await mapLimit(targets, 2, async ({ s, i }) => {
    const no = ++seq;
    try {
      if (manifest.done[i] && sceneFile(dir, i)) {
        skipped++;
        log(`第 ${i} 屏插图已存在，跳过`);
      } else {
        await generateOneSceneArt(dir, s, i, board.meta, config, log, { mode, provider });
        manifest.done[i] = true;
        done++;
        log(`分镜插图 ${no}/${targets.length} 完成（第 ${i} 屏）`);
      }
    } catch (e) {
      failed++;
      log(`第 ${i} 屏插图失败，这一屏改用素材图：${e.message}`);
      delete manifest.done[i];
    }
    writeManifest(dir, manifest);
    if (opts.onProgress) opts.onProgress(done + failed + skipped, targets.length);
  });
  writeManifest(dir, manifest);
  log(`分镜插图完成：成功 ${done} 屏，跳过 ${skipped} 屏，失败 ${failed} 屏`);
  return { mode, total: targets.length, done, failed, skipped };
}

// 统计已生成的分镜插图数量，供前端展示
function sceneArtStat(dir, board) {
  let total = 0, done = 0;
  (board && board.scenes || []).forEach((s, i) => {
    if (!s || s.kind === 'cover' || s.kind === 'end') return;
    total++;
    if (sceneFile(dir, i)) done++;
  });
  return { total, done };
}

module.exports = {
  generateCoverArt, artDataUri, artSvg, artBox, STYLE,
  PROVIDERS, PROVIDER_LABEL, normalizeProvider,
  SCENE_MODES, SCENE_MODE_LABEL, normalizeSceneMode, SCENE_BOX,
  STYLES, STYLE_KEYS, STYLE_LABEL, normalizeStyle,
  generateSceneArts, sceneArtSvg, sceneArtDataUri, sceneArtStat, stripSvgBg,
};
