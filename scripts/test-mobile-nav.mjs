import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';

async function testMobileNav() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });

  await page.goto(`${BASE}/#home`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  const tabs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('#mobile-app-bottom-nav .mobile-nav-item')).map(t => ({
      text: t.innerText.trim().replace(/\s+/g, ' '),
      onclick: t.getAttribute('onclick'),
      dataNav: t.getAttribute('data-nav')
    }));
  });
  console.log('Mobile bottom nav tabs:', tabs);

  // Test clicking Wishlist
  console.log('Clicking Wishlist...');
  await page.click('#mobile-app-bottom-nav [data-nav="wishlist"]');
  await page.waitForTimeout(500);
  const wishlistOpen = await page.evaluate(() => {
    const m = document.getElementById('wishlist-modal-overlay') || document.querySelector('.wishlist-modal');
    return m && getComputedStyle(m).display !== 'none';
  });
  console.log('Wishlist modal open:', wishlistOpen);

  // Test clicking Bag
  console.log('Clicking Bag...');
  await page.click('#mobile-app-bottom-nav [data-nav="cart"]');
  await page.waitForTimeout(500);
  const cartOpen = await page.evaluate(() => {
    const m = document.getElementById('cart-modal-overlay');
    return m && getComputedStyle(m).display !== 'none';
  });
  console.log('Cart modal open:', cartOpen);

  // Test clicking Legends
  console.log('Clicking Legends...');
  await page.click('#mobile-app-bottom-nav [data-nav="legends"]');
  await page.waitForTimeout(600);
  const legendsTitle = await page.$eval('h1, h2', el => el.innerText.trim()).catch(e => e.message);
  console.log('Legends page title:', legendsTitle);

  // Test clicking Dossier
  console.log('Clicking Dossier...');
  await page.click('#mobile-app-bottom-nav [data-nav="profile"]');
  await page.waitForTimeout(600);
  const dossierTitle = await page.$eval('h1, h2', el => el.innerText.trim()).catch(e => e.message);
  console.log('Dossier page title:', dossierTitle);

  await browser.close();
}

testMobileNav().catch(console.error);
