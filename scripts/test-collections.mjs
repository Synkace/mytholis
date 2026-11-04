import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';

async function testCollections() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto(`${BASE}/#collections`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  const html = await page.evaluate(() => {
    return document.getElementById('main-content-view')?.innerHTML.slice(0, 1000) || 'no main content';
  });
  console.log('Collections HTML snippet:', html);

  // Check product cards
  const cards = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.product-card, .extrait-card, .catalog-item, [onclick*="flacon"], [onclick*="product"]')).map(c => ({
      text: c.innerText.trim().slice(0, 40).replace(/\n/g, ' '),
      tag: c.tagName,
      class: c.className
    }));
  });
  console.log('Cards found:', cards);

  await browser.close();
}

testCollections().catch(console.error);
