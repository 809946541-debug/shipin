'use strict';
// 分镜 JSON -> 手绘风竖屏 HTML（1080x1728 渲染区，编码时上下各补 96px 黑边）

const CSS = `
:root{--paper:#f4efe2;--ink:#2d2822;--ink2:#5c4e3d;--red:#b23a2a;--blue:#33506f;--sea:#2b6b85;--gold:#b08a3e;--hand:"Songti SC","STSong","Hiragino Sans GB","Noto Serif CJK SC","Source Han Serif SC","SimSun",serif;--num:"Baskerville","Songti SC","SimSun",serif}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1728px;overflow:hidden;background:var(--paper);font-family:var(--hand);color:var(--ink)}
body::after{content:"";position:fixed;inset:0;pointer-events:none;background:radial-gradient(circle at 18% 8%,rgba(90,60,20,.06),transparent 42%),radial-gradient(circle at 82% 92%,rgba(90,60,20,.05),transparent 40%),repeating-linear-gradient(0deg,rgba(80,60,30,.022) 0 1px,transparent 1px 5px);mix-blend-mode:multiply}
#stage{position:relative;width:1080px;height:1728px;overflow:hidden}
.scene{position:absolute;inset:0;visibility:hidden;opacity:0}
.scene.on{visibility:visible;opacity:1}
.art{position:absolute;inset:0;width:1080px;height:1920px;overflow:visible}
.f{opacity:0;animation:fade .85s cubic-bezier(.2,.7,.2,1) forwards;animation-delay:var(--d,0s)}
@keyframes fade{to{opacity:1}}
.rise{opacity:0;transform:translateY(18px);animation:rise .9s cubic-bezier(.2,.7,.2,1) forwards;animation-delay:var(--d,0s)}
@keyframes rise{to{opacity:1;transform:none}}
.draw{stroke-dasharray:2200;stroke-dashoffset:2200;opacity:0;animation:draw 2.4s ease-out forwards;animation-delay:var(--d,0s)}
@keyframes draw{0%{opacity:0}12%{opacity:1}100%{stroke-dashoffset:0;opacity:1}}
.grow{opacity:0;transform:scaleY(0);transform-origin:bottom;transform-box:fill-box;animation:grow 1s cubic-bezier(.2,.7,.2,1) forwards;animation-delay:var(--d,0s)}
@keyframes grow{to{opacity:1;transform:scaleY(1)}}
.render .f,.render .rise,.render .draw,.render .grow{animation-play-state:paused}
.k{position:absolute;left:104px;top:236px;font-size:27px;letter-spacing:.34em;color:var(--ink2)}
.h1{position:absolute;left:100px;top:292px;width:890px;font-size:84px;line-height:1.16;font-weight:700;letter-spacing:.01em}
.h2{position:absolute;left:104px;top:424px;width:870px;font-size:41px;line-height:1.5;color:var(--ink2)}
.body{position:absolute;left:104px;font-size:37px;line-height:1.78}
.s{font-size:30px;line-height:1.7;color:var(--ink2)}
.s[style^="top:"]{position:absolute;left:104px;width:872px}
.red{color:var(--red)}.blue{color:var(--blue)}.sea{color:var(--sea)}.gold{color:var(--gold)}.b{font-weight:700}
.num{font-family:var(--num);font-weight:700}
.foot{position:absolute;left:104px;bottom:24px;font-size:25px;letter-spacing:.08em;color:var(--ink2)}
.cover-tag{position:absolute;left:0;width:1080px;text-align:center;top:1500px;font-size:30px;letter-spacing:.12em}
.cover-title{text-wrap:balance}
.stamp{position:absolute;border:4px solid var(--red);border-radius:10px;color:var(--red);font-size:34px;font-weight:700;letter-spacing:.1em;padding:10px 18px;transform:rotate(-8deg);opacity:.85;background:rgba(255,255,255,.1)}
.pt{position:absolute;left:104px;width:872px;display:grid;grid-template-columns:70px 1fr;column-gap:18px}
.pt .n{width:56px;height:56px;border:3px solid var(--ink);border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--num);font-weight:700;font-size:26px}
.pt h3{font-size:37px;line-height:1.32;font-weight:700}
.pt p{font-size:27px;line-height:1.55;color:var(--ink2);margin-top:6px}
.dl{position:absolute;left:104px;width:872px}
.dl .row{padding:18px 0;border-bottom:2px solid rgba(45,40,34,.28)}
.dl .row:last-child{border-bottom:none}
.dl .t{font-size:34px;font-weight:700}
.dl .d{font-size:27px;color:var(--ink2);margin-top:5px;line-height:1.55}
.sc{position:absolute;border:3px solid var(--ink);border-radius:12px;background:rgba(255,255,255,.24);padding:20px 22px;height:168px;overflow:visible}
.sc .v{font-family:var(--num);font-weight:700;font-size:62px;line-height:1.1;white-space:nowrap}
.sc .l{font-size:26px;color:var(--ink2);margin-top:10px;line-height:1.45}
.cmp{position:absolute;top:620px;height:300px;border:3px solid var(--ink);border-radius:12px;background:rgba(255,255,255,.24);padding:20px 22px}
.cmp h3{font-size:35px;line-height:1.3;margin-bottom:14px}
.cmp ul{list-style:none}
.cmp li{font-size:27px;line-height:1.6;color:var(--ink2);padding-left:18px;position:relative}
.cmp li::before{content:"·";position:absolute;left:0;color:var(--red);font-weight:700}
.cmp.win{border-color:var(--red);border-width:4px}
.vs{position:absolute;left:0;width:1080px;text-align:center;top:735px;font-family:var(--num);font-weight:700;font-size:40px;color:var(--ink2)}
`;

const DEFS = `
<marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#2d2822"/></marker>
<marker id="ahr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#b23a2a"/></marker>
<marker id="ahs" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#2b6b85"/></marker>
<g id="tanker">
<path d="M0 40 L40 40 L58 12 L150 12 L168 40 L210 40 L210 58 L0 58 Z" fill="#f4efe2" stroke="#2d2822" stroke-width="4"/>
<rect x="60" y="22" width="26" height="14" fill="none" stroke="#2d2822" stroke-width="3"/>
<rect x="96" y="22" width="26" height="14" fill="none" stroke="#2d2822" stroke-width="3"/>
<path d="M0 66 Q14 58 28 66 T56 66" fill="none" stroke="#2b6b85" stroke-width="3" opacity=".6"/>
</g>
<g id="barrel">
<rect x="0" y="0" width="86" height="110" rx="10" fill="#f4efe2" stroke="#2d2822" stroke-width="4"/>
<line x1="8" y1="24" x2="78" y2="24" stroke="#2d2822" stroke-width="3"/>
<line x1="8" y1="86" x2="78" y2="86" stroke="#2d2822" stroke-width="3"/>
<text x="43" y="68" text-anchor="middle" font-size="26" fill="#5c4e3d" font-family="Baskerville,serif">OIL</text>
</g>
<g id="globe">
<circle cx="0" cy="0" r="120" fill="none" stroke="#2d2822" stroke-width="4"/>
<ellipse cx="0" cy="0" rx="60" ry="120" fill="none" stroke="#2d2822" stroke-width="3" opacity=".45"/>
<ellipse cx="0" cy="0" rx="110" ry="46" fill="none" stroke="#2d2822" stroke-width="3" opacity=".35"/>
</g>
<filter id="rough" x="-15%" y="-15%" width="130%" height="130%">
<feTurbulence type="fractalNoise" baseFrequency="0.014 0.021" numOctaves="2" seed="9" result="n"/>
<feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" xChannelSelector="R" yChannelSelector="G"/>
</filter>
<pattern id="hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(38)">
<line x1="0" y1="0" x2="0" y2="9" stroke="#3a3228" stroke-width="1.2"/>
</pattern>
`;

const SEEK = `
const BEATS=__BEATS__;
const TOTAL=BEATS.reduce((a,b)=>a+b.dur,0);
window.BEATS=BEATS;
const Q=new URLSearchParams(location.search);
const RENDER=Q.has('render'),ONLY=Q.get('scene');
const scenes=[...document.querySelectorAll('.scene')];
function show(i,local){
  scenes.forEach((s,k)=>s.classList.toggle('on',k===i));
  document.getAnimations().forEach(a=>{a.pause();a.currentTime=Math.max(0,local);});
}
window.__seek=(ms)=>{
  let acc=0,i=0,local=ms;
  for(;i<BEATS.length;i++){const d=BEATS[i].dur*1000;if(ms<acc+d){local=ms-acc;break;}acc+=d;}
  if(i>=BEATS.length){i=BEATS.length-1;local=BEATS[i].dur*1000-1;}
  show(i,local);
};
window.TOTAL=TOTAL;
window.__ready=false;
document.fonts.ready.then(()=>{
  if(RENDER)document.body.classList.add('render');
  if(ONLY){const k=Math.max(0,BEATS.findIndex(b=>b.id===ONLY));show(k,0);if(!RENDER)setTimeout(()=>document.getAnimations().forEach(a=>a.play()),40);}
  else if(RENDER){show(0,0);}
  else{let t0=performance.now();const tick=()=>{const ms=performance.now()-t0;window.__seek(ms%(TOTAL*1000));requestAnimationFrame(tick);};tick();}
  requestAnimationFrame(()=>window.__ready=true);
});
`;

const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

function units(str) {
  return [...String(str || '')].reduce((a, c) => a + (c.charCodeAt(0) > 127 ? 1 : 0.56), 0);
}

// 单行标题自适应字号，避免换行压到副标题
function titleFS(title, base = 84) {
  const u = Math.max(1, units(title));
  return Math.max(48, Math.min(base, Math.floor(884 / u)));
}

/* ---------- 封面：按题材选插画与版式，避免每条片子封面雷同 ---------- */
function hash(str) {
  let h = 2166136261;
  for (const ch of String(str)) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const COVER_THEMES = [
  { id: 'oilrig', re: /钻井|采油|油田|油气开采/ },
  { id: 'pipeline', re: /管道|输气|天然气管|输油/ },
  { id: 'energy', re: /油|能源|伊朗|中东|霍尔木兹|俄|乌|战争|冲突|制裁|海峡|天然气|地缘|军/ },
  { id: 'ship', re: /航运|海运|货轮|船|运价|运费|苏伊士|红海/ },
  { id: 'port', re: /港口|码头|吞吐|装卸|港区/ },
  { id: 'container', re: /集装箱|外贸|报关|跨境|出口订单/ },
  { id: 'train', re: /班列|铁路|高铁|轨交|中欧/ },
  { id: 'plane', re: /航空|飞机|机场|航班/ },
  { id: 'truck', re: /物流|卡车|货运|快递|冷链|配送/ },
  { id: 'chip', re: /芯片|算力|人工?智能|AI|半导体|大模型|GPU|数据中心|机器人|服务器|光刻|智能/ },
  { id: 'battery', re: /电池|储能|锂|充电桩|电芯/ },
  { id: 'solar', re: /光伏|太阳能|硅片|组件/ },
  { id: 'wind', re: /风电|风机|海上风电/ },
  { id: 'car', re: /汽车|新能源车|整车|车企|充电|智驾|车型/ },
  { id: 'dna', re: /基因|生物|细胞|创新药|疫苗|临床/ },
  { id: 'flask', re: /科研|实验|化工|材料|研发|实验室/ },
  { id: 'pill', re: /医药|药|医疗|器械|医院|健康/ },
  { id: 'house', re: /房|地产|楼|土地|物业|租|家居/ },
  { id: 'store', re: /门店|商超|连锁|便利|shopping|商场/ },
  { id: 'cart', re: /消费|零售|电商|购物|品牌|客单|渠道|直播带货/ },
  { id: 'wheat', re: /农业|粮食|小麦|玉米|大豆|种植|农产品/ },
  { id: 'mine', re: /矿|铜|铝|锂矿|稀土|煤炭|大宗|铁矿石/ },
  { id: 'water', re: /水|水利|洪|干旱|水资源/ },
  { id: 'bank', re: /银行|信贷|贷款|坏账|金融|保险/ },
  { id: 'coin', re: /汇率|人民币|美元|货币|外储|结汇/ },
  { id: 'scale', re: /监管|合规|反垄断|处罚|立法|听证/ },
  { id: 'shield', re: /安全|防御|防务|军费|网络攻击/ },
  { id: 'lock', re: /封锁|管制|禁令|限制出口|脱钩/ },
  { id: 'clock', re: /周期|时间表|倒计时|窗口期|节奏/ },
  { id: 'network', re: /互联网|平台|连接|网络|生态/ },
  { id: 'phone', re: /手机|移动|App|终端|用户/ },
  { id: 'satellite', re: /航天|卫星|火箭|太空|北斗/ },
  { id: 'people', re: /人口|就业|工资|社保|养老|教育|收入|劳动者|人才/ },
  { id: 'policy', re: /政策|改革|国资|国企|规划|法案|会议|央行|利率|关税|目标|制度|补贴/ },
  { id: 'factory', re: /工厂|制造|产能|投产|产线|订单|供应|扩产|基地/ },
  { id: 'bridge', re: /基建|桥梁|公路|投资|工程/ },
  { id: 'leaf', re: /碳|环保|绿色|减排|气候/ },
  { id: 'chart', re: /股|指数|市值|板块|行情|估值|财报|营收|利润|份额|价格|市场|基金|债|涨|跌/ },
  { id: 'globe', re: /全球|世界|出海|国际|贸易/ },
];

const COVER_LABEL = {
  energy: '能源地缘', chip: '芯片算力', chart: '行情财报', policy: '政策文件', idea: '抽象推演',
  factory: '工厂产线', cart: '购物袋', pill: '胶囊医疗', house: '房子', car: '汽车', people: '人群',
  globe: '地球航线', port: '港口吊机', ship: '货轮', train: '中欧班列', plane: '飞机', truck: '卡车',
  container: '集装箱', pipeline: '油气管道', oilrig: '海上钻井', battery: '电池储能', solar: '光伏太阳',
  wind: '风力发电机', mine: '矿山矿车', wheat: '麦穗', water: '水滴', bank: '银行建筑', coin: '汇率硬币',
  scale: '监管天平', shield: '安全盾牌', lock: '封锁锁具', clock: '周期时钟', network: '网络节点',
  phone: '手机终端', satellite: '卫星', dna: '双螺旋', flask: '实验瓶', store: '零售门店',
  bridge: '基建大桥', leaf: '双碳叶子',
};

const COVER_ACCENT = {
  energy: '#2b6b85', chip: '#33506f', chart: '#b23a2a', policy: '#b08a3e', idea: '#b23a2a',
  factory: '#b08a3e', cart: '#b23a2a', pill: '#2b6b85', house: '#b08a3e', car: '#33506f', people: '#b23a2a',
  globe: '#2b6b85', port: '#2b6b85', ship: '#2b6b85', train: '#b08a3e', plane: '#33506f', truck: '#b08a3e',
  container: '#b08a3e', pipeline: '#2b6b85', oilrig: '#2b6b85', battery: '#33506f', solar: '#b08a3e',
  wind: '#2b6b85', mine: '#b08a3e', wheat: '#b08a3e', water: '#2b6b85', bank: '#b08a3e', coin: '#b08a3e',
  scale: '#b08a3e', shield: '#33506f', lock: '#33506f', clock: '#b23a2a', network: '#33506f',
  phone: '#33506f', satellite: '#33506f', dna: '#2b6b85', flask: '#33506f', store: '#b23a2a',
  bridge: '#b08a3e', leaf: '#2b6b85',
};

const COVER_CLASS = {
  energy: 'sea', chip: 'blue', chart: 'red', policy: 'gold', idea: 'red',
  factory: 'gold', cart: 'red', pill: 'sea', house: 'gold', car: 'blue', people: 'red',
  globe: 'sea', port: 'sea', ship: 'sea', train: 'gold', plane: 'blue', truck: 'gold',
  container: 'gold', pipeline: 'sea', oilrig: 'sea', battery: 'blue', solar: 'gold',
  wind: 'sea', mine: 'gold', wheat: 'gold', water: 'sea', bank: 'gold', coin: 'gold',
  scale: 'gold', shield: 'blue', lock: 'blue', clock: 'red', network: 'blue',
  phone: 'blue', satellite: 'blue', dna: 'sea', flask: 'blue', store: 'red',
  bridge: 'gold', leaf: 'sea',
};

const COVER_KICKER = {
  energy: '手绘财经 · 地缘观察', chip: '手绘财经 · 产业拆解',
  chart: '手绘财经 · 数据复盘', policy: '手绘财经 · 政策解读', idea: '手绘财经 · 情景推演',
  factory: '手绘财经 · 产能观察', cart: '手绘财经 · 消费观察', pill: '手绘财经 · 医药观察',
  house: '手绘财经 · 资产观察', car: '手绘财经 · 产业观察', people: '手绘财经 · 社会观察',
  globe: '手绘财经 · 全球观察', port: '手绘财经 · 航运观察', ship: '手绘财经 · 航运观察',
  train: '手绘财经 · 物流观察', plane: '手绘财经 · 物流观察', truck: '手绘财经 · 物流观察',
  container: '手绘财经 · 外贸观察', pipeline: '手绘财经 · 能源观察', oilrig: '手绘财经 · 能源观察',
  battery: '手绘财经 · 储能观察', solar: '手绘财经 · 新能源观察', wind: '手绘财经 · 新能源观察',
  mine: '手绘财经 · 大宗观察', wheat: '手绘财经 · 农业观察', water: '手绘财经 · 资源观察',
  bank: '手绘财经 · 金融观察', coin: '手绘财经 · 汇率观察', scale: '手绘财经 · 监管观察',
  shield: '手绘财经 · 安全观察', lock: '手绘财经 · 管制观察', clock: '手绘财经 · 周期观察',
  network: '手绘财经 · 连接观察', phone: '手绘财经 · 科技观察', satellite: '手绘财经 · 航天观察',
  dna: '手绘财经 · 生物观察', flask: '手绘财经 · 科研观察', store: '手绘财经 · 零售观察',
  bridge: '手绘财经 · 基建观察', leaf: '手绘财经 · 双碳观察',
};

const COVER_ART_H = {
  chart: 350, energy: 400, chip: 420, policy: 430, idea: 400, factory: 430, cart: 380,
  pill: 400, house: 420, car: 380, people: 400, globe: 400, port: 380, ship: 360, train: 370,
  plane: 380, truck: 390, container: 400, pipeline: 380, oilrig: 390, battery: 400, solar: 430,
  wind: 400, mine: 380, wheat: 420, water: 420, bank: 400, coin: 400, scale: 400, shield: 440,
  lock: 440, clock: 400, network: 420, phone: 440, satellite: 420, dna: 380, flask: 410,
  store: 400, bridge: 400, leaf: 420,
};

const COVER_LAYOUT_NAME = ['居中 · 图在下', '居中 · 图在上', '左对齐 · 图在下'];
const COVER_ART_IDS = Object.keys(COVER_ACCENT);
const COVER_STYLES = COVER_ART_IDS.flatMap(id =>
  [0, 1, 2].map(layout => ({
    key: `${id}-${layout}`, motif: id, layout,
    label: COVER_LABEL[id] || id, layoutName: COVER_LAYOUT_NAME[layout],
  })));

function coverArtRaw(theme, top, accent, seed) {
  const n = i => (hash(seed + '#' + i) % 1000) / 1000;
  if (theme === 'chart') {
    const yb = top + 330;
    const bars = Array.from({ length: 6 }, (_, i) => ({ x: 208 + i * 108, h: 110 + Math.round(n(i) * 150) }));
    const trend = bars.map(b => `${b.x + 31},${yb - b.h - 34}`).join(' ');
    return bars.map((b, i) => `<rect x="${b.x}" y="${yb - b.h}" width="62" height="${b.h}" fill="none" stroke="#2d2822" stroke-width="4" class="grow" style="--d:${(0.45 + i * 0.1).toFixed(2)}s"/>`).join('') +
      `<line x1="176" y1="${yb}" x2="920" y2="${yb}" stroke="#2d2822" stroke-width="4" class="f" style="--d:.35s"/>
<polyline points="${trend}" fill="none" stroke="${accent}" stroke-width="5" stroke-dasharray="10 8" class="draw" style="--d:.9s"/>`;
  }
  if (theme === 'energy') {
    return `<path d="M300 ${top + 50} Q540 ${top - 40} 780 ${top + 50}" fill="none" stroke="${accent}" stroke-width="4" stroke-dasharray="9 11" class="draw" style="--d:.5s"/>
<circle cx="300" cy="${top + 50}" r="9" fill="${accent}" class="f" style="--d:.95s"/>
<circle cx="780" cy="${top + 50}" r="9" fill="${accent}" class="f" style="--d:.95s"/>
<g class="f" style="--d:.3s" transform="translate(540,${top + 190}) scale(1.15)"><use href="#globe"/></g>
<g class="f" style="--d:.9s" transform="translate(236,${top + 312}) scale(.85)"><use href="#tanker"/></g>
<g class="f" style="--d:1.05s" transform="translate(706,${top + 300}) scale(.7)"><use href="#barrel"/></g>`;
  }
  if (theme === 'chip') {
    const cx = 540, cy = top + 180, s = 150;
    let pins = '';
    for (let i = 0; i < 5; i++) {
      const p = cx - s + 46 + i * 52;
      const q = cy - s + 46 + i * 52;
      pins += `<line x1="${p}" y1="${cy - s}" x2="${p}" y2="${cy - s - 30}" stroke="#2d2822" stroke-width="4"/>
<line x1="${p}" y1="${cy + s}" x2="${p}" y2="${cy + s + 30}" stroke="#2d2822" stroke-width="4"/>
<line x1="${cx - s}" y1="${q}" x2="${cx - s - 30}" y2="${q}" stroke="#2d2822" stroke-width="4"/>
<line x1="${cx + s}" y1="${q}" x2="${cx + s + 30}" y2="${q}" stroke="#2d2822" stroke-width="4"/>`;
    }
    let inner = '';
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      inner += `<rect x="${cx - 66 + c * 46}" y="${cy - 66 + r * 46}" width="30" height="30" fill="none" stroke="#2d2822" stroke-width="3" opacity=".55"/>`;
    }
    return `<rect x="${cx - s}" y="${cy - s}" width="${s * 2}" height="${s * 2}" rx="20" fill="none" stroke="#2d2822" stroke-width="5" class="f" style="--d:.35s"/>${pins}${inner}
<path d="M${cx + s + 30} ${cy + 30} H${cx + s + 96} V${cy + 120}" fill="none" stroke="${accent}" stroke-width="4" class="draw" style="--d:1s"/>
<circle cx="${cx + s + 96}" cy="${cy + 120}" r="9" fill="${accent}" class="f" style="--d:1.4s"/>`;
  }
  if (theme === 'policy') {
    return `<rect x="392" y="${top + 20}" width="300" height="400" fill="none" stroke="#2d2822" stroke-width="5" class="f" style="--d:.35s"/>
<path d="M632 ${top + 20} L692 ${top + 80} L632 ${top + 80} Z" fill="none" stroke="#2d2822" stroke-width="4" class="f" style="--d:.5s"/>
${[0, 1, 2, 3].map(i => `<line x1="424" y1="${top + 110 + i * 62}" x2="${660 - (i === 3 ? 90 : 0)}" y2="${top + 110 + i * 62}" stroke="#5c4e3d" stroke-width="4" opacity=".7" class="f" style="--d:${(0.55 + i * 0.1).toFixed(2)}s"/>`).join('')}
<circle cx="700" cy="${top + 330}" r="58" fill="none" stroke="${accent}" stroke-width="5" class="f" style="--d:1.1s"/>
<text x="700" y="${top + 344}" text-anchor="middle" font-size="38" fill="${accent}" font-family="Songti SC,SimSun,serif" class="f" style="--d:1.3s">政</text>
<path d="M196 ${top + 380} H196 V${top + 150}" fill="none" stroke="${accent}" stroke-width="4" stroke-dasharray="9 9" class="draw" style="--d:.9s"/>
<path d="M180 ${top + 176} L196 ${top + 144} L212 ${top + 176}" fill="none" stroke="${accent}" stroke-width="4" class="f" style="--d:1.35s"/>`;
  }
  if (theme === 'globe') {
    return `<g class="f" style="--d:.35s" transform="translate(540,${top + 200}) scale(1.16)"><use href="#globe"/></g>
<path d="M196 ${top + 120} Q330 ${top + 40} 470 ${top + 110}" fill="none" stroke="${accent}" stroke-width="4" stroke-dasharray="10 10" class="draw" style="--d:.8s"/>
<path d="M610 ${top + 300} Q760 ${top + 370} 892 ${top + 290}" fill="none" stroke="${accent}" stroke-width="4" stroke-dasharray="10 10" class="draw" style="--d:.9s"/>
<circle cx="196" cy="${top + 120}" r="8" fill="${accent}" class="f" style="--d:1.15s"/>
<circle cx="892" cy="${top + 290}" r="8" fill="${accent}" class="f" style="--d:1.25s"/>`;
  }
  if (theme === 'port') {
    const b = top + 330;
    return `<line x1="150" y1="${b}" x2="930" y2="${b}" stroke="#2d2822" stroke-width="4" class="f" style="--d:.3s"/>
<path d="M286 ${b} V${b - 300} H636" fill="none" stroke="#2d2822" stroke-width="5" class="f" style="--d:.45s"/>
<line x1="286" y1="${b - 258}" x2="386" y2="${b - 258}" stroke="#2d2822" stroke-width="3" opacity=".5" class="f" style="--d:.6s"/>
<line x1="520" y1="${b - 300}" x2="520" y2="${b - 196}" stroke="#2d2822" stroke-width="3" class="f" style="--d:.7s"/>
<rect x="462" y="${b - 196}" width="116" height="62" fill="none" stroke="#2d2822" stroke-width="4" class="f" style="--d:.85s"/>
<rect x="636" y="${b - 120}" width="130" height="120" fill="none" stroke="#2d2822" stroke-width="4" class="f" style="--d:.9s"/>
<rect x="766" y="${b - 120}" width="120" height="120" fill="none" stroke="#2d2822" stroke-width="4" class="f" style="--d:.95s"/>
<rect x="700" y="${b - 212}" width="120" height="92" fill="none" stroke="#2d2822" stroke-width="4" class="f" style="--d:1.05s"/>
<line x1="196" y1="${b + 46}" x2="360" y2="${b + 46}" stroke="${accent}" stroke-width="4" stroke-dasharray="8 8" class="draw" style="--d:1.1s"/>`;
  }
  if (theme === 'ship') {
    return `<g class="f" style="--d:.35s" transform="translate(540,${top + 196}) scale(2.05) translate(-105,-33)"><use href="#tanker"/></g>
<path d="M150 ${top + 300} Q210 ${top + 282} 270 ${top + 300} T390 ${top + 300}" fill="none" stroke="${accent}" stroke-width="4" stroke-linecap="round" class="f" style="--d:.9s"/>
<path d="M470 ${top + 330} Q530 ${top + 312} 590 ${top + 330} T710 ${top + 330}" fill="none" stroke="${accent}" stroke-width="4" stroke-linecap="round" class="f" style="--d:1s"/>
<path d="M760 ${top + 300} Q820 ${top + 282} 880 ${top + 300}" fill="none" stroke="${accent}" stroke-width="4" stroke-linecap="round" class="f" style="--d:1.1s"/>
<line x1="300" y1="${top + 250}" x2="180" y2="${top + 250}" stroke="#2d2822" stroke-width="3" stroke-dasharray="12 10" opacity=".4" class="f" style="--d:.7s"/>`;
  }
  if (theme === 'train') {
    const b = top + 330;
    let rail = `<line x1="150" y1="${b}" x2="930" y2="${b}" stroke="#2d2822" stroke-width="4" class="f" style="--d:.3s"/>
<line x1="150" y1="${b + 22}" x2="930" y2="${b + 22}" stroke="#2d2822" stroke-width="4" class="f" style="--d:.35s"/>`;
    for (let i = 0; i < 11; i++) rail += `<line x1="${180 + i * 68}" y1="${b}" x2="${180 + i * 68}" y2="${b + 22}" stroke="#2d2822" stroke-width="3" opacity=".5" class="f" style="--d:.4s"/>`;
    return rail + `<path d="M250 ${b} V${b - 120} H392 V${b - 152} H460 V${b}" fill="none" stroke="#2d2822" stroke-width="5" class="f" style="--d:.55s"/>
<rect x="274" y="${b - 104}" width="96" height="54" fill="none" stroke="#2d2822" stroke-width="3" class="f" style="--d:.7s"/>
<rect x="484" y="${b - 152}" width="190" height="152" fill="none" stroke="#2d2822" stroke-width="4" class="f" style="--d:.8s"/>
<rect x="694" y="${b - 152}" width="170" height="152" fill="none" stroke="#2d2822" stroke-width="4" class="f" style="--d:.9s"/>
${[300, 370, 520, 600, 660, 740, 820].map(x => `<circle cx="${x}" cy="${b + 2}" r="16" fill="none" stroke="#2d2822" stroke-width="3"/>`).join('')}
<line x1="700" y1="${b - 120}" x2="856" y2="${b - 120}" stroke="${accent}" stroke-width="3" opacity=".6" class="f" style="--d:1.05s"/>
<line x1="700" y1="${b - 84}" x2="856" y2="${b - 84}" stroke="${accent}" stroke-width="3" opacity=".6" class="f" style="--d:1.1s"/>`;
  }
  if (theme === 'plane') {
    return `<g class="f" style="--d:.35s" transform="translate(540,${top + 200}) scale(1.04) rotate(-12)">
<path d="M-236 0 Q-196 -48 -6 -48 L206 -48 Q250 -42 262 2 L206 36 L-176 36 Q-220 32 -236 0 Z" fill="none" stroke="#2d2822" stroke-width="5"/>
<path d="M-20 36 L-118 142 L-26 142 L74 36 Z" fill="none" stroke="#2d2822" stroke-width="5"/>
<path d="M74 -48 L30 -142 L104 -142 L168 -48" fill="none" stroke="#2d2822" stroke-width="5"/>
<circle cx="252" cy="-4" r="9" fill="${accent}"/>
<circle cx="214" cy="-4" r="9" fill="${accent}"/>
</g>
<path d="M150 ${top + 330} Q420 ${top + 360} 700 ${top + 60}" fill="none" stroke="${accent}" stroke-width="4" stroke-dasharray="12 12" class="draw" style="--d:.9s"/>
<circle cx="700" cy="${top + 60}" r="7" fill="${accent}" class="f" style="--d:1.3s"/>`;
  }
  if (theme === 'truck') {
    const b = top + 290;
    return `<rect x="236" y="${b - 160}" width="380" height="160" fill="none" stroke="#2d2822" stroke-width="5" class="f" style="--d:.35s"/>
<path d="M616 ${b} V${b - 132} H756 L816 ${b - 74} V${b} Z" fill="none" stroke="#2d2822" stroke-width="5" class="f" style="--d:.5s"/>
<rect x="648" y="${b - 112}" width="100" height="52" fill="none" stroke="#2d2822" stroke-width="3" class="f" style="--d:.65s"/>
<circle cx="330" cy="${b + 6}" r="34" fill="none" stroke="#2d2822" stroke-width="5" class="f" style="--d:.7s"/>
<circle cx="452" cy="${b + 6}" r="34" fill="none" stroke="#2d2822" stroke-width="5" class="f" style="--d:.7s"/>
<circle cx="742" cy="${b + 6}" r="34" fill="none" stroke="#2d2822" stroke-width="5" class="f" style="--d:.7s"/>
<line x1="150" y1="${b + 84}" x2="930" y2="${b + 84}" stroke="${accent}" stroke-width="4" stroke-dasharray="16 14" class="draw" style="--d:.9s"/>
<line x1="180" y1="${b - 160}" x2="180" y2="${b - 60}" stroke="${accent}" stroke-width="4" stroke-dasharray="8 8" class="f" style="--d:1.1s"/>`;
  }
  if (theme === 'container') {
    const b = top + 340;
    const box = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#2d2822" stroke-width="4" class="f" style="--d:.75s"/>
${[0, 1, 2, 3].map(i => `<line x1="${x + w * (i + 1) / 5}" y1="${y + 6}" x2="${x + w * (i + 1) / 5}" y2="${y + h - 6}" stroke="#2d2822" stroke-width="3" opacity=".45"/>`).join('')}`;
    return `<line x1="640" y1="${top + 20}" x2="900" y2="${top + 20}" stroke="#2d2822" stroke-width="5" class="f" style="--d:.3s"/>
<line x1="760" y1="${top + 20}" x2="760" y2="${top + 96}" stroke="#2d2822" stroke-width="3" class="f" style="--d:.45s"/>
<rect x="716" y="${top + 96}" width="88" height="46" fill="none" stroke="${accent}" stroke-width="4" class="f" style="--d:.6s"/>
${box(300, b - 110, 290, 110)}
${box(320, b - 220, 290, 110)}
${box(340, b - 330, 290, 110)}
${box(640, b - 110, 220, 110)}
<line x1="250" y1="${b}" x2="930" y2="${b}" stroke="#2d2822" stroke-width="4" class="f" style="--d:.35s"/>`;
  }
  if (theme === 'pipeline') {
    return `<line x1="170" y1="${top + 150}" x2="430" y2="${top + 150}" stroke="#2d2822" stroke-width="26" stroke-linecap="round" class="f" style="--d:.35s"/>
<line x1="170" y1="${top + 150}" x2="430" y2="${top + 150}" stroke="#f4efe2" stroke-width="14" stroke-linecap="round" class="f" style="--d:.4s"/>
<circle cx="492" cy="${top + 150}" r="52" fill="none" stroke="#2d2822" stroke-width="5" class="f" style="--d:.55s"/>
<line x1="492" y1="${top + 84}" x2="492" y2="${top + 216}" stroke="#2d2822" stroke-width="5" class="f" style="--d:.7s"/>
<line x1="438" y1="${top + 150}" x2="546" y2="${top + 150}" stroke="#2d2822" stroke-width="5" class="f" style="--d:.7s"/>
<line x1="554" y1="${top + 150}" x2="910" y2="${top + 150}" stroke="#2d2822" stroke-width="26" stroke-linecap="round" class="f" style="--d:.85s"/>
<line x1="554" y1="${top + 150}" x2="910" y2="${top + 150}" stroke="#f4efe2" stroke-width="14" stroke-linecap="round" class="f" style="--d:.9s"/>
<path d="M492 ${top + 216} V${top + 300} H860" fill="none" stroke="#2d2822" stroke-width="20" stroke-linecap="round" class="f" style="--d:1s"/>
<path d="M492 ${top + 216} V${top + 300} H860" fill="none" stroke="#f4efe2" stroke-width="10" stroke-linecap="round" class="f" style="--d:1.05s"/>
<path d="M700 ${top + 300} l40 0 m-14 -14 l14 14 l-14 14" fill="none" stroke="${accent}" stroke-width="4" class="f" style="--d:1.2s"/>`;
  }
  if (theme === 'oilrig') {
    const b = top + 300;
    return `<path d="M150 ${b} Q210 ${b - 18} 270 ${b} T390 ${b} T510 ${b} T630 ${b} T750 ${b} T870 ${b} T930 ${b}" fill="none" stroke="${accent}" stroke-width="4" class="f" style="--d:.3s"/>
<line x1="380" y1="${b}" x2="410" y2="${b - 150}" stroke="#2d2822" stroke-width="5" class="f" style="--d:.45s"/>
<line x1="700" y1="${b}" x2="670" y2="${b - 150}" stroke="#2d2822" stroke-width="5" class="f" style="--d:.45s"/>
<line x1="420" y1="${b}" x2="440" y2="${b - 150}" stroke="#2d2822" stroke-width="4" opacity=".6" class="f" style="--d:.5s"/>
<line x1="660" y1="${b}" x2="640" y2="${b - 150}" stroke="#2d2822" stroke-width="4" opacity=".6" class="f" style="--d:.5s"/>
<rect x="360" y="${b - 186}" width="360" height="36" fill="none" stroke="#2d2822" stroke-width="5" class="f" style="--d:.6s"/>
<path d="M470 ${b - 186} L540 ${b - 336} L610 ${b - 186}" fill="none" stroke="#2d2822" stroke-width="4" class="f" style="--d:.7s"/>
<line x1="505" y1="${b - 260}" x2="575" y2="${b - 260}" stroke="#2d2822" stroke-width="3" class="f" style="--d:.8s"/>
<line x1="490" y1="${b - 222}" x2="590" y2="${b - 222}" stroke="#2d2822" stroke-width="3" class="f" style="--d:.85s"/>
<circle cx="540" cy="${b - 344}" r="10" fill="${accent}" class="f" style="--d:1s"/>
<circle cx="780" cy="${b - 30}" r="7" fill="${accent}" class="f" style="--d:1.1s"/>`;
  }
  if (theme === 'battery') {
    return `<rect x="368" y="${top + 130}" width="330" height="212" rx="16" fill="none" stroke="#2d2822" stroke-width="5" class="f" style="--d:.35s"/>
<rect x="698" y="${top + 196}" width="34" height="80" rx="8" fill="none" stroke="#2d2822" stroke-width="5" class="f" style="--d:.45s"/>
<rect x="404" y="${top + 168}" width="72" height="136" fill="none" stroke="${accent}" stroke-width="4" class="f" style="--d:.55s"/>
<rect x="496" y="${top + 168}" width="72" height="136" fill="none" stroke="${accent}" stroke-width="4" class="f" style="--d:.65s"/>
<rect x="588" y="${top + 168}" width="72" height="136" fill="none" stroke="#2d2822" stroke-width="4" opacity=".35" class="f" style="--d:.75s"/>
<path d="M548 ${top + 40} L488 ${top + 168} H548 L508 ${top + 250}" fill="none" stroke="${accent}" stroke-width="6" stroke-linejoin="round" class="f" style="--d:.95s"/>`;
  }
  if (theme === 'solar') {
    const sun = `<circle cx="796" cy="${top + 78}" r="46" fill="none" stroke="${accent}" stroke-width="5" class="f" style="--d:.3s"/>`;
    let rays = '';
    for (let i = 0; i < 8; i++) {
      const a = Math.PI * 2 * i / 8;
      rays += `<line x1="${796 + Math.cos(a) * 62}" y1="${top + 78 + Math.sin(a) * 62}" x2="${796 + Math.cos(a) * 88}" y2="${top + 78 + Math.sin(a) * 88}" stroke="${accent}" stroke-width="4" class="f" style="--d:.45s"/>`;
    }
    return sun + rays + `<path d="M236 ${top + 300} L604 ${top + 300} L648 ${top + 400} L280 ${top + 400} Z" fill="none" stroke="#2d2822" stroke-width="5" class="f" style="--d:.55s"/>
<line x1="266" y1="${top + 350}" x2="628" y2="${top + 350}" stroke="#2d2822" stroke-width="3" opacity=".5" class="f" style="--d:.7s"/>
<line x1="418" y1="${top + 300}" x2="462" y2="${top + 400}" stroke="#2d2822" stroke-width="3" opacity=".5" class="f" style="--d:.75s"/>
<line x1="464" y1="${top + 400}" x2="464" y2="${top + 430}" stroke="${accent}" stroke-width="5" class="f" style="--d:1s"/>`;
  }
  if (theme === 'wind') {
    const b = top + 360;
    const one = (x, s) => {
      const hubY = b - 250 * s;
      let blades = '';
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + i * Math.PI * 2 / 3;
        blades += `<line x1="${x}" y1="${hubY}" x2="${x + Math.cos(a) * 130 * s}" y2="${hubY + Math.sin(a) * 130 * s}" stroke="#2d2822" stroke-width="4" class="f" style="--d:.75s"/>`;
      }
      return `<line x1="${x}" y1="${b}" x2="${x}" y2="${hubY}" stroke="#2d2822" stroke-width="5" class="f" style="--d:.5s"/>
<circle cx="${x}" cy="${hubY}" r="9" fill="${accent}" class="f" style="--d:.7s"/>${blades}`;
    };
    return `<line x1="140" y1="${b}" x2="940" y2="${b}" stroke="#2d2822" stroke-width="4" class="f" style="--d:.3s"/>
${one(300, .72)}${one(540, 1)}${one(796, .8)}
<path d="M170 ${top + 150} q40 -16 80 0 t80 0" fill="none" stroke="${accent}" stroke-width="4" stroke-dasharray="10 9" class="draw" style="--d:1s"/>
<path d="M700 ${top + 120} q40 -16 80 0" fill="none" stroke="${accent}" stroke-width="4" stroke-dasharray="10 9" class="draw" style="--d:1.1s"/>`;
  }
  if (theme === 'mine') {
    const b = top + 340;
    return `<path d="M190 ${b} L400 ${top + 110} L620 ${b}" fill="none" stroke="#2d2822" stroke-width="5" class="f" style="--d:.35s"/>
<path d="M330 ${b} V${b - 70} H470 V${b}" fill="none" stroke="#2d2822" stroke-width="4" class="f" style="--d:.55s"/>
<line x1="150" y1="${b}" x2="930" y2="${b}" stroke="#2d2822" stroke-width="4" class="f" style="--d:.3s"/>
<line x1="700" y1="${b - 10}" x2="900" y2="${b - 10}" stroke="#2d2822" stroke-width="3" class="f" style="--d:.7s"/>
<rect x="700" y="${b - 96}" width="132" height="66" fill="none" stroke="#2d2822" stroke-width="4" class="f" style="--d:.8s"/>
<path d="M700 ${b - 96} L732 ${b - 130} H840 L864 ${b - 96}" fill="none" stroke="#2d2822" stroke-width="4" class="f" style="--d:.9s"/>
<circle cx="740" cy="${b + 6}" r="20" fill="none" stroke="#2d2822" stroke-width="4" class="f" style="--d:1s"/>
<circle cx="800" cy="${b + 6}" r="20" fill="none" stroke="#2d2822" stroke-width="4" class="f" style="--d:1s"/>
<circle cx="376" cy="${top + 250}" r="10" fill="${accent}" class="f" style="--d:1.1s"/>
<circle cx="436" cy="${top + 300}" r="8" fill="${accent}" class="f" style="--d:1.2s"/>`;
  }
  if (theme === 'wheat') {
    const b = top + 360;
    const stalk = (x, h, tilt) => {
      let g = `<path d="M${x} ${b} Q${x + tilt} ${b - h * .6} ${x + tilt * 1.6} ${b - h}" fill="none" stroke="#2d2822" stroke-width="4" class="f" style="--d:.5s"/>`;
      for (let i = 0; i < 4; i++) {
        const y = b - h + i * h * .16;
        g += `<ellipse cx="${x + tilt * 1.6 - 15}" cy="${y}" rx="8" ry="17" fill="none" stroke="${accent}" stroke-width="3" class="f" style="--d:${(0.7 + i * .07).toFixed(2)}s" transform="rotate(-18 ${x + tilt * 1.6 - 15} ${y})"/>
<ellipse cx="${x + tilt * 1.6 + 15}" cy="${y + 10}" rx="8" ry="17" fill="none" stroke="${accent}" stroke-width="3" class="f" style="--d:${(0.74 + i * .07).toFixed(2)}s" transform="rotate(18 ${x + tilt * 1.6 + 15} ${y + 10})"/>`;
      }
      return g;
    };
    return `<line x1="150" y1="${b}" x2="930" y2="${b}" stroke="#2d2822" stroke-width="4" class="f" style="--d:.3s"/>
${stalk(340, 250, 14)}${stalk(540, 300, 0)}${stalk(740, 230, -14)}
<line x1="200" y1="${b + 46}" x2="880" y2="${b + 46}" stroke="${accent}" stroke-width="4" stroke-dasharray="14 12" class="draw" style="--d:1.1s"/>`;
  }
  if (theme === 'water') {
    return `<path d="M540 ${top + 40} Q700 ${top + 220} 700 ${top + 292} A160 160 0 0 1 380 ${top + 292} Q380 ${top + 220} 540 ${top + 40} Z" fill="none" stroke="#2d2822" stroke-width="5" class="f" style="--d:.35s"/>
<path d="M498 ${top + 210} Q474 ${top + 262} 480 ${top + 300}" fill="none" stroke="${accent}" stroke-width="5" stroke-linecap="round" class="f" style="--d:.8s"/>
<ellipse cx="540" cy="${top + 400}" rx="230" ry="26" fill="none" stroke="${accent}" stroke-width="4" class="f" style="--d:.95s"/>
<ellipse cx="540" cy="${top + 400}" rx="140" ry="14" fill="none" stroke="${accent}" stroke-width="3" opacity=".6" class="f" style="--d:1.1s"/>`;
  }
  if (theme === 'bank') {
    const b = top + 340;
    let cols = '';
    for (let i = 0; i < 4; i++) {
      const x = 350 + i * 110;
      cols += `<rect x="${x}" y="${b - 190}" width="54" height="170" fill="none" stroke="#2d2822" stroke-width="4" class="f" style="--d:${(0.6 + i * .06).toFixed(2)}s"/>`;
    }
    return `<path d="M300 ${b - 190} L540 ${b - 300} L780 ${b - 190} Z" fill="none" stroke="#2d2822" stroke-width="5" class="f" style="--d:.35s"/>
${cols}
<rect x="300" y="${b - 190}" width="480" height="20" fill="none" stroke="#2d2822" stroke-width="4" class="f" style="--d:.5s"/>
<line x1="270" y1="${b}" x2="810" y2="${b}" stroke="#2d2822" stroke-width="5" class="f" style="--d:.4s"/>
<line x1="240" y1="${b + 26}" x2="840" y2="${b + 26}" stroke="#2d2822" stroke-width="4" class="f" style="--d:.45s"/>
<circle cx="540" cy="${b - 236}" r="20" fill="none" stroke="${accent}" stroke-width="4" class="f" style="--d:1s"/>`;
  }
  if (theme === 'coin') {
    return `<circle cx="430" cy="${top + 190}" r="118" fill="none" stroke="#2d2822" stroke-width="5" class="f" style="--d:.35s"/>
<circle cx="430" cy="${top + 190}" r="88" fill="none" stroke="#2d2822" stroke-width="3" opacity=".5" class="f" style="--d:.5s"/>
<text x="430" y="${top + 228}" text-anchor="middle" font-size="96" fill="#2d2822" font-family="Songti SC,SimSun,serif" class="f" style="--d:.7s">¥</text>
<circle cx="678" cy="${top + 268}" r="98" fill="none" stroke="${accent}" stroke-width="5" class="f" style="--d:.6s"/>
<text x="678" y="${top + 300}" text-anchor="middle" font-size="82" fill="${accent}" font-family="Baskerville,serif" class="f" style="--d:.85s">$</text>
<path d="M300 ${top + 356} Q470 ${top + 420} 640 ${top + 384}" fill="none" stroke="#2d2822" stroke-width="4" stroke-dasharray="10 10" class="draw" style="--d:1s"/>
<path d="M620 ${top + 370} L646 ${top + 384} L620 ${top + 398}" fill="none" stroke="#2d2822" stroke-width="4" class="f" style="--d:1.3s"/>`;
  }
  if (theme === 'scale') {
    const b = top + 340;
    return `<line x1="540" y1="${top + 60}" x2="540" y2="${b - 40}" stroke="#2d2822" stroke-width="5" class="f" style="--d:.35s"/>
<line x1="286" y1="${top + 130}" x2="794" y2="${top + 130}" stroke="#2d2822" stroke-width="5" class="f" style="--d:.5s"/>
<circle cx="540" cy="${top + 60}" r="12" fill="none" stroke="#2d2822" stroke-width="4" class="f" style="--d:.6s"/>
<line x1="286" y1="${top + 130}" x2="286" y2="${top + 240}" stroke="#2d2822" stroke-width="3" class="f" style="--d:.7s"/>
<line x1="794" y1="${top + 130}" x2="794" y2="${top + 200}" stroke="#2d2822" stroke-width="3" class="f" style="--d:.7s"/>
<path d="M206 ${top + 240} H366 L286 ${top + 306} Z" fill="none" stroke="${accent}" stroke-width="4" class="f" style="--d:.85s"/>
<path d="M714 ${top + 200} H874 L794 ${top + 266} Z" fill="none" stroke="${accent}" stroke-width="4" class="f" style="--d:.9s"/>
<line x1="410" y1="${b - 40}" x2="670" y2="${b - 40}" stroke="#2d2822" stroke-width="5" class="f" style="--d:.75s"/>
<line x1="380" y1="${b}" x2="700" y2="${b}" stroke="#2d2822" stroke-width="5" class="f" style="--d:.8s"/>`;
  }
  if (theme === 'shield') {
    return `<path d="M540 ${top + 50} L780 ${top + 140} V${top + 270} Q780 ${top + 400} 540 ${top + 430} Q300 ${top + 400} 300 ${top + 270} V${top + 140} Z" fill="none" stroke="#2d2822" stroke-width="5" class="f" style="--d:.35s"/>
<line x1="540" y1="${top + 50}" x2="540" y2="${top + 430}" stroke="#2d2822" stroke-width="3" opacity=".4" class="f" style="--d:.55s"/>
<path d="M446 ${top + 240} L516 ${top + 312} L650 ${top + 176}" fill="none" stroke="${accent}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" class="draw" style="--d:.8s"/>`;
  }
  if (theme === 'lock') {
    return `<rect x="374" y="${top + 190}" width="332" height="230" rx="18" fill="none" stroke="#2d2822" stroke-width="5" class="f" style="--d:.35s"/>
<path d="M436 ${top + 190} V${top + 140} A104 104 0 0 1 644 ${top + 140} V${top + 190}" fill="none" stroke="#2d2822" stroke-width="5" class="f" style="--d:.5s"/>
<circle cx="540" cy="${top + 282}" r="30" fill="none" stroke="${accent}" stroke-width="5" class="f" style="--d:.75s"/>
<line x1="540" y1="${top + 312}" x2="540" y2="${top + 368}" stroke="${accent}" stroke-width="5" class="f" style="--d:.9s"/>
<line x1="180" y1="${top + 430}" x2="900" y2="${top + 430}" stroke="#2d2822" stroke-width="4" stroke-dasharray="18 14" class="draw" style="--d:1s"/>`;
  }
  if (theme === 'clock') {
    const cx = 540, cy = top + 210;
    return `<circle cx="${cx}" cy="${cy}" r="150" fill="none" stroke="#2d2822" stroke-width="5" class="f" style="--d:.35s"/>
${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => {
      const a = Math.PI * 2 * i / 12;
      return `<line x1="${cx + Math.cos(a) * 128}" y1="${cy + Math.sin(a) * 128}" x2="${cx + Math.cos(a) * 142}" y2="${cy + Math.sin(a) * 142}" stroke="#2d2822" stroke-width="3" opacity=".55"/>`;
    }).join('')}
<line x1="${cx}" y1="${cy}" x2="${cx + 66}" y2="${cy - 62}" stroke="${accent}" stroke-width="6" stroke-linecap="round" class="f" style="--d:.7s"/>
<line x1="${cx}" y1="${cy}" x2="${cx - 12}" y2="${cy - 108}" stroke="#2d2822" stroke-width="6" stroke-linecap="round" class="f" style="--d:.6s"/>
<circle cx="${cx}" cy="${cy}" r="10" fill="${accent}" class="f" style="--d:.8s"/>
<path d="M300 ${top + 400} A170 170 0 0 0 780 ${top + 400}" fill="none" stroke="${accent}" stroke-width="4" stroke-dasharray="10 10" class="draw" style="--d:1s"/>
<path d="M304 ${top + 372} L298 ${top + 404} L330 ${top + 400}" fill="none" stroke="${accent}" stroke-width="4" class="f" style="--d:1.3s"/>`;
  }
  if (theme === 'network') {
    const pts = [[330, top + 120], [740, top + 96], [250, top + 300], [540, top + 240], [820, top + 300], [420, top + 410], [700, top + 420]];
    let edges = '';
    const links = [[0, 3], [1, 3], [2, 3], [3, 4], [3, 5], [3, 6], [5, 6], [0, 1]];
    for (const [a, b] of links) edges += `<line x1="${pts[a][0]}" y1="${pts[a][1]}" x2="${pts[b][0]}" y2="${pts[b][1]}" stroke="#2d2822" stroke-width="3" opacity=".45" class="f" style="--d:.5s"/>`;
    let nodes = '';
    pts.forEach((p, i) => {
      nodes += `<circle cx="${p[0]}" cy="${p[1]}" r="${i === 3 ? 40 : 22}" fill="none" stroke="${i === 3 ? accent : '#2d2822'}" stroke-width="${i === 3 ? 5 : 4}" class="f" style="--d:${(0.6 + i * .05).toFixed(2)}s"/>`;
    });
    return edges + nodes + `<circle cx="540" cy="${top + 240}" r="9" fill="${accent}" class="f" style="--d:1.1s"/>`;
  }
  if (theme === 'phone') {
    return `<rect x="410" y="${top + 40}" width="260" height="420" rx="34" fill="none" stroke="#2d2822" stroke-width="5" class="f" style="--d:.35s"/>
<rect x="440" y="${top + 90}" width="200" height="300" rx="12" fill="none" stroke="#2d2822" stroke-width="3" opacity=".5" class="f" style="--d:.5s"/>
<circle cx="540" cy="${top + 424}" r="14" fill="none" stroke="#2d2822" stroke-width="3" class="f" style="--d:.6s"/>
${[0, 1, 2].map(i => `<rect x="${458 + i * 62}" y="${top + 120}" width="48" height="48" rx="8" fill="none" stroke="${accent}" stroke-width="3" class="f" style="--d:${(0.7 + i * .1).toFixed(2)}s"/>`).join('')}
<line x1="458" y1="${top + 210}" x2="620" y2="${top + 210}" stroke="${accent}" stroke-width="4" class="f" style="--d:1s"/>
<line x1="458" y1="${top + 244}" x2="586" y2="${top + 244}" stroke="${accent}" stroke-width="4" opacity=".6" class="f" style="--d:1.05s"/>
<path d="M714 ${top + 150} q34 -16 68 0 M736 ${top + 192} q16 -8 32 0" fill="none" stroke="${accent}" stroke-width="4" class="f" style="--d:1.1s"/>`;
  }
  if (theme === 'satellite') {
    return `<path d="M180 ${top + 380} Q540 ${top - 20} 900 ${top + 380}" fill="none" stroke="#2d2822" stroke-width="3" stroke-dasharray="12 12" opacity=".45" class="draw" style="--d:.4s"/>
<g class="f" style="--d:.6s" transform="translate(540,${top + 190}) rotate(-18)">
<rect x="-70" y="-58" width="140" height="116" rx="10" fill="none" stroke="#2d2822" stroke-width="5"/>
<rect x="-206" y="-44" width="118" height="88" fill="none" stroke="${accent}" stroke-width="4"/>
<rect x="88" y="-44" width="118" height="88" fill="none" stroke="${accent}" stroke-width="4"/>
<line x1="-152" y1="-44" x2="-152" y2="44" stroke="${accent}" stroke-width="3" opacity=".6"/>
<line x1="-118" y1="-44" x2="-118" y2="44" stroke="${accent}" stroke-width="3" opacity=".6"/>
<line x1="152" y1="-44" x2="152" y2="44" stroke="${accent}" stroke-width="3" opacity=".6"/>
<path d="M0 -58 L0 -108 M-24 -108 A24 24 0 0 1 24 -108" fill="none" stroke="#2d2822" stroke-width="4"/>
</g>
<circle cx="300" cy="${top + 320}" r="8" fill="${accent}" class="f" style="--d:1.1s"/>
<circle cx="810" cy="${top + 300}" r="8" fill="${accent}" class="f" style="--d:1.2s"/>`;
  }
  if (theme === 'dna') {
    const N = 34;
    let a = '', b = '', rungs = '';
    for (let i = 0; i <= N; i++) {
      const y = top + 40 + i * 9;
      const dx = Math.sin(i * 0.24) * 86;
      a += `${i ? 'L' : 'M'}${(540 - dx).toFixed(1)} ${y} `;
      b += `${i ? 'L' : 'M'}${(540 + dx).toFixed(1)} ${y} `;
      if (i % 4 === 0) rungs += `<line x1="${540 - dx}" y1="${y}" x2="${540 + dx}" y2="${y}" stroke="#2d2822" stroke-width="3" opacity=".45" class="f" style="--d:${(0.5 + i * .012).toFixed(2)}s"/>`;
    }
    return `<path d="${a}" fill="none" stroke="#2d2822" stroke-width="5" class="draw" style="--d:.4s"/>
<path d="${b}" fill="none" stroke="${accent}" stroke-width="5" class="draw" style="--d:.5s"/>
${rungs}`;
  }
  if (theme === 'flask') {
    return `<path d="M486 ${top + 60} H594 M510 ${top + 60} V${top + 190} L406 ${top + 360} Q396 ${top + 386} 424 ${top + 386} H656 Q684 ${top + 386} 674 ${top + 360} L570 ${top + 190} V${top + 60}" fill="none" stroke="#2d2822" stroke-width="5" class="f" style="--d:.35s"/>
<path d="M446 ${top + 300} Q540 ${top + 274} 634 ${top + 300} L674 ${top + 360} Q684 ${top + 386} 656 ${top + 386} H424 Q396 ${top + 386} 406 ${top + 360} Z" fill="${accent}" fill-opacity=".14" stroke="none" class="f" style="--d:.6s"/>
<circle cx="500" cy="${top + 236}" r="12" fill="none" stroke="${accent}" stroke-width="3" class="f" style="--d:.9s"/>
<circle cx="574" cy="${top + 196}" r="9" fill="none" stroke="${accent}" stroke-width="3" class="f" style="--d:1s"/>
<circle cx="548" cy="${top + 268}" r="7" fill="none" stroke="${accent}" stroke-width="3" class="f" style="--d:1.1s"/>
<line x1="700" y1="${top + 200}" x2="760" y2="${top + 360}" stroke="#2d2822" stroke-width="4" class="f" style="--d:.8s"/>
<rect x="748" y="${top + 150}" width="34" height="70" rx="8" fill="none" stroke="#2d2822" stroke-width="4" class="f" style="--d:.9s"/>`;
  }
  if (theme === 'store') {
    const b = top + 360;
    return `<path d="M300 ${b} V${top + 180} H780 V${b}" fill="none" stroke="#2d2822" stroke-width="5" class="f" style="--d:.35s"/>
<path d="M270 ${top + 180} L310 ${top + 90} H770 L810 ${top + 180} Z" fill="none" stroke="#2d2822" stroke-width="5" class="f" style="--d:.5s"/>
${[0, 1, 2, 3].map(i => `<line x1="${340 + i * 118}" y1="${top + 92}" x2="${320 + i * 118}" y2="${top + 178}" stroke="${accent}" stroke-width="4" opacity=".7" class="f" style="--d:${(0.65 + i * .06).toFixed(2)}s"/>`).join('')}
<rect x="340" y="${b - 120}" width="150" height="120" fill="none" stroke="#2d2822" stroke-width="4" class="f" style="--d:.85s"/>
<rect x="590" y="${b - 120}" width="140" height="120" fill="none" stroke="#2d2822" stroke-width="4" class="f" style="--d:.9s"/>
<line x1="590" y1="${b - 60}" x2="730" y2="${b - 60}" stroke="#2d2822" stroke-width="3" opacity=".45" class="f" style="--d:1s"/>
<line x1="540" y1="${b}" x2="540" y2="${b}" stroke="#2d2822"/>
<line x1="240" y1="${b}" x2="840" y2="${b}" stroke="#2d2822" stroke-width="4" class="f" style="--d:.4s"/>`;
  }
  if (theme === 'bridge') {
    const b = top + 300;
    let hangers = '';
    for (let i = 0; i < 8; i++) {
      const x = 230 + i * 90;
      const h = Math.sin(Math.PI * (x - 170) / 740) * 190;
      hangers += `<line x1="${x}" y1="${b + 30}" x2="${x}" y2="${b + 30 - h}" stroke="#2d2822" stroke-width="3" opacity=".55" class="f" style="--d:.6s"/>`;
    }
    return `<path d="M170 ${b} Q540 ${top + 40} 910 ${b}" fill="none" stroke="#2d2822" stroke-width="5" class="f" style="--d:.35s"/>
<line x1="150" y1="${b + 30}" x2="930" y2="${b + 30}" stroke="#2d2822" stroke-width="6" class="f" style="--d:.45s"/>
${hangers}
<line x1="300" y1="${b + 30}" x2="300" y2="${b + 150}" stroke="#2d2822" stroke-width="6" class="f" style="--d:.8s"/>
<line x1="780" y1="${b + 30}" x2="780" y2="${b + 150}" stroke="#2d2822" stroke-width="6" class="f" style="--d:.8s"/>
<path d="M150 ${b + 150} Q210 ${b + 132} 270 ${b + 150} T390 ${b + 150} T510 ${b + 150} T630 ${b + 150} T750 ${b + 150} T870 ${b + 150} T930 ${b + 150}" fill="none" stroke="${accent}" stroke-width="4" class="f" style="--d:.95s"/>
<circle cx="540" cy="${top + 78}" r="9" fill="${accent}" class="f" style="--d:1.2s"/>`;
  }
  if (theme === 'leaf') {
    const b = top + 350;
    return `<path d="M250 ${b} C372 ${b - 40} 596 ${b - 128} 762 ${b - 268} C620 ${b - 300} 396 ${b - 250} 250 ${b} Z" fill="none" stroke="#2d2822" stroke-width="5" stroke-linejoin="round" class="f" style="--d:.35s"/>
<path d="M250 ${b} Q520 ${b - 170} 762 ${b - 268}" fill="none" stroke="${accent}" stroke-width="4" stroke-linecap="round" class="draw" style="--d:.6s"/>
<path d="M356 ${b - 68} L318 ${b - 96} M438 ${b - 120} L404 ${b - 168} M520 ${b - 164} L496 ${b - 218} M600 ${b - 206} L586 ${b - 252}" fill="none" stroke="${accent}" stroke-width="3" stroke-linecap="round" opacity=".55" class="f" style="--d:.85s"/>
<path d="M356 ${b - 68} L392 ${b - 30} M438 ${b - 120} L480 ${b - 86} M520 ${b - 164} L566 ${b - 136} M600 ${b - 206} L648 ${b - 184}" fill="none" stroke="${accent}" stroke-width="3" stroke-linecap="round" opacity=".4" class="f" style="--d:.95s"/>
<path d="M762 ${b - 268} q46 6 74 40" fill="none" stroke="#2d2822" stroke-width="4" stroke-linecap="round" class="f" style="--d:1.05s"/>
<path d="M208 ${b - 96} C292 ${b - 130} 342 ${b - 196} 344 ${b - 262} C286 ${b - 232} 236 ${b - 186} 208 ${b - 96} Z" fill="none" stroke="#2d2822" stroke-width="3.4" stroke-linejoin="round" opacity=".55" class="f" style="--d:1.2s"/>
<circle cx="700" cy="${b - 48}" r="8" fill="${accent}" class="f" style="--d:1.35s"/>`;
  }
  if (theme === 'factory') {
    const b = top + 340;
    return `<line x1="170" y1="${b + 10}" x2="910" y2="${b + 10}" stroke="#2d2822" stroke-width="4" class="f" style="--d:.3s"/>
<path d="M300 ${b} V${b - 150} L380 ${b - 190} V${b - 150} L460 ${b - 190} V${b - 150} L540 ${b - 190} V${b}" fill="none" stroke="#2d2822" stroke-width="5" class="f" style="--d:.4s"/>
<rect x="600" y="${b - 250}" width="54" height="250" fill="none" stroke="#2d2822" stroke-width="4" class="f" style="--d:.55s"/>
<rect x="690" y="${b - 190}" width="54" height="190" fill="none" stroke="#2d2822" stroke-width="4" class="f" style="--d:.6s"/>
<rect x="340" y="${b - 90}" width="66" height="90" fill="none" stroke="#2d2822" stroke-width="3" class="f" style="--d:.7s"/>
<rect x="440" y="${b - 90}" width="66" height="90" fill="none" stroke="#2d2822" stroke-width="3" class="f" style="--d:.75s"/>
<circle cx="627" cy="${b - 290}" r="17" fill="none" stroke="${accent}" stroke-width="4" class="f" style="--d:1s"/>
<circle cx="676" cy="${b - 320}" r="12" fill="none" stroke="${accent}" stroke-width="4" class="f" style="--d:1.15s"/>
<path d="M780 ${b} V${b - 120}" fill="none" stroke="${accent}" stroke-width="4" stroke-dasharray="8 8" class="draw" style="--d:.9s"/>`;
  }
  if (theme === 'cart') {
    return `<path d="M348 ${top + 100} L732 ${top + 100} L764 ${top + 330} L316 ${top + 330} Z" fill="none" stroke="#2d2822" stroke-width="5" class="f" style="--d:.35s"/>
<path d="M458 ${top + 100} Q540 ${top + 16} 622 ${top + 100}" fill="none" stroke="#2d2822" stroke-width="4" class="f" style="--d:.55s"/>
<line x1="392" y1="${top + 148}" x2="688" y2="${top + 148}" stroke="#2d2822" stroke-width="3" opacity=".5" class="f" style="--d:.7s"/>
<g class="f" style="--d:1s" transform="translate(646,${top + 186}) rotate(14)">
<path d="M0 0 H74 L100 26 L74 52 H0 Z" fill="none" stroke="${accent}" stroke-width="4"/>
<circle cx="14" cy="26" r="7" fill="none" stroke="${accent}" stroke-width="3"/>
<line x1="40" y1="18" x2="72" y2="18" stroke="${accent}" stroke-width="3"/>
<line x1="40" y1="34" x2="62" y2="34" stroke="${accent}" stroke-width="3"/>
</g>`;
  }
  if (theme === 'pill') {
    return `<g transform="translate(540,${top + 175}) rotate(-28)">
<rect x="-160" y="-64" width="320" height="128" rx="64" fill="none" stroke="#2d2822" stroke-width="5" class="f" style="--d:.35s"/>
<path d="M0 -64 H96 A64 64 0 0 1 96 64 H0 Z" fill="${accent}" fill-opacity=".16" stroke="${accent}" stroke-width="4" class="f" style="--d:.8s"/>
<line x1="0" y1="-64" x2="0" y2="64" stroke="#2d2822" stroke-width="4" class="f" style="--d:.55s"/>
<circle cx="-90" cy="0" r="9" fill="${accent}" class="f" style="--d:1s"/>
</g>
<g class="f" style="--d:.95s" transform="translate(800,${top + 300})">
<line x1="-24" y1="0" x2="24" y2="0" stroke="${accent}" stroke-width="9"/>
<line x1="0" y1="-24" x2="0" y2="24" stroke="${accent}" stroke-width="9"/>
</g>`;
  }
  if (theme === 'house') {
    const b = top + 330;
    return `<path d="M356 ${top + 150} L540 ${top + 36} L724 ${top + 150}" fill="none" stroke="#2d2822" stroke-width="5" class="f" style="--d:.35s"/>
<path d="M388 ${top + 150} V${b} H692 V${top + 150}" fill="none" stroke="#2d2822" stroke-width="5" class="f" style="--d:.5s"/>
<rect x="500" y="${b - 96}" width="80" height="96" fill="none" stroke="#2d2822" stroke-width="4" class="f" style="--d:.65s"/>
<rect x="416" y="${top + 200}" width="64" height="64" fill="none" stroke="#2d2822" stroke-width="4" class="f" style="--d:.7s"/>
<rect x="600" y="${top + 200}" width="64" height="64" fill="none" stroke="#2d2822" stroke-width="4" class="f" style="--d:.75s"/>
<path d="M760 ${b} V${top + 190}" fill="none" stroke="${accent}" stroke-width="4" stroke-dasharray="9 9" class="draw" style="--d:.9s"/>
<path d="M742 ${top + 214} L760 ${top + 182} L778 ${top + 214}" fill="none" stroke="${accent}" stroke-width="4" class="f" style="--d:1.3s"/>`;
  }
  if (theme === 'car') {
    const b = top + 280;
    return `<path d="M300 ${b} L322 ${b - 66} L432 ${b - 78} L506 ${b - 138} L648 ${b - 138} L706 ${b - 78} L772 ${b - 60} L784 ${b}" fill="none" stroke="#2d2822" stroke-width="5" class="f" style="--d:.35s"/>
<circle cx="404" cy="${b + 6}" r="42" fill="none" stroke="#2d2822" stroke-width="5" class="f" style="--d:.6s"/>
<circle cx="688" cy="${b + 6}" r="42" fill="none" stroke="#2d2822" stroke-width="5" class="f" style="--d:.6s"/>
<line x1="506" y1="${b - 138}" x2="506" y2="${b - 78}" stroke="#2d2822" stroke-width="4" class="f" style="--d:.7s"/>
<line x1="648" y1="${b - 138}" x2="648" y2="${b - 78}" stroke="#2d2822" stroke-width="4" class="f" style="--d:.7s"/>
<line x1="180" y1="${b + 64}" x2="900" y2="${b + 64}" stroke="${accent}" stroke-width="4" stroke-dasharray="14 14" class="draw" style="--d:.85s"/>
<circle cx="748" cy="${b - 48}" r="10" fill="${accent}" class="f" style="--d:1.2s"/>`;
  }
  if (theme === 'people') {
    const head = (x, y) => `<circle cx="${x}" cy="${y}" r="34" fill="none" stroke="#2d2822" stroke-width="4" class="f" style="--d:.4s"/>
<path d="M${x - 52} ${y + 108} Q${x} ${y + 40} ${x + 52} ${y + 108}" fill="none" stroke="#2d2822" stroke-width="4" class="f" style="--d:.55s"/>`;
    return head(410, top + 150) + head(540, top + 120) + head(670, top + 150) +
      `<path d="M462 ${top + 300} H616" fill="none" stroke="${accent}" stroke-width="4" stroke-dasharray="9 9" class="draw" style="--d:1s"/>
<path d="M600 ${top + 284} L620 ${top + 300} L600 ${top + 316}" fill="none" stroke="${accent}" stroke-width="4" class="f" style="--d:1.35s"/>`;
  }
  const cx = 540, cy = top + 170;
  let rays = '';
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 4) * i;
    rays += `<line x1="${cx + Math.cos(a) * 168}" y1="${cy + Math.sin(a) * 168}" x2="${cx + Math.cos(a) * 206}" y2="${cy + Math.sin(a) * 206}" stroke="#2d2822" stroke-width="4" opacity=".55" class="f" style="--d:${(0.6 + i * 0.06).toFixed(2)}s"/>`;
  }
  return `<circle cx="${cx}" cy="${cy}" r="150" fill="none" stroke="#2d2822" stroke-width="5" class="f" style="--d:.35s"/>
<circle cx="${cx}" cy="${cy}" r="108" fill="none" stroke="${accent}" stroke-width="4" stroke-dasharray="10 10" class="draw" style="--d:.75s"/>${rays}
<circle cx="${cx}" cy="${cy}" r="22" fill="none" stroke="${accent}" stroke-width="5" class="f" style="--d:1.3s"/>`;
}

function coverTheme(title, sub, prefer) {
  if (prefer && COVER_ACCENT[prefer]) return prefer;
  const hit = COVER_THEMES.find(t => t.re.test(title + ' ' + sub));
  return hit ? hit.id : 'idea';
}

/* 封面画笔：纸色填充 + 手抖滤镜 + 星芒点缀，让配图接近定制插画的笔触 */
const PAPER_FILL = 'rgba(246,238,220,.74)';

function paperFill(markup) {
  return markup
    .replace(/<rect\b([^>]*?)fill="none"/g, `<rect$1fill="${PAPER_FILL}"`)
    .replace(/<path\b([^>]*?)fill="none"/g, (m, attrs) => /[Zz]/.test(attrs) ? `<path${attrs}fill="${PAPER_FILL}"` : m)
    .replace(/<circle\b([^>]*?)r="(\d+(?:\.\d+)?)"([^>]*?)fill="none"/g,
      (m, a, r, b) => Number(r) >= 36 ? `<circle${a}r="${r}"${b}fill="${PAPER_FILL}"` : m);
}

function coverSparkle(x, y, r, color, op) {
  const k = r * 0.22;
  return `<path d="M${x} ${y - r} L${x + k} ${y - k} L${x + r} ${y} L${x + k} ${y + k} L${x} ${y + r} L${x - k} ${y + k} L${x - r} ${y} L${x - k} ${y - k} Z" fill="${color}" opacity="${op}"/>`;
}

function coverDeco(theme, top, accent, seed) {
  const n = i => (hash(seed + '$' + i) % 1000) / 1000;
  const h = COVER_ART_H[theme] || 400;
  const base = top + h - 6;
  return coverSparkle(178 + Math.round(n(1) * 110), top + 26 + Math.round(n(2) * 54), 17, accent, .55) +
    coverSparkle(786 + Math.round(n(3) * 104), top + 12 + Math.round(n(4) * 64), 11, '#2d2822', .36) +
    `<path d="M146 ${base} Q540 ${base + 34} 934 ${base - 6}" fill="none" stroke="${accent}" stroke-width="2.2" stroke-dasharray="10 13" opacity=".26"/>`;
}

function coverArt(theme, top, accent, seed, scale = 1) {
  const cy = top + (COVER_ART_H[theme] || 400) / 2;
  const zoom = scale === 1 ? '' : ` transform="translate(540 ${cy}) scale(${scale}) translate(-540 -${cy})"`;
  return `<g filter="url(#rough)"${zoom}>${paperFill(coverArtRaw(theme, top, accent, seed))}${coverDeco(theme, top, accent, seed)}</g>`;
}

function coverScene(scene, meta) {
  const title = meta.title || scene.title || '';
  const sub = meta.subtitle || scene.sub || '';
  const seed = title + '|' + sub;
  const h = hash(seed);
  const theme = coverTheme(title, sub, meta.cover);
  const accent = COVER_ACCENT[theme];
  const fs = titleFS(title, 76);
  const lines = Math.max(1, Math.ceil(units(title) / (856 / fs)));
  const titleH = lines * fs * 1.18;
  const picked = Number(meta.coverLayout);
  const layout = (picked === 0 || picked === 1 || picked === 2) ? picked : h % 3; // 0 居中/插图在下，1 居中/插图在上，2 左对齐/插图在下
  const kicker = meta.kicker || COVER_KICKER[theme];

  let kickerStyle, titleStyle, subTop, artTop;
  if (layout === 1) {
    artTop = 290;
    const kickerTop = artTop + COVER_ART_H[theme] + 40;
    kickerStyle = `left:0;width:1080px;text-align:center;top:${kickerTop}px`;
    titleStyle = `left:100px;top:${kickerTop + 62}px;width:880px;text-align:center;font-size:${fs}px`;
    subTop = kickerTop + 62 + titleH + 26;
  } else if (layout === 2) {
    kickerStyle = 'left:104px;top:236px';
    titleStyle = `left:104px;top:292px;width:872px;font-size:${fs}px`;
    subTop = 292 + titleH + 30;
    artTop = Math.min(1040, Math.max(940, subTop + 110));
  } else {
    kickerStyle = 'left:0;width:1080px;text-align:center;top:238px';
    titleStyle = `left:100px;top:300px;width:880px;text-align:center;font-size:${fs}px`;
    subTop = 300 + titleH + 28;
    artTop = Math.min(1040, Math.max(940, subTop + 110));
  }
  const subAlign = layout === 2 ? 'left' : 'center';
  const subLeft = 104;
  const subWidth = 872;

  return `<section class="scene" id="s0">
<svg class="art" viewBox="0 0 1080 1920">
${coverArt(theme, artTop, accent, seed, layout === 1 ? 1.14 : 1.3)}
</svg>
<div class="k f" style="--d:.05s;${kickerStyle}">${esc(kicker)}</div>
<h1 class="h1 rise cover-title" style="--d:.15s;${titleStyle}">${esc(title)}</h1>
<div class="f" style="position:absolute;left:${subLeft}px;width:${subWidth}px;text-align:${subAlign};top:${Math.round(subTop)}px;font-size:38px;line-height:1.5;color:var(--ink2);--d:.4s">${esc(sub)}</div>
<div class="f cover-tag ${COVER_CLASS[theme]}" style="--d:1.5s">${esc(meta.disclaimer || '公开信息梳理 · 不构成投资建议')}</div>
</section>`;
}

function kickerOf(scene, idx) {
  const tag = (scene.kicker || '').trim();
  const no = String(idx).padStart(2, '0');
  return tag ? `${no} / ${tag}` : no;
}

function notesOf(scene, delayBase = 0.75) {
  const notes = Array.isArray(scene.notes) ? scene.notes.filter(Boolean).slice(0, 3) : [];
  return notes.map((n, i) =>
    `<div class="s f" style="top:${1090 + i * 78}px;--d:${(delayBase + i * 0.12).toFixed(2)}s">${esc(n)}</div>`
  ).join('\n');
}

function footOf(scene, meta, d = 1.0) {
  const t = scene.foot || meta.source || '公开信息整理';
  return `<div class="foot f" style="--d:${d}s">${esc(t)}</div>`;
}

function header(scene, idx, title, sub) {
  const fs = titleFS(title);
  return `<div class="k f" style="--d:.05s">${esc(kickerOf(scene, idx))}</div>
<h1 class="h1 rise" style="--d:.12s;font-size:${fs}px">${esc(title)}</h1>
${sub ? `<div class="h2 f" style="--d:.25s">${esc(sub)}</div>` : ''}`;
}

function bulletsScene(scene, idx) {
  const pts = (scene.points || []).slice(0, 4);
  const tops = pts.length >= 4 ? [560, 740, 920, 1100] : [570, 810, 1050];
  const body = pts.map((p, i) => `<div class="pt f" style="top:${tops[i] || 560 + i * 165}px;--d:${(0.4 + i * 0.14).toFixed(2)}s">
<div class="n">${i + 1}</div>
<div><h3>${esc(p.t)}</h3>${p.d ? `<p>${esc(p.d)}</p>` : ''}</div>
</div>`).join('\n');
  return `<section class="scene" id="s${idx}">
${header(scene, idx, scene.title, scene.sub)}
${body}
${footOf(scene, scene._meta)}
</section>`;
}

function listScene(scene, idx) {
  const pts = (scene.points || []).slice(0, 5);
  const rows = pts.map((p, i) => `<div class="row"><div class="t">${esc(p.t)}</div>${p.d ? `<div class="d">${esc(p.d)}</div>` : ''}</div>`).join('\n');
  return `<section class="scene" id="s${idx}">
${header(scene, idx, scene.title, scene.sub)}
<div class="dl f" style="top:560px;--d:.4s">
${rows}
</div>
${footOf(scene, scene._meta)}
</section>`;
}

function flowScene(scene, idx) {
  const steps = (scene.steps || []).slice(0, 4).map(s => String(s));
  const n = Math.max(2, steps.length);
  const left = 104, W = 872, gap = 40;
  const bw = (W - gap * (n - 1)) / n, bh = 150, by = 660;
  const fs = Math.max(19, Math.min(30, Math.floor((bw - 22) / Math.max(1, Math.max(...steps.map(s => units(s)))))));
  let svg = '';
  steps.forEach((s, i) => {
    const x = left + i * (bw + gap);
    svg += `<rect x="${x.toFixed(1)}" y="${by}" width="${bw.toFixed(1)}" height="${bh}" rx="10" fill="rgba(255,255,255,.24)" stroke="#2d2822" stroke-width="3.5" class="f" style="--d:${(0.35 + i * 0.15).toFixed(2)}s"/>`;
    svg += `<text x="${(x + bw / 2).toFixed(1)}" y="${by + bh / 2}" text-anchor="middle" dominant-baseline="middle" font-size="${fs}" fill="#2d2822" font-family="Songti SC,Noto Serif CJK SC,Source Han Serif SC,SimSun,serif" class="f" style="--d:${(0.45 + i * 0.15).toFixed(2)}s">${esc(s)}</text>`;
    if (i < n - 1) {
      const ax = x + bw + 4, bx = x + bw + gap - 6;
      svg += `<line x1="${ax.toFixed(1)}" y1="${by + bh / 2}" x2="${bx.toFixed(1)}" y2="${by + bh / 2}" stroke="#b23a2a" stroke-width="4" marker-end="url(#ahr)" class="draw" style="--d:${(0.6 + i * 0.15).toFixed(2)}s"/>`;
    }
  });
  return `<section class="scene" id="s${idx}">
<svg class="art" viewBox="0 0 1080 1920">${svg}</svg>
${header(scene, idx, scene.title, scene.sub)}
${notesOf(scene, 0.9)}
${footOf(scene, scene._meta)}
</section>`;
}

function compareScene(scene, idx) {
  const L = scene.left || {}, R = scene.right || {};
  const li = arr => (arr || []).slice(0, 3).map(x => `<li>${esc(x)}</li>`).join('');
  return `<section class="scene" id="s${idx}">
${header(scene, idx, scene.title, scene.sub)}
<div class="cmp f ${L.win ? 'win' : ''}" style="left:96px;width:400px;--d:.35s">
<h3 class="${L.win ? 'red' : ''}">${esc(L.title || L.h || '')}</h3><ul>${li(L.items)}</ul>
</div>
<div class="vs f" style="--d:.5s">VS</div>
<div class="cmp f ${R.win ? 'win' : ''}" style="left:584px;width:400px;--d:.45s">
<h3 class="${R.win ? 'red' : ''}">${esc(R.title || R.h || '')}</h3><ul>${li(R.items)}</ul>
</div>
${notesOf(scene, 0.85)}
${footOf(scene, scene._meta)}
</section>`;
}

function barsScene(scene, idx) {
  const items = (scene.bars || []).slice(0, 4);
  const vals = items.map(x => Number(x.value) || 0);
  const max = Math.max(1, ...vals);
  const baseY = 980, topY = 660, maxH = baseY - topY;
  const areaL = 140, areaR = 940, step = (areaR - areaL) / Math.max(1, items.length);
  const bw = Math.min(120, step * 0.5);
  const colors = ['#2d2822', '#b23a2a', '#33506f', '#b08a3e'];
  let svg = `<line x1="120" y1="${baseY}" x2="960" y2="${baseY}" stroke="#2d2822" stroke-width="3" opacity=".5" class="draw" style="--d:.3s"/>`;
  if (scene.unit) svg += `<text x="104" y="592" font-size="25" fill="#5c4e3d" font-family="Songti SC,Noto Serif CJK SC,Source Han Serif SC,SimSun,serif">单位：${esc(scene.unit)}</text>`;
  items.forEach((it, i) => {
    const h = Math.max(6, vals[i] / max * maxH);
    const cx = areaL + step * (i + 0.5);
    const x = cx - bw / 2, y = baseY - h;
    svg += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" fill="none" stroke="${colors[i % 4]}" stroke-width="4" class="grow" style="--d:${(0.4 + i * 0.16).toFixed(2)}s" transform="translate(0,0)"/>`;
    svg += `<rect x="${(x + 6).toFixed(1)}" y="${(y + 6).toFixed(1)}" width="${(bw - 12).toFixed(1)}" height="${Math.max(2, h - 12).toFixed(1)}" fill="${colors[i % 4]}" opacity=".10"/>`;
    svg += `<text x="${cx.toFixed(1)}" y="${(y - 18).toFixed(1)}" text-anchor="middle" font-size="34" font-weight="700" fill="#2d2822" font-family="Baskerville,serif" class="f" style="--d:${(0.65 + i * 0.16).toFixed(2)}s">${esc(it.note || it.value)}</text>`;
    svg += `<text x="${cx.toFixed(1)}" y="${baseY + 40}" text-anchor="middle" font-size="28" fill="#5c4e3d" font-family="Songti SC,Noto Serif CJK SC,Source Han Serif SC,SimSun,serif">${esc(it.label)}</text>`;
  });
  return `<section class="scene" id="s${idx}">
<svg class="art" viewBox="0 0 1080 1920">${svg}</svg>
${header(scene, idx, scene.title, scene.sub)}
${notesOf(scene, 0.9)}
${footOf(scene, scene._meta)}
</section>`;
}

function lineScene(scene, idx) {
  const L = scene.line || {};
  const vals = (L.values || []).slice(0, 6).map(v => Number(v) || 0);
  const xs = (L.labels || []).slice(0, 6);
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = Math.max(1, max - min);
  const lo = min - span * 0.16, hi = max + span * 0.16;
  const x0 = 170, x1 = 910, yTop = 660, yBot = 950;
  const pt = (i) => {
    const x = vals.length === 1 ? (x0 + x1) / 2 : x0 + (x1 - x0) * i / (vals.length - 1);
    const y = yBot - (vals[i] - lo) / (hi - lo) * (yBot - yTop);
    return [x, y];
  };
  let svg = '';
  for (let g = 0; g <= 2; g++) {
    const y = yTop + (yBot - yTop) * g / 2;
    svg += `<line x1="${x0 - 30}" y1="${y}" x2="${x1 + 30}" y2="${y}" stroke="#2d2822" stroke-width="2" opacity=".18" stroke-dasharray="6 8"/>`;
  }
  svg += `<line x1="${x0 - 30}" y1="${yBot}" x2="${x1 + 30}" y2="${yBot}" stroke="#2d2822" stroke-width="3" opacity=".45"/>`;
  const pts = vals.map((_, i) => pt(i));
  svg += `<polyline points="${pts.map(p => p.map(v => v.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="#b23a2a" stroke-width="5" class="draw" style="--d:.45s"/>`;
  pts.forEach((p, i) => {
    svg += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="9" fill="#f4efe2" stroke="#b23a2a" stroke-width="4" class="f" style="--d:${(0.7 + i * 0.14).toFixed(2)}s"/>`;
    svg += `<text x="${p[0].toFixed(1)}" y="${(p[1] - 22).toFixed(1)}" text-anchor="middle" font-size="32" font-weight="700" fill="#2d2822" font-family="Baskerville,serif" class="f" style="--d:${(0.8 + i * 0.14).toFixed(2)}s">${esc(vals[i])}${esc(L.unit || '')}</text>`;
    if (xs[i]) svg += `<text x="${p[0].toFixed(1)}" y="${yBot + 42}" text-anchor="middle" font-size="27" fill="#5c4e3d" font-family="Songti SC,Noto Serif CJK SC,Source Han Serif SC,SimSun,serif">${esc(xs[i])}</text>`;
  });
  return `<section class="scene" id="s${idx}">
<svg class="art" viewBox="0 0 1080 1920">${svg}</svg>
${header(scene, idx, scene.title, scene.sub)}
${notesOf(scene, 0.95)}
${footOf(scene, scene._meta)}
</section>`;
}

function statsScene(scene, idx) {
  const items = (scene.stats || []).slice(0, 3);
  const n = Math.max(1, items.length);
  const gap = 40, W = 872;
  const cw = (W - gap * (n - 1)) / n;
  const body = items.map((it, i) => {
    const u = units(it.v);
    const fs = u > 6.5 ? 44 : u > 4.5 ? 52 : 62;
    return `<div class="sc f" style="left:${(104 + i * (cw + gap)).toFixed(0)}px;top:620px;width:${cw.toFixed(0)}px;--d:${(0.35 + i * 0.14).toFixed(2)}s">
<div class="v" style="font-size:${fs}px">${esc(it.v)}</div><div class="l">${esc(it.l)}</div></div>`;
  }).join('\n');
  return `<section class="scene" id="s${idx}">
${header(scene, idx, scene.title, scene.sub)}
${body}
${notesOf(scene, 0.85)}
${footOf(scene, scene._meta)}
</section>`;
}

function endScene(scene, idx, meta) {
  const lines = (scene.lines || scene.points && scene.points.map(p => p.t || p.d) || []).slice(0, 3);
  const body = lines.length
    ? `<div class="body f" style="top:600px;width:872px;--d:.4s">${lines.map(esc).join('<br><br>')}</div>`
    : '';
  return `<section class="scene" id="s${idx}">
${header(scene, idx, scene.title, scene.sub)}
${body}
<div class="stamp f" style="left:104px;top:1380px;--d:1.1s">${esc(scene.stamp || '不构成投资建议')}</div>
${footOf(scene, meta, 1.25)}
</section>`;
}

function renderHTML(board, beats) {
  const meta = board.meta || {};
  const scenes = (board.scenes || []).map(s => ({ ...s, _meta: meta }));
  const parts = scenes.map((s, i) => {
    const kind = s.kind || 'bullets';
    if (kind === 'cover') return coverScene(s, meta);
    if (kind === 'list') return listScene(s, i);
    if (kind === 'flow') return flowScene(s, i);
    if (kind === 'compare') return compareScene(s, i);
    if (kind === 'bars') return barsScene(s, i);
    if (kind === 'line') return lineScene(s, i);
    if (kind === 'stats') return statsScene(s, i);
    if (kind === 'end') return endScene(s, i, meta);
    return bulletsScene(s, i);
  });
  const beatsJS = '[' + beats.map((b, i) => `{id:'s${i}',dur:${Number(b.dur).toFixed(2)}}`).join(',') + ']';
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>${esc(meta.title || '手绘财经')}</title>
<style>${CSS}</style>
</head>
<body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${DEFS}</defs></svg>
<div id="stage">
${parts.join('\n')}
</div>
<script>${SEEK.replace('__BEATS__', beatsJS)}</script>
</body>
</html>
`;
}

module.exports = { renderHTML, titleFS, COVER_STYLES, COVER_LABEL, COVER_LAYOUT_NAME, coverTheme };
