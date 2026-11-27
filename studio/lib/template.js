'use strict';
// 分镜 JSON -> 手绘风竖屏 HTML（1080x1728 渲染区，编码时上下各补 96px 黑边）

const CSS = `
:root{--paper:#f4efe2;--ink:#2d2822;--ink2:#4b4034;--red:#b23a2a;--green:#2c7a52;--blue:#33506f;--sea:#2b6b85;--gold:#b08a3e;--hand:"Hanzipen SC","Kaiti SC","STKaiti","KaiTi","Noto Serif CJK SC","Songti SC",serif;--num:"Baskerville","Songti SC",serif}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1728px;overflow:hidden;background:#e6d4af;color:var(--ink);font-family:var(--hand)}
#stage{position:relative;width:1080px;height:1728px;overflow:hidden;background:radial-gradient(72% 38% at 18% 2%,rgba(255,252,242,.96),rgba(255,252,242,0) 62%),radial-gradient(56% 32% at 84% 96%,rgba(132,100,58,.20),rgba(132,100,58,0) 68%),radial-gradient(42% 24% at 78% 12%,rgba(126,96,54,.11),rgba(126,96,54,0) 70%),linear-gradient(160deg,#f9f1dd 0%,#f2e5c8 44%,#e6d3ae 100%)}
#stage::after{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;opacity:.34;mix-blend-mode:multiply;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='260' height='260' filter='url(%23n)' opacity='0.55'/></svg>"),repeating-linear-gradient(.5deg,rgba(92,68,38,.05) 0 1px,rgba(0,0,0,0) 1px 9px);background-size:260px 260px,100% 9px}
#stage::before{content:"";position:absolute;inset:0;z-index:3;pointer-events:none;box-shadow:inset 0 0 280px rgba(86,64,36,.32),inset 0 0 80px rgba(86,64,36,.10)}
.scene{position:absolute;inset:0;z-index:1;visibility:hidden;opacity:0}
.scene.on{visibility:visible;opacity:1}
.art{position:absolute;inset:0;width:1080px;height:1920px;overflow:visible}
.f{opacity:0;animation:fade .8s cubic-bezier(.2,.7,.2,1) forwards;animation-delay:var(--d,0s)}
@keyframes fade{to{opacity:1}}
.rise{opacity:0;transform:translateY(14px) rotate(var(--rot,0deg))}
.scene.on .rise{animation:rise .9s cubic-bezier(.2,.7,.2,1) forwards;animation-delay:var(--d,0s)}
@keyframes rise{to{opacity:1;transform:translateY(0) rotate(var(--rot,0deg))}}
.draw{stroke-dasharray:2600;stroke-dashoffset:2600;opacity:0;animation:draw 2.4s ease-out forwards;animation-delay:var(--d,0s)}
@keyframes draw{0%{opacity:0}10%{opacity:1}100%{stroke-dashoffset:0;opacity:1}}
.grow{opacity:0;transform:scaleY(0);transform-origin:bottom;transform-box:fill-box;animation:grow 1s cubic-bezier(.2,.7,.2,1) forwards;animation-delay:var(--d,0s)}
@keyframes grow{to{opacity:1;transform:scaleY(1)}}
.render .f,.render .rise,.render .draw,.render .grow{animation-play-state:paused}
.k{position:absolute;left:106px;top:248px;font-size:26px;letter-spacing:.26em;color:var(--ink2);opacity:.92}
.h1{position:absolute;left:108px;top:304px;width:874px;font-size:82px;line-height:1.24;font-weight:700;letter-spacing:1px;transform:rotate(-.8deg);transform-origin:left top}
.h2{position:absolute;left:112px;top:450px;width:860px;font-size:36px;line-height:1.55;color:var(--ink2)}
.tbar{position:absolute;left:74px;width:9px;border-radius:5px;background:var(--red);opacity:.72;transform:rotate(var(--rot,1deg));transform-origin:top center}
.body{position:absolute;left:106px;font-size:38px;line-height:1.82}
.s{position:absolute;left:110px;width:858px;font-size:29px;line-height:1.7;color:var(--ink2)}
.foot{position:absolute;left:106px;bottom:26px;font-size:24px;letter-spacing:.1em;color:var(--ink2);opacity:.9}
.cover-tag{position:absolute;left:0;width:1080px;text-align:center;top:1500px;font-size:30px;letter-spacing:.12em}
.cover-title{text-wrap:balance}
.cover-art{position:absolute;overflow:hidden}
.cover-art img{position:absolute;left:-12.5%;top:-12.5%;width:125%;height:125%;object-fit:cover}
.cover-art svg{display:block;width:100%;height:100%}
.red{color:var(--red)}.blue{color:var(--blue)}.sea{color:var(--sea)}.gold{color:var(--gold)}.b{font-weight:700}
.num{font-family:var(--num);font-weight:700}
.stamp{position:absolute;border:4px solid var(--red);border-radius:8px;color:var(--red);font-size:34px;font-weight:700;letter-spacing:.1em;padding:10px 20px;transform:rotate(-7deg);opacity:.82}
.pt{position:absolute;left:96px;width:884px;display:grid;grid-template-columns:78px 1fr;column-gap:16px;align-items:start}
.pt .n{width:56px;height:56px;display:flex;align-items:center;justify-content:center}
.pt h3{font-size:38px;line-height:1.34;font-weight:700;letter-spacing:.5px}
.pt p{font-size:27px;line-height:1.6;color:var(--ink2);margin-top:8px}
.dl{position:absolute;left:104px;width:872px}
.dl .row{position:relative;padding:20px 0 24px 28px}
.dl .row::before{content:"";position:absolute;left:2px;top:36px;width:15px;height:15px;background:var(--red);opacity:.68;transform:rotate(12deg);border-radius:2px}
.dl .row::after{content:"";position:absolute;left:28px;right:0;bottom:0;height:2px;background:linear-gradient(90deg,rgba(45,40,34,.30),rgba(45,40,34,.05) 78%,transparent)}
.dl .t{font-size:34px;font-weight:700}
.dl .d{font-size:27px;color:var(--ink2);margin-top:6px;line-height:1.55}
.cmp{position:absolute;top:596px;height:276px;padding:22px 26px}
.cmp h3{font-size:35px;line-height:1.3;margin-bottom:14px}
.cmp ul{list-style:none}
.cmp li{font-size:27px;line-height:1.6;color:var(--ink2);padding-left:20px;position:relative}
.cmp li::before{content:"";position:absolute;left:2px;top:14px;width:9px;height:9px;background:var(--ink2);opacity:.5;border-radius:1px;transform:rotate(8deg)}
.cmp.win{border-color:var(--red)}
.vs{position:absolute;left:0;width:1080px;text-align:center;top:726px;line-height:1.2;font-family:var(--num);font-weight:700;font-size:38px;color:var(--ink2)}
.sc{position:absolute;padding-top:6px}
.sc .v{font-family:var(--num);font-weight:700;font-size:64px;line-height:1.08;white-space:nowrap}
.sc .v.up{color:var(--red)}
.sc .v.down{color:var(--green)}
.sc .l{font-size:25px;color:var(--ink2);margin-top:12px;line-height:1.5;width:100%}
/* 近 7 个交易日涨跌家数：红涨绿跌的小表格 */
.hist{position:absolute;left:104px;width:872px}
.hist .cap{font-size:26px;color:var(--ink2);line-height:1.5}
.hist .hd{font-size:27px;letter-spacing:.08em;margin-top:8px;color:var(--ink)}
.hist .cols{display:flex;gap:6px;margin-top:16px;padding-top:14px;border-top:2px solid rgba(45,40,34,.26)}
.hist .col{flex:1;text-align:center}
.hist .col .u{font-family:var(--num);font-weight:700;font-size:31px;line-height:1.2;color:var(--red)}
.hist .col .d{font-family:var(--num);font-weight:700;font-size:26px;line-height:1.2;color:var(--green);margin-top:2px}
.hist .col .dt{font-size:20px;color:var(--ink2);margin-top:8px}
.hist .col.today .dt{color:var(--ink);font-weight:700}
/* 数据大数字封面 */
.hero-title{position:absolute;left:0;width:1080px;text-align:center;top:262px;font-size:32px;font-weight:700;letter-spacing:.28em;color:var(--ink2)}
.hero-date{position:absolute;left:0;width:1080px;text-align:center;top:150px;font-size:72px;font-weight:700;letter-spacing:.04em;color:var(--ink)}
.hero{position:absolute;left:104px;top:500px;width:872px}
.hero-row{display:flex;align-items:baseline;gap:24px;line-height:1}
.hero-row + .hero-row{margin-top:26px}
.hero-num{font-family:var(--num);font-weight:700;font-size:210px;letter-spacing:-4px}
.hero-row.up .hero-num{color:var(--red)}
.hero-row.down .hero-num{color:var(--green)}
.hero-lb{font-size:46px;color:var(--ink2)}
.hero-bar{position:absolute;left:104px;top:1020px;width:872px;height:36px;display:flex;overflow:hidden;border:3px solid rgba(45,40,34,.55);border-radius:6px;transform:rotate(-.5deg)}
.hero-bar i{display:block;height:100%}
.hero-bar i.up{background:var(--red)}
.hero-bar i.down{background:var(--green)}
.hero-legend{position:absolute;left:104px;top:1072px;width:872px;display:flex;justify-content:space-between;font-size:28px;color:var(--ink2)}
.hero-legend .up{color:var(--red)}
.hero-legend .down{color:var(--green)}
.hero-sub{position:absolute;left:104px;top:1146px;width:872px;font-size:38px;line-height:1.5;color:var(--ink2)}
.hero-idx{position:absolute;left:104px;top:1262px;width:872px;display:flex;gap:16px}
.hero-idx .hi{flex:1;text-align:center;border-top:2px solid rgba(45,40,34,.25);padding-top:14px}
.hero-idx .hin{display:block;font-size:27px;color:var(--ink2);letter-spacing:.08em}
.hero-idx .hip{display:block;font-family:var(--num);font-weight:700;font-size:46px;line-height:1.2;margin-top:4px}
.up{color:var(--red)}
.down{color:var(--green)}
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
<filter id="rough2" x="-15%" y="-15%" width="130%" height="130%">
<feTurbulence type="fractalNoise" baseFrequency="0.02 0.03" numOctaves="2" seed="4" result="n"/>
<feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G"/>
</filter>
<pattern id="hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(38)">
<line x1="0" y1="0" x2="0" y2="9" stroke="#3a3228" stroke-width="1.2"/>
</pattern>
<pattern id="hatchD" width="5.5" height="5.5" patternUnits="userSpaceOnUse" patternTransform="rotate(42)">
<line x1="0" y1="0" x2="0" y2="5.5" stroke="#2f2a24" stroke-width="1.15"/>
</pattern>
<pattern id="hatchGlow" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
<line x1="0" y1="0" x2="0" y2="10" stroke="#c9612a" stroke-width="1.6"/>
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

// 单行标题自适应字号：手写字体实际字宽约 1.03em，留 2% 余量避免折行压到副标题
function titleFS(title, base = 84) {
  const u = Math.max(1, units(title));
  return Math.max(48, Math.min(base, Math.floor(856 / (u * 1.05))));
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

/* ---------- 手绘画笔：确定性抖动路径，渲染结果每次一致 ---------- */
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function jitterPts(pts, amp, rand, close) {
  const out = [];
  const seg = (x1, y1, x2, y2) => {
    const n = Math.max(1, Math.round(Math.hypot(x2 - x1, y2 - y1) / 64));
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      let x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t;
      if (i < n) { x += (rand() - .5) * amp * 2; y += (rand() - .5) * amp * 2; }
      out.push([x, y]);
    }
  };
  out.push(pts[0]);
  for (let i = 0; i < pts.length - 1; i++) seg(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
  if (close) seg(pts[pts.length - 1][0], pts[pts.length - 1][1], pts[0][0], pts[0][1]);
  return 'M' + out.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' L');
}

function ink(pts, o = {}) {
  const rand = mulberry32(o.seed || 1);
  const d = jitterPts(pts, o.amp == null ? 1.3 : o.amp, rand, !!o.close);
  return `<path d="${d}" fill="${o.fill || 'none'}" stroke="${o.c || '#2d2822'}" stroke-width="${o.w || 3.2}" stroke-linecap="round" stroke-linejoin="round" opacity="${o.op == null ? 1 : o.op}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.cls ? ` class="${o.cls}" style="${o.style || ''}"` : ''}/>`;
}

function inkRect(x, y, w, h, o = {}) {
  return ink([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], { ...o, close: true });
}

function inkCircle(cx, cy, r, o = {}) {
  const rand = mulberry32(o.seed || 3);
  const n = 20, pts = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2;
    const rr = r * (0.95 + (rand() - .5) * 0.09);
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return ink(pts, { ...o, close: true, amp: o.amp == null ? 1.1 : o.amp });
}

function inkArrow(x1, y1, x2, y2, o = {}) {
  const seed = o.seed || 7;
  const d = o.curve
    ? `M${x1},${y1} Q${(x1 + x2) / 2 + o.curve},${(y1 + y2) / 2 - o.curve},${x2},${y2}`
    : jitterPts([[x1, y1], [x2, y2]], 1.1, mulberry32(seed));
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const a1 = ang + Math.PI - 0.42, a2 = ang + Math.PI + 0.42, L = o.head || 17;
  return `<g opacity="${o.op == null ? 1 : o.op}"><path d="${d}" fill="none" stroke="${o.c || '#2d2822'}" stroke-width="${o.w || 3.2}" stroke-linecap="round"/>
<path d="M${(x2 + Math.cos(a1) * L).toFixed(1)},${(y2 + Math.sin(a1) * L).toFixed(1)} L${x2},${y2} L${(x2 + Math.cos(a2) * L).toFixed(1)},${(y2 + Math.sin(a2) * L).toFixed(1)}" fill="none" stroke="${o.c || '#2d2822'}" stroke-width="${o.w || 3.2}" stroke-linecap="round" stroke-linejoin="round"/></g>`;
}

function inkStar(x, y, s, c, op) {
  return `<path d="M${x},${y - s} L${(x + s * .28).toFixed(1)},${(y - s * .28).toFixed(1)} L${x + s},${y} L${(x + s * .28).toFixed(1)},${(y + s * .28).toFixed(1)} L${x},${y + s} L${(x - s * .28).toFixed(1)},${(y + s * .28).toFixed(1)} L${x - s},${y} L${(x - s * .28).toFixed(1)},${(y - s * .28).toFixed(1)} Z" fill="${c || 'none'}" stroke="#2d2822" stroke-width="2.4" stroke-linejoin="round" opacity="${op == null ? 1 : op}"/>`;
}

function inkSparkle(x, y, s, c) {
  return `<g stroke="${c || '#2d2822'}" stroke-width="3" stroke-linecap="round" fill="none" opacity=".7"><path d="M${x},${y - s} L${x},${y + s}"/><path d="M${x - s},${y} L${x + s},${y}"/><path d="M${(x - s * .45).toFixed(1)},${(y - s * .45).toFixed(1)} L${(x + s * .45).toFixed(1)},${(y + s * .45).toFixed(1)}"/><path d="M${(x + s * .45).toFixed(1)},${(y - s * .45).toFixed(1)} L${(x - s * .45).toFixed(1)},${(y + s * .45).toFixed(1)}"/></g>`;
}

function scribble(x1, x2, y, o = {}) {
  const seed = o.seed || 5;
  const n = Math.max(4, Math.round((x2 - x1) / 44));
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const x = x1 + (x2 - x1) * i / n;
    pts.push([x, y + Math.sin(i * 1.6 + seed) * (o.amp || 5)]);
  }
  return ink(pts, { w: o.w || 4, c: o.c || '#b23a2a', op: o.op == null ? .8 : o.op, seed });
}

/* 每屏零星的笔触装饰，固定在页脚上方的空白带，不与正文重叠 */
function sceneDeco(idx) {
  const rand = mulberry32(900 + idx * 37);
  let s = '';
  const n = 2 + Math.floor(rand() * 2);
  for (let i = 0; i < n; i++) {
    const x = 190 + rand() * 700;
    const y = 1400 + rand() * 200;
    s += i % 2 ? inkSparkle(x, y, 9 + rand() * 8, '#5c4e3d') : inkStar(x, y, 7 + rand() * 6, 'none', .4);
  }
  return s;
}

function artLayer(extra, idx) {
  return `<svg class="art" viewBox="0 0 1080 1920">${extra}${sceneDeco(idx)}</svg>`;
}

/* 封面选题表：强信号=标题里写得出的具体实物/品牌（10-12 分），弱信号=题材大类（4 分）。
   不再按表序取第一个命中，而是全部计分后取最高分，避免“机器人/智能”把车企话题抢走 */
const COVER_STRONG = [
  // 品牌、公司、人名（12 分，最高优先级）
  { id: 'car', w: 12, re: /特斯拉|比亚迪|蔚来|小鹏|问界|极氪|智己|理想汽车|小米汽车|SU7/ },
  { id: 'gpu', w: 12, re: /英伟达|Blackwell|H100/ },
  { id: 'speaker', w: 12, re: /黄仁勋|马斯克|奥特曼/ },
  { id: 'rocket', w: 12, re: /SpaceX|星舰|Starship/ },
  // 具体实物（10 分）
  { id: 'rocket', w: 10, re: /火箭|发射|登月|探月|太空|深空|运载/ },
  { id: 'speaker', w: 10, re: /CEO|创始人|董事长|掌门人|发布会|演讲|访谈|掌舵/ },
  { id: 'datacenter', w: 10, re: /数据中心|机房|服务器|算力中心|机柜|集群/ },
  { id: 'gpu', w: 10, re: /显卡|GPU|gpu|算力卡|加速卡/ },
  { id: 'robot', w: 10, re: /机器人|人形|具身|机械臂/ },
  { id: 'laptop', w: 10, re: /端侧|笔记本|平板|PC|终端设备/ },
  { id: 'trophy', w: 10, re: /世界杯|欧洲杯|亚洲杯|奥运会|冬奥|亚运|全运|总决赛|决赛|锦标赛|大奖赛|冠军|夺冠|奖杯|颁奖|金靴|金球奖|NBA|CBA|中超|英超|西甲|意甲|德甲|欧冠/ },
  { id: 'ball', w: 10, re: /足球|篮球|排球|乒乓|羽毛球|网球|台球|高尔夫|球赛|球员|球星|球队|赛场|球场|赛季|转会|进球|射门|扣篮|比赛|对阵|赛事|教练|主场|客场|马拉松|跑|泳|体操|搏击|拳击/ },
  { id: 'oilrig', w: 10, re: /钻井|采油|油田|油气开采/ },
  { id: 'pipeline', w: 10, re: /管道|输气|天然气管|输油/ },
  { id: 'energy', w: 10, re: /原油|石油|天然气|油价|油气|霍尔木兹|海峡|中东|电力|电网|用电|电价|发电|供电|缺电|电站/ },
  { id: 'ship', w: 10, re: /航运|海运|货轮|油轮|邮轮|船|运价|运费|苏伊士|红海/ },
  { id: 'port', w: 10, re: /港口|码头|港区|吞吐|装卸/ },
  { id: 'container', w: 10, re: /集装箱|报关|跨境|出口订单|外贸/ },
  { id: 'train', w: 10, re: /班列|铁路|高铁|轨交|中欧/ },
  { id: 'plane', w: 10, re: /航空|飞机|机场|航班/ },
  { id: 'truck', w: 10, re: /物流|卡车|货车|货运|快递|冷链|配送/ },
  { id: 'chip', w: 10, re: /芯片|半导体|光刻|晶圆|封测/ },
  { id: 'battery', w: 10, re: /电池|储能|电芯|充电桩|锂电/ },
  { id: 'solar', w: 10, re: /光伏|太阳能|硅片|组件/ },
  { id: 'wind', w: 10, re: /风电|风机|海上风电/ },
  { id: 'car', w: 10, re: /汽车|新能源车|电动车|整车|车企|车型|智驾|智能驾驶|自动驾驶/ },
  { id: 'dna', w: 10, re: /基因|细胞|创新药|疫苗|临床/ },
  { id: 'flask', w: 10, re: /科研|实验|实验室|化工/ },
  { id: 'pill', w: 10, re: /医药|药|医疗|器械|医院|健康/ },
  { id: 'house', w: 10, re: /房地产|楼市|楼盘|房价|物业|家居|租房/ },
  { id: 'store', w: 10, re: /门店|商超|连锁|便利|商场|shopping/ },
  { id: 'cart', w: 10, re: /零售|电商|购物|客单|渠道|直播带货/ },
  { id: 'wheat', w: 10, re: /农业|粮食|小麦|玉米|大豆|种植|农产品/ },
  { id: 'mine', w: 10, re: /矿业|矿山|矿产|铜矿|铝|锂矿|稀土|煤炭|铁矿石/ },
  { id: 'water', w: 10, re: /水利|洪水|干旱|水资源/ },
  { id: 'bank', w: 10, re: /银行|信贷|贷款|坏账|保险/ },
  { id: 'coin', w: 10, re: /汇率|人民币|美元|货币|外储|结汇/ },
  { id: 'scale', w: 10, re: /监管|合规|反垄断|处罚|立法|听证/ },
  { id: 'shield', w: 10, re: /防务|军费|网络攻击|防御/ },
  { id: 'lock', w: 10, re: /封锁|管制|禁令|限制出口|脱钩/ },
  { id: 'clock', w: 10, re: /时间表|倒计时|窗口期/ },
  { id: 'network', w: 10, re: /互联网|平台经济/ },
  { id: 'phone', w: 10, re: /手机|App/ },
  { id: 'satellite', w: 10, re: /航天|卫星|北斗|航天器/ },
  { id: 'people', w: 10, re: /人口|就业|工资|社保|养老|教育|劳动者|人才/ },
  { id: 'policy', w: 10, re: /政策|改革|法案|央行|利率|关税|补贴|规划/ },
  { id: 'factory', w: 10, re: /工厂|产线|投产|扩产|产能|制造/ },
  { id: 'bridge', w: 10, re: /基建|桥梁|公路|工程/ },
  { id: 'leaf', w: 10, re: /碳中和|碳达峰|减排|环保|气候/ },
  { id: 'chart', w: 10, re: /股指|市值|财报|营收|净利润|板块|行情|估值|基金|债券/ },
  { id: 'globe', w: 10, re: /出海|国际贸易|全球化/ },
];

// 弱信号：只在没有强信号时起作用，绝不允许把标题里的具体实物挤掉
const COVER_WEAK = [
  { id: 'energy', w: 4, re: /油|能源|伊朗|俄|乌|战争|冲突|制裁|军|地缘/ },
  { id: 'chip', w: 4, re: /算力|大模型|人工智能|AI|智能化/ },
  { id: 'car', w: 4, re: /充电/ },
  { id: 'dna', w: 4, re: /生物/ },
  { id: 'flask', w: 4, re: /研发|材料/ },
  { id: 'house', w: 4, re: /房|楼|土地|租/ },
  { id: 'cart', w: 4, re: /消费|品牌/ },
  { id: 'mine', w: 4, re: /矿|铜|锂|稀土|煤炭|大宗/ },
  { id: 'water', w: 4, re: /水/ },
  { id: 'bank', w: 4, re: /金融/ },
  { id: 'shield', w: 4, re: /安全/ },
  { id: 'clock', w: 4, re: /周期|节奏/ },
  { id: 'network', w: 4, re: /平台|连接|网络|生态/ },
  { id: 'phone', w: 4, re: /移动|终端|用户/ },
  { id: 'people', w: 4, re: /收入/ },
  { id: 'policy', w: 4, re: /国资|国企|会议|目标|制度/ },
  { id: 'factory', w: 4, re: /订单|供应|基地/ },
  { id: 'bridge', w: 4, re: /投资/ },
  { id: 'leaf', w: 4, re: /碳|绿色/ },
  { id: 'chart', w: 4, re: /股|指数|价格|市场|涨|跌|利润|份额/ },
  { id: 'globe', w: 4, re: /全球|世界|国际|贸易/ },
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
  rocket: '火箭发射', speaker: '人物演讲', datacenter: '机房机柜', gpu: '显卡', laptop: '笔记本电脑',
  robot: '人形机器人', trophy: '冠军奖杯', ball: '足球',
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
  rocket: '#b23a2a', speaker: '#b08a3e', datacenter: '#33506f', gpu: '#33506f', laptop: '#2b6b85',
  robot: '#33506f', trophy: '#b08a3e', ball: '#2b6b85',
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
  rocket: 'red', speaker: 'gold', datacenter: 'blue', gpu: 'blue', laptop: 'sea', robot: 'blue',
  trophy: 'gold', ball: 'sea',
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
  rocket: '手绘财经 · 航天观察', speaker: '手绘财经 · 人物观察', datacenter: '手绘财经 · 算力观察',
  gpu: '手绘财经 · 硬件观察', laptop: '手绘财经 · 终端观察', robot: '手绘财经 · 机器人观察',
  trophy: '手绘体育 · 荣誉时刻', ball: '手绘体育 · 赛场观察',
};

const COVER_ART_H = {
  chart: 350, energy: 400, chip: 420, policy: 430, idea: 400, factory: 430, cart: 380,
  pill: 400, house: 420, car: 380, people: 400, globe: 400, port: 380, ship: 360, train: 370,
  plane: 380, truck: 390, container: 400, pipeline: 380, oilrig: 390, battery: 400, solar: 430,
  wind: 400, mine: 380, wheat: 420, water: 420, bank: 400, coin: 400, scale: 400, shield: 440,
  lock: 440, clock: 400, network: 420, phone: 440, satellite: 420, dna: 380, flask: 410,
  store: 400, bridge: 400, leaf: 420,
  rocket: 470, speaker: 460, datacenter: 430, gpu: 420, laptop: 430, robot: 460,
  trophy: 400, ball: 380,
};

const COVER_LAYOUT_NAME = ['居中 · 图在下', '居中 · 图在上', '左对齐 · 图在下'];

/* 按标题生成的插画放在哪个画框：跟封面版式共用一套坐标，尺寸同时用于出图请求 */
function artBox(layout) {
  const l = Number(layout);
  const lay = (l === 0 || l === 1 || l === 2) ? l : 0;
  return lay === 1
    ? { x: 110, y: 300, w: 860, h: 540 }
    : { x: 110, y: 860, w: 860, h: 560 };
}

const COVER_ART_IDS = Object.keys(COVER_ACCENT);
const COVER_STYLES = COVER_ART_IDS.flatMap(id =>
  [0, 1, 2].map(layout => ({
    key: `${id}-${layout}`, motif: id, layout,
    label: COVER_LABEL[id] || id, layoutName: COVER_LAYOUT_NAME[layout],
  })));

function coverArtRaw(theme, top, accent, seed) {
  const n = i => (hash(seed + '#' + i) % 1000) / 1000;
  /* 场景级插画公用画笔：默认带入场动画，t = 延迟秒数 */
  const P = (d, o = {}) => `<path d="${d}" fill="${o.fill || 'none'}" stroke="${o.c || '#2d2822'}" stroke-width="${o.w == null ? 4 : o.w}" stroke-linecap="round" stroke-linejoin="round" opacity="${o.op == null ? 1 : o.op}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''} class="${o.cls || 'f'}" style="--d:${o.t == null ? .5 : o.t}s"/>`;
  const RF = (x, y, w, h, o = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}"${o.rx ? ` rx="${o.rx}"` : ''} fill="${o.fill || 'none'}" stroke="${o.c || '#2d2822'}" stroke-width="${o.w == null ? 4 : o.w}" opacity="${o.op == null ? 1 : o.op}" class="${o.cls || 'f'}" style="--d:${o.t == null ? .5 : o.t}s"/>`;
  const LN = (x1, y1, x2, y2, o = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.c || '#2d2822'}" stroke-width="${o.w == null ? 3 : o.w}" opacity="${o.op == null ? 1 : o.op}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''} class="${o.cls || 'f'}" style="--d:${o.t == null ? .5 : o.t}s"/>`;
  const CI = (x, y, r, o = {}) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${o.fill || 'none'}" stroke="${o.c || '#2d2822'}" stroke-width="${o.w == null ? 4 : o.w}" opacity="${o.op == null ? 1 : o.op}" class="${o.cls || 'f'}" style="--d:${o.t == null ? .5 : o.t}s"/>`;
  if (theme === 'chart') {
    const yb = top + 292;
    const xs = [240, 338, 436, 534, 632, 730, 828];
    const close = xs.map((_, i) => yb - 46 - n(i) * 170);
    const open = close.map((c, i) => c + (n(i + 11) - .5) * 100);
    let s = '';
    [0, 1, 2].forEach(i => s += LN(198, top + 76 + i * 72, 878, top + 76 + i * 72, { w: 2, op: .15, dash: '7 9', t: .22 }));
    s += LN(184, yb, 888, yb, { w: 3.4, op: .55, t: .3 });
    s += LN(184, yb, 184, top + 54, { w: 3.4, op: .55, t: .3 });
    s += LN(184, top + 54, 198, top + 54, { w: 3, op: .5, t: .3 });
    xs.forEach((x, i) => {
      const c = close[i], o = open[i], up = c < o;
      const hi = Math.min(c, o) - 18 - n(i + 21) * 32;
      const lo = Math.max(c, o) + 18 + n(i + 31) * 32;
      const t = (0.4 + i * .07).toFixed(2);
      s += LN(x, hi, x, lo, { w: 2.4, op: .72, t });
      s += RF(x - 17, Math.min(c, o), 34, Math.max(12, Math.abs(c - o)), {
        w: 3, c: up ? '#b23a2a' : '#2d2822', fill: up ? 'rgba(178,58,42,.13)' : PAPER_FILL, t,
      });
    });
    const ma = close.map((c, i) => `${xs[i]},${(c - 30).toFixed(1)}`).join(' ');
    s += `<polyline points="${ma}" fill="none" stroke="${accent}" stroke-width="4.4" stroke-dasharray="12 10" stroke-linecap="round" class="draw" style="--d:1.05s"/>`;
    s += LN(198, yb + 30, 880, yb + 30, { w: 2, op: .2, t: .9 });
    xs.forEach((x, i) => {
      const bh = 10 + n(i + 41) * 28;
      s += RF(x - 11, yb + 30 - bh, 22, bh, { w: 2, op: .55, fill: 'url(#hatchD)', t: (1 + i * .05).toFixed(2) });
    });
    s += CI(xs[6], close[6], 30, { c: accent, w: 2.6, dash: '8 7', t: 1.35 });
    return s;
  }
  if (theme === 'energy') {
    const b = top + 336;
    const ray = (x, y, r) => {
      let g = '';
      for (let i = 0; i < 8; i++) {
        const a = Math.PI * 2 * i / 8;
        g += LN((x + Math.cos(a) * (r + 10)).toFixed(1), (y + Math.sin(a) * (r + 10)).toFixed(1), (x + Math.cos(a) * (r + 30)).toFixed(1), (y + Math.sin(a) * (r + 30)).toFixed(1), { c: accent, w: 3, t: .55 });
      }
      return g;
    };
    let vents = '';
    for (let i = 0; i < 3; i++) vents += LN(424, b - 40 + i * 13, 462, b - 40 + i * 13, { w: 2.4, op: .5, t: .8 });
    return LN(180, b, 900, b, { w: 4, t: .3 }) +
      P(`M186 ${b - 16} H480`, { w: 4, t: .34 }) +
      P(`M262 ${b - 16} L314 ${b - 152}`, { w: 5, t: .42 }) +
      P(`M424 ${b - 16} L366 ${b - 152}`, { w: 5, t: .46 }) +
      P(`M186 ${b - 182} L500 ${b - 150}`, { w: 6.5, t: .55 }) +
      P(`M186 ${b - 182} q-28 26 0 52`, { w: 5.5, t: .62 }) +
      LN(186, b - 130, 186, b - 76, { w: 2.4, op: .7, t: .7 }) +
      RF(168, b - 76, 36, 28, { w: 3.4, fill: PAPER_FILL, t: .74 }) +
      CI(372, b - 64, 42, { w: 5, t: .6 }) +
      CI(372, b - 64, 10, { fill: accent, c: accent, t: .68 }) +
      LN(372, b - 64, 348, b - 96, { w: 3.2, t: .72 }) +
      P(`M372 ${b - 64} l50 30 l-16 26 Z`, { w: 3, fill: 'url(#hatchD)', op: .8, t: .8 }) +
      RF(414, b - 52, 66, 52, { rx: 6, w: 4, fill: PAPER_FILL, t: .78 }) +
      vents +
      LN(500, b - 26, 706, b - 26, { w: 13, op: .82, t: .9 }) +
      LN(500, b - 26, 706, b - 26, { w: 5, c: '#f6eedc', t: .94 }) +
      RF(560, b - 40, 12, 28, { w: 3, fill: PAPER_FILL, t: .98 }) +
      RF(650, b - 40, 12, 28, { w: 3, fill: PAPER_FILL, t: 1 }) +
      CI(608, b - 76, 24, { w: 4, t: 1.05 }) +
      LN(608, b - 100, 608, b - 52, { w: 3.4, t: 1.08 }) +
      LN(586, b - 76, 630, b - 76, { w: 3.4, t: 1.08 }) +
      RF(718, b - 100, 138, 100, { rx: 10, w: 4.4, fill: PAPER_FILL, t: 1.02 }) +
      `<ellipse cx="787" cy="${b - 100}" rx="69" ry="14" fill="none" stroke="#2d2822" stroke-width="3.4" class="f" style="--d:1.06s"/>` +
      LN(760, b - 68, 814, b - 68, { w: 3, op: .5, t: 1.1 }) +
      LN(760, b - 44, 796, b - 44, { w: 3, op: .5, t: 1.12 }) +
      CI(820, top + 78, 40, { c: accent, w: 4, t: .35 }) +
      ray(820, top + 78, 40) +
      P(`M172 ${top + 96} q22 -20 44 0 q22 -18 44 0`, { w: 3, op: .45, t: .9 }) +
      P(`M600 ${top + 84} q18 -16 36 0 q18 -14 36 0`, { w: 3, op: .35, t: 1.05 }) +
      CI(520, top + 66, 7, { fill: accent, c: accent, t: 1.2 }) +
      CI(560, top + 104, 5, { fill: accent, c: accent, t: 1.26 });
  }
  if (theme === 'chip') {
    const cx = 540, cy = top + 190, s = 138;
    let pins = '';
    for (let i = 0; i < 5; i++) {
      const p = cx - 96 + i * 48;
      const q = cy - 96 + i * 48;
      pins += `<line x1="${p}" y1="${cy - s}" x2="${p}" y2="${cy - s - 34}" stroke="#2d2822" stroke-width="4" class="f" style="--d:.5s"/>
<line x1="${p}" y1="${cy + s}" x2="${p}" y2="${cy + s + 34}" stroke="#2d2822" stroke-width="4" class="f" style="--d:.5s"/>
<line x1="${cx - s}" y1="${q}" x2="${cx - s - 34}" y2="${q}" stroke="#2d2822" stroke-width="4" class="f" style="--d:.5s"/>
<line x1="${cx + s}" y1="${q}" x2="${cx + s + 34}" y2="${q}" stroke="#2d2822" stroke-width="4" class="f" style="--d:.5s"/>`;
    }
    let inner = '';
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      inner += `<rect x="${cx - 66 + c * 46}" y="${cy - 66 + r * 46}" width="30" height="30" fill="none" stroke="#2d2822" stroke-width="3" opacity=".5" class="f" style="--d:${(0.62 + (r + c) * 0.05).toFixed(2)}s"/>`;
    }
    const traces = `<path d="M${cx + s + 34} ${cy - 48} H${cx + s + 104} V${cy + 30} H${cx + s + 176}" fill="none" stroke="${accent}" stroke-width="4" stroke-linejoin="round" class="draw" style="--d:.95s"/>
<path d="M${cx + s + 34} ${cy + 56} H${cx + s + 76} V${cy + 152} H${cx + s + 176}" fill="none" stroke="${accent}" stroke-width="4" stroke-linejoin="round" class="draw" style="--d:1.05s"/>
<path d="M${cx - s - 34} ${cy + 2} H${cx - s - 96} V${cy - 88}" fill="none" stroke="${accent}" stroke-width="4" stroke-linejoin="round" class="draw" style="--d:1.15s"/>
<circle cx="${cx + s + 176}" cy="${cy + 30}" r="9" fill="${accent}" class="f" style="--d:1.25s"/>
<circle cx="${cx + s + 176}" cy="${cy + 152}" r="9" fill="${accent}" class="f" style="--d:1.32s"/>
<circle cx="${cx - s - 96}" cy="${cy - 88}" r="9" fill="${accent}" class="f" style="--d:1.4s"/>`;
    return `<rect x="${cx - s}" y="${cy - s}" width="${s * 2}" height="${s * 2}" rx="22" fill="none" stroke="#2d2822" stroke-width="5" class="f" style="--d:.35s"/>
<rect x="${cx - s + 26}" y="${cy - s + 26}" width="${s * 2 - 52}" height="${s * 2 - 52}" rx="10" fill="none" stroke="#2d2822" stroke-width="2.6" opacity=".45" class="f" style="--d:.45s"/>
<circle cx="${cx - s + 22}" cy="${cy - s + 22}" r="7" fill="${accent}" class="f" style="--d:.55s"/>
${pins}${inner}${traces}
<line x1="${cx - 96}" y1="${cy + 92}" x2="${cx - 96}" y2="${cy + 106}" stroke="#2d2822" stroke-width="2" opacity=".4"/>
<line x1="${cx + 96}" y1="${cy + 92}" x2="${cx + 96}" y2="${cy + 106}" stroke="#2d2822" stroke-width="2" opacity=".4"/>`;
  }
  if (theme === 'policy') {
    const bx = 316, by = top + 30, bw = 448, bh = 386;
    const sx = bx + bw - 96, sy = by + 298;
    let star = '';
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5;
      const rr = i % 2 ? 10 : 24;
      star += (i ? 'L' : 'M') + (sx + Math.cos(a) * rr).toFixed(1) + ' ' + (sy + Math.sin(a) * rr).toFixed(1);
    }
    star += ' Z';
    return `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="none" stroke="#2d2822" stroke-width="5" class="f" style="--d:.35s"/>
<path d="M${bx + bw - 72} ${by} L${bx + bw} ${by + 72} L${bx + bw - 72} ${by + 72} Z" fill="none" stroke="#2d2822" stroke-width="4" class="f" style="--d:.5s"/>
<line x1="${bx + 42}" y1="${by + 48}" x2="${bx + 238}" y2="${by + 48}" stroke="#2d2822" stroke-width="8" class="f" style="--d:.62s"/>
<line x1="${bx + 42}" y1="${by + 80}" x2="${bx + 162}" y2="${by + 80}" stroke="#2d2822" stroke-width="5" opacity=".5" class="f" style="--d:.7s"/>
<line x1="${bx + 42}" y1="${by + 114}" x2="${bx + bw - 42}" y2="${by + 114}" stroke="#2d2822" stroke-width="2" opacity=".22" class="f" style="--d:.78s"/>
${[0, 1, 2, 3, 4].map(i => `<line x1="${bx + 42}" y1="${by + 158 + i * 38}" x2="${bx + bw - 42 - (i === 4 ? 128 : i === 3 ? 46 : 0)}" y2="${by + 158 + i * 38}" stroke="#5c4e3d" stroke-width="3.4" opacity=".55" class="f" style="--d:${(0.85 + i * 0.07).toFixed(2)}s"/>`).join('')}
<g class="f" style="--d:1.15s" transform="rotate(-9 ${sx} ${sy})">
<circle cx="${sx}" cy="${sy}" r="56" fill="none" stroke="#b23a2a" stroke-width="4.6" opacity=".78"/>
<circle cx="${sx}" cy="${sy}" r="43" fill="none" stroke="#b23a2a" stroke-width="2.2" opacity=".55"/>
<path d="${star}" fill="#b23a2a" opacity=".72"/>
</g>
<g class="f" style="--d:1.35s" transform="translate(180,${top + 340}) rotate(-34)">
<rect x="0" y="-12" width="188" height="24" rx="6" fill="none" stroke="#2d2822" stroke-width="4"/>
<path d="M188 -12 L232 0 L188 12 Z" fill="none" stroke="#2d2822" stroke-width="4" stroke-linejoin="round"/>
<line x1="16" y1="-4" x2="106" y2="-4" stroke="${accent}" stroke-width="2.4" opacity=".6"/>
<line x1="232" y1="0" x2="252" y2="0" stroke="#2d2822" stroke-width="3"/>
</g>`;
  }
  if (theme === 'globe') {
    const cx = 540, cy = top + 196, r = 152;
    let s = '';
    s += CI(cx, cy, r, { w: 5, fill: PAPER_FILL, t: .35 });
    [-0.58, 0, 0.58].forEach((k, i) => {
      s += `<ellipse cx="${cx}" cy="${(cy + k * r).toFixed(1)}" rx="${(r * Math.sqrt(1 - k * k)).toFixed(1)}" ry="${(r * 0.15).toFixed(1)}" fill="none" stroke="#2d2822" stroke-width="2.2" opacity=".28" class="f" style="--d:${(0.5 + i * .06).toFixed(2)}s"/>`;
    });
    [-0.56, 0, 0.56].forEach((k, i) => {
      s += `<ellipse cx="${cx}" cy="${cy}" rx="${Math.abs(k * r).toFixed(1)}" ry="${r}" fill="none" stroke="#2d2822" stroke-width="2.2" opacity=".24" class="f" style="--d:${(0.56 + i * .06).toFixed(2)}s"/>`;
    });
    s += P(`M${cx - 100} ${cy - 96} q36 -28 70 -8 q22 14 6 36 q-12 18 -42 14 q-32 -6 -34 -42 Z`, { fill: 'rgba(45,40,34,.10)', w: 3, t: .72 });
    s += P(`M${cx - 76} ${cy + 18} q30 -18 52 6 q16 20 -4 40 q-22 24 -48 6 q-18 -16 0 -52 Z`, { fill: 'rgba(45,40,34,.10)', w: 3, t: .82 });
    s += P(`M${cx + 34} ${cy - 74} q42 -20 68 8 q16 18 -8 40 q-24 22 -52 4 q-16 -16 -8 -52 Z`, { fill: 'rgba(45,40,34,.10)', w: 3, t: .92 });
    s += P(`M${cx - r} ${cy - 92} Q${cx - 40} ${cy - 226} ${cx + 92} ${cy - 112}`, { c: accent, w: 3.6, dash: '11 10', t: 1, cls: 'draw' });
    s += P(`M${cx + 62} ${cy + 132} Q${cx + 152} ${cy + 62} ${cx + 198} ${cy - 28}`, { c: accent, w: 3.6, dash: '11 10', t: 1.12, cls: 'draw' });
    s += P(`M${cx + 92} ${cy - 112} l24 -9 l-7 21 Z`, { fill: accent, c: accent, w: 2, t: 1.32 });
    s += CI(cx - r, cy - 92, 8, { fill: accent, c: accent, t: 1.2 });
    s += CI(cx + 198, cy - 28, 7, { fill: accent, c: accent, t: 1.36 });
    s += `<ellipse cx="${cx}" cy="${cy}" rx="${r + 62}" ry="${(r * 0.42).toFixed(1)}" fill="none" stroke="${accent}" stroke-width="2.4" stroke-dasharray="9 13" opacity=".45" transform="rotate(-16 ${cx} ${cy})" class="f" style="--d:1.16s"/>`;
    s += CI(cx + 132, cy - 156, 6, { fill: '#5c4e3d', c: '#5c4e3d', t: 1.42 });
    return s;
  }
  if (theme === 'port') {
    const b = top + 352;
    const rib = (x, y, w, h, c) => RF(x, y, w, h, { w: 3.4, c: c || '#2d2822', fill: PAPER_FILL }) +
      [1, 2, 3].map(i => LN(x + w * i / 4, y + 6, x + w * i / 4, y + h - 6, { w: 2, op: .4 })).join('');
    let s = '';
    s += P(`M170 ${b + 26} Q230 ${b + 6} 290 ${b + 26} T410 ${b + 26} T530 ${b + 26} T650 ${b + 26} T770 ${b + 26} T890 ${b + 26}`, { c: accent, w: 3.6, t: .3 });
    s += P(`M196 ${b + 56} Q256 ${b + 38} 316 ${b + 56} T436 ${b + 56} T556 ${b + 56} T676 ${b + 56} T796 ${b + 56}`, { c: accent, w: 3, op: .6, t: .38 });
    s += RF(186, b - 40, 706, 28, { w: 4.4, fill: 'rgba(45,40,34,.05)', t: .34 });
    [1, 2, 3, 4, 5, 6].forEach(i => s += LN(210 + i * 110, b - 36, 210 + i * 110, b - 16, { w: 2, op: .22 }));
    s += rib(628, b - 98, 118, 58);
    s += rib(752, b - 98, 118, 58);
    s += rib(690, b - 158, 118, 58, accent);
    s += rib(628, b - 158, 56, 58);
    s += LN(300, b - 40, 322, b - 302, { w: 6.5, t: .46 });
    s += LN(382, b - 40, 358, b - 302, { w: 6.5, t: .46 });
    s += LN(468, b - 40, 452, b - 302, { w: 5, op: .65, t: .5 });
    s += LN(548, b - 40, 528, b - 302, { w: 5, op: .65, t: .5 });
    s += LN(312, b - 40, 366, b - 40, { w: 4, t: .5 });
    s += LN(312, b - 168, 364, b - 168, { w: 3, op: .6, t: .56 });
    s += LN(312, b - 168, 358, b - 108, { w: 2.6, op: .35, t: .6 });
    s += LN(366, b - 168, 322, b - 108, { w: 2.6, op: .35, t: .6 });
    s += LN(306, b - 306, 560, b - 306, { w: 6.5, t: .62 });
    s += LN(522, b - 302, 826, b - 244, { w: 6, t: .7 });
    s += LN(556, b - 306, 706, b - 272, { w: 2.4, op: .45, t: .78 });
    s += RF(560, b - 298, 46, 38, { w: 3.6, fill: PAPER_FILL, t: .74 });
    s += LN(568, b - 290, 598, b - 290, { w: 2, op: .4 });
    s += RF(694, b - 268, 46, 32, { w: 3.6, fill: PAPER_FILL, t: .8 });
    s += LN(717, b - 236, 717, b - 158, { w: 2.4, t: .86 });
    s += P(`M705 ${b - 158} q12 16 24 0`, { w: 3, t: .9 });
    s += rib(676, b - 156, 78, 50, accent);
    s += LN(490, b - 300, 490, b - 244, { w: 3, op: .5 });
    s += CI(212, b - 52, 7, { w: 3, t: .7 });
    s += CI(860, b - 52, 7, { w: 3, t: .72 });
    s += P(`M214 ${b - 300} q14 -12 28 0 q14 -10 28 0`, { w: 2.6, op: .45, t: 1 });
    s += P(`M700 ${b - 380} q12 -10 24 0 q12 -8 24 0`, { w: 2.6, op: .35, t: 1.1 });
    return s;
  }
  if (theme === 'ship') {
    const b = top + 282;
    let boxes = '';
    const boxAt = (x, y) => `<rect x="${x}" y="${y}" width="84" height="54" fill="none" stroke="#2d2822" stroke-width="3.4"/>
<line x1="${x + 28}" y1="${y}" x2="${x + 28}" y2="${y + 54}" stroke="#2d2822" stroke-width="2.2" opacity=".4"/>
<line x1="${x + 56}" y1="${y}" x2="${x + 56}" y2="${y + 54}" stroke="#2d2822" stroke-width="2.2" opacity=".4"/>`;
    for (let i = 0; i < 4; i++) boxes += boxAt(340 + i * 90, b - 152);
    for (let i = 0; i < 3; i++) boxes += boxAt(385 + i * 90, b - 208);
    return `<path d="M238 ${b - 98} H796 Q858 ${b - 98} 874 ${b - 6} H230 Q238 ${b - 98} 238 ${b - 98} Z" fill="none" stroke="#2d2822" stroke-width="5" stroke-linejoin="round" class="f" style="--d:.35s"/>
<line x1="236" y1="${b - 34}" x2="866" y2="${b - 34}" stroke="#b23a2a" stroke-width="4" opacity=".5" class="f" style="--d:.5s"/>
<rect x="248" y="${b - 198}" width="84" height="102" fill="none" stroke="#2d2822" stroke-width="4" class="f" style="--d:.45s"/>
<line x1="248" y1="${b - 160}" x2="332" y2="${b - 160}" stroke="#2d2822" stroke-width="2.4" opacity=".45"/>
${[266, 290, 314].map(x => `<circle cx="${x}" cy="${b - 178}" r="6" fill="none" stroke="#2d2822" stroke-width="2.6"/>`).join('')}
<rect x="266" y="${b - 238}" width="28" height="40" fill="none" stroke="#2d2822" stroke-width="3.4" class="f" style="--d:.6s"/>
<path d="M296 ${b - 230} q20 -18 36 -2 q14 -14 30 2" fill="none" stroke="#2d2822" stroke-width="3" opacity=".5" class="f" style="--d:.75s"/>
${boxes}
<line x1="748" y1="${b - 98}" x2="748" y2="${b - 268}" stroke="#2d2822" stroke-width="4" class="f" style="--d:.8s"/>
<line x1="712" y1="${b - 236}" x2="784" y2="${b - 236}" stroke="#2d2822" stroke-width="3.4" class="f" style="--d:.9s"/>
<circle cx="748" cy="${b - 272}" r="7" fill="${accent}" class="f" style="--d:1s"/>
${[398, 476, 554, 632, 710].map(x => `<circle cx="${x}" cy="${b - 62}" r="7" fill="none" stroke="#2d2822" stroke-width="2.8" opacity=".7"/>`).join('')}
<path d="M150 ${b + 14} Q216 ${b - 6} 282 ${b + 14} T414 ${b + 14} T546 ${b + 14} T678 ${b + 14} T810 ${b + 14} T942 ${b + 14}" fill="none" stroke="${accent}" stroke-width="4" stroke-linecap="round" class="draw" style="--d:1s"/>
<path d="M186 ${b + 52} Q252 ${b + 32} 318 ${b + 52} T450 ${b + 52} T582 ${b + 52} T714 ${b + 52} T846 ${b + 52}" fill="none" stroke="${accent}" stroke-width="3.6" stroke-linecap="round" opacity=".65" class="draw" style="--d:1.15s"/>
<path d="M228 ${top + 52} q12 -14 24 0 q12 -14 24 0" fill="none" stroke="#2d2822" stroke-width="3" stroke-linecap="round" opacity=".6" class="f" style="--d:1.2s"/>
<path d="M806 ${top + 92} q10 -12 20 0 q10 -12 20 0" fill="none" stroke="#2d2822" stroke-width="2.8" stroke-linecap="round" opacity=".5" class="f" style="--d:1.3s"/>`;
  }
  if (theme === 'train') {
    const b = top + 338;
    let s = '';
    s += LN(150, b, 930, b, { w: 4, t: .28 });
    s += LN(150, b + 20, 930, b + 20, { w: 4, t: .32 });
    for (let i = 0; i < 11; i++) s += LN(180 + i * 68, b, 180 + i * 68, b + 20, { w: 3, op: .45, t: .36 });
    [236, 504, 772].forEach(x => {
      s += LN(x, b, x, b - 266, { w: 4.4, t: .42 });
      s += LN(x - 36, b - 266, x + 36, b - 266, { w: 3, t: .46 });
    });
    s += P(`M236 ${b - 258} Q370 ${b - 232} 504 ${b - 258} T772 ${b - 258}`, { w: 2.6, op: .5, t: .5 });
    s += P(`M430 ${b - 28} V${b - 178} H278 Q250 ${b - 178} 242 ${b - 158} L212 ${b - 64} Q206 ${b - 28} 232 ${b - 28} Z`, { w: 5.4, fill: PAPER_FILL, t: .56 });
    s += P(`M250 ${b - 162} L288 ${b - 170} V${b - 130} H242 Z`, { w: 3.2, fill: '#f6eedc', t: .66 });
    s += RF(302, b - 166, 112, 34, { w: 3, fill: '#f6eedc', t: .7 });
    s += LN(216, b - 96, 430, b - 96, { c: accent, w: 6, t: .74 });
    s += CI(224, b - 64, 7, { fill: accent, c: accent, t: .8 });
    s += LN(352, b - 178, 352, b - 210, { w: 3.4, t: .64 });
    s += P(`M352 ${b - 210} l-14 -24 l28 -6 l-14 -20`, { w: 2.8, op: .7, t: .68 });
    const car = (x, w, t) => {
      let g = RF(x, b - 178, w, 150, { w: 4.8, fill: PAPER_FILL, t });
      g += LN(x + 6, b - 172, x + w - 6, b - 172, { w: 2.4, op: .4, t: t + .04 });
      for (let i = 0; i < 4; i++) g += RF(x + 18 + i * (w - 36) / 4, b - 154, 34, 30, { w: 2.6, fill: '#f6eedc', t: t + .06 + i * .02 });
      g += LN(x + w / 2, b - 172, x + w / 2, b - 30, { w: 2.6, op: .45, t: t + .12 });
      g += LN(x + 10, b - 92, x + w - 10, b - 92, { c: accent, w: 4.6, op: .8, t: t + .14 });
      [x + 40, x + w - 40].forEach(wx => {
        g += CI(wx, b - 4, 12, { w: 3.4, t: t + .16 });
        g += CI(wx, b - 4, 4, { fill: '#2d2822', c: '#2d2822', t: t + .18 });
      });
      return g;
    };
    s += car(440, 210, .78);
    s += car(660, 210, .86);
    s += LN(430, b - 78, 440, b - 78, { w: 4, op: .6, t: .9 });
    s += LN(650, b - 78, 660, b - 78, { w: 4, op: .6, t: .94 });
    [150, 176, 202].forEach((x, i) => s += LN(x, b - 150 + i * 26, x + 34, b - 150 + i * 26, { w: 3, op: .35 - i * .05, t: 1.05 + i * .03 }));
    return s;
  }
  if (theme === 'plane') {
    const b = top + 268;
    let s = '';
    s += P(`M206 ${b - 22} Q206 ${b - 66} 250 ${b - 74} H770 Q836 ${b - 74} 866 ${b - 28} Q870 ${b - 10} 844 ${b - 6} H250 Q210 ${b - 6} 206 ${b - 22} Z`, { w: 5.4, fill: PAPER_FILL, t: .36 });
    s += P(`M430 ${b + 2} L330 ${b + 128} H466 L566 ${b + 2} Z`, { w: 4.6, fill: PAPER_FILL, t: .5 });
    s += P(`M392 ${b + 92} q0 -26 26 -26 h96 q24 0 24 26 v22 h-146 Z`, { w: 4.2, fill: PAPER_FILL, t: .62 });
    s += CI(454, b + 92, 16, { w: 3, t: .7 });
    s += LN(454, b + 76, 454, b + 108, { w: 2.4, op: .5, t: .74 });
    s += P(`M268 ${b - 72} L212 ${b - 186} H286 L344 ${b - 74}`, { w: 5, fill: PAPER_FILL, t: .56 });
    s += P(`M250 ${b - 74} L196 ${b - 96} H236 L296 ${b - 78}`, { w: 3.6, op: .8, t: .64 });
    s += LN(300, b - 46, 812, b - 46, { c: accent, w: 5, op: .75, t: .72 });
    for (let i = 0; i < 13; i++) s += CI(320 + i * 38, b - 46, 5, { w: 2.2, fill: '#f6eedc', t: .76 + i * .012 });
    s += RF(800, b - 62, 26, 20, { w: 2.4, t: .9 });
    s += RF(756, b - 62, 26, 20, { w: 2.4, t: .92 });
    s += P(`M150 ${b + 160} q40 -22 80 0 q40 -18 80 0`, { w: 3, op: .4, t: .9 });
    s += P(`M700 ${b + 150} q34 -18 68 0 q34 -16 68 0`, { w: 3, op: .35, t: 1 });
    s += P(`M160 ${b - 130} Q360 ${b - 196} 540 ${b - 238}`, { c: accent, w: 3.4, dash: '11 11', t: .85, cls: 'draw' });
    s += CI(540, b - 238, 7, { fill: accent, c: accent, t: 1.2 });
    return s;
  }
  if (theme === 'truck') {
    const b = top + 300;
    let s = '';
    s += RF(196, b - 252, 384, 176, { w: 5, fill: PAPER_FILL, t: .36 });
    s += LN(196, b - 232, 580, b - 232, { w: 2.6, op: .35, t: .42 });
    s += RF(222, b - 216, 118, 66, { w: 3, t: .48 });
    s += LN(238, b - 184, 320, b - 184, { c: accent, w: 5, t: .52 });
    s += LN(238, b - 160, 300, b - 160, { c: accent, w: 3.4, op: .6, t: .55 });
    s += RF(370, b - 216, 118, 66, { w: 3, t: .5 });
    s += LN(386, b - 184, 468, b - 184, { w: 3.4, op: .5, t: .54 });
    s += LN(386, b - 160, 448, b - 160, { w: 3.4, op: .4, t: .57 });
    s += LN(560, b - 252, 560, b - 80, { w: 3, op: .4, t: .46 });
    s += LN(196, b - 96, 580, b - 96, { w: 3.4, op: .55, t: .58 });
    s += P(`M586 ${b - 30} V${b - 226} H664 Q678 ${b - 226} 684 ${b - 214} L760 ${b - 168} Q770 ${b - 162} 772 ${b - 148} V${b - 30} Z`, { w: 5, fill: PAPER_FILL, t: .62 });
    s += P(`M604 ${b - 208} H658 V${b - 158} H604 Z`, { w: 3, fill: '#f6eedc', t: .7 });
    s += P(`M686 ${b - 204} L744 ${b - 170} V${b - 150} H686 Z`, { w: 3, fill: '#f6eedc', t: .74 });
    s += LN(600, b - 136, 772, b - 136, { c: accent, w: 5, op: .7, t: .78 });
    s += LN(700, b - 128, 764, b - 128, { w: 3, op: .6, t: .8 });
    s += CI(752, b - 92, 9, { fill: accent, c: accent, t: .86 });
    s += RF(590, b - 74, 22, 44, { w: 3, op: .6, t: .82 });
    s += LN(586, b - 212, 586, b - 244, { w: 4, t: .78 });
    [300, 380, 690, 750].forEach((x, i) => {
      s += CI(x, b - 20, 32, { w: 5, t: .84 + i * .03 });
      s += CI(x, b - 20, 12, { w: 3, t: .9 + i * .03 });
    });
    s += LN(150, b + 34, 930, b + 34, { c: accent, w: 4, dash: '18 16', t: 1, cls: 'draw' });
    [160, 188].forEach((x, i) => s += LN(x, b - 180 + i * 30, x + 28, b - 180 + i * 30, { w: 3, op: .35 - i * .06, t: 1.1 + i * .04 }));
    s += RF(824, b - 120, 52, 52, { w: 3.4, t: .96 });
    s += LN(838, b - 120, 862, b - 120, { w: 2.4, op: .5 });
    return s;
  }
  if (theme === 'container') {
    const b = top + 352;
    const box = (x, y, w, h, c, t) => {
      let g = RF(x, y, w, h, { w: 3.6, c: c || '#2d2822', fill: PAPER_FILL, t });
      for (let i = 1; i < 6; i++) g += LN(x + w * i / 6, y + 7, x + w * i / 6, y + h - 7, { w: 2, op: .38, t });
      g += LN(x + 8, y + h - 12, x + w - 8, y + h - 12, { w: 2, op: .25, t });
      return g;
    };
    let s = '';
    s += LN(150, b, 930, b, { w: 4, t: .3 });
    s += box(214, b - 96, 300, 96, '', .42);
    s += box(222, b - 192, 300, 96, '', .5);
    s += box(230, b - 288, 300, 96, accent, .58);
    s += box(540, b - 96, 220, 96, '', .46);
    s += box(548, b - 192, 220, 96, '', .54);
    s += LN(776, b, 792, b - 330, { w: 6, t: .6 });
    s += LN(886, b, 866, b - 330, { w: 6, t: .6 });
    s += LN(790, b - 330, 890, b - 330, { w: 6.5, t: .66 });
    s += LN(150, b - 342, 900, b - 342, { w: 6.5, t: .72 });
    s += LN(176, b - 342, 176, b - 300, { w: 3, op: .5 });
    s += RF(452, b - 372, 62, 30, { w: 3.6, fill: PAPER_FILL, t: .8 });
    s += LN(483, b - 372, 483, b - 330, { w: 2.8, t: .84 });
    s += RF(446, b - 330, 74, 26, { w: 3.2, fill: PAPER_FILL, t: .88 });
    s += CI(783, b - 24, 8, { w: 2.6, t: .9 });
    s += CI(875, b - 24, 8, { w: 2.6, t: .92 });
    s += LN(820, b - 342, 820, b - 386, { w: 3, op: .5, t: .94 });
    s += CI(820, b - 392, 7, { fill: accent, c: accent, t: .98 });
    return s;
  }
  if (theme === 'pipeline') {
    const y = top + 172, g = top + 306;
    const run = `M158 ${y} H700 Q724 ${y} 724 ${y + 24} V${y + 100} Q724 ${y + 124} 748 ${y + 124} H906`;
    let s = LN(150, g, 930, g, { w: 4, t: .3 });
    [0, 1, 2].forEach(i => s += LN(196 + i * 8, g + 60 + i * 10, 900 - i * 12, g + 60 + i * 10, { w: 2, op: .22, dash: '12 14', t: .38 + i * .03 }));
    s += P(run, { w: 24, t: .45 }) + P(run, { w: 10, c: '#f6eedc', t: .5 });
    [252, 470].forEach((x, i) => s += P(`M${x - 34} ${y + 10} L${x} ${g} L${x + 34} ${y + 10}`, { w: 3.4, op: .8, t: .6 + i * .05 }));
    s += P(`M742 ${y + 64} L786 ${g} M742 ${y + 64} L700 ${g}`, { w: 3.4, op: .7, t: .72 });
    [330, 604].forEach((x, i) => {
      s += LN(x, y - 16, x, y + 16, { w: 4.4, t: .62 + i * .06 });
      s += LN(x - 8, y - 16, x - 8, y + 16, { w: 2.4, op: .6, t: .64 + i * .06 });
    });
    s += CI(560, y, 30, { w: 4.4, t: .8 }) + CI(560, y, 9, { fill: accent, c: accent, t: .86 });
    s += LN(560, y - 30, 560, y - 66, { w: 3.6, t: .84 });
    s += `<ellipse cx="560" cy="${y - 72}" rx="38" ry="11" fill="none" stroke="#2d2822" stroke-width="3.6" class="f" style="--d:.88s"/>`;
    s += LN(560, y - 83, 560, y - 61, { w: 2.6, op: .75, t: .9 });
    s += LN(522, y - 72, 598, y - 72, { w: 2.6, op: .75, t: .9 });
    s += LN(252, y - 82, 252, y - 46, { w: 2.4, op: .7, t: .9 });
    s += CI(252, y - 104, 22, { w: 3.4, t: .94 });
    s += LN(252, y - 104, 265, y - 117, { w: 2.4, c: accent, t: .98 });
    [212, 262, 312].forEach((x, i) => s += P(`M${x} ${y - 15} l17 15 l-17 15`, { w: 3.4, c: accent, t: .7 + i * .05 }));
    s += P(`M196 ${g + 60} q22 -16 44 0`, { w: 2.6, op: .3, t: 1.05 });
    s += P(`M330 ${g + 50} q18 -12 36 0`, { w: 2.4, op: .25, t: 1.1 });
    s += CI(846, g + 56, 8, { w: 2.4, op: .35, t: 1.12 });
    s += CI(660, g + 30, 6, { w: 2.4, op: .3, t: 1.14 });
    return s;
  }
  if (theme === 'oilrig') {
    const w = top + 312, d = top + 206;
    let s = '';
    s += P(`M126 ${w} q34 -24 68 0 t68 0 t68 0 t68 0 t68 0`, { c: accent, w: 4, t: .3 });
    s += P(`M192 ${w + 42} q34 -24 68 0 t68 0 t68 0 t68 0`, { c: accent, w: 3.2, op: .5, t: .36 });
    [366, 448, 632, 714].forEach((x, i) => s += LN(x, d + 30, x + (i < 2 ? -12 : 12), w + 76, { w: 5, op: .9, t: .42 + i * .03 }));
    s += P(`M376 ${d + 66} L704 ${d + 128} M704 ${d + 66} L376 ${d + 128}`, { w: 3, op: .5, t: .58 });
    s += P(`M448 ${d + 66} L632 ${d + 128} M632 ${d + 66} L448 ${d + 128}`, { w: 2.6, op: .38, t: .62 });
    s += RF(318, d, 444, 30, { w: 4.4, fill: PAPER_FILL, t: .5 });
    s += RF(346, d - 32, 388, 32, { w: 3.2, fill: PAPER_FILL, t: .56 });
    s += P(`M452 ${d - 32} L506 ${top + 26} L606 ${top + 26} L660 ${d - 32}`, { w: 4.6, t: .62 });
    s += P(`M470 ${d - 32} L540 ${top + 26} M540 ${top + 26} L644 ${d - 32}`, { w: 2.8, op: .45, t: .68 });
    [0, 1, 2].forEach(i => {
      const y1 = d - 52 - i * 40, y2 = y1 - 40;
      const l1 = 468 - i * 12, l2 = 612 + i * 12;
      s += LN(l1, y1, l2 - 14, y2, { w: 2.6, op: .4, t: .7 + i * .04 });
      s += LN(l2, y1, l1 + 14, y2, { w: 2.6, op: .4, t: .72 + i * .04 });
    });
    s += LN(540, top + 26, 540, top - 14, { w: 2.8, t: .84 });
    s += CI(540, top - 20, 8, { fill: accent, c: accent, t: .88 });
    s += LN(730, d - 32, 730, d - 146, { w: 4, t: .8 });
    s += LN(730, d - 146, 862, d - 146, { w: 4, t: .84 });
    s += LN(730, d - 112, 786, d - 146, { w: 2.4, op: .5, t: .88 });
    s += LN(838, d - 146, 838, d - 88, { w: 2.2, op: .8, t: .9 });
    s += RF(826, d - 88, 24, 20, { w: 2.8, fill: PAPER_FILL, t: .94 });
    s += P(`M352 ${d - 32} L296 ${top + 36}`, { w: 3.8, t: .86 });
    s += P(`M282 ${top + 32} q-10 -26 12 -42 q4 20 18 24 q-2 -18 16 -26 q10 30 -10 46 Z`, { w: 3, fill: 'url(#hatchGlow)', op: .9, t: .98 });
    s += P(`M770 ${w + 16} H930 L912 ${w + 58} H790 Z`, { w: 3.4, fill: PAPER_FILL, t: 1 });
    s += RF(808, w - 16, 58, 32, { w: 3, fill: PAPER_FILL, t: 1.04 });
    s += LN(806, w - 8, 868, w - 8, { w: 2.2, op: .5, t: 1.06 });
    s += P(`M870 ${w - 18} V${w - 44}`, { w: 2, op: .6, t: 1.08 });
    s += P(`M770 ${top + 80} q14 -12 28 0 q14 -12 28 0`, { w: 2.8, op: .45, t: 1.1 });
    s += P(`M180 ${top + 110} q12 -10 24 0 q12 -10 24 0`, { w: 2.6, op: .35, t: 1.12 });
    s += P(`M356 ${w + 20} q10 -12 20 0`, { w: 2.4, c: accent, op: .5, t: 1.14 });
    return s;
  }
  if (theme === 'battery') {
    const x = 336, y = top + 136, bw = 356, bh = 216;
    let s = RF(x, y, bw, bh, { rx: 20, w: 5, fill: PAPER_FILL, t: .35 });
    s += RF(x + 18, y + 18, bw - 36, bh - 36, { rx: 12, w: 2.6, op: .32, t: .45 });
    s += RF(x + bw + 4, y + bh / 2 - 44, 34, 88, { rx: 10, w: 4.4, fill: PAPER_FILL, t: .5 });
    s += RF(x + bw + 40, y + bh / 2 - 26, 12, 52, { rx: 6, w: 3.4, fill: PAPER_FILL, t: .54 });
    [0, 1, 2].forEach(i => {
      const cx0 = x + 44 + i * 92;
      s += RF(cx0, y + 50, 64, bh - 100, { rx: 6, w: 3.4, t: .58 + i * .06,
        fill: i < 2 ? 'url(#hatchD)' : 'none', op: i < 2 ? .95 : .45 });
      s += LN(cx0 + 32, y + 58, cx0 + 32, y + bh - 58, { w: 2, op: .3, t: .62 + i * .06 });
    });
    s += P(`M${x + 186} ${y + 58} L${x + 146} ${y + 112} H${x + 174} L${x + 156} ${y + 158} L${x + 196} ${y + 100} H${x + 168} Z`, { w: 0, c: accent, fill: accent, t: .82 });
    s += P(`M${x + bw + 66} ${y + 44} q30 -22 60 0`, { c: accent, w: 3.4, t: .9 });
    s += P(`M${x + bw + 78} ${y + 78} q24 -18 48 0`, { c: accent, w: 3, op: .6, t: .94 });
    s += P(`M${x} ${y + 74} q-58 10 -58 58 q0 48 48 48`, { w: 5, t: .86 });
    s += RF(246, y + 154, 52, 78, { rx: 12, w: 4, fill: PAPER_FILL, t: .94 });
    [0, 1].forEach(i => s += LN(262 + i * 16, y + 172, 262 + i * 16, y + 192, { w: 3.4, t: .98 }));
    s += LN(262, y + 214, 282, y + 214, { w: 3.4, op: .6, t: 1 });
    s += `<path d="M${x + 84} ${y + bh + 42} A94 94 0 0 1 ${x + bw - 84} ${y + bh + 42}" fill="none" stroke="${accent}" stroke-width="4" stroke-dasharray="12 10" class="draw" style="--d:1.06s"/>`;
    return s;
  }
  if (theme === 'solar') {
    const sx = 806, sy = top + 76, gy = top + 392;
    let s = CI(sx, sy, 40, { c: accent, w: 4.6, t: .3 });
    for (let i = 0; i < 8; i++) {
      const a = Math.PI * 2 * i / 8;
      s += LN((sx + Math.cos(a) * 56).toFixed(1), (sy + Math.sin(a) * 56).toFixed(1),
        (sx + Math.cos(a) * 82).toFixed(1), (sy + Math.sin(a) * 82).toFixed(1), { c: accent, w: 3.6, t: .42 + i * .02 });
    }
    const panel = (cx, t) => {
      const y1 = top + 252, y2 = top + 338;
      let g = P(`M${cx - 104} ${y1} L${cx + 104} ${y1} L${cx + 138} ${y2} L${cx - 138} ${y2} Z`, { w: 4.2, fill: 'url(#hatchD)', op: .9, t });
      [-1 / 3, 0, 1 / 3].forEach(f => g += LN((cx + f * 104).toFixed(1), y1, (cx + f * 138).toFixed(1), y2, { w: 2.2, op: .45, t: t + .06 }));
      g += LN(cx - 120, (y1 + y2) / 2, cx + 120, (y1 + y2) / 2, { w: 2.2, op: .45, t: t + .06 });
      g += LN(cx, y2, cx, gy, { w: 4, t: t + .1 });
      g += LN(cx - 38, y2, cx, y2 + 34, { w: 2.6, op: .55, t: t + .12 });
      g += CI(cx, gy, 5, { fill: accent, c: accent, t: t + .16 });
      return g;
    };
    s += LN(150, gy, 930, gy, { w: 4, t: .32 });
    s += panel(300, .5) + panel(540, .58) + panel(780, .66);
    s += LN(158, top + 370, 922, top + 370, { c: accent, w: 2.6, op: .5, dash: '10 9', t: 1 });
    [[sx, sy, 300, top + 252], [sx, sy, 540, top + 252], [sx, sy, 780, top + 252]].forEach((p, i) =>
      s += LN(p[0], p[1], p[2], p[3], { c: accent, w: 2.4, op: .3, dash: '8 10', t: .82 + i * .05 }));
    [186, 420, 660, 872].forEach((x, i) => s += P(`M${x} ${gy} l8 -16 M${x + 12} ${gy} l8 -16`, { w: 2.4, op: .35, t: 1.06 + i * .03 }));
    s += P(`M180 ${top + 60} q16 -12 32 0 q16 -12 32 0`, { w: 2.6, op: .35, t: 1.08 });
    return s;
  }
  if (theme === 'wind') {
    const g = top + 382;
    const one = (x, k, t) => {
      const hubY = g - 276 * k;
      const bw = 34 * k, tw = 9 * k;
      let s = P(`M${x - bw} ${g} L${x - tw} ${hubY} M${x + bw} ${g} L${x + tw} ${hubY}`, { w: 3.8, t });
      for (let i = 0; i < 4; i++) {
        const y1 = g - 34 * k - i * 58 * k, y2 = y1 - 58 * k;
        const w1 = bw - (bw - tw) * ((g - y1) / (g - hubY));
        const w2 = bw - (bw - tw) * ((g - y2) / (g - hubY));
        s += LN(x - w1, y1, x + w2, y2, { w: 2.2, op: .4, t: t + .05 });
        s += LN(x + w1, y1, x - w2, y2, { w: 2.2, op: .4, t: t + .05 });
      }
      s += P(`M${x - 26 * k} ${hubY} h${52 * k} q${10 * k} 0 ${10 * k} ${11 * k} v${12 * k} h-${72 * k} v-${12 * k} q0 -${11 * k} ${10 * k} -${11 * k} Z`, { w: 3.6, fill: PAPER_FILL, t: t + .12 });
      const hx = x + 6 * k, hy = hubY;
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + i * Math.PI * 2 / 3 + .18;
        const ex = hx + Math.cos(a) * 118 * k, ey = hy + Math.sin(a) * 118 * k;
        const nx = Math.cos(a + Math.PI / 2), ny = Math.sin(a + Math.PI / 2);
        s += P(`M${hx.toFixed(1)} ${hy.toFixed(1)} L${(hx + nx * 9 * k).toFixed(1)} ${(hy + ny * 9 * k).toFixed(1)} L${(ex + nx * 3.4 * k).toFixed(1)} ${(ey + ny * 3.4 * k).toFixed(1)} L${ex.toFixed(1)} ${ey.toFixed(1)} L${(hx - nx * 5 * k).toFixed(1)} ${(hy - ny * 5 * k).toFixed(1)} Z`, { w: 3, fill: 'rgba(45,40,34,.08)', t: t + .18 });
      }
      s += CI(hx, hy, 10 * k, { fill: accent, c: accent, t: t + .2 });
      return s;
    };
    let s = LN(132, g, 948, g, { w: 4, t: .3 });
    s += P(`M150 ${g} q60 -22 120 0 t120 0 t120 0 t120 0 t120 0 t120 0`, { w: 2.4, op: .28, t: .38 });
    s += one(282, .74, .46) + one(540, 1, .54) + one(806, .82, .62);
    s += P(`M160 ${top + 132} q40 -16 80 0 t80 0`, { c: accent, w: 3.6, dash: '10 9', t: 1 });
    s += P(`M700 ${top + 96} q40 -16 80 0 t80 0`, { c: accent, w: 3.6, dash: '10 9', t: 1.08 });
    s += P(`M420 ${top + 74} q26 -12 52 0`, { w: 2.6, op: .3, t: 1.12 });
    return s;
  }
  if (theme === 'mine') {
    const g = top + 300, f = g + 78;
    let s = P(`M176 ${top + 132} q56 -38 112 0 q48 -32 96 0`, { w: 2.4, op: .25, dash: '10 11', t: .3 });
    s += LN(150, g, 336, g, { w: 4, t: .34 }) + LN(744, g, 930, g, { w: 4, t: .34 });
    s += P(`M336 ${g} H382 V${g + 26} H428 V${g + 52} H474 V${f} H546`, { w: 4.4, t: .42 });
    s += P(`M744 ${g} H698 V${g + 26} H652 V${g + 52} H606 V${f} H594`, { w: 4.4, t: .46 });
    s += LN(546, f, 594, f, { w: 4, op: .8, t: .5 });
    [[400, g + 40], [452, g + 66], [620, g + 66], [672, g + 40]].forEach((p, i) =>
      s += LN(p[0] - 14, p[1] + 8, p[0] + 14, p[1] - 10, { w: 2.2, op: .35, t: .56 + i * .03 }));
    [[352, g + 22, 9], [570, g + 18, 7], [512, g + 62, 11], [646, g + 12, 8]].forEach((p, i) =>
      s += P(`M${p[0]} ${p[1]} l${p[2]} -${p[2] + 4} l${p[2] + 2} ${p[2] + 2} Z`, { w: 2.6, op: .55, t: .62 + i * .04 }));
    // 挖掘机
    s += RF(162, g - 28, 132, 28, { rx: 14, w: 4, fill: PAPER_FILL, t: .68 });
    s += CI(198, g - 14, 9, { w: 3, t: .72 }) + CI(260, g - 14, 9, { w: 3, t: .72 });
    s += RF(184, g - 84, 90, 56, { rx: 7, w: 4, fill: PAPER_FILL, t: .74 });
    s += RF(188, g - 118, 48, 36, { rx: 4, w: 3.4, fill: PAPER_FILL, t: .78 });
    s += LN(214, g - 116, 214, g - 90, { w: 2.4, op: .5, t: .8 });
    s += RF(160, g - 76, 22, 38, { rx: 4, w: 3, t: .78 });
    s += P(`M274 ${g - 66} L334 ${g - 146} L388 ${g - 122}`, { w: 5.4, t: .84 });
    s += P(`M388 ${g - 122} l18 28 l-38 14 Z`, { w: 3.4, fill: 'url(#hatchD)', op: .9, t: .9 });
    // 矿用卡车
    s += P(`M768 ${g - 60} H862 L872 ${g - 22} H768 Z`, { w: 4, fill: PAPER_FILL, t: .88 });
    s += P(`M782 ${g - 60} l16 -22 h48 l16 22 Z`, { w: 3, fill: 'url(#hatchD)', op: .9, t: .92 });
    s += RF(868, g - 56, 40, 34, { rx: 5, w: 3.4, fill: PAPER_FILL, t: .92 });
    s += LN(880, g - 52, 880, g - 34, { w: 2.2, op: .45, t: .94 });
    s += CI(792, g - 6, 20, { w: 4, t: .96 }) + CI(792, g - 6, 8, { w: 2.6, t: .98 });
    s += CI(858, g - 6, 20, { w: 4, t: .96 }) + CI(858, g - 6, 8, { w: 2.6, t: .98 });
    s += CI(896, g - 72, 10, { w: 2.6, op: .4, t: 1.06 }) + CI(916, g - 88, 7, { w: 2.4, op: .3, t: 1.1 });
    s += P(`M320 ${g - 30} q16 -12 32 0`, { w: 2.4, op: .3, t: 1.08 });
    return s;
  }
  if (theme === 'wheat') {
    const g = top + 362;
    let s = P(`M150 ${top + 302} q120 -42 240 0 t240 0 t240 0`, { w: 2.6, op: .3, t: .3 });
    s += CI(216, top + 84, 34, { c: accent, w: 4, t: .32 });
    for (let i = 0; i < 8; i++) {
      const a = Math.PI * 2 * i / 8;
      s += LN((216 + Math.cos(a) * 48).toFixed(1), (top + 84 + Math.sin(a) * 48).toFixed(1),
        (216 + Math.cos(a) * 70).toFixed(1), (top + 84 + Math.sin(a) * 70).toFixed(1), { c: accent, w: 3, t: .4 + i * .02 });
    }
    for (let i = 0; i < 14; i++) {
      const bx = 176 + i * 56, bh = 64 + n(i) * 52, dx = (n(i + 20) - .5) * 16;
      s += P(`M${bx} ${g} L${(bx + dx).toFixed(1)} ${g - bh}`, { w: 2, op: .26, t: .34 + i * .012 });
      for (let j = 0; j < 3; j++) {
        const yy = g - bh + 6 + j * 12;
        s += LN(bx + dx - 7, yy + 4, bx + dx, yy - 4, { w: 1.8, op: .24, t: .34 + i * .012 });
        s += LN(bx + dx + 7, yy + 4, bx + dx, yy - 4, { w: 1.8, op: .24, t: .34 + i * .012 });
      }
    }
    s += LN(150, g, 930, g, { w: 4, t: .3 });
    const stalk = (x, h, tilt, t) => {
      const tx = x + tilt, ty = g - h;
      let q = P(`M${x} ${g} Q${x + tilt * .4} ${g - h * .55} ${tx} ${ty}`, { w: 4.2, t });
      for (let i = 0; i < 5; i++) {
        const yy = ty + 8 + i * 20;
        q += `<ellipse cx="${tx - 12}" cy="${yy}" rx="8" ry="16" fill="none" stroke="${accent}" stroke-width="3" transform="rotate(-20 ${tx - 12} ${yy})" class="f" style="--d:${(t + .08 + i * .05).toFixed(2)}s"/>`;
        q += `<ellipse cx="${tx + 12}" cy="${yy + 9}" rx="8" ry="16" fill="none" stroke="${accent}" stroke-width="3" transform="rotate(20 ${tx + 12} ${yy + 9})" class="f" style="--d:${(t + .1 + i * .05).toFixed(2)}s"/>`;
      }
      q += P(`M${tx} ${ty} l-7 -22 M${tx} ${ty} l0 -27 M${tx} ${ty} l8 -20`, { w: 2.4, c: accent, op: .7, t: t + .32 });
      q += P(`M${x + tilt * .3} ${g - h * .45} q-42 -14 -58 -50 q40 6 58 24`, { w: 3, c: accent, op: .6, t: t + .2 });
      q += P(`M${x + tilt * .55} ${g - h * .5} q38 -10 54 -44 q-36 4 -54 22`, { w: 3, c: accent, op: .5, t: t + .24 });
      return q;
    };
    s += stalk(376, 244, 12, .6) + stalk(540, 294, 0, .68) + stalk(704, 236, -12, .76);
    s += LN(190, g + 34, 890, g + 34, { c: accent, w: 3.4, dash: '14 12', t: 1.1 });
    s += P(`M760 ${top + 66} q14 -12 28 0 q14 -12 28 0`, { w: 2.6, op: .4, t: 1.12 });
    return s;
  }
  if (theme === 'water') {
    const cx = 512;
    let s = P(`M${cx} ${top + 46} Q${cx + 168} ${top + 224} ${cx + 168} ${top + 296} A168 168 0 0 1 ${cx - 168} ${top + 296} Q${cx - 168} ${top + 224} ${cx} ${top + 46} Z`, { w: 5, t: .35 });
    s += P(`M${cx - 44} ${top + 156} q-26 46 -6 88`, { c: accent, w: 5, op: .55, t: .8 });
    s += P(`M${cx + 34} ${top + 128} q10 26 2 44`, { c: accent, w: 3.4, op: .4, t: .86 });
    s += `<ellipse cx="${cx}" cy="${top + 336}" rx="212" ry="24" fill="none" stroke="${accent}" stroke-width="4" class="f" style="--d:.95s"/>`;
    s += `<ellipse cx="${cx}" cy="${top + 366}" rx="152" ry="16" fill="none" stroke="${accent}" stroke-width="3.2" opacity=".6" class="f" style="--d:1.04s"/>`;
    s += `<ellipse cx="${cx}" cy="${top + 392}" rx="92" ry="10" fill="none" stroke="${accent}" stroke-width="2.6" opacity=".4" class="f" style="--d:1.12s"/>`;
    [[cx - 196, top + 306, -1], [cx + 196, top + 306, 1]].forEach((p, i) => {
      s += P(`M${p[0]} ${p[1]} q${p[2] * 10} -26 ${p[2] * 4} -40 q${p[2] * 16} 18 ${p[2] * 4} 36 Z`, { w: 2.6, c: accent, op: .55, t: 1 + i * .04 });
    });
    s += P(`M930 ${top + 78} H846 Q818 ${top + 78} 818 ${top + 106} V${top + 150}`, { w: 9, t: .6 });
    s += P(`M930 ${top + 78} H846 Q818 ${top + 78} 818 ${top + 106} V${top + 150}`, { w: 3.4, c: '#f6eedc', t: .64 });
    s += `<ellipse cx="884" cy="${top + 78}" rx="30" ry="9" fill="none" stroke="#2d2822" stroke-width="3.2" class="f" style="--d:.72s"/>`;
    s += LN(884, top + 69, 884, top + 87, { w: 2.4, op: .7, t: .76 });
    s += LN(854, top + 78, 914, top + 78, { w: 2.4, op: .7, t: .76 });
    [[top + 178, .9], [top + 216, 1], [top + 254, 1.1]].forEach((p, i) =>
      s += P(`M818 ${p[0]} q-9 15 0 23 q9 -8 0 -23 Z`, { w: 2.4, c: accent, t: p[1] }));
    s += LN(160, top + 336, 264, top + 336, { w: 2.6, op: .3, dash: '9 9', t: 1.2 });
    s += CI(150, top + 336, 7, { w: 2.4, op: .4, t: 1.22 });
    return s;
  }
  if (theme === 'bank') {
    const b = top + 340;
    let s = LN(238, b + 32, 842, b + 32, { w: 4, t: .3 });
    s += LN(258, b + 16, 822, b + 16, { w: 4, t: .34 });
    s += LN(280, b, 800, b, { w: 4.4, t: .38 });
    s += RF(292, b - 214, 516, 26, { w: 4.2, fill: PAPER_FILL, t: .46 });
    s += LN(292, b - 200, 808, b - 200, { w: 2.2, op: .4, t: .5 });
    s += P(`M270 ${b - 214} L550 ${b - 306} L830 ${b - 214} Z`, { w: 4.4, fill: PAPER_FILL, t: .56 });
    s += P(`M294 ${b - 214} L550 ${b - 290} L806 ${b - 214}`, { w: 2.2, op: .4, t: .62 });
    s += CI(550, b - 252, 15, { w: 2.6, op: .6, t: .66 });
    s += CI(550, b - 324, 24, { c: accent, w: 3.6, t: .7 });
    s += LN(550, b - 340, 550, b - 308, { w: 2.6, c: accent, t: .74 });
    [0, 1, 2, 3, 4, 5].forEach(i => {
      const x = 306 + i * 90, t = .62 + i * .04;
      s += RF(x, b - 188, 46, 188, { w: 3.8, fill: PAPER_FILL, t });
      s += LN(x - 7, b - 188, x + 53, b - 188, { w: 3, t: t + .03 });
      s += LN(x - 7, b - 6, x + 53, b - 6, { w: 3, t: t + .03 });
      s += LN(x + 12, b - 172, x + 12, b - 20, { w: 1.8, op: .34, t: t + .05 });
      s += LN(x + 23, b - 172, x + 23, b - 20, { w: 1.8, op: .34, t: t + .05 });
      s += LN(x + 34, b - 172, x + 34, b - 20, { w: 1.8, op: .34, t: t + .05 });
    });
    s += LN(150, b + 54, 930, b + 54, { w: 3.4, op: .35, dash: '14 13', t: 1.06 });
    s += P(`M206 ${b + 40} q12 -34 24 0 M198 ${b + 34} l8 -20 l8 20`, { w: 2.6, c: accent, op: .55, t: 1.1 });
    s += P(`M790 ${b + 40} q12 -34 24 0 M782 ${b + 34} l8 -20 l8 20`, { w: 2.6, c: accent, op: .55, t: 1.12 });
    return s;
  }
  if (theme === 'coin') {
    let s = LN(160, top + 372, 920, top + 372, { w: 3.4, op: .3, t: .3 });
    s += `<circle cx="348" cy="${top + 200}" r="110" fill="url(#hatchD)" fill-opacity=".16" stroke="#2d2822" stroke-width="5" class="f" style="--d:.36s"/>`;
    s += CI(348, top + 200, 84, { w: 3, op: .45, t: .46 });
    s += `<text x="348" y="${top + 240}" text-anchor="middle" font-size="100" fill="#2d2822" font-family="Songti SC,SimSun,serif" class="f" style="--d:.6s">¥</text>`;
    s += `<circle cx="730" cy="${top + 180}" r="92" fill="url(#hatchD)" fill-opacity=".14" stroke="${accent}" stroke-width="5" class="f" style="--d:.5s"/>`;
    s += CI(730, top + 180, 70, { c: accent, w: 2.6, op: .45, t: .58 });
    s += `<text x="730" y="${top + 214}" text-anchor="middle" font-size="82" fill="${accent}" font-family="Baskerville,serif" class="f" style="--d:.68s">$</text>`;
    s += `<ellipse cx="896" cy="${top + 88}" rx="32" ry="30" fill="none" stroke="#2d2822" stroke-width="3.4" class="f" style="--d:.86s"/>`;
    s += `<ellipse cx="896" cy="${top + 84}" rx="32" ry="17" fill="none" stroke="#2d2822" stroke-width="2.4" opacity=".45" class="f" style="--d:.9s"/>`;
    s += P(`M470 ${top + 146} Q552 ${top + 102} 622 ${top + 134}`, { w: 3.8, t: .9 });
    s += P(`M604 ${top + 118} L624 ${top + 135} L602 ${top + 150}`, { w: 3.8, t: 1.04 });
    s += P(`M626 ${top + 228} Q548 ${top + 272} 476 ${top + 238}`, { w: 3.8, t: .98 });
    s += P(`M494 ${top + 222} L474 ${top + 237} L496 ${top + 253}`, { w: 3.8, t: 1.1 });
    [[504, 70], [558, 104], [612, 80]].forEach((p, i) => {
      const cnt = Math.round(p[1] / 14);
      for (let j = 0; j < cnt; j++) {
        s += `<ellipse cx="${p[0]}" cy="${top + 366 - j * 14}" rx="26" ry="7.6" fill="none" stroke="#2d2822" stroke-width="2.6" opacity="${j === cnt - 1 ? .9 : .5}" class="f" style="--d:${(1 + i * .04 + j * .01).toFixed(2)}s"/>`;
      }
      s += LN(p[0] - 26, top + 368 - p[1], p[0] - 26, top + 368, { w: 2.4, op: .45, t: 1 });
      s += LN(p[0] + 26, top + 368 - p[1], p[0] + 26, top + 368, { w: 2.4, op: .45, t: 1 });
    });
    s += CI(852, top + 264, 9, { w: 2.6, op: .4, t: 1.2 });
    return s;
  }
  if (theme === 'scale') {
    const px = 540, py = top + 64;
    let s = LN(px, py, px, top + 302, { w: 5, t: .34 });
    s += P(`M280 ${top + 126} L800 ${top + 98}`, { w: 5, t: .46 });
    s += CI(px, py, 13, { w: 4, t: .5 });
    s += P(`M${px} ${py - 42} l-10 -22 h20 Z`, { w: 2.6, fill: accent, t: .56 });
    s += P(`M${px - 4} ${py + 16} q-46 8 -52 54`, { w: 2.4, op: .4, dash: '7 7', t: .6 });
    [[248, top + 220], [284, top + 214], [320, top + 220]].forEach((p, i) =>
      s += LN(280, top + 126, p[0], p[1], { w: 2.4, op: .65, t: .62 + i * .03 }));
    [[758, top + 196], [794, top + 188], [830, top + 196]].forEach((p, i) =>
      s += LN(800, top + 98, p[0], p[1], { w: 2.4, op: .65, t: .66 + i * .03 }));
    s += P(`M226 ${top + 216} Q284 ${top + 282} 342 ${top + 216} Z`, { w: 4, c: accent, t: .78 });
    s += P(`M736 ${top + 188} Q794 ${top + 254} 852 ${top + 188} Z`, { w: 4, c: accent, t: .84 });
    s += RF(240, top + 172, 42, 42, { rx: 3, w: 3.4, fill: 'url(#hatchD)', t: .9 });
    s += RF(288, top + 182, 32, 32, { rx: 3, w: 3, fill: PAPER_FILL, t: .94 });
    s += P(`M244 ${top + 168} h34`, { w: 2.4, op: .5, t: .96 });
    s += `<ellipse cx="778" cy="${top + 180}" rx="24" ry="9" fill="none" stroke="${accent}" stroke-width="3" class="f" style="--d:.96s"/>`;
    s += `<ellipse cx="778" cy="${top + 168}" rx="24" ry="9" fill="none" stroke="${accent}" stroke-width="3" class="f" style="--d:1.02s"/>`;
    s += `<ellipse cx="806" cy="${top + 174}" rx="18" ry="7" fill="none" stroke="${accent}" stroke-width="2.6" class="f" style="--d:1.06s"/>`;
    s += LN(456, top + 302, 624, top + 302, { w: 5, t: .9 });
    s += LN(412, top + 326, 668, top + 326, { w: 5, t: .94 });
    s += RF(502, top + 284, 76, 18, { w: 3.4, fill: PAPER_FILL, t: .88 });
    s += LN(160, top + 372, 920, top + 372, { w: 3.2, op: .3, dash: '14 13', t: 1.08 });
    return s;
  }
  if (theme === 'shield') {
    let s = P(`M540 ${top + 50} L780 ${top + 140} V${top + 270} Q780 ${top + 400} 540 ${top + 430} Q300 ${top + 400} 300 ${top + 270} V${top + 140} Z`, { w: 5, fill: PAPER_FILL, t: .35 });
    s += P(`M540 ${top + 50} L300 ${top + 140} V${top + 270} Q300 ${top + 400} 540 ${top + 430} Z`, { w: 0, fill: 'url(#hatchD)', op: .18, t: .5 });
    s += P(`M540 ${top + 96} L748 ${top + 172} V${top + 266} Q748 ${top + 374} 540 ${top + 398} Q332 ${top + 374} 332 ${top + 266} V${top + 172} Z`, { w: 2.6, op: .4, t: .56 });
    s += P(`M446 ${top + 230} L514 ${top + 302} L648 ${top + 160}`, { w: 9, c: accent, t: .8 });
    s += CI(354, top + 140, 6, { fill: accent, c: accent, t: .9 }) + CI(726, top + 140, 6, { fill: accent, c: accent, t: .94 });
    s += P(`M300 ${top + 166} H248 V${top + 128} H208`, { w: 3, c: accent, op: .55, t: 1 });
    s += P(`M300 ${top + 252} H256 V${top + 292} H218`, { w: 3, c: accent, op: .55, t: 1.04 });
    s += P(`M780 ${top + 166} H832 V${top + 128} H872`, { w: 3, c: accent, op: .55, t: 1.08 });
    s += P(`M780 ${top + 252} H824 V${top + 292} H862`, { w: 3, c: accent, op: .55, t: 1.12 });
    s += CI(208, top + 128, 7, { fill: accent, c: accent, t: 1.06 }) + CI(218, top + 292, 7, { fill: accent, c: accent, t: 1.1 });
    s += CI(872, top + 128, 7, { fill: accent, c: accent, t: 1.14 }) + CI(862, top + 292, 7, { fill: accent, c: accent, t: 1.18 });
    return s;
  }
  if (theme === 'lock') {
    let s = P(`M436 ${top + 196} V${top + 148} A104 104 0 0 1 644 ${top + 148} V${top + 196}`, { w: 14, t: .4 });
    s += P(`M436 ${top + 196} V${top + 148} A104 104 0 0 1 644 ${top + 148} V${top + 196}`, { w: 5, c: '#f6eedc', t: .46 });
    s += RF(370, top + 196, 340, 226, { rx: 24, w: 5, fill: PAPER_FILL, t: .5 });
    s += RF(396, top + 222, 288, 174, { rx: 14, w: 2.2, op: .3, t: .58 });
    s += RF(424, top + 182, 34, 20, { rx: 4, w: 3, fill: PAPER_FILL, t: .62 });
    s += RF(622, top + 182, 34, 20, { rx: 4, w: 3, fill: PAPER_FILL, t: .62 });
    s += CI(416, top + 240, 6, { w: 2.4, op: .5, t: .66 }) + CI(664, top + 240, 6, { w: 2.4, op: .5, t: .7 });
    s += CI(540, top + 286, 27, { w: 4.4, t: .7 });
    s += P(`M540 ${top + 288} l-16 56 h32 Z`, { w: 3.4, fill: accent, op: .9, t: .78 });
    s += P(`M540 ${top + 286} V${top + 322}`, { w: 3.4, op: .55, t: .82 });
    s += `<g class="f" style="--d:.92s" transform="translate(768,${top + 296}) rotate(-22)">
<circle cx="0" cy="0" r="28" fill="none" stroke="${accent}" stroke-width="4.4"/>
<circle cx="0" cy="0" r="13" fill="none" stroke="${accent}" stroke-width="3"/>
<line x1="-26" y1="6" x2="-26" y2="76" stroke="${accent}" stroke-width="6" stroke-linecap="round"/>
<line x1="-26" y1="44" x2="-6" y2="44" stroke="${accent}" stroke-width="5" stroke-linecap="round"/>
<line x1="-26" y1="62" x2="-10" y2="62" stroke="${accent}" stroke-width="5" stroke-linecap="round"/>
</g>`;
    s += LN(180, top + 430, 900, top + 430, { w: 4, dash: '18 14', t: 1 });
    return s;
  }
  if (theme === 'clock') {
    const cx = 540, cy = top + 186;
    let s = `<circle cx="${cx}" cy="${cy}" r="142" fill="none" stroke="#2d2822" stroke-width="5" class="f" style="--d:.35s"/>`;
    s += `<circle cx="${cx}" cy="${cy}" r="120" fill="url(#hatchD)" fill-opacity=".09" stroke="none" class="f" style="--d:.44s"/>`;
    s += CI(cx, cy, 116, { w: 2, op: .3, t: .48 });
    for (let i = 0; i < 12; i++) {
      const a = Math.PI * 2 * i / 12;
      const big = i % 3 === 0;
      s += LN((cx + Math.cos(a) * (big ? 124 : 131)).toFixed(1), (cy + Math.sin(a) * (big ? 124 : 131)).toFixed(1),
        (cx + Math.cos(a) * 140).toFixed(1), (cy + Math.sin(a) * 140).toFixed(1),
        { w: big ? 4.4 : 2.2, op: big ? .9 : .45, t: .54 + i * .014 });
      if (!big) {
        const b2 = a + Math.PI / 12;
        s += LN((cx + Math.cos(b2) * 135).toFixed(1), (cy + Math.sin(b2) * 135).toFixed(1),
          (cx + Math.cos(b2) * 140).toFixed(1), (cy + Math.sin(b2) * 140).toFixed(1), { w: 1.6, op: .25, t: .6 });
      }
    }
    s += LN(cx, cy, cx + 74, cy - 72, { w: 6, t: .78 });
    s += LN(cx, cy, cx - 42, cy - 74, { w: 6.6, t: .72 });
    s += LN(cx, cy, cx + 32, cy + 90, { w: 2.2, c: accent, t: .84 });
    s += CI(cx, cy, 11, { fill: accent, c: accent, t: .88 });
    s += CI(cx, cy, 4, { fill: '#f6eedc', c: '#f6eedc', t: .9 });
    const gear = (gx, gy, r, t, col) => {
      let q = CI(gx, gy, r, { w: 3.6, c: col, t });
      for (let i = 0; i < 8; i++) {
        const a = Math.PI * 2 * i / 8 + .2;
        q += LN((gx + Math.cos(a) * r).toFixed(1), (gy + Math.sin(a) * r).toFixed(1),
          (gx + Math.cos(a) * (r + 13)).toFixed(1), (gy + Math.sin(a) * (r + 13)).toFixed(1), { w: 7, c: col, t });
      }
      q += CI(gx, gy, r * .34, { w: 3, c: col, op: .65, t: t + .04 });
      return q;
    };
    s += gear(228, top + 302, 42, .92, accent);
    s += gear(844, top + 288, 32, 1.02, '#2d2822');
    s += P(`M300 ${top + 350} Q540 ${top + 398} 780 ${top + 350}`, { c: accent, w: 3.4, dash: '10 10', t: 1.06 });
    s += P(`M318 ${top + 338} L296 ${top + 350} L314 ${top + 361}`, { c: accent, w: 3.4, t: 1.2 });
    return s;
  }
  if (theme === 'network') {
    const H = [540, top + 208];
    const pts = [[356, top + 92, 24], [730, top + 84, 22], [766, top + 232, 26], [644, top + 352, 20], [444, top + 364, 22], [302, top + 250, 18]];
    let s = '';
    pts.forEach((p, i) => s += LN(H[0], H[1], p[0], p[1], { w: 3, op: .4, t: .42 + i * .03 }));
    s += LN(pts[0][0], pts[0][1], pts[1][0], pts[1][1], { w: 2.4, op: .28, t: .6 });
    s += LN(pts[4][0], pts[4][1], pts[3][0], pts[3][1], { w: 2.4, op: .28, t: .62 });
    s += LN(pts[5][0], pts[5][1], pts[2][0], pts[2][1], { w: 2.4, op: .24, dash: '8 9', t: .64 });
    s += CI(H[0], H[1], 78, { c: accent, w: 2.4, op: .3, dash: '10 12', t: .5 });
    s += CI(H[0], H[1], 56, { c: accent, w: 2.6, op: .5, t: .56 });
    s += CI(H[0], H[1], 38, { w: 5, t: .62 });
    s += CI(H[0], H[1], 10, { fill: accent, c: accent, t: .7 });
    pts.forEach((p, i) => {
      s += CI(p[0], p[1], p[2], { w: i < 2 ? 4 : 3.4, t: .66 + i * .05 });
      s += CI(p[0], p[1], 5, { fill: i % 2 ? '#2d2822' : accent, c: i % 2 ? '#2d2822' : accent, t: .9 + i * .04 });
    });
    s += RF(142, top + 226, 104, 156, { rx: 8, w: 4, fill: PAPER_FILL, t: .5 });
    for (let i = 0; i < 4; i++) {
      s += RF(154, top + 240 + i * 34, 80, 26, { rx: 3, w: 2.4, op: .55, t: .58 + i * .04 });
      s += LN(162, top + 250 + i * 34, 186, top + 250 + i * 34, { w: 1.8, op: .35, t: .6 + i * .04 });
      s += CI(216, top + 246 + i * 34, 4, { fill: i < 2 ? accent : '#2d2822', c: i < 2 ? accent : '#2d2822', op: i < 2 ? .9 : .35, t: .62 + i * .04 });
    }
    s += LN(246, top + 286, 286, top + 258, { w: 2.4, c: accent, op: .4, dash: '7 8', t: 1.1 });
    s += P(`M700 ${top + 136} q18 -14 36 0 q18 -14 36 0`, { w: 2.4, op: .3, t: 1.12 });
    return s;
  }
  if (theme === 'phone') {
    let s = RF(400, top + 36, 280, 400, { rx: 36, w: 5, fill: PAPER_FILL, t: .35 });
    s += RF(420, top + 72, 240, 330, { rx: 10, w: 2.4, op: .35, t: .46 });
    s += RF(506, top + 46, 68, 12, { rx: 6, w: 2.4, t: .5 });
    s += LN(446, top + 94, 512, top + 94, { w: 2.2, op: .35, t: .54 });
    s += RF(620, top + 88, 24, 12, { rx: 2, w: 2, t: .54 });
    s += LN(646, top + 92, 646, top + 96, { w: 2, op: .5, t: .56 });
    const app = (x, y, filled, t) => RF(x, y, 52, 52, { rx: 10, w: 2.8, fill: filled ? 'url(#hatchD)' : PAPER_FILL, op: filled ? .9 : .7, t })
      + LN(x + 12, y + 20, x + 40, y + 20, { w: 2, op: .4, t })
      + LN(x + 12, y + 32, x + 32, y + 32, { w: 2, op: .3, t });
    [0, 1, 2].forEach(i => s += app(442 + i * 72, top + 118, i !== 1, .6 + i * .06));
    [0, 1, 2].forEach(i => s += app(442 + i * 72, top + 186, i === 0, .78 + i * .06));
    s += RF(442, top + 258, 196, 104, { rx: 8, w: 2.8, fill: PAPER_FILL, t: .94 });
    s += `<polyline points="456,${top + 338} 486,${top + 314} 516,${top + 326} 548,${top + 292} 580,${top + 302} 616,${top + 278}" fill="none" stroke="${accent}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" class="draw" style="--d:1.02s"/>`;
    s += LN(456, top + 348, 624, top + 348, { w: 1.8, op: .3, t: 1.04 });
    s += LN(456, top + 272, 520, top + 272, { w: 2, op: .35, t: .98 });
    s += LN(500, top + 416, 580, top + 416, { w: 4, op: .5, t: 1.06 });
    s += RF(704, top + 136, 132, 74, { rx: 14, w: 3.4, fill: PAPER_FILL, t: 1.04 });
    s += LN(722, top + 160, 818, top + 160, { w: 2.4, op: .45, t: 1.08 });
    s += LN(722, top + 180, 786, top + 180, { w: 2.4, op: .3, t: 1.1 });
    s += RF(726, top + 226, 92, 58, { rx: 12, w: 3, fill: PAPER_FILL, t: 1.12 });
    s += LN(742, top + 246, 802, top + 246, { w: 2.2, op: .4, t: 1.16 });
    s += LN(742, top + 264, 776, top + 264, { w: 2.2, op: .3, t: 1.18 });
    s += P(`M704 ${top + 96} q28 -18 56 0 M716 ${top + 110} q16 -10 32 0`, { c: accent, w: 3, t: 1.2 });
    s += CI(668, top + 330, 8, { c: accent, w: 2.4, op: .5, t: 1.22 });
    return s;
  }
  if (theme === 'satellite') {
    const ox = 540, oy = top + 176;
    let s = `<ellipse cx="${ox}" cy="${oy}" rx="368" ry="126" fill="none" stroke="#2d2822" stroke-width="2.6" stroke-dasharray="12 12" opacity=".3" transform="rotate(-14 ${ox} ${oy})" class="draw" style="--d:.36s"/>`;
    s += P(`M136 ${top + 440} Q540 ${top + 302} 944 ${top + 440}`, { w: 4.4, t: .44 });
    s += P(`M170 ${top + 470} Q540 ${top + 344} 910 ${top + 470}`, { w: 2.4, c: accent, op: .45, dash: '10 10', t: .5 });
    s += P(`M214 ${top + 498} Q540 ${top + 388} 866 ${top + 498}`, { w: 2.2, c: accent, op: .25, dash: '8 12', t: .54 });
    s += `<g transform="translate(${ox},${oy}) rotate(-16)"><g class="f" style="--d:.6s">
<rect x="-64" y="-52" width="128" height="104" rx="10" fill="${PAPER_FILL}" stroke="#2d2822" stroke-width="4.6"/>
<rect x="-44" y="-34" width="88" height="68" rx="5" fill="none" stroke="#2d2822" stroke-width="2.2" opacity=".4"/>
<line x1="-232" y1="0" x2="-64" y2="0" stroke="#2d2822" stroke-width="3.4"/>
<line x1="64" y1="0" x2="232" y2="0" stroke="#2d2822" stroke-width="3.4"/>
<rect x="-232" y="-46" width="120" height="92" fill="${PAPER_FILL}" stroke="${accent}" stroke-width="4"/>
<rect x="112" y="-46" width="120" height="92" fill="${PAPER_FILL}" stroke="${accent}" stroke-width="4"/>
<line x1="-192" y1="-46" x2="-192" y2="46" stroke="${accent}" stroke-width="2.6" opacity=".6"/>
<line x1="-152" y1="-46" x2="-152" y2="46" stroke="${accent}" stroke-width="2.6" opacity=".6"/>
<line x1="152" y1="-46" x2="152" y2="46" stroke="${accent}" stroke-width="2.6" opacity=".6"/>
<line x1="192" y1="-46" x2="192" y2="46" stroke="${accent}" stroke-width="2.6" opacity=".6"/>
<line x1="-232" y1="0" x2="-112" y2="0" stroke="${accent}" stroke-width="2.6" opacity=".5"/>
<line x1="112" y1="0" x2="232" y2="0" stroke="${accent}" stroke-width="2.6" opacity=".5"/>
<line x1="0" y1="-52" x2="0" y2="-92" stroke="#2d2822" stroke-width="4"/>
<path d="M-34 -104 A38 38 0 0 1 34 -104" fill="${PAPER_FILL}" stroke="#2d2822" stroke-width="4"/>
<line x1="0" y1="-104" x2="0" y2="-128" stroke="#2d2822" stroke-width="2.6"/>
<circle cx="0" cy="-132" r="4.4" fill="${accent}"/>
<path d="M-22 52 l0 20 h44 l0 -20" fill="none" stroke="#2d2822" stroke-width="3.4"/>
<line x1="-40" y1="46" x2="-54" y2="82" stroke="#2d2822" stroke-width="2.8"/>
<circle cx="-56" cy="86" r="5" fill="${accent}"/>
</g></g>`;
    s += P(`M${ox + 52} ${top + 78} q30 -20 60 0`, { c: accent, w: 3, op: .6, t: 1.02 });
    s += P(`M${ox + 66} ${top + 98} q20 -14 40 0`, { c: accent, w: 2.6, op: .4, t: 1.06 });
    s += `<g class="f" style="--d:1.08s">${[[200, top + 74, 15], [880, top + 120, 12], [300, top + 46, 9], [790, top + 52, 10]].map(p =>
      `<path d="M${p[0]} ${p[1] - p[2]} L${p[0] + p[2] * .24} ${p[1] - p[2] * .24} L${p[0] + p[2]} ${p[1]} L${p[0] + p[2] * .24} ${p[1] + p[2] * .24} L${p[0]} ${p[1] + p[2]} L${p[0] - p[2] * .24} ${p[1] + p[2] * .24} L${p[0] - p[2]} ${p[1]} L${p[0] - p[2] * .24} ${p[1] - p[2] * .24} Z" fill="${accent}" opacity=".5"/>`).join('')}</g>`;
    return s;
  }
  if (theme === 'dna') {
    const N = 40, y0 = top + 26, y1 = top + 352, dy = (y1 - y0) / N;
    let a = '', b = '', s = '';
    for (let i = 0; i <= N; i++) {
      const y = y0 + i * dy;
      const dx = Math.sin(i * 0.36) * 96;
      a += `${i ? 'L' : 'M'}${(540 - dx).toFixed(1)} ${y.toFixed(1)} `;
      b += `${i ? 'L' : 'M'}${(540 + dx).toFixed(1)} ${y.toFixed(1)} `;
    }
    // 背景染色体 X ×2
    [[172, top + 96], [906, top + 96]].forEach(c => {
      s += `<g opacity=".16"><path d="M${c[0] - 30} ${c[1] - 46} Q${c[0] - 8} ${c[1]} ${c[0] + 30} ${c[1] + 46}" fill="none" stroke="#2d2822" stroke-width="6" stroke-linecap="round"/><path d="M${c[0] + 30} ${c[1] - 46} Q${c[0] + 8} ${c[1]} ${c[0] - 30} ${c[1] + 46}" fill="none" stroke="#2d2822" stroke-width="6" stroke-linecap="round"/></g>`;
    });
    s += LN(540, top + 14, 540, top + 366, { w: 2, dash: '10 12', op: .16, t: .3 });
    s += `<path d="${a}" fill="none" stroke="#2d2822" stroke-width="5.6" stroke-linecap="round" class="draw" style="--d:.36s"/>`;
    s += `<path d="${b}" fill="none" stroke="${accent}" stroke-width="5.6" stroke-linecap="round" class="draw" style="--d:.46s"/>`;
    for (let i = 2; i <= N - 2; i += 3) {
      const y = y0 + i * dy;
      const dx = Math.sin(i * 0.36) * 96;
      const t = .6 + i * .012;
      s += LN((540 - dx).toFixed(1), y.toFixed(1), (540 + dx).toFixed(1), y.toFixed(1), { w: 3, op: .38, t });
      s += CI((540 - dx).toFixed(1), y.toFixed(1), 5.6, { fill: '#2d2822', c: '#2d2822', op: .5, t: t + .02 });
      s += CI((540 + dx).toFixed(1), y.toFixed(1), 5.6, { fill: accent, c: accent, op: .8, t: t + .04 });
    }
    // 小分子
    [[176, top + 296, 22], [902, top + 300, 19], [892, top + 190, 16]].forEach((m, k) => {
      let hex = '';
      for (let i = 0; i < 6; i++) {
        const a1 = Math.PI / 3 * i - Math.PI / 2;
        hex += `${i ? 'L' : 'M'}${(m[0] + Math.cos(a1) * m[2]).toFixed(1)} ${(m[1] + Math.sin(a1) * m[2]).toFixed(1)} `;
      }
      s += P(hex + 'Z', { w: 2.6, c: k === 1 ? accent : '#2d2822', op: .45, t: 1.02 + k * .04 });
      s += CI(m[0], m[1], 4, { fill: k === 1 ? accent : '#2d2822', c: k === 1 ? accent : '#2d2822', op: .45, t: 1.08 + k * .04 });
    });
    s += LN(196, top + 368, 884, top + 368, { w: 2.6, dash: '16 13', op: .26, t: 1.12 });
    return s;
  }
  if (theme === 'flask') {
    let s = '';
    // 左侧圆底瓶
    s += LN(242, top + 194, 282, top + 194, { w: 5, t: .3 });
    s += RF(246, top + 194, 32, 54, { w: 3.6, fill: PAPER_FILL, t: .34 });
    s += CI(262, top + 298, 52, { w: 4.4, fill: PAPER_FILL, t: .38 });
    s += P(`M216 ${top + 326} Q262 ${top + 304} 308 ${top + 326} A52 52 0 0 1 216 ${top + 326} Z`, { fill: 'url(#hatchD)', w: 0, op: .4, t: .46 });
    s += P(`M218 ${top + 322} Q262 ${top + 300} 306 ${top + 322}`, { c: accent, w: 2.8, op: .6, t: .5 });
    s += CI(244, top + 334, 5, { w: 2, c: accent, op: .5, t: .54 });
    // 主锥形瓶
    s += P(`M510 ${top + 56} V${top + 186} L404 ${top + 372} Q394 ${top + 394} 422 ${top + 394} H658 Q686 ${top + 394} 676 ${top + 372} L570 ${top + 186} V${top + 56} Z`, { w: 5, fill: PAPER_FILL, t: .4 });
    s += P(`M510 ${top + 186} L404 ${top + 372} Q394 ${top + 394} 422 ${top + 394} H472 L526 ${top + 186} Z`, { fill: 'url(#hatchD)', w: 0, op: .3, t: .48 });
    s += LN(486, top + 56, 594, top + 56, { w: 6, t: .52 });
    s += LN(494, top + 44, 586, top + 44, { w: 2.6, op: .35, t: .54 });
    // 液体
    s += P(`M446 ${top + 302} Q540 ${top + 276} 634 ${top + 302} L676 ${top + 372} Q686 ${top + 394} 658 ${top + 394} H422 Q394 ${top + 394} 404 ${top + 372} Z`, { fill: accent, w: 0, op: .12, t: .58 });
    s += P(`M446 ${top + 302} Q540 ${top + 276} 634 ${top + 302} L676 ${top + 372} Q686 ${top + 394} 658 ${top + 394} H422 Q394 ${top + 394} 404 ${top + 372} Z`, { fill: 'url(#hatchD)', w: 0, op: .4, t: .62 });
    s += P(`M446 ${top + 302} Q540 ${top + 276} 634 ${top + 302}`, { c: accent, w: 3.4, t: .66 });
    // 刻度
    [[604, top + 246], [627, top + 286], [650, top + 326]].forEach((g, i) =>
      s += LN(g[0], g[1], g[0] - 22, g[1], { w: 2.4, op: .45, t: .7 + i * .03 }));
    // 气泡
    s += CI(516, top + 344, 9, { w: 2.4, c: accent, op: .6, t: .8 });
    s += CI(556, top + 360, 7, { w: 2.2, c: accent, op: .5, t: .84 });
    s += CI(536, top + 322, 5, { w: 2, c: accent, op: .45, t: .88 });
    s += CI(540, top + 250, 9, { w: 2.4, c: accent, op: .55, t: .94 });
    s += CI(568, top + 212, 7, { w: 2.2, c: accent, op: .42, t: .98 });
    s += CI(522, top + 182, 5, { w: 2, c: accent, op: .35, t: 1.02 });
    // 滴管
    s += `<ellipse cx="610" cy="${top + 30}" rx="19" ry="25" fill="${accent}" fill-opacity=".18" stroke="${accent}" stroke-width="3.2" class="f" style="--d:.9s"/>`;
    s += LN(600, top + 50, 566, top + 106, { w: 8, t: .94 });
    s += LN(596, top + 58, 570, top + 100, { c: accent, w: 3.2, t: .96 });
    s += P(`M560 ${top + 104} L580 ${top + 104} L570 ${top + 130} Z`, { w: 2.8, fill: PAPER_FILL, t: .98 });
    s += P(`M562 ${top + 142} q-9 11 0 18 q9 -7 0 -18 Z`, { fill: accent, w: 2, c: accent, op: .55, t: 1.04 });
    s += LN(628, top + 62, 642, top + 50, { c: accent, w: 2.2, dash: '6 6', op: .5, t: 1.08 });
    s += LN(620, top + 82, 636, top + 74, { c: accent, w: 2.2, dash: '6 6', op: .4, t: 1.1 });
    // 试管架
    [736, 800, 866].forEach((x, i) => {
      const t = .84 + i * .04;
      s += RF(x - 17, top + 206, 34, 164, { rx: 17, w: 3.4, fill: PAPER_FILL, t });
      s += `<rect x="${x - 13}" y="${top + 284}" width="26" height="80" rx="13" fill="${accent}" fill-opacity=".15" stroke="none" class="f" style="--d:${(t + .04).toFixed(2)}s"/>`;
      s += `<rect x="${x - 13}" y="${top + 284}" width="26" height="80" rx="13" fill="url(#hatchD)" fill-opacity=".5" stroke="none" class="f" style="--d:${(t + .06).toFixed(2)}s"/>`;
      s += LN(x - 19, top + 206, x + 19, top + 206, { w: 4, t: t + .02 });
      s += LN(x - 17, top + 322, x + 17, top + 322, { w: 2, op: .35, t: t + .08 });
      s += LN(x - 17, top + 344, x + 17, top + 344, { w: 2, op: .3, t: t + .1 });
    });
    s += RF(698, top + 286, 212, 14, { rx: 5, w: 4, fill: PAPER_FILL, t: .96 });
    s += LN(708, top + 300, 708, top + 370, { w: 3.6, t: 1 });
    s += LN(900, top + 300, 900, top + 370, { w: 3.6, t: 1 });
    s += RF(698, top + 368, 212, 12, { rx: 4, w: 3.6, fill: PAPER_FILL, t: 1.02 });
    s += LN(196, top + 404, 884, top + 404, { w: 2.6, dash: '16 13', op: .26, t: 1.14 });
    return s;
  }
  if (theme === 'store') {
    const b = top + 372;
    let s = P(`M300 ${b} V${top + 176} H780 V${b}`, { w: 5, fill: PAPER_FILL, t: .35 });
    s += P(`M270 ${top + 176} H810 L792 ${top + 240} H288 Z`, { w: 4.6, fill: PAPER_FILL, t: .46 });
    for (let i = 0; i < 5; i++) {
      const x1 = 300 + i * 96, x2 = 296 + i * 100;
      s += LN(x1, top + 180, x2, top + 236, { w: 7, c: accent, op: .5, t: .54 + i * .03 });
    }
    s += P(`M288 ${top + 240} q50 22 100 0 q50 22 100 0 q50 22 100 0 q50 22 100 0 q50 22 100 0`, { w: 3.4, t: .62 });
    s += RF(348, top + 262, 384, 30, { rx: 4, w: 3, fill: PAPER_FILL, t: .68 });
    s += LN(400, top + 277, 470, top + 277, { w: 3.4, op: .55, t: .72 });
    s += LN(492, top + 277, 562, top + 277, { w: 3.4, op: .55, t: .74 });
    s += LN(584, top + 277, 654, top + 277, { w: 3.4, op: .55, t: .76 });
    const bottle = (x, y, hgt, t) => RF(x, y, 14, hgt, { rx: 3, w: 2.4, fill: 'url(#hatchD)', op: .9, t })
      + LN(x + 7, y, x + 7, y - 10, { w: 2.4, op: .7, t });
    [0, 1].forEach(i => {
      const wx = 324 + i * 284;
      s += RF(wx, top + 296, 148, 74, { w: 4, fill: PAPER_FILL, t: .78 + i * .04 });
      s += LN(wx, top + 333, wx + 148, top + 333, { w: 2.4, op: .45, t: .8 + i * .04 });
      s += LN(wx + 74, top + 296, wx + 74, top + 370, { w: 2.4, op: .3, t: .8 + i * .04 });
      s += bottle(wx + 26, top + 344, 22, .88 + i * .04) + bottle(wx + 60, top + 338, 28, .9 + i * .04) + bottle(wx + 96, top + 348, 18, .92 + i * .04);
      s += LN(wx - 8, top + 370, wx + 156, top + 370, { w: 3.6, t: .94 });
    });
    s += RF(500, top + 296, 80, 76, { rx: 5, w: 4, fill: PAPER_FILL, t: .8 });
    s += CI(566, top + 336, 4, { fill: accent, c: accent, t: .9 });
    s += RF(488, b, 104, 10, { w: 3, fill: PAPER_FILL, t: .96 });
    s += LN(150, b, 930, b, { w: 4, t: .34 });
    s += LN(190, b + 28, 890, b + 28, { c: accent, w: 3.2, dash: '14 13', t: 1 });
    const plant = (x, t) => P(`M${x} ${b} v-24`, { w: 3.4, t })
      + P(`M${x} ${b - 18} q-24 -8 -30 -34 q26 4 34 24`, { w: 3, c: accent, op: .7, t: t + .04 })
      + P(`M${x} ${b - 18} q24 -10 28 -38 q-24 8 -32 28`, { w: 3, c: accent, op: .7, t: t + .06 })
      + P(`M${x - 16} ${b} l4 -22 h24 l4 22 Z`, { w: 3, fill: PAPER_FILL, t: t - .02 });
    s += plant(238, 1.04) + plant(842, 1.08);
    return s;
  }
  if (theme === 'bridge') {
    const dk = top + 270;
    let s = '';
    for (let i = 0; i < 9; i++) {
      const x = 360 + i * 43;
      const y = top + 92 + 148 * (1 - Math.pow((x - 540) / 204, 2));
      s += LN(x, dk, x, y.toFixed(1), { w: 2.6, op: .55, t: .54 + i * .02 });
    }
    s += P(`M336 ${top + 92} Q540 ${top + 240} 744 ${top + 92}`, { w: 4.4, t: .4 });
    s += P(`M150 ${top + 300} Q248 ${top + 148} 336 ${top + 92}`, { w: 4, t: .34 });
    s += P(`M744 ${top + 92} Q832 ${top + 148} 930 ${top + 300}`, { w: 4, t: .38 });
    [336, 744].forEach((x, i) => {
      const t = .44 + i * .05;
      s += LN(x - 20, top + 80, x - 20, top + 286, { w: 5.4, t });
      s += LN(x + 20, top + 80, x + 20, top + 286, { w: 5.4, t });
      s += LN(x - 26, top + 92, x + 26, top + 92, { w: 4.4, t: t + .04 });
      s += LN(x - 26, top + 200, x + 26, top + 200, { w: 3.6, t: t + .06 });
      s += LN(x - 20, top + 130, x + 20, top + 176, { w: 2.4, op: .4, t: t + .08 });
      s += LN(x + 20, top + 130, x - 20, top + 176, { w: 2.4, op: .4, t: t + .08 });
    });
    s += LN(150, dk, 930, dk, { w: 6, t: .5 });
    s += LN(150, dk + 12, 930, dk + 12, { w: 3.4, op: .7, t: .54 });
    for (let i = 0; i < 10; i++) s += LN(180 + i * 80, dk + 6, 216 + i * 80, dk + 6, { w: 2, op: .3, t: .6 });
    s += RF(136, top + 264, 42, 42, { w: 3.6, fill: PAPER_FILL, t: .62 });
    s += RF(902, top + 264, 42, 42, { w: 3.6, fill: PAPER_FILL, t: .64 });
    s += P(`M140 ${top + 332} q34 -20 68 0 t68 0 t68 0 t68 0 t68 0 t68 0 t68 0 t68 0 t68 0`, { c: accent, w: 3.6, op: .6, t: .7 });
    s += P(`M190 ${top + 364} q34 -18 68 0 t68 0 t68 0 t68 0 t68 0 t68 0 t68 0`, { c: accent, w: 3, op: .35, t: .76 });
    s += P(`M790 ${top + 322} H876 L860 ${top + 344} H806 Z`, { w: 3, fill: PAPER_FILL, t: .82 });
    s += LN(834, top + 322, 834, top + 276, { w: 2.6, t: .86 });
    s += P(`M836 ${top + 280} L862 ${top + 316} H836 Z`, { w: 2.4, fill: PAPER_FILL, t: .9 });
    s += P(`M210 ${top + 58} q22 -20 44 0 q20 -14 40 0`, { w: 2.6, op: .3, t: .94 });
    s += CI(824, top + 74, 26, { c: accent, w: 3.4, t: .9 });
    return s;
  }
  if (theme === 'leaf') {
    const P0 = [262, top + 352], C = [516, top + 198], P1 = [776, top + 52];
    let s = CI(540, top + 198, 252, { w: 2.6, dash: '12 14', op: .16, t: .3 });
    s += P(`M262 ${top + 352} C360 ${top + 208} 556 ${top + 96} 776 ${top + 52} C744 ${top + 208} 598 ${top + 332} 262 ${top + 352} Z`, { w: 5, t: .36 });
    s += P(`M262 ${top + 352} Q${C[0]} ${C[1]} ${P1[0]} ${P1[1]}`, { c: accent, w: 4, t: .56 });
    const at = t => [
      (1 - t) * (1 - t) * P0[0] + 2 * (1 - t) * t * C[0] + t * t * P1[0],
      (1 - t) * (1 - t) * P0[1] + 2 * (1 - t) * t * C[1] + t * t * P1[1],
    ];
    const tan = t => [
      2 * (1 - t) * (C[0] - P0[0]) + 2 * t * (P1[0] - C[0]),
      2 * (1 - t) * (C[1] - P0[1]) + 2 * t * (P1[1] - C[1]),
    ];
    for (let i = 1; i <= 7; i++) {
      const t = i / 8;
      const p = at(t), d = tan(t), L = Math.hypot(d[0], d[1]);
      const nx = -d[1] / L, ny = d[0] / L;
      const w1 = 30 + 46 * Math.sin(Math.PI * t);
      const t2 = (.6 + i * .04).toFixed(2);
      s += LN(p[0].toFixed(1), p[1].toFixed(1), (p[0] + nx * w1).toFixed(1), (p[1] + ny * w1).toFixed(1), { c: accent, w: 2.6, op: .55, t: t2 });
      s += LN(p[0].toFixed(1), p[1].toFixed(1), (p[0] - nx * w1 * 1.1).toFixed(1), (p[1] - ny * w1 * 1.1).toFixed(1), { c: accent, w: 2.6, op: .45, t: t2 });
    }
    s += P(`M262 ${top + 352} q-18 22 -54 30`, { w: 5, t: 1.02 });
    s += P(`M236 ${top + 366} q-26 -6 -30 -30 q26 4 30 26 Z`, { w: 3, fill: PAPER_FILL, t: 1.06 });
    s += P(`M214 ${top + 372} q-4 -26 18 -40 q6 26 -10 42 Z`, { w: 3, fill: PAPER_FILL, t: 1.1 });
    [[560, top + 208, 11, 1.06], [648, top + 148, 9, 1.1], [472, top + 258, 7, 1.14]].forEach(d =>
      s += P(`M${d[0]} ${d[1]} q-${d[2]} ${d[2] + 4} 0 ${d[2] * 2} q${d[2]} -${d[2] + 6} 0 -${d[2] * 2} Z`, { w: 2.4, c: accent, fill: accent, op: .28, t: d[3] }));
    s += CI(786, top + 130, 7, { fill: accent, c: accent, t: 1.2 }) + CI(222, top + 300, 6, { fill: accent, c: accent, op: .6, t: 1.24 });
    return s;
  }
  if (theme === 'factory') {
    const b = top + 384;
    let s = LN(158, b + 8, 922, b + 8, { w: 4, t: .3 });
    // 左厂（锯齿轮廓）
    s += P(`M150 ${b} V${top + 190} l60 -54 v54 l60 -54 v54 l60 -54 v54 l60 -54 v54 H430 V${b} Z`, { w: 5, fill: PAPER_FILL, t: .36 });
    // 右厂（更高）
    s += P(`M430 ${b} V${top + 244} l56 -50 v50 l56 -50 v50 l56 -50 v50 l56 -50 v50 H690 V${b} Z`, { w: 5, fill: PAPER_FILL, t: .44 });
    // 屋顶斜纹阴影
    s += P(`M150 ${b} V${top + 190} l60 -54 v54 Z`, { fill: 'url(#hatchD)', w: 0, op: .32, t: .5 });
    s += P(`M430 ${b} V${top + 244} l56 -50 v50 Z`, { fill: 'url(#hatchD)', w: 0, op: .28, t: .52 });
    // 左厂玻璃窗 2×3
    for (let r = 0; r < 2; r++) {
      for (let i = 0; i < 3; i++) {
        const wx = 178 + i * 78, wy = top + 252 + r * 72;
        s += RF(wx, wy, 52, 52, { w: 2.8, fill: 'url(#hatchD)', op: .9, t: .58 + (r * 3 + i) * .03 });
        s += LN(wx + 26, wy, wx + 26, wy + 52, { w: 1.6, op: .35, t: .6 + (r * 3 + i) * .03 });
        s += LN(wx, wy + 26, wx + 52, wy + 26, { w: 1.6, op: .35, t: .62 + (r * 3 + i) * .03 });
      }
    }
    // 右厂窗 + 卷帘装卸门
    s += RF(452, top + 276, 46, 46, { w: 2.6, fill: 'url(#hatchD)', op: .85, t: .74 });
    s += RF(514, top + 276, 46, 46, { w: 2.6, fill: 'url(#hatchD)', op: .85, t: .78 });
    s += RF(612, top + 290, 62, 94, { w: 3.2, fill: PAPER_FILL, t: .8 });
    for (let i = 0; i < 4; i++) s += LN(616, top + 308 + i * 21, 670, top + 308 + i * 21, { w: 1.8, op: .32, t: .84 + i * .03 });
    // 烟囱 A（高）
    s += RF(492, top + 62, 44, 182, { w: 4, fill: PAPER_FILL, t: .5 });
    s += RF(492, top + 62, 12, 182, { fill: 'url(#hatchD)', w: 0, op: .3, t: .52 });
    s += RF(486, top + 56, 56, 12, { w: 3.4, fill: PAPER_FILL, t: .56 });
    s += LN(494, top + 100, 530, top + 100, { w: 2.2, op: .35, t: .58 });
    s += LN(494, top + 142, 530, top + 142, { w: 2.2, op: .35, t: .6 });
    // 烟囱 B（矮）
    s += RF(566, top + 112, 34, 132, { w: 3.6, fill: PAPER_FILL, t: .54 });
    s += RF(566, top + 112, 9, 132, { fill: 'url(#hatchD)', w: 0, op: .3, t: .56 });
    s += RF(560, top + 106, 46, 10, { w: 3, fill: PAPER_FILL, t: .58 });
    // 烟团
    s += CI(512, top + 30, 19, { w: 2.6, op: .36, dash: '8 8', t: .78 });
    s += CI(544, top + 12, 13, { w: 2.4, op: .26, dash: '7 7', t: .86 });
    s += CI(566, top + 2, 9, { w: 2.2, op: .18, t: .94 });
    s += CI(584, top + 82, 13, { w: 2.4, op: .28, dash: '7 7', t: .9 });
    s += CI(606, top + 68, 9, { w: 2.2, op: .2, t: .98 });
    // 储罐 ×2
    s += P(`M736 ${b} V${top + 268} a38 20 0 0 1 76 0 V${b}`, { w: 4.4, fill: PAPER_FILL, t: .64 });
    s += `<ellipse cx="774" cy="${top + 268}" rx="38" ry="20" fill="url(#hatchD)" fill-opacity=".18" stroke="#2d2822" stroke-width="4.4" class="f" style="--d:.7s"/>`;
    s += LN(736, top + 302, 812, top + 302, { w: 2.2, op: .32, t: .74 });
    s += LN(736, top + 338, 812, top + 338, { w: 2.2, op: .32, t: .76 });
    s += LN(736, top + 306, 762, b, { w: 2, op: .28, t: .78 });
    s += P(`M802 ${top + 246} q-14 -18 -30 0`, { w: 2.6, op: .5, t: .8 });
    s += P(`M836 ${b} V${top + 296} a30 17 0 0 1 60 0 V${b}`, { w: 4, fill: PAPER_FILL, t: .7 });
    s += `<ellipse cx="866" cy="${top + 296}" rx="30" ry="17" fill="url(#hatchD)" fill-opacity=".18" stroke="#2d2822" stroke-width="4" class="f" style="--d:.76s"/>`;
    // 管廊与阀门
    s += LN(690, top + 318, 736, top + 318, { w: 5, t: .82 });
    s += LN(812, top + 350, 836, top + 350, { w: 4, t: .84 });
    s += CI(716, top + 318, 11, { w: 3, t: .88 });
    s += LN(716, top + 307, 716, top + 329, { w: 2.6, op: .55, t: .9 });
    s += LN(182, top + 402, 900, top + 402, { w: 2.4, dash: '18 15', op: .28, t: 1.06 });
    return s;
  }
  if (theme === 'cart') {
    const ry = top + 112, ey = top + 130, byb = top + 292;
    const sideX = (y, side) => {
      const k = (y - ey) / (byb - ey);
      return side === 0 ? 334 + 22 * k : 748 - 22 * k;
    };
    let s = LN(180, top + 366, 900, top + 366, { w: 3, dash: '16 13', op: .3, t: .3 });
    // 车斗主体
    s += P(`M334 ${ey} L${sideX(byb, 0)} ${byb} H${sideX(byb, 1)} L748 ${ey} Z`, { w: 5, fill: PAPER_FILL, t: .36 });
    s += P(`M748 ${ey} L${sideX(byb, 1)} ${byb} H646 L690 ${ey} Z`, { fill: 'url(#hatchD)', w: 0, op: .3, t: .44 });
    // 上下沿
    s += LN(328, ry, 754, ry, { w: 6, t: .48 });
    s += LN(342, ey, 740, ey, { w: 2.6, op: .45, t: .52 });
    // 网篮竖筋
    for (let i = 1; i <= 4; i++) {
      const xt = 334 + 414 * i / 5, xb = 356 + 370 * i / 5;
      s += LN(xt.toFixed(1), ey, xb.toFixed(1), byb, { w: 2.4, op: .38, t: .56 + i * .03 });
    }
    // 网篮横筋
    [top + 172, top + 214, top + 256].forEach((y, i) => {
      s += LN(sideX(y, 0).toFixed(1), y, sideX(y, 1).toFixed(1), y, { w: 2.2, op: .32, t: .7 + i * .04 });
    });
    // 推手
    s += P(`M334 ${ry} Q286 ${top + 104} 268 ${top + 62}`, { w: 6, t: .5 });
    s += P(`M258 ${top + 66} Q266 ${top + 50} 282 ${top + 58}`, { w: 6, c: accent, t: .6 });
    // 车斗里的货
    s += RF(378, top + 44, 92, 68, { rx: 3, w: 3.4, fill: 'url(#hatchD)', op: .95, t: .66 });
    s += LN(424, top + 44, 424, top + 112, { w: 2.2, op: .4, t: .7 });
    s += LN(392, top + 78, 412, top + 78, { w: 2.4, op: .45, t: .72 });
    s += LN(436, top + 78, 456, top + 78, { w: 2.4, op: .45, t: .74 });
    s += RF(636, top + 42, 18, 24, { w: 2.8, fill: PAPER_FILL, t: .72 });
    s += RF(626, top + 64, 38, 48, { rx: 8, w: 3.6, fill: PAPER_FILL, t: .76 });
    s += LN(632, top + 40, 658, top + 40, { w: 7, c: '#2d2822', t: .74 });
    s += LN(632, top + 86, 658, top + 86, { w: 3, c: accent, op: .7, t: .8 });
    s += P(`M700 ${top + 70} q34 -26 62 -2 q6 30 -12 44 h-44 Z`, { w: 3.4, fill: PAPER_FILL, t: .78 });
    s += P(`M712 ${top + 82} q10 -18 26 -22 M722 ${top + 90} q6 -14 20 -18`, { c: accent, w: 2.4, op: .6, t: .84 });
    // 支腿与脚轮
    [[400, top + 330], [676, top + 330]].forEach((p, i) => {
      s += LN(p[0], byb, p[0], p[1], { w: 4.4, t: .88 + i * .04 });
      s += CI(p[0] + (i ? 6 : -6), top + 344, 18, { w: 4, fill: PAPER_FILL, t: .94 + i * .04 });
      s += CI(p[0] + (i ? 6 : -6), top + 344, 6, { w: 2.4, op: .45, t: .98 + i * .04 });
    });
    // 价格牌
    s += P(`M754 ${ry} q34 16 54 44`, { c: accent, w: 2.4, dash: '7 8', op: .6, t: 1 });
    s += `<g class="f" style="--d:1.04s" transform="translate(802 ${top + 156}) rotate(-12)">
<path d="M0 0 h78 l26 26 -26 26 H0 Z" fill="${PAPER_FILL}" stroke="${accent}" stroke-width="3.4" stroke-linejoin="round"/>
<circle cx="12" cy="26" r="6" fill="none" stroke="${accent}" stroke-width="2.6"/>
<text x="54" y="35" text-anchor="middle" font-size="28" font-weight="700" fill="${accent}" font-family="Baskerville,serif">30%</text>
</g>`;
    return s;
  }
  if (theme === 'pill') {
    let s = `<g class="f" style="--d:.34s" transform="translate(540 ${top + 156}) rotate(-26)">
<rect x="-148" y="-58" width="296" height="116" rx="58" fill="${PAPER_FILL}" stroke="#2d2822" stroke-width="5"/>
<path d="M0 -58 H90 A58 58 0 0 1 90 58 H0 Z" fill="url(#hatchD)" stroke="none" opacity=".8"/>
<path d="M8 -50 H88 A50 50 0 0 1 88 50 H8 Z" fill="none" stroke="${accent}" stroke-width="3" opacity=".7"/>
<line x1="0" y1="-58" x2="0" y2="58" stroke="#2d2822" stroke-width="4"/>
<line x1="-126" y1="-14" x2="-56" y2="-14" stroke="#2d2822" stroke-width="6" opacity=".25" stroke-linecap="round"/>
<circle cx="-104" cy="18" r="9" fill="${accent}" opacity=".75"/>
<circle cx="120" cy="-20" r="7" fill="none" stroke="${accent}" stroke-width="2.6" opacity=".8"/>
</g>`;
    // 铝塑包装
    s += RF(176, top + 262, 216, 104, { rx: 16, w: 4, fill: PAPER_FILL, t: .52 });
    s += RF(176, top + 262, 216, 12, { rx: 6, fill: 'url(#hatchD)', w: 0, op: .35, t: .56 });
    [[224, top + 298], [344, top + 298], [224, top + 344], [344, top + 344]].forEach((p, i) => {
      s += CI(p[0], p[1], 19, { w: 2.6, dash: '7 6', op: .55, t: .64 + i * .04 });
      s += `<ellipse cx="${p[0]}" cy="${p[1]}" rx="10" ry="12" fill="none" stroke="${accent}" stroke-width="2.4" opacity=".5" class="f" style="--d:${(.78 + i * .04).toFixed(2)}s"/>`;
    });
    // 散装胶囊 ×2
    s += `<g class="f" style="--d:1.02s" transform="translate(732 ${top + 294}) rotate(26)">
<rect x="-58" y="-22" width="116" height="44" rx="22" fill="${PAPER_FILL}" stroke="#2d2822" stroke-width="3.6"/>
<path d="M0 -22 H36 A22 22 0 0 1 36 22 H0 Z" fill="${accent}" fill-opacity=".18" stroke="${accent}" stroke-width="2.8"/>
<line x1="0" y1="-22" x2="0" y2="22" stroke="#2d2822" stroke-width="2.8"/>
</g>`;
    s += `<g class="f" style="--d:1.12s" transform="translate(790 ${top + 356}) rotate(-16)">
<rect x="-46" y="-18" width="92" height="36" rx="18" fill="${PAPER_FILL}" stroke="#2d2822" stroke-width="3.2"/>
<line x1="0" y1="-18" x2="0" y2="18" stroke="#2d2822" stroke-width="2.6"/>
<line x1="12" y1="0" x2="30" y2="0" stroke="${accent}" stroke-width="2.6" opacity=".7"/>
</g>`;
    // 医疗十字徽章
    s += CI(836, top + 118, 58, { c: accent, w: 2, dash: '9 11', op: .28, t: .84 });
    s += CI(836, top + 118, 42, { w: 3.6, fill: PAPER_FILL, t: .9 });
    s += LN(836, top + 96, 836, top + 140, { w: 11, c: accent, t: 1 });
    s += LN(814, top + 118, 858, top + 118, { w: 11, c: accent, t: 1.02 });
    s += P(`M300 ${top + 388} Q540 ${top + 406} 806 ${top + 376}`, { c: accent, w: 2.6, dash: '11 12', op: .3, t: 1.08 });
    return s;
  }
  if (theme === 'house') {
    const b = top + 356;
    let s = CI(858, top + 80, 36, { c: accent, w: 3.2, fill: PAPER_FILL, t: .3 });
    for (let i = 0; i < 8; i++) {
      const a = Math.PI * 2 * i / 8;
      s += LN((858 + Math.cos(a) * 46).toFixed(1), (top + 80 + Math.sin(a) * 46).toFixed(1),
        (858 + Math.cos(a) * 60).toFixed(1), (top + 80 + Math.sin(a) * 60).toFixed(1),
        { w: 2.6, c: accent, op: .55, t: .36 + i * .03 });
    }
    // 烟囱与烟
    s += RF(648, top + 88, 34, 80, { w: 3.4, fill: PAPER_FILL, t: .36 });
    s += RF(648, top + 88, 10, 80, { fill: 'url(#hatchD)', w: 0, op: .3, t: .4 });
    s += RF(642, top + 82, 46, 10, { w: 3, fill: PAPER_FILL, t: .42 });
    s += CI(674, top + 56, 13, { w: 2.4, op: .3, dash: '7 7', t: .78 });
    s += CI(694, top + 40, 9, { w: 2.2, op: .2, t: .86 });
    // 屋顶
    s += P(`M282 ${top + 186} L516 ${top + 58} L750 ${top + 186} Z`, { w: 5.4, fill: PAPER_FILL, t: .44 });
    s += P(`M516 ${top + 58} L750 ${top + 186} H612 Z`, { fill: 'url(#hatchD)', w: 0, op: .35, t: .5 });
    s += P(`M310 ${top + 186} L516 ${top + 82} L722 ${top + 186}`, { w: 2.4, op: .3, t: .54 });
    for (let i = 0; i < 4; i++) s += LN(344 + i * 14, top + 176, 356 + i * 14, top + 164, { w: 2.6, op: .3, t: .58 + i * .03 });
    // 墙体
    s += P(`M330 ${top + 186} H708 V${b} H330 Z`, { w: 5, fill: PAPER_FILL, t: .56 });
    s += LN(318, b, 720, b, { w: 5, t: .6 });
    // 门
    s += RF(478, b - 124, 80, 124, { w: 4.2, fill: PAPER_FILL, t: .64 });
    s += RF(492, b - 108, 52, 44, { w: 2.4, op: .4, t: .68 });
    s += RF(492, b - 52, 52, 30, { w: 2.4, op: .4, t: .7 });
    s += CI(546, b - 60, 5, { fill: accent, c: accent, t: .76 });
    s += RF(462, b, 112, 10, { w: 3.4, fill: PAPER_FILL, t: .8 });
    s += RF(450, b + 10, 136, 10, { w: 3.2, fill: PAPER_FILL, t: .84 });
    // 十字窗 ×2
    [[368, top + 214], [612, top + 214]].forEach((p, i) => {
      const t = .86 + i * .05;
      s += RF(p[0], p[1], 78, 78, { w: 3.6, fill: 'url(#hatchD)', op: .95, t });
      s += LN(p[0] + 39, p[1], p[0] + 39, p[1] + 78, { w: 2.2, op: .5, t: t + .03 });
      s += LN(p[0], p[1] + 39, p[0] + 78, p[1] + 39, { w: 2.2, op: .5, t: t + .05 });
      s += RF(p[0] - 8, p[1] + 80, 94, 14, { rx: 4, w: 2.8, fill: PAPER_FILL, t: t + .07 });
      s += CI(p[0] + 12, p[1] + 78, 5, { fill: accent, c: accent, op: .8, t: t + .1 });
      s += CI(p[0] + 38, p[1] + 76, 4.6, { fill: accent, c: accent, op: .65, t: t + .12 });
      s += CI(p[0] + 62, p[1] + 78, 5, { fill: accent, c: accent, op: .8, t: t + .14 });
    });
    // 门前小路
    s += P(`M496 ${b + 20} L452 ${top + 392}`, { w: 3, dash: '9 10', op: .3, t: .94 });
    s += P(`M542 ${b + 20} L612 ${top + 392}`, { w: 3, dash: '9 10', op: .3, t: .96 });
    // 灌木
    s += P(`M292 ${top + 392} q0 -50 44 -50 q34 0 40 50 Z`, { w: 3.4, fill: PAPER_FILL, t: .98 });
    s += P(`M700 ${top + 392} q4 -42 40 -42 q32 0 38 42 Z`, { w: 3.4, fill: PAPER_FILL, t: 1.02 });
    s += P(`M312 ${top + 356} q8 -14 20 -18 M726 ${top + 362} q8 -12 20 -16`, { c: accent, w: 2.4, op: .5, t: 1.06 });
    // 价格上行箭头
    s += LN(214, top + 342, 214, top + 200, { c: accent, w: 3.4, dash: '10 10', op: .7, t: 1.04 });
    s += P(`M196 ${top + 218} L214 ${top + 188} L232 ${top + 218}`, { c: accent, w: 3.4, t: 1.14 });
    s += LN(198, top + 392, 886, top + 392, { w: 3, dash: '16 13', op: .3, t: 1.08 });
    return s;
  }
  if (theme === 'car') {
    const b = top + 300;
    const wheel = x => {
      let spokes = '';
      for (let i = 0; i < 5; i++) {
        const a = i * Math.PI * 2 / 5 - Math.PI / 2;
        spokes += `<line x1="${(x + Math.cos(a) * 12).toFixed(1)}" y1="${(b - 2 + Math.sin(a) * 12).toFixed(1)}" x2="${(x + Math.cos(a) * 29).toFixed(1)}" y2="${(b - 2 + Math.sin(a) * 29).toFixed(1)}" stroke="#2d2822" stroke-width="2.6" opacity=".5"/>`;
      }
      return `<circle cx="${x}" cy="${b - 2}" r="58" fill="none" stroke="#2d2822" stroke-width="5" class="f" style="--d:.6s"/>
<circle cx="${x}" cy="${b - 2}" r="29" fill="none" stroke="#2d2822" stroke-width="3.6" class="f" style="--d:.75s"/>
${spokes}`;
    };
    return `<path d="M264 ${b - 22} Q262 ${b - 86} 300 ${b - 98} L372 ${b - 106} L452 ${b - 188} Q476 ${b - 202} 520 ${b - 202} L636 ${b - 202} L714 ${b - 122} L782 ${b - 110} Q812 ${b - 102} 816 ${b - 42} L816 ${b - 18} L264 ${b - 18} Z" fill="none" stroke="#2d2822" stroke-width="5" stroke-linejoin="round" class="f" style="--d:.35s"/>
<path d="M470 ${b - 190} L538 ${b - 190} L538 ${b - 126} L458 ${b - 126} Z" fill="none" stroke="#2d2822" stroke-width="3.4" stroke-linejoin="round" class="f" style="--d:.55s"/>
<path d="M562 ${b - 190} L632 ${b - 190} L708 ${b - 128} L562 ${b - 128} Z" fill="none" stroke="#2d2822" stroke-width="3.4" stroke-linejoin="round" class="f" style="--d:.58s"/>
<line x1="550" y1="${b - 194}" x2="550" y2="${b - 128}" stroke="#2d2822" stroke-width="3.4" class="f" style="--d:.62s"/>
<line x1="550" y1="${b - 118}" x2="550" y2="${b - 30}" stroke="#2d2822" stroke-width="2.6" opacity=".45" class="f" style="--d:.66s"/>
<line x1="574" y1="${b - 108}" x2="604" y2="${b - 108}" stroke="#2d2822" stroke-width="3.2" opacity=".6" class="f" style="--d:.7s"/>
<path d="M700 ${b - 166} l18 -10" fill="none" stroke="#2d2822" stroke-width="3" stroke-linecap="round" class="f" style="--d:.72s"/>
<rect x="712" y="${b - 190}" width="30" height="21" rx="8" fill="none" stroke="#2d2822" stroke-width="3.2" class="f" style="--d:.74s"/>
<ellipse cx="802" cy="${b - 72}" rx="9" ry="14" fill="none" stroke="${accent}" stroke-width="3.6" opacity=".85" class="f" style="--d:.8s"/>
<rect x="266" y="${b - 74}" width="11" height="18" rx="4" fill="#b23a2a" opacity=".6" class="f" style="--d:.82s"/>
${wheel(388)}${wheel(700)}
<path d="M320 ${b - 18} Q388 ${b - 92} 456 ${b - 18}" fill="none" stroke="#2d2822" stroke-width="2.6" opacity=".28"/>
<path d="M632 ${b - 18} Q700 ${b - 92} 768 ${b - 18}" fill="none" stroke="#2d2822" stroke-width="2.6" opacity=".28"/>
<line x1="210" y1="${b + 62}" x2="870" y2="${b + 62}" stroke="${accent}" stroke-width="4" stroke-dasharray="16 14" class="draw" style="--d:.95s"/>
<line x1="150" y1="${b - 150}" x2="222" y2="${b - 150}" stroke="#2d2822" stroke-width="3.4" opacity=".35" stroke-linecap="round" class="f" style="--d:1.05s"/>
<line x1="176" y1="${b - 118}" x2="234" y2="${b - 118}" stroke="#2d2822" stroke-width="3" opacity=".25" stroke-linecap="round" class="f" style="--d:1.12s"/>`;
  }
  if (theme === 'people') {
    const base = top + 396;
    const figure = (x, k, opt) => {
      const hy = base - 176 * k;
      const hr = 42 * k;
      const sh = base - 118 * k;
      const hair = opt.long
        ? `<path d="M${x - hr} ${hy - 10} Q${x - hr * 1.06} ${hy - hr - 14 * k} ${x} ${hy - hr - 14 * k} Q${x + hr * 1.06} ${hy - hr - 14 * k} ${x + hr} ${hy - 10}" fill="none" stroke="#2d2822" stroke-width="4.2" stroke-linecap="round"/>
<path d="M${x - hr + 3} ${hy - 8} Q${x - hr - 17} ${hy + 26} ${x - hr - 8} ${hy + 58}" fill="none" stroke="#2d2822" stroke-width="4.2" stroke-linecap="round"/>
<path d="M${x + hr - 3} ${hy - 8} Q${x + hr + 17} ${hy + 26} ${x + hr + 8} ${hy + 58}" fill="none" stroke="#2d2822" stroke-width="4.2" stroke-linecap="round"/>`
        : `<path d="M${x - hr} ${hy - 8} Q${x - hr * 0.92} ${hy - hr - 12 * k} ${x} ${hy - hr - 12 * k} Q${x + hr * 0.92} ${hy - hr - 12 * k} ${x + hr} ${hy - 8}" fill="none" stroke="#2d2822" stroke-width="4.4" stroke-linecap="round"/>`;
      const tie = opt.tie
        ? `<path d="M${x} ${sh - 12 * k} L${x - 9 * k} ${sh + 6 * k} L${x} ${sh + 34 * k} L${x + 9 * k} ${sh + 6 * k} Z" fill="${accent}" opacity=".7"/>`
        : `<circle cx="${x + hr * 0.94}" cy="${hy + 6}" r="${3.6 * k}" fill="${accent}" opacity=".85"/>`;
      return `<g class="f" style="--d:${opt.d}s">
<circle cx="${x}" cy="${hy}" r="${hr}" fill="none" stroke="#2d2822" stroke-width="4.4"/>
${hair}
<line x1="${x - 14 * k}" y1="${hy + hr - 4}" x2="${x - 14 * k}" y2="${sh + 6 * k}" stroke="#2d2822" stroke-width="3.6"/>
<line x1="${x + 14 * k}" y1="${hy + hr - 4}" x2="${x + 14 * k}" y2="${sh + 6 * k}" stroke="#2d2822" stroke-width="3.6"/>
<path d="M${x - 72 * k} ${base} L${x - 58 * k} ${sh} Q${x} ${sh - 30 * k} ${x + 58 * k} ${sh} L${x + 72 * k} ${base}" fill="none" stroke="#2d2822" stroke-width="4.6" stroke-linejoin="round"/>
<path d="M${x - 20 * k} ${sh - 4 * k} L${x} ${sh + 24 * k} L${x + 20 * k} ${sh - 4 * k}" fill="none" stroke="#2d2822" stroke-width="3.4"/>
${tie}
</g>`;
    };
    const arm = `<path d="M${540 + 58 * 1.16} ${base - 118 * 1.16} L${540 + 108} ${base - 214} L${540 + 116} ${base - 282}" fill="none" stroke="#2d2822" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round" class="f" style="--d:1s"/>
<circle cx="${540 + 116}" cy="${base - 288}" r="11" fill="none" stroke="#2d2822" stroke-width="3.6" class="f" style="--d:1.1s"/>`;
    const bubble = `<rect x="356" y="${top + 22}" width="196" height="96" rx="18" fill="none" stroke="#2d2822" stroke-width="3.6" class="f" style="--d:.8s"/>
<path d="M392 ${top + 118} L378 ${top + 146} L418 ${top + 118}" fill="none" stroke="#2d2822" stroke-width="3.4" stroke-linejoin="round" class="f" style="--d:.9s"/>
<line x1="386" y1="${top + 54}" x2="516" y2="${top + 54}" stroke="#2d2822" stroke-width="3" opacity=".55" class="f" style="--d:.95s"/>
<line x1="386" y1="${top + 76}" x2="484" y2="${top + 76}" stroke="#2d2822" stroke-width="3" opacity=".4" class="f" style="--d:1s"/>
<rect x="694" y="${top + 62}" width="136" height="84" rx="16" fill="none" stroke="${accent}" stroke-width="3.4" opacity=".85" class="f" style="--d:1.05s"/>
<path d="M748 ${top + 126} L762 ${top + 92} L776 ${top + 126}" fill="none" stroke="${accent}" stroke-width="3.4" stroke-linecap="round" class="f" style="--d:1.25s"/>`;
    return figure(330, 1.0, { tie: true, d: '.35' }) + figure(540, 1.16, { tie: false, d: '.45' }) + figure(752, 0.98, { tie: false, long: true, d: '.55' }) + arm + bubble +
      `<line x1="204" y1="${base + 8}" x2="876" y2="${base + 8}" stroke="#2d2822" stroke-width="2.6" opacity=".3" class="draw" style="--d:1.3s"/>`;
  }
  /* 兜底主题 idea：灯泡 + 推演节点网 */
  if (theme === 'idea') {
    const bx = 540, by = top + 168;
    let s = `<ellipse cx="${bx}" cy="${top + 356}" rx="124" ry="13" fill="none" stroke="#2d2822" stroke-width="2.4" stroke-dasharray="10 11" opacity=".2" class="f" style="--d:.3s"/>`;
    s += CI(bx, by, 186, { w: 2, dash: '10 14', op: .13, t: .34 });
    s += P(`M${bx - 96} ${by + 6} a96 96 0 1 1 192 0 q0 50 -34 76 q-16 14 -16 32 h-92 q0 -18 -16 -32 q-34 -26 -34 -76 Z`, { w: 5, fill: PAPER_FILL, t: .44 });
    s += P(`M${bx - 96} ${by + 6} a96 96 0 0 0 96 96 v-96 Z`, { fill: 'url(#hatchD)', w: 0, op: .45, t: .52 });
    s += P(`M${bx - 36} ${by + 34} q18 -44 36 0 q18 44 36 0`, { c: accent, w: 4, t: .68 });
    s += LN(bx - 36, by + 38, bx - 36, by + 58, { w: 3, t: .72 });
    s += LN(bx + 36, by + 38, bx + 36, by + 58, { w: 3, t: .74 });
    s += P(`M${bx - 46} ${by + 118} h92`, { w: 5, t: .8 });
    s += P(`M${bx - 42} ${by + 138} h84`, { w: 4.4, t: .84 });
    s += P(`M${bx - 33} ${by + 157} h66`, { w: 4, t: .88 });
    s += P(`M${bx - 22} ${by + 174} h44`, { w: 3.6, t: .92 });
    for (let i = 0; i < 9; i++) {
      const a = Math.PI + Math.PI * i / 8;
      const r0 = 108 + (i % 2 ? 8 : 0), r1 = r0 + (i % 3 ? 26 : 46);
      s += LN((bx + Math.cos(a) * r0).toFixed(1), (by + Math.sin(a) * r0).toFixed(1),
        (bx + Math.cos(a) * r1).toFixed(1), (by + Math.sin(a) * r1).toFixed(1),
        { w: i % 2 ? 2.8 : 4.6, op: .5, c: i % 3 ? '#2d2822' : accent, t: .58 + i * .03 });
    }
    [[186, top + 112], [892, top + 96], [256, top + 306], [828, top + 316]].forEach((p, i) => {
      s += LN(p[0], p[1], bx + (p[0] < bx ? -142 : 142), by + (p[1] > by ? 34 : -26), { w: 2.2, op: .26, dash: '7 9', t: .84 + i * .04 });
      s += CI(p[0], p[1], 18, { w: 3, fill: PAPER_FILL, t: .9 + i * .04 });
      s += CI(p[0], p[1], 5, { fill: i % 2 ? accent : '#2d2822', c: i % 2 ? accent : '#2d2822', t: 1.04 + i * .03 });
    });
    s += LN(196, top + 374, 884, top + 374, { w: 3, dash: '16 13', op: .32, t: 1.04 });
    s += P(`M320 ${top + 348} q112 -30 226 -6`, { c: accent, w: 3.4, dash: '9 10', op: .55, t: 1.1 });
    s += P(`M546 ${top + 342} l-20 -8 M546 ${top + 342} l-3 20`, { c: accent, w: 3.4, t: 1.2 });
    return s;
  }
  if (theme === 'rocket') {
    const g = top + 400;
    let s = LN(180, g, 900, g, { w: 4, t: .3 });
    s += RF(414, g - 12, 252, 12, { w: 3, fill: 'url(#hatchD)', t: .34 });
    // 发射架
    s += LN(706, top + 128, 706, g, { w: 4.4, t: .38 });
    s += LN(744, top + 128, 744, g, { w: 4.4, t: .4 });
    s += LN(706, top + 128, 744, top + 128, { w: 4.4, t: .42 });
    for (let i = 0; i < 5; i++) {
      s += LN(706, top + 158 + i * 48, 744, top + 184 + i * 48, { w: 2.2, op: .45, t: .46 + i * .03 });
    }
    s += LN(614, top + 214, 706, top + 214, { w: 3.4, t: .6 });
    s += LN(614, top + 322, 706, top + 322, { w: 3.4, t: .64 });
    // 箭体
    s += P(`M540 ${top + 96} Q568 ${top + 128} 584 ${top + 178} L496 ${top + 178} Q512 ${top + 128} 540 ${top + 96} Z`, { w: 4.6, fill: PAPER_FILL, t: .5 });
    s += P(`M496 ${top + 178} L496 ${top + 356} Q540 ${top + 380} 584 ${top + 356} L584 ${top + 178} Z`, { w: 4.6, fill: PAPER_FILL, t: .56 });
    s += CI(540, top + 218, 25, { w: 3.6, fill: PAPER_FILL, t: .66 });
    s += CI(540, top + 218, 11, { w: 3, c: accent, t: .7 });
    s += LN(496, top + 300, 584, top + 300, { w: 6, c: accent, op: .85, t: .74 });
    s += LN(496, top + 330, 584, top + 330, { w: 3, op: .45, t: .76 });
    s += P(`M496 ${top + 296} L446 ${top + 372} L496 ${top + 356} Z`, { w: 4.2, fill: PAPER_FILL, t: .78 });
    s += P(`M584 ${top + 296} L634 ${top + 372} L584 ${top + 356} Z`, { w: 4.2, fill: PAPER_FILL, t: .8 });
    // 喷管与火焰
    s += P(`M512 ${top + 356} L506 ${top + 384} H574 L568 ${top + 356}`, { w: 4.2, t: .84 });
    s += P(`M512 ${top + 384} Q540 ${top + 452} 568 ${top + 384} Z`, { w: 3.6, fill: 'url(#hatch)', t: .9 });
    s += P(`M524 ${top + 386} Q540 ${top + 432} 556 ${top + 386} Z`, { w: 0, fill: accent, op: .5, t: .96 });
    // 尾焰烟雾
    s += P(`M404 ${g - 8} q-10 -26 12 -30 q4 -18 24 -12 q18 -8 26 8 q16 2 12 20 q2 12 -10 14 Z`, { w: 3.4, fill: PAPER_FILL, t: .98 });
    s += P(`M676 ${g - 8} q14 -24 -8 -30 q-2 -18 -22 -12 q-16 -8 -24 8 q-14 2 -10 20 q-2 12 10 14 Z`, { w: 3.4, fill: PAPER_FILL, t: 1.04 });
    // 上升轨迹
    s += P(`M196 ${top + 330} Q286 ${top + 150} 420 ${top + 116}`, { c: accent, w: 3, dash: '9 10', op: .55, t: 1.06 });
    s += P(`M420 ${top + 116} l-26 4 M420 ${top + 116} l-4 26`, { c: accent, w: 3, t: 1.16 });
    s += CI(214, top + 78, 6, { fill: accent, c: accent, t: 1.1 });
    return s;
  }
  if (theme === 'speaker') {
    const g = top + 432;
    let s = LN(258, g, 822, g, { w: 4, t: .3 });
    // 背景大屏
    s += RF(236, top + 30, 608, 198, { rx: 12, w: 4.6, fill: PAPER_FILL, t: .36 });
    s += RF(260, top + 54, 560, 150, { rx: 6, w: 2.4, op: .4, t: .42 });
    s += P(`M300 ${top + 176} L372 ${top + 130} L444 ${top + 152} L516 ${top + 106}`, { c: accent, w: 4, t: .5 });
    s += P(`M516 ${top + 106} l-20 2 M516 ${top + 106} l-2 20`, { c: accent, w: 3, t: .58 });
    s += LN(300, top + 186, 596, top + 186, { w: 2.4, op: .3, t: .56 });
    s += RF(640, top + 92, 128, 92, { rx: 8, w: 2.8, op: .45, fill: 'url(#hatchD)', t: .6 });
    s += LN(662, top + 122, 746, top + 122, { w: 2.4, op: .5, t: .64 });
    s += LN(662, top + 144, 716, top + 144, { w: 2.4, op: .4, t: .68 });
    // 人物
    s += CI(540, top + 274, 46, { w: 4.6, fill: PAPER_FILL, t: .7 });
    s += P(`M494 ${top + 268} q2 -58 46 -58 q44 0 46 58`, { w: 4.4, t: .76 });
    s += P(`M452 ${g} L470 ${top + 332} Q502 ${top + 306} 540 ${top + 306} Q578 ${top + 306} 610 ${top + 332} L628 ${g} Z`, { w: 4.8, fill: PAPER_FILL, t: .8 });
    s += P(`M540 ${top + 308} L514 ${g} M540 ${top + 308} L566 ${g}`, { w: 3.2, op: .55, t: .86 });
    s += P(`M514 ${top + 318} L540 ${top + 344} L566 ${top + 318}`, { w: 3.6, t: .9 });
    // 手势
    s += P(`M604 ${top + 344} L648 ${top + 306} L676 ${top + 246}`, { w: 5, t: .94 });
    s += CI(680, top + 240, 11, { w: 3.4, fill: PAPER_FILL, t: 1 });
    s += P(`M476 ${top + 344} L450 ${g - 6}`, { w: 5, t: .96 });
    // 聚光
    s += P(`M212 ${top + 24} L466 ${top + 250}`, { c: accent, w: 2.2, dash: '8 12', op: .3, t: 1.04 });
    s += P(`M868 ${top + 24} L614 ${top + 250}`, { c: accent, w: 2.2, dash: '8 12', op: .3, t: 1.08 });
    s += CI(206, top + 22, 5, { fill: accent, c: accent, t: 1.12 });
    s += CI(874, top + 22, 5, { fill: accent, c: accent, t: 1.14 });
    return s;
  }
  if (theme === 'datacenter') {
    const g = top + 372;
    let s = LN(150, g, 930, g, { w: 4, t: .3 });
    const rack = (x, d) => {
      let r = RF(x, top + 96, 214, 264, { rx: 8, w: 4.4, fill: PAPER_FILL, t: d });
      for (let i = 0; i < 5; i++) {
        r += RF(x + 16, top + 114 + i * 46, 182, 32, { rx: 4, w: 2.2, op: .5, t: d + .05 + i * .04 });
        r += CI(x + 172, top + 130 + i * 46, 4, { fill: i % 2 ? accent : '#2d2822', c: i % 2 ? accent : '#2d2822', t: d + .08 + i * .04 });
        r += LN(x + 30, top + 130 + i * 46, x + 116, top + 130 + i * 46, { w: 2, op: .3, t: d + .07 + i * .04 });
      }
      return r;
    };
    s += rack(176, .38);
    s += rack(433, .44);
    s += rack(690, .5);
    // 走线
    s += P(`M282 ${g - 4} q-14 -18 0 -34`, { w: 2.4, op: .35, t: .82 });
    s += P(`M540 ${g - 4} q14 -18 0 -34`, { w: 2.4, op: .35, t: .84 });
    // 散热与冷风
    s += P(`M540 ${top + 64} q-20 -26 0 -46 q20 20 0 46 Z`, { w: 3, fill: PAPER_FILL, t: .88 });
    s += P(`M336 ${top + 90} Q390 ${top + 42} 476 ${top + 34}`, { c: accent, w: 2.6, dash: '7 9', op: .45, t: .92 });
    s += P(`M744 ${top + 90} Q690 ${top + 42} 604 ${top + 34}`, { c: accent, w: 2.6, dash: '7 9', op: .45, t: .96 });
    s += LN(520, top + 74, 496, top + 44, { c: accent, w: 2.2, op: .5, t: 1 });
    s += LN(560, top + 74, 584, top + 44, { c: accent, w: 2.2, op: .5, t: 1.02 });
    return s;
  }
  if (theme === 'gpu') {
    const x = 290, y = top + 128, w = 500;
    let s = RF(x, y, w, 196, { rx: 14, w: 4.8, fill: PAPER_FILL, t: .34 });
    s += RF(x + 12, y + 12, w - 24, 172, { rx: 8, w: 2, op: .28, t: .4 });
    // 双风扇
    [[x + 136, y + 96], [x + 364, y + 96]].forEach((f, fi) => {
      const fx = f[0], fy = f[1];
      s += CI(fx, fy, 62, { w: 4, t: .48 + fi * .06 });
      for (let i = 0; i < 4; i++) {
        const a = Math.PI * 2 * i / 4 + .4;
        s += P(`M${(fx + Math.cos(a) * 14).toFixed(1)} ${(fy + Math.sin(a) * 14).toFixed(1)} Q${(fx + Math.cos(a + .5) * 44).toFixed(1)} ${(fy + Math.sin(a + .5) * 44).toFixed(1)} ${(fx + Math.cos(a + .26) * 56).toFixed(1)} ${(fy + Math.sin(a + .26) * 56).toFixed(1)}`, { w: 3.4, op: .8, t: .54 + fi * .06 + i * .03 });
      }
      s += CI(fx, fy, 12, { w: 3, fill: PAPER_FILL, t: .66 + fi * .06 });
    });
    // 供电口与金手指
    s += RF(x + w - 78, y + 14, 52, 32, { rx: 4, w: 3, fill: 'url(#hatchD)', t: .84 });
    s += RF(x + 18, y + 200, w - 36, 15, { rx: 3, w: 2.6, fill: 'url(#hatchD)', t: .88 });
    // 螺丝与光效
    [[x + 18, y + 20], [x + w - 20, y + 62], [x + 18, y + 178], [x + w - 20, y + 176]].forEach((p, i) => {
      s += CI(p[0], p[1], 5, { w: 2.6, t: .92 + i * .02 });
    });
    s += P(`M${x + 90} ${y + 186} q${w / 2 - 90} 22 ${w - 180} 0`, { c: accent, w: 3, dash: '9 10', op: .45, t: .98 });
    return s;
  }
  if (theme === 'laptop') {
    let s = RF(300, top + 62, 480, 272, { rx: 14, w: 4.8, fill: PAPER_FILL, t: .34 });
    s += RF(324, top + 86, 432, 224, { rx: 6, w: 2.2, op: .3, t: .4 });
    // 屏内：端侧芯片与向外连线
    s += RF(486, top + 152, 108, 92, { rx: 8, w: 4, fill: PAPER_FILL, t: .48 });
    s += RF(506, top + 172, 68, 52, { rx: 4, w: 2.4, c: accent, op: .85, t: .54 });
    for (let i = 0; i < 4; i++) {
      s += LN(500 + i * 24, top + 140, 500 + i * 24, top + 152, { w: 2.4, t: .6 });
      s += LN(500 + i * 24, top + 244, 500 + i * 24, top + 256, { w: 2.4, t: .62 });
    }
    s += P(`M474 ${top + 198} L392 ${top + 160}`, { c: accent, w: 2.4, dash: '6 8', op: .5, t: .68 });
    s += P(`M606 ${top + 198} L688 ${top + 160}`, { c: accent, w: 2.4, dash: '6 8', op: .5, t: .7 });
    // 机身与键盘
    s += P(`M276 ${top + 334} L804 ${top + 334} L864 ${top + 398} L216 ${top + 398} Z`, { w: 4.6, fill: PAPER_FILL, t: .74 });
    for (let i = 0; i < 3; i++) {
      s += LN(330 - i * 12, top + 352 + i * 14, 750 + i * 12, top + 352 + i * 14, { w: 2.2, op: .28, t: .8 + i * .03 });
    }
    s += RF(472, top + 376, 136, 12, { rx: 4, w: 2.2, op: .3, t: .9 });
    s += CI(818, top + 344, 4, { fill: accent, c: accent, t: .96 });
    return s;
  }
  if (theme === 'robot') {
    const g = top + 424;
    let s = `<ellipse cx="540" cy="${g}" rx="152" ry="14" fill="none" stroke="#2d2822" stroke-width="2.4" stroke-dasharray="10 11" opacity=".2" class="f" style="--d:.3s"/>`;
    s += LN(540, top + 74, 540, top + 42, { w: 3.6, t: .36 });
    s += CI(540, top + 38, 7, { fill: accent, c: accent, t: .4 });
    s += RF(484, top + 74, 112, 92, { rx: 18, w: 4.6, fill: PAPER_FILL, t: .42 });
    s += CI(516, top + 116, 10, { fill: accent, c: accent, t: .5 });
    s += CI(564, top + 116, 10, { fill: accent, c: accent, t: .52 });
    s += LN(514, top + 146, 566, top + 146, { w: 3, op: .5, t: .56 });
    s += RF(524, top + 166, 32, 18, { w: 3, fill: PAPER_FILL, t: .58 });
    s += RF(452, top + 184, 176, 138, { rx: 16, w: 4.6, fill: PAPER_FILL, t: .62 });
    s += RF(490, top + 206, 100, 58, { rx: 8, w: 2.6, op: .45, t: .68 });
    for (let i = 0; i < 3; i++) {
      s += LN(506, top + 220 + i * 13, 574, top + 220 + i * 13, { w: 2.2, op: .35, t: .72 + i * .03 });
    }
    s += CI(566, top + 288, 6, { fill: accent, c: accent, t: .82 });
    // 手臂
    s += CI(442, top + 208, 14, { w: 3.6, fill: PAPER_FILL, t: .7 });
    s += CI(638, top + 208, 14, { w: 3.6, fill: PAPER_FILL, t: .72 });
    s += P(`M442 ${top + 222} L410 ${top + 292} L426 ${top + 350}`, { w: 4.6, t: .76 });
    s += P(`M638 ${top + 222} L670 ${top + 292} L654 ${top + 350}`, { w: 4.6, t: .78 });
    s += CI(410, top + 292, 9, { w: 3, fill: PAPER_FILL, t: .84 });
    s += CI(670, top + 292, 9, { w: 3, fill: PAPER_FILL, t: .86 });
    s += CI(426, top + 358, 11, { w: 3.2, fill: PAPER_FILL, t: .88 });
    s += CI(654, top + 358, 11, { w: 3.2, fill: PAPER_FILL, t: .9 });
    // 腿脚
    s += P(`M506 ${top + 322} L494 ${top + 400} L530 ${top + 400}`, { w: 4.4, t: .92 });
    s += P(`M574 ${top + 322} L586 ${top + 400} L550 ${top + 400}`, { w: 4.4, t: .94 });
    s += RF(462, top + 398, 76, 18, { rx: 6, w: 3.4, fill: PAPER_FILL, t: .98 });
    s += RF(542, top + 398, 76, 18, { rx: 6, w: 3.4, fill: PAPER_FILL, t: 1 });
    return s;
  }
  if (theme === 'trophy') {
    let s = `<ellipse cx="540" cy="${top + 366}" rx="168" ry="14" fill="none" stroke="#2d2822" stroke-width="2.4" stroke-dasharray="10 11" opacity=".2" class="f" style="--d:.3s"/>`;
    // 杯身
    s += P(`M452 ${top + 84} Q540 ${top + 128} 628 ${top + 84} L604 ${top + 226} Q540 ${top + 256} 476 ${top + 226} Z`, { w: 4.6, fill: PAPER_FILL, t: .36 });
    // 杯口
    s += P(`M446 ${top + 84} Q540 ${top + 108} 634 ${top + 84}`, { w: 3.4, op: .55, t: .4 });
    // 左右把手
    s += P(`M452 ${top + 96} Q366 ${top + 102} 392 ${top + 184} Q404 ${top + 218} 450 ${top + 202}`, { w: 4.2, t: .46 });
    s += P(`M628 ${top + 96} Q714 ${top + 102} 688 ${top + 184} Q676 ${top + 218} 630 ${top + 202}`, { w: 4.2, t: .5 });
    // 顶珠
    s += LN(540, top + 78, 540, top + 90, { w: 3.4, t: .54 });
    s += CI(540, top + 68, 10, { fill: accent, c: accent, t: .56 });
    // 杯身星芒
    s += coverSparkle(540, top + 158, 22, accent, .85);
    s += coverSparkle(492, top + 178, 10, accent, .55);
    s += coverSparkle(590, top + 172, 8, accent, .5);
    // 杯颈与两层底座
    s += RF(512, top + 252, 56, 30, { w: 3.6, fill: PAPER_FILL, t: .66 });
    s += RF(442, top + 282, 196, 26, { rx: 6, w: 4.2, fill: PAPER_FILL, t: .72 });
    s += RF(414, top + 312, 252, 26, { rx: 7, w: 4.2, fill: 'url(#hatchD)', t: .78 });
    // 两侧小光点
    s += CI(330, top + 150, 6, { fill: accent, c: accent, op: .5, t: .84 });
    s += CI(752, top + 146, 6, { fill: accent, c: accent, op: .5, t: .88 });
    return s;
  }
  if (theme === 'ball') {
    const cx = 540, cy = top + 196, r = 124;
    const pt = (rad, deg) => [cx + Math.cos(deg) * rad, cy + Math.sin(deg) * rad];
    let s = `<ellipse cx="540" cy="${top + 342}" rx="150" ry="13" fill="none" stroke="#2d2822" stroke-width="2.4" stroke-dasharray="10 11" opacity=".2" class="f" style="--d:.3s"/>`;
    // 速度线
    s += LN(300, top + 150, 372, top + 150, { w: 3, op: .35, t: .36 });
    s += LN(282, top + 196, 366, top + 196, { w: 3, op: .45, t: .4 });
    s += LN(304, top + 242, 372, top + 242, { w: 3, op: .35, t: .44 });
    // 球体外轮廓
    s += CI(cx, cy, r, { w: 4.8, fill: PAPER_FILL, t: .48 });
    // 中心五边形
    const pent = [];
    for (let i = 0; i < 5; i++) pent.push(pt(r * .34, -Math.PI / 2 + i * 2 * Math.PI / 5));
    s += P('M' + pent.map(p => p.map(v => v.toFixed(1)).join(' ')).join(' L') + ' Z', { w: 3.4, fill: 'url(#hatchD)', t: .58 });
    // 五边形到外圈的接缝
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * 2 * Math.PI / 5;
      const [ex, ey] = pt(r * .94, a);
      s += LN(pent[i][0].toFixed(1), pent[i][1].toFixed(1), ex.toFixed(1), ey.toFixed(1), { w: 2.8, op: .6, t: .66 + i * .04 });
    }
    // 外圈五段接缝弧
    for (let i = 0; i < 5; i++) {
      const b1 = -Math.PI / 2 + i * 2 * Math.PI / 5 + Math.PI / 5;
      const b2 = b1 + 2 * Math.PI / 5 - 2 * Math.PI / 5 * .5;
      const [x1, y1] = pt(r, b1);
      const [x2, y2] = pt(r, b2);
      s += P(`M${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`, { w: 2.8, op: .6, t: .82 + i * .03 });
    }
    return s;
  }
  return '';
}

// 标题/副标题对每个候选主体打分：标题权重 ×1.5，副标题 ×1；同分取文字里更早出现的
function coverScores(title = '', sub = '') {
  const scores = new Map();
  const eat = (text, mult) => {
    if (!text) return;
    for (const rule of COVER_STRONG) {
      const m = text.match(rule.re);
      if (!m) continue;
      const cur = scores.get(rule.id);
      if (!cur) scores.set(rule.id, { s: rule.w * mult, idx: m.index, strong: rule.w });
      else { cur.s += rule.w * mult; cur.idx = Math.min(cur.idx, m.index); cur.strong = Math.max(cur.strong, rule.w); }
    }
    for (const rule of COVER_WEAK) {
      const m = text.match(rule.re);
      if (!m) continue;
      const cur = scores.get(rule.id);
      if (!cur) scores.set(rule.id, { s: rule.w * mult, idx: m.index, strong: 0 });
      else cur.s += rule.w * mult;
    }
  };
  eat(title, 1.5);
  eat(sub, 1);
  return scores;
}

function rankCover(title, sub) {
  return [...coverScores(title, sub).entries()]
    .filter(([id]) => COVER_ACCENT[id])
    .sort((a, b) => (b[1].s - a[1].s) || (a[1].idx - b[1].idx));
}

// 按标题决定封面主体：标题里有强信号实物就一律以标题为准（同分按文字出现先后）；
// 标题完全没有信号时，才看副标题，最后才退回模型的选择
function coverTheme(title = '', sub = '', prefer) {
  const titleStrong = rankCover(title, '').filter(([, v]) => v.strong >= 10);
  if (titleStrong.length) return titleStrong[0][0];
  const ranked = rankCover(title, sub);
  if (ranked.length) return ranked[0][0];
  return prefer && COVER_ACCENT[prefer] ? prefer : 'idea';
}

// 跨视频去重：与最近几条片子撞主体时，只要标题还有别的强信号主体，就换一个（优先同族）
function chooseCover(title, sub, prefer, recent = []) {
  const motif = coverTheme(title, sub, prefer);
  const recentSet = new Set((recent || []).filter(id => COVER_ACCENT[id]));
  if (!recentSet.has(motif)) return { motif, shifted: false, from: motif };
  const alts = rankCover(title, sub).filter(([id, v]) => v.strong >= 10 && !recentSet.has(id));
  if (!alts.length) return { motif, shifted: false, from: motif };
  const fam = ART_FAMILIES.find(f => f.includes(motif));
  const pick = (fam && alts.find(([id]) => fam.includes(id))) || alts[0];
  return { motif: pick[0], shifted: true, from: motif };
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

/* ================= 封面场景脚本：小道具 + 手写批注 ================= */
const COVER_PROP_KINDS = ['cloud', 'question', 'warn', 'check', 'pin', 'chart', 'arrowUp', 'arrowDown', 'flag', 'tag', 'barrel', 'crate', 'coins', 'container', 'crowd', 'truck', 'ship', 'clock', 'pylon', 'doc', 'blockade'];
const COVER_PROP_TOP = ['cloud', 'question', 'warn', 'pin', 'chart', 'arrowUp', 'arrowDown', 'flag', 'tag'];
const COVER_PROP_BOTTOM = ['barrel', 'crate', 'coins', 'container', 'crowd', 'truck', 'ship', 'clock', 'pylon', 'doc', 'blockade', 'warn', 'check', 'flag', 'tag'];

/* 单个小道具：本地坐标以 (0,0) 为中心，s 为整体缩放 */
function coverProp(kind, x, y, s, accent, seed) {
  const p = (d, o = {}) => `<path d="${d}" fill="${o.fill || 'none'}" stroke="${o.c || '#2d2822'}" stroke-width="${o.w == null ? 3.2 : o.w}" stroke-linecap="round" stroke-linejoin="round" opacity="${o.op == null ? 1 : o.op}" class="f" style="--d:${(o.t == null ? 1.05 : o.t).toFixed(2)}s"/>`;
  const rf = (a, b, w, hh, o = {}) => `<rect x="${a}" y="${b}" width="${w}" height="${hh}"${o.rx ? ` rx="${o.rx}"` : ''} fill="${o.fill || 'none'}" stroke="${o.c || '#2d2822'}" stroke-width="${o.w == null ? 3.2 : o.w}" opacity="${o.op == null ? 1 : o.op}" class="f" style="--d:${(o.t == null ? 1.05 : o.t).toFixed(2)}s"/>`;
  const ln = (x1, y1, x2, y2, o = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.c || '#2d2822'}" stroke-width="${o.w == null ? 2.6 : o.w}" opacity="${o.op == null ? 1 : o.op}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''} class="f" style="--d:${(o.t == null ? 1.05 : o.t).toFixed(2)}s"/>`;
  const ci = (a, b, r, o = {}) => `<circle cx="${a}" cy="${b}" r="${r}" fill="${o.fill || 'none'}" stroke="${o.c || '#2d2822'}" stroke-width="${o.w == null ? 3 : o.w}" opacity="${o.op == null ? 1 : o.op}" class="f" style="--d:${(o.t == null ? 1.05 : o.t).toFixed(2)}s"/>`;
  let m = '';
  switch (kind) {
    case 'cloud':
      m = p(`M-34 8 q-2 -18 16 -18 q2 -16 20 -12 q16 -6 22 8 q14 -2 14 12 q0 10 -12 10 Z`, { fill: PAPER_FILL, w: 3 });
      m += p(`M-24 20 q16 -8 30 -2 q12 4 26 -2`, { c: accent, w: 2.4, op: .4, t: 1.16 });
      break;
    case 'question':
      m = ci(0, 0, 24, { fill: PAPER_FILL, w: 3 });
      m += `<text x="0" y="12" text-anchor="middle" font-size="32" font-weight="700" fill="${accent}" font-family="Hanzipen SC,Kaiti SC,STKaiti,KaiTi,serif" class="f" style="--d:1.12s">?</text>`;
      break;
    case 'warn':
      m = p(`M0 -26 L27 22 H-27 Z`, { fill: PAPER_FILL, w: 3.2 });
      m += ln(0, -8, 0, 8, { w: 4.2, c: accent });
      m += ci(0, 16, 2.6, { fill: accent, c: accent });
      break;
    case 'check':
      m = ci(0, 0, 24, { fill: PAPER_FILL, w: 3 });
      m += p(`M-11 1 l8 9 l15 -19`, { c: accent, w: 4.6 });
      break;
    case 'pin':
      m = p(`M0 -30 q21 0 21 20 q0 16 -21 36 q-21 -20 -21 -36 q0 -20 21 -20 Z`, { fill: PAPER_FILL, w: 3.2 });
      m += ci(0, -11, 8, { w: 2.8, c: accent });
      m += ci(0, -11, 2.6, { fill: accent, c: accent });
      break;
    case 'chart':
      m = rf(-36, -26, 72, 52, { rx: 5, fill: PAPER_FILL, w: 3 });
      m += ln(-26, 16, 26, 16, { w: 2, op: .4 });
      m += ln(-26, 16, -26, -16, { w: 2, op: .4 });
      m += p(`M-24 8 L-10 0 L2 6 L14 -12 L24 -16`, { c: accent, w: 3.2 });
      m += ci(14, -12, 3.4, { fill: accent, c: accent });
      break;
    case 'arrowUp':
      m = ln(0, 26, 0, -12, { w: 5, c: accent });
      m += p(`M-13 -2 L0 -22 L13 -2`, { w: 5, c: accent });
      break;
    case 'arrowDown':
      m = ln(0, -26, 0, 12, { w: 5, c: accent });
      m += p(`M-13 2 L0 22 L13 2`, { w: 5, c: accent });
      break;
    case 'flag':
      m = ln(-16, 26, -16, -26, { w: 3.4 });
      m += p(`M-16 -26 q14 -10 28 -1 q2 10 -28 14 Z`, { fill: accent, w: 2.8, op: .55 });
      m += ln(-26, 26, -4, 26, { w: 3 });
      break;
    case 'tag':
      m = p(`M-30 -17 H14 L30 0 L14 17 H-30 Z`, { fill: PAPER_FILL, w: 3, c: accent });
      m += ci(-19, 0, 4.2, { w: 2.4, c: accent });
      m += ln(-6, -5, 12, -5, { w: 2.6, c: accent, op: .8 });
      m += ln(-6, 5, 4, 5, { w: 2.6, c: accent, op: .6 });
      break;
    case 'barrel':
      m = rf(-18, -24, 36, 48, { rx: 3, fill: PAPER_FILL, w: 3.2 });
      m += `<ellipse cx="0" cy="-24" rx="18" ry="6" fill="none" stroke="#2d2822" stroke-width="2.6" class="f" style="--d:1.12s"/>`;
      m += ln(-18, -8, 18, -8, { w: 2.2, op: .55 });
      m += ln(-18, 10, 18, 10, { w: 2.2, op: .55 });
      m += rf(-18, -24, 7, 48, { fill: 'url(#hatchD)', w: 0, op: .35 });
      break;
    case 'crate':
      m = rf(-24, -20, 48, 40, { rx: 2, fill: PAPER_FILL, w: 3.2 });
      m += ln(-24, -20, 24, 20, { w: 2.2, op: .5 });
      m += ln(24, -20, -24, 20, { w: 2.2, op: .5 });
      m += ln(-24, 0, 24, 0, { w: 2, op: .3 });
      break;
    case 'coins':
      for (let i = 0; i < 3; i++) {
        m += `<ellipse cx="0" cy="${18 - i * 10}" rx="22" ry="7" fill="${PAPER_FILL}" stroke="#2d2822" stroke-width="2.8" class="f" style="--d:${(1.05 + i * .04).toFixed(2)}s"/>`;
      }
      m += ln(-22, 18, -22, -2, { w: 2.2, op: .5 });
      m += ln(22, 18, 22, -2, { w: 2.2, op: .5 });
      break;
    case 'container':
      m = rf(-36, -18, 72, 36, { rx: 2, fill: PAPER_FILL, w: 3.2 });
      m += rf(-36, -18, 72, 9, { fill: 'url(#hatchD)', w: 0, op: .4 });
      for (let i = 1; i < 6; i++) m += ln(-36 + i * 12, -9, -36 + i * 12, 18, { w: 1.8, op: .45 });
      break;
    case 'crowd':
      [-21, 0, 20].forEach((cx, i) => {
        const k = i === 1 ? 1.08 : .92;
        m += ci(cx, (-14 * k).toFixed(1), (7.5 * k).toFixed(1), { fill: PAPER_FILL, w: 2.8 });
        m += p(`M${(cx - 13 * k).toFixed(1)} 19 q1 -16 ${(13 * k).toFixed(1)} -16 q${(12 * k).toFixed(1)} 0 ${(13 * k).toFixed(1)} 16 Z`, { fill: PAPER_FILL, w: 2.8 });
      });
      break;
    case 'truck':
      m = rf(-34, -20, 40, 32, { rx: 2, fill: PAPER_FILL, w: 2.8 });
      m += p(`M6 -8 h16 l10 12 v8 h-26 Z`, { fill: PAPER_FILL, w: 2.8 });
      m += rf(-30, -16, 32, 24, { fill: 'url(#hatchD)', w: 0, op: .35 });
      m += ci(-20, 16, 7, { fill: PAPER_FILL, w: 2.8 });
      m += ci(18, 16, 7, { fill: PAPER_FILL, w: 2.8 });
      m += ln(-40, 24, 34, 24, { w: 2, op: .3 });
      break;
    case 'ship':
      m = p(`M-34 4 H30 L22 18 H-26 Z`, { fill: PAPER_FILL, w: 3 });
      m += rf(-8, -10, 20, 14, { rx: 2, fill: PAPER_FILL, w: 2.6 });
      m += ln(2, -10, 2, -26, { w: 2.6 });
      m += p(`M4 -24 v10 h16 Z`, { fill: accent, w: 2.4, op: .5 });
      m += p(`M-40 26 q10 -6 20 0 q10 6 20 0 q10 -6 20 0`, { c: accent, w: 2.4, op: .45 });
      break;
    case 'clock':
      m = ci(0, 0, 22, { fill: PAPER_FILL, w: 3 });
      for (let i = 0; i < 4; i++) {
        const a = Math.PI / 2 * i;
        m += ln((Math.cos(a) * 16).toFixed(1), (Math.sin(a) * 16).toFixed(1), (Math.cos(a) * 20).toFixed(1), (Math.sin(a) * 20).toFixed(1), { w: 2, op: .5 });
      }
      m += ln(0, 0, 0, -13, { w: 3.2 });
      m += ln(0, 0, 9, 5, { w: 2.6, c: accent });
      break;
    case 'pylon':
      m = ln(-16, 26, -5, -26, { w: 2.8 });
      m += ln(16, 26, 5, -26, { w: 2.8 });
      m += ln(-13, 12, 13, 12, { w: 2.2, op: .6 });
      m += ln(-11, 0, 11, 0, { w: 2.2, op: .6 });
      m += ln(-13, 12, 11, 0, { w: 2, op: .45 });
      m += ln(13, 12, -11, 0, { w: 2, op: .45 });
      m += ln(-22, -12, 22, -12, { w: 2.8 });
      m += ln(-14, -26, -22, -12, { w: 2.2 });
      m += ln(14, -26, 22, -12, { w: 2.2 });
      break;
    case 'doc':
      m = p(`M-20 -26 H10 L20 -16 V26 H-20 Z`, { fill: PAPER_FILL, w: 3 });
      m += p(`M10 -26 V-16 H20`, { w: 2.4, op: .6 });
      m += ln(-12, -6, 12, -6, { w: 2.2, op: .45 });
      m += ln(-12, 4, 12, 4, { w: 2.2, op: .45 });
      m += ln(-12, 14, 2, 14, { w: 2.2, op: .45 });
      m += ci(11, 15, 7, { w: 2.4, c: accent, op: .7 });
      break;
    case 'blockade':
      m = ln(-40, 8, 40, 8, { w: 3.4, c: accent, dash: '8 7' });
      m += ci(-24, 8, 8, { fill: PAPER_FILL, w: 2.6 });
      m += ln(-28, 4, -20, 12, { w: 2.2 });
      m += ln(-20, 4, -28, 12, { w: 2.2 });
      m += ci(24, 8, 8, { fill: PAPER_FILL, w: 2.6 });
      m += ln(20, 4, 28, 12, { w: 2.2 });
      m += ln(28, 4, 20, 12, { w: 2.2 });
      break;
    default:
      return '';
  }
  return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s})">${m}</g>`;
}

/* 场景脚本渲染：主体四周的小道具 + 左右手写批注（批注文字来自这条视频本身）
   k 是主体实际缩放；道具与批注都排到主体上下留白里，避免压在画面细节上 */
function coverSceneAnnot(theme, top, accent, seed, spec, k = 1) {
  if (!spec || typeof spec !== 'object') return '';
  const h = COVER_ART_H[theme] || 400;
  const y0 = top + h * (1 - k) / 2;
  const y1 = top + h * (1 + k) / 2;
  const rnd = i => (hash(seed + '@' + i) % 1000) / 1000 - .5;
  let s = '';
  const extras = Array.isArray(spec.extras) ? spec.extras.slice(0, 3) : [];
  extras.forEach((e, i) => {
    const kind = COVER_PROP_KINDS.includes(e && e.kind) ? e.kind : '';
    if (!kind) return;
    let pos = e && e.pos;
    if (!/^(lt|rt|lb|rb)$/.test(pos || '')) pos = 'lt';
    const topSide = pos[1] === 't';
    if (!(topSide ? COVER_PROP_TOP : COVER_PROP_BOTTOM).includes(kind)) return;
    // 上排漂浮主体上方，下排站在主体地面线两侧
    const x = (pos[0] === 'l' ? 104 : 976) + rnd(i * 3 + 1) * 18;
    const y = (topSide ? y0 - 46 : y1 - 42) + rnd(i * 3 + 2) * 10;
    s += coverProp(kind, x, y, .9, accent, seed + '|' + i);
  });
  const calls = Array.isArray(spec.callouts) ? spec.callouts.slice(0, 2) : [];
  calls.forEach((c, i) => {
    const txt = String((c && c.text) || '').trim().replace(/\s+/g, ' ').slice(0, 10);
    if (!txt) return;
    const right = c.pos === 'right';
    const isNum = /^[+\-]?\d/.test(txt);
    const fs = isNum ? 45 : 36;
    const est = txt.length * fs * (isNum ? .56 : 1.02);
    const y = Math.max(250, y0 - 128) - i * 68;
    const x = right ? 926 : 154;
    const rot = right ? 2.2 : -2.2;
    const bx = right ? x - est - 12 : x - 8;
    s += `<g transform="rotate(${rot} ${x} ${y})">`;
    s += `<rect x="${bx.toFixed(1)}" y="${(y - fs - 4).toFixed(1)}" width="${(est + 20).toFixed(1)}" height="${(fs + 18).toFixed(1)}" rx="9" fill="rgba(246,238,220,.84)" class="f" style="--d:${(1.06 + i * .08).toFixed(2)}s"/>`;
    s += `<text x="${x}" y="${y}" text-anchor="${right ? 'end' : 'start'}" font-size="${fs}" font-weight="700" fill="${isNum ? accent : '#3b3227'}" font-family="${isNum ? 'Baskerville,serif' : 'Hanzipen SC,Kaiti SC,STKaiti,KaiTi,serif'}" class="f" style="--d:${(1.12 + i * .08).toFixed(2)}s">${esc(txt)}</text>`;
    s += `<path d="M${right ? (x - est - 6).toFixed(1) : (x + 4).toFixed(1)} ${(y + 13).toFixed(1)} h${Math.min(est * .82, 130).toFixed(1)}" stroke="${accent}" stroke-width="3" opacity=".42" class="f" style="--d:${(1.2 + i * .08).toFixed(2)}s"/>`;
    s += `</g>`;
    const lx1 = right ? x - est - 18 : x + est + 18;
    const ly1 = y - fs * .4;
    const lx2 = right ? 648 : 432;
    const ly2 = top + h * .56;
    if (Math.abs(lx1 - lx2) > 40) {
      s += `<path d="M${lx1.toFixed(1)} ${ly1.toFixed(1)} L${lx2.toFixed(1)} ${ly2.toFixed(1)}" stroke="#2d2822" stroke-width="2" stroke-dasharray="6 8" opacity=".26" class="draw" style="--d:${(1.28 + i * .08).toFixed(2)}s"/>`;
      s += `<circle cx="${lx2}" cy="${ly2.toFixed(1)}" r="5" fill="none" stroke="${accent}" stroke-width="2.2" opacity=".45" class="f" style="--d:${(1.36 + i * .08).toFixed(2)}s"/>`;
    }
  });
  return s;
}

// 这两个主体画面里含文字/价格牌，镜像会穿帮，不参与翻转
const COVER_NO_FLIP = new Set(['coin', 'house']);
function coverArt(theme, top, accent, seed, scale = 1, spec) {
  const cy = top + (COVER_ART_H[theme] || 400) / 2;
  const fk = spec && spec.focus === 'close' ? 1.14 : spec && spec.focus === 'wide' ? .95 : 1;
  const k = scale * fk;
  const zoom = k === 1 ? '' : `translate(540 ${cy}) scale(${k}) translate(-540 -${cy})`;
  // 同一主体按标题种子取正/反朝向，相邻视频即使撞到同一主体，构图也不会一模一样
  const mirror = !COVER_NO_FLIP.has(theme) && hash(seed + '#flip') % 2 === 0 ? 'translate(1080 0) scale(-1 1)' : '';
  const tf = (mirror || zoom) ? ` transform="${[mirror, zoom].filter(Boolean).join(' ')}"` : '';
  return `<g filter="url(#rough)"><g${tf}>${paperFill(coverArtRaw(theme, top, accent, seed))}${coverDeco(theme, top, accent, seed)}</g>${coverSceneAnnot(theme, top, accent, seed, spec, k)}</g>`;
}

// 每日播报封面：用涨跌家数的大数字和红绿占比条做主视觉
function heroCover(meta) {
  const d = meta.dataHero || {};
  const up = Number(d.up) || 0;
  const down = Number(d.down) || 0;
  const tot = up + down;
  const upW = Number(d.upPct) > 0 ? Number(d.upPct) : (tot ? Math.round((up / tot) * 100) : 50);
  const pct = Math.max(2, Math.min(98, Math.round(upW)));
  // 数量多的一行放上面、字号最大；数量少的一行放下方、按比例缩小，形成对比
  const rows = up >= down
    ? [{ v: up, l: '家上涨', t: 'up' }, { v: down, l: '家下跌', t: 'down' }]
    : [{ v: down, l: '家下跌', t: 'down' }, { v: up, l: '家上涨', t: 'up' }];
  const big = Math.max(up, down, 1);
  const small = Math.max(104, Math.round(210 * Math.pow(Math.min(up, down) / big, 0.33)));
  const rowHTML = rows.map((r, i) => `<div class="hero-row ${r.t}"><span class="hero-num" style="font-size:${i ? small : 210}px">${esc(String(r.v))}</span><span class="hero-lb">${r.l}</span></div>`).join('\n');
  const idxs = Array.isArray(d.indices) ? d.indices : [];
  const idxHTML = idxs.length
    ? `<div class="hero-idx f" style="--d:.95s">${idxs.map(x => `<div class="hi"><span class="hin">${esc(x.name)}</span><span class="hip ${x.tone === 'up' ? 'up' : x.tone === 'down' ? 'down' : ''}">${esc(x.pct)}</span></div>`).join('')}</div>`
    : '';
  return `<section class="scene" id="s0">
<div class="hero-title rise" style="--d:.18s">${esc(meta.heroTitle || '今日行情播报')}</div>
<div class="hero-date rise" style="--d:.08s">${esc(d.kicker || '')}</div>
<div class="hero f" style="--d:.24s">
${rowHTML}
</div>
<div class="hero-bar f" style="--d:.55s"><i class="up" style="width:${pct}%"></i><i class="down" style="width:${100 - pct}%"></i></div>
<div class="hero-legend f" style="--d:.65s"><span class="up">${pct}% 上涨</span><span class="down">${100 - pct}% 下跌</span></div>
<div class="hero-sub f" style="--d:.8s">两市成交 ${esc(d.amtText || '')} · 较昨日${esc(d.amtDiffText || '')}</div>
${idxHTML}
<div class="f cover-tag" style="--d:1.4s">${esc(meta.disclaimer || '公开数据复盘 · 不构成投资建议')}</div>
</section>`;
}

function coverScene(scene, meta) {
  if (meta.dataHero) return heroCover(meta);
  const title = meta.title || scene.title || '';
  const sub = meta.subtitle || scene.sub || '';
  const seed = title + '|' + sub;
  const h = hash(seed);
  // 明确指定了封面主体（封面选择器、pipeline 决策结果）就直接用；
  // 标题规则只在没指定时兜底
  const theme = COVER_ACCENT[meta.cover] ? meta.cover : coverTheme(title, sub, meta.cover);
  const accent = COVER_ACCENT[theme];
  const u = units(title);
  // 长标题按两行排版，字号仍保持封面级别的存在感
  const twoLine = u > 13;
  const fs = twoLine ? Math.max(44, Math.min(64, Math.floor(1660 / u))) : titleFS(title, 76);
  const lines = twoLine ? 2 : 1;
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
  // 两行封面标题优先在冒号处断行，避免自动平衡把词切断
  const ci = title.indexOf('：');
  const titleHTML = (twoLine && ci > 3 && ci < title.length - 3)
    ? esc(title.slice(0, ci + 1)) + '<br>' + esc(title.slice(ci + 1))
    : esc(title);

  // 已按标题生成插画时，用出图结果替换手绘素材主体，版式坐标跟着画框走
  const box = (meta.artDataUri || meta.artSvg) ? artBox(layout) : null;
  if (box) {
    artTop = box.y;
    if (layout === 1) {
      const kickerTop = box.y + box.h + 40;
      kickerStyle = `left:0;width:1080px;text-align:center;top:${kickerTop}px`;
      titleStyle = `left:100px;top:${kickerTop + 62}px;width:880px;text-align:center;font-size:${fs}px`;
      subTop = kickerTop + 62 + titleH + 26;
    }
  }

  const artHTML = box
    ? `<div class="cover-art f" style="--d:.15s;left:${box.x}px;top:${box.y}px;width:${box.w}px;height:${box.h}px">${meta.artSvg || `<img src="${meta.artDataUri}" alt="">`}</div>`
    : `<svg class="art" viewBox="0 0 1080 1920">
${coverArt(theme, artTop, accent, seed, layout === 1 ? 1.06 : 1.3, meta.coverSpec)}
</svg>`;

  return `<section class="scene" id="s0">
${artHTML}
<div class="k f" style="--d:.05s;${kickerStyle}">${esc(kicker)}</div>
<h1 class="h1 rise cover-title" style="--d:.15s;${titleStyle}">${titleHTML}</h1>
<div class="f" style="position:absolute;left:${subLeft}px;width:${subWidth}px;text-align:${subAlign};top:${Math.round(subTop)}px;font-size:38px;line-height:1.5;color:var(--ink2);--d:.4s">${esc(sub)}</div>
<div class="f cover-tag ${COVER_CLASS[theme]}" style="--d:1.5s">${esc(meta.disclaimer || '公开信息梳理 · 不构成投资建议')}</div>
</section>`;
}

/* ================= 分镜插图带：按这一屏内容生成的小场景 ================= */
const SCENE_ART_K = [.6, .64, .68];
const SCENE_ART_TOP = { flow: 854, compare: 914, bars: 1040, line: 1040, stats: 808 };

// 同一题材的兄弟主体，整片按题材族轮换，避免反复用同一张图
const ART_FAMILIES = [
  ['ship', 'port', 'container', 'truck', 'train', 'plane', 'globe'],
  ['energy', 'oilrig', 'pipeline', 'battery', 'solar', 'wind'],
  ['factory', 'mine', 'wheat', 'water', 'leaf', 'bridge'],
  ['bank', 'coin', 'chart', 'scale', 'policy', 'lock', 'shield'],
  ['people', 'speaker', 'clock', 'store', 'cart', 'house', 'car'],
  ['chip', 'gpu', 'datacenter', 'laptop', 'robot', 'network', 'phone', 'satellite', 'rocket', 'flask', 'dna'],
  ['trophy', 'ball', 'people', 'clock'],
];

// 题材族里没图可用时，这些主体放在哪个选题都不至于突兀
const ART_NEUTRAL = ['chart', 'globe', 'people', 'clock', 'factory', 'bridge', 'network', 'policy', 'scale'];

function sceneArtTop(scene, kind) {
  // 插画内部有少量元素会超出标称高度，统一再留 40px 顶距
  const notes = Array.isArray(scene.notes) ? scene.notes.filter(Boolean).length : 0;
  if (notes) return 1332;
  if (kind === 'bullets') {
    const n = Math.min(4, (scene.points || []).length) || 3;
    const tops = n >= 4 ? [560, 740, 920, 1100] : [570, 810, 1050];
    return (tops[n - 1] || 1050) + 170;
  }
  if (kind === 'list') {
    const n = Math.min(5, (scene.points || []).length) || 4;
    return 560 + n * 132 + 64;
  }
  return (SCENE_ART_TOP[kind] || 1236) + 40;
}

// 把这一屏出现的所有文字拼起来，用于猜配图题材
function sceneText(s) {
  const out = [s.title, s.sub];
  (s.points || []).forEach(p => out.push(p && p.t, p && p.d));
  (s.steps || []).forEach(x => out.push(x));
  (s.bars || []).forEach(b => out.push(b && b.label, b && b.note));
  if (s.line && Array.isArray(s.line.labels)) s.line.labels.forEach(x => out.push(x));
  (s.stats || []).forEach(x => out.push(x && x.v, x && x.l));
  [s.left, s.right].forEach(col => {
    if (!col) return;
    out.push(col.title);
    (col.items || []).forEach(x => out.push(x));
  });
  (s.notes || []).forEach(x => out.push(x));
  return out.filter(Boolean).join(' ');
}

// 分镜插图已经由 AI 生成时，固定画框内直接放图，不再画素材库插图
function sceneArtFrame(scene) {
  const top = sceneArtTop(scene, scene.kind);
  const h = Math.max(240, Math.min(400, 1640 - top));
  return { x: 110, y: top, w: 860, h };
}

function sceneArtCustom(scene) {
  const box = sceneArtFrame(scene);
  if (scene._artSvg) {
    const m = String(scene._artSvg).match(/^<svg\b([^>]*)>([\s\S]*)<\/svg>\s*$/i);
    if (!m) return '';
    const vb = (m[1].match(/viewBox\s*=\s*"([^"]+)"/i) || [])[1] || '0 0 860 380';
    return `<svg x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" viewBox="${vb}" preserveAspectRatio="xMidYMid slice">${m[2]}</svg>`;
  }
  if (scene._artDataUri) {
    return `<image x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" href="${scene._artDataUri}" preserveAspectRatio="xMidYMid slice"/>`;
  }
  return '';
}

function sceneArtBand(scene, idx) {
  // 有近 7 日数据表格的屏，表格本身就是内容，不再叠插图
  if (Array.isArray(scene.history) && scene.history.length) return '';
  if (scene._artSvg || scene._artDataUri) return sceneArtCustom(scene);
  const spec = scene.art && typeof scene.art === 'object' ? scene.art : null;
  const used = scene._usedArt || new Set();
  const famAny = Array.isArray(scene._artFam) ? scene._artFam : [];
  const seed0 = (scene.title || '') + '|' + (scene.sub || '') + '|' + idx;
  const model = spec && COVER_ACCENT[spec.subject] ? spec.subject : '';
  // 这一屏自己的文字大概在讲什么，用于给撞车的配图换一个更贴切的
  const textGuess = coverTheme(sceneText(scene), '');
  // 优先级：模型指定 > 本屏文字 > 本片题材族 > 中性主体
  const cands = [];
  if (model) cands.push(model);
  if (textGuess !== 'idea') cands.push(textGuess);
  cands.push(...famAny, ...ART_NEUTRAL);
  let theme = cands.find(t => !used.has(t)) || '';
  if (!theme) {
    // 全片图都用过一遍了，宁可复用本片题材族的图，也不塞不相干的题材
    const repeat = model && !famAny.includes(model) ? [model].concat(famAny) : famAny;
    theme = repeat[hash(seed0) % repeat.length] || repeat[0] || '';
  }
  if (!theme) return '';
  used.add(theme);
  const top = sceneArtTop(scene, scene.kind);
  const h = COVER_ART_H[theme] || 400;
  const seed = seed0;
  const k = SCENE_ART_K[hash(seed) % SCENE_ART_K.length];
  const bh = h * k;
  const cy = top + bh / 2;
  const accent = COVER_ACCENT[theme];
  const origin = top + h / 2;
  let s = `<g transform="translate(540 ${cy.toFixed(1)}) scale(${k}) translate(-540 ${(-origin).toFixed(1)})">${paperFill(coverArtRaw(theme, top, accent, seed))}${coverDeco(theme, top, accent, seed)}</g>`;

  const props = spec && Array.isArray(spec.props) ? spec.props.slice(0, 2) : [];
  const propSide = { l: false, r: false };
  props.forEach((p, i) => {
    const kind = p && COVER_PROP_KINDS.includes(p.kind) ? p.kind : '';
    if (!kind) return;
    const side = p.side === 'r' ? 'r' : 'l';
    if (propSide[side]) return;
    propSide[side] = true;
    const ground = COVER_PROP_BOTTOM.includes(kind);
    const x = side === 'r' ? 944 : 136;
    const y = ground ? top + bh - 8 : top + 44;
    s += coverProp(kind, x, y, ground ? 1.05 : 1.2, accent, seed + '/p' + i);
  });

  const note = String((spec && spec.note) || '').replace(/\s+/g, ' ').trim().slice(0, 9);
  if (note) {
    const right = spec.notePos === 'r';
    const fs = 27;
    const est = units(note) * fs * 1.03;
    const x = right ? 1012 : 68;
    const y = top + 44;
    s += `<g transform="rotate(${right ? 2 : -2.8} ${x} ${y})">`;
    s += `<rect x="${(right ? x - est - 10 : x - 8).toFixed(1)}" y="${(y - fs - 1).toFixed(1)}" width="${(est + 18).toFixed(1)}" height="${(fs + 12).toFixed(1)}" rx="7" fill="rgba(246,238,220,.9)" class="f" style="--d:1.05s"/>`;
    s += `<text x="${x}" y="${y}" text-anchor="${right ? 'end' : 'start'}" font-size="${fs}" fill="${accent}" font-family="Hanzipen SC,Kaiti SC,STKaiti,KaiTi,serif" class="f" style="--d:1.1s">${esc(note)}</text>`;
    s += `<path d="M${(right ? x - est - 2 : x + 2).toFixed(1)} ${(y + 9).toFixed(1)} h${Math.min(est * .9, 120).toFixed(1)}" stroke="${accent}" stroke-width="2.6" opacity=".45" class="f" style="--d:1.16s"/>`;
    s += `</g>`;
    const ax = right ? x - est - 14 : x + est + 14;
    const bx = right ? 776 : 304;
    const by = top + bh * .46;
    s += `<path d="M${ax.toFixed(1)} ${(y - 4).toFixed(1)} Q${((ax + bx) / 2).toFixed(1)} ${(y + 30).toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}" fill="none" stroke="#2d2822" stroke-width="1.8" stroke-dasharray="5 8" opacity=".23" class="draw" style="--d:1.2s"/>`;
    s += `<circle cx="${bx}" cy="${by.toFixed(1)}" r="4.5" fill="none" stroke="${accent}" stroke-width="2" opacity=".4" class="f" style="--d:1.28s"/>`;
  }
  return `<g filter="url(#rough)">${s}</g>`;
}

function kickerOf(scene, idx) {
  const tag = (scene.kicker || '').trim();
  const no = String(idx).padStart(2, '0');
  return tag ? `${no} / ${tag}` : no;
}

function notesOf(scene, delayBase = 0.75) {
  const notes = Array.isArray(scene.notes) ? scene.notes.filter(Boolean).slice(0, 3) : [];
  return notes.map((n, i) =>
    `<div class="s f" style="top:${1090 + i * 78}px;--d:${(delayBase + i * 0.12).toFixed(2)}s">${tonePct(n)}</div>`
  ).join('\n');
}

// 注释里的涨跌幅同样按「涨红跌绿」上色
function tonePct(s) {
  return esc(s).replace(/([+-]\d+(?:\.\d+)?%)/g, m => `<span class="${m[0] === '-' ? 'down' : 'up'}">${m}</span>`);
}

// 机构持仓：多单标红、空单标绿
function toneOrg(s) {
  return esc(s)
    .replace(/(净?多单\s*[\d,]+\s*手|净多\s*[\d,]+\s*手)/g, '<span class="up">$1</span>')
    .replace(/(净?空单\s*[\d,]+\s*手|净空\s*[\d,]+\s*手)/g, '<span class="down">$1</span>');
}

function footOf(scene, meta, d = 1.0) {
  const t = scene.foot || meta.source || '公开信息整理';
  return `<div class="foot f" style="--d:${d}s">${esc(t)}</div>`;
}

function header(scene, idx, title, sub) {
  const fs = titleFS(title);
  const u = units(title);
  const lines = Math.max(1, Math.ceil(u * fs * 1.05 / 860));
  const th = Math.round(lines * fs * 1.24);
  const rot = (((hash(title) % 13) - 6) / 8).toFixed(2);
  return `<div class="k f" style="--d:.05s">${esc(kickerOf(scene, idx))}</div>
<div class="tbar f" style="top:308px;height:${Math.max(40, th - 8)}px;--d:.1s;--rot:${rot}deg"></div>
<h1 class="h1 rise" style="--d:.12s;font-size:${fs}px;--rot:${rot}deg">${esc(title)}</h1>
${sub ? `<div class="h2 f" style="--d:.25s">${esc(sub)}</div>` : ''}`;
}

function bulletsScene(scene, idx) {
  const pts = (scene.points || []).slice(0, 4);
  const tops = pts.length >= 4 ? [560, 740, 920, 1100] : [570, 810, 1050];
  const body = pts.map((p, i) => `<div class="pt f" style="top:${tops[i] || 560 + i * 165}px;--d:${(0.4 + i * 0.14).toFixed(2)}s">
<div class="n"><svg width="56" height="56" viewBox="0 0 56 56" style="overflow:visible">${inkCircle(28, 28, 23, { seed: idx * 13 + i * 5 + 2, w: 2.8, amp: .9, fill: 'rgba(255,252,242,.55)' })}<text x="28" y="37" text-anchor="middle" font-size="26" font-family="Baskerville,serif" font-weight="700" fill="#2d2822">${i + 1}</text></svg></div>
<div><h3>${esc(p.t)}</h3>${p.d ? `<p>${toneOrg(p.d)}</p>` : ''}</div>
</div>`).join('\n');
  return `<section class="scene" id="s${idx}">
${artLayer(sceneArtBand(scene, idx), idx)}
${header(scene, idx, scene.title, scene.sub)}
${body}
${footOf(scene, scene._meta)}
</section>`;
}

function listScene(scene, idx) {
  const pts = (scene.points || []).slice(0, 5);
  const rows = pts.map((p, i) => `<div class="row"><div class="t">${esc(p.t)}</div>${p.d ? `<div class="d">${esc(p.d)}</div>` : ''}</div>`).join('\n');
  return `<section class="scene" id="s${idx}">
${artLayer(sceneArtBand(scene, idx), idx)}
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
    svg += inkRect(x, by, bw, bh, {
      seed: 11 + i * 9, w: 3.4, amp: 1.4, fill: 'rgba(255,252,242,.55)',
      cls: 'f', style: `--d:${(0.35 + i * 0.15).toFixed(2)}s`,
    });
    svg += `<rect x="${(x + 7).toFixed(1)}" y="${by + 7}" width="${(bw - 14).toFixed(1)}" height="${bh - 14}" fill="url(#hatch)" opacity=".10" class="f" style="--d:${(0.4 + i * 0.15).toFixed(2)}s"/>`;
    svg += `<text x="${(x + bw / 2).toFixed(1)}" y="${by + bh / 2}" text-anchor="middle" dominant-baseline="middle" font-size="${fs}" fill="#2d2822" font-family="Hanzipen SC,Kaiti SC,STKaiti,KaiTi,serif" class="f" style="--d:${(0.45 + i * 0.15).toFixed(2)}s">${esc(s)}</text>`;
    if (i < n - 1) {
      const ax = x + bw + 6, bx = x + bw + gap - 8;
      svg += `<g class="f" style="--d:${(0.6 + i * 0.15).toFixed(2)}s">${inkArrow(ax, by + bh / 2, bx, by + bh / 2, { seed: 40 + i * 5, c: '#b23a2a', w: 3.6, head: 15 })}</g>`;
    }
  });
  return `<section class="scene" id="s${idx}">
${artLayer(sceneArtBand(scene, idx) + svg, idx)}
${header(scene, idx, scene.title, scene.sub)}
${notesOf(scene, 0.9)}
${footOf(scene, scene._meta)}
</section>`;
}

function compareScene(scene, idx) {
  const L = scene.left || {}, R = scene.right || {};
  const li = arr => (arr || []).slice(0, 3).map(x => `<li>${esc(x)}</li>`).join('');
  const frame = (x, win, i) => `<g class="f" style="--d:${(0.32 + i * 0.1).toFixed(2)}s">
${inkRect(x, 596, 400, 276, { seed: idx * 31 + i * 7 + 3, w: win ? 4 : 3.4, c: win ? '#b23a2a' : '#2d2822', amp: 1.5, fill: 'rgba(255,252,242,.5)' })}
${inkRect(x + 9, 605, 382, 258, { seed: idx * 17 + i * 7 + 40, w: 1.5, c: win ? '#b23a2a' : '#2d2822', op: .26, amp: 1.8 })}
</g>`;
  const mid = `<g class="f" style="--d:.5s"><svg x="502" y="711" width="76" height="76" viewBox="0 0 76 76" style="overflow:visible">${inkCircle(38, 38, 35, { seed: 71, w: 3, amp: 1.1, fill: 'rgba(255,252,242,.6)' })}</svg></g>`;
  return `<section class="scene" id="s${idx}">
${artLayer(sceneArtBand(scene, idx) + frame(96, L.win, 0) + frame(584, R.win, 1) + mid, idx)}
${header(scene, idx, scene.title, scene.sub)}
<div class="cmp f" style="left:96px;width:400px;--d:.35s">
<h3 class="${L.win ? 'red' : ''}">${esc(L.title || L.h || '')}</h3><ul>${li(L.items)}</ul>
</div>
<div class="vs f" style="--d:.5s">VS</div>
<div class="cmp f" style="left:584px;width:400px;--d:.45s">
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
  let svg = ink([[112, baseY], [964, baseY]], { seed: 5, w: 3.2, amp: .8, op: .5, cls: 'draw', style: '--d:.3s' });
  if (scene.unit) svg += `<text x="104" y="592" font-size="25" fill="#5c4e3d" font-family="Hanzipen SC,Kaiti SC,STKaiti,KaiTi,serif">单位：${esc(scene.unit)}</text>`;
  items.forEach((it, i) => {
    const h = Math.max(6, vals[i] / max * maxH);
    const cx = areaL + step * (i + 0.5);
    const x = cx - bw / 2, y = baseY - h;
    svg += inkRect(x, y, bw, h, {
      seed: idx * 23 + i * 11 + 6, w: 4, c: colors[i % 4], amp: 1.2,
      fill: 'rgba(255,252,242,.5)', cls: 'grow', style: `--d:${(0.4 + i * 0.16).toFixed(2)}s`,
    });
    svg += `<rect x="${(x + 7).toFixed(1)}" y="${(y + 7).toFixed(1)}" width="${(bw - 14).toFixed(1)}" height="${Math.max(2, h - 14).toFixed(1)}" fill="url(#hatchD)" opacity=".14" class="grow" style="--d:${(0.4 + i * 0.16).toFixed(2)}s"/>`;
    svg += `<text x="${cx.toFixed(1)}" y="${(y - 18).toFixed(1)}" text-anchor="middle" font-size="34" font-weight="700" fill="#2d2822" font-family="Baskerville,serif" class="f" style="--d:${(0.65 + i * 0.16).toFixed(2)}s">${esc(it.note || it.value)}</text>`;
    svg += `<text x="${cx.toFixed(1)}" y="${baseY + 40}" text-anchor="middle" font-size="28" fill="#5c4e3d" font-family="Hanzipen SC,Kaiti SC,STKaiti,KaiTi,serif">${esc(it.label)}</text>`;
  });
  return `<section class="scene" id="s${idx}">
${artLayer(sceneArtBand(scene, idx) + svg, idx)}
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
    svg += ink([[x0 - 30, y], [x1 + 30, y]], { seed: 3 + g, w: 1.8, amp: .5, op: .2, dash: '6 8' });
  }
  svg += ink([[x0 - 30, yBot], [x1 + 30, yBot]], { seed: 9, w: 2.8, amp: .7, op: .45 });
  const pts = vals.map((_, i) => pt(i));
  svg += ink(pts, { seed: idx * 41 + 7, amp: 1.5, c: '#b23a2a', w: 5, cls: 'draw', style: '--d:.45s' });
  pts.forEach((p, i) => {
    svg += inkCircle(p[0], p[1], 9, { seed: idx * 19 + i * 5 + 13, w: 3.6, c: '#b23a2a', fill: '#f6eedc', amp: .7, cls: 'f', style: `--d:${(0.7 + i * 0.14).toFixed(2)}s` });
    svg += `<text x="${p[0].toFixed(1)}" y="${(p[1] - 22).toFixed(1)}" text-anchor="middle" font-size="32" font-weight="700" fill="#2d2822" font-family="Baskerville,serif" class="f" style="--d:${(0.8 + i * 0.14).toFixed(2)}s">${esc(vals[i])}${esc(L.unit || '')}</text>`;
    if (xs[i]) svg += `<text x="${p[0].toFixed(1)}" y="${yBot + 42}" text-anchor="middle" font-size="27" fill="#5c4e3d" font-family="Hanzipen SC,Kaiti SC,STKaiti,KaiTi,serif">${esc(xs[i])}</text>`;
  });
  return `<section class="scene" id="s${idx}">
${artLayer(sceneArtBand(scene, idx) + svg, idx)}
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
    // 关键数字尽量铺满列宽：两列（上涨/下跌）时最大可到 112px
    const cap = n === 1 ? 132 : n === 2 ? 112 : 76;
    const fs = Math.max(34, Math.min(cap, Math.floor(cw / Math.max(u, 1)) - 8));
    const x = 104 + i * (cw + gap);
    const tone = it.c === 'up' ? ' up' : it.c === 'down' ? ' down' : '';
    return `<div class="sc f" style="left:${x.toFixed(0)}px;top:620px;width:${cw.toFixed(0)}px;--d:${(0.35 + i * 0.14).toFixed(2)}s">
<div class="v${tone}" style="font-size:${fs}px">${esc(it.v)}</div><div class="l">${esc(it.l)}</div></div>`;
  }).join('\n');
  return `<section class="scene" id="s${idx}">
${artLayer(sceneArtBand(scene, idx), idx)}
${header(scene, idx, scene.title, scene.sub)}
${body}
${histOf(scene)}
${notesOf(scene, scene.history ? 1.05 : 0.85)}
${footOf(scene, scene._meta)}
</section>`;
}

// 近 7 个交易日涨跌家数：一行一天，红涨绿跌
function histOf(scene) {
  const list = Array.isArray(scene.history) ? scene.history : [];
  if (!list.length) return '';
  const cols = list.map((x, i) => `<div class="col${i === list.length - 1 ? ' today' : ''}">
<div class="u">${esc(String(x.up))}</div>
<div class="d">${esc(String(x.down))}</div>
<div class="dt">${esc(x.date)}</div></div>`).join('');
  return `<div class="hist f" style="top:980px;--d:.7s">
${scene.historyCaption ? `<div class="cap">${esc(scene.historyCaption)}</div>` : ''}
<div class="hd">近 ${list.length} 个交易日 · 上涨 / 下跌家数</div>
<div class="cols">${cols}</div>
</div>`;
}

function endScene(scene, idx, meta) {
  const lines = (scene.lines || scene.points && scene.points.map(p => p.t || p.d) || []).slice(0, 3);
  const body = lines.length
    ? `<div class="body f" style="top:600px;width:872px;--d:.4s">${lines.map(esc).join('<br><br>')}</div>`
    : '';
  const txt = scene.stamp || '不构成投资建议';
  const w = Math.round(units(txt) * 34 + 46), h = 64;
  const stamp = `<g class="f" style="--d:1.1s" transform="rotate(-7 ${104 + w / 2} ${1380 + h / 2})">
${inkRect(104, 1380, w, h, { seed: idx * 7 + 2, w: 4, c: '#b23a2a', amp: 1.3, op: .82 })}
${inkRect(111, 1387, w - 14, h - 14, { seed: idx * 7 + 5, w: 1.5, c: '#b23a2a', amp: 1.6, op: .5 })}
<text x="${104 + w / 2}" y="${1380 + h / 2 + 12}" text-anchor="middle" font-size="34" font-weight="700" letter-spacing="4" fill="#b23a2a" opacity=".86" font-family="Hanzipen SC,Kaiti SC,STKaiti,KaiTi,serif">${esc(txt)}</text>
</g>`;
  return `<section class="scene" id="s${idx}">
${artLayer(stamp, idx)}
${header(scene, idx, scene.title, scene.sub)}
${body}
${footOf(scene, meta, 1.25)}
</section>`;
}

function renderHTML(board, beats) {
  const meta = board.meta || {};
  // 整片共用一份"已用过的插画主体"，避免同一题材反复出现
  const usedArt = new Set();
  const cth = COVER_ACCENT[meta.cover] ? meta.cover : coverTheme(meta.title || '', meta.subtitle || '');
  if (cth) usedArt.add(cth);
  // 主题族用于兜底出图，保证每屏都有图可挂且不跑题
  const topic = COVER_ACCENT[meta.cover] && meta.cover !== 'idea'
    ? meta.cover : coverTheme(meta.title || '', meta.subtitle || '');
  const fam = ART_FAMILIES.find(f => f.includes(topic)) || ART_FAMILIES[0];
  const scenes = (board.scenes || []).map(s => ({ ...s, _meta: meta, _usedArt: usedArt, _artFam: fam }));
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

module.exports = { renderHTML, titleFS, COVER_STYLES, COVER_LABEL, COVER_LAYOUT_NAME, coverTheme, chooseCover, artBox };
