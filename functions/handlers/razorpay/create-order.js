import { adminDb } from '../_firebaseAdmin.js';

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
    const { amount, currency = 'INR', receipt, notes = {} } = req.body || {};

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Invalid order amount specified.' });
    }

    let authHeader = cachedAuthHeader;
    let keyId = cachedKeyId;

    if (!authHeader || !keyId) {
      keyId = cachedKeyId;
      let keySecret = cachedKeySecret;

      if ((!keyId || !keySecret) && adminDb) {
        try {
          const settingsSnap = await adminDb.collection('settings').doc('global').get();
          if (settingsSnap.exists) {
            const s = settingsSnap.data() || {};
            if (!keyId) keyId = (s.razorpayKeyId || '').trim();
            if (!keySecret) keySecret = (s.razorpayKeySecret || '').trim();
          }
        } catch (dbErr) {
          console.warn('[Razorpay Create-Order] Could not read settings from Firestore:', dbErr.message);
        }
      }

      if (!keyId || !keySecret) {
        console.error('[Razorpay Create-Order] Missing Razorpay Key ID or Secret.');
        return res.status(500).json({ error: 'Payment Gateway is not configured. Please configure in Sovereign Admin.' });
      }

      cachedKeyId = keyId;
      cachedKeySecret = keySecret;
      cachedAuthHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      authHeader = cachedAuthHeader;
    }

    const amountInPaise = Math.round(Number(amount) * 100);
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
      return res.status(razorpayRes.status).json({
        error: data.error?.description || 'Failed to create Razorpay order.',
        details: data
      });
    }

    return res.status(200).json({
      success: true,
      orderId: data.id,
      amount: data.amount,
      currency: data.currency,
      key: keyId,
      receipt: data.receipt
    });
  } catch (err) {
    console.error('[Razorpay Create-Order Exception]:', err);
    return res.status(500).json({ error: err.message || 'Internal server error while initializing order.' });
  }
}
