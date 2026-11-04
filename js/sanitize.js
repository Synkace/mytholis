/**
 * Output encoding helpers.
 *
 * The admin dashboard renders other people's data (order names, addresses,
 * patron profiles, posts) into innerHTML. None of it was escaped, so any value
 * a customer could type became stored XSS in the founder's session.
 *
 * Rule of thumb:
 *  - `esc()`      for text inside HTML
 *  - `safeId()`   for anything that lands in an id attribute, a CSS class, or
 *                 inside an inline event handler (`onclick="f('...')"`)
 *  - never interpolate a raw document field into innerHTML
 */

const HTML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;'
};

/** Escape a value for use as HTML text or a quoted attribute value. */
export function esc(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"'`]/g, (ch) => HTML_ENTITIES[ch]);
}

/**
 * Reduce a value to a safe identifier: letters, digits, dot, dash and
 * underscore only. Anything else is dropped.
 *
 * This is what belongs inside `onclick="app.printLabel('${...}')"`. HTML
 * entity escaping is NOT enough there: the browser decodes entities before the
 * JavaScript is parsed, so `&#39;` would still terminate the string.
 */
export function safeId(value, maxLength = 120) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/[^A-Za-z0-9._:-]/g, '')
    .slice(0, maxLength);
}

/** Escape a value for use inside a URL query string. */
export function safeUrl(value) {
  if (value === null || value === undefined) return '';
  try {
    return encodeURIComponent(String(value));
  } catch (_) {
    return '';
  }
}

/**
 * Only allow http(s), relative URLs, and base64 raster images in src/href, so a
 * stored value cannot become `javascript:` or `data:text/html`.
 *
 * `data:image/png|jpeg|webp;base64` is allowed because the profile-photo
 * uploader stores the cropped avatar as an inline data URL. SVG is deliberately
 * NOT allowed there: an SVG data URL can carry script.
 */
export function safeHref(value, fallback = '') {
  const raw = String(value || '').trim();
  if (!raw) return fallback;
  if (/^(https?:\/\/|\/|assets\/)/i.test(raw)) return esc(raw);
  if (/^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=\s]+$/i.test(raw)) return raw;
  return fallback;
}
