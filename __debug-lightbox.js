const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const p = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  await p.goto('http://localhost:8934/portfolio.html', { waitUntil: 'networkidle' });
  await p.click('.gallery-item >> nth=2');
  await p.waitForTimeout(300);
  await p.screenshot({ path: '__lightbox-debug.png' });
  const box = await p.locator('.lightbox-next').boundingBox();
  const contentBox = await p.locator('.lightbox-content').boundingBox();
  console.log('lightbox-next box:', box);
  console.log('lightbox-content box:', contentBox);
  console.log('viewport:', p.viewportSize());
  await browser.close();
})();
