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
      "50ml": { sku: "MYTH-EDP-SP-50", volumeMl: 50, salePrice: 3199, mrp: 3999, stock: 50, mythosReward: 96 }
    },
    sizes: [
      { ml: 100, price: 5499, mrp: 6874, sku: "MYTH-EDP-SP-100", stock: 50 },
      { ml: 50, price: 3199, mrp: 3999, sku: "MYTH-EDP-SP-50", stock: 50 }
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
    price: 3999,
    salePrice: 3999,
    mrp: 4999,
    volumeMl: 48,
    variants: {
      "48ml": { sku: "MYTH-SET-6S-48", volumeMl: 48, salePrice: 3999, mrp: 4999, stock: 50, mythosReward: 150 }
    },
    sizes: [
      { ml: 48, price: 3999, mrp: 4999, sku: "MYTH-SET-6S-48", stock: 50 }
    ]
  }
];

export const VALID_PROMO_CODES = {
  'FIRST20': { type: 'percent', value: 20, maxDiscount: 10000 },
  'WELCOME20': { type: 'percent', value: 20, maxDiscount: 10000 },
  'MYTHOLIS10': { type: 'percent', value: 10, maxDiscount: 5000 },
  'LEGEND10': { type: 'percent', value: 10, minOrder: 1999, maxDiscount: 5000 },
  'VIP500': { type: 'flat', value: 500, maxDiscount: 500, minOrder: 2500 },
  'ROYAL500': { type: 'flat', value: 500, maxDiscount: 500, minOrder: 3999 },
  'MYTH-COFFRET-1000': { type: 'flat', value: 1000, maxDiscount: 1000 }
};

/**
 * Server-authoritative order total recalculation.
 * Resolves each cart item by matching:
 * 1. item.sku (e.g., MYTH-EDP-KS-100 vs MYTH-EDP-KS-50)
 * 2. item.id / item.slug + item.size (defaulting to "100ml" or "48ml")
 * 
 * @param {Array} items - List of items [{ id, sku, size, qty, quantity }]
 * @param {string} promoCode - Optional coupon code
 * @param {string|number} paymentMethodOrPoints - Payment method string ('UPI', 'Razorpay', 'COD') or Mythos points number
 * @param {number} optionalPoints - Optional Mythos points if paymentMethod was passed as arg 3
 * @returns {Object} { isValid, error, subtotal, discountAmount, finalAmountInRupees, finalTotal, amountInPaise, earnedMythos, validatedItems }
 */
export function calculateServerOrderTotal(items = [], promoCode = '', paymentMethodOrPoints = '', optionalPoints = 0) {
  let paymentMethod = '';
  let mythosPoints = 0;
  if (typeof paymentMethodOrPoints === 'number') {
    mythosPoints = paymentMethodOrPoints;
  } else if (typeof paymentMethodOrPoints === 'string') {
    paymentMethod = paymentMethodOrPoints;
    mythosPoints = Number(optionalPoints) || 0;
  }

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

    // 1. Try matching by exact variant SKU across catalog
    if (item.sku && typeof item.sku === 'string') {
      const cleanSku = item.sku.trim().toUpperCase();
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

    // 2. If no SKU match, match product by ID / slug
    if (!matchedProd) {
      const rawId = String(item.id || item.productId || item.slug || '').trim().toLowerCase();
      matchedProd = SERVER_CATALOG.find(p => 
        p.id === rawId || 
        (rawId === 'sixth-sense' && p.id === 'mytholis-discovery-set') ||
        (rawId === 'mytholis-discovery-set' && p.id === 'mytholis-discovery-set')
      );
    }

    // 3. Fallback to SKU prefix if ID was missing (e.g. "MYTH-EDP-KS-50")
    if (!matchedProd && item.sku && typeof item.sku === 'string') {
      const cleanSku = item.sku.trim().toUpperCase();
      if (cleanSku.includes('KS')) matchedProd = SERVER_CATALOG.find(p => p.id === 'king-scar');
      else if (cleanSku.includes('PX')) matchedProd = SERVER_CATALOG.find(p => p.id === 'petralux');
      else if (cleanSku.includes('OR')) matchedProd = SERVER_CATALOG.find(p => p.id === 'oud-rion');
      else if (cleanSku.includes('SP')) matchedProd = SERVER_CATALOG.find(p => p.id === 'spark');
      else if (cleanSku.includes('WS')) matchedProd = SERVER_CATALOG.find(p => p.id === 'wood-sera');
      else if (cleanSku.includes('AS')) matchedProd = SERVER_CATALOG.find(p => p.id === 'ash');
      else if (cleanSku.includes('6S') || cleanSku.includes('SET')) matchedProd = SERVER_CATALOG.find(p => p.id === 'mytholis-discovery-set');
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

    // 4. Resolve exact size variant if not already matched
    if (!matchedVariant) {
      const isCoffret = matchedProd.id === 'mytholis-discovery-set' || matchedProd.id === 'sixth-sense';
      let reqSize = item.size ? String(item.size).toLowerCase().replace('ml', '').trim() : '';
      if (!reqSize) {
        reqSize = isCoffret ? '48' : '100'; // Default is 100ml (or 48ml for Coffret)
      }

      const sizeKey = `${reqSize}ml`;
      if (matchedProd.variants && matchedProd.variants[sizeKey]) {
        matchedVariant = matchedProd.variants[sizeKey];
        matchedSize = matchedVariant.volumeMl;
      } else if (matchedProd.sizes) {
        const sObj = matchedProd.sizes.find(s => String(s.ml) === reqSize) || matchedProd.sizes[0];
        matchedVariant = {
          sku: sObj.sku || `${matchedProd.id}-${sObj.ml}`,
          volumeMl: sObj.ml,
          salePrice: sObj.price,
          mrp: sObj.mrp || Math.round(sObj.price * 1.25),
          stock: sObj.stock || 50
        };
        matchedSize = sObj.ml;
      } else {
        matchedVariant = {
          sku: matchedProd.sku,
          volumeMl: matchedProd.volumeMl || 100,
          salePrice: matchedProd.price,
          mrp: matchedProd.mrp || 7499,
          stock: 50
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

    const unitPrice = matchedVariant.salePrice;
    const itemTotal = unitPrice * qty;
    subtotal += itemTotal;

    validatedItems.push({
      id: matchedProd.id,
      slug: matchedProd.id,
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

  // 1. Calculate promo discount
  let promoDiscount = 0;
  let appliedPromoCode = null;
  const cleanCode = (promoCode || '').trim().toUpperCase();
  if (cleanCode) {
    if (cleanCode === 'FIRST20') {
      appliedPromoCode = 'FIRST20';
      promoDiscount = Math.floor(subtotal * 0.20);
    } else if (VALID_PROMO_CODES[cleanCode]) {
      const promo = VALID_PROMO_CODES[cleanCode];
      if (!promo.minOrder || subtotal >= promo.minOrder) {
        appliedPromoCode = cleanCode;
        if (promo.type === 'percent') {
          promoDiscount = Math.floor(subtotal * (promo.value / 100));
        } else if (promo.type === 'flat') {
          promoDiscount = promo.value;
        }
        if (promo.maxDiscount) {
          promoDiscount = Math.min(promoDiscount, promo.maxDiscount);
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

  // 3. Mythos Points Concession (Max 30% of remaining, capped at ₹2,500)
  let mythosDiscount = 0;
  const pointsClaimed = Math.max(0, Math.floor(Number(mythosPoints) || 0));
  if (pointsClaimed > 0) {
    const remainingAfterDiscounts = Math.max(0, subtotal - promoDiscount - upiDiscount);
    const maxConcession = Math.min(Math.floor(remainingAfterDiscounts * 0.30), 2500);
    mythosDiscount = Math.min(pointsClaimed, maxConcession);
  }

  const totalDiscount = Math.min(subtotal - 1, promoDiscount + upiDiscount + mythosDiscount);
  const finalAmountInRupees = Math.max(1, subtotal - totalDiscount);
  const amountInPaise = finalAmountInRupees * 100;
  const earnedMythos = Math.round(finalAmountInRupees * 0.03);

  return {
    isValid: true,
    subtotal,
    promoDiscount,
    upiDiscount,
    mythosDiscount,
    discountAmount: totalDiscount,
    totalDiscount,
    finalAmountInRupees,
    finalTotal: finalAmountInRupees,
    verifiedTotal: finalAmountInRupees,
    amountInPaise,
    earnedMythos,
    validatedPromoCode: appliedPromoCode,
    validatedItems
  };
}
