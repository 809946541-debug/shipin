const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const FPS = 30;
// 成片规格：页面按 1080x1728 渲染，合成时 ffmpeg 上下各补 96px 黑边 -> 1080x1920；左右不留黑边
const TOTAL = 322.41;
const HTML = process.env.HTML || 'index.html';
const DIR = process.env.DIR || '/Users/a1/Desktop/project/shipin/frames';

(async () => {
  const start = parseInt(process.argv[2] || '0', 10);
  const count = parseInt(process.argv[3] || '0', 10);
  fs.mkdirSync(DIR, { recursive: true });
  if (start === 0) {
    for (const f of fs.readdirSync(DIR)) fs.unlinkSync(path.join(DIR, f));
  }

  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--window-size=1080,1728', '--hide-scrollbars',
      '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
      '--force-color-profile=srgb', '--no-sandbox', '--user-data-dir=/tmp/pptr-render-profile']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1728, deviceScaleFactor: 1 });
  await page.goto('file:///Users/a1/Desktop/project/shipin/' + HTML + '?render=1', { waitUntil: 'load' });
  await page.waitForFunction('window.__ready===true');
  const client = await page.target().createCDPSession();

  const N = Math.round(TOTAL * FPS);
  const end = count > 0 ? Math.min(N, start + count) : N;
  const t0 = Date.now();
  for (let i = start; i < end; i++) {
    const ms = i * 1000 / FPS;
    await page.evaluate(t => window.__seek(t), ms);
    const shot = await client.send('Page.captureScreenshot', {
      format: 'jpeg', quality: 94, optimizeForSpeed: true
    });
    fs.writeFileSync(path.join(DIR, String(i).padStart(5, '0') + '.jpg'),
      Buffer.from(shot.data, 'base64'));
    if (i % 100 === 0) {
      console.log('frame', i, '/', end, ((Date.now() - t0) / (i - start + 1)).toFixed(0) + 'ms/f');
    }
  }
  await browser.close();
  console.log('done', start, '->', end);
})();
