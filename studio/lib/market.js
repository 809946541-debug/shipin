'use strict';
/* 每日 A 股播报：从东方财富公开接口取当日行情，套固定模板生成分镜 */
const fs = require('fs');
const path = require('path');
const { CHARS_PER_SEC, GAP_PER_SCENE } = require('./prompt');

const HIST_FILE = path.join(__dirname, '../data/daily-history.json');

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const EM = 'https://push2.eastmoney.com/api/qt/';
const EMHIS = 'https://push2his.eastmoney.com/api/qt/';
const EMEX = 'https://push2ex.eastmoney.com/';
const CFFEX = 'http://www.cffex.com.cn/sj/ccpm/';

async function jget(url, timeout = 12000) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeout);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Referer: 'https://quote.eastmoney.com/' },
      signal: ctl.signal,
    });
    if (!res.ok) throw new Error('行情接口 ' + res.status);
    const text = await res.text();
    try { return JSON.parse(text); } catch { throw new Error('行情接口返回异常'); }
  } finally {
    clearTimeout(timer);
  }
}

async function jtext(url, headers = {}, timeout = 12000) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeout);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, ...headers }, signal: ctl.signal });
    if (!res.ok) throw new Error('接口 ' + res.status);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

/* 中金所每日持仓排名（IF 全部合约，前 20 名席位），取主力合约统计中信与其他机构多空单 */
async function fetchOrgPos(tradeDate) {
  const [y, m, d] = String(tradeDate).split('-');
  const xml = await jtext(`${CFFEX}${y}${m}/${d}/IF.xml?id=${Math.floor(Math.random() * 1000)}`,
    { Referer: 'http://www.cffex.com.cn/ccpm/' }, 12000);
  const blocks = xml.match(/<data\b[^>]*>[\s\S]*?<\/data>/g) || [];
  const tag = (b, t) => {
    const m = b.match(new RegExp(`<${t}>([^<]*)</${t}>`));
    return m ? m[1].trim() : '';
  };
  const rows = blocks.map(b => ({
    inst: tag(b, 'instrumentid'),
    dt: Number(tag(b, 'datatypeid')),
    name: tag(b, 'shortname'),
    vol: Number(tag(b, 'volume')) || 0,
    dv: Number(tag(b, 'varvolume')) || 0,
  }));
  if (!rows.length) return null;

  // 主力合约 = 多空持仓合计最大的那个，避免硬编码月份
  const byInst = new Map();
  for (const r of rows) {
    if (r.dt !== 1 && r.dt !== 2) continue;
    byInst.set(r.inst, (byInst.get(r.inst) || 0) + r.vol);
  }
  const main = [...byInst.entries()].sort((a, b) => b[1] - a[1])[0];
  if (!main) return null;
  const inst = main[0];

  const buy = rows.filter(r => r.inst === inst && r.dt === 1);
  const sell = rows.filter(r => r.inst === inst && r.dt === 2);
  if (!buy.length || !sell.length) return null;
  const sum = (a, k) => a.reduce((x, y) => x + (y[k] || 0), 0);
  const isZx = r => r.name.indexOf('中信期货') === 0;

  const totalBuy = sum(buy, 'vol');
  const totalSell = sum(sell, 'vol');
  const zxBuy = sum(buy.filter(isZx), 'vol');
  const zxSell = sum(sell.filter(isZx), 'vol');
  return {
    contract: inst,
    total: { buy: totalBuy, sell: totalSell, net: totalBuy - totalSell },
    zx: { buy: zxBuy, sell: zxSell, net: zxBuy - zxSell },
    other: {
      buy: totalBuy - zxBuy, sell: totalSell - zxSell,
      net: (totalBuy - zxBuy) - (totalSell - zxSell),
    },
    dNet: sum(buy, 'dv') - sum(sell, 'dv'),
  };
}

function bjNow() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const get = t => (parts.find(p => p.type === t) || {}).value;
  return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour')}:${get('minute')}` };
}

function toYi(v) { return Number(v) / 1e8; }
function fmtAmount(yi) {
  if (!isFinite(yi)) return '--';
  return yi >= 10000 ? (yi / 10000).toFixed(2) + ' 万亿' : Math.round(yi) + ' 亿';
}
function pctText(v) { return (v >= 0 ? '+' : '') + Number(v).toFixed(2) + '%'; }
// 涨红跌绿：给数字打上红/绿标记，交给模板上色
function toneOf(v) { return v > 0 ? 'up' : v < 0 ? 'down' : ''; }
function pctShort(v) { return (v >= 0 ? '+' : '') + Number(v).toFixed(1) + '%'; }
function fundText(v) {
  if (!isFinite(v) || !v) return '';
  const yi = toYi(v);
  return (yi >= 0 ? '净流入 ' : '净流出 ') + Math.abs(yi).toFixed(0) + ' 亿';
}
function netText(n) {
  const v = Number(n) || 0;
  if (!v) return '多空平衡';
  return (v > 0 ? '净多 ' : '净空 ') + Math.abs(v) + ' 手';
}
function dateLabel(d) {
  const [, m, day] = String(d).split('-');
  return `${Number(m)}月${Number(day)}日`;
}
/* 每日涨跌家数落盘，供「近 7 个交易日」对比使用：同一天重复获取只覆盖，不重复记 */
function loadHistory() {
  try { return JSON.parse(fs.readFileSync(HIST_FILE, 'utf8')); } catch { return {}; }
}
function loadHistoryList(upto) {
  const hist = loadHistory();
  return Object.keys(hist)
    .filter(d => (!upto || d <= upto) && (hist[d].up + hist[d].down) > 0)
    .sort().slice(-7).map(d => ({ date: d, ...hist[d] }));
}
function recordHistory(tradeDate, breadth) {
  const total = breadth.up + breadth.down + breadth.flat;
  if (!tradeDate || !total) return [];
  const hist = loadHistory();
  hist[tradeDate] = {
    up: breadth.up, down: breadth.down, flat: breadth.flat,
    ratio: Math.round((breadth.up / total) * 100),
  };
  try {
    fs.mkdirSync(path.dirname(HIST_FILE), { recursive: true });
    fs.writeFileSync(HIST_FILE, JSON.stringify(hist, null, 2));
  } catch { }
  return Object.keys(hist)
    .filter(d => (hist[d].up + hist[d].down) > 0)
    .sort().slice(-7).map(d => ({ date: d, ...hist[d] }));
}
// 自己逐只统计全市场涨跌家数：沪深京 A 股、剔除停牌，口径与同花顺/东财 App 大盘页一致
const ALL_A_FS = 'm:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23,m:0+t:81+s:2048';
async function fetchBreadthByCount() {
  const base = 'https://push2.eastmoney.com/api/qt/clist/get?po=1&np=1&fltt=2&invt=2&fid=f3&fields=f3&fs=' + encodeURIComponent(ALL_A_FS);
  const first = await jget(base + '&pn=1&pz=100');
  const total = Number(first.data && first.data.total) || 0;
  if (!total) throw new Error('全市场列表为空');
  const pages = Math.min(90, Math.ceil(total / 100));
  const lists = [(first.data && first.data.diff) || []];
  let next = 2;
  const worker = async () => {
    while (next <= pages) {
      const pn = next++;
      const r = await jget(base + `&pn=${pn}&pz=100`);
      lists.push((r.data && r.data.diff) || []);
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  const vals = [];
  let flat = 0;
  for (const row of lists) for (const x of row) {
    if (!x || x.f3 === '-' || x.f3 === null || x.f3 === undefined) continue; // 停牌/无行情剔除
    const v = Number(x.f3);
    if (!isFinite(v)) continue;
    if (v === 0) flat++; else vals.push(v);
  }
  if (!vals.length && !flat) throw new Error('抓不到个股涨跌幅');
  let up = 0, down = 0, gt5 = 0, lt5 = 0;
  for (const v of vals) { if (v > 0) up++; else down++; if (v >= 5) gt5++; if (v <= -5) lt5++; }
  const all = flat ? vals.concat(new Array(flat).fill(0)) : vals.slice();
  all.sort((a, b) => a - b);
  const median = all.length ? Number(all[Math.floor(all.length / 2)].toFixed(2)) : null;
  return { up, down, flat, gt5, lt5, median, total: all.length, source: 'count' };
}
function sumBuckets(fen) {
  let up = 0, down = 0, flat = 0, gt5 = 0, lt5 = 0;
  for (const [k, n] of Object.entries(fen || {})) {
    const key = Number(k);
    const v = Number(n) || 0;
    if (key > 0) up += v; else if (key < 0) down += v; else flat += v;
    if (key >= 6) gt5 += v;
    if (key <= -6) lt5 += v;
  }
  const median = medianBucket(fen);
  return { up, down, flat, gt5, lt5, median };
}
// 用涨跌分布桶估算个股涨跌幅中位数（桶宽约 1%，取桶中值；>10% 记 10、<-10% 记 -10）
function medianBucket(fen) {
  const rows = Object.entries(fen || {})
    .map(([k, n]) => ({ key: Number(k), n: Number(n) || 0 }))
    .sort((a, b) => a.key - b.key);
  const total = rows.reduce((a, x) => a + x.n, 0);
  if (!total) return null;
  let acc = 0;
  for (const r of rows) {
    acc += r.n;
    if (acc >= total / 2) {
      if (r.key >= 11) return 10;
      if (r.key <= -11) return -10;
      return r.key > 0 ? r.key - 0.5 : r.key < 0 ? r.key + 0.5 : 0;
    }
  }
  return null;
}

// 行情状态（五档）：普涨 / 偏强 / 分化 / 偏弱 / 普跌
// 有涨跌家数时以家数为主，指数只做辅助，避免「63% 股票上涨」被叫成普跌
function decideTrend(upRatio, avgPct, hasBreadth) {
  if (hasBreadth) {
    if (upRatio >= 0.75 && avgPct >= 0.5) return 'strong';
    if (upRatio >= 0.58 && avgPct >= 0) return 'up';
    if (upRatio <= 0.25 && avgPct <= -0.5) return 'weak';
    if (upRatio <= 0.42 && avgPct <= 0) return 'down';
    return 'mixed';
  }
  if (avgPct >= 1.2) return 'strong';
  if (avgPct >= 0.3) return 'up';
  if (avgPct <= -1.2) return 'weak';
  if (avgPct <= -0.3) return 'down';
  return 'mixed';
}
function trendLabel(t) {
  return t === 'strong' ? '普涨' : t === 'up' ? '偏强' : t === 'weak' ? '普跌' : t === 'down' ? '偏弱' : '分化';
}

async function fetchMarket(opts = {}) {
  const now = bjNow();

  const [klineSh, klineSz, indRes, breadthRes, fenbuRes, secUpRes, secDownRes, futRes, breadthCount] = await Promise.all([
    jget(EMHIS + 'stock/kline/get?secid=1.000001&klt=101&fqt=0&lmt=3&end=20500101&fields1=f1,f2,f3&fields2=f51,f53,f56,f57'),
    jget(EMHIS + 'stock/kline/get?secid=0.399001&klt=101&fqt=0&lmt=3&end=20500101&fields1=f1,f2,f3&fields2=f51,f53,f56,f57'),
    jget(EM + 'ulist.np/get?secids=1.000001,0.399001,0.399006,1.000688&fields=f2,f3,f4,f12,f14'),
    jget(EM + 'ulist.np/get?secids=1.000001,0.399001&fields=f14,f104,f105,f106'),
    jget(EMEX + 'getTopicZDFenBu?ut=7eea3edcaed734bea9cbfc24409ed989&dpt=wz.ztzt'),
    jget(EM + 'clist/get?pn=1&pz=3&po=1&np=1&fltt=2&invt=2&fid=f3&fs=m:90+t:2&fields=f3,f14,f62'),
    jget(EM + 'clist/get?pn=1&pz=3&po=0&np=1&fltt=2&invt=2&fid=f3&fs=m:90+t:2&fields=f3,f14'),
    jget(EM + 'clist/get?pn=1&pz=100&po=1&np=1&fltt=2&invt=2&fid=f12&fs=m:8&fields=f2,f3,f12,f14'),
    fetchBreadthByCount().catch(() => null),
  ]);

  const shK = (klineSh.data && klineSh.data.klines) || [];
  const szK = (klineSz.data && klineSz.data.klines) || [];
  if (shK.length < 2 || szK.length < 2) throw new Error('没有取到最近两个交易日的成交额');
  const parseK = line => { const a = String(line).split(','); return { date: a[0], amount: Number(a[3]) || 0 }; };
  const sh = shK.map(parseK);
  const sz = szK.map(parseK);
  const tradeDate = sh[sh.length - 1].date;
  // 选了非最新交易日 → 走「补发」路径
  const wantDate = String(opts.date || '').slice(0, 10);
  if (wantDate && wantDate !== tradeDate) return fetchHistoricalMarket(wantDate, now, opts);
  const amountByDate = {};
  for (const k of sh.concat(sz)) amountByDate[k.date] = (amountByDate[k.date] || 0) + k.amount;
  const dates = Object.keys(amountByDate).sort();
  const todayAmt = amountByDate[tradeDate] || 0;
  const prevDate = dates[dates.indexOf(tradeDate) - 1];
  const prevAmt = prevDate ? amountByDate[prevDate] : 0;
  if (!todayAmt) throw new Error('成交额为空');

  const inds = ((indRes.data && indRes.data.diff) || []).map(x => ({
    name: x.f14,
    price: Number(x.f2) / 100,
    pct: Number(x.f3) / 100,
    change: Number(x.f4) / 100,
  }));
  if (inds.length < 4) throw new Error('指数行情不完整');

  let fen = {};
  try {
    for (const item of (fenbuRes.data && fenbuRes.data.fenbu) || []) Object.assign(fen, item);
  } catch { }
  let breadth = breadthCount && (breadthCount.up || breadthCount.down) ? breadthCount : sumBuckets(fen);
  if (!breadth.up && !breadth.down) {
    const rows = (breadthRes.data && breadthRes.data.diff) || [];
    breadth = {
      up: rows.reduce((a, x) => a + (Number(x.f104) || 0), 0),
      down: rows.reduce((a, x) => a + (Number(x.f105) || 0), 0),
      flat: rows.reduce((a, x) => a + (Number(x.f106) || 0), 0),
      gt5: 0, lt5: 0,
    };
  }

  const codeDate = tradeDate.replace(/-/g, '');
  let limit = { zt: Number(fen['11']) || 0, dt: Number(fen['-11']) || 0, maxLb: 0 };
  try {
    const zt = await jget(EMEX + `getTopicZTPool?ut=7eea3edcaed734bea9cbfc24409ed989&dpt=wz.ztzt&Pageindex=0&pagesize=500&sort=fbt:asc&date=${codeDate}`);
    const pool = (zt.data && zt.data.pool) || [];
    limit.zt = Number(zt.data && zt.data.tc) || limit.zt;
    limit.maxLb = pool.reduce((a, p) => Math.max(a, Number(p.lbc) || 1), 0);
  } catch { }
  try {
    const dt = await jget(EMEX + `getTopicDTPool?ut=7eea3edcaed734bea9cbfc24409ed989&dpt=wz.ztzt&Pageindex=0&pagesize=100&sort=fund:asc&date=${codeDate}`);
    limit.dt = Number(dt.data && dt.data.tc) || 0;
  } catch { }

  const sectorsUp = ((secUpRes.data && secUpRes.data.diff) || []).map(x => ({
    name: x.f14, pct: Number(x.f3), fund: Number(x.f62) || 0,
  }));
  const sectorsDown = ((secDownRes.data && secDownRes.data.diff) || []).map(x => ({
    name: x.f14, pct: Number(x.f3), fund: 0,
  }));

  let fut = { ifText: '', imText: '', ifPrice: 0, imPrice: 0, ifBasis: 0, imBasis: 0 };
  try {
    const list = (futRes.data && futRes.data.diff) || [];
    const pick = code => list.find(x => x.f14 === code + '主力合约') || list.find(x => String(x.f14).startsWith(code));
    const IF = pick('IF');
    const IM = pick('IM');
    const spots = await jget(EM + 'ulist.np/get?secids=1.000300,1.000852&fields=f2,f12,f14');
    const spotRows = (spots.data && spots.data.diff) || [];
    const hs300 = Number((spotRows.find(x => x.f12 === '000300') || {}).f2) / 100;
    const zz1000 = Number((spotRows.find(x => x.f12 === '000852') || {}).f2) / 100;
    if (IF && IM && hs300 && zz1000) {
      fut.ifPrice = Number(IF.f2);
      fut.imPrice = Number(IM.f2);
      fut.ifBasis = fut.ifPrice - hs300;
      fut.imBasis = fut.imPrice - zz1000;
      fut.ifText = (fut.ifBasis >= 0 ? '升水 ' : '贴水 ') + Math.abs(fut.ifBasis).toFixed(0) + ' 点';
      fut.imText = (fut.imBasis >= 0 ? '升水 ' : '贴水 ') + Math.abs(fut.imBasis).toFixed(0) + ' 点';
    }
  } catch { }

  let orgs = null;
  try { orgs = await fetchOrgPos(tradeDate); } catch { }
  fut.orgs = orgs;

  const total = breadth.up + breadth.down + breadth.flat;
  const upRatio = total ? breadth.up / total : 0;
  const mood = upRatio >= 0.8 ? '偏热' : upRatio >= 0.6 ? '偏暖' : upRatio >= 0.4 ? '分化' : '偏冷';
  const avgPct = inds.reduce((a, x) => a + x.pct, 0) / inds.length;
  // 行情状态：普涨 / 分化 / 普跌，决定各屏文案侧重点（版式固定，内容分岔）
  // 有涨跌家数时以家数为主，指数只做辅助：63% 股票上涨但指数大跌 = 分化，不是普跌
  const trend = decideTrend(upRatio, avgPct, total > 0);
  const trendText = trendLabel(trend);
  const amtDiff = todayAmt - prevAmt;
  const amtPct = prevAmt ? (amtDiff / prevAmt) * 100 : 0;
  const intraday = tradeDate === now.date && now.time < '15:00';
  const upNames = sectorsUp.map(s => s.name).join('、') || '暂无';
  const downNames = sectorsDown.map(s => s.name).join('、') || '暂无';
  const lead = sectorsUp.slice().sort((a, b) => b.fund - a.fund)[0] || null;

  const view = {
    date: tradeDate,
    dateLabel: dateLabel(tradeDate),
    updatedAt: now.time,
    intraday,
    trend,
    trendText,
    indices: inds.map(x => ({
      name: x.name, price: x.price, pct: x.pct,
      priceText: x.price.toFixed(2), pctText: pctText(x.pct),
    })),
    amount: {
      todayYi: toYi(todayAmt), prevYi: toYi(prevAmt), diffYi: toYi(amtDiff), pct: amtPct,
      text: fmtAmount(toYi(todayAmt)),
      diffText: `${amtDiff >= 0 ? '放量' : '缩量'} ${Math.abs(Math.round(toYi(amtDiff)))} 亿`,
      pctText: (amtDiff >= 0 ? '+' : '') + amtPct.toFixed(1) + '%',
    },
    breadth: { ...breadth, upRatio },
    limit,
    mood,
    sectors: { up: sectorsUp, down: sectorsDown },
    futures: fut,
    focus: {
      effect: `上涨 ${breadth.up} 家、下跌 ${breadth.down} 家，涨超5% ${breadth.gt5} 家、跌超5% ${breadth.lt5} 家`,
      volume: '',
      mainline: `领涨 ${upNames}${lead && lead.fund ? `，${lead.name}${fundText(lead.fund)}` : ''}`,
      emotion: `涨停 ${limit.zt} 家、跌停 ${limit.dt} 家，最高 ${limit.maxLb || '--'} 连板，情绪${mood}`,
      risk: (trend === 'strong' || trend === 'up')
        ? `连板高度 ${limit.maxLb || '--'} 板、涨停 ${limit.zt} 家，情绪${mood}，注意高位股分化；看量能能否续上`
        : (trend === 'weak' || trend === 'down')
          ? `跌停 ${limit.dt} 家、上涨仅 ${breadth.up} 家，先看能否止跌；量能缩到地量才算企稳`
          : `涨跌分化、涨停 ${limit.zt} 家，盯主线能否接力；别追高位分歧`,
    },
    lines: [],
    summary: '',
  };
  view.focus.volume = `两市成交 ${view.amount.text}，较昨日${amtDiff >= 0 ? '放量' : '缩量'} ${Math.abs(Math.round(toYi(amtDiff)))} 亿`;
  view.history = recordHistory(tradeDate, breadth);

  view.summary = `${amtDiff >= 0 ? '放量' : '缩量'}${trendText}，${trend === 'mixed' ? '涨跌拉锯' : breadth.up >= breadth.down ? '多数股票上涨' : '多数股票下跌'}`;
  if (view.summary.length > 26) view.summary = view.summary.slice(0, 26);

  view.lines = [
    { label: '指数', text: inds.map(x => `${x.name.replace('指数', '')} ${x.price.toFixed(2)} ${pctText(x.pct)}`).join(' · ') },
    { label: '量能', text: `${view.amount.text}，较昨日${view.amount.diffText}（${view.amount.pctText}）` },
    { label: '涨跌', text: `上涨 ${breadth.up} / 下跌 ${breadth.down} / 平盘 ${breadth.flat}；涨超5% ${breadth.gt5} 家，跌超5% ${breadth.lt5} 家（沪深京A股，剔除停牌）` },
    { label: '情绪', text: view.focus.emotion },
    { label: '板块', text: `领涨 ${upNames}；领跌 ${downNames}` },
    { label: '机构', text: orgs
      ? `${orgs.contract} 中信 多单 ${orgs.zx.buy}/空单 ${orgs.zx.sell}（${netText(orgs.zx.net)}）；其他机构 多单 ${orgs.other.buy}/空单 ${orgs.other.sell}（${netText(orgs.other.net)}）；前20合计${netText(orgs.total.net)}，净空单较昨日${orgs.dNet >= 0 ? '减少' : '增加'} ${Math.abs(orgs.dNet)} 手（含套保，不代表单边看空）`
      : (fut.ifText ? `IF ${fut.ifText}、IM ${fut.imText}；持仓排名暂缺` : '机构持仓数据暂缺') },
    { label: '一句话', text: view.summary },
    { label: '关注点', text: `${view.focus.effect}；${view.focus.mainline}；${view.focus.risk}` },
  ];

  return view;
}

/* 补发历史交易日：指数和成交额走 K 线（真实），涨跌家数/涨停跌停接口没有历史，由前台手填 */
async function fetchHistoricalMarket(target, now, opts = {}) {
  const IDX = [['1.000001', '上证指数'], ['0.399001', '深证成指'], ['0.399006', '创业板指'], ['1.000688', '科创50']];
  const end = target.replace(/-/g, '');
  const res = await Promise.all(IDX.map(([secid]) => jget(EMHIS + `stock/kline/get?secid=${secid}&klt=101&fqt=0&lmt=8&end=${end}&fields1=f1,f2,f3&fields2=f51,f53,f57,f59`)));
  const bars = res.map(r => ((r.data && r.data.klines) || []).map(line => {
    const a = String(line).split(',');
    return { date: a[0], close: Number(a[1]), amount: Number(a[2]), pct: Number(a[3]) };
  }));
  const pos = bars[0].findIndex(x => x.date === target);
  if (pos < 0) throw new Error(`${dateLabel(target)} 没有行情数据，可能不是交易日`);
  const barOf = (k, d) => bars[k].find(x => x.date === d) || {};
  const indices = IDX.map(([, name], k) => {
    const x = barOf(k, target);
    return { name, price: x.close || 0, pct: x.pct || 0, priceText: (x.close || 0).toFixed(2), pctText: pctText(x.pct || 0) };
  });
  const amtOf = d => (barOf(0, d).amount || 0) + (barOf(1, d).amount || 0);
  const prevDay = bars[0][pos - 1] && bars[0][pos - 1].date;
  const todayAmt = amtOf(target);
  const prevAmt = prevDay ? amtOf(prevDay) : 0;
  if (!todayAmt) throw new Error('这一天的成交额为空，换一天再试');
  const amtDiff = todayAmt - prevAmt;
  const amtPct = prevAmt ? (amtDiff / prevAmt) * 100 : 0;

  const nz = v => (v === '' || v === undefined || v === null || !isFinite(Number(v)) ? 0 : Number(v));
  const saved = loadHistory()[target] || {};
  const breadth = {
    up: nz(opts.up ?? saved.up), down: nz(opts.down ?? saved.down), flat: nz(opts.flat),
    gt5: 0, lt5: 0, median: null,
  };
  const limit = { zt: nz(opts.zt), dt: nz(opts.dt), maxLb: nz(opts.maxLb) };
  // 涨停/跌停池支持按日期查历史，能自动取到就不用手填
  try {
    const zt = await jget(EMEX + `getTopicZTPool?ut=7eea3edcaed734bea9cbfc24409ed989&dpt=wz.ztzt&Pageindex=0&pagesize=500&sort=fbt:asc&date=${end}`);
    const pool = (zt.data && zt.data.pool) || [];
    const tc = Number(zt.data && zt.data.tc) || 0;
    if (tc) limit.zt = tc;
    const lb = pool.reduce((a, p) => Math.max(a, Number(p.lbc) || 1), 0);
    if (lb) limit.maxLb = lb;
  } catch { }
  try {
    const dt = await jget(EMEX + `getTopicDTPool?ut=7eea3edcaed734bea9cbfc24409ed989&dpt=wz.ztzt&Pageindex=0&pagesize=100&sort=fund:asc&date=${end}`);
    const tc = Number(dt.data && dt.data.tc) || 0;
    if (tc) limit.dt = tc;
  } catch { }
  const total = breadth.up + breadth.down + breadth.flat;
  const upRatio = total ? breadth.up / total : 0;
  const mood = upRatio >= 0.8 ? '偏热' : upRatio >= 0.6 ? '偏暖' : upRatio >= 0.4 ? '分化' : '偏冷';
  const avgPct = indices.reduce((a, x) => a + x.pct, 0) / indices.length;
  const trend = decideTrend(upRatio, avgPct, total > 0);
  const trendText = trendLabel(trend);

  let orgs = null;
  try { orgs = await fetchOrgPos(target); } catch { }

  const view = {
    date: target, dateLabel: dateLabel(target), updatedAt: now.time, intraday: false,
    historical: true, needsInput: !total, trend, trendText, indices,
    amount: {
      todayYi: toYi(todayAmt), prevYi: toYi(prevAmt), diffYi: toYi(amtDiff), pct: amtPct,
      text: fmtAmount(toYi(todayAmt)),
      diffText: `${amtDiff >= 0 ? '放量' : '缩量'} ${Math.abs(Math.round(toYi(amtDiff)))} 亿`,
      pctText: (amtDiff >= 0 ? '+' : '') + amtPct.toFixed(1) + '%',
    },
    breadth: { ...breadth, upRatio },
    limit, mood,
    sectors: { up: [], down: [] },
    futures: { ifText: '', imText: '', ifPrice: 0, imPrice: 0, ifBasis: 0, imBasis: 0, orgs },
    focus: {
      effect: total ? `上涨 ${breadth.up} 家、下跌 ${breadth.down} 家` : '',
      volume: '', mainline: '', emotion: '', risk: '',
    },
  };
  // 补发时只有你手填了家数才写进 7 天历史（自动取不到历史，手填的才是真数）
  const manualBreadth = opts.up !== undefined || opts.down !== undefined;
  view.history = manualBreadth && total ? recordHistory(target, breadth) : loadHistoryList(target);
  view.summary = `${amtDiff >= 0 ? '放量' : '缩量'}${trendText}，${trend === 'mixed' ? '涨跌拉锯' : breadth.up >= breadth.down ? '多数股票上涨' : '多数股票下跌'}`;
  if (view.summary.length > 26) view.summary = view.summary.slice(0, 26);

  view.lines = [
    { label: '指数', text: `上证 ${indices[0].priceText} ${indices[0].pctText} · 深成指 ${indices[1].pctText} · 创业板 ${indices[2].pctText} · 科创50 ${indices[3].pctText}` },
    { label: '量能', text: `${view.amount.text}，较昨日${view.amount.diffText}（${view.amount.pctText}）` },
    { label: '涨跌', text: total ? `上涨 ${breadth.up} / 下跌 ${breadth.down} / 平盘 ${breadth.flat}` : '该日接口不提供，需手填' },
    { label: '情绪', text: limit.zt || limit.dt ? `涨停 ${limit.zt} 家、跌停 ${limit.dt} 家` : '该日接口不提供，需手填' },
    { label: '板块', text: '历史板块数据暂缺，成片会自动省略这一屏' },
    { label: '机构', text: orgs ? `${orgs.contract} 中信 多单 ${orgs.zx.buy}/空单 ${orgs.zx.sell}；前20合计 ${netText(orgs.total.net)}` : '机构持仓数据暂缺' },
  ];
  return view;
}
function buildBoard(view) {
  const historical = !!view.historical;
  const idx = view.indices;
  const sh = idx[0], sz = idx[1], cy = idx[2], kc = idx[3];
  const b = view.breadth;
  const amt = view.amount;
  const lim = view.limit;
  const f = view.focus;
  const upSectors = view.sectors.up.map(s => `${s.name} ${pctShort(s.pct)}`);
  const downSectors = view.sectors.down.map(s => `${s.name} ${pctShort(s.pct)}`);
  const lead = view.sectors.up.slice().sort((a, b) => b.fund - a.fund)[0] || null;
  const leadFund = f.mainline;
  const leadFundShort = lead && lead.fund ? `${lead.name}${fundText(lead.fund)}` : '看板块能否延续';
  const amtShort = amt.todayYi >= 10000 ? (amt.todayYi / 10000).toFixed(1) + '万亿' : Math.round(amt.todayYi) + '亿';
  const moodTip = view.mood === '偏热' ? '情绪偏热，注意高位股波动' : view.mood === '偏冷' ? '情绪偏冷，控制节奏' : '情绪分化，重个股轻指数';
  const tr = view.trend || 'mixed';
  const trText = view.trendText || trendLabel(tr);
  const BULL = tr === 'strong' || tr === 'up';
  const BEAR = tr === 'weak' || tr === 'down';
  const upPct = Math.round((b.upRatio || 0) * 100);
  const downPct = 100 - upPct;
  const allUp = sh.pct >= 0 && sz.pct >= 0 && cy.pct >= 0 && kc.pct >= 0;
  const allDown = sh.pct < 0 && sz.pct < 0 && cy.pct < 0 && kc.pct < 0;
  const idxTail = allUp ? '四大指数全线走强' : allDown ? '四大指数全线走弱'
    : BULL ? '指数整体走强' : BEAR ? '指数整体承压' : '指数涨跌不一';
  // 指数不逐个念点位，只报强弱和一个代表，省时间；随后补全市场涨跌家数
  const idxList = [
    { n: '上证', pct: sh.pct },
    { n: '深成指', pct: sz.pct },
    { n: '创业板', pct: cy.pct },
    { n: '科创50', pct: kc.pct },
  ];
  const bestIdx = idxList.reduce((a, x) => (x.pct > a.pct ? x : a));
  const worstIdx = idxList.reduce((a, x) => (x.pct < a.pct ? x : a));
  const idxLead = allDown ? `${worstIdx.n}跌得最多` : allUp ? `${bestIdx.n}领涨` : `${bestIdx.n}相对较强`;
  // 指数均值 vs 个股中位数：指数看权重，个股看中位数，两者落差就是这屏要讲的「新增量」
  const med = typeof b.median === 'number' ? b.median : null;
  const idxAvg = (sh.pct + sz.pct + cy.pct + kc.pct) / 4;
  const idxAvgText = `${idxAvg >= 0 ? '+' : ''}${idxAvg.toFixed(2)}%`;
  const medText = med === null ? '' : `${med > 0 ? '+' : ''}${med.toFixed(1)}%`;
  const gapNarr = (() => {
    if (med === null) return `${idxTail}，${idxLead}。`;
    const a = Math.abs(idxAvg).toFixed(2);
    const m = Math.abs(med).toFixed(1);
    if (idxAvg > 0 && med > 0) return `四大指数平均涨${a}%，个股中位数涨约${m}%，${med > idxAvg + 0.4 ? '个股比指数更活跃' : '基本同步'}。`;
    if (idxAvg > 0 && med <= 0) return `四大指数平均涨${a}%，个股中位数却跌约${m}%，指数靠权重股撑着。`;
    if (idxAvg <= 0 && med > 0) return `四大指数平均跌${a}%，个股中位数反而涨约${m}%，小盘更抗跌。`;
    return `四大指数平均跌${a}%，个股中位数跌约${m}%，个股比指数更弱。`;
  })();
  const amtTail = BULL
    ? (amt.diffYi >= 0 ? '放量上涨，有增量资金参与。' : '缩量上涨，追高要留意分歧。')
    : BEAR
      ? (amt.diffYi >= 0 ? '放量下跌，说明抛压比较重。' : '缩量下跌，说明抛压有所减轻。')
      : (amt.diffYi >= 0 ? '放量，多空分歧在加大。' : '缩量，资金偏谨慎。');
  const breadthTail = `${b.up > b.down ? '多数股票上涨' : '下跌家数偏多'}，${tr === 'strong' ? '赚钱效应不错。' : tr === 'up' ? '赚钱效应尚可。' : tr === 'weak' ? '亏钱效应明显，操作难度不小。' : tr === 'down' ? '亏钱效应开始显现。' : '个股分化明显。'}`;
  const endSub = tr === 'strong' ? '明天看量能与涨停家数' : BEAR ? '明天看跌停家数与量能' : '明天看成交额与涨停家数';
  const amtDiffYi = Math.abs(Math.round(amt.diffYi));
  const amtDir = amt.diffYi >= 0 ? '放量' : '缩量';

  const hist = Array.isArray(view.history) ? view.history : [];
  const histLine = hist.length >= 3
    ? (() => {
      const ups = hist.map(x => x.up);
      const avg = Math.round(hist.reduce((a, x) => a + (Number(x.ratio) || 0), 0) / hist.length);
      return `近${hist.length}个交易日，上涨家数在${Math.min(...ups)}到${Math.max(...ups)}家之间，上涨占比平均${avg}%。`;
    })()
    : '';

  // 开场钩子：只说数据本身的「哪里不一样」，不做判断；涨跌家数句统一带「全市场」
  const prevHist = hist.length >= 2 ? hist.slice(0, -1) : [];
  const hook = (() => {
    if (hist.length >= 3 && BULL && b.up > Math.max(...prevHist.map(x => x.up))) {
      return `全市场上涨${b.up}家，近${hist.length}天最多。`;
    }
    if (hist.length >= 3 && BEAR && b.down > Math.max(...prevHist.map(x => x.down))) {
      return `全市场下跌${b.down}家，近${hist.length}天最多。`;
    }
    if (b.up > 0 && b.down > 0 && b.up >= b.down * 4) return `全市场上涨${b.up}家，下跌只有${b.down}家。`;
    if (b.up > 0 && b.down > 0 && b.down >= b.up * 4) return `全市场下跌${b.down}家，上涨只有${b.up}家。`;
    if (Math.abs(amt.pct || 0) >= 12) return `成交${amt.text}，较昨日${amtDir}${amtDiffYi}亿。`;
    return `全市场上涨${b.up}家，下跌${b.down}家。`;
  })();
  const hookBadge = (hook.match(/近\d+天最多/) || [''])[0];

  const coverTitle = `A股${view.dateLabel} · ${trText}`;
  const coverSub = `上涨${b.up}家 / 下跌${b.down}家，${amt.diffText}`;
  const meta = {
    title: coverTitle,
    subtitle: coverSub,
    kicker: '每日复盘 · 公开数据',
    cover: 'chart',
    coverLayout: Number(view.date.slice(-2)) % 3,
    disclaimer: '公开数据复盘，不构成投资建议',
    source: '东方财富公开行情',
    channel: '财经',
    boardConfirmed: true,
    skipCoverConfirm: true,
    sceneArtMode: 'library',
    artStyle: 'rough',
    coverSpec: {
      focus: 'wide',
      extras: [{ kind: 'chart', pos: 'rb' }],
      callouts: [
        { text: BEAR ? `${downPct}%股票下跌` : `${upPct}%股票上涨`, pos: 'left' },
        { text: sh.pctText, pos: 'right' },
      ],
    },
  };

  // 封面用数据大数字做主视觉（大号上涨/下跌家数 + 红绿占比条），比标题更抓人
  meta.dataHero = {
    kicker: `${view.dateLabel} · ${trText}`,
    up: b.up,
    down: b.down,
    upPct,
    downPct,
    amtText: amt.text,
    amtDiffText: amt.diffText,
    badge: hookBadge,
  };

  // 固定模式的章节直接用真实数据拼，标题带数字，不用大模型（避免编数字）
  meta.chapters = [
    { from: 0, title: `上涨${b.up}家，下跌${b.down}家`, desc: historical ? `${amt.diffText}，平盘 ${b.flat} 家` : `涨超5% ${b.gt5} 家，跌超5% ${b.lt5} 家，${amt.diffText}` },
    { from: 1, title: med === null ? '四大指数收盘表现' : '指数和个股，谁更强', desc: med === null ? `上证 ${sh.pctText}、深成指 ${sz.pctText}、创业板 ${cy.pctText}、科创50 ${kc.pctText}` : `指数均值 ${idxAvgText}，个股中位数约 ${medText}` },
    { from: 2, title: `成交${amtShort}，${amtDir}${amtDiffYi}亿`, desc: `昨日 ${fmtAmount(amt.prevYi)}，较昨日${amtDir} ${amtDiffYi} 亿（${amt.pctText}）` },
    { from: 4, title: `涨停${lim.zt}家，跌停${lim.dt}家`, desc: `最高 ${lim.maxLb || '--'} 连板，${moodTip}` },
    { from: 5, title: '领涨领跌前三与机构席位', desc: `领涨 ${upSectors.slice(0, 2).join('、') || '暂无'}；领跌 ${downSectors.slice(0, 2).join('、') || '暂无'}` },
    {
      from: 7,
      title: '明天看哪些数据',
      desc: tr === 'strong' ? '成交额能否续上、涨停家数会不会回落'
        : BEAR ? '跌停家数能否收敛、成交额是否缩到地量'
          : '成交额能否维持、涨停家数会不会回升',
    },
  ];
  // 补发历史日：板块屏会省略，章节顺带前移，并把机构屏单独成章
  if (historical) {
    meta.chapters = meta.chapters.map(c => {
      if (c.from === 5) return { from: 5, title: '机构持仓：中信 vs 其他机构', desc: view.futures.orgs ? `${view.futures.orgs.contract} 前20席位多空与净空变化` : '中金所持仓排名暂缺' };
      return c.from > 5 ? { ...c, from: c.from - 1 } : c;
    });
  }

  const scenes = [
    {
      kind: 'cover', kicker: '每日复盘', title: coverTitle, sub: coverSub,
      // 第一句固定「日期+A股复盘」，第二句马上报全市场涨跌家数（最震撼），数字和占比条同步动效
      narration: `${view.dateLabel}A股复盘，${hook}`,
      foot: `公开数据 · ${view.dateLabel}`,
    },
    {
      kind: 'stats', kicker: med === null ? '指数' : '指数 × 个股', title: med === null ? '四大指数' : '指数和个股，谁更强',
      sub: med === null ? '收盘表现' : '指数看权重股 · 个股看中位数',
      narration: gapNarr,
      stats: [
        { v: sh.pctText, l: `上证 ${sh.priceText}`, c: toneOf(sh.pct) },
        { v: sz.pctText, l: '深成指', c: toneOf(sz.pct) },
        { v: cy.pctText, l: '创业板指', c: toneOf(cy.pct) },
      ],
      notes: [`科创50 ${kc.pctText}`, med === null ? `上证收 ${sh.priceText} 点` : `全市场个股涨跌中位数 ${medText}`],
      foot: '收盘数据',
    },
    {
      kind: 'bars', kicker: '量能', title: '两市成交', sub: '今日对比昨日', unit: '亿元',
      narration: `再看成交量。两市成交${amt.text}，比昨天${amt.diffYi >= 0 ? '多了' : '少了'}${Math.abs(Math.round(amt.diffYi))}亿，${amt.diffYi >= 0 ? '放量' : '缩量'}${Math.abs(amt.pct).toFixed(1)}%。${amtTail}`,
      bars: [
        { label: '今日', value: Math.round(amt.todayYi), note: amt.text },
        { label: '昨日', value: Math.round(amt.prevYi), note: fmtAmount(amt.prevYi) },
      ],
      notes: [`较昨日${amt.diffText}`, `变化 ${amt.pctText}`],
      foot: '沪深两市合计',
    },
    {
      kind: 'stats', kicker: '涨跌', title: '个股涨跌', sub: '全市场分布',
      narration: historical
        ? `看全市场，上涨${b.up}家、下跌${b.down}家。${breadthTail}`
        : `看全市场，上涨${b.up}家、下跌${b.down}家，平盘${b.flat}家。涨超5%的${b.gt5}家，跌超5%的${b.lt5}家。${breadthTail}${histLine}`,
      stats: [
        { v: String(b.up), l: '上涨家数', c: 'up' },
        { v: String(b.down), l: '下跌家数', c: 'down' },
      ],
      history: !historical && hist.length >= 2
        ? hist.map(x => ({ date: String(x.date).slice(5), up: x.up, down: x.down }))
        : undefined,
      historyCaption: historical ? `平盘 ${b.flat} 家` : `涨超5% ${b.gt5} 家 · 跌超5% ${b.lt5} 家 · 平盘 ${b.flat} 家`,
      foot: '全市场统计',
    },
    {
      kind: 'stats', kicker: '情绪', title: '涨停跌停', sub: '短线情绪温度',
      narration: `情绪上，涨停${lim.zt}家，跌停${lim.dt}家，最高${lim.maxLb || '--'}连板。${moodTip}。`,
      stats: [
        { v: String(lim.zt), l: '涨停家数', c: 'up' },
        { v: String(lim.dt), l: '跌停家数', c: 'down' },
        { v: String(lim.maxLb || '--'), l: '最高连板' },
      ],
      notes: [moodTip],
      foot: '不含ST口径差异',
    },
    ...(historical ? [] : [{
      kind: 'compare', kicker: '板块', title: '领涨与领跌', sub: '行业板块前三',
      narration: `板块方面，领涨的是${upSectors.join('、') || '暂无'}；领跌的是${downSectors.join('、') || '暂无'}。${leadFund}。`,
      left: { title: '领涨板块', items: upSectors, win: true },
      right: { title: '领跌板块', items: downSectors },
      notes: [leadFund],
      foot: '行业板块 · 涨跌幅',
    }]),
    (() => {
      const o = view.futures.orgs;
      if (!o) {
        return {
          kind: 'bullets', kicker: '机构持仓', title: '机构持仓待更新', sub: '中金所排名未出',
          narration: view.futures.ifText
            ? `机构持仓排名还没更新，先看期指：IF主力${view.futures.ifText}，IM主力${view.futures.imText}。`
            : '机构持仓排名还没更新，收盘后可以在复盘里再看。',
          points: [
            { t: 'IF 主力', d: view.futures.ifText || '数据暂缺' },
            { t: 'IM 主力', d: view.futures.imText || '数据暂缺' },
            { t: '持仓排名', d: '中金所收盘后更新，稍后重试' },
          ],
          foot: '中金所每日持仓排名',
        };
      }
      const zxNet = netText(o.zx.net);
      const oNet = netText(o.other.net);
      const tNet = netText(o.total.net);
      const shortDir = o.dNet >= 0 ? '减少' : '增加';
      return {
        kind: 'bullets', kicker: '机构持仓', title: '中信 vs 其他机构', sub: `${o.contract} 前20席位`,
        narration: `再看机构持仓。${o.contract}前二十席位里，中信期货多单${o.zx.buy}手、空单${o.zx.sell}手，${zxNet}；其他机构多单${o.other.buy}手、空单${o.other.sell}手，${oNet}。前二十合计${tNet}，净空单比昨天${shortDir}${Math.abs(o.dNet)}手。这里含套保盘，不代表单边看空。`,
        points: [
          { t: '中信期货', d: `多单 ${o.zx.buy} 手 · 空单 ${o.zx.sell} 手（${zxNet}）` },
          { t: '其他机构', d: `多单 ${o.other.buy} 手 · 空单 ${o.other.sell} 手（${oNet}）` },
          { t: '前20合计', d: `多单 ${o.total.buy} 手 · 空单 ${o.total.sell} 手（${tNet}）` },
          { t: '净空单变化', d: `较昨日${shortDir} ${Math.abs(o.dNet)} 手（含套保，不代表单边看空）` },
        ],
        foot: `${o.contract} · 中金所每日持仓排名`,
      };
    })(),
    (() => {
      const firstSector = upSectors[0] || '';
      const hasUpSector = view.sectors.up[0] && view.sectors.up[0].pct > 0;
      if (BEAR) {
        return {
          kind: 'bullets', kicker: '看盘参考', title: tr === 'weak' ? '弱市里看什么' : '偏弱里看什么', sub: '先看止跌，再谈机会',
          narration: historical
            ? `最后说几句实在的。今天下跌${b.down}家，${tr === 'weak' ? '亏钱效应比较明显' : '亏钱效应开始显现'}。涨停${lim.zt}家、跌停${lim.dt}家。明天先看能不能止跌，盯跌停家数和成交额，成交缩得很小再谈企稳。`
            : `最后说几句实在的。今天下跌${b.down}家，跌超5%的${b.lt5}家，${tr === 'weak' ? '亏钱效应比较明显' : '亏钱效应开始显现'}。涨停${lim.zt}家、跌停${lim.dt}家。${hasUpSector ? `逆势的是${firstSector}` : '没有明显的抗跌方向'}。明天先看能不能止跌，盯跌停家数和成交额，成交缩得很小再谈企稳。`,
          points: [
            { t: '亏钱效应', d: `${downPct}%股票下跌${historical ? '' : `，跌超5% ${b.lt5} 家`}` },
            { t: '恐慌程度', d: `跌停 ${lim.dt} 家、涨停 ${lim.zt} 家，最高 ${lim.maxLb || '--'} 连板` },
            { t: '抗跌方向', d: historical ? '该日未收录板块数据' : hasUpSector ? `${firstSector} 逆势` : '暂无明确抗跌方向' },
            { t: '明天先看', d: '能否止跌，盯跌停家数与量能是否缩到地量' },
          ],
          foot: '公开数据复盘',
        };
      }
      if (BULL) {
        return {
          kind: 'bullets', kicker: '看盘参考', title: '明天看什么', sub: tr === 'strong' ? '普涨之后看分化' : '偏强之后看延续',
          narration: historical
            ? `最后说几句实在的。今天上涨${b.up}家，${tr === 'strong' ? '赚钱效应不错' : '赚钱效应尚可'}。涨停${lim.zt}家，最高${lim.maxLb || '--'}连板。明天重点看分化，盯高位股会不会炸板、成交额能不能续上。`
            : `最后说几句实在的。今天上涨${b.up}家，涨超5%的${b.gt5}家，${tr === 'strong' ? '赚钱效应不错' : '赚钱效应尚可'}。涨停${lim.zt}家，最高${lim.maxLb || '--'}连板。主线在${lead ? lead.name : '暂时还不明确'}。明天重点看分化，盯高位股会不会炸板、成交额能不能续上。`,
          points: [
            { t: '赚钱效应', d: `${upPct}%股票上涨${historical ? '' : `，涨超5% ${b.gt5} 家`}` },
            { t: '情绪温度', d: `涨停 ${lim.zt} 家、跌停 ${lim.dt} 家，最高 ${lim.maxLb || '--'} 连板` },
            { t: '主线与资金', d: historical ? '该日未收录板块数据' : leadFundShort },
            { t: '明天防什么', d: '普涨后看分化，盯高位股炸板和量能能否续上' },
          ],
          foot: '公开数据复盘',
        };
      }
      return {
        kind: 'bullets', kicker: '看盘参考', title: '明天看什么', sub: '分化行情抓主线',
        narration: historical
          ? `最后说几句实在的。今天上涨${b.up}家、下跌${b.down}家，涨跌分化。涨停${lim.zt}家、跌停${lim.dt}家。明天看主线能不能接力，别追高位分歧。`
          : `最后说几句实在的。今天上涨${b.up}家、下跌${b.down}家，涨跌分化。涨停${lim.zt}家、跌停${lim.dt}家。${leadFund}。明天看主线能不能接力，别追高位分歧。`,
        points: [
          { t: '赚钱效应', d: `${upPct}%上涨、${downPct}%下跌${historical ? '' : `，涨超5% ${b.gt5} 家`}` },
          { t: '情绪分化', d: `涨停 ${lim.zt} 家、跌停 ${lim.dt} 家，最高 ${lim.maxLb || '--'} 连板` },
          { t: '轮动主线', d: historical ? '该日未收录板块数据' : leadFundShort },
          { t: '明天看什么', d: '看主线能否接力，别追高位分歧' },
        ],
        foot: '公开数据复盘',
      };
    })(),
    {
      kind: 'end', kicker: '一句话', title: `量能${amtShort}，${view.mood}`, sub: endSub,
      narration: `一句话总结：${view.summary}。上证收在${sh.priceText}点，两市成交${amt.text}，涨停${lim.zt}家。${BULL ? '明天留意两个数据：成交额能不能续上、涨停家数会不会回落。' : BEAR ? '明天先看两个数据：跌停家数能不能收敛、成交额是不是缩得很小。' : '明天留意两个数据：成交额能不能维持、涨停家数会不会回升。'}以上为公开数据复盘，不构成投资建议。`,
      lines: [
        `上证 ${sh.pctText}，收 ${sh.priceText} 点。`,
        `两市成交 ${amt.text}，涨停 ${lim.zt} 家。`,
        '公开数据复盘，不构成投资建议。',
      ],
      foot: `数据来源：东方财富 · ${view.dateLabel}`,
    },
  ];

  const est = scenes.reduce((a, s) => a + String(s.narration || '').length / CHARS_PER_SEC + GAP_PER_SCENE, 0);
  const minutes = Math.max(2, Math.round(est / 60));
  return { meta, scenes, minutes, estimate: est };
}

async function buildDaily() {
  const view = await fetchMarket();
  const board = buildBoard(view);
  return { view, board };
}

module.exports = { buildDaily, fetchMarket, buildBoard };
