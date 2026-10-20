/**
 * @fileoverview Meta-Shop Manager for Cyber Arena: Neon Survival
 * Manages permanent upgrades and unlocking / equipping cyber skins.
 */

import { storage } from './storage.js';

export const UPGRADES_DEF = [
  {
    key: 'maxHealth',
    name: 'Nanite Frame',
    namePt: 'Estrutura Nanite',
    desc: '+20 Max HP per level',
    descPt: '+20 HP Máx por nível',
    icon: '✚',
    color: '#22c55e',
    costs: [150, 300, 500, 850, 1400]
  },
  {
    key: 'maxShield',
    name: 'Overclocked Shield',
    namePt: 'Escudo Overclock',
    desc: '+15 Max Shield per level',
    descPt: '+15 Escudo Máx por nível',
    icon: '🛡️',
    color: '#38bdf8',
    costs: [150, 300, 500, 850, 1400]
  },
  {
    key: 'dashCooldown',
    name: 'Neural Dash',
    namePt: 'Cyber Dash Neural',
    desc: '-10% Dash Cooldown',
    descPt: '-10% Tempo de Recarga do Dash',
    icon: '⚡',
    color: '#facc15',
    costs: [200, 400, 700, 1100, 1700]
  },
  {
    key: 'damageBonus',
    name: 'Plasma Mod',
    namePt: 'Módulo de Plasma',
    desc: '+8% Weapon Damage',
    descPt: '+8% Dano de Armas',
    icon: '💥',
    color: '#f43f5e',
    costs: [250, 500, 900, 1400, 2200]
  }
];

export const SKINS_DEF = [
  {
    id: 'hacker_default',
    name: 'Rogue Hacker',
    namePt: 'Hacker Renegado',
    color: '#00f5ff',
    cost: 0,
    icon: '👤'
  },
  {
    id: 'neon_runner',
    name: 'Neon Runner',
    namePt: 'Corredor Neon',
    color: '#facc15',
    cost: 600,
    icon: '🏃'
  },
  {
    id: 'cyber_ninja',
    name: 'Cyber Ninja',
    namePt: 'Ninja Cibernético',
    color: '#22c55e',
    cost: 1000,
    icon: '🥷'
  },
  {
    id: 'void_spectre',
    name: 'Void Spectre',
    namePt: 'Espectro do Vazio',
    color: '#d946ef',
    cost: 1800,
    icon: '👻'
  },
  {
    id: 'matrix_overlord',
    name: 'Matrix Overlord',
    namePt: 'Soberano da Matrix',
    color: '#f43f5e',
    cost: 3000,
    icon: '👑'
  }
];

export class ShopManager {
  getUpgradesState() {
    return UPGRADES_DEF.map((u) => {
      const curLevel = storage.getUpgradeLevel(u.key);
      const isMax = curLevel >= u.costs.length;
      const nextCost = isMax ? null : u.costs[curLevel];
      return {
        ...u,
        level: curLevel,
        maxLevel: u.costs.length,
        isMax,
        cost: nextCost
      };
    });
  }

  buyUpgrade(key) {
    const u = UPGRADES_DEF.find((item) => item.key === key);
    if (!u) return false;
    const curLevel = storage.getUpgradeLevel(key);
    if (curLevel >= u.costs.length) return false;
    const cost = u.costs[curLevel];
    return storage.buyUpgrade(key, cost);
  }

  getSkinsState() {
    const unlocked = storage.data.unlockedSkins || ['hacker_default'];
    const equipped = storage.data.equippedSkin || 'hacker_default';

    return SKINS_DEF.map((s) => ({
      ...s,
      isUnlocked: unlocked.includes(s.id),
      isEquipped: equipped === s.id
    }));
  }

  buyOrEquipSkin(skinId) {
    const skin = SKINS_DEF.find((s) => s.id === skinId);
    if (!skin) return false;

    const unlocked = storage.data.unlockedSkins || ['hacker_default'];
    if (unlocked.includes(skinId)) {
      return storage.equipSkin(skinId);
    }

    if (storage.spendCredits(skin.cost)) {
      storage.unlockSkin(skinId);
      storage.equipSkin(skinId);
      return true;
    }
    return false;
  }
}

export const shop = new ShopManager();
