import { logEvent } from 'firebase/analytics';
import { analytics } from './firebase.js';

const ENABLED =
  import.meta.env.PROD || import.meta.env.VITE_ANALYTICS_DEBUG === 'true';

function send(name, params) {
  if (!ENABLED || !analytics) return;
  try { logEvent(analytics, name, params); } catch {}
}

function item(p) {
  return {
    item_id: p.sku,
    item_name: p.name,
    item_category: p.category || 'Extrait de Parfum',
    price: Number(p.price) || 0,
    quantity: Number(p.quantity) || 1,
  };
}

export const track = {
  viewItem(product, variant, price) {
    send('view_item', {
      currency: 'INR',
      value: Number(price) || 0,
      items: [item({ sku: variant.sku, name: `${product.name} ${variant.size}`, price })],
    });
  },
  addToCart(product, variant, price, quantity = 1) {
    send('add_to_cart', {
      currency: 'INR',
      value: Number(price) * quantity,
      items: [item({ sku: variant.sku, name: `${product.name} ${variant.size}`, price, quantity })],
    });
  },
  beginCheckout(cartLines, total) {
    send('begin_checkout', {
      currency: 'INR',
      value: Number(total) || 0,
      items: cartLines.map(l => item({
        sku: l.sku, name: l.name, price: l.unitPrice, quantity: l.qty,
      })),
    });
  },
  purchase(order) {
    const key = `ga_purchase_${order.orderNumber}`;
    try { if (sessionStorage.getItem(key)) return; } catch {}
    send('purchase', {
      transaction_id: order.orderNumber,
      currency: 'INR',
      value: Number(order.total) || 0,
      shipping: Number(order.shippingFee) || 0,
      tax: 0,
      items: (order.items || []).map(l => item({
        sku: l.sku, name: l.name, price: l.unitPrice, quantity: l.qty,
      })),
    });
    try { sessionStorage.setItem(key, '1'); } catch {}
  },
};
