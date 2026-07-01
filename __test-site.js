const { chromium } = require('playwright');

const BASE = 'http://localhost:8934';
const PAGES = ['index.html','about.html','services.html','service-details.html','pricing.html','portfolio.html','blog.html','order.html','contact.html'];

(async () => {
  const browser = await chromium.launch();
  const results = [];

  for (const page of PAGES) {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    const errors = [];
    p.on('pageerror', e => errors.push('pageerror: ' + e.message));
    p.on('console', msg => { if (msg.type() === 'error') errors.push('console.error: ' + msg.text()); });
    p.on('requestfailed', req => errors.push('requestfailed: ' + req.url() + ' ' + (req.failure() && req.failure().errorText)));

    await p.goto(`${BASE}/${page}`, { waitUntil: 'networkidle' });
    await p.waitForTimeout(300);
    results.push({ page, errors: [...errors] });
    await ctx.close();
  }

  console.log(JSON.stringify(results, null, 2));
  await browser.close();
})();
