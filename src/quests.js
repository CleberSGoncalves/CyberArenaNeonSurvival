/**
 * @fileoverview Tactical Bounty Quests & Contracts (Daily & Weekly)
 * Dynamically tracks in-game statistics with Rewarded Ad 2X multiplier.
 */

import { storage } from './storage.js';
import { crazyGames } from './crazygames.js';
import { sound } from './audio.js';

export const DAILY_QUESTS_DEF = [
  {
    id: 'daily_kills',
    title: 'Eliminate 5 Rival Hackers',
    titlePt: 'Eliminar 5 Hackers Rivais',
    target: 5,
    reward: 120,
    statKey: 'dailyKills',
    index: 0
  },
  {
    id: 'daily_wins',
    title: 'Survive to #1 in 2 Matches',
    titlePt: 'Conquistar a Vitória #1 em 2 Partidas',
    target: 2,
    reward: 180,
    statKey: 'dailyWins',
    index: 1
  },
  {
    id: 'daily_crates',
    title: 'Scavenge 4 Supply Crates',
    titlePt: 'Abrir 4 Caixas de Suprimentos',
    target: 4,
    reward: 100,
    statKey: 'dailyCrates',
    index: 2
  }
];

export const WEEKLY_QUESTS_DEF = [
  {
    id: 'weekly_kills',
    title: 'Eliminate 25 Rival Hackers',
    titlePt: 'Eliminar 25 Hackers Rivais',
    target: 25,
    reward: 600,
    statKey: 'weeklyKills',
    index: 0
  },
  {
    id: 'weekly_wins',
    title: 'Win 5 Sector Championships (#1)',
    titlePt: 'Vencer 5 Setores como #1 Sobrevivente',
    target: 5,
    reward: 1000,
    statKey: 'weeklyWins',
    index: 1
  },
  {
    id: 'weekly_crates',
    title: 'Scavenge 20 Supply Crates',
    titlePt: 'Abrir 20 Caixas de Suprimentos',
    target: 20,
    reward: 500,
    statKey: 'weeklyCrates',
    index: 2
  }
];

export class QuestsManager {
  getQuestsState() {
    const qData = storage.data.quests;
    const daily = DAILY_QUESTS_DEF.map((q) => {
      const current = qData[q.statKey] || 0;
      const isComplete = current >= q.target;
      const isClaimed = Boolean(qData.dailyClaimed && qData.dailyClaimed[q.index]);
      return {
        ...q,
        current: Math.min(q.target, current),
        isComplete,
        isClaimed
      };
    });

    const weekly = WEEKLY_QUESTS_DEF.map((q) => {
      const current = qData[q.statKey] || 0;
      const isComplete = current >= q.target;
      const isClaimed = Boolean(qData.weeklyClaimed && qData.weeklyClaimed[q.index]);
      return {
        ...q,
        current: Math.min(q.target, current),
        isComplete,
        isClaimed
      };
    });

    return { daily, weekly };
  }

  claimQuest(type, index, doubleWithAd = false, onComplete = null) {
    const state = this.getQuestsState();
    const list = type === 'daily' ? state.daily : state.weekly;
    const item = list[index];

    if (!item || !item.isComplete || item.isClaimed) {
      if (onComplete) onComplete(false);
      return;
    }

    const grant = (multiplier = 1) => {
      const payout = item.reward * multiplier;
      storage.addCredits(payout);
      sound.playCrateOpen();

      if (type === 'daily') {
        const arr = [...(storage.data.quests.dailyClaimed || [false, false, false])];
        arr[index] = true;
        storage.save({ quests: { ...storage.data.quests, dailyClaimed: arr } });
      } else {
        const arr = [...(storage.data.quests.weeklyClaimed || [false, false, false])];
        arr[index] = true;
        storage.save({ quests: { ...storage.data.quests, weeklyClaimed: arr } });
      }

      if (onComplete) onComplete(true, payout);
    };

    if (doubleWithAd) {
      crazyGames.requestRewardedAd(
        () => grant(2),
        () => grant(1)
      );
    } else {
      grant(1);
    }
  }
}

export const quests = new QuestsManager();
