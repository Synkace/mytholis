/**
 * Mytholis Identity & Canonical Normalization Utilities
 * Shared helper for customer phone, email, and household address sanitization.
 */

/**
 * canonicalPhone(raw)
 * Strips all spaces, hyphens, parentheses, leading '+91', '91' (when length > 10), or '0'.
 * Returns strictly the 10-digit Indian mobile number ("7020725550"), or empty string if invalid.
 *
 * @param {string|number} raw
 * @returns {string} 10-digit phone string or ''
 */
export function canonicalPhone(raw) {
  if (!raw) return '';
  const str = String(raw).trim();
  // Strip all non-numeric characters
  const digits = str.replace(/\D/g, '');

  let tenDigit = digits;
  if (digits.length > 10) {
    if (digits.startsWith('91') && digits.length === 12) {
      tenDigit = digits.slice(2);
    } else {
      tenDigit = digits.slice(-10);
    }
  } else if (digits.length === 11 && digits.startsWith('0')) {
    tenDigit = digits.slice(1);
  }

  // Validate standard Indian mobile prefix (starts with 6, 7, 8, or 9 and has 10 digits)
  if (/^[6-9]\d{9}$/.test(tenDigit)) {
    return tenDigit;
  }

  return tenDigit.length === 10 ? tenDigit : '';
}

/**
 * formatPhoneDisplay(raw)
 * Formats canonical 10-digit phone number consistently as "+91 7020725550".
 *
 * @param {string|number} raw
 * @returns {string} Formatted display string or raw if invalid
 */
export function formatPhoneDisplay(raw) {
  const p10 = canonicalPhone(raw);
  if (p10) {
    return `+91 ${p10}`;
  }
  return raw ? String(raw).trim() : '';
}

/**
 * canonicalEmail(raw)
 * Normalizes an email address: trimmed, lowercase.
 *
 * @param {string} raw
 * @returns {string} lowercase trimmed email
 */
export function canonicalEmail(raw) {
  if (!raw) return '';
  return String(raw).trim().toLowerCase();
}

/**
 * canonicalAddressKey(addr, pincode)
 * Normalizes pincode (6 digits) + lowercase alphanumeric street prefix to detect
 * identical physical households when phone/email are entered across sessions.
 *
 * @param {string|object} addr
 * @param {string|number} pincode
 * @returns {string} e.g. "423203_221mhbcolony"
 */
export function canonicalAddressKey(addr, pincode = '') {
  let pin = String(pincode || '').replace(/\D/g, '');
  let street = '';

  if (typeof addr === 'string') {
    street = addr;
    if (!pin) {
      const pinMatch = addr.match(/\b([1-9][0-9]{5})\b/);
      if (pinMatch) pin = pinMatch[1];
    }
  } else if (addr && typeof addr === 'object') {
    street = [addr.address, addr.line1, addr.street, addr.address1].filter(Boolean).join(' ');
    if (!pin) {
      pin = String(addr.pincode || addr.postalCode || addr.zip || '').replace(/\D/g, '');
    }
  }

  pin = pin.length >= 6 ? pin.slice(0, 6) : '';
  const cleanStreet = street.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30);
  return pin ? `${pin}_${cleanStreet}` : cleanStreet;
}

// Backward compatibility aliases
export const normalizePhone = canonicalPhone;
export const normalizeEmail = canonicalEmail;

export default {
  canonicalPhone,
  formatPhoneDisplay,
  canonicalEmail,
  canonicalAddressKey,
  normalizePhone,
  normalizeEmail
};
