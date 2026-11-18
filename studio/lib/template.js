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
.cover-k{left:0;width:1080px;text-align:center;top:238px}
.cover-h{left:0;width:1080px;text-align:center;top:300px;font-size:76px;letter-spacing:.03em}
.cover-sub{position:absolute;left:0;width:1080px;text-align:center;top:626px;font-size:40px;color:var(--ink2)}
.cover-tag{position:absolute;left:0;width:1080px;text-align:center;top:1500px;font-size:30px;letter-spacing:.12em}
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

function coverScene(scene, meta) {
  const title = meta.title || scene.title || '';
  const sub = meta.subtitle || scene.sub || '';
  const fs = titleFS(title, 76);
  return `<section class="scene" id="s0">
<svg class="art" viewBox="0 0 1080 1920">
<g class="f" style="--d:.35s" transform="translate(540,1040) scale(1.3)"><use href="#globe"/></g>
<path d="M330 960 C470 880 610 880 750 960" fill="none" stroke="#b23a2a" stroke-width="4" stroke-dasharray="8 10" class="draw" style="--d:1s"/>
<circle cx="330" cy="960" r="9" fill="#b23a2a" class="f" style="--d:1.2s"/>
<circle cx="750" cy="960" r="9" fill="#b23a2a" class="f" style="--d:1.2s"/>
<g class="f" style="--d:1.1s" transform="translate(430,1120)"><use href="#tanker" transform="scale(.9)"/></g>
<g class="f" style="--d:1.25s" transform="translate(760,1140)"><use href="#barrel" transform="scale(.8)"/></g>
<g class="f" style="--d:1.4s" transform="translate(200,1150)"><use href="#barrel" transform="scale(.7)"/></g>
</svg>
<div class="k f cover-k" style="--d:.05s">${esc(meta.kicker || '手绘财经 · 情景推演')}</div>
<h1 class="h1 rise cover-h" style="--d:.15s;font-size:${fs}px">${esc(title)}</h1>
<div class="f cover-sub" style="--d:.35s">${esc(sub)}</div>
<div class="f cover-tag red" style="--d:1.5s">${esc(meta.disclaimer || '公开信息梳理 · 不构成投资建议')}</div>
</section>`;
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
