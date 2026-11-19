'use strict';
// 渲染任务帧序列：环境变量 HTML / DIR / TOTAL / FPS / START / COUNT / PREFIX
const fs = require('fs');
const path = require('path');
let puppeteer;
try {
  puppeteer = require('puppeteer-core');
} catch {
  console.error('缺少依赖 puppeteer-core：请在项目根目录执行 npm install（或双击 install.bat）');
  process.exit(2);
}
const { findChrome, fileUrl } = require('./platform');

const FPS = Number(process.env.FPS || 30);
const HTML = process.env.HTML;
const DIR = process.env.DIR;
const TOTAL = Number(process.env.TOTAL || 0);
const START = Number(process.env.START || 0);
const COUNT = Number(process.env.COUNT || 0);
const PREFIX = process.env.PREFIX || 'frame';

(async () => {
  if (!HTML || !DIR || !TOTAL) throw new Error('缺少 HTML / DIR / TOTAL');
  const CHROME = findChrome();
  if (!CHROME) throw new Error('找不到 Chrome，请安装或设置环境变量 CHROME_PATH');
  fs.mkdirSync(DIR, { recursive: true });
  const end = Math.round(TOTAL * FPS);
  const stop = COUNT > 0 ? Math.min(end, START + COUNT) : end;

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--window-size=1080,1728', '--hide-scrollbars',
      '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
      '--force-color-profile=srgb', '--no-sandbox', '--disable-dev-shm-usage',
      '--user-data-dir=' + path.join(DIR, '.chrome')],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1728, deviceScaleFactor: 1 });
  await page.goto(fileUrl(HTML) + '?render=1', { waitUntil: 'load' });
  await page.waitForFunction('window.__ready===true', { timeout: 60000 });
  const client = await page.target().createCDPSession();

  const t0 = Date.now();
  for (let i = START; i < stop; i++) {
    await page.evaluate(t => window.__seek(t), i * 1000 / FPS);
    const shot = await client.send('Page.captureScreenshot', { format: 'jpeg', quality: 94, optimizeForSpeed: true });
    fs.writeFileSync(path.join(DIR, PREFIX + '_' + String(i).padStart(5, '0') + '.jpg'),
      Buffer.from(shot.data, 'base64'));
    const done = i - START + 1;
    if (done % 50 === 0 || i === stop - 1) {
      const ms = (Date.now() - t0) / done;
      console.log(`PROGRESS ${done}/${stop - START} ${ms.toFixed(0)}ms/f`);
    }
  }
  await browser.close();
  console.log('FRAMES_DONE ' + (stop - START));
})().catch(err => {
  console.error('RENDER_FAIL ' + (err && err.message ? err.message : err));
  process.exit(1);
});
