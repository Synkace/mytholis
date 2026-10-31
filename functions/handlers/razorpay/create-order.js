import { calculateServerOrderTotal } from '../../catalog.js';
import { adminDb, adminAuth } from '../_firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';

// Module-level cache for credentials
let cachedKeyId = (process.env.RAZORPAY_KEY_ID || '').trim();
let cachedKeySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();

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
    return res.status(200).json({ status: 'warm', ready: !!(cachedKeyId && cachedKeySecret) });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Please POST order parameters.' });
  }

  try {
    const { items, promoCode, paymentMethod, customer, notes = {}, mythosPoints, currency = 'INR', receipt, amount } = req.body || {};

    let amountInPaise = 0;
    let finalAmountInRupees = 0;
    let validatedItems = [];
    let subtotal = 0;
    let discountCode = null;
    let discountAmount = 0;
    let earnedMythos = 0;

    // 1. Support both cart items array (catalog-driven) and direct amount in paise (Step 1 API standard)
    if (Array.isArray(items) && items.length > 0) {
      const serverCalc = calculateServerOrderTotal(items, promoCode, paymentMethod, mythosPoints);
      if (!serverCalc.isValid) {
        return res.status(400).json({ error: serverCalc.error || 'Invalid cart items or quantities' });
      }
      amountInPaise = serverCalc.amountInPaise;
      finalAmountInRupees = serverCalc.finalAmountInRupees;
      validatedItems = serverCalc.validatedItems;
      subtotal = serverCalc.subtotal;
      discountCode = serverCalc.validatedPromoCode || null;
      discountAmount = serverCalc.discountAmount;
      earnedMythos = serverCalc.earnedMythos;
    } else if (amount !== undefined && amount !== null && !isNaN(Number(amount))) {
      amountInPaise = Math.round(Number(amount));
      finalAmountInRupees = Math.round(amountInPaise / 100);
      subtotal = finalAmountInRupees;
    } else {
      return res.status(400).json({ error: 'Cart items array or order amount in paise is required' });
    }

    if (!amountInPaise || amountInPaise < 100) {
      return res.status(400).json({ error: 'Invalid order amount. Minimum order value is 100 paise (₹1).' });
    }

    // 3. Resolve user identity authoritatively if auth token present
    let authenticatedUid = null;
    let authenticatedEmail = null;
    const authHeader = req.headers?.authorization || req.headers?.Authorization;
    if (authHeader && authHeader.startsWith('Bearer ') && adminAuth) {
      try {
        const decoded = await adminAuth.verifyIdToken(authHeader.replace('Bearer ', '').trim());
        authenticatedUid = decoded.uid;
        if (decoded.email) authenticatedEmail = decoded.email.toLowerCase();
      } catch (_) {}
    }

    // 4. Resolve credentials strictly from server environment
    const keyId = (process.env.RAZORPAY_KEY_ID || cachedKeyId || '').trim();
    const keySecret = (process.env.RAZORPAY_KEY_SECRET || cachedKeySecret || '').trim();

    if (!keyId || !keySecret) {
      console.error('[Razorpay Create-Order] Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in server environment.');
      return res.status(500).json({ error: 'Payment Gateway is not configured. Missing server credentials.' });
    }

    const authHeaderStr = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const orderReceipt = receipt || `MYTH-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const rawCustomer = customer || {};
    const sanitizedCustomer = {
      name: (rawCustomer.name || req.body.customerName || 'Collector').trim(),
      email: (authenticatedEmail || rawCustomer.email || req.body.customerEmail || req.body.email || '').trim().toLowerCase(),
      phone: (rawCustomer.phone || req.body.customerPhone || req.body.phone || '').trim(),
      address: (rawCustomer.address || req.body.customerAddress || req.body.address || '').trim(),
      city: (rawCustomer.city || req.body.customerCity || req.body.city || '').trim(),
      state: (rawCustomer.state || req.body.customerState || req.body.state || '').trim(),
      pincode: (rawCustomer.pincode || req.body.customerPincode || req.body.pincode || '').trim()
    };

    const razorpayRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeaderStr
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency,
        receipt: orderReceipt,
        notes: {
          ...notes,
          customerName: sanitizedCustomer.name,
          customerPhone: sanitizedCustomer.phone
        }
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

    // 5. Write Authoritative Order Draft Before Returning (Persist server-side pending ledger)
    const orderDraft = {
      orderId: data.id,
      razorpayOrderId: data.id,
      uid: authenticatedUid || req.body.uid || null,
      userId: authenticatedUid || req.body.uid || null,
      items: validatedItems,
      subtotal: subtotal,
      discountCode: discountCode,
      discountAmount: discountAmount,
      verifiedTotal: finalAmountInRupees,
      total: finalAmountInRupees,
      amountInPaise: amountInPaise,
      earnedMythos: earnedMythos,
      paymentMethod: paymentMethod || 'Razorpay Instant',
      paymentStatus: 'PENDING',
      status: 'CREATED',
      customer: sanitizedCustomer,
      customerName: sanitizedCustomer.name,
      customerPhone: sanitizedCustomer.phone,
      customerAddress: sanitizedCustomer.address,
      userEmail: sanitizedCustomer.email,
      createdAt: FieldValue?.serverTimestamp ? FieldValue.serverTimestamp() : new Date().toISOString()
    };

    if (adminDb && typeof adminDb.collection === 'function') {
      try {
        await adminDb.collection('orders').doc(data.id).set(orderDraft);
      } catch (dbErr) {
        console.warn('[Razorpay Order Draft DB Notice]:', dbErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      order_id: data.id,
      orderId: data.id,
      amount: data.amount,
      currency: data.currency,
      receipt: data.receipt,
      key: keyId,
      keyId: keyId
    });
  } catch (err) {
    console.error('[Razorpay Create-Order Exception]:', err);
    return res.status(500).json({ error: err.message || 'Internal server error while initializing order.' });
  }
}
