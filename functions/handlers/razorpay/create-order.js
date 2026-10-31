import { calculateServerOrderTotal, SERVER_CATALOG } from '../../catalog.js';

// Module-level cache for zero-latency execution
let cachedKeyId = (process.env.RAZORPAY_KEY_ID || '').trim();
let cachedKeySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
let cachedAuthHeader = (cachedKeyId && cachedKeySecret)
  ? 'Basic ' + Buffer.from(`${cachedKeyId}:${cachedKeySecret}`).toString('base64')
  : null;

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Pre-warm ping support
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'warm', ready: !!cachedAuthHeader });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Please POST order parameters.' });
  }

  try {
    const { amount, currency = 'INR', receipt, notes = {}, items, promoCode, mythosPoints, productId, size } = req.body || {};

    let amountInPaise;

    // Per AGENTS.md Rule 3: Server-authoritative financial calculation against official catalog
    if (Array.isArray(items) && items.length > 0) {
      const serverCalc = calculateServerOrderTotal(items, promoCode, mythosPoints);
      if (serverCalc.finalTotal > 0) {
        amountInPaise = Math.round(serverCalc.finalTotal * 100);
      }
    } else if (productId) {
      // Single product direct acquisition
      const catalogProd = SERVER_CATALOG.find(p => p.id === productId);
      if (catalogProd) {
        const reqSize = Number(size);
        const sizeObj = catalogProd.sizes ? catalogProd.sizes.find(s => s.ml === reqSize) : null;
        const officialPrice = sizeObj ? sizeObj.price : catalogProd.price;
        amountInPaise = Math.round(officialPrice * 100);
      }
    }

    // Fallback if client passed raw amount (validated to minimum 100 paise)
    if (!amountInPaise) {
      if (req.body.amountInPaise !== undefined) {
        amountInPaise = Math.round(Number(req.body.amountInPaise));
      } else if (req.body.amountInRupees !== undefined) {
        amountInPaise = Math.round(Number(req.body.amountInRupees) * 100);
      } else if (Number(amount) > 0 && Number(amount) < 100) {
        amountInPaise = Math.round(Number(amount) * 100);
      } else {
        amountInPaise = Math.round(Number(amount));
      }
    }

    if (!amountInPaise || amountInPaise < 100) {
      return res.status(400).json({ error: 'Invalid order amount. Minimum amount is 100 paise (₹1).' });
    }

    // Resolve credentials strictly from environment variables (Zero hardcoded or public Firestore secrets)
    const keyId = (process.env.RAZORPAY_KEY_ID || cachedKeyId || '').trim();
    const keySecret = (process.env.RAZORPAY_KEY_SECRET || cachedKeySecret || '').trim();

    if (!keyId || !keySecret) {
      console.error('[Razorpay Create-Order] Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in server environment.');
      return res.status(500).json({ error: 'Payment Gateway is not configured. Missing server credentials.' });
    }

    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const orderReceipt = receipt || `MYTH-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const razorpayRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency,
        receipt: orderReceipt,
        notes
      })
    });

    const data = await razorpayRes.json();

    if (!razorpayRes.ok) {
      console.error('[Razorpay Order Creation Failed]:', data);
      if (razorpayRes.status === 401) {
        return res.status(401).json({
          error: 'Authentication failed with Razorpay API. Verify Key ID and Secret.',
          details: data
        });
      }
      return res.status(500).json({
        error: data.error?.description || 'Failed to create Razorpay order.',
        details: data
      });
    }

    return res.status(200).json({
      success: true,
      order_id: data.id,
      orderId: data.id,
      amount: data.amount,
      currency: data.currency,
      receipt: data.receipt,
      key: keyId
    });
  } catch (err) {
    console.error('[Razorpay Create-Order Exception]:', err);
    return res.status(500).json({ error: err.message || 'Internal server error while initializing order.' });
  }
}
