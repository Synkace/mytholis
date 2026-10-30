import crypto from 'crypto';
import { adminDb } from '../_firebaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const data = req.body || req.query || {};
    const {
      status,
      txnid,
      amount,
      key,
      productinfo = '',
      firstname = '',
      email = '',
      hash,
      error = '',
      error_Message = '',
      bank_ref_num = '',
      payuMoneyId = '',
      additionalCharges,
      udf1 = '',
      udf2 = '',
      udf3 = '',
      udf4 = '',
      udf5 = ''
    } = data;

    let merchantSalt = (process.env.PAYU_MERCHANT_SALT || '').trim();

    // Dynamically fallback to Firestore settings/global if not configured in environment
    if (!merchantSalt && adminDb) {
      try {
        const settingsSnap = await adminDb.collection('settings').doc('global').get();
        if (settingsSnap.exists) {
          const s = settingsSnap.data() || {};
          merchantSalt = (s.payuMerchantSalt || '').trim();
        }
      } catch (dbErr) {
        console.warn('[PayU Callback] Could not read salt from settings:', dbErr.message);
      }
    }

    // Verify reverse hash (strictly fail-closed: must have merchantSalt, hash, and matching calculation)
    let isHashValid = false;
    if (merchantSalt && hash && key) {
      let reverseSequence = `${merchantSalt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
      if (additionalCharges) {
        reverseSequence = `${additionalCharges}|` + reverseSequence;
      }
      const expectedHash = crypto.createHash('sha512').update(reverseSequence).digest('hex').toLowerCase();
      if (expectedHash === String(hash).toLowerCase()) {
        isHashValid = true;
      } else {
        console.warn('[PayU Callback] Hash mismatch! Expected:', expectedHash, 'Received:', hash);
        isHashValid = false;
      }
    } else {
      console.warn('[PayU Callback] Rejecting unauthenticated or unsigned callback payload.');
      isHashValid = false;
    }

    const isSuccess = (status === 'success' || status === 'captured') && isHashValid;

    // Update Firestore order record if database connection is available
    if (adminDb && txnid && isSuccess) {
      try {
        const orderRef = adminDb.collection('orders').doc(txnid);
        const orderDoc = await orderRef.get();

        if (orderDoc.exists) {
          await orderRef.update({
            paymentStatus: 'Paid',
            status: 'Confirmed',
            paymentMethod: 'PayU Hosted (Cards/UPI)',
            payuTransactionId: payuMoneyId || bank_ref_num || txnid,
            payuBankRefNum: bank_ref_num || '',
            updatedAt: new Date().toISOString()
          });
          console.log(`[PayU Callback] Order ${txnid} marked as Paid in Firestore.`);
        } else {
          // Check query by orderId
          const querySnap = await adminDb.collection('orders').where('orderId', '==', txnid).limit(1).get();
          if (!querySnap.empty) {
            await querySnap.docs[0].ref.update({
              paymentStatus: 'Paid',
              status: 'Confirmed',
              paymentMethod: 'PayU Hosted (Cards/UPI)',
              payuTransactionId: payuMoneyId || bank_ref_num || txnid,
              payuBankRefNum: bank_ref_num || '',
              updatedAt: new Date().toISOString()
            });
            console.log(`[PayU Callback] Order matching orderId ${txnid} marked as Paid.`);
          }
        }
      } catch (dbErr) {
        console.error('[PayU Callback] Failed updating Firestore order:', dbErr);
      }
    }

    const host = req.headers['x-forwarded-host'] || req.headers.host || 'mytholis.com';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const baseUrl = `${protocol}://${host}`;

    // Render an automated redirect page with luxury styling
    const redirectTarget = isSuccess
      ? `${baseUrl}/#track-order?orderId=${encodeURIComponent(txnid)}&payment=success&ref=${encodeURIComponent(payuMoneyId || bank_ref_num || '')}`
      : `${baseUrl}/#cart?payment=failed&msg=${encodeURIComponent(error_Message || error || 'Payment could not be completed')}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Mytholis — Payment Status</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      background: #0D0E12;
      color: #E6DFD5;
      font-family: 'Cinzel', 'Playfair Display', Georgia, serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      text-align: center;
      padding: 1.5rem;
    }
    .card {
      background: rgba(22, 24, 30, 0.85);
      border: 1px solid rgba(212, 175, 55, 0.3);
      border-radius: 12px;
      padding: 2.5rem 2rem;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(16px);
    }
    .badge {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }
    h2 {
      color: #D4AF37;
      margin-bottom: 0.5rem;
      font-size: 1.4rem;
    }
    p {
      color: #A39E93;
      font-size: 0.9rem;
      margin-bottom: 1.5rem;
      line-height: 1.5;
    }
    .btn {
      display: inline-block;
      padding: 0.75rem 1.8rem;
      background: linear-gradient(135deg, #D4AF37 0%, #AA820A 100%);
      color: #0D0E12;
      font-weight: 700;
      text-decoration: none;
      border-radius: 6px;
      font-size: 0.85rem;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">${isSuccess ? '👑' : '⚠️'}</div>
    <h2>${isSuccess ? 'Payment Confirmed' : 'Payment Transaction Update'}</h2>
    <p>${isSuccess ? 'Your payment has been securely verified by PayU. Returning you to your Mytholis Vault consignment tracker...' : (error_Message || 'The payment could not be completed. Returning you to your cart...')}</p>
    <a href="${redirectTarget}" class="btn">Proceed to Mytholis</a>
  </div>
  <script>
    setTimeout(function() {
      window.location.href = "${redirectTarget}";
    }, 1200);
  </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch (err) {
    console.error('[PayU Callback] Unhandled error:', err);
    return res.status(500).send('Server Error Processing Payment Callback');
  }
}
