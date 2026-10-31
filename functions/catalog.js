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
    price: 5999,
    sizes: [
      { ml: 50, price: 3999 },
      { ml: 100, price: 5999 }
    ]
  },
  {
    id: "petralux",
    name: "Petralux Extrait de Parfum",
    price: 4999,
    sizes: [
      { ml: 50, price: 3299 },
      { ml: 100, price: 4999 }
    ]
  },
  {
    id: "oud-rion",
    name: "Oud Rion Extrait de Parfum",
    price: 6999,
    sizes: [
      { ml: 50, price: 4599 },
      { ml: 100, price: 6999 }
    ]
  },
  {
    id: "spark",
    name: "Spark Extrait de Parfum",
    price: 5499,
    sizes: [
      { ml: 50, price: 3699 },
      { ml: 100, price: 5499 }
    ]
  },
  {
    id: "wood-sera",
    name: "Wood Sera Extrait de Parfum",
    price: 4999,
    sizes: [
      { ml: 50, price: 3299 },
      { ml: 100, price: 4999 }
    ]
  },
  {
    id: "ash",
    name: "Ash Extrait de Parfum",
    price: 5999,
    sizes: [
      { ml: 50, price: 3999 },
      { ml: 100, price: 5999 }
    ]
  },
  {
    id: "mytholis-discovery-set",
    name: "Sixth Sense (Master Discovery Coffret)",
    price: 3999,
    sizes: [
      { ml: 48, price: 3999 }
    ]
  }
];

export const VALID_PROMO_CODES = {
  'FIRST20': { type: 'percent', value: 20, maxDiscount: 2500 },
  'MYTHOLIS10': { type: 'percent', value: 10, maxDiscount: 1500 },
  'VIP500': { type: 'flat', value: 500, maxDiscount: 500, minOrder: 2500 }
};

/**
 * Server-authoritative order total recalculation.
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
    // Resolve product ID from id, productId, or sku
    let prodId = item.id || item.productId;
    let requestedSize = Number(item.size || item.ml);

    if (!prodId && item.sku && typeof item.sku === 'string') {
      const lastHyphen = item.sku.lastIndexOf('-');
      if (lastHyphen !== -1) {
        prodId = item.sku.substring(0, lastHyphen);
        const parsedSize = Number(item.sku.substring(lastHyphen + 1));
        if (!isNaN(parsedSize) && !requestedSize) {
          requestedSize = parsedSize;
        }
      } else {
        prodId = item.sku;
      }
    }

    const catalogProd = SERVER_CATALOG.find(p => p.id === prodId);
    if (!catalogProd) {
      return {
        isValid: false,
        error: `Unknown catalog product: ${prodId || item.sku || 'unspecified'}`,
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

    const qty = Math.floor(Number(item.qty !== undefined ? item.qty : item.quantity));
    if (isNaN(qty) || qty < 1) {
      return {
        isValid: false,
        error: `Invalid quantity for ${catalogProd.name}: must be at least 1`,
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
        error: `Quantity exceeds maximum permissible limit for ${catalogProd.name}`,
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

    let unitPrice = catalogProd.price;
    let matchedSize = 100;

    if (catalogProd.sizes && catalogProd.sizes.length > 0) {
      const sizeObj = catalogProd.sizes.find(s => s.ml === requestedSize) || catalogProd.sizes[0];
      unitPrice = sizeObj.price;
      matchedSize = sizeObj.ml;
    }

    const itemTotal = unitPrice * qty;
    subtotal += itemTotal;

    validatedItems.push({
      id: catalogProd.id,
      sku: `${catalogProd.id}-${matchedSize}`,
      name: catalogProd.name,
      size: matchedSize,
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
  if (cleanCode && VALID_PROMO_CODES[cleanCode]) {
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

  // 2. UPI Discount (₹200 instant reduction for UPI payments on orders >= ₹2,000)
  let upiDiscount = 0;
  if (paymentMethod && typeof paymentMethod === 'string') {
    const pmLower = paymentMethod.toLowerCase();
    if ((pmLower.includes('upi') || pmLower.includes('prepaid')) && subtotal >= 2000) {
      upiDiscount = 200;
    }
  }

  // 3. Mythos Points Concession (Max 30% of remaining, capped at ₹2,500)
  let mythosDiscount = 0;
  const pointsClaimed = Math.max(0, Math.floor(Number(mythosPoints) || 0));
  if (pointsClaimed > 0) {
    const maxConcession = Math.min(Math.floor(subtotal * 0.30), 2500);
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
    amountInPaise,
    earnedMythos,
    validatedPromoCode: appliedPromoCode,
    validatedItems
  };
}
