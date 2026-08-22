/* ==========================================================================
   MYTHOLIS LUXURY PERFUME - CANVAS BACKGROUND ANIMATION
   Interactive Liquid Emerald Fluid Mesh, Ripple Pulses & Floating Golden Stardust
   ========================================================================== */

class MytholisBackground {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    this.particles = [];
    this.ripples = [];
    this.numParticles = 65;
    this.mouse = { 
      x: window.innerWidth / 2, 
      y: window.innerHeight / 2, 
      targetX: window.innerWidth / 2, 
      targetY: window.innerHeight / 2,
      vx: 0,
      vy: 0,
      lastX: window.innerWidth / 2,
      lastY: window.innerHeight / 2
    };
    this.time = 0;

    this.resize();
    this.initParticles();
    this.bindEvents();
    this.animate();
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());
    
    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = e.clientX;
      this.mouse.targetY = e.clientY;
    });

    window.addEventListener('pointerdown', (e) => {
      this.addRipple(e.clientX, e.clientY);
    });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        this.mouse.targetX = e.touches[0].clientX;
        this.mouse.targetY = e.touches[0].clientY;
      }
    }, { passive: true });
  }

  addRipple(x, y) {
    this.ripples.push({
      x,
      y,
      radius: 5,
      maxRadius: 160,
      alpha: 0.5,
      speed: 3
    });
    if (this.ripples.length > 8) this.ripples.shift();
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < this.numParticles; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: Math.random() * 2.8 + 0.8,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45 - 0.15,
        alpha: Math.random() * 0.7 + 0.2,
        pulseSpeed: Math.random() * 0.03 + 0.015,
        color: Math.random() > 0.3 ? '#D4AF37' : '#F6E6B4'
      });
    }
  }

  drawFluidMesh() {
    this.time += 0.006;
    
    // Create animated dark emerald fluid background gradients
    const grad1 = this.ctx.createRadialGradient(
      this.mouse.x, this.mouse.y, 40,
      this.width * 0.5, this.height * 0.5, Math.max(this.width, this.height) * 0.85
    );
    grad1.addColorStop(0, 'rgba(14, 66, 51, 0.28)');
    grad1.addColorStop(0.45, 'rgba(4, 24, 18, 0.42)');
    grad1.addColorStop(1, 'rgba(2, 12, 9, 0.96)');

    this.ctx.fillStyle = grad1;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Dynamic fluid auroral wave
    const waveX = Math.sin(this.time * 0.8) * 160 + this.width * 0.5;
    const waveY = Math.cos(this.time * 0.6) * 120 + this.height * 0.4;
    const waveGrad = this.ctx.createRadialGradient(waveX, waveY, 15, waveX, waveY, 450);
    waveGrad.addColorStop(0, 'rgba(212, 175, 55, 0.1)');
    waveGrad.addColorStop(0.55, 'rgba(8, 41, 31, 0.06)');
    waveGrad.addColorStop(1, 'transparent');

    this.ctx.fillStyle = waveGrad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw interaction ripples
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.radius += r.speed;
      r.alpha *= 0.96;

      this.ctx.save();
      this.ctx.strokeStyle = `rgba(212, 175, 55, ${r.alpha})`;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();

      if (r.alpha < 0.02 || r.radius > r.maxRadius) {
        this.ripples.splice(i, 1);
      }
    }
  }

  animate() {
    // Smooth velocity lerp for cursor
    this.mouse.vx = this.mouse.targetX - this.mouse.lastX;
    this.mouse.vy = this.mouse.targetY - this.mouse.lastY;
    this.mouse.lastX = this.mouse.targetX;
    this.mouse.lastY = this.mouse.targetY;

    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.08;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.08;

    this.ctx.clearRect(0, 0, this.width, this.height);
    this.drawFluidMesh();

    // Render golden stardust particles with fluid interactive physics
    for (let p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha += Math.sin(this.time * 8 * p.pulseSpeed) * 0.006;

      // Wrap around edges
      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) p.y = this.height;
      if (p.y > this.height) p.y = 0;

      // Interactive gentle cursor repulsion / vortex pull
      const dx = this.mouse.x - p.x;
      const dy = this.mouse.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 220 && dist > 1) {
        const force = (220 - dist) / 220;
        p.x += (dx / dist) * force * 1.2;
        p.y += (dy / dist) * force * 1.2;
      }

      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0.12, Math.min(0.95, p.alpha));
      this.ctx.fillStyle = p.color;
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = '#D4AF37';
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    requestAnimationFrame(() => this.animate());
  }
}
