import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';

async function investigate() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  page.on('response', async res => {
    if (res.status() >= 400) {
      let body = '';
      try { body = await res.text(); } catch (e) {}
      console.log(`FAILED REQUEST: ${res.request().method()} ${res.url()} -> Status ${res.status()} - Body: ${body.slice(0, 200)}`);
    }
  });

  await page.goto(`${BASE}/#product/king-scar`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  console.log('Clicking ADD TO CART...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('ADD TO CART'));
    if (btn) btn.click();
  });

  await page.waitForTimeout(2000);
  await browser.close();
}

investigate().catch(console.error);
