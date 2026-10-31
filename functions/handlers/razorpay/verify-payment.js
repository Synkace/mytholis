import crypto from 'crypto';
import { adminDb } from '../_firebaseAdmin.js';

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

    // Fail closed if mandatory parameters are missing (Return 400 as per specification)
    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: order_id, payment_id, and signature are required.'
      });
    }

    // Resolve Razorpay Secret dynamically
    let keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();

    if (!keySecret && adminDb) {
      try {
        const settingsSnap = await adminDb.collection('settings').doc('global').get();
        if (settingsSnap.exists) {
          const s = settingsSnap.data() || {};
          keySecret = (s.razorpayKeySecret || '').trim();
        }
      } catch (dbErr) {
        console.warn('[Razorpay Verify] Could not read secret from Firestore:', dbErr.message);
      }
    }

    if (!keySecret) {
      console.error('[Razorpay Verify] Key secret not found in environment or Firestore.');
      return res.status(500).json({
        success: false,
        error: 'Cryptographic verification unavailable: secret missing.'
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

    // Payment signature verified! Record/update order in Firestore
    const internalOrderId = orderDetails?.orderId || `MYTH-${Date.now().toString().slice(-5)}`;
    if (adminDb) {
      try {
        const orderRef = adminDb.collection('orders').doc(internalOrderId);
        const orderRecord = {
          orderId: internalOrderId,
          razorpayOrderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          status: 'Payment Authorized',
          paymentStatus: 'Paid',
          paymentMethod: 'Razorpay Instant (UPI / Cards / NetBanking)',
          total: Number(orderDetails?.total || 0),
          items: orderDetails?.items || [],
          customerName: orderDetails?.customerName || 'Collector',
          customerPhone: orderDetails?.customerPhone || '',
          customerAddress: orderDetails?.customerAddress || '',
          customerPincode: orderDetails?.customerPincode || '',
          email: orderDetails?.email || '',
          userId: orderDetails?.userId || '',
          verifiedAt: new Date().toISOString()
        };

        await orderRef.set(orderRecord, { merge: true });

        // If user is authenticated, update loyalty and decrease flacon stock
        if (orderDetails?.userId) {
          try {
            const userRef = adminDb.collection('users').doc(orderDetails.userId);
            const userSnap = await userRef.get();
            if (userSnap.exists) {
              const uData = userSnap.data() || {};
              const currentLoyalty = uData.loyalty || {};
              const earnedPts = Math.round(Number(orderDetails.total || 0) * 0.03);

              await userRef.set({
                loyalty: {
                  ...currentLoyalty,
                  spendable_mythos: (Number(currentLoyalty.spendable_mythos) || 0) + earnedPts,
                  legacy_mythos: (Number(currentLoyalty.legacy_mythos) || 0) + earnedPts
                }
              }, { merge: true });
            }
          } catch (loyaltyErr) {
            console.warn('[Razorpay Verify] User loyalty credit notice:', loyaltyErr.message);
          }
        }
      } catch (dbErr) {
        console.error('[Razorpay Verify] Firestore order update failed:', dbErr);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified and order registered successfully.',
      orderId: internalOrderId,
      paymentId: razorpay_payment_id
    });
  } catch (err) {
    console.error('[Razorpay Verify Exception]:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal verification error.' });
  }
}
