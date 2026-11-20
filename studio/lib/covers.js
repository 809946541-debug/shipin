'use strict';
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { renderHTML } = require('./template');
const { findChrome, fileUrl } = require('./platform');

const SCALE_THUMB = 0.25;   // 270 × 432
const SCALE_PREVIEW = 0.6;  // 648 × 1037

function boardWithCover(board, motif, layout) {
  const meta = { ...(board.meta || {}), cover: motif };
  if (layout === 0 || layout === 1 || layout === 2) meta.coverLayout = layout;
  return { meta, scenes: [{ kind: 'cover' }] };
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

function boardFile(dir, board, motif, layout) {
  const src = path.join(dir, 'covers', 'src');
  fs.mkdirSync(src, { recursive: true });
  const p = path.join(src, `${motif}-${layout}.html`);
  fs.writeFileSync(p, renderHTML(boardWithCover(board, motif, layout), [{ id: 's0', dur: 8 }]));
  return p;
}

/* 单张封面预览，返回相对路径 covers/preview.png */
async function renderPreview(dir, board, motif, layout) {
  const out = path.join(dir, 'covers', 'preview.png');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await shoot([{ htmlPath: boardFile(dir, board, motif, layout), outPath: out, scale: SCALE_PREVIEW }]);
  return 'covers/preview.png';
}

/* 批量缩略图，命中缓存则跳过；返回相对路径列表 */
async function renderThumbs(dir, board, styles) {
  const coverDir = path.join(dir, 'covers');
  fs.mkdirSync(coverDir, { recursive: true });
  const jobs = [];
  for (const s of styles) {
    const out = path.join(coverDir, `${s.motif}-${s.layout}.png`);
    if (!fs.existsSync(out)) jobs.push({ htmlPath: boardFile(dir, board, s.motif, s.layout), outPath: out, scale: SCALE_THUMB, key: `${s.motif}-${s.layout}` });
  }
  if (jobs.length) await shoot(jobs);
  return styles.map(s => `covers/${s.motif}-${s.layout}.png`);
}

module.exports = { renderPreview, renderThumbs };
