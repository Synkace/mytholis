import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';

async function testAdmin() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto(`${BASE}/#admin`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  const adminHtml = await page.evaluate(() => {
    return document.getElementById('main-content-view')?.innerHTML.slice(0, 1000) || 'no main content';
  });
  console.log('Admin HTML snippet:', adminHtml);

  // Check buttons
  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('#main-content-view button, #main-content-view a')).map(b => b.innerText.trim());
  });
  console.log('Admin buttons:', buttons);

  await browser.close();
}

testAdmin().catch(console.error);
