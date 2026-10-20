/**
 * @fileoverview Decoupled 3-Row Flex Column HUD & Anti-Softlock Modal Controller
 * - Row 1 (#hud-top-bar): Sector info, alive counter, kills, and live 3-Star progress bar
 * - Row 2 (#canvas-wrap): Full-bleed canvas via ResizeObserver & devicePixelRatio
 * - Row 3 (#hud-bottom-bar): Tactical status, dash cooldown, meta shortcuts & kinomuse.com.br
 * - Central ModalController with modal stack to prevent softlocks
 * - Level Select with visual cards and 3 stars (ASCII ★/☆ safe rendering)
 */

import { i18n } from './i18n.js';
import { storage } from './storage.js';
import { sound } from './audio.js';
import { SECTORS } from './levels.js';
import { MAPS } from './maps.js';
import { shop } from './shop.js';
import { dailyRewards } from './daily_rewards.js';
import { quests } from './quests.js';
import { luckySpin, SPIN_SEGMENTS } from './lucky_spin.js';
import { clamp } from './physics.js';

export class ModalController {
  constructor(hud) {
    this.hud = hud;
    this.modalStack = [];
    this.modals = new Map();
  }

  register(id, element) {
    this.modals.set(id, element);
  }

  open(id) {
    const el = this.modals.get(id);
    if (!el) return;

    // Hide top modal if any
    if (this.modalStack.length > 0) {
      const topId = this.modalStack[this.modalStack.length - 1];
      const topEl = this.modals.get(topId);
      if (topEl) topEl.classList.add('hidden');
    }

    this.modalStack.push(id);
    el.classList.remove('hidden');
    sound.playClick();
  }

  close(id) {
    const el = this.modals.get(id);
    if (el) el.classList.add('hidden');

    this.modalStack = this.modalStack.filter((m) => m !== id);

    // If modal stack still has items, show the previous modal
    if (this.modalStack.length > 0) {
      const prevId = this.modalStack[this.modalStack.length - 1];
      const prevEl = this.modals.get(prevId);
      if (prevEl) prevEl.classList.remove('hidden');
    } else {
      // Anti-softlock check: If round is over and all modals were closed, restore victory/defeat!
      if (this.hud.callbacks.isRoundOver && this.hud.callbacks.isRoundOver()) {
        const lastResult = this.hud.lastRoundResult;
        if (lastResult === 'win') {
          this.open('modal-victory');
        } else if (lastResult === 'lose') {
          this.open('modal-defeat');
        }
      } else {
        if (this.hud.callbacks.onResume) {
          this.hud.callbacks.onResume();
        }
      }
    }
  }

  closeAll() {
    this.modalStack.length = 0;
    this.modals.forEach((el) => el.classList.add('hidden'));
  }

  hasOpenModal() {
    return this.modalStack.length > 0;
  }
}

export class GameHUD {
  constructor(container, callbacks) {
    this.container = container;
    this.callbacks = callbacks || {};
    this.lastRoundResult = null;
    this.modalCtrl = new ModalController(this);

    // Touch controls state
    this.touchJoyActive = false;
    this.touchJoyStart = { x: 0, y: 0 };
    this.touchJoyDir = { x: 0, y: 0 };

    this.initDOM();
  }

  initDOM() {
    // -----------------------------------------------------------
    // ROW 1: TOP HUD BAR
    // -----------------------------------------------------------
    this.topBar = document.createElement('div');
    this.topBar.id = 'hud-top-bar';
    this.topBar.innerHTML = `
      <div class="top-bar-left">
        <div class="badge badge-map" id="hud-map-name">🏙️ NEON DISTRICT</div>
        <div class="badge badge-sector" id="hud-sector-name">SECTOR 01</div>
        <div class="badge badge-alive" id="hud-alive-count">ALIVE: 16</div>
        <div class="badge badge-kills" id="hud-kills-count">KILLS: 0</div>
      </div>

      <div class="top-bar-center">
        <div class="stars-progress-wrap">
          <div class="stars-track">
            <div class="stars-fill" id="hud-stars-fill" style="width: 0%;"></div>
            <div class="star-marker marker-1" id="star-m1">★</div>
            <div class="star-marker marker-2" id="star-m2">★</div>
            <div class="star-marker marker-3" id="star-m3">★</div>
          </div>
          <button class="btn-early-complete hidden" id="btn-early-complete">
            ${i18n.t('completeSectorBtn')}
          </button>
        </div>
      </div>

      <div class="top-bar-right">
        <button class="hud-icon-btn" id="btn-lang-toggle" title="Language">EN</button>
        <button class="hud-icon-btn" id="btn-sound-toggle" title="Mute Audio">🔊</button>
        <button class="hud-icon-btn" id="btn-pause-game" title="Pause">II</button>
      </div>
    `;
    this.container.prepend(this.topBar);

    // -----------------------------------------------------------
    // ROW 3: BOTTOM HUD BAR (TACTICAL FOOTER)
    // -----------------------------------------------------------
    this.bottomBar = document.createElement('div');
    this.bottomBar.id = 'hud-bottom-bar';
    this.bottomBar.innerHTML = `
      <div class="bottom-bar-left">
        <div class="weapon-hud-card" id="hud-weapon-card">
          <span class="weapon-icon" id="hud-weapon-icon">🔫</span>
          <div class="weapon-info">
            <span class="weapon-title" id="hud-weapon-name">NEON BLASTER</span>
            <span class="weapon-ammo" id="hud-weapon-ammo">15 / ∞</span>
          </div>
        </div>
        <div class="dash-cooldown-ring" id="hud-dash-ring" title="Cyber Dash (SPACE / SHIFT)">
          <div class="dash-ring-fill" id="hud-dash-fill"></div>
          <span class="dash-label">DASH</span>
        </div>
      </div>

      <div class="bottom-bar-center">
        <button class="tactical-btn" id="btn-open-maps">🗺️ ${i18n.t('mapsSelect')}</button>
        <button class="tactical-btn" id="btn-open-shop">🛒 ${i18n.t('upgradesTab')}</button>
        <button class="tactical-btn" id="btn-open-quests">🎯 ${i18n.t('questsTitle')}</button>
        <button class="tactical-btn" id="btn-open-daily">🎁 ${i18n.t('dailyTitle')}</button>
        <button class="tactical-btn" id="btn-open-spin">🎡 ${i18n.t('luckySpinTitle')}</button>
      </div>

      <div class="bottom-bar-right">
        <a href="https://kinomuse.com.br" target="_blank" rel="noopener noreferrer" class="kinomuse-link" title="Kinomuse Entertainment">
          KINOMUSE.COM.BR
        </a>
      </div>
    `;
    this.container.appendChild(this.bottomBar);

    // -----------------------------------------------------------
    // TOUCH CONTROLS OVERLAY (MOBILE)
    // -----------------------------------------------------------
    this.touchLayer = document.createElement('div');
    this.touchLayer.id = 'touch-controls-layer';
    this.touchLayer.innerHTML = `
      <div class="touch-joystick-zone" id="touch-joy-zone">
        <div class="touch-joy-base" id="touch-joy-base">
          <div class="touch-joy-knob" id="touch-joy-knob"></div>
        </div>
      </div>
      <div class="touch-actions-zone">
        <button class="touch-act-btn touch-btn-heal" id="btn-touch-heal">✚</button>
        <button class="touch-act-btn touch-btn-dash" id="btn-touch-dash">⚡</button>
        <button class="touch-act-btn touch-btn-fire" id="btn-touch-fire">🎯</button>
      </div>
    `;
    this.container.appendChild(this.touchLayer);

    // -----------------------------------------------------------
    // MODALS INITIALIZATION
    // -----------------------------------------------------------
    this.initModals();
    this.bindEvents();
  }

  initModals() {
    this.modalLayer = document.createElement('div');
    this.modalLayer.id = 'modal-container';
    this.container.appendChild(this.modalLayer);

    // 1. Victory Modal
    this.modalVictory = this.createModalElement('modal-victory', `
      <div class="modal-box modal-victory-box">
        <h2 class="modal-title modal-title-gold">${i18n.t('victoryTitle')}</h2>
        <p class="modal-desc">${i18n.t('victorySubtitle')}</p>
        <div class="victory-stars-row" id="vic-stars-row">
          <span class="vic-star" id="vic-star-1">★</span>
          <span class="vic-star" id="vic-star-2">★</span>
          <span class="vic-star" id="vic-star-3">★</span>
        </div>
        <div class="modal-stats-grid">
          <div class="stat-pill"><span class="stat-label">${i18n.t('kills')}</span><span class="stat-val" id="vic-kills">0</span></div>
          <div class="stat-pill"><span class="stat-label">${i18n.t('scoreEarned')}</span><span class="stat-val" id="vic-score">0</span></div>
          <div class="stat-pill"><span class="stat-label">${i18n.t('creditsEarned')}</span><span class="stat-val stat-val-gold" id="vic-credits">+100</span></div>
        </div>
        <div class="modal-actions-column">
          <button class="btn-modal btn-primary" id="btn-vic-next">${i18n.t('nextSectorBtn')}</button>
          <button class="btn-modal btn-rewarded" id="btn-vic-double">${i18n.t('doubleCreditsBtn')}</button>
          <div class="modal-actions-row">
            <button class="btn-modal btn-secondary" id="btn-vic-restart">${i18n.t('restart')}</button>
            <button class="btn-modal btn-secondary" id="btn-vic-sectors">${i18n.t('menu')}</button>
          </div>
        </div>
      </div>
    `);

    // 2. Defeat Modal
    this.modalDefeat = this.createModalElement('modal-defeat', `
      <div class="modal-box modal-defeat-box">
        <h2 class="modal-title modal-title-red">${i18n.t('defeatTitle')}</h2>
        <p class="modal-desc">${i18n.t('defeatSubtitle')}</p>
        <div class="modal-stats-grid">
          <div class="stat-pill"><span class="stat-label">${i18n.t('kills')}</span><span class="stat-val" id="def-kills">0</span></div>
          <div class="stat-pill"><span class="stat-label">${i18n.t('timeElapsed')}</span><span class="stat-val" id="def-time">0s</span></div>
        </div>
        <div class="modal-actions-column">
          <button class="btn-modal btn-rewarded" id="btn-def-revive">${i18n.t('reviveBtn')}</button>
          <button class="btn-modal btn-primary" id="btn-def-restart">${i18n.t('restart')}</button>
          <button class="btn-modal btn-secondary" id="btn-def-sectors">${i18n.t('menu')}</button>
        </div>
      </div>
    `);

    // 3. Pause Modal
    this.modalPause = this.createModalElement('modal-pause', `
      <div class="modal-box">
        <div class="modal-header">
          <h2 class="modal-title">${i18n.t('pause')}</h2>
          <button class="btn-close-modal" data-close="modal-pause">✕</button>
        </div>
        <div class="modal-actions-column">
          <button class="btn-modal btn-primary" id="btn-pause-resume">${i18n.t('resume')}</button>
          <button class="btn-modal btn-secondary" id="btn-pause-restart">${i18n.t('restart')}</button>
          <button class="btn-modal btn-secondary" id="btn-pause-sectors">${i18n.t('menu')}</button>
        </div>
        <p class="modal-help-text">${i18n.t('controlsHelp')}</p>
      </div>
    `);

    // 4. Map Selection Modal
    this.modalMaps = this.createModalElement('modal-maps', `
      <div class="modal-box modal-large-box">
        <div class="modal-header">
          <h2 class="modal-title">${i18n.t('mapsTitle')}</h2>
          <button class="btn-close-modal" data-close="modal-maps">✕</button>
        </div>
        <div class="maps-grid-container" id="maps-grid-container"></div>
      </div>
    `);

    // 5. Sector Selection Modal (Grid of visual cards with 3 stars)
    this.modalSectors = this.createModalElement('modal-sectors', `
      <div class="modal-box modal-large-box">
        <div class="modal-header">
          <h2 class="modal-title">${i18n.t('menu')}</h2>
          <button class="btn-close-modal" data-close="modal-sectors">✕</button>
        </div>
        <div class="sectors-grid-scroll" id="sectors-grid-container"></div>
      </div>
    `);

    // 5. Meta-Shop Modal
    this.modalShop = this.createModalElement('modal-shop', `
      <div class="modal-box modal-large-box">
        <div class="modal-header">
          <h2 class="modal-title">${i18n.t('shopTitle')}</h2>
          <div class="shop-credits-pill">💎 <span id="shop-credits-val">0</span></div>
          <button class="btn-close-modal" data-close="modal-shop">✕</button>
        </div>
        <div class="modal-tabs-header">
          <button class="tab-btn active" id="tab-btn-upgrades">${i18n.t('upgradesTab')}</button>
          <button class="tab-btn" id="tab-btn-skins">${i18n.t('skinsTab')}</button>
        </div>
        <div class="tab-content" id="tab-content-upgrades"></div>
        <div class="tab-content hidden" id="tab-content-skins"></div>
      </div>
    `);

    // 6. Quests Modal
    this.modalQuests = this.createModalElement('modal-quests', `
      <div class="modal-box modal-large-box">
        <div class="modal-header">
          <h2 class="modal-title">${i18n.t('questsTitle')}</h2>
          <button class="btn-close-modal" data-close="modal-quests">✕</button>
        </div>
        <div class="quests-section">
          <h3 class="section-title">${i18n.t('dailyQuests')}</h3>
          <div class="quests-list" id="quests-daily-list"></div>
        </div>
        <div class="quests-section">
          <h3 class="section-title">${i18n.t('weeklyQuests')}</h3>
          <div class="quests-list" id="quests-weekly-list"></div>
        </div>
      </div>
    `);

    // 7. Daily Rewards Modal
    this.modalDaily = this.createModalElement('modal-daily', `
      <div class="modal-box">
        <div class="modal-header">
          <h2 class="modal-title">${i18n.t('dailyTitle')}</h2>
          <button class="btn-close-modal" data-close="modal-daily">✕</button>
        </div>
        <div class="daily-calendar-grid" id="daily-calendar-grid"></div>
        <button class="btn-modal btn-primary" id="btn-claim-daily">${i18n.t('claimReward')}</button>
      </div>
    `);

    // 8. Lucky Spin Modal
    this.modalSpin = this.createModalElement('modal-spin', `
      <div class="modal-box modal-spin-box">
        <div class="modal-header">
          <h2 class="modal-title">${i18n.t('luckySpinTitle')}</h2>
          <button class="btn-close-modal" data-close="modal-spin">✕</button>
        </div>
        <div class="wheel-canvas-wrap">
          <canvas id="wheel-canvas" width="280" height="280"></canvas>
          <div class="wheel-pointer">▼</div>
        </div>
        <div class="spin-action-buttons">
          <button class="btn-modal btn-primary" id="btn-spin-free">${i18n.t('spinFree')}</button>
          <button class="btn-modal btn-rewarded" id="btn-spin-ad">${i18n.t('spinAd')}</button>
        </div>
      </div>
    `);
  }

  createModalElement(id, html) {
    const wrapper = document.createElement('div');
    wrapper.id = id;
    wrapper.className = 'modal-backdrop hidden';
    wrapper.innerHTML = html;
    this.modalLayer.appendChild(wrapper);
    this.modalCtrl.register(id, wrapper);
    return wrapper;
  }

  bindEvents() {
    // Language Toggle
    const btnLang = document.getElementById('btn-lang-toggle');
    if (btnLang) {
      btnLang.textContent = i18n.locale.toUpperCase();
      btnLang.addEventListener('click', () => {
        i18n.toggleLocale();
        btnLang.textContent = i18n.locale.toUpperCase();
        this.updateStaticTexts();
      });
    }

    // Sound Toggle
    const btnSound = document.getElementById('btn-sound-toggle');
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        const isMuted = sound.toggleMute();
        btnSound.textContent = isMuted ? '🔇' : '🔊';
      });
    }

    // Pause button
    const btnPause = document.getElementById('btn-pause-game');
    if (btnPause) {
      btnPause.addEventListener('click', () => {
        if (this.callbacks.onPause) this.callbacks.onPause();
        this.modalCtrl.open('modal-pause');
      });
    }

    // Early Complete button
    const btnEarlyComplete = document.getElementById('btn-early-complete');
    if (btnEarlyComplete) {
      btnEarlyComplete.addEventListener('click', () => {
        if (this.callbacks.onCompleteEarly) this.callbacks.onCompleteEarly();
      });
    }

    // Tactical Meta Buttons
    document.getElementById('btn-open-maps')?.addEventListener('click', () => {
      if (this.callbacks.onPause) this.callbacks.onPause();
      this.renderMapsModal(this.currentMap ? this.currentMap.id : 'neon_district');
      this.modalCtrl.open('modal-maps');
    });

    document.getElementById('btn-open-shop')?.addEventListener('click', () => {
      if (this.callbacks.onPause) this.callbacks.onPause();
      this.renderShop();
      this.modalCtrl.open('modal-shop');
    });

    document.getElementById('btn-open-quests')?.addEventListener('click', () => {
      if (this.callbacks.onPause) this.callbacks.onPause();
      this.renderQuests();
      this.modalCtrl.open('modal-quests');
    });

    document.getElementById('btn-open-daily')?.addEventListener('click', () => {
      if (this.callbacks.onPause) this.callbacks.onPause();
      this.renderDailyCalendar();
      this.modalCtrl.open('modal-daily');
    });

    document.getElementById('btn-open-spin')?.addEventListener('click', () => {
      if (this.callbacks.onPause) this.callbacks.onPause();
      this.renderLuckyWheel();
      this.modalCtrl.open('modal-spin');
    });

    // Close buttons on modals (X)
    this.modalLayer.querySelectorAll('.btn-close-modal').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const targetId = btn.getAttribute('data-close');
        if (targetId) this.modalCtrl.close(targetId);
      });
    });

    // Pause Modal Buttons
    document.getElementById('btn-pause-resume')?.addEventListener('click', () => {
      this.modalCtrl.close('modal-pause');
    });
    document.getElementById('btn-pause-restart')?.addEventListener('click', () => {
      this.modalCtrl.closeAll();
      if (this.callbacks.onRestart) this.callbacks.onRestart();
    });
    document.getElementById('btn-pause-sectors')?.addEventListener('click', () => {
      this.renderSectorsGrid();
      this.modalCtrl.open('modal-sectors');
    });

    // Victory Modal Buttons
    document.getElementById('btn-vic-next')?.addEventListener('click', () => {
      this.modalCtrl.closeAll();
      if (this.callbacks.onNextLevel) this.callbacks.onNextLevel();
    });
    document.getElementById('btn-vic-double')?.addEventListener('click', () => {
      if (this.callbacks.onDoubleCredits) this.callbacks.onDoubleCredits();
    });
    document.getElementById('btn-vic-restart')?.addEventListener('click', () => {
      this.modalCtrl.closeAll();
      if (this.callbacks.onRestart) this.callbacks.onRestart();
    });
    document.getElementById('btn-vic-sectors')?.addEventListener('click', () => {
      this.renderSectorsGrid();
      this.modalCtrl.open('modal-sectors');
    });

    // Defeat Modal Buttons
    document.getElementById('btn-def-revive')?.addEventListener('click', () => {
      if (this.callbacks.onRevive) this.callbacks.onRevive();
    });
    document.getElementById('btn-def-restart')?.addEventListener('click', () => {
      this.modalCtrl.closeAll();
      if (this.callbacks.onRestart) this.callbacks.onRestart();
    });
    document.getElementById('btn-def-sectors')?.addEventListener('click', () => {
      this.renderSectorsGrid();
      this.modalCtrl.open('modal-sectors');
    });

    // Bind Touch Controls
    this.bindTouchControls();
  }

  bindTouchControls() {
    const joyZone = document.getElementById('touch-joy-zone');
    const knob = document.getElementById('touch-joy-knob');
    if (!joyZone || !knob) return;

    const onTouchStart = (e) => {
      const touch = e.touches[0];
      this.touchJoyActive = true;
      this.touchJoyStart = { x: touch.clientX, y: touch.clientY };
      this.touchJoyDir = { x: 0, y: 0 };
      knob.style.transform = `translate(0px, 0px)`;
    };

    const onTouchMove = (e) => {
      if (!this.touchJoyActive) return;
      const touch = e.touches[0];
      const dx = touch.clientX - this.touchJoyStart.x;
      const dy = touch.clientY - this.touchJoyStart.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      const maxDist = 38;

      if (d > 0.001) {
        const factor = Math.min(d, maxDist) / d;
        knob.style.transform = `translate(${dx * factor}px, ${dy * factor}px)`;
        this.touchJoyDir = { x: (dx / d) * (Math.min(d, maxDist) / maxDist), y: (dy / d) * (Math.min(d, maxDist) / maxDist) };
      }
    };

    const onTouchEnd = () => {
      this.touchJoyActive = false;
      this.touchJoyDir = { x: 0, y: 0 };
      knob.style.transform = `translate(0px, 0px)`;
    };

    joyZone.addEventListener('touchstart', onTouchStart, { passive: true });
    joyZone.addEventListener('touchmove', onTouchMove, { passive: true });
    joyZone.addEventListener('touchend', onTouchEnd, { passive: true });
    joyZone.addEventListener('touchcancel', onTouchEnd, { passive: true });

    // Touch Action Buttons
    document.getElementById('btn-touch-dash')?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.callbacks.onTouchDash) this.callbacks.onTouchDash();
    });
    document.getElementById('btn-touch-heal')?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.callbacks.onTouchHeal) this.callbacks.onTouchHeal();
    });
    document.getElementById('btn-touch-fire')?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.callbacks.onTouchFire) this.callbacks.onTouchFire(true);
    });
    document.getElementById('btn-touch-fire')?.addEventListener('touchend', (e) => {
      e.preventDefault();
      if (this.callbacks.onTouchFire) this.callbacks.onTouchFire(false);
    });
  }

  updateHUD(sector, aliveCount, totalCount, kills, stars, weapon, dashCooldownPct, currentMap = null) {
    if (currentMap) this.currentMap = currentMap;
    const sName = document.getElementById('hud-sector-name');
    if (sName) {
      sName.textContent = i18n.locale === 'pt' ? sector.namePt : sector.name;
    }

    const mName = document.getElementById('hud-map-name');
    if (mName && currentMap) {
      const isPt = i18n.locale === 'pt';
      mName.textContent = `${currentMap.icon || '🏙️'} ${(isPt ? currentMap.namePt : currentMap.name).toUpperCase()}`;
    }

    const aCount = document.getElementById('hud-alive-count');
    if (aCount) {
      aCount.textContent = `${i18n.t('living')}: ${aliveCount}/${totalCount}`;
    }

    const kCount = document.getElementById('hud-kills-count');
    if (kCount) {
      kCount.textContent = `${i18n.t('kills')}: ${kills}`;
    }

    // 3-Star Progress Bar Fill
    const fill = document.getElementById('hud-stars-fill');
    const m1 = document.getElementById('star-m1');
    const m2 = document.getElementById('star-m2');
    const m3 = document.getElementById('star-m3');
    const btnEarly = document.getElementById('btn-early-complete');

    const pct = stars >= 3 ? 100 : stars === 2 ? 66 : stars === 1 ? 33 : 0;
    if (fill) fill.style.width = `${pct}%`;

    if (m1) m1.classList.toggle('active', stars >= 1);
    if (m2) m2.classList.toggle('active', stars >= 2);
    if (m3) m3.classList.toggle('active', stars >= 3);

    if (btnEarly) {
      btnEarly.classList.toggle('hidden', stars < 1);
    }

    // Weapon Info
    if (weapon) {
      const wIcon = document.getElementById('hud-weapon-icon');
      const wName = document.getElementById('hud-weapon-name');
      const wAmmo = document.getElementById('hud-weapon-ammo');
      if (wIcon) wIcon.textContent = weapon.icon || '🔫';
      if (wName) wName.textContent = i18n.locale === 'pt' ? weapon.namePt : weapon.name;
      if (wAmmo) wAmmo.textContent = `${weapon.clipAmmo} / ${weapon.reserveAmmo === 9999 ? '∞' : weapon.reserveAmmo}`;
    }

    // Dash Ring
    const dashFill = document.getElementById('hud-dash-fill');
    if (dashFill) {
      const deg = Math.round(clamp(dashCooldownPct, 0, 1) * 360);
      dashFill.style.background = `conic-gradient(#00f5ff ${deg}deg, rgba(255,255,255,0.1) ${deg}deg)`;
    }
  }

  showVictoryModal(sector, stars, kills, score, credits) {
    this.lastRoundResult = 'win';
    document.getElementById('vic-kills').textContent = kills;
    document.getElementById('vic-score').textContent = score;
    document.getElementById('vic-credits').textContent = `+${credits} 💎`;

    const s1 = document.getElementById('vic-star-1');
    const s2 = document.getElementById('vic-star-2');
    const s3 = document.getElementById('vic-star-3');
    if (s1) s1.classList.toggle('active', stars >= 1);
    if (s2) s2.classList.toggle('active', stars >= 2);
    if (s3) s3.classList.toggle('active', stars >= 3);

    this.modalCtrl.open('modal-victory');
    sound.playVictory();
  }

  showDefeatModal(kills, survivalTimeSec) {
    this.lastRoundResult = 'lose';
    document.getElementById('def-kills').textContent = kills;
    document.getElementById('def-time').textContent = `${Math.round(survivalTimeSec)}s`;

    this.modalCtrl.open('modal-defeat');
    sound.playDefeat();
  }

  renderMapsModal(currentMapId = 'neon_district') {
    const container = document.getElementById('maps-grid-container');
    if (!container) return;
    container.innerHTML = '';

    const isPt = i18n.locale === 'pt';
    const mapList = Object.values(MAPS);

    mapList.forEach((map) => {
      const isSelected = map.id === currentMapId;
      const card = document.createElement('div');
      card.className = `map-card ${isSelected ? 'selected' : ''}`;
      card.innerHTML = `
        <div class="map-card-header">
          <span class="map-card-icon">${map.icon || '🏙️'}</span>
          <div class="map-card-title-group">
            <h4 class="map-card-name">${(isPt ? map.namePt : map.name).toUpperCase()}</h4>
            <span class="map-card-tagline">${isPt ? map.taglinePt : map.tagline}</span>
          </div>
        </div>
        <p class="map-card-desc">${isPt ? map.descPt : map.desc}</p>
        <div class="map-card-specs">
          <span class="map-spec-pill">📏 ${map.width}x${map.height}</span>
          <span class="map-spec-pill">🛡️ ${map.obstacles.length} ${isPt ? 'Estruturas' : 'Cover'}</span>
          <span class="map-spec-pill">⚡ ${map.storm.label || 'Storm'}</span>
        </div>
        <button class="btn-deploy-map ${isSelected ? 'btn-deployed' : ''}">
          ${isSelected ? (isPt ? '✓ MAPA ATIVO' : '✓ ACTIVE MAP') : (isPt ? '🚀 SELECIONAR & IMPLANTAR' : '🚀 DEPLOY OPERATIVES')}
        </button>
      `;

      const deployBtn = card.querySelector('.btn-deploy-map');
      deployBtn.addEventListener('click', () => {
        sound.playClick();
        this.modalCtrl.closeAll();
        this.showLoadingTransition(isPt ? map.namePt : map.name, () => {
          if (this.callbacks.onSelectMap) {
            this.callbacks.onSelectMap(map.id);
          }
        });
      });

      container.appendChild(card);
    });
  }

  showLoadingTransition(mapName, onComplete) {
    const overlay = document.createElement('div');
    overlay.className = 'cyber-loading-screen';
    overlay.innerHTML = `
      <div class="cyber-loading-box">
        <div class="cyber-spinner"></div>
        <h3 class="cyber-loading-title">${i18n.locale === 'pt' ? 'CALIBRANDO PROTOCOLO NEON' : 'CALIBRATING NEON PROTOCOL'}</h3>
        <p class="cyber-loading-map-name">${mapName.toUpperCase()}</p>
        <div class="cyber-progress-track">
          <div class="cyber-progress-bar"></div>
        </div>
        <span class="cyber-loading-tip">${i18n.locale === 'pt' ? 'Transferindo telemetria tática dos ciborgues...' : 'Streaming tactical cyborg telemetry...'}</span>
      </div>
    `;
    document.body.appendChild(overlay);

    setTimeout(() => {
      overlay.classList.add('fade-out');
      if (onComplete) onComplete();
      setTimeout(() => {
        overlay.remove();
      }, 350);
    }, 700);
  }

  renderSectorsGrid() {
    const container = document.getElementById('sectors-grid-container');
    if (!container) return;
    container.innerHTML = '';

    const unlocked = storage.data.unlockedSectors || 1;
    const starsData = storage.data.sectorStars || {};

    SECTORS.forEach((sec) => {
      const isUnlocked = sec.id <= unlocked;
      const stars = starsData[sec.id] || 0;

      const card = document.createElement('div');
      card.className = `sector-card ${isUnlocked ? 'unlocked' : 'locked'}`;
      card.innerHTML = `
        <div class="sector-card-thumb">
          <span class="sector-card-num">${sec.id.toString().padStart(2, '0')}</span>
        </div>
        <div class="sector-card-info">
          <h4 class="sector-card-name">${i18n.locale === 'pt' ? sec.namePt : sec.name}</h4>
          <div class="sector-card-stars">
            <span class="${stars >= 1 ? 'gold' : ''}">★</span>
            <span class="${stars >= 2 ? 'gold' : ''}">★</span>
            <span class="${stars >= 3 ? 'gold' : ''}">★</span>
          </div>
          <span class="sector-card-reward">+${sec.creditReward} 💎</span>
        </div>
      `;

      if (isUnlocked) {
        card.addEventListener('click', () => {
          this.modalCtrl.closeAll();
          if (this.callbacks.onSelectLevel) this.callbacks.onSelectLevel(sec.id);
        });
      }

      container.appendChild(card);
    });
  }

  renderShop() {
    const creds = document.getElementById('shop-credits-val');
    if (creds) creds.textContent = storage.getCredits();

    // Upgrades
    const upContent = document.getElementById('tab-content-upgrades');
    if (upContent) {
      upContent.innerHTML = '';
      const state = shop.getUpgradesState();
      state.forEach((u) => {
        const item = document.createElement('div');
        item.className = 'shop-item-card';
        item.innerHTML = `
          <div class="shop-item-icon" style="color: ${u.color};">${u.icon}</div>
          <div class="shop-item-details">
            <span class="shop-item-title">${i18n.locale === 'pt' ? u.namePt : u.name} (${u.level}/${u.maxLevel})</span>
            <span class="shop-item-desc">${i18n.locale === 'pt' ? u.descPt : u.desc}</span>
          </div>
          <button class="btn-shop-buy ${u.isMax ? 'maxed' : ''}" ${u.isMax ? 'disabled' : ''}>
            ${u.isMax ? i18n.t('maxed') : `${u.cost} 💎`}
          </button>
        `;
        const btn = item.querySelector('.btn-shop-buy');
        if (btn && !u.isMax) {
          btn.addEventListener('click', () => {
            if (shop.buyUpgrade(u.key)) {
              sound.playCrateOpen();
              this.renderShop();
              if (this.callbacks.onUpgradesOrSkinsChanged) this.callbacks.onUpgradesOrSkinsChanged();
            } else {
              sound.playClick();
            }
          });
        }
        upContent.appendChild(item);
      });
    }

    // Skins
    const skinsContent = document.getElementById('tab-content-skins');
    if (skinsContent) {
      skinsContent.innerHTML = '';
      const skins = shop.getSkinsState();
      skins.forEach((s) => {
        const item = document.createElement('div');
        item.className = 'shop-item-card';
        item.innerHTML = `
          <div class="shop-item-icon" style="color: ${s.color};">${s.icon}</div>
          <div class="shop-item-details">
            <span class="shop-item-title">${i18n.locale === 'pt' ? s.namePt : s.name}</span>
          </div>
          <button class="btn-shop-buy ${s.isEquipped ? 'maxed' : ''}">
            ${s.isEquipped ? i18n.t('equipped') : s.isUnlocked ? i18n.t('equip') : `${s.cost} 💎`}
          </button>
        `;
        const btn = item.querySelector('.btn-shop-buy');
        if (btn && !s.isEquipped) {
          btn.addEventListener('click', () => {
            if (shop.buyOrEquipSkin(s.id)) {
              sound.playCrateOpen();
              this.renderShop();
              if (this.callbacks.onUpgradesOrSkinsChanged) this.callbacks.onUpgradesOrSkinsChanged();
            }
          });
        }
        skinsContent.appendChild(item);
      });
    }

    // Tab switching
    const btnUp = document.getElementById('tab-btn-upgrades');
    const btnSkin = document.getElementById('tab-btn-skins');
    if (btnUp && btnSkin) {
      btnUp.onclick = () => {
        btnUp.classList.add('active');
        btnSkin.classList.remove('active');
        upContent?.classList.remove('hidden');
        skinsContent?.classList.add('hidden');
      };
      btnSkin.onclick = () => {
        btnSkin.classList.add('active');
        btnUp.classList.remove('active');
        skinsContent?.classList.remove('hidden');
        upContent?.classList.add('hidden');
      };
    }
  }

  renderQuests() {
    const { daily, weekly } = quests.getQuestsState();

    const dList = document.getElementById('quests-daily-list');
    if (dList) {
      dList.innerHTML = '';
      daily.forEach((q, idx) => {
        const card = document.createElement('div');
        card.className = 'quest-card';
        card.innerHTML = `
          <div class="quest-info">
            <span class="quest-title">${i18n.locale === 'pt' ? q.titlePt : q.title}</span>
            <span class="quest-prog">${q.current} / ${q.target}</span>
          </div>
          <div class="quest-reward-row">
            <span class="quest-reward">+${q.reward} 💎</span>
            <button class="btn-quest-claim ${!q.isComplete || q.isClaimed ? 'disabled' : ''}" ${!q.isComplete || q.isClaimed ? 'disabled' : ''}>
              ${q.isClaimed ? i18n.t('claimed') : i18n.t('claimQuest')}
            </button>
            ${!q.isClaimed && q.isComplete ? `<button class="btn-quest-2x">[AD 2X]</button>` : ''}
          </div>
        `;
        const btnClaim = card.querySelector('.btn-quest-claim');
        const btn2x = card.querySelector('.btn-quest-2x');

        if (btnClaim && q.isComplete && !q.isClaimed) {
          btnClaim.addEventListener('click', () => {
            quests.claimQuest('daily', idx, false, () => this.renderQuests());
          });
        }
        if (btn2x) {
          btn2x.addEventListener('click', () => {
            quests.claimQuest('daily', idx, true, () => this.renderQuests());
          });
        }
        dList.appendChild(card);
      });
    }

    const wList = document.getElementById('quests-weekly-list');
    if (wList) {
      wList.innerHTML = '';
      weekly.forEach((q, idx) => {
        const card = document.createElement('div');
        card.className = 'quest-card';
        card.innerHTML = `
          <div class="quest-info">
            <span class="quest-title">${i18n.locale === 'pt' ? q.titlePt : q.title}</span>
            <span class="quest-prog">${q.current} / ${q.target}</span>
          </div>
          <div class="quest-reward-row">
            <span class="quest-reward">+${q.reward} 💎</span>
            <button class="btn-quest-claim ${!q.isComplete || q.isClaimed ? 'disabled' : ''}" ${!q.isComplete || q.isClaimed ? 'disabled' : ''}>
              ${q.isClaimed ? i18n.t('claimed') : i18n.t('claimQuest')}
            </button>
            ${!q.isClaimed && q.isComplete ? `<button class="btn-quest-2x">[AD 2X]</button>` : ''}
          </div>
        `;
        const btnClaim = card.querySelector('.btn-quest-claim');
        const btn2x = card.querySelector('.btn-quest-2x');

        if (btnClaim && q.isComplete && !q.isClaimed) {
          btnClaim.addEventListener('click', () => {
            quests.claimQuest('weekly', idx, false, () => this.renderQuests());
          });
        }
        if (btn2x) {
          btn2x.addEventListener('click', () => {
            quests.claimQuest('weekly', idx, true, () => this.renderQuests());
          });
        }
        wList.appendChild(card);
      });
    }
  }

  renderDailyCalendar() {
    const grid = document.getElementById('daily-calendar-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const cal = dailyRewards.getCalendarState();
    cal.forEach((day) => {
      const card = document.createElement('div');
      card.className = `daily-day-card ${day.status}`;
      card.innerHTML = `
        <span class="daily-day-label">${i18n.locale === 'pt' ? day.titlePt : day.title}</span>
        <span class="daily-day-icon">${day.icon}</span>
        <span class="daily-day-cred">+${day.credits} 💎</span>
      `;
      grid.appendChild(card);
    });

    const btn = document.getElementById('btn-claim-daily');
    if (btn) {
      btn.disabled = !dailyRewards.isClaimAvailable();
      btn.textContent = dailyRewards.isClaimAvailable() ? i18n.t('claimReward') : i18n.t('claimed');
      btn.onclick = () => {
        const reward = dailyRewards.claimToday();
        if (reward) {
          sound.playCrateOpen();
          this.renderDailyCalendar();
        }
      };
    }
  }

  renderLuckyWheel(rotationAngle = 0) {
    const canvas = document.getElementById('wheel-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cx = canvas.width * 0.5;
    const cy = canvas.height * 0.5;
    const r = cx - 10;
    const numSlices = SPIN_SEGMENTS.length;
    const sliceAngle = (Math.PI * 2) / numSlices;

    // Draw Wheel
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < numSlices; i++) {
      const startAngle = i * sliceAngle + rotationAngle;
      const endAngle = startAngle + sliceAngle;
      const seg = SPIN_SEGMENTS[i];

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + sliceAngle * 0.5);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px "Orbitron", sans-serif';
      ctx.fillText(seg.label, r - 14, 4);
      ctx.restore();
    }

    // Center hub & Arrow Pointer
    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#00f5ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Neon pointer at top
    ctx.fillStyle = '#00f5ff';
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r + 18);
    ctx.lineTo(cx - 10, cy - r - 6);
    ctx.lineTo(cx + 10, cy - r - 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Buttons
    const btnFree = document.getElementById('btn-spin-free');
    const btnAd = document.getElementById('btn-spin-ad');

    if (btnFree) {
      const canFree = luckySpin.canFreeSpin();
      btnFree.disabled = !canFree;
      btnFree.textContent = canFree ? i18n.t('spinFree') : `${luckySpin.formatTimeRemaining()}`;
      btnFree.onclick = () => {
        if (!luckySpin.canFreeSpin()) return;
        btnFree.disabled = true;
        if (btnAd) btnAd.disabled = true;
        luckySpin.executeSpin(false, (reward, chosenIndex) => {
          if (reward && chosenIndex !== undefined) {
            this.animateWheelSpin(chosenIndex, () => {
              this.renderLuckyWheel();
            });
          } else {
            this.renderLuckyWheel();
          }
        });
      };
    }

    if (btnAd) {
      btnAd.onclick = () => {
        btnAd.disabled = true;
        if (btnFree) btnFree.disabled = true;
        luckySpin.executeSpin(true, (reward, chosenIndex) => {
          if (reward && chosenIndex !== undefined) {
            this.animateWheelSpin(chosenIndex, () => {
              this.renderLuckyWheel();
            });
          } else {
            this.renderLuckyWheel();
          }
        });
      };
    }
  }

  animateWheelSpin(targetIndex, onDone) {
    const numSlices = SPIN_SEGMENTS.length;
    const sliceAngle = (Math.PI * 2) / numSlices;
    const targetSegmentAngle = targetIndex * sliceAngle + sliceAngle * 0.5;
    const finalAngle = Math.PI * 2 * 5 + (Math.PI * 1.5 - targetSegmentAngle);
    const duration = 2000;
    const start = performance.now();

    const animate = (time) => {
      const elapsed = time - start;
      const t = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      const currentAngle = finalAngle * ease;
      this.renderLuckyWheel(currentAngle);

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        if (onDone) onDone();
      }
    };
    requestAnimationFrame(animate);
  }

  updateStaticTexts() {
    // Updates static titles throughout the HUD when toggling language
    const btnEarly = document.getElementById('btn-early-complete');
    if (btnEarly) btnEarly.textContent = i18n.t('completeSectorBtn');

    document.getElementById('btn-pause-resume')?.replaceChildren(document.createTextNode(i18n.t('resume')));
    document.getElementById('btn-pause-restart')?.replaceChildren(document.createTextNode(i18n.t('restart')));
    document.getElementById('btn-pause-sectors')?.replaceChildren(document.createTextNode(i18n.t('menu')));

    document.getElementById('btn-vic-next')?.replaceChildren(document.createTextNode(i18n.t('nextSectorBtn')));
    document.getElementById('btn-vic-double')?.replaceChildren(document.createTextNode(i18n.t('doubleCreditsBtn')));
    document.getElementById('btn-vic-restart')?.replaceChildren(document.createTextNode(i18n.t('restart')));
    document.getElementById('btn-vic-sectors')?.replaceChildren(document.createTextNode(i18n.t('menu')));

    document.getElementById('btn-def-revive')?.replaceChildren(document.createTextNode(i18n.t('reviveBtn')));
    document.getElementById('btn-def-restart')?.replaceChildren(document.createTextNode(i18n.t('restart')));
    document.getElementById('btn-def-sectors')?.replaceChildren(document.createTextNode(i18n.t('menu')));
  }
}
