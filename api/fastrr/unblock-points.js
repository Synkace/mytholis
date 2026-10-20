export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Api-Key, X-Api-HMAC-SHA256');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { order_id, transactional_points, mobile_number } = req.body || {};
  const points = parseInt(transactional_points) || 0;

  try {
    const adminModule = await import('../_firebaseAdmin.js');
    const adminDb = adminModule.adminDb;

    if (adminDb && points > 0) {
      // Find user by phone if available
      const cleanPhone = String(mobile_number || '').trim().replace(/[^0-9]/g, '');
      if (cleanPhone) {
        const usersSnap = await adminDb.collection('users')
          .where('profile.phone', '==', cleanPhone)
          .limit(1)
          .get();

        if (!usersSnap.empty) {
          const userDoc = usersSnap.docs[0];
          const currentPoints = userDoc.data().loyalty?.spendable_mythos || 0;
          await userDoc.ref.update({
            'loyalty.spendable_mythos': currentPoints + points,
            'loyalty.last_restoration': {
              order_id: order_id,
              points_restored: points,
              timestamp: new Date().toISOString()
            }
          });
        }
      }
    }
  } catch (err) {
    console.warn('[Fastrr Unblock Points] Firestore warn:', err.message);
  }

  return res.status(200).json({
    data: {
      status: true,
      message: "Points unblocked and restored to patron wallet"
    }
  });
}
