/**
 * @fileoverview Cinematic Intro & FluidCleb Interactive Splash Screen for Cyber Arena: Neon Survival
 *
 * 1. Official FluidCleb Interactive Splash (0.0s to 2.8s):
 *    - Cosmic orbs (#00f5ff, #38bdf8, #0284c7) converging
 *    - Central fusion flash with shockwave ring and radiant sparks
 *    - Metallic water droplet emblem (#94a3b8) with liquid cyan core
 *    - Neon cyan typography 'FLUIDCLEB' and 'INTERACTIVE'
 *    - Procedural synthetic audio cues
 * 2. Interactive 3-Act Lore Presentation (2.8s+) with prominent 'Skip Story ➔' button
 *    allowing immediate entry into gameplay in at most 1 click (CrazyGames Land in Gameplay rule).
 */

import { sound } from './audio.js';
import { i18n } from './i18n.js';

export class CinematicIntro {
  constructor(containerOrOptions, maybeOnComplete) {
    if (containerOrOptions && (containerOrOptions instanceof HTMLElement || containerOrOptions.nodeType === 1)) {
      this.container = containerOrOptions;
      this.onComplete = maybeOnComplete || null;
    } else if (containerOrOptions && typeof containerOrOptions === 'object') {
      this.container = containerOrOptions.container || document.body;
      this.onComplete = containerOrOptions.onComplete || maybeOnComplete || null;
    } else {
      this.container = document.body;
      this.onComplete = maybeOnComplete || null;
    }

    this.canvas = null;
    this.ctx = null;
    this.animId = null;
    this.startTime = null;
    this.finished = false;

    this.sound1Played = false;
    this.sound2Played = false;
    this.sound3Played = false;

    this.phase = 'splash'; // 'splash' (0.0s - 2.8s) -> 'lore' (2.8s+)
    this.loreStartTime = null;
    this.loreAct = 1;

    this.particles = [];
    for (let i = 0; i < 70; i++) {
      this.particles.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 2.6 + 0.8,
        speedX: (Math.random() - 0.5) * 0.04,
        speedY: -Math.random() * 0.06 - 0.015,
        color: ['#00f5ff', '#38bdf8', '#a855f7', '#facc15', '#f43f5e'][Math.floor(Math.random() * 5)],
        alpha: Math.random() * 0.65 + 0.25,
        pulse: Math.random() * Math.PI * 2
      });
    }

    this.initDOM();
  }

  initDOM() {
    this.wrapper = document.createElement('div');
    this.wrapper.id = 'cinematic-overlay';
    this.wrapper.style.cssText = `
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      z-index: 99999;
      background: #030712;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      user-select: none;
      touch-action: none;
      overflow: hidden;
      font-family: 'Montserrat', sans-serif;
    `;

    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = 'position: absolute; inset: 0; width: 100%; height: 100%; display: block;';
    this.ctx = this.canvas.getContext('2d');
    this.wrapper.appendChild(this.canvas);

    // Progress bar for 0.0s - 2.8s splash
    this.progressWrap = document.createElement('div');
    this.progressWrap.style.cssText = `
      position: absolute;
      bottom: 36px;
      width: 240px;
      height: 5px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 999px;
      overflow: hidden;
      z-index: 10;
    `;
    this.progressFill = document.createElement('div');
    this.progressFill.style.cssText = `
      width: 0%;
      height: 100%;
      background: linear-gradient(90deg, #0284c7, #00f5ff);
      box-shadow: 0 0 12px #00f5ff;
    `;
    this.progressWrap.appendChild(this.progressFill);
    this.wrapper.appendChild(this.progressWrap);

    // Persistent 1-Click Skip Button (Always visible for CrazyGames Land in Gameplay compliance)
    this.skipBtn = document.createElement('button');
    this.skipBtn.id = 'btn-skip-intro';
    this.skipBtn.textContent = i18n.t('skipStory');
    this.skipBtn.style.cssText = `
      position: absolute;
      top: 22px;
      right: 24px;
      z-index: 30;
      min-height: 48px;
      padding: 10px 22px;
      background: rgba(15, 23, 42, 0.85);
      border: 2px solid #00f5ff;
      border-radius: 10px;
      color: #00f5ff;
      font-family: 'Montserrat', sans-serif;
      font-weight: 800;
      font-size: 13px;
      letter-spacing: 1px;
      cursor: pointer;
      box-shadow: 0 0 18px rgba(0, 245, 255, 0.3);
      transition: transform 0.15s, background 0.15s;
    `;
    this.skipBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.finish();
    });
    this.wrapper.appendChild(this.skipBtn);

    // Lore Card Container (shown at t >= 2.8s)
    this.loreCard = document.createElement('div');
    this.loreCard.id = 'lore-presentation-card';
    this.loreCard.style.cssText = `
      position: relative;
      z-index: 20;
      max-width: 600px;
      width: calc(100% - 40px);
      padding: 28px 32px;
      background: rgba(7, 13, 28, 0.92);
      border: 1px solid rgba(0, 245, 255, 0.35);
      border-radius: 18px;
      box-shadow: 0 18px 50px rgba(0, 0, 0, 0.8), 0 0 35px rgba(0, 245, 255, 0.15);
      backdrop-filter: blur(10px);
      text-align: center;
      display: none;
      flex-direction: column;
      gap: 16px;
      align-items: center;
    `;

    this.loreBadge = document.createElement('div');
    this.loreBadge.style.cssText = `
      font-size: 12px;
      font-weight: 800;
      color: #38bdf8;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      font-family: 'Orbitron', sans-serif;
    `;
    this.loreBadge.textContent = i18n.t('subtitle');

    this.loreTitle = document.createElement('h2');
    this.loreTitle.style.cssText = `
      margin: 0;
      font-size: clamp(18px, 3.2vw, 24px);
      font-weight: 900;
      color: #f8fafc;
      font-family: 'Orbitron', sans-serif;
      text-shadow: 0 0 15px rgba(0, 245, 255, 0.5);
    `;

    this.loreText = document.createElement('p');
    this.loreText.style.cssText = `
      margin: 0;
      font-size: clamp(14px, 2.2vw, 16px);
      line-height: 1.6;
      color: #cbd5e1;
      font-weight: 600;
    `;

    this.loreDots = document.createElement('div');
    this.loreDots.style.cssText = 'display: flex; gap: 10px; margin: 4px 0;';
    this.dots = [1, 2, 3].map(() => {
      const d = document.createElement('span');
      d.style.cssText = 'width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,0.2); transition: all 0.25s;';
      this.loreDots.appendChild(d);
      return d;
    });

    this.loreActionRow = document.createElement('div');
    this.loreActionRow.style.cssText = 'display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; margin-top: 6px;';

    this.nextActBtn = document.createElement('button');
    this.nextActBtn.id = 'btn-lore-next';
    this.nextActBtn.style.cssText = `
      min-height: 48px;
      padding: 12px 26px;
      background: linear-gradient(135deg, #0284c7, #00f5ff);
      border: none;
      border-radius: 10px;
      color: #020617;
      font-family: 'Montserrat', sans-serif;
      font-weight: 900;
      font-size: 14px;
      letter-spacing: 1px;
      cursor: pointer;
      box-shadow: 0 0 22px rgba(0, 245, 255, 0.45);
    `;
    this.nextActBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      if (this.loreAct < 3) {
        this.setLoreAct(this.loreAct + 1);
      } else {
        this.finish();
      }
    });

    this.playNowBtn = document.createElement('button');
    this.playNowBtn.id = 'btn-lore-play-now';
    this.playNowBtn.textContent = i18n.t('startGame');
    this.playNowBtn.style.cssText = `
      min-height: 48px;
      padding: 12px 24px;
      background: rgba(34, 197, 94, 0.18);
      border: 2px solid #22c55e;
      border-radius: 10px;
      color: #4ade80;
      font-family: 'Montserrat', sans-serif;
      font-weight: 800;
      font-size: 14px;
      letter-spacing: 1px;
      cursor: pointer;
    `;
    this.playNowBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.finish();
    });

    this.loreActionRow.appendChild(this.nextActBtn);
    this.loreActionRow.appendChild(this.playNowBtn);

    this.loreCard.appendChild(this.loreBadge);
    this.loreCard.appendChild(this.loreTitle);
    this.loreCard.appendChild(this.loreText);
    this.loreCard.appendChild(this.loreDots);
    this.loreCard.appendChild(this.loreActionRow);
    this.wrapper.appendChild(this.loreCard);

    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);
  }

  setLoreAct(actNum) {
    this.loreAct = actNum;
    this.loreStartTime = performance.now();
    if (actNum === 1) {
      this.loreTitle.textContent = i18n.t('loreAct1Title');
      this.loreText.textContent = i18n.t('loreAct1Text');
      this.nextActBtn.textContent = i18n.t('continueBtn');
    } else if (actNum === 2) {
      this.loreTitle.textContent = i18n.t('loreAct2Title');
      this.loreText.textContent = i18n.t('loreAct2Text');
      this.nextActBtn.textContent = i18n.t('continueBtn');
    } else {
      this.loreTitle.textContent = i18n.t('loreAct3Title');
      this.loreText.textContent = i18n.t('loreAct3Text');
      this.nextActBtn.textContent = i18n.t('startGame');
    }
    this.dots.forEach((dot, idx) => {
      const active = idx + 1 === actNum;
      dot.style.background = active ? '#00f5ff' : 'rgba(255,255,255,0.25)';
      dot.style.boxShadow = active ? '0 0 10px #00f5ff' : 'none';
      dot.style.transform = active ? 'scale(1.3)' : 'scale(1)';
    });
  }

  resize() {
    if (!this.canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.floor(window.innerWidth * dpr);
    this.canvas.height = Math.floor(window.innerHeight * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  start() {
    this.container.appendChild(this.wrapper);
    this.resize();
    this.startTime = performance.now();
    this.animId = requestAnimationFrame((ts) => this.loop(ts));
  }

  loop(timestamp) {
    if (this.finished) return;
    const elapsedSec = (timestamp - this.startTime) / 1000;

    if (this.phase === 'splash') {
      const pct = Math.min(100, (elapsedSec / 2.8) * 100);
      this.progressFill.style.width = `${pct}%`;

      if (elapsedSec >= 0.05 && !this.sound1Played) {
        this.sound1Played = true;
        sound.playFluidClebIntro();
      }
      if (elapsedSec >= 1.0 && !this.sound2Played) {
        this.sound2Played = true;
        sound.playFluidClebFusion();
      }
      if (elapsedSec >= 1.55 && !this.sound3Played) {
        this.sound3Played = true;
        sound.playFluidClebEject();
      }

      this.renderFluidClebSplash(elapsedSec);

      if (elapsedSec >= 2.8) {
        this.phase = 'lore';
        this.progressWrap.style.display = 'none';
        this.loreCard.style.display = 'flex';
        this.setLoreAct(1);
      }
    } else {
      // Lore phase
      const actElapsed = (timestamp - this.loreStartTime) / 1000;
      if (actElapsed > 4.2) {
        if (this.loreAct < 3) {
          this.setLoreAct(this.loreAct + 1);
        }
      }
      this.renderLoreBackdrop(elapsedSec);
    }

    this.animId = requestAnimationFrame((ts) => this.loop(ts));
  }

  renderFluidClebSplash(t) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const ctx = this.ctx;
    const cx = w * 0.5;
    const cy = h * 0.45;

    // Deep cosmic background
    const bgGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(w, h) * 0.75);
    bgGrad.addColorStop(0, '#08142c');
    bgGrad.addColorStop(0.6, '#030816');
    bgGrad.addColorStop(1, '#01030a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Floating cosmic particles
    this.particles.forEach((p) => {
      p.y += p.speedY * 0.016;
      if (p.y < 0) p.y = 1;
      const px = p.x * w;
      const py = p.y * h;
      ctx.save();
      ctx.globalAlpha = p.alpha * (0.6 + 0.4 * Math.sin(t * 3 + p.pulse));
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(px, py, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Phase 1 (0.0s - 1.25s): Cosmic orbs (#00f5ff, #38bdf8, #0284c7) converging
    if (t < 1.25) {
      const prog = Math.min(1, t / 1.05);
      const ease = 1 - Math.pow(1 - prog, 3);
      const orbColors = ['#00f5ff', '#38bdf8', '#0284c7', '#00f5ff', '#38bdf8', '#0284c7'];
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + t * 3.2;
        const dist = (1 - ease) * 170;
        const ox = cx + Math.cos(angle) * dist;
        const oy = cy + Math.sin(angle) * dist;
        const radius = 14 + ease * 8;

        ctx.save();
        ctx.shadowColor = '#00f5ff';
        ctx.shadowBlur = 22;
        ctx.fillStyle = orbColors[i];
        ctx.beginPath();
        ctx.arc(ox, oy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Phase 2 (1.0s - 2.8s): Central fusion shockwave + Metallic Droplet (#94a3b8) + Neon Logo
    if (t >= 0.95) {
      const fTime = t - 0.95;
      const ringRadius = Math.min(280, fTime * 260);
      const ringAlpha = Math.max(0, 1 - fTime * 0.9);

      if (ringAlpha > 0) {
        ctx.save();
        ctx.strokeStyle = `rgba(0, 245, 255, ${ringAlpha})`;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Metallic Water Droplet Emblem (#94a3b8 / #0284c7 / #00f5ff)
      const scale = Math.min(1, fTime * 2.5);
      ctx.save();
      ctx.translate(cx, cy - 18);
      ctx.scale(scale, scale);

      // Outer metallic chrome shell (#94a3b8)
      ctx.shadowColor = '#00f5ff';
      ctx.shadowBlur = 28;
      const dropGrad = ctx.createLinearGradient(-35, -55, 35, 45);
      dropGrad.addColorStop(0, '#e2e8f0');
      dropGrad.addColorStop(0.45, '#94a3b8');
      dropGrad.addColorStop(1, '#0284c7');

      ctx.fillStyle = dropGrad;
      ctx.beginPath();
      ctx.moveTo(0, -56);
      ctx.bezierCurveTo(36, -12, 42, 22, 0, 44);
      ctx.bezierCurveTo(-42, 22, -36, -12, 0, -56);
      ctx.closePath();
      ctx.fill();

      // Inner liquid cyan core (#00f5ff / #38bdf8)
      const innerGrad = ctx.createRadialGradient(0, 10, 2, 0, 10, 24);
      innerGrad.addColorStop(0, '#ffffff');
      innerGrad.addColorStop(0.4, '#00f5ff');
      innerGrad.addColorStop(1, '#0284c7');
      ctx.fillStyle = innerGrad;
      ctx.beginPath();
      ctx.arc(0, 10, 17, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Neon Text: FLUIDCLEB INTERACTIVE
      const textAlpha = Math.min(1, Math.max(0, (t - 1.15) * 2.2));
      ctx.save();
      ctx.globalAlpha = textAlpha;
      ctx.textAlign = 'center';

      ctx.shadowColor = '#00f5ff';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#f8fafc';
      ctx.font = '900 clamp(20px, 4.2vw, 32px) "Orbitron", "Montserrat", sans-serif';
      ctx.letterSpacing = '4px';
      ctx.fillText('FLUIDCLEB', cx, cy + 85);

      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#00f5ff';
      ctx.font = '800 clamp(10px, 2.2vw, 15px) "Orbitron", "Montserrat", sans-serif';
      ctx.letterSpacing = '6px';
      ctx.fillText('INTERACTIVE', cx, cy + 112);
      ctx.restore();
    }
  }

  renderLoreBackdrop(t) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const ctx = this.ctx;

    // Ambient cyberpunk background
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, w, h);

    // Drifting particles
    this.particles.forEach((p) => {
      p.y += p.speedY * 0.016;
      if (p.y < 0) p.y = 1;
      const px = p.x * w;
      const py = p.y * h;
      ctx.save();
      ctx.globalAlpha = p.alpha * 0.4;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(px, py, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  finish() {
    if (this.finished) return;
    this.finished = true;
    if (this.animId) cancelAnimationFrame(this.animId);
    window.removeEventListener('resize', this._onResize);

    // Fade out wrapper smoothly
    this.wrapper.style.transition = 'opacity 0.35s ease-out';
    this.wrapper.style.opacity = '0';
    setTimeout(() => {
      if (this.wrapper.parentNode) {
        this.wrapper.parentNode.removeChild(this.wrapper);
      }
      if (this.onComplete) this.onComplete();
    }, 360);
  }
}
