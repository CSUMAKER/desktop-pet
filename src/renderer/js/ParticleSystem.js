/**
 * Particle System - Canvas-based particle effects
 * Emits sparkles, hearts, and Zzz characters based on pet state
 */
class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.maxParticles = 150;
    this.running = false;
    this.animationId = null;
    this.continuousType = null;
    this.spawnRate = 0.15; // probability per frame
  }

  /** Resize canvas to match window */
  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = Math.max(rect.width || 50, 50);
    this.canvas.height = Math.max(rect.height || 50, 50);
  }

  /** Start continuous particle emission for a given type */
  startContinuous(type, rate = 0.15) {
    this.continuousType = type;
    this.spawnRate = rate;
    if (!this.running) this.start();
  }

  /** Stop continuous particle emission */
  stopContinuous() {
    this.continuousType = null;
  }

  /** Emit a burst of particles */
  emit(type, count, originX, originY) {
    for (let i = 0; i < count; i++) {
      this.particles.push(this._createParticle(type, originX, originY));
    }
    // Cap particle count
    if (this.particles.length > this.maxParticles) {
      this.particles = this.particles.slice(-this.maxParticles);
    }
    if (!this.running) this.start();
  }

  /** Create a single particle */
  _createParticle(type, ox, oy) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.3 + Math.random() * 1.5;

    const configs = {
      sparkle: {
        vx: Math.cos(angle) * speed * 0.3,
        vy: -speed * (0.3 + Math.random() * 0.5),
        decay: 0.015 + Math.random() * 0.02,
        size: 2 + Math.random() * 3,
        color: Math.random() > 0.5 ? '#FFD700' : '#FFFFFF',
      },
      heart: {
        vx: Math.cos(angle) * speed * 0.8,
        vy: Math.sin(angle) * speed * 0.8 - 0.5,
        decay: 0.015 + Math.random() * 0.015,
        size: 3 + Math.random() * 4,
        color: Math.random() > 0.3 ? '#FF69B4' : '#FF1493',
      },
      zzz: {
        vx: (Math.random() - 0.5) * 0.3,
        vy: -0.2 - Math.random() * 0.3,
        decay: 0.008 + Math.random() * 0.008,
        size: 6 + Math.random() * 4,
        color: '#8888CC',
      },
    };

    const config = configs[type] || configs.sparkle;

    return {
      x: ox + (Math.random() - 0.5) * 6,
      y: oy + (Math.random() - 0.5) * 6,
      vx: config.vx,
      vy: config.vy,
      type,
      life: 1.0,
      decay: config.decay,
      size: config.size,
      color: config.color,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.05,
      text: type === 'zzz' ? 'Z' : null,
    };
  }

  /** Start the particle animation loop */
  start() {
    this.running = true;
    this._update();
  }

  /** Main update loop */
  _update() {
    if (!this.running) return;

    this._spawnContinuous();
    this._updateParticles();
    this._render();

    this.animationId = requestAnimationFrame(() => this._update());
  }

  /** Spawn continuous particles based on current state */
  _spawnContinuous() {
    if (!this.continuousType) return;

    if (Math.random() < this.spawnRate) {
      const petContainer = document.getElementById('pet-container');
      if (!petContainer) return;

      const rect = petContainer.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      this.emit(this.continuousType, 1, cx, cy);
    }
  }

  /** Update particle positions and lifetimes */
  _updateParticles() {
    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy -= 0.01; // slight upward drift
      p.life -= p.decay;
      p.rotation += p.rotSpeed;
      return p.life > 0;
    });
  }

  /** Render all particles to canvas */
  _render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (const p of this.particles) {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.life);
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);

      if (p.type === 'zzz') {
        this._drawText(p.text, p.size, p.color);
      } else {
        this._drawShape(p.type, p.size, p.color);
      }

      this.ctx.restore();
    }
  }

  /** Draw a sparkle/star shape */
  _drawShape(type, size, color) {
    this.ctx.fillStyle = color;

    if (type === 'heart') {
      this._drawHeart(size);
    } else {
      // 4-point star/sparkle
      this.ctx.beginPath();
      const spikes = 4;
      const outerRadius = size;
      const innerRadius = size * 0.3;

      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI) / spikes - Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }

      this.ctx.closePath();
      this.ctx.fill();
    }
  }

  /** Draw a heart shape */
  _drawHeart(size) {
    this.ctx.beginPath();
    const s = size * 0.5;
    this.ctx.moveTo(0, s * 0.3);
    this.ctx.bezierCurveTo(-s, -s * 0.5, -s * 0.5, -s, 0, -s * 0.4);
    this.ctx.bezierCurveTo(s * 0.5, -s, s, -s * 0.5, 0, s * 0.3);
    this.ctx.closePath();
    this.ctx.fill();
  }

  /** Draw text (for Zzz particles) */
  _drawText(text, size, color) {
    this.ctx.font = `bold ${size}px serif`;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, 0, 0);
  }

  /** Stop the particle system */
  stop() {
    this.running = false;
    this.continuousType = null;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.particles = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
