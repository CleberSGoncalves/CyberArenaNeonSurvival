/**
 * @fileoverview Neural Lucky Spin System for Cyber Arena: Neon Survival
 * 1x Free spin every 12 hours + unlimited extra spins via Rewarded Ads.
 */

import { storage } from './storage.js';
import { sound } from './audio.js';
import { crazyGames } from './crazygames.js';

export const SPIN_SEGMENTS = [
  { label: '100 💎', credits: 100, color: '#0284c7' },
  { label: '250 💎', credits: 250, color: '#f59e0b' },
  { label: '150 💎', credits: 150, color: '#3b82f6' },
  { label: '500 💎', credits: 500, color: '#d946ef' },
  { label: '75 💎', credits: 75, color: '#64748b' },
  { label: '350 💎', credits: 350, color: '#f97316' },
  { label: '1000 💎', credits: 1000, color: '#eab308' },
  { label: '200 💎', credits: 200, color: '#10b981' }
];

export class LuckySpinManager {
  canFreeSpin() {
    return storage.canLuckySpin();
  }

  getTimeRemaining() {
    return storage.getTimeUntilLuckySpin();
  }

  formatTimeRemaining() {
    const ms = this.getTimeRemaining();
    if (ms <= 0) return 'READY';
    const totalSec = Math.floor(ms / 1000);
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  executeSpin(isAd = false, onComplete) {
    if (!isAd && !this.canFreeSpin()) {
      if (onComplete) onComplete(null, false);
      return;
    }

    const doSpin = () => {
      // Pick random winning segment
      const chosenIndex = Math.floor(Math.random() * SPIN_SEGMENTS.length);
      const reward = SPIN_SEGMENTS[chosenIndex];

      if (!isAd) {
        storage.recordLuckySpin();
      }

      storage.addCredits(reward.credits);
      sound.playCrateOpen();

      if (onComplete) {
        onComplete(reward, chosenIndex);
      }
    };

    if (isAd) {
      crazyGames.requestRewardedAd(
        () => doSpin(),
        () => {
          if (onComplete) onComplete(null, false);
        }
      );
    } else {
      doSpin();
    }
  }
}

export const luckySpin = new LuckySpinManager();
