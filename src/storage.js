/**
 * @fileoverview Versioned & Atomic Persistence Layer for Cyber Arena: Neon Survival
 * Safely persists player progress, star ratings (1★, 2★, 3★), currency, upgrades,
 * cosmetics, and retention metadata in localStorage with memory fallback.
 */

const STORAGE_KEY = 'cyber_arena_neon_survival_v1';

const DEFAULT_STATE = {
  version: 1,
  credits: 150,
  highScore: 0,
  totalKills: 0,
  matchesWon: 0,
  unlockedSectors: 1,
  sectorStars: { 1: 0 },
  upgrades: {
    maxHealth: 0,
    maxShield: 0,
    dashCooldown: 0,
    damageBonus: 0
  },
  unlockedSkins: ['hacker_default'],
  equippedSkin: 'hacker_default',
  dailyStreak: 1,
  lastClaimEpochDay: 0,
  lastLuckySpinEpoch: 0,
  quests: {
    dailyDate: '',
    weeklyDate: '',
    dailyKills: 0,
    dailyWins: 0,
    dailyCrates: 0,
    dailyClaimed: [false, false, false],
    weeklyKills: 0,
    weeklyWins: 0,
    weeklyCrates: 0,
    weeklyClaimed: [false, false, false]
  },
  settings: {
    soundMuted: false,
    musicVolume: 0.7,
    sfxVolume: 0.8,
    locale: 'en'
  }
};

export class StorageManager {
  constructor() {
    this.data = this._load();
  }

  _load() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          return this._sanitize({ ...DEFAULT_STATE, ...parsed });
        }
      }
    } catch (e) {
      console.warn('[Storage] Failed to read localStorage, falling back to defaults:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  _sanitize(state) {
    if (!state || typeof state !== 'object') return DEFAULT_STATE;
    state.credits = Math.max(0, Number(state.credits) || 0);
    state.highScore = Math.max(0, Number(state.highScore) || 0);
    state.totalKills = Math.max(0, Number(state.totalKills) || 0);
    state.matchesWon = Math.max(0, Number(state.matchesWon) || 0);
    state.unlockedSectors = Math.min(16, Math.max(1, Number(state.unlockedSectors) || 1));
    state.sectorStars = state.sectorStars && typeof state.sectorStars === 'object' ? state.sectorStars : { 1: 0 };
    state.upgrades = state.upgrades || DEFAULT_STATE.upgrades;
    state.unlockedSkins = Array.isArray(state.unlockedSkins) && state.unlockedSkins.length > 0
      ? state.unlockedSkins
      : ['hacker_default'];
    state.equippedSkin = state.equippedSkin || 'hacker_default';
    state.dailyStreak = Math.min(7, Math.max(1, Number(state.dailyStreak) || 1));
    state.lastClaimEpochDay = Number(state.lastClaimEpochDay) || 0;
    state.lastLuckySpinEpoch = Number(state.lastLuckySpinEpoch) || 0;
    state.quests = state.quests || DEFAULT_STATE.quests;
    state.settings = { ...DEFAULT_STATE.settings, ...(state.settings || {}) };
    return state;
  }

  save(partialUpdates = null) {
    if (partialUpdates) {
      this.data = { ...this.data, ...partialUpdates };
    }
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      }
    } catch (e) {
      console.warn('[Storage] Failed to write localStorage:', e);
    }
  }

  getCredits() {
    return this.data.credits || 0;
  }

  addCredits(amount) {
    const valid = Math.max(0, Number(amount) || 0);
    this.data.credits = (this.data.credits || 0) + valid;
    this.save();
    return this.data.credits;
  }

  spendCredits(amount) {
    const cost = Math.max(0, Number(amount) || 0);
    if ((this.data.credits || 0) >= cost) {
      this.data.credits -= cost;
      this.save();
      return true;
    }
    return false;
  }

  recordSectorResult(sectorId, starsEarned, score = 0, kills = 0, isWin = false) {
    const id = Number(sectorId) || 1;
    const stars = Math.min(3, Math.max(0, Number(starsEarned) || 0));

    // Update stars
    const currentStars = this.data.sectorStars[id] || 0;
    if (stars > currentStars) {
      this.data.sectorStars[id] = stars;
    }

    // Unlock next sector if at least 1 star earned
    if (stars >= 1) {
      const nextSector = Math.min(16, id + 1);
      if (nextSector > this.data.unlockedSectors) {
        this.data.unlockedSectors = nextSector;
      }
    }

    // High score & stats
    if (score > (this.data.highScore || 0)) {
      this.data.highScore = score;
    }
    this.data.totalKills = (this.data.totalKills || 0) + Math.max(0, kills);
    if (isWin) {
      this.data.matchesWon = (this.data.matchesWon || 0) + 1;
    }

    // Update quests
    this.updateQuestProgress(kills, isWin ? 1 : 0, 0);

    this.save();
  }

  updateQuestProgress(kills = 0, wins = 0, crates = 0) {
    const today = new Date().toISOString().slice(0, 10);
    const currWeek = this._getWeekKey();

    if (this.data.quests.dailyDate !== today) {
      this.data.quests.dailyDate = today;
      this.data.quests.dailyKills = 0;
      this.data.quests.dailyWins = 0;
      this.data.quests.dailyCrates = 0;
      this.data.quests.dailyClaimed = [false, false, false];
    }

    if (this.data.quests.weeklyDate !== currWeek) {
      this.data.quests.weeklyDate = currWeek;
      this.data.quests.weeklyKills = 0;
      this.data.quests.weeklyWins = 0;
      this.data.quests.weeklyCrates = 0;
      this.data.quests.weeklyClaimed = [false, false, false];
    }

    this.data.quests.dailyKills += kills;
    this.data.quests.dailyWins += wins;
    this.data.quests.dailyCrates += crates;

    this.data.quests.weeklyKills += kills;
    this.data.quests.weeklyWins += wins;
    this.data.quests.weeklyCrates += crates;

    this.save();
  }

  _getWeekKey() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const week1 = new Date(d.getFullYear(), 0, 4);
    const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
    return `${d.getFullYear()}-W${weekNum}`;
  }

  getTotalStars() {
    let total = 0;
    for (const id in this.data.sectorStars) {
      total += this.data.sectorStars[id] || 0;
    }
    return total;
  }

  canClaimDaily() {
    const currentDayEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    return currentDayEpoch > (this.data.lastClaimEpochDay || 0);
  }

  getCurrentStreakDay() {
    const currentDayEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const lastDay = this.data.lastClaimEpochDay || 0;
    if (lastDay === 0) return 1;
    const diff = currentDayEpoch - lastDay;
    if (diff === 1) return (this.data.dailyStreak % 7) + 1;
    if (diff > 1) return 1;
    return this.data.dailyStreak;
  }

  claimDailyReward(creditReward) {
    const currentDayEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const lastDay = this.data.lastClaimEpochDay || 0;

    if (lastDay === 0) {
      this.data.dailyStreak = 1;
    } else if (currentDayEpoch - lastDay === 1) {
      this.data.dailyStreak = (this.data.dailyStreak % 7) + 1;
    } else if (currentDayEpoch - lastDay > 1) {
      this.data.dailyStreak = 1;
    }

    this.data.lastClaimEpochDay = currentDayEpoch;
    this.addCredits(creditReward);
    this.save();
    return this.data.dailyStreak;
  }

  canLuckySpin() {
    const twelveHoursMs = 12 * 60 * 60 * 1000;
    const now = Date.now();
    return now - (this.data.lastLuckySpinEpoch || 0) >= twelveHoursMs;
  }

  getTimeUntilLuckySpin() {
    const twelveHoursMs = 12 * 60 * 60 * 1000;
    const diff = twelveHoursMs - (Date.now() - (this.data.lastLuckySpinEpoch || 0));
    return Math.max(0, diff);
  }

  recordLuckySpin() {
    this.data.lastLuckySpinEpoch = Date.now();
    this.save();
  }

  getUpgradeLevel(key) {
    return this.data.upgrades[key] || 0;
  }

  buyUpgrade(key, cost) {
    const current = this.getUpgradeLevel(key);
    if (current >= 5) return false;
    if (this.spendCredits(cost)) {
      this.data.upgrades[key] = current + 1;
      this.save();
      return true;
    }
    return false;
  }

  unlockSkin(skinId) {
    if (!this.data.unlockedSkins.includes(skinId)) {
      this.data.unlockedSkins.push(skinId);
      this.save();
    }
  }

  equipSkin(skinId) {
    if (this.data.unlockedSkins.includes(skinId)) {
      this.data.equippedSkin = skinId;
      this.save();
      return true;
    }
    return false;
  }
}

export const storage = new StorageManager();
