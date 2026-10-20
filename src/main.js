/**
 * @fileoverview Main Entry Point for Cyber Arena: Neon Survival
 * Bootstraps CrazyGames SDK v3, Web Audio Synthesizer, 3-Row Flex HUD,
 * FluidCleb Interactive Splash (0.0s - 2.8s) + Interactive Lore, and Game Engine.
 */

import './style.css';
import { crazyGames } from './crazygames.js';
import { sound } from './audio.js';
import { GameHUD } from './hud.js';
import { GameEngine } from './game.js';
import { CinematicIntro } from './splash.js';
import { storage } from './storage.js';

window.addEventListener('DOMContentLoaded', async () => {
  console.log('[Main] Bootstrapping Cyber Arena: Neon Survival...');

  // 1. Initialize CrazyGames SDK v3 asynchronously (resilient to AdBlock & non-CG domains)
  await crazyGames.init();

  const canvas = document.getElementById('game-canvas');
  const stage = document.getElementById('game-stage');

  let engine = null;

  // 2. Instantiate Decoupled 3-Row Flex HUD
  const hud = new GameHUD(stage, {
    onPause: () => {
      if (engine) engine.isPaused = true;
    },
    onResume: () => {
      if (engine) {
        engine.isPaused = false;
        engine.isAdPaused = false;
        crazyGames.gameplayStart();
      }
    },
    onRestart: () => {
      if (engine) {
        engine.loadSector(engine.currentSectorIndex);
      }
    },
    onNextLevel: () => {
      if (engine) {
        engine.loadSector(engine.currentSectorIndex + 1);
      }
    },
    onSelectLevel: (sectorId) => {
      if (engine) {
        engine.loadSector(sectorId - 1);
      }
    },
    onCompleteEarly: () => {
      if (engine) {
        engine.completeSectorIfEligible();
      }
    },
    onRevive: () => {
      crazyGames.requestRewardedAd(
        () => {
          if (engine) engine.revivePlayer();
        },
        () => console.log('[CrazyGames] Revive ad dismissed or blocked.')
      );
    },
    onDoubleCredits: () => {
      crazyGames.requestRewardedAd(
        () => {
          if (engine) {
            const bonus = engine.sector.creditReward + 100;
            storage.addCredits(bonus);
            sound.playCrateOpen();
            const credEl = document.getElementById('vic-credits');
            if (credEl) credEl.textContent = `+${bonus * 2} 💎 [2X]`;
            const btnDbl = document.getElementById('btn-vic-double');
            if (btnDbl) btnDbl.disabled = true;
          }
        },
        () => console.log('[CrazyGames] Double credits ad dismissed or blocked.')
      );
    },
    onTouchDash: () => {
      if (engine) engine.triggerPlayerDash();
    },
    onTouchHeal: () => {
      if (engine) engine.useQuickHeal();
    },
    onTouchFire: (isDown) => {
      if (engine) engine.touchFiring = isDown;
    },
    onUpgradesOrSkinsChanged: () => {
      if (engine && engine.player) {
        engine.player.applyUpgrades();
      }
    },
    isRoundOver: () => Boolean(engine && engine.isRoundOver)
  });

  // 3. Register CrazyGames SDK v3 Ad Callbacks for strict audio muting & physics freeze
  crazyGames.setAdCallbacks(
    // On Ad Started:
    () => {
      sound.setAdMuted(true);
      if (engine) engine.isAdPaused = true;
    },
    // On Ad Finished or Error:
    () => {
      sound.setAdMuted(false);
      if (engine) engine.isAdPaused = false;
    }
  );

  // 4. Create Game Engine instance
  engine = new GameEngine(canvas, hud);
  window.__cyberEngine = engine; // Expose for QA testing and subagent inspection

  // 5. Global audio unlocker: starts ambient music on first interaction
  const unlockAudio = () => {
    sound._ensureContext();
    sound.startMusic();
  };
  window.addEventListener('pointerdown', unlockAudio, { passive: true, once: true });
  window.addEventListener('keydown', unlockAudio, { passive: true, once: true });
  window.addEventListener('click', unlockAudio, { passive: true, once: true });

  // 6. Launch FluidCleb Interactive Intro (0.0s - 2.8s) + Lore with 1-Click Skip
  const intro = new CinematicIntro(document.body, () => {
    console.log('[Main] Intro finished -> Entering Cyber Arena Gameplay!');
    engine.start();
  });

  intro.start();
});
