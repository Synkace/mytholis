import crypto from 'crypto';
import { adminAuth, adminDb } from '../_firebaseAdmin.js';

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Please POST payment verification payload.' });
  }

  try {
    const orderId = req.body?.razorpay_order_id || req.body?.order_id;
    const paymentId = req.body?.razorpay_payment_id || req.body?.payment_id;
    const signature = req.body?.razorpay_signature || req.body?.signature;
    const orderDetails = req.body?.orderDetails || {};

    // Fail closed if mandatory parameters are missing
    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: order_id, payment_id, and signature are required.'
      });
    }

    // Resolve Razorpay Secret strictly from server environment (AGENTS.md Rule 1)
    const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();

    if (!keySecret) {
      console.error('[Razorpay Verify] Key secret not found in environment.');
      return res.status(500).json({
        success: false,
        error: 'Cryptographic verification unavailable: server secret unconfigured.'
      });
    }

    // Fail-closed HMAC-SHA256 signature calculation: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    let isSignatureValid = false;
    try {
      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      isSignatureValid = (expectedSignature.length === signature.length) && crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf-8'),
        Buffer.from(signature, 'utf-8')
      );
    } catch (cryptoErr) {
      console.error('[Razorpay Verify] Signature comparison error:', cryptoErr.message);
      isSignatureValid = false;
    }

    if (!isSignatureValid) {
      console.warn(`[Razorpay Security Alert] Invalid signature for order ${orderId}!`);
      return res.status(400).json({
        success: false,
        error: 'Signature verification failed. Invalid signature.'
      });
    }

    // Authenticate user via token if provided (Never blindly trust client-supplied userId)
    let authoritativeUserId = 'guest';
    let authoritativeEmail = (orderDetails?.email || '').trim().toLowerCase();

    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && authHeader.startsWith('Bearer ') && adminAuth) {
      try {
        const decoded = await adminAuth.verifyIdToken(authHeader.replace('Bearer ', '').trim());
        authoritativeUserId = decoded.uid;
        if (decoded.email) {
          authoritativeEmail = decoded.email.toLowerCase();
        }
      } catch (authErr) {
        console.warn('[Razorpay Verify] Invalid client auth token, defaulting to guest checkout:', authErr.message);
      }
    } else if (orderDetails?.userId && orderDetails.userId.startsWith('guest_')) {
      authoritativeUserId = orderDetails.userId;
    }

    // Payment signature verified! Record order in Firestore via Sovereign Admin SDK
    const internalOrderId = orderDetails?.orderId || `MYTH-${Date.now().toString().slice(-5)}`;
    
    if (!adminDb) {
      console.error('[Razorpay Verify] Firestore Admin SDK is not available.');
      return res.status(500).json({
        success: false,
        error: 'Database service unavailable. Failed to persist verified order.'
      });
    }

    try {
      const orderRef = adminDb.collection('orders').doc(internalOrderId);
      const verifiedTotal = Number(orderDetails?.total || 0);

      const orderRecord = {
        orderId: internalOrderId,
        razorpayOrderId: orderId,
        paymentId: paymentId,
        status: 'Payment Authorized',
        paymentStatus: 'Paid',
        paymentMethod: 'Razorpay Instant (UPI / Cards / NetBanking)',
        total: verifiedTotal,
        items: orderDetails?.items || [],
        customerName: orderDetails?.customerName || 'Collector',
        customerPhone: orderDetails?.customerPhone || '',
        customerAddress: orderDetails?.customerAddress || '',
        customerPincode: orderDetails?.customerPincode || '',
        email: authoritativeEmail,
        userId: authoritativeUserId,
        verifiedAt: new Date().toISOString()
      };

      await orderRef.set(orderRecord, { merge: true });

      // If user is authenticated registered patron, credit loyalty points server-authoritatively
      if (authoritativeUserId && !authoritativeUserId.startsWith('guest')) {
        try {
          const userRef = adminDb.collection('users').doc(authoritativeUserId);
          const userSnap = await userRef.get();
          if (userSnap.exists) {
            const uData = userSnap.data() || {};
            const currentLoyalty = uData.loyalty || {};
            const earnedPts = Math.round(verifiedTotal * 0.03);

            // Count full bottles
            const items = Array.isArray(orderDetails.items) ? orderDetails.items : [];
            const fullBottles = items.filter(i => (Number(i.size) === 50 || Number(i.size) === 100)).reduce((sum, i) => sum + (Number(i.quantity || i.qty) || 1), 0);

            await userRef.set({
              loyalty: {
                ...currentLoyalty,
                spendable_mythos: (Number(currentLoyalty.spendable_mythos) || 0) + earnedPts,
                legacy_mythos: (Number(currentLoyalty.legacy_mythos) || 0) + earnedPts,
                full_bottles_purchased: (Number(currentLoyalty.full_bottles_purchased) || 0) + fullBottles
              }
            }, { merge: true });
          }
        } catch (loyaltyErr) {
          console.warn('[Razorpay Verify] User loyalty credit note:', loyaltyErr.message);
        }
      }
    } catch (dbErr) {
      console.error('[Razorpay Verify] Firestore order persistence failed:', dbErr);
      // Fail closed: Do NOT return success if database write failed!
      return res.status(500).json({
        success: false,
        error: 'Order registration failed during database write. Please contact support.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified and order registered successfully.',
      order_id: orderId,
      orderId: internalOrderId,
      payment_id: paymentId,
      paymentId: paymentId
    });
  } catch (err) {
    console.error('[Razorpay Verify Exception]:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal verification error.' });
  }
}
