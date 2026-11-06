/* Lazy GSAP loader.
 *
 * GSAP was previously a static import, so ~70 KB had to download, parse and
 * execute before the app could boot. It is only needed by the hero fan
 * animations, so it is now fetched asynchronously and awaited by the four
 * functions that use it. Nothing else waits on it.
 */

let lib = null;
let promise = null;

export function preloadGsap() {
  if (promise) return promise;
  promise = import('gsap')
    .then((mod) => {
      lib = mod.default || mod.gsap || mod;
      if (typeof window !== 'undefined') window.gsap = lib;
      return lib;
    })
    .catch(() => null);
  return promise;
}

export async function ensureGsap() {
  return lib || (await preloadGsap());
}
