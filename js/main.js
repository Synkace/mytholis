/* ==========================================================================
   MYTHOLIS LUXURY PERFUME - APPLICATION ENTRY BUNDLE
   Imports modules and coordinates state, background, components & app engine
   ========================================================================== */

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
