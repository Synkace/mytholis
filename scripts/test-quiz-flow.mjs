import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';

async function testFullQuiz() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto(`${BASE}/#quiz`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);

  console.log('Clicking Step 1 option...');
  await page.click('.quiz-option-card');
  await page.waitForTimeout(600);

  const step2Text = await page.$eval('.quiz-title', el => el.innerText).catch(e => e.message);
  console.log('Step 2 Title:', step2Text);

  console.log('Clicking Step 2 option...');
  await page.click('.quiz-option-card');
  await page.waitForTimeout(600);

  const resultTitle = await page.$eval('.quiz-title, h2, h3', el => el.innerText).catch(e => e.message);
  console.log('Quiz Result Title:', resultTitle);

  await browser.close();
}

testFullQuiz().catch(console.error);
