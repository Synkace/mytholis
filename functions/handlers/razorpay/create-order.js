import { calculateServerOrderTotal, isFirstOrderEligible } from '../../catalog.js';
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
    const { items, promoCode, paymentMethod, customer, notes = {}, mythosPoints, redeemMythos, currency = 'INR', receipt, amount } = req.body || {};

    let amountInPaise = 0;
    let finalAmountInRupees = 0;
    let validatedItems = [];
    let subtotal = 0;
    let discountCode = null;
    let discountAmount = 0;
    let earnedMythos = 0;
    let promoDiscount = 0;
    let upiDiscount = 0;
    let mythosDiscount = 0;
    let shippingFee = 0;
    let codFee = 0;
    let isPartialCod = false;
    let depositInRupees = 0;
    let balanceDueInRupees = 0;

    /* 0. Resolve identity BEFORE pricing.
       Loyalty redemption must be clamped to the collector's real balance, which
       means we need to know who they are before the discount is computed.
       The client's `redeemMythos` value is a request, never a fact. */
    let authenticatedUid = null;
    let authenticatedEmail = null;
    let serverSpendable = 0;
    let mythosRedeemed = 0;

    const authHeader = req.headers?.authorization || req.headers?.Authorization;
    if (authHeader && authHeader.startsWith('Bearer ') && adminAuth) {
      try {
        const decoded = await adminAuth.verifyIdToken(authHeader.replace('Bearer ', '').trim());
        authenticatedUid = decoded.uid;
        if (decoded.email) authenticatedEmail = decoded.email.toLowerCase();

        const userSnap = await adminDb.collection('users').doc(decoded.uid).get().catch(() => null);
        if (userSnap && userSnap.exists) {
          const u = userSnap.data() || {};
          serverSpendable = Number(u.loyalty?.spendable_mythos) || 0;
        }
      } catch (_) {
        authenticatedUid = null;
        authenticatedEmail = null;
      }
    }

    // 1. Support both cart items array (catalog-driven) and direct amount in paise (Step 1 API standard)
    if (Array.isArray(items) && items.length > 0) {
      const requestedPoints = Number(redeemMythos !== undefined ? redeemMythos : (mythosPoints || 0)) || 0;
      // Never redeem more than the server knows they have - and never for a guest.
      const pointsToRedeem = authenticatedUid
        ? Math.max(0, Math.min(requestedPoints, serverSpendable))
        : 0;
      mythosRedeemed = pointsToRedeem;

      // Authoritative Firestore Lookups: Live Products, Dynamic Settings, & Vouchers
      let firestoreProducts = [];
      let serverSettings = {};
      let voucherDoc = null;

      if (adminDb) {
        // A. Fetch live product documents from Firestore products/{id}
        try {
          const productIdsToFetch = new Set();
          items.forEach(it => {
            const raw = String(it.id || it.productId || it.slug || '').trim().toLowerCase();
            if (raw === 'sixth-sense' || raw === 'mytholis-discovery-set') {
              productIdsToFetch.add('mytholis-discovery-set');
            } else if (raw) {
              productIdsToFetch.add(raw);
            }
          });

          const fetchPromises = Array.from(productIdsToFetch).map(pid =>
            adminDb.collection('products').doc(pid).get()
              .then(snap => snap.exists ? { id: snap.id, ...snap.data() } : null)
              .catch(() => null)
          );
          const fetchedResults = await Promise.all(fetchPromises);
          firestoreProducts = fetchedResults.filter(Boolean);
        } catch (prodErr) {
          console.warn('[Razorpay Create-Order] Live products fetch notice:', prodErr.message);
        }

        // B. Fetch live settings from Firestore settings/global (fallback to settings/public_config)
        try {
          const globalSnap = await adminDb.collection('settings').doc('global').get().catch(() => null);
          if (globalSnap && globalSnap.exists) {
            serverSettings = globalSnap.data() || {};
          } else {
            const pubSnap = await adminDb.collection('settings').doc('public_config').get().catch(() => null);
            if (pubSnap && pubSnap.exists) {
              serverSettings = pubSnap.data() || {};
            }
          }
        } catch (setErr) {
          console.warn('[Razorpay Create-Order] Live settings fetch notice:', setErr.message);
        }

        // C. Fetch dynamic voucher from Firestore if promoCode provided
        const cleanPromo = (promoCode || '').trim().toUpperCase();
        if (cleanPromo) {
          try {
            const vSnap = await adminDb.collection('vouchers').doc(cleanPromo).get().catch(() => null);
            if (vSnap && vSnap.exists) {
              voucherDoc = { id: vSnap.id, ...vSnap.data() };
            } else {
              const rSnap = await adminDb.collection('reward_codes').doc(cleanPromo).get().catch(() => null);
              if (rSnap && rSnap.exists) {
                voucherDoc = { id: rSnap.id, ...rSnap.data() };
              }
            }
          } catch (vErr) {
            console.warn('[Razorpay Create-Order] Voucher fetch notice:', vErr.message);
          }
        }
      }

      // First-order eligibility is decided from the order ledger, never the UI.
      const serverFirstOrder = await isFirstOrderEligible(adminDb, {
        uid: authenticatedUid,
        email: authenticatedEmail || req.body?.customerEmail || req.body?.email,
        phone: req.body?.customerPhone || req.body?.phone
      });

      const serverCalc = calculateServerOrderTotal(items, promoCode, paymentMethod, pointsToRedeem, {
        firestoreProducts,
        settings: serverSettings,
        voucherDoc,
        isFirstOrder: serverFirstOrder
      });

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
      promoDiscount = serverCalc.promoDiscount || 0;
      upiDiscount = serverCalc.upiDiscount || 0;
      mythosDiscount = serverCalc.mythosDiscount || 0;
      shippingFee = serverCalc.shippingFee || 0;
      codFee = serverCalc.codFee || 0;

      // Partial COD: the gateway is asked for the deposit only.
      isPartialCod = serverCalc.isPartialCod === true;
      depositInRupees = serverCalc.depositInRupees;
      balanceDueInRupees = serverCalc.balanceDueInRupees;
      if (isPartialCod) {
        amountInPaise = serverCalc.chargeInPaise;
      }
    } else {
      /* A raw `amount` in paise used to be accepted when no items were sent.
         That let a caller create a Razorpay order for any value they liked and
         have it written into the authoritative draft. Removed: every order must
         carry a cart, and every price comes from the server catalog. */
      return res.status(400).json({
        error: 'A cart items array is required. Orders are priced server-side from the catalog.'
      });
    }

    if (!amountInPaise || amountInPaise < 100) {
      return res.status(400).json({ error: 'Invalid order amount. Minimum order value is 100 paise (₹1).' });
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
      promoDiscount: promoDiscount,
      upiDiscount: upiDiscount,
      mythosDiscount: mythosDiscount,
      shippingFee: shippingFee,
      codFee: codFee,
      verifiedTotal: finalAmountInRupees,
      total: finalAmountInRupees,
      amountInPaise: amountInPaise,
      /* Deferred payment bookkeeping. `verifiedTotal` is always the FULL order
         value; `chargedInPaise` is what the gateway actually captured. */
      isPartialCod: isPartialCod,
      depositAmount: isPartialCod ? depositInRupees : finalAmountInRupees,
      balanceDue: balanceDueInRupees,
      chargedInPaise: amountInPaise,
      earnedMythos: earnedMythos,
      // Points this order consumes. Debited server-side at settlement.
      mythosRedeemed: mythosRedeemed,
      paymentMethod: isPartialCod ? 'Partial COD' : (paymentMethod || 'Razorpay Instant'),
      paymentStatus: 'PENDING',
      /* A draft is a CHECKOUT, not an order. It exists so the server has a
         priced cart to settle against. The dashboard must not count it. */
      isDraft: true,
      status: 'AWAITING_PAYMENT',
      checkoutStartedAt: new Date().toISOString(),
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
        // Without the draft there is nothing to settle against, so we must not
        // let the customer pay. Fail loudly instead of returning a live order id.
        console.error('[Razorpay Create-Order] Could not persist the order draft:', dbErr.message);
        return res.status(500).json({
          error: 'Could not record the order. Please try again.',
          retryable: true
        });
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
      keyId: keyId,
      isPartialCod: isPartialCod,
      depositAmount: isPartialCod ? depositInRupees : finalAmountInRupees,
      balanceDue: balanceDueInRupees,
      subtotal: subtotal,
      promoDiscount: promoDiscount,
      upiDiscount: upiDiscount,
      mythosDiscount: mythosDiscount,
      shippingFee: shippingFee,
      codFee: codFee,
      discountAmount: discountAmount,
      totalDiscount: discountAmount,
      verifiedTotal: finalAmountInRupees,
      amountInPaise: amountInPaise,
      earnedMythos: earnedMythos
    });
  } catch (err) {
    console.error('[Razorpay Create-Order Exception]:', err);
    return res.status(500).json({ error: err.message || 'Internal server error while initializing order.' });
  }
}
