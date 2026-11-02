import crypto from 'crypto';
import { adminDb } from '../_firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';

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

    // 1. Fail-closed HMAC-SHA256 signature calculation: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
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

    // 2. Database Synchronization & Order Confirmation
    let verifiedTotal = null;
    let isIdempotent = false;

    if (adminDb && typeof adminDb.runTransaction === 'function') {
      try {
        const txResult = await adminDb.runTransaction(async (tx) => {
          const orderRef = adminDb.collection('orders').doc(orderId);
          const orderDoc = await tx.get(orderRef);

          if (!orderDoc.exists) {
            return { exists: false };
          }

          const draftData = orderDoc.data() || {};

          // Idempotency check: If already PAID, return without double-crediting
          if (draftData.paymentStatus === 'PAID' || draftData.paymentStatus === 'Paid') {
            return {
              exists: true,
              idempotent: true,
              verifiedTotal: draftData.verifiedTotal || draftData.total || 0
            };
          }

          // Exclusively use server draft values
          const draftTotal = draftData.verifiedTotal || draftData.total || 0;
          const earnedMythos = Number(draftData.earnedMythos) || Math.round(draftTotal * 0.03);
          const items = Array.isArray(draftData.items) ? draftData.items : [];
          const uid = draftData.uid || draftData.userId || null;

          // Update orders/{orderId} to confirmed PAID status
          tx.update(orderRef, {
            paymentStatus: 'PAID',
            status: 'CONFIRMED',
            razorpayPaymentId: paymentId,
            paymentId: paymentId,
            paidAt: FieldValue.serverTimestamp(),
            verifiedAt: new Date().toISOString()
          });

          // Award earnedMythos to users/{uid}
          if (uid && !uid.startsWith('guest')) {
            const userRef = adminDb.collection('users').doc(uid);
            const userDoc = await tx.get(userRef);
            if (userDoc.exists) {
              const uData = userDoc.data() || {};
              const currentLoyalty = uData.loyalty || {};
              const fullBottles = items
                .filter(i => (Number(i.size) === 50 || Number(i.size) === 100))
                .reduce((sum, i) => sum + (Number(i.quantity || i.qty) || 1), 0);

              tx.set(userRef, {
                loyalty: {
                  ...currentLoyalty,
                  spendable_mythos: (Number(currentLoyalty.spendable_mythos) || 0) + earnedMythos,
                  legacy_mythos: (Number(currentLoyalty.legacy_mythos) || 0) + earnedMythos,
                  full_bottles_purchased: (Number(currentLoyalty.full_bottles_purchased) || 0) + fullBottles
                }
              }, { merge: true });
            }
          }

          // Decrement stock on products/{item.id} and matching variant (variants[size].stock)
          for (const it of items) {
            if (it.id) {
              const prodRef = adminDb.collection('products').doc(it.id);
              const prodDoc = await tx.get(prodRef);
              if (prodDoc.exists) {
                const pData = prodDoc.data() || {};
                const currentStock = typeof pData.stock === 'number' ? pData.stock : 50;
                const decQty = Number(it.quantity || it.qty) || 1;
                const rawSize = it.size ? String(it.size).toLowerCase().replace('ml', '').trim() : '';
                const sizeKey = rawSize ? `${rawSize}ml` : (it.id === 'mytholis-discovery-set' ? '48ml' : '100ml');

                const updates = {
                  stock: Math.max(0, currentStock - decQty)
                };

                if (pData.variants && pData.variants[sizeKey]) {
                  const varStock = typeof pData.variants[sizeKey].stock === 'number' ? pData.variants[sizeKey].stock : 50;
                  updates[`variants.${sizeKey}.stock`] = Math.max(0, varStock - decQty);
                }

                if (Array.isArray(pData.sizes)) {
                  updates.sizes = pData.sizes.map(s => {
                    if (String(s.ml) === rawSize || (rawSize === '' && s.ml === 100)) {
                      const sStock = typeof s.stock === 'number' ? s.stock : 50;
                      return { ...s, stock: Math.max(0, sStock - decQty) };
                    }
                    return s;
                  });
                }

                tx.update(prodRef, updates);
              }
            }
          }

          return {
            exists: true,
            idempotent: false,
            verifiedTotal: draftTotal
          };
        });

        if (txResult) {
          verifiedTotal = txResult.verifiedTotal;
          isIdempotent = txResult.idempotent;
        }
      } catch (txErr) {
        console.warn('[Razorpay Verify Transaction Notice]:', txErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified and signature authenticated successfully.',
      order_id: orderId,
      orderId: orderId,
      payment_id: paymentId,
      paymentId: paymentId,
      total: verifiedTotal
    });
  } catch (err) {
    console.error('[Razorpay Verify Exception]:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal verification error.' });
  }
}
