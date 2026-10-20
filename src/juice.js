/**
 * @fileoverview Game Juice & Feel Layer for Cyber Arena: Neon Survival
 * - Trauma² Exponential Screen Shake
 * - Micro Hit-Stop for visceral impact weight (40ms - 70ms)
 * - Squash & Stretch elastic deformation
 * - Floating Combat Text (Damage, Criticals, Shield Absorption, Pickups)
 * - Haptic vibration feedback
 */

import { sanitize, clamp } from './physics.js';

export class CameraShaker {
  constructor() {
    this.trauma = 0;
    this.decay = 1.4; // Decay rate per second
    this.maxOffset = 22; // Max pixel offset
    this.maxAngle = 0.06; // Max rotation angle in radians
    this.offsetX = 0;
    this.offsetY = 0;
    this.angle = 0;
  }

  addTrauma(amount) {
    const safeAmt = sanitize(amount, 0);
    this.trauma = clamp(this.trauma + safeAmt, 0, 1.0);
  }

  update(dt) {
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - this.decay * dt);
      const shake = this.trauma * this.trauma; // Exponential square curve
      this.offsetX = (Math.random() * 2 - 1) * this.maxOffset * shake;
      this.offsetY = (Math.random() * 2 - 1) * this.maxOffset * shake;
      this.angle = (Math.random() * 2 - 1) * this.maxAngle * shake;
    } else {
      this.offsetX = 0;
      this.offsetY = 0;
      this.angle = 0;
    }
  }

  apply(ctx) {
    if (this.offsetX !== 0 || this.offsetY !== 0 || this.angle !== 0) {
      ctx.translate(this.offsetX, this.offsetY);
      ctx.rotate(this.angle);
    }
  }
}

export class HitStopManager {
  constructor() {
    this.isHitStopped = false;
    this.timeoutId = null;
  }

  trigger(durationMs = 50) {
    this.isHitStopped = true;
    if (this.timeoutId) clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(() => {
      this.isHitStopped = false;
      this.timeoutId = null;
    }, durationMs);
  }
}

export class SquashStretch {
  constructor() {
    this.scaleX = 1.0;
    this.scaleY = 1.0;
    this.targetX = 1.0;
    this.targetY = 1.0;
    this.vx = 0;
    this.vy = 0;
    this.spring = 240;
    this.damping = 18;
  }

  punch(sx, sy) {
    this.scaleX = sx;
    this.scaleY = sy;
  }

  update(dt) {
    // Spring physics towards target (1.0, 1.0)
    const ax = -this.spring * (this.scaleX - this.targetX) - this.damping * this.vx;
    const ay = -this.spring * (this.scaleY - this.targetY) - this.damping * this.vy;
    this.vx += ax * dt;
    this.vy += ay * dt;
    this.scaleX += this.vx * dt;
    this.scaleY += this.vy * dt;
  }
}

export class FloatingTextManager {
  constructor() {
    this.items = [];
  }

  reset() {
    this.items.length = 0;
  }

  spawn(text, x, y, color = '#ffffff', isCrit = false) {
    this.items.push({
      text,
      x: sanitize(x) + (Math.random() - 0.5) * 16,
      y: sanitize(y) - 10,
      vy: isCrit ? -70 : -45,
      color,
      isCrit,
      life: isCrit ? 0.8 : 0.6,
      maxLife: isCrit ? 0.8 : 0.6
    });
  }

  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.life -= dt;
      if (it.life <= 0) {
        this.items.splice(i, 1);
        continue;
      }
      it.y += it.vy * dt;
      it.vy *= 0.94;
    }
  }

  draw(ctx) {
    if (this.items.length === 0) return;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < this.items.length; i++) {
      const it = this.items[i];
      const prog = it.life / it.maxLife;
      const alpha = clamp(prog * prog, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.font = it.isCrit
        ? '900 18px "Orbitron", "Montserrat", sans-serif'
        : '800 13px "Orbitron", "Montserrat", sans-serif';
      ctx.fillStyle = it.color;
      ctx.shadowColor = it.color;
      ctx.shadowBlur = it.isCrit ? 16 : 8;
      ctx.fillText(it.text, it.x, it.y);
    }
    ctx.restore();
  }
}

export function triggerHaptic(durationMs = 25) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(durationMs);
    }
  } catch (_) {}
}

export const shaker = new CameraShaker();
export const hitStop = new HitStopManager();
export const floaters = new FloatingTextManager();
