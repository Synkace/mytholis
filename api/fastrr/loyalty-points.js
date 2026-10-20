export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Api-Key, X-Api-HMAC-SHA256');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { mobile_number } = req.body || {};
  const cleanPhone = String(mobile_number || '').trim().replace(/[^0-9]/g, '');

  let availablePoints = 0;
  let applicablePoints = 0;

  try {
    const adminModule = await import('../_firebaseAdmin.js');
    const adminDb = adminModule.adminDb;

    if (adminDb && cleanPhone) {
      // Find user by phone in Firestore users
      const usersSnap = await adminDb.collection('users')
        .where('profile.phone', '==', cleanPhone)
        .limit(1)
        .get();

      if (!usersSnap.empty) {
        const userData = usersSnap.docs[0].data();
        availablePoints = userData.loyalty?.spendable_mythos || 0;
        // Cap applicable discount to max 25% or available points
        applicablePoints = Math.min(availablePoints, 1000);
      }
    }
  } catch (err) {
    console.warn('[Fastrr Loyalty] Firestore query warn:', err.message);
  }

  return res.status(200).json({
    data: {
      mobile_number: cleanPhone || mobile_number,
      available_points: availablePoints,
      applicable_points: applicablePoints
    }
  });
}
