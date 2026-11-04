import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';

async function testProducts() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  for (const slug of ['petralux', 'oud-rion', 'wood-sera', 'spark', 'ash']) {
    await page.goto(`${BASE}/#flacon/${slug}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    const title = await page.$eval('h1', el => el.innerText.trim()).catch(() => 'no h1');
    const price = await page.evaluate(() => {
      const p = document.body.innerText.match(/₹[\d,]+/);
      return p ? p[0] : 'no price';
    });
    console.log(`Slug: ${slug} -> H1: ${title}, Price: ${price}`);
  }

  await browser.close();
}

testProducts().catch(console.error);
