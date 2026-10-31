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
 * @param {Array} items - List of items [{ id, productId, size, quantity }]
 * @param {string} promoCode - Optional coupon code
 * @param {number} mythosPoints - Optional Mythos points claimed for concession
 * @returns {Object} { subtotal, discount, mythosDiscount, finalTotal, validatedItems }
 */
export function calculateServerOrderTotal(items = [], promoCode = '', mythosPoints = 0) {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      subtotal: 0,
      discount: 0,
      mythosDiscount: 0,
      finalTotal: 0,
      validatedItems: []
    };
  }

  let subtotal = 0;
  const validatedItems = [];

  for (const item of items) {
    const prodId = item.id || item.productId;
    const catalogProd = SERVER_CATALOG.find(p => p.id === prodId);

    if (!catalogProd) {
      continue;
    }

    const qty = Math.max(1, Math.min(20, Math.floor(Number(item.quantity || item.qty || 1))));
    const requestedSize = Number(item.size || item.ml);

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
      name: catalogProd.name,
      size: matchedSize,
      quantity: qty,
      unitPrice,
      total: itemTotal
    });
  }

  if (subtotal === 0) {
    return { subtotal: 0, discount: 0, mythosDiscount: 0, finalTotal: 0, validatedItems: [] };
  }

  // 1. Calculate server-validated promo discount
  let promoDiscount = 0;
  const cleanCode = (promoCode || '').trim().toUpperCase();
  if (cleanCode && VALID_PROMO_CODES[cleanCode]) {
    const promo = VALID_PROMO_CODES[cleanCode];
    if (!promo.minOrder || subtotal >= promo.minOrder) {
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

  // 2. Calculate server-validated Mythos concession (Max 30% of remaining or ₹2,500)
  let mythosDiscount = 0;
  const pointsClaimed = Math.max(0, Math.floor(Number(mythosPoints) || 0));
  if (pointsClaimed > 0) {
    const maxConcession = Math.min(Math.floor(subtotal * 0.30), 2500);
    mythosDiscount = Math.min(pointsClaimed, maxConcession);
  }

  // Final payable (minimum ₹1 / 100 paise)
  const totalDiscount = promoDiscount + mythosDiscount;
  const finalTotal = Math.max(1, subtotal - totalDiscount);

  return {
    subtotal,
    promoDiscount,
    mythosDiscount,
    totalDiscount,
    finalTotal,
    validatedItems
  };
}
