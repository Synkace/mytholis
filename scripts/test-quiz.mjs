import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';

async function testQuiz() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto(`${BASE}/#quiz`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  const html = await page.evaluate(() => {
    return document.getElementById('main-content-view')?.innerHTML.slice(0, 800) || 'no main content';
  });
  console.log('Quiz HTML:', html);

  await browser.close();
}

testQuiz().catch(console.error);
