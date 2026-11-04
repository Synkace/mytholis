import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../handlers/_firebaseAdmin.js';
import { sendOrderConfirmation } from './mailer.js';
import { earnRate, tierFor, writeLedgerEntry } from './loyalty.js';

/**
 * Single source of truth for "this order is paid".
 *
 * Every path that can learn about a payment - the browser callback
 * (/api/verify-payment) and the Razorpay webhook - funnels through here.
 * Before this existed, four different code paths wrote payment status,
 * loyalty and stock, and they disagreed.
 *
 * Runs in a Firestore transaction:
 *   - idempotent on paymentStatus / paidAt
 *   - credits loyalty from SERVER-computed values only
 *   - decrements stock
 *   - burns the voucher (single use)
 */

const BOTTLE_BONUS = { 50: 300, 100: 500 };

function isPaidStatus(status) {
  const s = String(status || '').toLowerCase();
  return s === 'paid' || s === 'captured';
}

function bottleTotals(items) {
  let count = 0;
  let bonus = 0;
  for (const item of Array.isArray(items) ? items : []) {
    const qty = Number(item.quantity ?? item.qty ?? 1) || 1;
    const size = Number(item.size);
    if (BOTTLE_BONUS[size]) {
      count += qty;
      bonus += BOTTLE_BONUS[size] * qty;
    }
  }
  return { count, bonus };
}

async function resolveOrderRef(orderId) {
  const directRef = adminDb.collection('orders').doc(orderId);
  const directSnap = await directRef.get();
  if (directSnap.exists) return directRef;

  const q = await adminDb.collection('orders').where('orderId', '==', orderId).limit(1).get();
  if (!q.empty) return q.docs[0].ref;

  return null;
}

/**
 * @param {object} args
 * @param {string} args.orderId           Razorpay order id (also our document id)
 * @param {string} [args.paymentId]       razorpay payment id
 * @param {string} [args.source]          'verify-payment' | 'webhook' | 'admin'
 * @param {number} [args.paidAmountPaise] amount actually captured, for the mismatch check
 * @returns {Promise<{ok:boolean, status?:number, error?:string, idempotent?:boolean, total?:number}>}
 */
export async function settlePaidOrder({ orderId, paymentId = null, source = 'verify-payment', paidAmountPaise = null }) {
  if (!orderId) {
    return { ok: false, status: 400, error: 'Missing order id' };
  }

  const orderRef = await resolveOrderRef(orderId);
  if (!orderRef) {
    return {
      ok: false,
      status: 404,
      error: 'Order record not found. The payment may be real but no draft exists - reconcile manually in the Razorpay dashboard.'
    };
  }

  const settled = await adminDb.runTransaction(async (tx) => {
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists) {
      return { ok: false, status: 404, error: 'Order record not found' };
    }

    const order = orderSnap.data() || {};
    const expectedTotal = Number(order.verifiedTotal ?? order.total ?? 0) || 0;

    /* Partial COD: the gateway only ever charges the deposit, so that is what
       the captured amount must be compared against - not the full order value. */
    const isPartialCod = order.isPartialCod === true;
    const expectedCharge = isPartialCod
      ? Number(order.depositAmount ?? order.chargedInPaise / 100 ?? 0) || 0
      : expectedTotal;

    // Amount sanity check. Never settle an underpaid order.
    if (paidAmountPaise !== null && Number(paidAmountPaise) > 0) {
      const capturedRupees = Math.round(Number(paidAmountPaise) / 100);
      if (expectedCharge > 0 && capturedRupees < expectedCharge) {
        tx.set(orderRef, {
          amountMismatch: {
            expectedRupees: expectedCharge,
            capturedRupees,
            capturedAt: new Date().toISOString(),
            source
          }
        }, { merge: true });
        return {
          ok: false,
          status: 409,
          error: `Amount mismatch: order expects ₹${expectedCharge}, gateway captured ₹${capturedRupees}.`
        };
      }
    }

    if (isPaidStatus(order.paymentStatus) || order.paidAt) {
      return { ok: true, idempotent: true, total: expectedTotal };
    }

    const uid = order.userId || order.uid || null;
    const items = Array.isArray(order.items) ? order.items : [];
    const { count: fullBottles, bonus: bottleBonus } = bottleTotals(items);
    // Tier multiplier is resolved at payment time, not at checkout, because the
    // collector's tier can change between the two.
    const earnedMythos = Math.round(expectedTotal * earnRate(preLoyalty.legacy_mythos, preLoyalty.full_bottles_purchased, preLoyalty.manual_tier_override));

    // ---- pre-read everything the transaction will touch ----
    const userRef = uid && !String(uid).startsWith('guest')
      ? adminDb.collection('users').doc(uid)
      : null;
    const userSnap = userRef ? await tx.get(userRef) : null;
    const preLoyalty = (userSnap && userSnap.exists ? userSnap.data()?.loyalty : null) || {};

    const productRefs = [];
    const productSnaps = [];
    for (const item of items) {
      if (!item?.id) continue;
      const ref = adminDb.collection('products').doc(String(item.id));
      productRefs.push({ ref, item });
      productSnaps.push(await tx.get(ref));
    }

    const voucherCode = String(order.discountCode || '').trim().toUpperCase();
    let voucherRef = null;
    let voucherSnap = null;
    if (voucherCode) {
      const vRef = adminDb.collection('vouchers').doc(voucherCode);
      const vSnap = await tx.get(vRef);
      if (vSnap.exists) {
        voucherRef = vRef;
        voucherSnap = vSnap;
      } else {
        const rRef = adminDb.collection('reward_codes').doc(voucherCode);
        const rSnap = await tx.get(rRef);
        if (rSnap.exists) {
          voucherRef = rRef;
          voucherSnap = rSnap;
        }
      }
    }

    // ---- writes ----
    tx.set(orderRef, {
      /* Partial COD stops at DEPOSIT_PAID: the balance is collected by the
         courier and settled later by the logistics webhook. Marking it PAID
         here would silently write off the balance. */
      paymentStatus: isPartialCod ? 'DEPOSIT_PAID' : 'PAID',
      status: isPartialCod ? 'Order Placed (Partial COD)' : 'CONFIRMED',
      depositPaidAt: isPartialCod ? FieldValue.serverTimestamp() : null,
      balanceDue: isPartialCod ? (Number(order.balanceDue) || Math.max(0, expectedTotal - expectedCharge)) : 0,
      razorpayPaymentId: paymentId || order.razorpayPaymentId || null,
      paymentId: paymentId || order.paymentId || null,
      paidAt: FieldValue.serverTimestamp(),
      settledBy: source,
      isDraft: false,
      verifiedAt: new Date().toISOString()
    }, { merge: true });

    if (userRef && userSnap && userSnap.exists) {
      const uData = userSnap.data() || {};
      const loyalty = uData.loyalty || {};
      const currentSpendable = Number(loyalty.spendable_mythos) || 0;
      // Points redeemed against this order are debited here, once, inside the
      // same transaction that marks the order paid. The old code never debited
      // them at all, so the concession could be used on every order forever.
      const redeemed = Math.max(0, Math.min(Number(order.mythosRedeemed) || 0, currentSpendable));

      /* Rewards are only credited once the order is fully settled. For partial
         COD that happens at delivery, so the deposit only debits points. */
      const creditEarned = isPartialCod ? 0 : earnedMythos;
      const creditBottles = isPartialCod ? 0 : bottleBonus;
      const creditBottleCount = isPartialCod ? 0 : fullBottles;
      // Burn the personal voucher that was accepted at checkout.
      const voucherToBurn = String(order.personalVoucherCode || '').toUpperCase();
      let nextCodes = Array.isArray(loyalty.active_reward_codes) ? [...loyalty.active_reward_codes] : [];
      if (voucherToBurn) {
        nextCodes = nextCodes.map((c) =>
          String(c?.code || '').toUpperCase() === voucherToBurn
            ? { ...c, used: true, usedAt: new Date().toISOString(), usedOnOrderId: orderRef.id }
            : c
        );
      }
      const nextSpendable = currentSpendable - redeemed + creditEarned;
      writeLedgerEntry(tx, {
        uid,
        type: isPartialCod ? 'deposit' : 'earn',
        spendableDelta: creditEarned - redeemed,
        legacyDelta: creditEarned + creditBottles,
        balanceAfter: nextSpendable,
        reason: 'Order ' + (order.orderId || orderRef.id),
        orderId: orderRef.id
      });

      tx.set(userRef, {
        loyalty: {
          ...loyalty,
          spendable_mythos: nextSpendable,
          legacy_mythos: (Number(loyalty.legacy_mythos) || 0) + creditEarned + creditBottles,
          full_bottles_purchased: (Number(loyalty.full_bottles_purchased) || 0) + creditBottleCount,
          active_reward_codes: nextCodes
        },
        points: nextSpendable,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }

    productSnaps.forEach((snap, index) => {
      if (!snap.exists) return;
      const { ref, item } = productRefs[index];
      const pData = snap.data() || {};
      const qty = Number(item.quantity ?? item.qty ?? 1) || 1;

      const currentStock = typeof pData.stock === 'number' ? pData.stock : 50;
      const rawSize = item.size ? String(item.size).toLowerCase().replace('ml', '').trim() : '';
      const sizeKey = rawSize ? `${rawSize}ml` : (pData.id === 'mytholis-discovery-set' ? '48ml' : '100ml');

      const updates = { stock: Math.max(0, currentStock - qty) };

      if (pData.variants && pData.variants[sizeKey]) {
        const varStock = typeof pData.variants[sizeKey].stock === 'number' ? pData.variants[sizeKey].stock : 50;
        updates[`variants.${sizeKey}.stock`] = Math.max(0, varStock - qty);
      }

      if (Array.isArray(pData.sizes)) {
        updates.sizes = pData.sizes.map((s) => {
          if (String(s.ml) === rawSize || (rawSize === '' && s.ml === 100)) {
            const sStock = typeof s.stock === 'number' ? s.stock : 50;
            return { ...s, stock: Math.max(0, sStock - qty) };
          }
          return s;
        });
      }

      tx.update(ref, updates);
    });

    // Single-use enforcement. This never happened before: a voucher could be
    // reused forever because nothing ever flipped `used`.
    if (voucherRef && voucherSnap && voucherSnap.exists) {
      const v = voucherSnap.data() || {};
      const maxUses = Number(v.maxUses) || 1;
      const uses = Number(v.usesCount) || 0;
      tx.set(voucherRef, {
        used: uses + 1 >= maxUses,
        usesCount: uses + 1,
        lastUsedOrderId: order.orderId || orderRef.id,
        lastUsedBy: uid || null,
        lastUsedAt: new Date().toISOString()
      }, { merge: true });
    }

    return {
      ok: true,
      idempotent: false,
      total: expectedTotal,
      earnedMythos,
      fullBottles
    };
  });

  /* Email is sent OUTSIDE the transaction (network calls must never sit inside
     one) and is idempotent, so a webhook retry cannot send it twice. */
  if (settled && settled.ok && !settled.idempotent) {
    sendOrderConfirmation(orderRef.id).catch(() => {});
    creditReferral(orderRef).catch(() => {});
  }

  return settled;
}

/**
 * Circle of Legends referral credit.
 *
 * When a referred collector's order is paid for the FIRST time, the inviter
 * receives 500 Mythos: 300 Spendable + 200 Legacy. Awarded exactly once per
 * referred account (guarded by `referralRewarded` on the buyer), and never for
 * self-referral.
 */
async function creditReferral(orderRef) {
  try {
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) return;
    const order = orderSnap.data() || {};
    if (order.referralCredited) return;

    const buyerUid = order.userId || order.uid;
    if (!buyerUid || String(buyerUid).startsWith('guest')) return;

    const buyerRef = adminDb.collection('users').doc(buyerUid);
    const buyerSnap = await buyerRef.get();
    if (!buyerSnap.exists) return;
    const buyer = buyerSnap.data() || {};
    if (buyer.referralRewarded === true) return;

    const code = String(buyer.referredBy || order.referredBy || '').trim().toUpperCase();
    if (!code.startsWith('MYTH-')) return;

    let match = await adminDb.collection('users').where('referralCode', '==', code).limit(1).get();
    if (match.empty) match = await adminDb.collection('users').where('profile.referralCode', '==', code).limit(1).get();
    if (match.empty) {
      console.warn(`[Referral] ${code} did not resolve to a collector`);
      return;
    }
    const referrerUid = match.docs[0].id;
    if (referrerUid === buyerUid) return;

    await adminDb.runTransaction(async (tx) => {
      const freshOrder = await tx.get(orderRef);
      if (!freshOrder.exists || freshOrder.data().referralCredited) return;
      const freshBuyer = await tx.get(buyerRef);
      if (!freshBuyer.exists || freshBuyer.data().referralRewarded === true) return;

      const referrerRef = adminDb.collection('users').doc(referrerUid);
      const referrerSnap = await tx.get(referrerRef);
      if (!referrerSnap.exists) return;
      const l = referrerSnap.data().loyalty || {};

      const buyerName = String(freshBuyer.data()?.profile?.name || 'A collector').slice(0, 60);

      tx.set(referrerRef, {
        loyalty: {
          ...l,
          spendable_mythos: (Number(l.spendable_mythos) || 0) + 300,
          legacy_mythos: (Number(l.legacy_mythos) || 0) + 200,
          referral_credits: (Number(l.referral_credits) || 0) + 1
        },
        /* Queued for the inviter's next visit. The client acknowledges it by
           stamping referralNoticesSeenAt, so the toast shows exactly once. */
        referralNotices: FieldValue.arrayUnion({
          guest: buyerName,
          spendable: 300,
          legacy: 200,
          at: new Date().toISOString()
        }),
        referralNoticesAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      writeLedgerEntry(tx, {
        uid: referrerUid,
        type: 'referral',
        spendableDelta: 300,
        legacyDelta: 200,
        balanceAfter: (Number(l.spendable_mythos) || 0) + 300,
        reason: 'Referral credit for ' + buyerUid,
        orderId: orderRef.id,
        actor: 'system'
      });

      tx.set(buyerRef, { referralRewarded: true, referralRewardedAt: new Date().toISOString() }, { merge: true });
      tx.set(orderRef, { referralCredited: true, referralCode: code, referralCreditedAt: new Date().toISOString() }, { merge: true });
    });

    console.log(`[Referral] Credited ${referrerUid} (+300 spendable, +200 legacy) for ${buyerUid}`);
  } catch (err) {
    console.warn('[Referral] credit note:', err.message);
  }
}