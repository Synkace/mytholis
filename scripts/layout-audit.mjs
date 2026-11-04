import { chromium } from 'playwright';
const BASE = process.env.BASE_URL || 'http://localhost:5173';
const VPS = [
  { n:'desktop', w:1440, h:900 },
  { n:'tablet',  w:768,  h:1024 },
  { n:'mobile',  w:360,  h:800  },
];
const browser = await chromium.launch({ headless:true });
const out = [];
for (const vp of VPS) {
  const ctx = await browser.newContext({ viewport:{ width:vp.w, height:vp.h }, isMobile: vp.w<500, hasTouch: vp.w<1024 });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', m => m.type()==='error' && errs.push(m.text().slice(0,120)));
  page.on('pageerror', e => errs.push(String(e).slice(0,120)));
  await page.goto(BASE, { waitUntil:'networkidle', timeout:20000 }).catch(()=>{});
  await page.waitForTimeout(1500);
  const r = await page.evaluate(({vw,vh}) => {
    const issues = [];
    // horizontal overflow
    const sw = document.documentElement.scrollWidth;
    if (sw > vw + 2) issues.push(`HORIZONTAL_OVERFLOW scrollWidth=${sw} viewport=${vw}`);
    // elements wider than viewport or off-screen right
    document.querySelectorAll('body *').forEach(el => {
      const b = el.getBoundingClientRect();
      if (b.width === 0 || b.height === 0) return;
      if (b.right > vw + 4) issues.push(`OFFSCREEN_RIGHT ${el.tagName}.${el.className||''}`.slice(0,120));
      if (b.left < -4) issues.push(`OFFSCREEN_LEFT ${el.tagName}.${el.className||''}`.slice(0,120));
    });
    // clipped text (scrollWidth > clientWidth on text nodes' parents)
    document.querySelectorAll('h1,h2,h3,p,span,button,a,li').forEach(el => {
      if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflow !== 'visible')
        issues.push(`CLIPPED_TEXT ${el.tagName} "${(el.textContent||'').trim().slice(0,30)}"`);
    });
    // tap targets under 44px on mobile
    if (vw < 500) document.querySelectorAll('button,a[href]').forEach(el => {
      const b = el.getBoundingClientRect();
      if (b.width && b.height && (b.width < 40 || b.height < 40))
        issues.push(`SMALL_TAP ${el.tagName} "${(el.textContent||'').trim().slice(0,20)}" ${Math.round(b.width)}x${Math.round(b.height)}`);
    });
    // buttons below fold on mobile (CTA unreachable without scroll is fine, but flag fixed elements cut off)
    document.querySelectorAll('[style*="fixed"], .drawer, .modal, [role="dialog"]').forEach(el => {
      const b = el.getBoundingClientRect();
      if (b.height && (b.bottom > vh + 4 || b.top < -4))
        issues.push(`MODAL_CLIPPED ${el.className||el.tagName} top=${Math.round(b.top)} bottom=${Math.round(b.bottom)} vh=${vh}`);
    });
    return { issues: [...new Set(issues)].slice(0, 25), sw };
  }, { vw: vp.w, vh: vp.h });
  out.push({ vp: vp.n, w: vp.w, issues: r.issues, consoleErrors: [...new Set(errs)].slice(0,5) });
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(out, null, 1));
