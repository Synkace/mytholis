/**
 * MYTHOLIS SERVER-AUTHORITATIVE PRODUCT CATALOG & PRICING ENGINE
 * 
 * In accordance with AGENTS.md Rule 3:
 * Never trust prices, product costs, or discount values supplied by client requests.
 * All order totals and concessions are calculated against this official catalog.
 */

export const SERVER_CATALOG = [
  {
    id: "king-scar",
    name: "King Scar Extrait de Parfum",
    sku: "MYTH-EDP-KS-100",
    defaultSize: "100ml",
    price: 5999,
    salePrice: 5999,
    mrp: 7499,
    volumeMl: 100,
    variants: {
      "100ml": { sku: "MYTH-EDP-KS-100", volumeMl: 100, salePrice: 5999, mrp: 7499, stock: 50, mythosReward: 180 },
      "50ml": { sku: "MYTH-EDP-KS-50", volumeMl: 50, salePrice: 3499, mrp: 4399, stock: 50, mythosReward: 105 }
    },
    sizes: [
      { ml: 100, price: 5999, mrp: 7499, sku: "MYTH-EDP-KS-100", stock: 50 },
      { ml: 50, price: 3499, mrp: 4399, sku: "MYTH-EDP-KS-50", stock: 50 }
    ]
  },
  {
    id: "petralux",
    name: "Petralux Extrait de Parfum",
    sku: "MYTH-EDP-PX-100",
    defaultSize: "100ml",
    price: 4999,
    salePrice: 4999,
    mrp: 6249,
    volumeMl: 100,
    variants: {
      "100ml": { sku: "MYTH-EDP-PX-100", volumeMl: 100, salePrice: 4999, mrp: 6249, stock: 50, mythosReward: 150 },
      "50ml": { sku: "MYTH-EDP-PX-50", volumeMl: 50, salePrice: 2799, mrp: 3499, stock: 50, mythosReward: 84 }
    },
    sizes: [
      { ml: 100, price: 4999, mrp: 6249, sku: "MYTH-EDP-PX-100", stock: 50 },
      { ml: 50, price: 2799, mrp: 3499, sku: "MYTH-EDP-PX-50", stock: 50 }
    ]
  },
  {
    id: "oud-rion",
    name: "Oud Rion Extrait de Parfum",
    sku: "MYTH-EDP-OR-100",
    defaultSize: "100ml",
    price: 6999,
    salePrice: 6999,
    mrp: 8749,
    volumeMl: 100,
    variants: {
      "100ml": { sku: "MYTH-EDP-OR-100", volumeMl: 100, salePrice: 6999, mrp: 8749, stock: 50, mythosReward: 210 },
      "50ml": { sku: "MYTH-EDP-OR-50", volumeMl: 50, salePrice: 4099, mrp: 5149, stock: 50, mythosReward: 123 }
    },
    sizes: [
      { ml: 100, price: 6999, mrp: 8749, sku: "MYTH-EDP-OR-100", stock: 50 },
      { ml: 50, price: 4099, mrp: 5149, sku: "MYTH-EDP-OR-50", stock: 50 }
    ]
  },
  {
    id: "spark",
    name: "Spark Extrait de Parfum",
    sku: "MYTH-EDP-SP-100",
    defaultSize: "100ml",
    price: 5499,
    salePrice: 5499,
    mrp: 6874,
    volumeMl: 100,
    variants: {
      "100ml": { sku: "MYTH-EDP-SP-100", volumeMl: 100, salePrice: 5499, mrp: 6874, stock: 50, mythosReward: 165 },
      "50ml": { sku: "MYTH-EDP-SP-50", volumeMl: 50, salePrice: 3199, mrp: 2999, stock: 50, mythosReward: 96 }
    },
    sizes: [
      { ml: 100, price: 5499, mrp: 6874, sku: "MYTH-EDP-SP-100", stock: 50 },
      { ml: 50, price: 3199, mrp: 2999, sku: "MYTH-EDP-SP-50", stock: 50 }
    ]
  },
  {
    id: "wood-sera",
    name: "Wood Sera Extrait de Parfum",
    sku: "MYTH-EDP-WS-100",
    defaultSize: "100ml",
    price: 4999,
    salePrice: 4999,
    mrp: 6249,
    volumeMl: 100,
    variants: {
      "100ml": { sku: "MYTH-EDP-WS-100", volumeMl: 100, salePrice: 4999, mrp: 6249, stock: 50, mythosReward: 150 },
      "50ml": { sku: "MYTH-EDP-WS-50", volumeMl: 50, salePrice: 2799, mrp: 3499, stock: 50, mythosReward: 84 }
    },
    sizes: [
      { ml: 100, price: 4999, mrp: 6249, sku: "MYTH-EDP-WS-100", stock: 50 },
      { ml: 50, price: 2799, mrp: 3499, sku: "MYTH-EDP-WS-50", stock: 50 }
    ]
  },
  {
    id: "ash",
    name: "Ash Extrait de Parfum",
    sku: "MYTH-EDP-AS-100",
    defaultSize: "100ml",
    price: 5999,
    salePrice: 5999,
    mrp: 7499,
    volumeMl: 100,
    variants: {
      "100ml": { sku: "MYTH-EDP-AS-100", volumeMl: 100, salePrice: 5999, mrp: 7499, stock: 50, mythosReward: 180 },
      "50ml": { sku: "MYTH-EDP-AS-50", volumeMl: 50, salePrice: 3499, mrp: 4399, stock: 50, mythosReward: 105 }
    },
    sizes: [
      { ml: 100, price: 5999, mrp: 7499, sku: "MYTH-EDP-AS-100", stock: 50 },
      { ml: 50, price: 3499, mrp: 4399, sku: "MYTH-EDP-AS-50", stock: 50 }
    ]
  },
  {
    id: "mytholis-discovery-set",
    name: "Sixth Sense (Master Discovery Coffret)",
    sku: "MYTH-SET-6S-48",
    defaultSize: "48ml",
    price: 2999,
    salePrice: 2999,
    mrp: 4999,
    volumeMl: 48,
    variants: {
      "48ml": { sku: "MYTH-SET-6S-48", volumeMl: 48, salePrice: 2999, mrp: 4999, stock: 50, mythosReward: 150 }
    },
    sizes: [
      { ml: 48, price: 2999, mrp: 4999, sku: "MYTH-SET-6S-48", stock: 50 }
    ]
  }
];

/**
 * Promo codes that are honoured even if they are not defined in
 * settings/global.promoCodes. Anything defined in settings wins over this table.
 *
 * FIRST25 is the first-order privilege: 25% off, capped at ₹5,000, never on the
 * Sixth Sense coffret, and only for a collector with no prior PAID order.
 * Eligibility is decided server-side (see isFirstOrderEligible below) - never by
 * the browser.
 */
export const VALID_PROMO_CODES = {
  'FIRST25': { type: 'percent', value: 25, maxDiscount: 5000, firstOrderOnly: true },
  'MYTHOLIS10': { type: 'percent', value: 10, maxDiscount: 5000 },
  'LEGEND10': { type: 'percent', value: 10, minOrder: 1999, maxDiscount: 5000 },
  'VIP500': { type: 'flat', value: 500, maxDiscount: 500, minOrder: 2500 },
  'ROYAL500': { type: 'flat', value: 500, maxDiscount: 500, minOrder: 2999 },
  'MYTH-COFFRET-1000': { type: 'flat', value: 1000, maxDiscount: 1000 }
};

/**
 * First-order eligibility, decided from the order ledger.
 * A guest is judged on the email/phone attached to the order. This is a
 * heuristic - a determined guest can rotate addresses - but it stops the old
 * behaviour, where everyone got the discount forever.
 */
export async function isFirstOrderEligible(adminDb, { uid = null, email = null, phone = null } = {}) {
  if (!adminDb) return false;

  const isPaid = (data) => /paid|captured/i.test(String(data?.paymentStatus || ''));

  try {
    if (uid && !String(uid).startsWith('guest')) {
      const snap = await adminDb.collection('orders').where('userId', '==', uid).limit(10).get();
      return !snap.docs.some((d) => isPaid(d.data()));
    }

    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPhone = String(phone || '').replace(/\D/g, '').slice(-10);

    if (cleanEmail) {
      const snap = await adminDb.collection('orders').where('userEmail', '==', cleanEmail).limit(10).get();
      if (snap.docs.some((d) => isPaid(d.data()))) return false;
    }
    if (cleanPhone.length === 10) {
      const snap = await adminDb.collection('orders').where('customerPhone', '==', cleanPhone).limit(10).get();
      if (snap.docs.some((d) => isPaid(d.data()))) return false;
    }

    return true;
  } catch (err) {
    console.warn('[Catalog] First-order check failed, defaulting to NOT eligible:', err.message);
    return false;
  }
}

/**
 * Server-authoritative order total recalculation.
 * Resolves each cart item by matching:
 * 1. Live Firestore product documents if available in options.firestoreProducts
 * 2. Fallback to SERVER_CATALOG only if Firestore product is missing
 * 3. Exact variant SKU / size (100ml default vs 50ml, or 48ml for Sixth Sense)
 * 4. Authoritative settings from Firestore settings/global or settings/public_config
 * 5. Dynamic single-use vouchers from Firestore vouchers/{code}
 * 
 * @param {Array} items - List of items [{ id, sku, size, qty, quantity }]
 * @param {string} promoCode - Optional coupon code
 * @param {string|number} paymentMethodOrPoints - Payment method string ('UPI', 'Razorpay', 'COD') or Mythos points number
 * @param {number} optionalPoints - Optional Mythos points if paymentMethod was passed as arg 3
 * @param {Object} options - { firestoreProducts, settings, voucherDoc }
 * @returns {Object} { isValid, error, subtotal, discountAmount, finalAmountInRupees, finalTotal, amountInPaise, earnedMythos, validatedItems }
 */
export function calculateServerOrderTotal(items = [], promoCode = '', paymentMethodOrPoints = '', optionalPoints = 0, options = {}) {
  let paymentMethod = '';
  let mythosPoints = 0;
  if (typeof paymentMethodOrPoints === 'number') {
    mythosPoints = paymentMethodOrPoints;
  } else if (typeof paymentMethodOrPoints === 'string') {
    paymentMethod = paymentMethodOrPoints;
    mythosPoints = Number(optionalPoints) || 0;
  }

  const {
    firestoreProducts = [],
    settings = {},
    voucherDoc = null,
    isFirstOrder = false
  } = options || {};

  const liveProductList = Array.isArray(firestoreProducts)
    ? firestoreProducts
    : (firestoreProducts && typeof firestoreProducts === 'object' ? Object.values(firestoreProducts) : []);

  if (!Array.isArray(items) || items.length === 0) {
    return {
      isValid: false,
      error: 'Cart items array is required',
      subtotal: 0,
      discountAmount: 0,
      totalDiscount: 0,
      finalAmountInRupees: 0,
      finalTotal: 0,
      amountInPaise: 0,
      earnedMythos: 0,
      validatedItems: []
    };
  }

  let subtotal = 0;
  const validatedItems = [];

  for (const item of items) {
    let matchedProd = null;
    let matchedVariant = null;
    let matchedSize = 100;

    const rawId = String(item.id || item.productId || item.slug || '').trim().toLowerCase();
    const cleanSku = item.sku && typeof item.sku === 'string' ? item.sku.trim().toUpperCase() : '';

    // Step A: Search in live Firestore products first
    if (liveProductList.length > 0) {
      // 1. Match by SKU in variants or sizes
      if (cleanSku) {
        for (const prod of liveProductList) {
          if (prod.variants && typeof prod.variants === 'object') {
            for (const v of Object.values(prod.variants)) {
              if (v && v.sku && v.sku.toUpperCase() === cleanSku) {
                matchedProd = prod;
                matchedVariant = v;
                matchedSize = v.volumeMl || v.volume || 100;
                break;
              }
            }
          }
          if (!matchedProd && Array.isArray(prod.sizes)) {
            const sMatch = prod.sizes.find(s => s.sku && s.sku.toUpperCase() === cleanSku);
            if (sMatch) {
              matchedProd = prod;
              matchedVariant = {
                sku: sMatch.sku,
                volumeMl: sMatch.ml,
                salePrice: sMatch.price,
                mrp: sMatch.mrp || Math.round(sMatch.price * 1.25),
                stock: sMatch.stock !== undefined ? sMatch.stock : (prod.stock !== undefined ? prod.stock : 50)
              };
              matchedSize = sMatch.ml;
              break;
            }
          }
          if (matchedProd) break;
        }
      }

      // 2. Match by Product ID / Slug
      if (!matchedProd && rawId) {
        matchedProd = liveProductList.find(p => {
          const pid = String(p.id || '').trim().toLowerCase();
          const pslug = String(p.slug || '').trim().toLowerCase();
          return pid === rawId || pslug === rawId ||
            ((rawId === 'sixth-sense' || rawId === 'mytholis-discovery-set') && (pid === 'mytholis-discovery-set' || pslug === 'sixth-sense'));
        });
      }
    }

    // Step B: Fall back to SERVER_CATALOG ONLY if Firestore document was missing
    if (!matchedProd) {
      // 1. Match by SKU across SERVER_CATALOG
      if (cleanSku) {
        for (const prod of SERVER_CATALOG) {
          if (prod.variants) {
            for (const [sKey, v] of Object.entries(prod.variants)) {
              if (v.sku && v.sku.toUpperCase() === cleanSku) {
                matchedProd = prod;
                matchedVariant = v;
                matchedSize = v.volumeMl;
                break;
              }
            }
          }
          if (matchedProd) break;
        }
      }

      // 2. Match by ID / slug
      if (!matchedProd && rawId) {
        matchedProd = SERVER_CATALOG.find(p => 
          p.id === rawId || 
          (rawId === 'sixth-sense' && p.id === 'mytholis-discovery-set') ||
          (rawId === 'mytholis-discovery-set' && p.id === 'mytholis-discovery-set')
        );
      }

      // 3. Fallback to SKU prefix
      if (!matchedProd && cleanSku) {
        if (cleanSku.includes('KS')) matchedProd = SERVER_CATALOG.find(p => p.id === 'king-scar');
        else if (cleanSku.includes('PX')) matchedProd = SERVER_CATALOG.find(p => p.id === 'petralux');
        else if (cleanSku.includes('OR')) matchedProd = SERVER_CATALOG.find(p => p.id === 'oud-rion');
        else if (cleanSku.includes('SP')) matchedProd = SERVER_CATALOG.find(p => p.id === 'spark');
        else if (cleanSku.includes('WS')) matchedProd = SERVER_CATALOG.find(p => p.id === 'wood-sera');
        else if (cleanSku.includes('AS')) matchedProd = SERVER_CATALOG.find(p => p.id === 'ash');
        else if (cleanSku.includes('6S') || cleanSku.includes('SET')) matchedProd = SERVER_CATALOG.find(p => p.id === 'mytholis-discovery-set');
      }
    }

    if (!matchedProd) {
      return {
        isValid: false,
        error: `Unknown catalog product: ${item.id || item.sku || 'unspecified'}`,
        subtotal: 0,
        discountAmount: 0,
        totalDiscount: 0,
        finalAmountInRupees: 0,
        finalTotal: 0,
        amountInPaise: 0,
        earnedMythos: 0,
        validatedItems: []
      };
    }

    // Check product stock & availability
    if (matchedProd.inStock === false) {
      return {
        isValid: false,
        error: `${matchedProd.name || 'Selected product'} is currently marked out of stock.`,
        subtotal: 0,
        discountAmount: 0,
        totalDiscount: 0,
        finalAmountInRupees: 0,
        finalTotal: 0,
        amountInPaise: 0,
        earnedMythos: 0,
        validatedItems: []
      };
    }

    // Step C: Resolve exact variant price and volume
    const isCoffret = matchedProd.id === 'mytholis-discovery-set' || matchedProd.id === 'sixth-sense';
    let reqSize = item.size ? String(item.size).toLowerCase().replace('ml', '').trim() : '';
    if (!reqSize) {
      reqSize = isCoffret ? '48' : '100'; // Default is 100ml (or 48ml for Coffret)
    }

    if (!matchedVariant) {
      const sizeKey = `${reqSize}ml`;
      if (matchedProd.variants && matchedProd.variants[sizeKey]) {
        const v = matchedProd.variants[sizeKey];
        matchedVariant = {
          sku: v.sku || `${matchedProd.id}-${reqSize}`,
          volumeMl: Number(v.volumeMl || v.volume || reqSize),
          salePrice: Number(v.salePrice !== undefined ? v.salePrice : (v.price !== undefined ? v.price : matchedProd.price)),
          mrp: Number(v.mrp || Math.round((v.salePrice || v.price || matchedProd.price) * 1.25)),
          stock: v.stock !== undefined ? Number(v.stock) : (matchedProd.stock !== undefined ? Number(matchedProd.stock) : 50)
        };
        matchedSize = matchedVariant.volumeMl;
      } else if (Array.isArray(matchedProd.sizes) && matchedProd.sizes.length > 0) {
        const sObj = matchedProd.sizes.find(s => String(s.ml) === reqSize) || matchedProd.sizes[0];
        const sPrice = Number(sObj.price !== undefined ? sObj.price : (sObj.salePrice !== undefined ? sObj.salePrice : matchedProd.price));
        matchedVariant = {
          sku: sObj.sku || `${matchedProd.id}-${sObj.ml}`,
          volumeMl: Number(sObj.ml || reqSize),
          salePrice: sPrice,
          mrp: Number(sObj.mrp || Math.round(sPrice * 1.25)),
          stock: sObj.stock !== undefined ? Number(sObj.stock) : (matchedProd.stock !== undefined ? Number(matchedProd.stock) : 50)
        };
        matchedSize = sObj.ml;
      } else {
        const basePrice = Number(matchedProd.salePrice !== undefined ? matchedProd.salePrice : (matchedProd.price || 5999));
        matchedVariant = {
          sku: matchedProd.sku || `${matchedProd.id}-${reqSize}`,
          volumeMl: Number(matchedProd.volumeMl || matchedProd.volume || (isCoffret ? 48 : 100)),
          salePrice: basePrice,
          mrp: Number(matchedProd.mrp || Math.round(basePrice * 1.25)),
          stock: matchedProd.stock !== undefined ? Number(matchedProd.stock) : 50
        };
        matchedSize = matchedVariant.volumeMl;
      }
    }

    const qty = Math.floor(Number(item.qty !== undefined ? item.qty : item.quantity));
    if (isNaN(qty) || qty < 1) {
      return {
        isValid: false,
        error: `Invalid quantity for ${matchedProd.name}: must be at least 1`,
        subtotal: 0,
        discountAmount: 0,
        totalDiscount: 0,
        finalAmountInRupees: 0,
        finalTotal: 0,
        amountInPaise: 0,
        earnedMythos: 0,
        validatedItems: []
      };
    }

    if (qty > 50) {
      return {
        isValid: false,
        error: `Quantity exceeds maximum permissible limit for ${matchedProd.name}`,
        subtotal: 0,
        discountAmount: 0,
        totalDiscount: 0,
        finalAmountInRupees: 0,
        finalTotal: 0,
        amountInPaise: 0,
        earnedMythos: 0,
        validatedItems: []
      };
    }

    // Verify stock availability
    if (matchedVariant.stock !== undefined && matchedVariant.stock < qty && matchedVariant.stock >= 0) {
      return {
        isValid: false,
        error: `Insufficient stock for ${matchedProd.name} (${matchedSize}ml). Available: ${matchedVariant.stock}`,
        subtotal: 0,
        discountAmount: 0,
        totalDiscount: 0,
        finalAmountInRupees: 0,
        finalTotal: 0,
        amountInPaise: 0,
        earnedMythos: 0,
        validatedItems: []
      };
    }

    const unitPrice = matchedVariant.salePrice;
    const itemTotal = unitPrice * qty;
    subtotal += itemTotal;

    validatedItems.push({
      id: matchedProd.id,
      slug: matchedProd.slug || matchedProd.id,
      sku: matchedVariant.sku,
      name: matchedProd.name,
      size: matchedSize,
      sizeLabel: `${matchedSize}ml`,
      quantity: qty,
      qty: qty,
      unitPrice,
      total: itemTotal
    });
  }

  // 1. Dynamic Promo & Voucher Discount (Firestore settings & vouchers as primary source)
  let promoDiscount = 0;
  let appliedPromoCode = null;
  const cleanCode = (promoCode || '').trim().toUpperCase();

  if (cleanCode) {
    let promoRule = null;

    // Check A: Dynamic promoCodes array from Firestore settings/global or settings/public_config
    if (settings && Array.isArray(settings.promoCodes)) {
      const matchInSettings = settings.promoCodes.find(p => p.code && p.code.trim().toUpperCase() === cleanCode);
      if (matchInSettings) {
        if (matchInSettings.active !== false) {
          promoRule = {
            type: matchInSettings.discountType || matchInSettings.type || 'percent',
            value: Number(matchInSettings.value !== undefined ? matchInSettings.value : matchInSettings.amount) || 0,
            minOrder: Number(matchInSettings.minOrder || 0),
            maxDiscount: matchInSettings.maxDiscount ? Number(matchInSettings.maxDiscount) : 10000
          };
        } else {
          // Explicitly deactivated or removed promo code in settings
          promoRule = 'DEACTIVATED';
        }
      }
    }

    // Check B: Dynamic single-use voucher document from Firestore (vouchers/{code} or reward_codes/{code})
    if (!promoRule && voucherDoc && typeof voucherDoc === 'object') {
      const vCode = String(voucherDoc.code || voucherDoc.id || '').trim().toUpperCase();
      if (vCode === cleanCode) {
        const isVoucherActive = voucherDoc.active !== false && !voucherDoc.used && !voucherDoc.isRedeemed;
        if (isVoucherActive) {
          promoRule = {
            type: voucherDoc.type || voucherDoc.discountType || 'flat',
            value: Number(voucherDoc.value !== undefined ? voucherDoc.value : voucherDoc.amount) || 0,
            minOrder: Number(voucherDoc.minOrder || 0),
            maxDiscount: voucherDoc.maxDiscount ? Number(voucherDoc.maxDiscount) : 10000
          };
        } else {
          promoRule = 'DEACTIVATED';
        }
      }
    }

    // Check C: Fallback to VALID_PROMO_CODES if not explicitly configured/deactivated in settings
    if (!promoRule && VALID_PROMO_CODES[cleanCode]) {
      promoRule = VALID_PROMO_CODES[cleanCode];
    }

    /* FIRST25 invariants are enforced regardless of where the rule came from.
       A settings document (or an admin edit) can change the percentage, but it
       can never remove the eligibility gate or raise the cap. */
    if (cleanCode === 'FIRST25' && promoRule && promoRule !== 'DEACTIVATED') {
      promoRule = {
        ...promoRule,
        firstOrderOnly: true,
        maxDiscount: Math.min(Number(promoRule.maxDiscount) || 5000, 5000)
      };
    }

    // Apply promo rule if valid and active
    if (promoRule && promoRule !== 'DEACTIVATED') {
      if (!promoRule.minOrder || subtotal >= promoRule.minOrder) {
        /* First-order privilege: only for a collector with no prior paid order,
           and never on the Discovery Coffret (it is already a set price). */
        const cartIds = validatedItems.map((i) => String(i.id));
        const containsExcluded = Array.isArray(promoRule.excludeProductIds) &&
          promoRule.excludeProductIds.some((id) => cartIds.includes(String(id)));
        const blockedByEligibility = promoRule.firstOrderOnly === true && isFirstOrder !== true;

        if (!containsExcluded && !blockedByEligibility) {
          appliedPromoCode = cleanCode;
          if (promoRule.type === 'percent') {
            promoDiscount = Math.floor(subtotal * (promoRule.value / 100));
          } else if (promoRule.type === 'flat' || promoRule.type === 'discount' || promoRule.type === 'fixed') {
            promoDiscount = promoRule.value;
          }
          if (promoRule.maxDiscount) {
            promoDiscount = Math.min(promoDiscount, promoRule.maxDiscount);
          }
        } else {
          console.log(`[Catalog] Promo ${cleanCode} not applied (excludedItem=${containsExcluded}, firstOrder=${isFirstOrder})`);
        }
      }
    }
  }

  // 2. UPI Discount (₹200 instant reduction for UPI payments on orders >= ₹2,000, active only when no promo code discount is applied)
  let upiDiscount = 0;
  if (!promoDiscount && paymentMethod && typeof paymentMethod === 'string') {
    const pmLower = paymentMethod.toLowerCase();
    if ((pmLower.includes('upi') || pmLower.includes('prepaid') || pmLower.includes('gpay') || pmLower.includes('google pay') || pmLower.includes('phonepe') || pmLower.includes('paytm')) && subtotal >= 2000) {
      upiDiscount = 200;
    }
  }

  // 3. Mythos Points Concession (Max % configured in settings, capped at ₹2,500)
  let mythosDiscount = 0;
  const pointsClaimed = Math.max(0, Math.floor(Number(mythosPoints) || 0));
  const maxRedemptionPct = (settings.maxMythosRedemptionPct !== undefined && !isNaN(Number(settings.maxMythosRedemptionPct)))
    ? Number(settings.maxMythosRedemptionPct) / 100
    : 0.30;
  if (pointsClaimed > 0) {
    const remainingAfterDiscounts = Math.max(0, subtotal - promoDiscount - upiDiscount);
    const maxConcession = Math.min(Math.floor(remainingAfterDiscounts * maxRedemptionPct), 2500);
    mythosDiscount = Math.min(pointsClaimed, maxConcession);
  }

  // 4. Free shipping threshold & standard shipping fee from settings
  const freeShippingThreshold = (settings.freeShippingThreshold !== undefined && !isNaN(Number(settings.freeShippingThreshold)))
    ? Number(settings.freeShippingThreshold)
    : 3000;
  const standardShippingFee = (settings.standardShippingFee !== undefined && !isNaN(Number(settings.standardShippingFee)))
    ? Number(settings.standardShippingFee)
    : 150;
  let shippingFee = 0;
  if (subtotal > 0 && subtotal < freeShippingThreshold && standardShippingFee > 0) {
    shippingFee = standardShippingFee;
  }

  // 5. COD Validation & Fee
  const isCOD = paymentMethod && typeof paymentMethod === 'string' && (paymentMethod.toLowerCase().includes('cod') || paymentMethod.toLowerCase().includes('cash on delivery'));
  let codFee = 0;
  if (isCOD) {
    if (settings.codEnabled === false) {
      return {
        isValid: false,
        error: 'Cash on Delivery (COD) is currently unavailable.',
        subtotal,
        discountAmount: 0,
        totalDiscount: 0,
        finalAmountInRupees: 0,
        finalTotal: 0,
        amountInPaise: 0,
        earnedMythos: 0,
        validatedItems: []
      };
    }
    const maxCod = Number(settings.maxCodAmount) || 15000;
    if (subtotal > maxCod) {
      return {
        isValid: false,
        error: `Cash on Delivery is only available for orders up to ₹${maxCod.toLocaleString('en-IN')}.`,
        subtotal,
        discountAmount: 0,
        totalDiscount: 0,
        finalAmountInRupees: 0,
        finalTotal: 0,
        amountInPaise: 0,
        earnedMythos: 0,
        validatedItems: []
      };
    }
    codFee = Number(settings.codFee) || 0;
  }

  const totalDiscount = Math.min(subtotal - 1, promoDiscount + upiDiscount + mythosDiscount);
  const finalAmountInRupees = Math.max(1, subtotal - totalDiscount + shippingFee + codFee);
  const amountInPaise = finalAmountInRupees * 100;

  /* 5b. PARTIAL COD (the only deferred-payment option).
     25% of the final payable is collected online, the balance on delivery.
     A ₹499 floor guarantees the deposit always covers forward + return
     freight, which is the whole point of taking it.
     The deposit is computed AFTER discounts and shipping, so the customer's
     total outlay never changes - only WHEN they pay it. */
  const PARTIAL_COD_PCT = 0.25;
  const PARTIAL_COD_FLOOR = 499;

  const depositInRupees = isCOD
    ? Math.min(finalAmountInRupees, Math.max(PARTIAL_COD_FLOOR, Math.ceil(finalAmountInRupees * PARTIAL_COD_PCT)))
    : finalAmountInRupees;
  const balanceDueInRupees = isCOD ? Math.max(0, finalAmountInRupees - depositInRupees) : 0;
  const chargeInPaise = depositInRupees * 100;

  // 6. Mythos Earned Pct from settings (default 0.03 = 3%)
  const mythosEarnPct = (settings.mythosEarnPct !== undefined && !isNaN(Number(settings.mythosEarnPct)))
    ? (Number(settings.mythosEarnPct) > 1 ? Number(settings.mythosEarnPct) / 100 : Number(settings.mythosEarnPct))
    : 0.03;
  const earnedMythos = Math.round(finalAmountInRupees * mythosEarnPct);

  return {
    isValid: true,
    subtotal,
    promoDiscount,
    upiDiscount,
    mythosDiscount,
    shippingFee,
    codFee,
    discountAmount: totalDiscount,
    totalDiscount,
    finalAmountInRupees,
    finalTotal: finalAmountInRupees,
    verifiedTotal: finalAmountInRupees,
    amountInPaise,
    // Deferred payment: the gateway charges only the deposit.
    isPartialCod: isCOD,
    depositInRupees,
    balanceDueInRupees,
    chargeInPaise,
    earnedMythos,
    validatedPromoCode: appliedPromoCode,
    validatedItems
  };
}

