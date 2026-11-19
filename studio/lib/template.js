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
  { id: 'energy', re: /油|能源|伊朗|中东|霍尔木兹|俄|乌|战争|冲突|制裁|海峡|天然气|地缘|军/ },
  { id: 'chip', re: /芯片|算力|人工?智能|AI|半导体|大模型|GPU|数据中心|机器人|服务器|光刻|智能/ },
  { id: 'chart', re: /股|指数|市值|板块|行情|估值|财报|营收|利润|份额|价格|市场|基金|债|涨|跌/ },
  { id: 'policy', re: /政策|改革|监管|国资|国企|规划|法案|会议|央行|利率|关税|目标|制度|补贴/ },
  { id: 'factory', re: /工厂|制造|产能|投产|产线|出口|订单|供应|扩产|基地/ },
  { id: 'cart', re: /消费|零售|电商|购物|品牌|客单|渠道|门店|直播带货/ },
  { id: 'pill', re: /医药|药|医疗|疫苗|临床|器械|医院|健康/ },
  { id: 'house', re: /房|地产|楼|土地|物业|租|家居/ },
  { id: 'car', re: /汽车|新能源车|整车|车企|电池|充电|智驾|车型/ },
  { id: 'people', re: /人口|就业|工资|社保|养老|教育|收入|劳动者|人才/ },
];

const COVER_ACCENT = { energy: '#2b6b85', chip: '#33506f', chart: '#b23a2a', policy: '#b08a3e', idea: '#b23a2a', factory: '#b08a3e', cart: '#b23a2a', pill: '#2b6b85', house: '#b08a3e', car: '#33506f', people: '#b23a2a' };
const COVER_CLASS = { energy: 'sea', chip: 'blue', chart: 'red', policy: 'gold', idea: 'red', factory: 'gold', cart: 'red', pill: 'sea', house: 'gold', car: 'blue', people: 'red' };
const COVER_KICKER = {
  energy: '手绘财经 · 地缘观察', chip: '手绘财经 · 产业拆解',
  chart: '手绘财经 · 数据复盘', policy: '手绘财经 · 政策解读', idea: '手绘财经 · 情景推演',
  factory: '手绘财经 · 产能观察', cart: '手绘财经 · 消费观察', pill: '手绘财经 · 医药观察',
  house: '手绘财经 · 资产观察', car: '手绘财经 · 产业观察', people: '手绘财经 · 社会观察',
};

const COVER_ART_H = { chart: 350, energy: 400, chip: 420, policy: 430, idea: 400, factory: 430, cart: 380, pill: 400, house: 420, car: 380, people: 400 };

function coverArt(theme, top, accent, seed) {
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
  const layout = h % 3; // 0 居中/插图在下，1 居中/插图在上，2 左对齐/插图在下
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
${coverArt(theme, artTop, accent, seed)}
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

module.exports = { renderHTML, titleFS };
