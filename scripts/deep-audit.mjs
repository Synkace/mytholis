import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
const VPS = [
  { name: 'mobile_360', width: 360, height: 800, isMobile: true, hasTouch: true },
  { name: 'tablet_768', width: 768, height: 1024, isMobile: false, hasTouch: true },
  { name: 'desktop_1440', width: 1440, height: 900, isMobile: false, hasTouch: false },
];

const ROUTES = [
  '#home',
  '#collections',
  '#product/king-scar',
  '#product/petralux',
  '#product/mytholis-discovery-set',
  '#quiz',
  '#track-order',
  '#sanctum'
];

async function runAudit() {
  const browser = await chromium.launch({ headless: true });
  const findings = [];

  for (const vp of VPS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile,
      hasTouch: vp.hasTouch
    });
    const page = await ctx.newPage();

    const consoleErrors = [];
    const failedRequests = [];

    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => {
      consoleErrors.push(String(err));
    });
    page.on('requestfailed', req => {
      failedRequests.push({ url: req.url(), failure: req.failure()?.errorText });
    });
    page.on('response', res => {
      if (res.status() >= 400 && !res.url().includes('favicon')) {
        failedRequests.push({ url: res.url(), status: res.status() });
      }
    });

    for (const route of ROUTES) {
      const url = `${BASE}/${route}`;
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(600);

        // Check for NaN, undefined, null text
        const textIssues = await page.evaluate(() => {
          const bodyText = document.body.innerText || '';
          const hits = [];
          if (/₹\s*NaN/i.test(bodyText)) hits.push('₹NaN detected in text');
          if (/\bundefined\b/.test(bodyText)) {
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
            let n;
            while ((n = walker.nextNode())) {
              if (n.nodeValue && /\bundefined\b/.test(n.nodeValue)) {
                hits.push(n.parentElement ? `${n.parentElement.tagName}.${n.parentElement.className}: "${n.nodeValue.trim().slice(0, 50)}"` : 'undefined text');
              }
            }
          }
          return hits;
        });

        // Horizontal overflow check
        const overflow = await page.evaluate((vw) => {
          const sw = document.documentElement.scrollWidth;
          const badEls = [];
          if (sw > vw + 2) {
            document.querySelectorAll('body *').forEach(el => {
              const b = el.getBoundingClientRect();
              if (b.width > 0 && b.right > vw + 4) {
                badEls.push(`${el.tagName}.${el.className?.toString().slice(0, 30)} (r:${Math.round(b.right)}, w:${Math.round(b.width)})`);
              }
            });
          }
          return { sw, hasOverflow: sw > vw + 2, badEls: badEls.slice(0, 5) };
        }, vp.width);

        // Check for broken images
        const brokenImages = await page.evaluate(() => {
          const imgs = Array.from(document.querySelectorAll('img'));
          return imgs
            .filter(img => img.offsetParent !== null && (!img.complete || img.naturalWidth === 0))
            .map(img => ({ src: img.src.slice(-40), class: img.className }));
        });

        const entry = {
          viewport: vp.name,
          route,
          overflow: overflow.hasOverflow ? { scrollWidth: overflow.sw, offenders: overflow.badEls } : null,
          textIssues: textIssues.slice(0, 5),
          brokenImages: brokenImages.slice(0, 5),
          consoleErrors: [...new Set(consoleErrors)].slice(0, 5),
          failedRequests: failedRequests.slice(0, 5)
        };
        
        // Only log if something interesting was found or summary
        findings.push(entry);

        consoleErrors.length = 0;
        failedRequests.length = 0;
      } catch (err) {
        findings.push({ viewport: vp.name, route, error: err.message });
      }
    }

    await ctx.close();
  }

  await browser.close();
  
  // Filter for actual issues
  const actualIssues = findings.filter(f => 
    f.overflow || 
    (f.textIssues && f.textIssues.length > 0) || 
    (f.brokenImages && f.brokenImages.length > 0) || 
    (f.consoleErrors && f.consoleErrors.length > 0) || 
    (f.failedRequests && f.failedRequests.length > 0) ||
    f.error
  );

  console.log(`=== AUDIT SUMMARY: Found ${actualIssues.length} issues across tests ===`);
  console.log(JSON.stringify(actualIssues, null, 2));
}

runAudit();
