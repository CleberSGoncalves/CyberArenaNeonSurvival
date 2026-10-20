/**
 * @fileoverview 7-Day Protocol Login Rewards System for Cyber Arena: Neon Survival
 * Escalating rewards with persistent unix day calculation.
 */

import { storage } from './storage.js';

export const DAILY_REWARDS_DEF = [
  { day: 1, title: 'Day 1', titlePt: 'Dia 1', credits: 100, bonus: '', icon: '💎' },
  { day: 2, title: 'Day 2', titlePt: 'Dia 2', credits: 150, bonus: 'shield_pack', icon: '🛡️' },
  { day: 3, title: 'Day 3', titlePt: 'Dia 3', credits: 250, bonus: '', icon: '💎' },
  { day: 4, title: 'Day 4', titlePt: 'Dia 4', credits: 350, bonus: 'emp_charge', icon: '⚡' },
  { day: 5, title: 'Day 5', titlePt: 'Dia 5', credits: 500, bonus: '', icon: '💎' },
  { day: 6, title: 'Day 6', titlePt: 'Dia 6', credits: 750, bonus: '2x_mult', icon: '🔥' },
  { day: 7, title: 'Day 7', titlePt: 'Dia 7', credits: 1500, bonus: 'skin_cyber_ninja', icon: '👑' }
];

export class DailyRewardsManager {
  constructor() {
    this.refresh();
  }

  refresh() {
    this.currentStreak = storage.getCurrentStreakDay();
    this.canClaim = storage.canClaimDaily();
  }

  isClaimAvailable() {
    this.refresh();
    return Boolean(this.canClaim);
  }

  getCalendarState() {
    this.refresh();
    const todayIndex = Math.min(Math.max(1, this.currentStreak), 7);
    return DAILY_REWARDS_DEF.map((dayDef) => {
      let status = 'locked';
      if (dayDef.day < todayIndex) {
        status = 'claimed';
      } else if (dayDef.day === todayIndex) {
        status = this.canClaim ? 'available' : 'claimed_today';
      }
      return {
        ...dayDef,
        status
      };
    });
  }

  claimToday() {
    this.refresh();
    if (!this.canClaim) return null;

    const streakDay = storage.getCurrentStreakDay();
    const dayIndex = Math.min(Math.max(1, streakDay), 7) - 1;
    const reward = DAILY_REWARDS_DEF[dayIndex];

    storage.claimDailyReward(reward.credits);

    if (reward.bonus === 'skin_cyber_ninja') {
      storage.unlockSkin('cyber_ninja');
    }

    this.refresh();
    return reward;
  }
}

export const dailyRewards = new DailyRewardsManager();
