/**
 * Shared authentication / authorization for the Mytholis API.
 *
 * Rules enforced here (see AGENTS.md §4):
 *  - Bearer ID tokens only; no clients-auth shortcuts.
 *  - Admin rights come from the `admin: true` custom claim, or from an
 *    ADMIN_EMAIL entry whose address Firebase has VERIFIED. A bare email
 *    claim is never trusted, because anyone can register an unverified one.
 *  - No hardcoded email lists. No `includes()` substring matching.
 */

import { timingSafeEqual } from 'node:crypto';
import { adminAuth } from '../handlers/_firebaseAdmin.js';

function envAdminEmails() {
  return String(process.env.ADMIN_EMAIL || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** True only for a genuinely trusted administrator token. */
export function isAdminToken(decoded) {
  if (!decoded || !decoded.uid) return false;
  if (decoded.admin === true) return true;

  const email = String(decoded.email || '').trim().toLowerCase();
  if (!email) return false;

  // Verified-address fallback. Registration proves nothing; verification does.
  return decoded.email_verified === true && envAdminEmails().includes(email);
}

function bearerFrom(req) {
  const header = req.headers?.authorization || req.headers?.Authorization || '';
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  return token || null;
}

/**
 * @returns {{ ok: true, decoded: object } | { ok: false, status: number, error: string }}
 */
export async function authenticate(req) {
  const token = bearerFrom(req);
  if (!token) {
    return { ok: false, status: 401, error: 'Unauthorized: Missing or invalid Bearer token' };
  }
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    if (!decoded || !decoded.uid) {
      return { ok: false, status: 401, error: 'Unauthorized: Invalid authentication token' };
    }
    return { ok: true, decoded };
  } catch (err) {
    console.warn('[Auth] Token verification failed:', err.message);
    return { ok: false, status: 401, error: 'Unauthorized: Invalid authentication token' };
  }
}

/**
 * @returns {{ ok: true, decoded: object } | { ok: false, status: number, error: string }}
 */
export async function requireAdmin(req) {
  const auth = await authenticate(req);
  if (!auth.ok) return auth;

  if (!isAdminToken(auth.decoded)) {
    console.warn(
      `[Auth] Forbidden admin attempt by ${auth.decoded.email || auth.decoded.uid}`
    );
    return {
      ok: false,
      status: 403,
      error: 'Forbidden: administrator privileges required'
    };
  }
  return auth;
}

/** Constant-time string comparison for shared secrets. */
export function safeEqual(a, b) {
  const bufA = Buffer.from(String(a ?? ''), 'utf-8');
  const bufB = Buffer.from(String(b ?? ''), 'utf-8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
