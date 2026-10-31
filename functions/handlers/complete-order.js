import { adminAuth, adminDb } from './_firebaseAdmin.js';
import { calculateServerOrderTotal } from '../catalog.js';
import { FieldValue } from 'firebase-admin/firestore';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { orderId, orderData } = req.body || {};
  const targetOrderId = orderId || orderData?.orderId || orderData?.id;

  // Authoritative authentication
  let uid = 'guest';
  let userEmail = (orderData?.userEmail || orderData?.email || 'guest@mytholis.com').toLowerCase();
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      uid = decoded.uid;
      if (decoded.email) userEmail = decoded.email.toLowerCase();
    } catch (_) {}
  }

  try {
    // 1. If an authoritative server draft already exists in orders/{orderId}, read strictly from it
    if (targetOrderId) {
      const existingRef = adminDb.collection('orders').doc(targetOrderId);
      const existingSnap = await existingRef.get();

      if (existingSnap.exists) {
        const draftData = existingSnap.data() || {};
        const verifiedTotal = draftData.verifiedTotal || draftData.total;
        const isCOD = (draftData.paymentMethod || orderData?.paymentMethod || '').toLowerCase().includes('cod') ||
                      (draftData.paymentMethod || orderData?.paymentMethod || '').toLowerCase().includes('cash on delivery');

        await existingRef.update({
          paymentStatus: isCOD ? 'COD Pending' : (draftData.paymentStatus || 'Payment Pending'),
          status: isCOD ? 'Order Placed (COD)' : (draftData.status || 'CREATED'),
          placedAt: FieldValue.serverTimestamp()
        });

        return res.status(200).json({
          success: true,
          orderId: targetOrderId,
          total: verifiedTotal,
          message: 'Order draft confirmed and recorded in cloud ledger.'
        });
      }
    }

    // 2. If creating without prior Razorpay draft, strictly require items array and calculate via catalog
    const items = Array.isArray(orderData?.items) ? orderData.items : (Array.isArray(req.body?.items) ? req.body.items : []);
    if (!items.length) {
      return res.status(400).json({ error: 'Cart items array is required to complete order' });
    }

    const promoCode = orderData?.appliedVoucherCode || orderData?.promoCode || req.body?.promoCode || '';
    const paymentMethod = orderData?.paymentMethod || req.body?.paymentMethod || 'Cash on Delivery (COD)';
    const mythosPoints = Number(orderData?.mythosRedeemed || req.body?.mythosPoints || 0);

    const serverCalc = calculateServerOrderTotal(items, promoCode, paymentMethod, mythosPoints);
    if (!serverCalc.isValid) {
      return res.status(400).json({ error: serverCalc.error || 'Invalid order items' });
    }

    const isCOD = paymentMethod.toLowerCase().includes('cash on delivery') || paymentMethod.toLowerCase().includes('cod');
    const paymentStatus = isCOD ? 'COD Pending' : 'Payment Pending';
    const orderStatus = isCOD ? 'Order Placed (COD)' : 'Payment Pending';

    const rawCustomer = orderData?.customer || req.body?.customer || {};
    const sanitizedCustomer = {
      name: (rawCustomer.name || orderData?.name || orderData?.customerName || 'Collector').trim(),
      email: (userEmail || rawCustomer.email || '').trim().toLowerCase(),
      phone: (rawCustomer.phone || orderData?.phone || orderData?.customerPhone || '').trim(),
      address: (rawCustomer.address || orderData?.address || orderData?.customerAddress || '').trim(),
      city: (rawCustomer.city || orderData?.city || orderData?.customerCity || '').trim(),
      state: (rawCustomer.state || orderData?.state || orderData?.customerState || '').trim(),
      pincode: (rawCustomer.pincode || orderData?.pincode || orderData?.customerPincode || '').trim()
    };

    const newOrderDoc = {
      orderId: targetOrderId || `MYTH-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
      items: serverCalc.validatedItems,
      subtotal: serverCalc.subtotal,
      discountCode: serverCalc.validatedPromoCode || null,
      discountAmount: serverCalc.discountAmount,
      total: serverCalc.finalAmountInRupees,
      verifiedTotal: serverCalc.finalAmountInRupees,
      earnedMythos: serverCalc.earnedMythos,
      paymentMethod,
      paymentStatus,
      status: orderStatus,
      customer: sanitizedCustomer,
      customerName: sanitizedCustomer.name,
      customerPhone: sanitizedCustomer.phone,
      customerAddress: sanitizedCustomer.address,
      userEmail,
      userId: uid,
      createdAt: FieldValue.serverTimestamp()
    };

    const docRef = targetOrderId 
      ? adminDb.collection('orders').doc(targetOrderId)
      : adminDb.collection('orders').doc(newOrderDoc.orderId);

    await docRef.set(newOrderDoc, { merge: true });

    return res.status(200).json({
      success: true,
      orderId: docRef.id,
      total: serverCalc.finalAmountInRupees,
      message: 'Order completed and recorded in cloud ledger.'
    });
  } catch (err) {
    console.error('[Mytholis API] complete-order error:', err);
    return res.status(500).json({ error: err.message });
  }
}
