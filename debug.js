const puppeteer = require('puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--window-size=1080,1920','--hide-scrollbars','--disable-background-timer-throttling','--disable-renderer-backgrounding']
  });
  const page = await browser.newPage();
  await page.setViewport({width:1080,height:1920,deviceScaleFactor:1});
  await page.goto('file:///Users/a1/Desktop/project/shipin/index.html?scene=s5', {waitUntil:'load'});
  await page.waitForFunction('window.__ready===true');
  await new Promise(r=>setTimeout(r,6500));
  const info = await page.evaluate(()=>{
    const el=document.querySelector('.catchMove');
    const cs=getComputedStyle(el);
    const r=el.getBoundingClientRect();
    const b=el.querySelector('path');
    return {transform:cs.transform, rect:{x:r.x,y:r.y,w:r.width,h:r.height},
      paths: el.querySelectorAll('path').length, opacity:cs.opacity, filter:cs.filter,
      firstPathD: b?b.getAttribute('d').slice(0,60):null, firstStroke: b?b.getAttribute('stroke'):null};
  });
  console.log(JSON.stringify(info,null,2));
  await page.screenshot({path:'debug_s5.png'});
  await browser.close();
})();
