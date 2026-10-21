import crypto from 'crypto';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Please POST order parameters.' });
  }

  try {
    const {
      txnid,
      amount,
      productinfo = 'Mytholis Extrait de Parfum',
      firstname = 'Patron',
      email = 'patron@mytholis.com',
      phone = '9999999999',
      surl,
      furl,
      udf1 = '',
      udf2 = '',
      udf3 = '',
      udf4 = '',
      udf5 = '',
      key: customKey,
      salt: customSalt,
      env: customEnv
    } = req.body || {};

    if (!txnid || !amount) {
      return res.status(400).json({ error: 'Missing mandatory fields: txnid and amount are required.' });
    }

    // Resolve Merchant Key & Salt
    const merchantKey = (process.env.PAYU_MERCHANT_KEY || customKey || 'LqPsyW').trim();
    const merchantSalt = (process.env.PAYU_MERCHANT_SALT || customSalt || '').trim();

    if (!merchantSalt) {
      return res.status(400).json({
        error: 'PayU Merchant Salt is not configured. Please supply PAYU_MERCHANT_SALT or configure it in Sovereign Admin Settings.'
      });
    }

    const formattedAmount = parseFloat(amount).toFixed(2);
    const sanitizedProductInfo = String(productinfo).substring(0, 100).replace(/[^a-zA-Z0-9 _-]/g, ' ').trim() || 'Mytholis Perfume';
    const sanitizedFirstName = String(firstname).substring(0, 50).trim() || 'Patron';
    const sanitizedEmail = String(email).trim().toLowerCase() || 'concierge@mytholis.com';
    const sanitizedPhone = String(phone).replace(/\D/g, '').slice(-10) || '9999999999';

    // Base origin for callbacks
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'mytholis.com';
    const origin = `${protocol}://${host}`;

    const successUrl = surl || `${origin}/api/payu/response`;
    const failureUrl = furl || `${origin}/api/payu/response`;

    // Standard PayU Hash Formula:
    // sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
    const hashSequence = `${merchantKey}|${txnid}|${formattedAmount}|${sanitizedProductInfo}|${sanitizedFirstName}|${sanitizedEmail}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${merchantSalt}`;
    const hash = crypto.createHash('sha512').update(hashSequence).digest('hex').toLowerCase();

    // Determine gateway endpoint based on environment or key
    const isLive = customEnv === 'live' || process.env.PAYU_ENV === 'live';
    const actionUrl = isLive ? 'https://secure.payu.in/_payment' : 'https://test.payu.in/_payment';

    return res.status(200).json({
      status: 'success',
      action: actionUrl,
      params: {
        key: merchantKey,
        txnid,
        amount: formattedAmount,
        productinfo: sanitizedProductInfo,
        firstname: sanitizedFirstName,
        email: sanitizedEmail,
        phone: sanitizedPhone,
        surl: successUrl,
        furl: failureUrl,
        hash,
        service_provider: 'payu_paisa',
        udf1,
        udf2,
        udf3,
        udf4,
        udf5
      }
    });
  } catch (error) {
    console.error('[PayU Initiate] Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to initiate PayU transaction' });
  }
}
