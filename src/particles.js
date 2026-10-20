/**
 * @fileoverview High-Performance Procedural Particle System for Cyber Arena: Neon Survival
 * - Non-linear quadratic alpha fade for natural dissipations
 * - Optimized bounded particle pool (max 600 particles)
 * - Muzzle flashes, cyber dash afterimages, digital death disintegration, sparks, EMP rings
 */

import { sanitize, clamp } from './physics.js';

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.maxParticles = 600;
  }

  reset() {
    this.particles.length = 0;
  }

  spawnSparks(x, y, count = 12, color = '#00f5ff', speed = 240) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) this.particles.shift();
      const angle = Math.random() * Math.PI * 2;
      const spd = speed * (0.3 + Math.random() * 0.7);
      const life = 0.2 + Math.random() * 0.35;
      this.particles.push({
        type: 'spark',
        x: sanitize(x),
        y: sanitize(y),
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        radius: 1.5 + Math.random() * 2.5,
        color,
        life,
        maxLife: life
      });
    }
  }

  spawnMuzzleFlash(x, y, angle, color = '#00f5ff') {
    if (this.particles.length >= this.maxParticles) this.particles.shift();
    this.particles.push({
      type: 'muzzle',
      x: sanitize(x),
      y: sanitize(y),
      angle: sanitize(angle),
      radius: 14,
      color,
      life: 0.06,
      maxLife: 0.06
    });
  }

  spawnDashGhost(x, y, radius, angle, color = '#00f5ff') {
    if (this.particles.length >= this.maxParticles) this.particles.shift();
    this.particles.push({
      type: 'ghost',
      x: sanitize(x),
      y: sanitize(y),
      radius: sanitize(radius, 16),
      angle: sanitize(angle),
      color,
      life: 0.22,
      maxLife: 0.22
    });
  }

  spawnDisintegration(x, y, color = '#00f5ff', count = 20) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) this.particles.shift();
      const angle = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 180;
      const life = 0.4 + Math.random() * 0.4;
      this.particles.push({
        type: 'voxel',
        x: sanitize(x) + (Math.random() - 0.5) * 20,
        y: sanitize(y) + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: 3 + Math.random() * 4,
        rot: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 8,
        color,
        life,
        maxLife: life
      });
    }
  }

  spawnShockwave(x, y, maxRadius = 80, color = '#00f5ff', duration = 0.28) {
    if (this.particles.length >= this.maxParticles) this.particles.shift();
    this.particles.push({
      type: 'ring',
      x: sanitize(x),
      y: sanitize(y),
      curRadius: 8,
      maxRadius,
      color,
      life: duration,
      maxLife: duration
    });
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      if (p.type === 'spark') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.94;
        p.vy *= 0.94;
      } else if (p.type === 'voxel') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vrot * dt;
        p.vx *= 0.92;
        p.vy *= 0.92;
      } else if (p.type === 'ring') {
        const prog = 1 - p.life / p.maxLife;
        p.curRadius = 8 + (p.maxRadius - 8) * prog;
      }
    }
  }

  draw(ctx) {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const prog = p.life / p.maxLife;
      // Non-linear fade: alpha = prog^2
      const alpha = clamp(prog * prog, 0, 1);

      ctx.save();
      ctx.globalAlpha = alpha;

      if (p.type === 'spark') {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'muzzle') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(p.radius * 1.5, -p.radius * 0.5);
        ctx.lineTo(p.radius * 2.2, 0);
        ctx.lineTo(p.radius * 1.5, p.radius * 0.5);
        ctx.closePath();
        ctx.fill();
      } else if (p.type === 'ghost') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'voxel') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.fillRect(-p.size * 0.5, -p.size * 0.5, p.size, p.size);
      } else if (p.type === 'ring') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3 * prog;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.curRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    }
  }
}

export const particles = new ParticleSystem();
