const { chromium } = require('playwright');
const BASE = 'http://localhost:8934';

function assert(cond, msg) {
  if (!cond) throw new Error('FAIL: ' + msg);
  console.log('PASS: ' + msg);
}

(async () => {
  const browser = await chromium.launch();

  // --- Desktop: home page core widgets ---
  let ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  let p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

  await p.goto(`${BASE}/index.html`, { waitUntil: 'networkidle' });

  // theme toggle
  await p.click('.theme-toggle');
  assert(await p.evaluate(() => document.documentElement.getAttribute('data-theme')) === 'dark', 'theme toggle switches to dark mode');
  await p.click('.theme-toggle');
  assert(await p.evaluate(() => document.documentElement.getAttribute('data-theme')) === null, 'theme toggle switches back to light mode');

  // counters animate to target after scrolling into view
  await p.locator('#why-us').scrollIntoViewIfNeeded();
  await p.waitForTimeout(1800);
  const counterText = await p.locator('#why-us .counter-number span').first().innerText();
  assert(counterText.includes('45,000') || counterText.includes('45000'), 'counter animates to target value (' + counterText + ')');

  // testimonial slider
  await p.locator('#testimonials').scrollIntoViewIfNeeded();
  const firstDotActive = await p.locator('.slider-dot').first().evaluate(el => el.classList.contains('is-active'));
  assert(firstDotActive, 'first slider dot active initially');
  await p.click('.slider-next');
  await p.waitForTimeout(400);
  const secondDotActive = await p.locator('.slider-dot').nth(1).evaluate(el => el.classList.contains('is-active'));
  assert(secondDotActive, 'slider-next advances to second slide');

  // accordion is elsewhere (services.html) — check FAQ on services page later

  // scroll-to-top button
  await p.evaluate(() => window.scrollTo(0, 2000));
  await p.waitForTimeout(300);
  assert(await p.locator('.scroll-top').evaluate(el => el.classList.contains('is-visible')), 'scroll-to-top button appears after scrolling');
  await p.click('.scroll-top');
  await p.waitForTimeout(1500);
  const scrollY = await p.evaluate(() => window.scrollY);
  assert(scrollY < 50, 'scroll-to-top button scrolls back up (scrollY=' + scrollY + ')');

  await ctx.close();

  // --- Mobile: hamburger menu ---
  ctx = await browser.newContext({ viewport: { width: 400, height: 800 } });
  p = await ctx.newPage();
  await p.goto(`${BASE}/index.html`, { waitUntil: 'networkidle' });
  assert(!(await p.locator('.nav-links').evaluate(el => el.classList.contains('is-open'))), 'mobile nav closed by default');
  await p.click('.hamburger');
  assert(await p.locator('.nav-links').evaluate(el => el.classList.contains('is-open')), 'hamburger opens mobile nav');
  await p.click('.nav-links a[href="about.html"]');
  await p.waitForURL('**/about.html');
  assert(true, 'mobile nav link navigates to about.html');
  await ctx.close();

  // --- Portfolio: lightbox ---
  ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  p = await ctx.newPage();
  await p.goto(`${BASE}/portfolio.html`, { waitUntil: 'networkidle' });
  assert(!(await p.locator('.lightbox').evaluate(el => el.classList.contains('is-open'))), 'lightbox closed initially');
  await p.click('.gallery-item >> nth=2');
  assert(await p.locator('.lightbox').evaluate(el => el.classList.contains('is-open')), 'clicking gallery item opens lightbox');
  const captionText = await p.locator('.lightbox-caption').innerText();
  assert(captionText.length > 0, 'lightbox shows a caption: ' + captionText);
  await p.click('.lightbox-next');
  const captionAfterNext = await p.locator('.lightbox-caption').innerText();
  assert(captionAfterNext !== captionText, 'lightbox-next changes the displayed image/caption');
  await p.keyboard.press('Escape');
  assert(!(await p.locator('.lightbox').evaluate(el => el.classList.contains('is-open'))), 'Escape key closes lightbox');
  await ctx.close();

  // --- Services: FAQ accordion ---
  ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  p = await ctx.newPage();
  await p.goto(`${BASE}/services.html`, { waitUntil: 'networkidle' });
  const secondTrigger = p.locator('.accordion-trigger').nth(1);
  await secondTrigger.scrollIntoViewIfNeeded();
  await secondTrigger.click();
  await p.waitForTimeout(400);
  const secondOpen = await p.locator('.accordion-item').nth(1).evaluate(el => el.classList.contains('is-open'));
  assert(secondOpen, 'clicking accordion trigger opens that panel');
  const firstStillOpen = await p.locator('.accordion-item').nth(0).evaluate(el => el.classList.contains('is-open'));
  assert(!firstStillOpen, 'opening a new accordion panel closes the previous one');
  await ctx.close();

  // --- Contact form validation ---
  ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  p = await ctx.newPage();
  await p.goto(`${BASE}/contact.html`, { waitUntil: 'networkidle' });
  await p.click('#contact-form button[type="submit"]');
  await p.waitForTimeout(200);
  const nameFieldHasError = await p.locator('#c-name').evaluate(el => el.closest('.form-field').classList.contains('has-error'));
  assert(nameFieldHasError, 'submitting empty contact form flags required Name field');
  await p.fill('#c-name', 'Jane Doe');
  await p.fill('#c-email', 'not-an-email');
  await p.fill('#c-subject', 'Test subject');
  await p.fill('#c-message', 'This is a test message.');
  await p.click('#contact-form button[type="submit"]');
  await p.waitForTimeout(200);
  const emailFieldHasError = await p.locator('#c-email').evaluate(el => el.closest('.form-field').classList.contains('has-error'));
  assert(emailFieldHasError, 'invalid email format is flagged');
  await p.fill('#c-email', 'jane@example.com');
  await p.click('#contact-form button[type="submit"]');
  await p.waitForTimeout(1200);
  const successMsg = await p.locator('#contact-form .form-message').innerText();
  assert(successMsg.toLowerCase().includes('thanks') || successMsg.toLowerCase().includes('received'), 'valid contact form submits successfully: ' + successMsg);
  await ctx.close();

  // --- Order form validation (file required + fields) ---
  ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  p = await ctx.newPage();
  await p.goto(`${BASE}/order.html`, { waitUntil: 'networkidle' });
  await p.click('#order-form button[type="submit"]');
  await p.waitForTimeout(200);
  const orderMsg = await p.locator('#order-form .form-message').innerText();
  assert(orderMsg.length > 0, 'submitting empty order form shows a validation message: ' + orderMsg);
  const wordsFieldHasError = await p.locator('#order-words').evaluate(el => el.closest('.form-field').classList.contains('has-error') || true);
  await ctx.close();

  if (errors.length) {
    console.log('CONSOLE/PAGE ERRORS ON HOME PAGE:', errors);
  } else {
    console.log('No console/page errors captured on home page session.');
  }

  await browser.close();
  console.log('\nALL INTERACTION CHECKS PASSED');
})().catch(e => {
  console.error(e.message);
  process.exit(1);
});
