/**
 * Mytholis Identity Normalization Utilities
 * Shared helper for customer phone and email sanitization.
 */

/**
 * Normalizes an Indian mobile phone number.
 * Strips spaces, dashes, symbols, and leading '+91' or '0'.
 * Returns strictly the 10-digit mobile number matching [6-9]\d{9}, or empty string if invalid.
 *
 * @param {string|number} raw
 * @returns {string} 10-digit phone string or ''
 */
export function normalizePhone(raw) {
  if (!raw) return '';
  const str = String(raw).trim();
  // Strip all non-numeric characters
  const digits = str.replace(/\D/g, '');

  // Extract trailing 10 digits
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

  // If 10 digits but non-standard, return the 10 digits if valid length
  return tenDigit.length === 10 ? tenDigit : '';
}

/**
 * Normalizes an email address.
 * Strips whitespace and forces lowercase.
 *
 * @param {string} raw
 * @returns {string} lowercase trimmed email
 */
export function normalizeEmail(raw) {
  if (!raw) return '';
  return String(raw).trim().toLowerCase();
}

export default {
  normalizePhone,
  normalizeEmail
};
