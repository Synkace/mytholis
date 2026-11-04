import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';

async function testInteractions() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  const issues = [];
  const consoleLogs = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleLogs.push(msg.text());
  });
  page.on('pageerror', err => consoleLogs.push(String(err)));

  console.log('--- 1. Testing Product Size Switching (King Scar) ---');
  await page.goto(`${BASE}/#product/king-scar`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // Check initial price
  const initialPrice = await page.$eval('.price-display, .product-price, [data-price], h2, span', el => {
    const p = document.body.innerText.match(/₹[\d,]+/);
    return p ? p[0] : null;
  });

  // Check size buttons
  const sizeButtons = await page.$$('.size-btn, button[data-size], .volume-btn, .variant-pill, .size-pill');
  console.log(`Found ${sizeButtons.length} size pills/buttons`);

  // Try clicking 50ml button if present
  const btn50 = await page.$('button:has-text("50ML"), .size-btn:has-text("50"), [data-variant*="50"]');
  if (btn50) {
    await btn50.click();
    await page.waitForTimeout(500);
    const newPrice = await page.evaluate(() => {
      const p = document.body.innerText.match(/₹[\d,]+/);
      return p ? p[0] : null;
    });
    console.log(`King Scar price: initial=${initialPrice}, after clicking 50ml=${newPrice}`);
  } else {
    issues.push('Could not find 50ml selector button on product page');
  }

  // Check gallery thumbnails and arrows
  const thumbs = await page.$$('.gallery-thumb, .carousel-thumb, [data-thumb-idx]');
  console.log(`Found ${thumbs.length} gallery thumbnails`);
  if (thumbs.length > 1) {
    await thumbs[1].click();
    await page.waitForTimeout(300);
  }

  // Click Add to Cart / Acquire Flacon
  console.log('--- 2. Testing Add to Cart ---');
  const addBtn = await page.$('button:has-text("ACQUIRE"), button:has-text("ADD TO CART"), button:has-text("BAG")');
  if (addBtn) {
    await addBtn.click();
    await page.waitForTimeout(1000);
    // Check if cart opened or notification showed
    const cartVisible = await page.evaluate(() => {
      const modal = document.querySelector('#cart-modal, #cart-drawer, .cart-overlay, #cart-modal-overlay');
      return modal && getComputedStyle(modal).display !== 'none' && getComputedStyle(modal).visibility !== 'hidden';
    });
    console.log(`Cart opened after click: ${cartVisible}`);
  } else {
    issues.push('Could not find Add to Cart button on product page');
  }

  // Check Cart Items & Coupon
  console.log('--- 3. Testing Cart Drawer & Coupon ---');
  const cartItemCount = await page.evaluate(() => {
    const items = document.querySelectorAll('.cart-item, [data-cart-item]');
    return items.length;
  });
  console.log(`Cart items count: ${cartItemCount}`);

  // Test Quiz
  console.log('--- 4. Testing Scent Quiz ---');
  await page.goto(`${BASE}/#quiz`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  const quizTitle = await page.title();
  const quizOptions = await page.$$('.quiz-option, .quiz-card, button[data-quiz-answer], .option-card');
  console.log(`Quiz options on screen: ${quizOptions.length}`);

  // Test Sanctum / Admin
  console.log('--- 5. Testing Sanctum Admin Desk ---');
  await page.goto(`${BASE}/#sanctum`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  
  // Check if sign out button is present
  const signOutBtn = await page.$('button:has-text("SIGN OUT"), a:has-text("SIGN OUT")');
  if (signOutBtn) {
    const isVisible = await signOutBtn.isVisible();
    if (isVisible) {
      issues.push('FLAW: "SIGN OUT" button is still visible in Sanctum header!');
    }
  }

  // Check product catalog table edit buttons
  const editBtns = await page.$$('button:has-text("EDIT"), .btn-edit, [data-action="edit-product"]');
  console.log(`Found ${editBtns.length} EDIT buttons in Admin table`);

  if (editBtns.length > 0) {
    // Click edit on 2nd product
    await editBtns[Math.min(1, editBtns.length - 1)].click();
    await page.waitForTimeout(500);
    const modalTitle = await page.$eval('#sovereign-modal-backdrop h3, #sovereign-modal-backdrop h2, #sovereign-modal-backdrop .modal-title', el => el.innerText).catch(() => null);
    const slugVal = await page.$eval('#modal-product-slug, input[name="slug"], #flacon-slug-input', el => el.value).catch(() => null);
    console.log(`Admin Edit Modal Title: ${modalTitle}, Slug: ${slugVal}`);
    if (modalTitle && modalTitle.includes('INSCRIBE NEW')) {
      issues.push('FLAW: Edit modal still shows "INSCRIBE NEW FRAGRANCE EXTRAIT" instead of editing product');
    }
  }

  console.log('--- Console Errors ---', consoleLogs);
  console.log('--- Discovered Issues ---', issues);

  await browser.close();
}

testInteractions().catch(console.error);
