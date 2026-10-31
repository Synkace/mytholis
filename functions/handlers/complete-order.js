import { adminAuth, adminDb } from './_firebaseAdmin.js';
import { calculateServerOrderTotal } from '../catalog.js';

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

  const { orderData } = req.body || {};
  if (!orderData) {
    return res.status(400).json({ error: 'Missing orderData' });
  }

  // Authoritative authentication
  let uid = 'guest';
  let userEmail = (orderData.userEmail || orderData.email || 'guest@mytholis.com').toLowerCase();
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      uid = decoded.uid;
      if (decoded.email) userEmail = decoded.email.toLowerCase();
    } catch (e) {
      console.warn("[Mytholis API] Guest checkout (unverified token)");
    }
  }

  try {
    // Validate order items against official server catalog
    const items = Array.isArray(orderData.items) ? orderData.items : [];
    const serverCalc = calculateServerOrderTotal(items, orderData.appliedVoucherCode || orderData.promoCode, orderData.mythosRedeemed || 0);

    const validatedTotal = serverCalc.finalTotal > 0 ? serverCalc.finalTotal : Number(orderData.total || 0);

    // Per AGENTS.md Rule 3: Client cannot claim unverified "Paid" status or award points directly via complete-order
    const isCOD = orderData.paymentMethod && orderData.paymentMethod.toLowerCase().includes('cash on delivery');
    const paymentStatus = isCOD ? 'COD Pending' : 'Payment Pending';
    const orderStatus = isCOD ? 'Order Placed (COD)' : 'Payment Pending';

    const orderDoc = {
      ...orderData,
      total: validatedTotal,
      subtotal: serverCalc.subtotal || validatedTotal,
      userId: uid,
      userEmail,
      paymentStatus,
      status: orderStatus,
      createdAt: new Date().toISOString()
    };

    const orderRef = await adminDb.collection('orders').add(orderDoc);

    // Vouchers: If a voucher was redeemed, mark it used on user profile
    if (uid !== 'guest' && orderData.appliedVoucherCode) {
      try {
        const userRef = adminDb.collection('users').doc(uid);
        const userSnap = await userRef.get();
        if (userSnap.exists) {
          const userData = userSnap.data();
          const loyalty = userData.loyalty || {};
          if (Array.isArray(loyalty.active_reward_codes)) {
            loyalty.active_reward_codes = loyalty.active_reward_codes.map(c => 
              c.code === orderData.appliedVoucherCode ? { ...c, used: true } : c
            );
            await userRef.set({ loyalty, updatedAt: new Date().toISOString() }, { merge: true });
          }
        }
      } catch (vErr) {
        console.warn("[Mytholis API] Voucher consumption note:", vErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      orderId: orderRef.id,
      total: validatedTotal,
      message: 'Order completed and recorded in cloud ledger.'
    });
  } catch (err) {
    console.error("[Mytholis API] complete-order error:", err);
    return res.status(500).json({ error: err.message });
  }
}
