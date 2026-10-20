/**
 * @fileoverview Tactical Entities for Cyber Arena: Neon Survival
 * - Player with fluid movement, weapon aiming, recoil, and invulnerable cyber dash
 * - Dynamic Rogue Hacker Bots with state machines (Scavenge -> Combat -> Cover -> Storm Flee)
 * - Supply Crates, Floating Holographic Pickups, Projectiles, and Contracting Storm Zone
 */

import { FIXED_DT, sanitize, dist, distSq, angleBetween, normalize, clamp, resolveCircleBox, resolveCircleCircle, hasLineOfSight } from './physics.js';
import { WEAPONS, ITEMS } from './weapons.js';
import { particles } from './particles.js';
import { sound } from './audio.js';
import { shaker, hitStop, floaters, SquashStretch, triggerHaptic } from './juice.js';
import { storage } from './storage.js';
import { SKINS_DEF } from './shop.js';

export class Bullet {
  constructor(x, y, angle, weapon, shooterId, damageMult = 1.0) {
    this.x = sanitize(x);
    this.y = sanitize(y);
    this.angle = sanitize(angle);
    this.weapon = weapon;
    this.shooterId = shooterId;
    this.damage = Math.round(weapon.damage * damageMult);
    this.speed = weapon.bulletSpeed;
    this.radius = weapon.bulletRadius || 4;
    this.range = weapon.range || 800;
    this.traveled = 0;
    this.piercing = Boolean(weapon.piercing);
    this.hitEntities = new Set();
    this.color = weapon.color || '#00f5ff';
    this.coreColor = weapon.coreColor || '#ffffff';
    this.glowColor = weapon.glowColor || 'rgba(0, 245, 255, 0.7)';

    const spreadAngle = (Math.random() - 0.5) * (weapon.spread || 0.05);
    const finalAngle = this.angle + spreadAngle;
    this.vx = Math.cos(finalAngle) * this.speed;
    this.vy = Math.sin(finalAngle) * this.speed;
    this.isDead = false;
  }

  update(dt, obstacles) {
    const stepDist = this.speed * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.traveled += stepDist;

    if (this.traveled >= this.range) {
      this.isDead = true;
      return;
    }

    // Check collision with obstacles
    for (let i = 0; i < obstacles.length; i++) {
      const box = obstacles[i];
      if (
        this.x >= box.x &&
        this.x <= box.x + box.w &&
        this.y >= box.y &&
        this.y <= box.y + box.h
      ) {
        particles.spawnSparks(this.x, this.y, 6, this.color, 160);
        this.isDead = true;
        return;
      }
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Glowing bullet trail
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.ellipse(0, 0, this.radius * 2.2, this.radius, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hot center core
    ctx.fillStyle = this.coreColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, this.radius * 1.2, this.radius * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

export class Pickup {
  constructor(x, y, itemOrWeapon, type = 'weapon') {
    this.x = sanitize(x);
    this.y = sanitize(y);
    this.data = itemOrWeapon;
    this.type = type; // 'weapon' or 'item'
    this.radius = 16;
    this.bobTimer = Math.random() * Math.PI * 2;
    this.isDead = false;
  }

  update(dt) {
    this.bobTimer += dt * 3;
  }

  draw(ctx) {
    const bobOffset = Math.sin(this.bobTimer) * 4;
    ctx.save();
    ctx.translate(this.x, this.y + bobOffset);

    // Base glowing halo
    const color = this.data.color || '#00f5ff';
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Item Icon
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.data.icon || '📦', 0, 1);

    ctx.restore();
  }
}

export class SupplyCrate {
  constructor(x, y) {
    this.x = sanitize(x);
    this.y = sanitize(y);
    this.w = 44;
    this.h = 44;
    this.radius = 24;
    this.hp = 30;
    this.maxHp = 30;
    this.isOpened = false;
    this.pulseTimer = Math.random() * Math.PI * 2;
  }

  takeDamage(amount) {
    if (this.isOpened) return [];
    this.hp -= amount;
    sound.playShieldHit();
    particles.spawnSparks(this.x, this.y, 6, '#facc15', 180);

    if (this.hp <= 0) {
      return this.open();
    }
    return [];
  }

  open() {
    if (this.isOpened) return [];
    this.isOpened = true;
    sound.playCrateOpen();
    particles.spawnShockwave(this.x, this.y, 70, '#facc15', 0.3);
    particles.spawnSparks(this.x, this.y, 16, '#facc15', 260);

    // Drop items
    const drops = [];
    const weaponPool = [WEAPONS.plasma_smg, WEAPONS.pulse_shotgun, WEAPONS.emp_railgun, WEAPONS.beam_katana];
    const chosenWeapon = weaponPool[Math.floor(Math.random() * weaponPool.length)];
    drops.push(new Pickup(this.x + (Math.random() - 0.5) * 30, this.y + (Math.random() - 0.5) * 30, chosenWeapon, 'weapon'));

    if (Math.random() < 0.6) {
      drops.push(new Pickup(this.x + (Math.random() - 0.5) * 30, this.y + (Math.random() - 0.5) * 30, ITEMS.shield_cell, 'item'));
    } else {
      drops.push(new Pickup(this.x + (Math.random() - 0.5) * 30, this.y + (Math.random() - 0.5) * 30, ITEMS.medkit, 'item'));
    }

    return drops;
  }

  update(dt) {
    this.pulseTimer += dt * 3;
  }

  draw(ctx) {
    if (this.isOpened) return;
    ctx.save();
    ctx.translate(this.x, this.y);

    const pulse = 0.8 + 0.2 * Math.sin(this.pulseTimer);
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 14 * pulse;

    ctx.fillRect(-this.w * 0.5, -this.h * 0.5, this.w, this.h);
    ctx.strokeRect(-this.w * 0.5, -this.h * 0.5, this.w, this.h);

    // High tech cross stripes
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)';
    ctx.beginPath();
    ctx.moveTo(-this.w * 0.5, -this.h * 0.5);
    ctx.lineTo(this.w * 0.5, this.h * 0.5);
    ctx.moveTo(this.w * 0.5, -this.h * 0.5);
    ctx.lineTo(-this.w * 0.5, this.h * 0.5);
    ctx.stroke();

    // Emblem
    ctx.fillStyle = '#fef08a';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚡', 0, 0);

    ctx.restore();
  }
}

export class StormZone {
  constructor(arenaW, arenaH, initialRadius, shrinkSpeed) {
    this.centerX = arenaW * 0.5;
    this.centerY = arenaH * 0.5;
    this.currentRadius = initialRadius;
    this.targetRadius = 80;
    this.shrinkSpeed = shrinkSpeed;
    this.dps = 10;
    this.pulse = 0;
    this.isClosing = true;
    this.warningTimer = 0;
  }

  update(dt) {
    this.pulse += dt * 2.5;
    if (this.isClosing && this.currentRadius > this.targetRadius) {
      this.currentRadius = Math.max(this.targetRadius, this.currentRadius - this.shrinkSpeed * dt);
      this.warningTimer += dt;
      if (this.warningTimer >= 12) {
        this.warningTimer = 0;
        sound.playStormWarning();
      }
    }
  }

  isInside(x, y) {
    return dist(x, y, this.centerX, this.centerY) <= this.currentRadius;
  }

  draw(ctx, viewLeft, viewTop, viewRight, viewBottom) {
    ctx.save();

    // Draw the danger zone (outside the circle)
    ctx.beginPath();
    ctx.rect(viewLeft - 100, viewTop - 100, (viewRight - viewLeft) + 200, (viewBottom - viewTop) + 200);
    ctx.arc(this.centerX, this.centerY, this.currentRadius, 0, Math.PI * 2, true);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
    ctx.fill();

    // Neon glowing perimeter border
    const pulseOffset = Math.sin(this.pulse) * 3;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.currentRadius + pulseOffset, 0, Math.PI * 2);
    ctx.stroke();

    // Inner scanning cyber lines
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }
}

export class Character {
  constructor(id, name, x, y, isBot = false) {
    this.id = id;
    this.name = name;
    this.x = sanitize(x);
    this.y = sanitize(y);
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.radius = 18;
    this.isBot = isBot;

    this.maxHp = 100;
    this.hp = 100;
    this.maxShield = 100;
    this.shield = 100;
    this.speed = 220;

    this.activeWeapon = WEAPONS.neon_blaster;
    this.clipAmmo = this.activeWeapon.clipSize;
    this.reserveAmmo = 9999;
    this.fireTimer = 0;
    this.isReloading = false;
    this.reloadTimer = 0;

    // Cyber Dash
    this.dashCooldown = 3.5;
    this.dashCooldownTimer = 0;
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashDuration = 0.22;
    this.dashSpeed = 620;
    this.dashVx = 0;
    this.dashVy = 0;

    this.squashStretch = new SquashStretch();
    this.isAlive = true;
    this.kills = 0;
    this.color = isBot ? '#f43f5e' : '#00f5ff';
    this.invulnerableTimer = 0;
  }

  takeDamage(amount, attacker = null) {
    if (!this.isAlive || this.isDashing || this.invulnerableTimer > 0) return 0;

    let dmg = Math.max(1, Math.round(amount));
    let absorbed = 0;

    if (this.shield > 0) {
      if (this.shield >= dmg) {
        this.shield -= dmg;
        absorbed = dmg;
        dmg = 0;
      } else {
        dmg -= this.shield;
        absorbed = this.shield;
        this.shield = 0;
      }
      sound.playShieldHit();
      floaters.spawn(`-${absorbed}`, this.x, this.y - 12, '#38bdf8');
    }

    if (dmg > 0) {
      this.hp = Math.max(0, this.hp - dmg);
      sound.playClick();
      floaters.spawn(`-${dmg}`, this.x, this.y, '#ef4444', dmg >= 40);
      particles.spawnSparks(this.x, this.y, 8, '#ef4444', 160);
      this.squashStretch.punch(1.25, 0.75);

      if (!this.isBot) {
        shaker.addTrauma(0.35);
        triggerHaptic(35);
      }
    }

    if (this.hp <= 0) {
      this.die(attacker);
    }

    return absorbed + dmg;
  }

  die(killer = null) {
    this.isAlive = false;
    sound.playKill();
    particles.spawnDisintegration(this.x, this.y, this.color, 28);
    particles.spawnShockwave(this.x, this.y, 85, this.color, 0.35);

    if (killer) {
      killer.kills = (killer.kills || 0) + 1;
      floaters.spawn(`+1 KILL!`, killer.x, killer.y - 28, '#22c55e', true);
    }
  }

  heal(amount) {
    if (!this.isAlive) return;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    sound.playHeal();
    floaters.spawn(`+${amount} HP`, this.x, this.y - 14, '#22c55e');
  }

  addShield(amount) {
    if (!this.isAlive) return;
    this.shield = Math.min(this.maxShield, this.shield + amount);
    sound.playShieldRecharge();
    floaters.spawn(`+${amount} SHIELD`, this.x, this.y - 14, '#38bdf8');
  }

  triggerDash(dirX, dirY) {
    if (this.dashCooldownTimer > 0 || this.isDashing || !this.isAlive) return false;
    const len = Math.sqrt(dirX * dirX + dirY * dirY);
    if (len < 0.001) {
      this.dashVx = Math.cos(this.angle) * this.dashSpeed;
      this.dashVy = Math.sin(this.angle) * this.dashSpeed;
    } else {
      this.dashVx = (dirX / len) * this.dashSpeed;
      this.dashVy = (dirY / len) * this.dashSpeed;
    }

    this.isDashing = true;
    this.dashTimer = this.dashDuration;
    this.dashCooldownTimer = this.dashCooldown;
    this.squashStretch.punch(0.7, 1.4);
    sound.playCyberDash();
    particles.spawnDashGhost(this.x, this.y, this.radius, this.angle, this.color);
    return true;
  }

  setWeapon(weapon) {
    this.activeWeapon = weapon;
    this.clipAmmo = weapon.clipSize;
    this.fireTimer = 0;
    this.isReloading = false;
    this.squashStretch.punch(1.3, 0.7);
  }

  reload() {
    if (this.isReloading || this.clipAmmo >= this.activeWeapon.clipSize) return;
    this.isReloading = true;
    this.reloadTimer = this.activeWeapon.reloadTime;
  }

  updateBaseTimers(dt) {
    this.squashStretch.update(dt);
    if (this.fireTimer > 0) this.fireTimer -= dt;
    if (this.dashCooldownTimer > 0) this.dashCooldownTimer -= dt;
    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;

    if (this.isDashing) {
      this.dashTimer -= dt;
      this.x += this.dashVx * dt;
      this.y += this.dashVy * dt;
      if (Math.random() < 0.5) {
        particles.spawnDashGhost(this.x, this.y, this.radius, this.angle, this.color);
      }
      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
    }

    if (this.isReloading) {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) {
        this.isReloading = false;
        this.clipAmmo = this.activeWeapon.clipSize;
      }
    }
  }

  tryFire(targetAngle, bulletManager, damageBonus = 1.0) {
    if (!this.isAlive || this.fireTimer > 0 || this.isDashing || this.isReloading) return false;

    if (this.clipAmmo <= 0) {
      this.reload();
      return false;
    }

    this.clipAmmo--;
    this.fireTimer = this.activeWeapon.fireRate;
    this.squashStretch.punch(0.85, 1.25);

    // Muzzle & audio
    const barrelDist = this.radius + 12;
    const muzzleX = this.x + Math.cos(targetAngle) * barrelDist;
    const muzzleY = this.y + Math.sin(targetAngle) * barrelDist;
    particles.spawnMuzzleFlash(muzzleX, muzzleY, targetAngle, this.activeWeapon.color);

    if (this.activeWeapon.id === 'plasma_smg') sound.playPlasmaSMG();
    else if (this.activeWeapon.id === 'pulse_shotgun') sound.playShotgun();
    else if (this.activeWeapon.id === 'emp_railgun') sound.playRailgun();
    else if (this.activeWeapon.id === 'beam_katana') sound.playKatanaSlash();
    else sound.playBlaster();

    if (!this.isBot) {
      shaker.addTrauma(this.activeWeapon.screenShake || 0.15);
    }

    if (this.activeWeapon.type === 'melee') {
      // Beam Katana Melee cleave
      return { type: 'melee', x: muzzleX, y: muzzleY, angle: targetAngle, weapon: this.activeWeapon, shooterId: this.id };
    } else {
      const count = this.activeWeapon.bulletCount || 1;
      for (let i = 0; i < count; i++) {
        bulletManager.push(new Bullet(muzzleX, muzzleY, targetAngle, this.activeWeapon, this.id, damageBonus));
      }
      return { type: 'bullet' };
    }
  }

  draw(ctx) {
    if (!this.isAlive) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.squashStretch.scaleX, this.squashStretch.scaleY);
    ctx.rotate(this.angle);

    // Shield Aura if active
    if (this.shield > 0) {
      const shieldAlpha = 0.2 + (this.shield / this.maxShield) * 0.35;
      ctx.fillStyle = `rgba(56, 189, 248, ${shieldAlpha})`;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#00f5ff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Body Capsule / Cyber Armor
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner Dark Core
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.7, 0, Math.PI * 2);
    ctx.fill();

    // Weapon Hands / Barrel Projection
    ctx.fillStyle = this.activeWeapon.color;
    ctx.fillRect(this.radius * 0.4, -4, 14, 8);

    ctx.restore();

    // HP & Shield Over-head Bar
    this.drawOverheadBar(ctx);
  }

  drawOverheadBar(ctx) {
    const barW = 38;
    const barH = 4;
    const barX = this.x - barW * 0.5;
    const barY = this.y - this.radius - 14;

    ctx.save();
    // Background bar
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(barX - 1, barY - 1, barW + 2, barH * 2 + 3);

    // Shield Bar (cyan, top row)
    const shieldPct = clamp(this.shield / this.maxShield, 0, 1);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(barX, barY, barW * shieldPct, barH);

    // HP Bar (green/red, bottom row)
    const hpPct = clamp(this.hp / this.maxHp, 0, 1);
    ctx.fillStyle = hpPct > 0.3 ? '#22c55e' : '#ef4444';
    ctx.fillRect(barX, barY + barH + 1, barW * hpPct, barH);

    ctx.restore();
  }
}

export class Player extends Character {
  constructor(x, y) {
    super('player', 'PLAYER', x, y, false);
    this.applyUpgrades();
    this.hp = this.maxHp;
    this.shield = this.maxShield;
  }

  applyUpgrades() {
    const hpLevel = storage.getUpgradeLevel('maxHealth');
    const shieldLevel = storage.getUpgradeLevel('maxShield');
    const dashLevel = storage.getUpgradeLevel('dashCooldown');

    this.maxHp = 100 + hpLevel * 20;
    this.maxShield = 100 + shieldLevel * 15;
    this.dashCooldown = Math.max(1.8, 3.5 * (1 - dashLevel * 0.1));

    // Equipped skin color
    const skinId = storage.data.equippedSkin || 'hacker_default';
    const skinDef = SKINS_DEF.find((s) => s.id === skinId);
    if (skinDef && skinDef.color) {
      this.color = skinDef.color;
    }
  }

  getDamageMultiplier() {
    const dmgLevel = storage.getUpgradeLevel('damageBonus');
    return 1.0 + dmgLevel * 0.08;
  }
}

export class Bot extends Character {
  constructor(id, name, x, y, difficulty = 'medium') {
    super(id, name, x, y, true);
    this.difficulty = difficulty;
    this.state = 'scavenge'; // 'scavenge', 'combat', 'take_cover', 'flee_storm'
    this.stateTimer = 0;
    this.targetEntity = null;
    this.targetCrate = null;
    this.strafeDir = 1;
    this.accuracy = difficulty === 'easy' ? 0.25 : difficulty === 'medium' ? 0.14 : 0.07;
  }

  updateAI(dt, player, otherBots, crates, storm, obstacles, bullets, pickups = null) {
    this.updateBaseTimers(dt);
    if (!this.isAlive) return;

    this.stateTimer += dt;

    // 1. Check if outside Storm Zone -> Priority: Flee Storm
    if (!storm.isInside(this.x, this.y)) {
      this.state = 'flee_storm';
    }

    // Evaluate State
    if (this.state === 'flee_storm') {
      const angleToCenter = angleBetween(this.x, this.y, storm.centerX, storm.centerY);
      this.vx = Math.cos(angleToCenter) * this.speed;
      this.vy = Math.sin(angleToCenter) * this.speed;
      this.angle = angleToCenter;

      if (storm.isInside(this.x, this.y)) {
        this.state = 'scavenge';
      }
      return;
    }

    // 2. Scan for nearest targets
    const candidates = [player, ...otherBots.filter((b) => b !== this && b.isAlive)];
    let closestTarget = null;
    let closestDist = 550; // Vision range

    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      if (!c.isAlive) continue;
      const d = dist(this.x, this.y, c.x, c.y);
      if (d < closestDist && hasLineOfSight(this.x, this.y, c.x, c.y, obstacles)) {
        closestDist = d;
        closestTarget = c;
      }
    }

    if (closestTarget) {
      this.targetEntity = closestTarget;
      this.state = 'combat';
    } else {
      this.state = 'scavenge';
    }

    // 3. Execute Behavior
    if (this.state === 'combat' && this.targetEntity && this.targetEntity.isAlive) {
      const d = dist(this.x, this.y, this.targetEntity.x, this.targetEntity.y);
      const aimAngle = angleBetween(this.x, this.y, this.targetEntity.x, this.targetEntity.y);
      this.angle = aimAngle;

      // Tactical combat strafing
      if (this.stateTimer > 1.2) {
        this.stateTimer = 0;
        this.strafeDir *= -1;
      }

      if (d > 340) {
        // Close in
        this.vx = Math.cos(aimAngle) * this.speed * 0.9;
        this.vy = Math.sin(aimAngle) * this.speed * 0.9;
      } else if (d < 180) {
        // Back off
        this.vx = -Math.cos(aimAngle) * this.speed * 0.8;
        this.vy = -Math.sin(aimAngle) * this.speed * 0.8;
      } else {
        // Strafe perpendicular
        const strafeAngle = aimAngle + (Math.PI * 0.5) * this.strafeDir;
        this.vx = Math.cos(strafeAngle) * this.speed * 0.75;
        this.vy = Math.sin(strafeAngle) * this.speed * 0.75;
      }

      // Try firing with accuracy error
      const shotAngle = aimAngle + (Math.random() - 0.5) * this.accuracy;
      this.tryFire(shotAngle, bullets);
    } else {
      // Scavenge mode: search for crates or wander
      let nearestCrate = null;
      let minCrateDist = 600;

      for (let i = 0; i < crates.length; i++) {
        const cr = crates[i];
        if (cr.isOpened) continue;
        const d = dist(this.x, this.y, cr.x, cr.y);
        if (d < minCrateDist) {
          minCrateDist = d;
          nearestCrate = cr;
        }
      }

      if (nearestCrate) {
        const a = angleBetween(this.x, this.y, nearestCrate.x, nearestCrate.y);
        this.vx = Math.cos(a) * this.speed * 0.7;
        this.vy = Math.sin(a) * this.speed * 0.7;
        this.angle = a;
        if (minCrateDist < 50) {
          const drops = nearestCrate.takeDamage(10);
          if (drops && drops.length > 0 && pickups) {
            pickups.push(...drops);
          }
        }
      } else {
        // Gentle wander
        if (this.stateTimer > 2.0) {
          this.stateTimer = 0;
          this.angle += (Math.random() - 0.5) * 1.5;
        }
        this.vx = Math.cos(this.angle) * this.speed * 0.45;
        this.vy = Math.sin(this.angle) * this.speed * 0.45;
      }
    }
  }
}
