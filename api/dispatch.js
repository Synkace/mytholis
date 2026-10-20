// Status mapper from Shiprocket to Mytholis Haute Parfumerie Statuses
function mapShiprocketStatus(status) {
  if (!status) return 'Shipped';
  const s = String(status).toUpperCase().trim();

  if (s.includes('DELIVERED')) return 'Delivered';
  if (s.includes('OUT FOR DELIVERY')) return 'Out for Delivery';
  if (s.includes('IN TRANSIT') || s.includes('REACHED') || s.includes('SHIPPED') || s.includes('DISPATCHED')) return 'Shipped';
  if (s.includes('PICKED UP') || s.includes('MANIFEST') || s.includes('AWB ASSIGNED') || s.includes('LABEL GENERATED')) return 'Packed';
  if (s.includes('RTO') || s.includes('RETURN')) return 'RTO';
  if (s.includes('CANCEL')) return 'Cancelled';

  return 'Shipped';
}

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-api-key, x-webhook-token, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Health-check / verification ping (Shiprocket or browser GET)
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      status: 'active',
      service: 'Mytholis Sovereign Logistics Webhook Gateway',
      timestamp: new Date().toISOString()
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    // Security Check: Optional secret verification
    const webhookSecret = process.env.SHIPROCKET_WEBHOOK_SECRET;
    const providedSecret = req.headers['x-api-key'] || req.headers['x-webhook-token'] || req.headers['authorization'];
    
    if (webhookSecret && providedSecret) {
      const cleanProvided = String(providedSecret).replace(/^Bearer\s+/i, '').trim();
      if (cleanProvided !== webhookSecret.trim()) {
        console.warn('[Dispatch Webhook] Unauthorized attempt with invalid secret.');
        return res.status(401).json({ success: false, error: 'Unauthorized webhook request' });
      }
    }

    const payload = req.body || {};
    console.log('[Dispatch Webhook] Incoming payload:', JSON.stringify(payload).slice(0, 400));

    // Handle Shiprocket "Test Webhook" ping or empty test body
    if (!payload || Object.keys(payload).length === 0 || payload.test === true || payload.is_test === 1) {
      return res.status(200).json({
        success: true,
        message: 'Mytholis Dispatch Webhook endpoint verified successfully',
        test: true,
        timestamp: new Date().toISOString()
      });
    }

    // Shiprocket may send a single object or an array of event objects
    const events = Array.isArray(payload) ? payload : [payload];
    const results = [];

    // Safely attempt dynamic load of adminDb
    let adminDb = null;
    try {
      const adminModule = await import('./_firebaseAdmin.js');
      adminDb = adminModule.adminDb || null;
    } catch (importErr) {
      console.warn('[Dispatch Webhook] Firebase Admin not available:', importErr.message);
    }

    for (const item of events) {
      try {
        const awb = (item.awb || item.awb_code || item.awb_number || item.tracking_number || '').trim();
        const orderId = (item.channel_order_id || item.order_id || item.orderId || '').trim();
        const rawStatus = (item.current_status || item.shipment_status || item.status || '').trim();
        const courierName = item.courier_name || item.courierName || 'BlueDart Express';
        const etd = item.etd || item.expected_delivery_date || '';
        const scans = Array.isArray(item.scans) ? item.scans : [];

        // If neither orderId nor AWB is present (e.g. dummy test payload from Shiprocket UI)
        if (!orderId && !awb) {
          console.log('[Dispatch Webhook] Test / generic event acknowledged:', item);
          results.push({ item, status: 'acknowledged' });
          continue;
        }

        // If Firebase Admin DB is not initialized on Vercel
        if (!adminDb) {
          console.warn('[Dispatch Webhook] adminDb in standby mode. Skipping Firestore write.');
          results.push({
            orderId,
            awb,
            status: mapShiprocketStatus(rawStatus),
            standby: true
          });
          continue;
        }

        // Find matching order in Firestore
        let targetOrderDoc = null;
        let targetOrderRef = null;

        // Search 1: Direct Doc ID by channel_order_id
        if (orderId) {
          const directSnap = await adminDb.collection('orders').doc(orderId).get().catch(() => null);
          if (directSnap && directSnap.exists) {
            targetOrderDoc = directSnap.data();
            targetOrderRef = directSnap.ref;
          }
        }

        // Search 2: Query by orderId field
        if (!targetOrderRef && orderId) {
          const qSnap = await adminDb.collection('orders').where('orderId', '==', orderId).limit(1).get().catch(() => null);
          if (qSnap && !qSnap.empty) {
            targetOrderDoc = qSnap.docs[0].data();
            targetOrderRef = qSnap.docs[0].ref;
          }
        }

        // Search 3: Query by AWB
        if (!targetOrderRef && awb) {
          const awbSnap = await adminDb.collection('orders').where('trackingNumber', '==', awb).limit(1).get().catch(() => null);
          if (awbSnap && !awbSnap.empty) {
            targetOrderDoc = awbSnap.docs[0].data();
            targetOrderRef = awbSnap.docs[0].ref;
          } else {
            const awbLegacySnap = await adminDb.collection('orders').where('awb_number', '==', awb).limit(1).get().catch(() => null);
            if (awbLegacySnap && !awbLegacySnap.empty) {
              targetOrderDoc = awbLegacySnap.docs[0].data();
              targetOrderRef = awbLegacySnap.docs[0].ref;
            }
          }
        }

        if (!targetOrderRef) {
          console.warn(`[Dispatch Webhook] No matching order found for Order ID: ${orderId}, AWB: ${awb}`);
          results.push({ orderId, awb, matched: false });
          continue;
        }

        const mappedStatus = mapShiprocketStatus(rawStatus);
        const isDelivered = mappedStatus.toLowerCase() === 'delivered';
        const isCod = (targetOrderDoc.paymentMethod || '').toUpperCase() === 'COD';

        const updateData = {
          status: mappedStatus,
          trackingNumber: awb || targetOrderDoc.trackingNumber || targetOrderDoc.awb_number || '',
          courierName: courierName || targetOrderDoc.courierName || 'BlueDart Express',
          trackingUrl: awb ? `https://shiprocket.co/tracking/${awb}` : (targetOrderDoc.trackingUrl || ''),
          shiprocketRawStatus: rawStatus,
          shiprocketLastUpdate: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        if (etd) updateData.estimatedDelivery = etd;
        if (scans.length) {
          updateData.shiprocketScans = scans;
          const lastScan = scans[scans.length - 1];
          if (lastScan.location) updateData.lastLocation = lastScan.location;
          if (lastScan.activity) updateData.lastActivity = lastScan.activity;
        }

        // COD & Loyalty Settlement Guardrail:
        let loyaltyCredited = false;
        if (isDelivered && isCod && !targetOrderDoc.rewardsCredited) {
          updateData.paymentStatus = 'Paid';
          updateData.rewardsCredited = true;
          updateData.rewardsCreditedAt = new Date().toISOString();

          const uid = targetOrderDoc.userId;
          if (uid && uid !== 'guest') {
            const userRef = adminDb.collection('users').doc(uid);
            const userSnap = await userRef.get().catch(() => null);
            if (userSnap && userSnap.exists) {
              const userData = userSnap.data();
              const currentLoyalty = userData.loyalty || {};

              const orderTotal = Number(targetOrderDoc.finalPayable || targetOrderDoc.total || targetOrderDoc.subtotal || 0);
              const spendEarned = Math.round(orderTotal * 0.03);

              let bottleCount = 0;
              let bottleBonus = 0;
              const items = Array.isArray(targetOrderDoc.items) ? targetOrderDoc.items : [];
              items.forEach(it => {
                const qty = Number(it.quantity || it.qty || 1);
                const sz = Number(it.size);
                if (sz === 50) {
                  bottleCount += qty;
                  bottleBonus += (300 * qty);
                } else if (sz === 100) {
                  bottleCount += qty;
                  bottleBonus += (500 * qty);
                }
              });

              const legacyEarned = spendEarned + bottleBonus;
              const updatedLoyalty = {
                ...currentLoyalty,
                spendable_mythos: (Number(currentLoyalty.spendable_mythos) || 0) + spendEarned,
                legacy_mythos: (Number(currentLoyalty.legacy_mythos) || 0) + legacyEarned,
                full_bottles_purchased: (Number(currentLoyalty.full_bottles_purchased) || 0) + bottleCount
              };

              await userRef.set({
                loyalty: updatedLoyalty,
                updatedAt: new Date().toISOString()
              }, { merge: true }).catch(e => console.warn('[Dispatch Webhook] User loyalty update warning:', e.message));

              updateData.rewardsGranted = { spendEarned, legacyEarned, bottleCount };
              loyaltyCredited = true;
              console.log(`[Dispatch Webhook] Granted ${spendEarned}M to patron ${uid} upon COD delivery.`);
            }
          }
        }

        await targetOrderRef.set(updateData, { merge: true });
        results.push({
          orderId: targetOrderRef.id,
          awb,
          status: mappedStatus,
          matched: true,
          loyaltyCredited
        });

      } catch (itemErr) {
        console.error('[Dispatch Webhook] Error processing event item:', itemErr);
        results.push({ error: itemErr.message });
      }
    }

    // Record webhook diagnostic entry in Firestore webhook_logs if adminDb is available
    if (adminDb) {
      try {
        await adminDb.collection('webhook_logs').add({
          source: 'shiprocket',
          receivedAt: new Date().toISOString(),
          eventCount: events.length,
          results
        }).catch(() => {});
      } catch (_) {}
    }

    return res.status(200).json({
      success: true,
      message: 'Dispatch webhook processed successfully',
      processed: results.length,
      results
    });

  } catch (error) {
    console.error('[Dispatch Webhook] Global handler error caught:', error);
    // Never return 500 to Shiprocket test pings
    return res.status(200).json({
      success: true,
      message: 'Dispatch webhook acknowledged with fallback',
      warning: error.message
    });
  }
}
