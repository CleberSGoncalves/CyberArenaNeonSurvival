/**
 * @fileoverview Weapon & Arsenal Definitions for Cyber Arena: Neon Survival
 * Balanced weapon archetypes with distinct ranges, fire rates, screen shake, and hit-stops.
 */

export const WEAPONS = {
  neon_blaster: {
    id: 'neon_blaster',
    name: 'Neon Blaster',
    namePt: 'Pistola Neon',
    type: 'ranged',
    damage: 22,
    fireRate: 0.22, // seconds between shots
    bulletSpeed: 820,
    bulletRadius: 4,
    range: 750,
    spread: 0.04,
    bulletCount: 1,
    ammoPerShot: 1,
    maxAmmo: 9999, // infinite reserve
    clipSize: 15,
    reloadTime: 1.1,
    color: '#00f5ff',
    coreColor: '#ffffff',
    glowColor: 'rgba(0, 245, 255, 0.7)',
    screenShake: 0.15,
    hitStopMs: 30,
    sfx: 'blaster',
    icon: '🔫',
    tier: 1
  },
  plasma_smg: {
    id: 'plasma_smg',
    name: 'Plasma SMG',
    namePt: 'Submetralhadora Plasma',
    type: 'ranged',
    damage: 15,
    fireRate: 0.085,
    bulletSpeed: 900,
    bulletRadius: 3.5,
    range: 650,
    spread: 0.12,
    bulletCount: 1,
    ammoPerShot: 1,
    maxAmmo: 180,
    clipSize: 32,
    reloadTime: 1.4,
    color: '#38bdf8',
    coreColor: '#e0f2fe',
    glowColor: 'rgba(56, 189, 248, 0.7)',
    screenShake: 0.12,
    hitStopMs: 25,
    sfx: 'plasma',
    icon: '⚡',
    tier: 2
  },
  pulse_shotgun: {
    id: 'pulse_shotgun',
    name: 'Pulse Shotgun',
    namePt: 'Escopeta de Pulso',
    type: 'ranged',
    damage: 16, // per pellet (x5 = 80 max)
    fireRate: 0.7,
    bulletSpeed: 700,
    bulletRadius: 4,
    range: 480,
    spread: 0.28,
    bulletCount: 5,
    ammoPerShot: 1,
    maxAmmo: 40,
    clipSize: 6,
    reloadTime: 1.8,
    color: '#f59e0b',
    coreColor: '#fef3c7',
    glowColor: 'rgba(245, 158, 11, 0.75)',
    screenShake: 0.45,
    hitStopMs: 50,
    sfx: 'shotgun',
    icon: '💥',
    tier: 3
  },
  emp_railgun: {
    id: 'emp_railgun',
    name: 'EMP Railgun',
    namePt: 'Canhão de Trilho EMP',
    type: 'ranged',
    damage: 115,
    fireRate: 1.25,
    bulletSpeed: 1700,
    bulletRadius: 6,
    range: 1200,
    spread: 0.01,
    bulletCount: 1,
    piercing: true,
    ammoPerShot: 1,
    maxAmmo: 20,
    clipSize: 4,
    reloadTime: 2.2,
    color: '#d946ef',
    coreColor: '#fdf4ff',
    glowColor: 'rgba(217, 70, 239, 0.85)',
    screenShake: 0.7,
    hitStopMs: 70,
    sfx: 'railgun',
    icon: '🎯',
    tier: 4
  },
  beam_katana: {
    id: 'beam_katana',
    name: 'Beam Katana',
    namePt: 'Katana de Feixe',
    type: 'melee',
    damage: 75,
    fireRate: 0.4,
    range: 95,
    arcAngle: Math.PI * 0.7,
    bulletCount: 0,
    speedBoost: 1.2,
    color: '#22c55e',
    coreColor: '#dcfce7',
    glowColor: 'rgba(34, 197, 94, 0.8)',
    screenShake: 0.35,
    hitStopMs: 60,
    sfx: 'katana',
    icon: '⚔️',
    tier: 3
  }
};

export const ITEMS = {
  medkit: {
    id: 'medkit',
    name: 'Nanite Medkit',
    namePt: 'Kit de Nanites',
    type: 'heal',
    amount: 50,
    color: '#10b981',
    icon: '✚'
  },
  shield_cell: {
    id: 'shield_cell',
    name: 'Shield Battery',
    namePt: 'Bateria de Escudo',
    type: 'shield',
    amount: 50,
    color: '#06b6d4',
    icon: '🛡️'
  },
  ammo_pack: {
    id: 'ammo_pack',
    name: 'Energy Ammo Cache',
    namePt: 'Munição de Energia',
    type: 'ammo',
    amount: 50,
    color: '#facc15',
    icon: '📦'
  }
};
