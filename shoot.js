const puppeteer = require('puppeteer-core');
(async () => {
  const scene = process.argv[2] || 's0';
  const wait = parseInt(process.argv[3] || '4000', 10);
  const [w,h] = (process.argv[4] || '1080x1728').split('x').map(Number);
  const out = process.argv[5] || ('shot_' + scene + '.png');
  const extra = process.argv[6] || '';
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--window-size='+w+','+h,'--hide-scrollbars','--disable-background-timer-throttling','--disable-renderer-backgrounding','--force-color-profile=srgb']
  });
  const page = await browser.newPage();
  await page.setViewport({width:w,height:h,deviceScaleFactor:1});
  const html = process.env.HTML || 'index.html';
  await page.goto('file:///Users/a1/Desktop/project/shipin/'+html+'?scene='+scene+extra, {waitUntil:'load'});
  await page.waitForFunction('window.__ready===true');
  await new Promise(r=>setTimeout(r, wait));
  await page.screenshot({path: out});
  await browser.close();
  console.log('saved', out);
})();
