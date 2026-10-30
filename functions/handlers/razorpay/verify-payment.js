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
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderDetails
    } = req.body || {};

    // Fail closed if mandatory parameters are missing
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Missing required payment verification parameters.'
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

    // Fail-closed HMAC-SHA256 signature calculation
    let isSignatureValid = false;
    try {
      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      isSignatureValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf-8'),
        Buffer.from(razorpay_signature, 'utf-8')
      );
    } catch (cryptoErr) {
      console.error('[Razorpay Verify] Signature comparison error:', cryptoErr.message);
      isSignatureValid = false;
    }

    if (!isSignatureValid) {
      console.warn(`[Razorpay Security Alert] Invalid signature for order ${razorpay_order_id}!`);
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid payment signature.'
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
