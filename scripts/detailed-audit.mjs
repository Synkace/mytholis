import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';

async function runDetailedCheck() {
  const browser = await chromium.launch({ headless: true });
  const report = {};

  // 1. Mobile & Desktop Navigation & Hero
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await page.goto(`${BASE}/#home`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  report.mobileHero = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.card, .flacon-card'));
    const sw = document.documentElement.scrollWidth;
    const cw = document.documentElement.clientWidth;
    return {
      cardsFound: cards.length,
      hasHorizontalOverflow: sw > cw,
      scrollWidth: sw,
      clientWidth: cw,
      activeCenterCard: document.querySelector('.is-mobile-center')?.className || 'None'
    };
  });

  // 2. Collections Page
  await page.goto(`${BASE}/#collections`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  report.collections = await page.evaluate(() => {
    const productCards = Array.from(document.querySelectorAll('.collection-card, .catalog-card, [data-slug]'));
    const prices = Array.from(document.querySelectorAll('.price, .catalog-price')).map(p => p.innerText.trim());
    return {
      cardCount: productCards.length,
      samplePrices: prices.slice(0, 6)
    };
  });

  // 3. Test All 7 Product Pages
  const slugs = ['king-scar', 'petralux', 'oud-rion', 'spark', 'wood-sera', 'ash', 'mytholis-discovery-set'];
  report.products = [];

  for (const slug of slugs) {
    await page.goto(`${BASE}/#product/${slug}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const data = await page.evaluate((s) => {
      const title = document.querySelector('h1')?.innerText?.trim();
      const price = document.body.innerText.match(/₹[\d,]+/)?.[0];
      const buttons = Array.from(document.querySelectorAll('.size-btn, button[data-size], .variant-btn'))
        .map(b => b.innerText.trim().replace(/\s+/g, ' '));
      const images = Array.from(document.querySelectorAll('.product-gallery img, .pdp-gallery img, .gallery-strip img, .pdp-image-container img'))
        .map(img => ({ src: img.src.split('/').pop(), naturalWidth: img.naturalWidth }));
      const hasDefaultTag = /★\s*DEFAULT/i.test(document.body.innerText);

      return {
        slug: s,
        title,
        price,
        sizeButtons: buttons,
        imagesFound: images.length,
        brokenImages: images.filter(i => i.naturalWidth === 0).map(i => i.src),
        hasDefaultTag
      };
    }, slug);

    report.products.push(data);
  }

  // 4. Test Scent Quiz Wizard
  await page.goto(`${BASE}/#quiz`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  report.quiz = await page.evaluate(() => {
    const container = document.querySelector('#quiz-view, #quiz-container, .quiz-section');
    const steps = document.querySelectorAll('.quiz-step, .question-card');
    const options = document.querySelectorAll('.quiz-option, .quiz-choice, [data-choice]');
    return {
      rendered: !!container,
      containerHtmlSnippet: container ? container.innerHTML.slice(0, 300) : null,
      stepsCount: steps.length,
      optionsCount: options.length
    };
  });

  // 5. Test Track Order Page
  await page.goto(`${BASE}/#track-order`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  report.trackOrder = await page.evaluate(() => {
    const input = document.querySelector('#order-query, input[name="orderId"], #track-input');
    const btn = document.querySelector('button[type="submit"], #track-btn, .btn-track');
    return {
      hasInput: !!input,
      hasButton: !!btn
    };
  });

  // 6. Test Sanctum Header & Edit Modal
  await page.goto(`${BASE}/#sanctum`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  report.sanctum = await page.evaluate(() => {
    const signOut = Array.from(document.querySelectorAll('button, a')).find(b => b.innerText.trim().toUpperCase() === 'SIGN OUT');
    const hasDefaultInAdmin = /★\s*DEFAULT/i.test(document.querySelector('#admin-products-table, .vault-inventory, body')?.innerText || '');
    const rows = Array.from(document.querySelectorAll('tr[data-product-id], tr[data-slug], .product-row')).map(r => r.innerText.trim().slice(0, 60));
    return {
      signOutButtonFound: !!signOut,
      signOutButtonVisible: signOut ? signOut.offsetParent !== null : false,
      hasDefaultTagInAdmin: hasDefaultInAdmin,
      tableRows: rows.slice(0, 5)
    };
  });

  await browser.close();
  console.log(JSON.stringify(report, null, 2));
}

runDetailedCheck().catch(console.error);
