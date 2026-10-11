/* ============================================================
   MYTHOLIS LUXURY PERFUME - HERO1 INTERACTIVE ENGINE
   GSAP 3D Fan Array, ScrollTrigger, Tilt & Responsive Parallax
   ============================================================ */

gsap.registerPlugin(ScrollTrigger);

// ============================================================
// INITIAL STATES + APPLY DATA-ROT
// ============================================================
gsap.set("#nav", { opacity: 0, y: -20 });
gsap.set(".hero-kicker", { opacity: 0, y: -15 });
gsap.set(".small-team .word > span", { y: "105%" });
gsap.set(".big-results .letter", { y: 80, opacity: 0 });
gsap.set("#subline", { opacity: 0, y: 25 });
gsap.set(".t-card", { opacity: 0 });
gsap.set(".stats-inner", { opacity: 0 });

// Apply each card's natural rotation as the rest-state, start off-screen
document.querySelectorAll(".card").forEach((card) => {
  const rot = parseFloat(card.dataset.rot) || 0;
  card.dataset.restRot = rot;
  gsap.set(card, { y: -850, rotation: rot + 18, opacity: 0, scale: 0.8 });
});

// ============================================================
// INTRO TIMELINE
// ============================================================
const intro = gsap.timeline({ defaults: { ease: "power3.out" } });

intro
  .to("#nav", { opacity: 1, y: 0, duration: 0.8 }, 0.1)
  .to(".hero-kicker", { opacity: 1, y: 0, duration: 0.7 }, 0.25)
  .to(
    ".small-team .word > span",
    {
      y: "0%",
      duration: 0.95,
      stagger: 0.08,
      ease: "power3.out"
    },
    0.35
  )
  .to(
    ".big-results .letter",
    {
      y: 0,
      opacity: 1,
      duration: 0.95,
      stagger: 0.04,
      ease: "back.out(1.5)"
    },
    0.55
  )
  .to(
    ".card",
    {
      y: 0,
      opacity: 1,
      scale: 1,
      rotation: (i, el) => parseFloat(el.dataset.restRot) || 0,
      duration: 1.15,
      stagger: { each: 0.07, from: "center" },
      ease: "back.out(1.35)"
    },
    0.75
  )
  .to("#subline", { opacity: 1, y: 0, duration: 0.85 }, 1.55);

// ============================================================
// CONTINUOUS LUXURY FLOAT ON CARDS
// ============================================================
document.querySelectorAll(".card").forEach((card, i) => {
  const rot = parseFloat(card.dataset.restRot) || 0;
  gsap.to(card, {
    y: `+=${6 + (i % 3) * 4}`,
    rotation: rot + (i % 2 === 0 ? 1.2 : -1.2),
    duration: 3.2 + (i % 4) * 0.5,
    delay: 1.8 + i * 0.12,
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1
  });
});

// ============================================================
// MOUSE PARALLAX ON CARDS (DESKTOP)
// ============================================================
const hero = document.querySelector(".hero");
let mx = 0,
  my = 0,
  tx = 0,
  ty = 0;

if (hero) {
  hero.addEventListener("mousemove", (e) => {
    const r = hero.getBoundingClientRect();
    mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    my = ((e.clientY - r.top) / r.height - 0.5) * 2;
  });

  hero.addEventListener("mouseleave", () => {
    mx = 0;
    my = 0;
  });
}

function parallax() {
  tx += (mx - tx) * 0.05;
  ty += (my - ty) * 0.05;

  if (window.innerWidth > 768) {
    document.querySelectorAll(".card").forEach((card) => {
      const d = parseFloat(card.dataset.depth) || 8;
      card.style.translate = `${tx * d}px ${ty * d * 0.5}px`;
    });
  } else {
    document.querySelectorAll(".card").forEach((card) => {
      card.style.translate = "0px 0px";
    });
  }

  requestAnimationFrame(parallax);
}
parallax();

// ============================================================
// CARD HOVER 3D TILT & LIGHT HIGHLIGHT
// ============================================================
document.querySelectorAll(".card").forEach((card) => {
  card.addEventListener("mousemove", (e) => {
    if (window.innerWidth < 768) return;
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;

    gsap.to(card, {
      rotateX: -py * 16,
      rotateY: px * 16,
      scale: 1.1,
      zIndex: 25,
      duration: 0.35,
      ease: "power2.out",
      transformPerspective: 800,
      overwrite: "auto"
    });
  });

  card.addEventListener("mouseleave", () => {
    if (window.innerWidth < 768) return;
    gsap.to(card, {
      rotateX: 0,
      rotateY: 0,
      scale: 1,
      zIndex: card.style.zIndex || "",
      duration: 0.75,
      ease: "elastic.out(1, 0.6)",
      overwrite: "auto"
    });
  });

  // Click Feedback: Smooth pulse
  card.addEventListener("click", () => {
    gsap.fromTo(
      card,
      { scale: 1.12 },
      {
        scale: 1.04,
        duration: 0.16,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut"
      }
    );
  });
});

// ============================================================
// SCROLLTRIGGER: RESPONSIVE CARDS FAN OUT & WORDMARK SCALING
// ============================================================
const baseMoves = [
  { x: -220, y: -30, rot: -18 }, // 1 Terra Petra
  { x: -130, y: 15, rot: -10 },  // 2 Smoky Musk
  { x: -45, y: 55, rot: -4 },    // 3 Petralux
  { x: 45, y: 55, rot: 4 },      // 4 White Spark
  { x: 130, y: 15, rot: 10 },    // 5 Oud Rion
  { x: 220, y: -30, rot: 18 }    // 6 Wood Sera
];

ScrollTrigger.create({
  trigger: ".hero",
  start: "top top",
  end: "bottom top",
  scrub: 0.8,
  onUpdate: (self) => {
    const p = self.progress;

    // Wordmark scales up and softly dims
    gsap.set(".big-results", { scale: 1 + 0.14 * p, opacity: 1 - 0.45 * p });

    // Headline and kicker rise out
    gsap.set(".hero-header-wrap", { y: -65 * p, opacity: 1 - p * 1.6 });

    // Responsive spread factor based on screen width
    const w = window.innerWidth;
    const factor = w < 480 ? 0.32 : w < 768 ? 0.48 : w < 1024 ? 0.72 : 1;

    document.querySelectorAll(".card").forEach((card, i) => {
      const m = baseMoves[i];
      if (!m) return;
      const rest = parseFloat(card.dataset.restRot) || 0;
      gsap.set(card, {
        x: m.x * factor * p,
        y: m.y * factor * p,
        rotation: rest + m.rot * p
      });
    });

    gsap.set("#subline", { opacity: 1 - p * 2 });
  }
});

// ============================================================
// SECTION 2: MASTER EXTRAITS ARCHIVE REVEAL
// ============================================================
gsap.from(".eyebrow, .team-head h2, .team-head p", {
  opacity: 0,
  y: 30,
  duration: 0.9,
  stagger: 0.1,
  ease: "power3.out",
  scrollTrigger: { trigger: ".team-head", start: "top 80%" }
});

gsap.to(".t-card", {
  opacity: 1,
  y: 0,
  duration: 1,
  stagger: 0.07,
  ease: "power3.out",
  scrollTrigger: { trigger: ".team-grid", start: "top 80%" }
});

gsap.from(".t-card", {
  y: 70,
  scale: 0.92,
  rotation: (i) => (i % 2 === 0 ? -2.5 : 2.5),
  duration: 1,
  stagger: 0.07,
  ease: "back.out(1.2)",
  scrollTrigger: { trigger: ".team-grid", start: "top 80%" }
});

// ============================================================
// SECTION 3: STATS & BENCHMARK COUNTERS
// ============================================================
gsap.to(".stats-inner", {
  opacity: 1,
  y: 0,
  duration: 1.2,
  ease: "power3.out",
  scrollTrigger: { trigger: ".stats", start: "top 80%" }
});

gsap.from(".stats-inner", {
  y: 60,
  scale: 0.96,
  duration: 1.2,
  ease: "power3.out",
  scrollTrigger: { trigger: ".stats", start: "top 80%" }
});

ScrollTrigger.create({
  trigger: ".stats",
  start: "top 75%",
  onEnter: () => {
    document.querySelectorAll(".stat-block .num").forEach((el) => {
      const target = parseFloat(el.dataset.count);
      const span = el.querySelector("span");
      if (!span || isNaN(target)) return;

      gsap.to(
        { v: 0 },
        {
          v: target,
          duration: 2.2,
          ease: "power2.out",
          onUpdate: function () {
            span.textContent = Math.floor(this.targets()[0].v).toLocaleString();
          }
        }
      );
    });
  },
  once: true
});

// ============================================================
// BUTTON & CTA CLICK INTERACTIONS
// ============================================================
document.querySelectorAll(".nav-cta, .arrow-pill").forEach((btn) => {
  btn.addEventListener("click", () => {
    gsap.fromTo(
      btn,
      { scale: 1 },
      {
        scale: 0.94,
        duration: 0.12,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut"
      }
    );
  });
});

// Wordmark hover reaction
const bigWrap = document.querySelector(".big-results-wrap");
if (bigWrap) {
  bigWrap.addEventListener("mouseenter", () => {
    gsap.to(".big-results .letter", {
      y: -10,
      duration: 0.5,
      stagger: 0.02,
      ease: "back.out(1.6)"
    });
  });

  bigWrap.addEventListener("mouseleave", () => {
    gsap.to(".big-results .letter", {
      y: 0,
      duration: 0.6,
      stagger: 0.02,
      ease: "elastic.out(1, 0.6)"
    });
  });
}

// ============================================================
// MOBILE MENU CONTROLLER
// ============================================================
const mobileToggle = document.getElementById("mobileMenuToggle");
const mobileDrawer = document.getElementById("mobileDrawer");

function toggleMobileMenu() {
  if (!mobileDrawer) return;
  const isOpen = mobileDrawer.classList.contains("active");
  if (isOpen) {
    closeMobileMenu();
  } else {
    mobileDrawer.classList.add("active");
    if (mobileToggle) mobileToggle.classList.add("active");
  }
}

function closeMobileMenu() {
  if (mobileDrawer) mobileDrawer.classList.remove("active");
  if (mobileToggle) mobileToggle.classList.remove("active");
}

if (mobileToggle) {
  mobileToggle.addEventListener("click", toggleMobileMenu);
}

// Close drawer on resize to desktop
window.addEventListener("resize", () => {
  if (window.innerWidth > 768) {
    closeMobileMenu();
  }
});