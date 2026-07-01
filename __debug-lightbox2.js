const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const p = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  await p.goto('http://localhost:8934/portfolio.html', { waitUntil: 'networkidle' });
  await p.click('.gallery-item >> nth=2');
  await p.waitForTimeout(300);
  const info = await p.evaluate(() => {
    const next = document.querySelector('.lightbox-next');
    const content = document.querySelector('.lightbox-content');
    const cs = getComputedStyle(next);
    return {
      offsetParentTag: next.offsetParent ? next.offsetParent.className : null,
      right: cs.right,
      position: cs.position,
      contentRect: content.getBoundingClientRect(),
      nextRect: next.getBoundingClientRect(),
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
