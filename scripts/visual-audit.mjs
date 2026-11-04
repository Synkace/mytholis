import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE_URL || 'http://localhost:5173';
const OUT = 'visual-audit';
fs.mkdirSync(OUT, { recursive: true });

const viewports = [
  { name: 'desktop', width: 1440, height: 900,  isMobile: false, hasTouch: false },
  { name: 'tablet',  width: 768,  height: 1024, isMobile: false, hasTouch: true  },
  { name: 'mobile',  width: 360,  height: 800,  isMobile: true,  hasTouch: true  },
];

const manifest = { base: BASE, generatedAt: new Date().toISOString(), screens: [], consoleErrors: [], pageErrors: [] };

const cartSelectors = [
  '[onclick*="openCartModal"]',
  '[data-cart-toggle]',
  '[aria-label*="bag" i]',
  '[aria-label*="cart" i]',
  '.mobile-bottom-nav button:nth-child(3)',
  'button:has-text("Bag")',
  'text=Bag',
];

const checkoutSelectors = [
  'button:has-text("Proceed")',
  'button:has-text("Checkout")',
  '[data-checkout]',
  'text=Proceed to Payment',
];

async function firstVisible(page, selectors, timeout = 1500) {
  for (const sel of selectors) {
    const loc = page.locator(sel).first();
    try {
      if (await loc.isVisible({ timeout })) return loc;
    } catch {}
  }
  return null;
}

const browser = await chromium.launch({ headless: true });

for (const vp of viewports) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
    isMobile: vp.isMobile,
    hasTouch: vp.hasTouch,
  });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') manifest.consoleErrors.push({ viewport: vp.name, text: msg.text() });
  });
  page.on('pageerror', (err) => {
    manifest.pageErrors.push({ viewport: vp.name, text: String(err) });
  });

  try {
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 20000 });
  } catch {
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  }
  await page.waitForTimeout(2500);

  const homePath = path.join(OUT, `home-${vp.name}-${vp.width}.png`);
  await page.screenshot({ path: homePath, fullPage: true });
  manifest.screens.push({ viewport: vp.name, width: vp.width, height: vp.height, screen: 'home', path: homePath });

  const cart = await firstVisible(page, cartSelectors);
  if (cart) {
    await cart.click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(1000);
    const cartPath = path.join(OUT, `cart-${vp.name}-${vp.width}.png`);
    await page.screenshot({ path: cartPath, fullPage: true });
    manifest.screens.push({ viewport: vp.name, width: vp.width, height: vp.height, screen: 'cart', path: cartPath });

    const checkout = await firstVisible(page, checkoutSelectors);
    if (checkout) {
      await checkout.click({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(1200);
      const checkoutPath = path.join(OUT, `checkout-${vp.name}-${vp.width}.png`);
      await page.screenshot({ path: checkoutPath, fullPage: true });
      manifest.screens.push({ viewport: vp.name, width: vp.width, height: vp.height, screen: 'checkout', path: checkoutPath });
    }
  } else {
    manifest.screens.push({ viewport: vp.name, screen: 'cart', skipped: true, reason: 'no cart toggle found' });
  }

  await context.close();
}

await browser.close();
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(JSON.stringify(manifest, null, 2));
