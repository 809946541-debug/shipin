'use strict';
// 分镜提示词与结果校验

const KINDS = ['cover', 'bullets', 'list', 'flow', 'compare', 'bars', 'line', 'stats', 'end'];
const COVER_ARTS = [
  'energy', 'chip', 'chart', 'policy', 'factory', 'cart', 'pill', 'house', 'car', 'people',
  'globe', 'port', 'ship', 'train', 'plane', 'truck', 'container', 'pipeline', 'oilrig',
  'battery', 'solar', 'wind', 'mine', 'wheat', 'water', 'bank', 'coin', 'scale', 'shield',
  'lock', 'clock', 'network', 'phone', 'satellite', 'dna', 'flask', 'store', 'bridge', 'leaf', 'idea',
  'rocket', 'speaker', 'datacenter', 'gpu', 'laptop', 'robot',
];
// 封面现场编排可用的小道具（与 template.js 的 coverProp 一一对应）
const COVER_PROPS = [
  'cloud', 'question', 'warn', 'check', 'pin', 'chart', 'arrowUp', 'arrowDown', 'flag', 'tag',
  'barrel', 'crate', 'coins', 'container', 'crowd', 'truck', 'ship', 'clock', 'pylon', 'doc', 'blockade',
];
const COVER_PROPS_TOP = ['cloud', 'question', 'warn', 'pin', 'chart', 'arrowUp', 'arrowDown', 'flag', 'tag'];
const COVER_PROPS_BOTTOM = ['barrel', 'crate', 'coins', 'container', 'crowd', 'truck', 'ship', 'clock', 'pylon', 'doc', 'blockade', 'warn', 'check', 'flag', 'tag'];
// 实测：YunjianNeural +12% 语速约 5.05 个汉字/秒
const CHARS_PER_SEC = 5.05;
const GAP_PER_SCENE = 1.3; // 句首 0.3s + 句尾 1.0s

function planScenes(minutes) {
  return Math.min(38, Math.max(16, Math.round(minutes * 5.5)));
}

const SYSTEM = `你是一名中文财经竖屏短视频的分镜编导。你把用户给出的主题，整理成一份可直接渲染的 JSON 分镜。

【硬性要求】
1. 只输出 JSON，不要解释、不要 markdown 代码块。
2. 内容必须客观：只做公开信息梳理与情景推演，不荐股、不喊单、不预测具体点位、不评价他国领导人、不描述暴力细节、不使用煽动性表述。
3. 数值只写你确定有公开来源的；不确定就改用定性表述。不要编造精确数字。
4. 最后一屏必须是 end 类型，stamp 固定为「不构成投资建议」。
5. 语言风格：口语、短句、克制，不用感叹号，不用“我们必须”“震惊”“内幕”等词。

【结构】
{"meta":{"title":"主标题，不超过 16 字","subtitle":"副标题，一句话，不超过 26 字","kicker":"手绘财经 · 情景推演 · 2026.11","cover":"封面插画，见下方清单","coverLayout":0,"disclaimer":"公开信息梳理 · 不构成投资建议","source":"数据来源说明，不超过 22 字"},"scenes":[...]}

cover 是封面配图。**先看标题里最具体的那件事物**，选“画出来最像这条视频”的那一个，不要一律选题材大类：
- 人物/发布会/CEO 相关（黄仁勋、马斯克、奥特曼、某创始人、某场演讲）→ speaker
- 火箭/星舰/发射/登月/太空 → rocket；卫星/北斗/航天器 → satellite
- 数据中心/机房/服务器/算力集群 → datacenter；显卡/GPU/英伟达 → gpu；端侧/PC/笔记本 → laptop
- 人形机器人/具身智能/机械臂 → robot；芯片/半导体/光刻 → chip
- 能源地缘 energy/oilrig/pipeline；航运物流 ship/port/container/train/plane/truck/globe
- 电池储能 battery/充电桩，光伏 solar，风电 wind
- 消费医药 pill/dna/store/cart；资产 house/bank/coin；政策监管 policy/scale/shield/lock
- 社会人口 people/clock；产业 factory/mine/wheat/water/bridge/leaf；行情报价 chart
- 同一选题族里，优先用更具体、更少见的那个（有 gpu 就不选 chip，有 datacenter 就不选 chip）；都不贴切才用 idea。
- 判断顺序：标题里出现的人名/物体名 > 副标题 > 选题大类。宁可画“那条视频里真实出现的东西”，也不要套一个泛泛的大类。

meta 里还要给出 coverSpec，让封面按这条视频的内容现场编排，而不是套固定模板：
{"focus":"auto|close|wide","extras":[{"kind":"道具","pos":"lt|rt|lb|rb"}],"callouts":[{"text":"不超过 8 字","pos":"left|right"}]}
- focus：close 主体特写、wide 留白大场景，拿不准写 auto。
- extras：0–3 个配角道具。上排 lt/rt 只能取 cloud/question/warn/pin/chart/arrowUp/arrowDown/flag/tag；
  下排 lb/rb 可取 barrel/crate/coins/container/crowd/truck/ship/clock/pylon/doc/blockade/warn/check/flag/tag。
  道具必须是这条视频里真实出现的元素（讲港口就配 container/crowd，讲停电就配 warn/pylon），不要随便堆。
- callouts：0–2 条手写批注，text 必须来自本视频里的真实数字或地名（如「+12%」「鹿特丹」「3.2 亿吨」），pos 选 left/right。

coverLayout 是封面版式，每期换一个，别总是同一套：
0 = 标题居中在上、插画在下；1 = 插画在上、标题居中在下；2 = 标题左对齐、插画在下。

scenes 第 1 屏固定 kind="cover"，最后一屏固定 kind="end"，中间每屏从下列类型中选最合适的一种：
- bullets：3–4 条并列要点 {points:[{"t":"要点，不超过 16 字","d":"说明，不超过 28 字"}]}
- list：4–5 条纵向清单，字段同上
- flow：3–4 步因果或流程 {steps:["不超过 8 字", ...]}
- compare：左右对比 {left:{"title":"不超过 10 字","items":["不超过 14 字","..."]},"right":{...},"notes":["..."]}
- bars：3–4 根柱状对比 {bars:[{"label":"不超过 8 字","value":数字,"note":"顶部显示的文本，如 29.7%"}],"unit":"%","notes":["..."]}
- line：3–6 个时间点走势 {line:{"labels":["2月","6月","9月"],"values":[70,118,83],"unit":"美元"},"notes":["..."]}
- stats：2–3 个关键数字 {stats:[{"v":"29.7%","l":"说明，不超过 12 字"}],"notes":["..."]}
- end：结论 {title:"不超过 12 字","sub":"不超过 24 字","lines":["第一句，不超过 30 字","第二句","第三句"]}

每屏都必带：
- "narration"：这一屏的旁白，一句完整口语，长度见用户要求，句末用句号。只描述画面对应的信息，不要念“如图所示”。
- "kicker"：短标签，2–6 字，如「第一层」「通道」「结论」。
- "foot"：数据口径或来源提示，不超过 18 字，如「公开数据整理 · 2026」。
- 非 cover 屏的 "title"：不超过 12 字；"sub"：不超过 24 字。

【每屏插画】
中间屏还可以再挂一张按这一屏内容画的小插画，避免整片都是文字框：
"art":{"subject":"插画主体","props":[{"kind":"道具","side":"l|r"}],"note":"不超过 8 字","notePos":"l|r"}
- subject：从封面那份 id 清单里选，必须贴合这一屏讲的东西；尽量不与本片封面、相邻屏重复。
- props：0–2 个点缀，同一侧只放一个。kind 只能取 cloud/question/warn/check/pin/chart/arrowUp/arrowDown/flag/tag/barrel/crate/coins/container/crowd/truck/ship/clock/pylon/doc/blockade。
- note：可选，写这一屏里出现的真实数字或地名；notePos 选 l 或 r，默认 l。大约一半的插画要带 note，别都省掉。
- 节奏：中间屏几乎每屏都要配一张（28 屏里 24–27 屏有图）。即使这一屏偏抽象，也要选一个最接近的主体，不要写 none；cover 屏和 end 屏不用写 art。

【画面匹配】
标题与图形要互补：有先后关系用 flow，有对立用 compare，有数量差距用 bars，有时间变化用 line，有 2–3 个关键数字用 stats，多要点用 bullets，条目多且需要解释用 list。
相邻两屏不要连续使用同一种图形类型（cover/end 除外）。`;

function buildUserPrompt(brief) {
  const minutes = Number(brief.minutes) || 5;
  const scenes = planScenes(minutes);
  const narrationChars = Math.round((minutes * 60 - scenes * GAP_PER_SCENE) / scenes * CHARS_PER_SEC / 5) * 5;
  return `请为下面这个选题做分镜。

标题：${brief.title}
一句话介绍：${brief.summary}
补充要求：${brief.requirements || '无'}
目标时长：约 ${minutes} 分钟
屏数：${scenes} 屏（含首尾）
每屏旁白字数：${Math.max(35, narrationChars - 6)}–${narrationChars + 4} 个汉字（这是配音时长匹配的关键，务必遵守）

输出 JSON。`;
}

function stripFence(text) {
  let t = String(text || '').trim();
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  const s = t.indexOf('{');
  const e = t.lastIndexOf('}');
  if (s >= 0 && e > s) t = t.slice(s, e + 1);
  return t;
}

const clean = (v, max = 200) => String(v == null ? '' : v)
  .replace(/[\r\n\t]+/g, ' ')
  .replace(/\*\*/g, '')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, max);

function sanitizeCoverSpec(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const spec = {};
  if (raw.focus === 'close' || raw.focus === 'wide') spec.focus = raw.focus;
  if (Array.isArray(raw.extras)) {
    const extras = raw.extras.slice(0, 3).map(e => {
      const kind = e && COVER_PROPS.includes(e.kind) ? e.kind : '';
      const pos = e && /^(lt|rt|lb|rb)$/.test(String(e.pos || '')) ? e.pos : '';
      if (!kind || !pos) return null;
      const pool = pos[1] === 't' ? COVER_PROPS_TOP : COVER_PROPS_BOTTOM;
      return pool.includes(kind) ? { kind, pos } : null;
    }).filter(Boolean);
    if (extras.length) spec.extras = extras;
  }
  if (Array.isArray(raw.callouts)) {
    const callouts = raw.callouts.slice(0, 2).map(c => {
      const text = clean(c && c.text, 16);
      if (!text) return null;
      return { text: text.slice(0, 10), pos: c.pos === 'right' ? 'right' : 'left' };
    }).filter(Boolean);
    if (callouts.length) spec.callouts = callouts;
  }
  return Object.keys(spec).length ? spec : null;
}

function sanitizeSceneArt(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (!COVER_ARTS.includes(raw.subject)) return null;
  const out = { subject: raw.subject };
  if (Array.isArray(raw.props)) {
    const props = raw.props.slice(0, 2).map(p => {
      if (!p || !COVER_PROPS.includes(p.kind)) return null;
      return { kind: p.kind, side: p.side === 'r' ? 'r' : 'l' };
    }).filter(Boolean);
    if (props.length) out.props = props;
  }
  const note = clean(raw.note, 20);
  if (note) {
    out.note = note.slice(0, 9);
    out.notePos = raw.notePos === 'r' ? 'r' : 'l';
  }
  return out;
}

function validate(raw) {
  const board = typeof raw === 'string' ? JSON.parse(stripFence(raw)) : raw;
  if (!board || !Array.isArray(board.scenes) || board.scenes.length < 8) {
    throw new Error('分镜数量不足或格式错误');
  }
  const meta = board.meta || {};
  board.meta = {
    title: clean(meta.title || '', 30) || '未命名选题',
    subtitle: clean(meta.subtitle || '', 40),
    kicker: clean(meta.kicker || '手绘财经 · 情景推演', 40),
    cover: COVER_ARTS.includes(meta.cover) ? meta.cover : '',
    disclaimer: clean(meta.disclaimer || '公开信息梳理 · 不构成投资建议', 40),
    source: clean(meta.source || '公开信息整理', 30),
  };
  const lay = Number(meta.coverLayout);
  if (lay === 0 || lay === 1 || lay === 2) board.meta.coverLayout = lay;
  if (meta.coverConfirmed) board.meta.coverConfirmed = true;
  const spec = sanitizeCoverSpec(meta.coverSpec);
  if (spec) board.meta.coverSpec = spec;

  const src = board.scenes.slice(0, 40);
  board.scenes = src.map((s, i) => {
    const kind = KINDS.includes(s.kind) ? s.kind : 'bullets';
    const out = { kind, kicker: clean(s.kicker, 12), narration: clean(s.narration, 300), foot: clean(s.foot, 30) };
    if (i === 0) out.kind = 'cover';
    if (i === src.length - 1) out.kind = 'end';
    out.title = clean(s.title, 30);
    out.sub = clean(s.sub, 40);
    const rawPts = Array.isArray(s.points) ? s.points
      : Array.isArray(s.items) ? s.items
        : Array.isArray(s.list) ? s.list
          : Array.isArray(s.rows) ? s.rows : null;
    if (rawPts) {
      out.points = rawPts.slice(0, 5).map(p => (typeof p === 'string'
        ? { t: clean(p, 30), d: '' }
        : { t: clean(p && (p.t || p.title || p.name), 30), d: clean(p && (p.d || p.desc || p.detail), 60) }))
        .filter(p => p.t);
    }
    if (Array.isArray(s.steps)) out.steps = s.steps.slice(0, 4).map(x => clean(x, 20));
    if (s.left) out.left = { title: clean(s.left.title || s.left.h, 24), items: (s.left.items || []).slice(0, 3).map(x => clean(x, 30)), win: !!s.left.win };
    if (s.right) out.right = { title: clean(s.right.title || s.right.h, 24), items: (s.right.items || []).slice(0, 3).map(x => clean(x, 30)), win: !!s.right.win };
    if (Array.isArray(s.bars)) out.bars = s.bars.slice(0, 4).map(b => ({ label: clean(b.label, 16), value: Number(b.value) || 0, note: clean(b.note || b.value, 16) }));
    if (s.line) out.line = { labels: (s.line.labels || []).slice(0, 6).map(x => clean(x, 12)), values: (s.line.values || []).slice(0, 6).map(v => Number(v) || 0), unit: clean(s.line.unit, 8) };
    if (Array.isArray(s.stats)) out.stats = s.stats.slice(0, 3).map(x => ({ v: clean(x.v, 12), l: clean(x.l, 24) }));
    if (Array.isArray(s.notes)) out.notes = s.notes.slice(0, 3).map(x => clean(x, 40));
    if (Array.isArray(s.lines)) out.lines = s.lines.slice(0, 3).map(x => clean(x, 60));
    const art = sanitizeSceneArt(s.art);
    if (art) out.art = art;
    out.unit = clean(s.unit, 10);
    out.stamp = clean(s.stamp, 20);
    if (!out.narration || out.narration.length < 12) throw new Error(`第 ${i + 1} 屏缺少旁白`);
    const need = {
      bullets: out.points, list: out.points, flow: out.steps, bars: out.bars,
      line: out.line && out.line.values, stats: out.stats,
      compare: out.left && out.right ? [1] : null,
    }[out.kind];
    if (out.kind !== 'cover' && out.kind !== 'end' && (!need || !need.length)) {
      throw new Error(`第 ${i + 1} 屏缺少 ${out.kind} 所需的内容字段`);
    }
    return out;
  });

  board.scenes[0].kind = 'cover';
  board.scenes[board.scenes.length - 1].kind = 'end';
  return board;
}

function durationEstimate(board) {
  return board.scenes.reduce((a, s) => a + s.narration.length / CHARS_PER_SEC + GAP_PER_SCENE, 0);
}

module.exports = { SYSTEM, buildUserPrompt, validate, planScenes, durationEstimate, stripFence, CHARS_PER_SEC, GAP_PER_SCENE };
