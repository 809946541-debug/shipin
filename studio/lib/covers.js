'use strict';
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { renderHTML } = require('./template');
const { artDataUri, artSvg, normalizeProvider, sceneArtSvg, sceneArtDataUri, normalizeSceneMode, stripSvgBg } = require('./artgen');
const { findChrome, fileUrl } = require('./platform');

const SCALE_THUMB = 0.25;   // 270 × 432
const SCALE_PREVIEW = 0.6;  // 648 × 1037

/* 任务处于“按标题生成插画”模式时，把 covers/art.svg 或 art.img 挂到分镜上再渲染 */
function withArt(dir, board) {
  if (!board || !board.meta || !board.meta.artMode) return board;
  const provider = normalizeProvider(board.meta.artProvider);
  const meta = { ...board.meta };
  const svg = stripSvgBg(artSvg(dir));
  const uri = artDataUri(dir);
  // 优先用当前方式的文件；换方式失败时保留另一种，避免封面突然变空
  if (provider === 'svg' && svg) meta.artSvg = svg;
  else if (provider !== 'svg' && uri) meta.artDataUri = uri;
  else if (svg) meta.artSvg = svg;
  else if (uri) meta.artDataUri = uri;
  if (!meta.artSvg && !meta.artDataUri) return board;
  return { ...board, meta };
}

function boardWithCover(board, motif, layout) {
  const meta = { ...(board.meta || {}), cover: motif };
  if (layout === 0 || layout === 1 || layout === 2) meta.coverLayout = layout;
  return { meta, scenes: [{ kind: 'cover' }] };
}

/* 分镜插图模式不是素材库时，把 scenes/s*.svg|img 挂到每一屏再渲染 */
function withSceneArt(dir, board) {
  if (!board || !board.meta) return board;
  if (normalizeSceneMode(board.meta.sceneArtMode) === 'library') return board;
  let changed = false;
  const scenes = (board.scenes || []).map((s, i) => {
    if (!s || s.kind === 'cover' || s.kind === 'end') return s;
    const svg = stripSvgBg(sceneArtSvg(dir, i));
    const uri = sceneArtDataUri(dir, i);
    if (!svg && !uri) return s;
    changed = true;
    return { ...s, _artSvg: svg || undefined, _artDataUri: uri || undefined };
  });
  return changed ? { ...board, scenes } : board;
}

async function shoot(tasks) {
  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars', '--force-color-profile=srgb'],
  });
  try {
    const page = await browser.newPage();
    for (const t of tasks) {
      await page.setViewport({ width: 1080, height: 1728, deviceScaleFactor: t.scale });
      await page.goto(fileUrl(t.htmlPath) + '?render=1', { waitUntil: 'load' });
      await page.waitForFunction('window.__ready === true', { timeout: 20000 });
      await page.evaluate(() => window.__seek(4000));
      await new Promise(r => setTimeout(r, 90));
      await page.screenshot({ path: t.outPath });
    }
  } finally {
    await browser.close();
  }
}

function boardFile(dir, board, motif, layout, kind) {
  const src = path.join(dir, 'covers', 'src');
  fs.mkdirSync(src, { recursive: true });
  const prefix = kind === 'thumb' ? 'thumb-' : 'prev-';
  const p = path.join(src, `${prefix}${motif}-${layout}.html`);
  // 只有单张预览才注入插画；缩略图永远画素材 SVG，否则插画模式下每张缩略图都是同一张图
  const b = kind === 'thumb' ? board : withArt(dir, board);
  fs.writeFileSync(p, renderHTML(boardWithCover(b, motif, layout), [{ id: 's0', dur: 8 }]));
  return p;
}

/* 单张封面预览，返回相对路径 covers/preview.png */
async function renderPreview(dir, board, motif, layout) {
  const out = path.join(dir, 'covers', 'preview.png');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await shoot([{ htmlPath: boardFile(dir, board, motif, layout, 'preview'), outPath: out, scale: SCALE_PREVIEW }]);
  return 'covers/preview.png';
}

/* 批量缩略图，命中缓存则跳过；返回相对路径列表 */
async function renderThumbs(dir, board, styles) {
  const coverDir = path.join(dir, 'covers');
  const src = path.join(coverDir, 'src');
  fs.mkdirSync(coverDir, { recursive: true });
  const jobs = [];
  for (const s of styles) {
    const out = path.join(coverDir, `${s.motif}-${s.layout}.png`);
    // 清掉旧版把插画注入缩略图时留下的缓存（一次性：清完就删掉旧 HTML）
    const legacy = path.join(src, `${s.motif}-${s.layout}.html`);
    if (fs.existsSync(legacy)) {
      let polluted = false;
      try { polluted = fs.readFileSync(legacy, 'utf8').includes('data:image'); } catch { }
      if (polluted) fs.unlinkSync(out);
      try { fs.unlinkSync(legacy); } catch { }
    }
    if (!fs.existsSync(out)) jobs.push({ htmlPath: boardFile(dir, board, s.motif, s.layout, 'thumb'), outPath: out, scale: SCALE_THUMB, key: `${s.motif}-${s.layout}` });
  }
  if (jobs.length) await shoot(jobs);
  return styles.map(s => `covers/${s.motif}-${s.layout}.png`);
}

module.exports = { renderPreview, renderThumbs, withArt, withSceneArt };
