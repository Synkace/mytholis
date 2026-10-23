/* ==========================================================================
   MYTHOLIS LUXURY PERFUME - APPLICATION ENTRY BUNDLE
   Imports modules and coordinates state, background, components & app engine
   ========================================================================== */

// Detect Capacitor Native App (Android / iOS) vs Web Browser
if (typeof window !== 'undefined') {
  const isNative = (typeof window.Capacitor !== 'undefined' && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) ||
    window.location.protocol === 'capacitor:' ||
    window.location.protocol === 'ionic:' ||
    /wv|WebView|Capacitor/i.test(navigator.userAgent) ||
    (window.Capacitor && window.Capacitor.getPlatform && window.Capacitor.getPlatform() === 'android');

  if (isNative) {
    document.documentElement.classList.add('is-native-app');
  }
}

import gsap from 'gsap';

if (typeof window !== 'undefined') {
  window.gsap = gsap;
}

import './catalog.js';
import './store.js';
import './background.js';
import './components.js';
import './adminComponents.js';
import './firebase.js';
import './app.js';
