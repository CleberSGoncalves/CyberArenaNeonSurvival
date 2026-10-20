/**
 * @fileoverview Main Game Engine & Full-Bleed Dynamic Renderer for Cyber Arena: Neon Survival
 * - 60Hz Fixed Timestep Physics Accumulator (FIXED_DT = 1/60s) for 60Hz, 144Hz, and 165Hz displays
 * - Full-bleed rendering via ResizeObserver with devicePixelRatio (zero "tela pequena")
 * - Dynamic Camera with Look-Ahead and Trauma² screen shake
 * - Integrated Minimap Cyber-Radar
 * - Transparent 1★, 2★, and 3★ star progression with early completion option
 * - CrazyGames SDK v3 complete lifecycle and watchdog integration
 */

import { FIXED_DT, sanitize, dist, distSq, angleBetween, clamp, resolveCircleBox, resolveCircleCircle, clampToArena } from './physics.js';
import { SECTORS } from './levels.js';
import { MAPS, getMapById } from './maps.js';
import { WEAPONS, ITEMS } from './weapons.js';
import { Player, Bot, SupplyCrate, StormZone, Bullet, DestructibleCover } from './entities.js';
import { particles } from './particles.js';
import { shaker, hitStop, floaters } from './juice.js';
import { sound } from './audio.js';
import { storage } from './storage.js';
import { i18n } from './i18n.js';
import { crazyGames } from './crazygames.js';
import { cyberRenderer } from './cyber_renderer.js';

export class GameEngine {
  constructor(canvas, hud) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.hud = hud;

    // Viewport
    this.viewW = 1280;
    this.viewH = 720;
    this.camera = { x: 1000, y: 1000, targetX: 1000, targetY: 1000 };

    // State & Modular Maps
    this.currentSectorIndex = 0;
    this.sector = SECTORS[0];
    this.currentMap = MAPS[0];
    this.isPaused = false;
    this.isAdPaused = false;
    this.isRoundOver = false;
    this.matchStartTime = 0;
    this.elapsedMatchTime = 0;
    this.hasRevivedThisMatch = false;

    // Entities & Map Objects
    this.player = null;
    this.bots = [];
    this.crates = [];
    this.pickups = [];
    this.bullets = [];
    this.destructibleCovers = [];
    this.obstacles = [];
    this.storm = null;

    // Inputs
    this.keys = {};
    this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0, isDown: false };
    this.touchFiring = false;

    // Fixed timestep accumulator
    this.accumulator = 0;
    this.lastFrameTime = performance.now();
    this.animId = null;

    this.initResizeObserver();
    this.initInputListeners();
  }

  initResizeObserver() {
    const parent = this.canvas.parentElement;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = Math.max(320, entry.contentRect.width);
        const height = Math.max(320, entry.contentRect.height);
        this.viewW = width;
        this.viewH = height;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = Math.floor(width * dpr);
        this.canvas.height = Math.floor(height * dpr);
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    });

    if (parent) observer.observe(parent);
    else observer.observe(document.body);
  }

  initInputListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'KeyQ') this.useQuickHeal();
      if (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.triggerPlayerDash();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.mouse.isDown = true;
        crazyGames.gameplayStart();
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouse.isDown = false;
    });
  }

  start() {
    const initialSector = (storage.data.unlockedSectors || 1) - 1;
    this.loadSector(initialSector);
    this.lastFrameTime = performance.now();
    this.loop(this.lastFrameTime);
  }

  loadMap(mapId) {
    this.currentMap = getMapById(mapId);
    if (this.hud && this.hud.showLoadingTransition) {
      const mapName = i18n.locale === 'pt' ? this.currentMap.namePt : this.currentMap.name;
      this.hud.showLoadingTransition(mapName, () => {
        this.loadSector(this.currentSectorIndex);
      });
    } else {
      this.loadSector(this.currentSectorIndex);
    }
  }

  loadSector(sectorIndex) {
    this.currentSectorIndex = Math.min(SECTORS.length - 1, Math.max(0, sectorIndex));
    this.sector = SECTORS[this.currentSectorIndex];

    // Anti-softlock unconditional resets
    this.isRoundOver = false;
    this.isPaused = false;
    this.isAdPaused = false;
    this.hasRevivedThisMatch = false;
    if (sound && sound.setAdMuted) sound.setAdMuted(false);
    this.hud.modalCtrl.closeAll();

    particles.reset();
    floaters.reset();
    this.bullets.length = 0;
    this.pickups.length = 0;
    this.crates.length = 0;
    this.bots.length = 0;

    const w = this.currentMap ? this.currentMap.arenaWidth : this.sector.arenaWidth;
    const h = this.currentMap ? this.currentMap.arenaHeight : this.sector.arenaHeight;

    // Merge Map Obstacles and Destructible Covers
    this.obstacles = [...(this.currentMap.obstacles || []), ...(this.sector.obstacles || [])];
    this.destructibleCovers = (this.currentMap.destructibleCovers || []).map((c) => new DestructibleCover(c));

    // Spawn Player at tactical drop insertion
    const spawnX = w * 0.5 + (Math.random() - 0.5) * 300;
    const spawnY = h * 0.5 + (Math.random() - 0.5) * 300;
    this.player = new Player(spawnX, spawnY);
    this.camera.x = spawnX;
    this.camera.y = spawnY;

    // Spawn Storm Zone using map shrink speed & dimensions
    const stormSpeed = this.currentMap.stormShrinkSpeed || this.sector.stormShrinkSpeed;
    this.storm = new StormZone(w, h, w * 0.48, stormSpeed);

    // Spawn Supply Crates
    const crateCount = this.sector.crateCount || 12;
    for (let i = 0; i < crateCount; i++) {
      const cx = 150 + Math.random() * (w - 300);
      const cy = 150 + Math.random() * (h - 300);
      this.crates.push(new SupplyCrate(cx, cy));
    }

    // Spawn Tactical Bots (15 bots = 16 combatants in Battle Royale)
    const botNames = [
      'Zero-One', 'NeonSpectre', 'BitSlayer', 'GhostRider',
      'Viper_X', 'CyberPunk_99', 'DataReaper', 'GlitchCore',
      'NullPointer', 'ByteKnight', 'ShadowNode', 'ProxyWar',
      'ApexDrifter', 'KinoEnforcer', 'HexDaemon', 'Overrider'
    ];

    const botCount = Math.max(15, this.currentMap.initialBotCount || this.sector.botCount || 15);
    for (let i = 0; i < botCount; i++) {
      const bx = 120 + Math.random() * (w - 240);
      const by = 120 + Math.random() * (h - 240);
      const name = botNames[i % botNames.length];
      const bot = new Bot(`bot_${i}`, name, bx, by, this.sector.botDifficulty);

      // Random bot starter weapon
      const weaponsList = [WEAPONS.neon_blaster, WEAPONS.plasma_smg, WEAPONS.pulse_shotgun];
      bot.setWeapon(weaponsList[Math.floor(Math.random() * weaponsList.length)]);
      this.bots.push(bot);
    }

    this.matchStartTime = performance.now();
    this.elapsedMatchTime = 0;

    crazyGames.gameplayStart();
  }

  triggerPlayerDash() {
    if (!this.player || !this.player.isAlive) return;
    let dx = 0;
    let dy = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) dy -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) dy += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) dx -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) dx += 1;

    // Use touch joystick direction if active
    if (this.hud.touchJoyActive) {
      dx = this.hud.touchJoyDir.x;
      dy = this.hud.touchJoyDir.y;
    }

    this.player.triggerDash(dx, dy);
  }

  useQuickHeal() {
    if (!this.player || !this.player.isAlive) return;
    if (this.player.shield < this.player.maxShield) {
      this.player.addShield(50);
    } else if (this.player.hp < this.player.maxHp) {
      this.player.heal(40);
    }
  }

  evaluateStars() {
    if (!this.player) return 0;
    const livingCount = (this.player.isAlive ? 1 : 0) + this.bots.filter((b) => b.isAlive).length;
    let stars = 0;

    // Star 1: Top 3 OR Minimum Kills
    if (livingCount <= this.sector.star1MinRank || this.player.kills >= this.sector.star1MinKills) {
      stars = 1;
    }

    // Star 2: Par-time OR HP/Shield > 50%
    if (stars >= 1) {
      const hpPct = (this.player.hp + this.player.shield) / (this.player.maxHp + this.player.maxShield);
      if (this.elapsedMatchTime <= this.sector.star2ParTime || hpPct >= this.sector.star2MinHpPct) {
        stars = 2;
      }
    }

    // Star 3: Lone Champion (#1 Survivor)
    if (this.player.isAlive && this.bots.every((b) => !b.isAlive)) {
      stars = 3;
    }

    return stars;
  }

  resolveMeleeAttack(attacker, meleeData) {
    const range = meleeData.weapon.range || 75;
    const arc = meleeData.weapon.spread || 1.2;
    const damage = Math.round(meleeData.weapon.damage * (attacker === this.player ? this.player.getDamageMultiplier() : 1.0));
    const entities = [this.player, ...this.bots];

    // Hit Characters
    for (let i = 0; i < entities.length; i++) {
      const ent = entities[i];
      if (!ent.isAlive || ent.id === attacker.id) continue;
      const d = dist(attacker.x, attacker.y, ent.x, ent.y);
      if (d <= range + ent.radius) {
        const angleTo = angleBetween(attacker.x, attacker.y, ent.x, ent.y);
        let diff = Math.abs(angleTo - meleeData.angle);
        while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
        if (diff <= arc * 0.5) {
          ent.takeDamage(damage, attacker);
          particles.spawnSparks(ent.x, ent.y, 10, meleeData.weapon.color, 220);
          if (meleeData.weapon.hitStopMs) hitStop.trigger(meleeData.weapon.hitStopMs);
        }
      }
    }

    // Hit Crates
    for (let c = 0; c < this.crates.length; c++) {
      const cr = this.crates[c];
      if (cr.isOpened) continue;
      const d = dist(attacker.x, attacker.y, cr.x, cr.y);
      if (d <= range + cr.radius) {
        const angleTo = angleBetween(attacker.x, attacker.y, cr.x, cr.y);
        let diff = Math.abs(angleTo - meleeData.angle);
        while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
        if (diff <= arc * 0.5) {
          const drops = cr.takeDamage(damage);
          particles.spawnSparks(cr.x, cr.y, 8, '#facc15', 200);
          if (drops.length > 0) {
            this.pickups.push(...drops);
            if (attacker.id === 'player') {
              storage.updateQuestProgress(0, 0, 1);
            }
          }
        }
      }
    }
  }

  triggerExplosion(x, y, radius, damage) {
    shaker.addTrauma(0.55);
    particles.spawnShockwave(x, y, radius * 1.2, '#f97316', 0.45);
    particles.spawnSparks(x, y, 24, '#ef4444', 280);
    sound.playShotgun();

    const entities = [this.player, ...this.bots];
    for (let i = 0; i < entities.length; i++) {
      const ent = entities[i];
      if (!ent.isAlive) continue;
      const d = dist(x, y, ent.x, ent.y);
      if (d <= radius + ent.radius) {
        const falloff = 1 - d / (radius + ent.radius);
        ent.takeDamage(Math.round(damage * falloff));
      }
    }

    for (let c = 0; c < this.crates.length; c++) {
      const cr = this.crates[c];
      if (!cr.isOpened && dist(x, y, cr.x, cr.y) <= radius + cr.radius) {
        const drops = cr.takeDamage(damage);
        if (drops.length > 0) this.pickups.push(...drops);
      }
    }
  }

  completeSectorIfEligible() {
    const stars = this.evaluateStars();
    if (stars >= 1) {
      this.triggerMatchVictory(stars);
    }
  }

  triggerMatchVictory(stars) {
    if (this.isRoundOver) return;
    this.isRoundOver = true;
    crazyGames.gameplayStop();
    crazyGames.happyTime();

    const bonusCredits = this.sector.creditReward + stars * 40;
    const score = Math.round(this.player.kills * 250 + (100 - this.elapsedMatchTime) * 10 + stars * 500);

    storage.recordSectorResult(this.sector.id, stars, score, this.player.kills, true);

    this.hud.showVictoryModal(this.sector, stars, this.player.kills, score, bonusCredits);

    // Request midgame ad cleanly on victory screen
    crazyGames.requestMidgameAd();
  }

  triggerMatchDefeat() {
    if (this.isRoundOver) return;
    this.isRoundOver = true;
    crazyGames.gameplayStop();

    storage.recordSectorResult(this.sector.id, 0, this.player.kills * 100, this.player.kills, false);

    this.hud.showDefeatModal(this.player.kills, this.elapsedMatchTime);

    // Request midgame ad cleanly on defeat screen
    crazyGames.requestMidgameAd();
  }

  revivePlayer() {
    if (!this.player || this.hasRevivedThisMatch) return;
    this.hasRevivedThisMatch = true;
    this.isRoundOver = false;
    this.player.isAlive = true;
    this.player.hp = Math.round(this.player.maxHp * 0.6);
    this.player.shield = this.player.maxShield;
    this.player.invulnerableTimer = 3.0; // 3 seconds invulnerability
    sound.playShieldRecharge();
    particles.spawnShockwave(this.player.x, this.player.y, 90, '#00f5ff', 0.4);
    this.hud.modalCtrl.closeAll();
    crazyGames.gameplayStart();
  }

  loop(timestamp) {
    const dt = Math.min(0.1, (timestamp - this.lastFrameTime) / 1000);
    this.lastFrameTime = timestamp;

    if (!this.isPaused && !this.isAdPaused && !hitStop.isHitStopped) {
      this.accumulator += dt;
      while (this.accumulator >= FIXED_DT) {
        this.fixedUpdate(FIXED_DT);
        this.accumulator -= FIXED_DT;
      }
    }

    this.render();
    this.animId = requestAnimationFrame((ts) => this.loop(ts));
  }

  fixedUpdate(dt) {
    if (this.isRoundOver) return;

    this.elapsedMatchTime += dt;
    shaker.update(dt);
    particles.update(dt);
    floaters.update(dt);
    this.storm.update(dt);

    // 1. Update Player Movement & Inputs
    let moveX = 0;
    let moveY = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveY -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveY += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

    if (this.hud.touchJoyActive) {
      moveX = this.hud.touchJoyDir.x;
      moveY = this.hud.touchJoyDir.y;
    }

    const moveLen = Math.sqrt(moveX * moveX + moveY * moveY);
    if (moveLen > 0.001) {
      this.player.vx = (moveX / moveLen) * this.player.speed;
      this.player.vy = (moveY / moveLen) * this.player.speed;
    } else {
      this.player.vx = 0;
      this.player.vy = 0;
    }

    // Aim towards world mouse
    this.mouse.worldX = this.mouse.x + (this.camera.x - this.viewW * 0.5);
    cyberRenderer.update(dt);
    const arenaW = this.currentMap ? this.currentMap.arenaWidth : this.sector.arenaWidth;
    const arenaH = this.currentMap ? this.currentMap.arenaHeight : this.sector.arenaHeight;

    this.player.angle = angleBetween(this.player.x, this.player.y, this.mouse.worldX, this.mouse.worldY);

    // Player Shooting
    if (this.mouse.isDown || this.touchFiring) {
      const shot = this.player.tryFire(this.player.angle, this.bullets, this.player.getDamageMultiplier());
      if (shot && shot.type === 'melee') {
        this.resolveMeleeAttack(this.player, shot);
      }
    }

    // Update Player & Bots Position
    if (this.player.isAlive) {
      this.player.updateBaseTimers(dt);
      if (!this.player.isDashing) {
        this.player.x += this.player.vx * dt;
        this.player.y += this.player.vy * dt;
      }
      clampToArena(this.player, arenaW, arenaH);
    }

    // 2. Update Bots AI
    for (let i = 0; i < this.bots.length; i++) {
      const bot = this.bots[i];
      if (bot.isAlive) {
        bot.updateAI(dt, this.player, this.bots, this.crates, this.storm, this.obstacles, this.bullets, this.pickups);
        bot.x += bot.vx * dt;
        bot.y += bot.vy * dt;
        clampToArena(bot, arenaW, arenaH);
      }
    }

    // 3. Resolve Obstacle & Destructible Collisions
    const entities = [this.player, ...this.bots];
    for (let e = 0; e < entities.length; e++) {
      const ent = entities[e];
      if (!ent.isAlive) continue;
      for (let o = 0; o < this.obstacles.length; o++) {
        resolveCircleBox(ent, this.obstacles[o]);
      }
      for (let dc = 0; dc < this.destructibleCovers.length; dc++) {
        const cov = this.destructibleCovers[dc];
        if (!cov.isDestroyed) {
          resolveCircleBox(ent, cov);
        }
      }
    }

    // 4. Resolve Character Collisions
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        if (entities[i].isAlive && entities[j].isAlive) {
          resolveCircleCircle(entities[i], entities[j]);
        }
      }
    }

    // 5. Update Crates & Pickups
    for (let i = 0; i < this.crates.length; i++) {
      this.crates[i].update(dt);
    }
    for (let i = 0; i < this.pickups.length; i++) {
      this.pickups[i].update(dt);
    }

    // Auto-Loot for Player
    if (this.player.isAlive) {
      for (let i = this.pickups.length - 1; i >= 0; i--) {
        const p = this.pickups[i];
        if (dist(this.player.x, this.player.y, p.x, p.y) < this.player.radius + p.radius) {
          if (p.type === 'weapon') {
            this.player.setWeapon(p.data);
            sound.playCrateOpen();
            floaters.spawn(`+ ${p.data.name.toUpperCase()}`, this.player.x, this.player.y - 20, p.data.color, true);
          } else if (p.data.type === 'heal') {
            this.player.heal(p.data.amount);
          } else if (p.data.type === 'shield') {
            this.player.addShield(p.data.amount);
          }
          this.pickups.splice(i, 1);
        }
      }
    }

    // 6. Update Bullets & Hit Detection
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.update(dt, this.obstacles);
      if (b.isDead) {
        this.bullets.splice(i, 1);
        continue;
      }

      // Hit Destructible Covers
      for (let dc = 0; dc < this.destructibleCovers.length; dc++) {
        const cov = this.destructibleCovers[dc];
        if (!cov.isDestroyed && dist(b.x, b.y, cov.x + cov.w * 0.5, cov.y + cov.h * 0.5) < b.radius + cov.w * 0.5) {
          const destroyed = cov.takeDamage(b.damage);
          b.isDead = true;
          if (destroyed && cov.explosive) {
            this.triggerExplosion(cov.x + cov.w * 0.5, cov.y + cov.h * 0.5, 130, 70);
          }
          break;
        }
      }
      if (b.isDead) {
        this.bullets.splice(i, 1);
        continue;
      }

      // Hit Crates
      for (let c = 0; c < this.crates.length; c++) {
        const cr = this.crates[c];
        if (!cr.isOpened && dist(b.x, b.y, cr.x, cr.y) < b.radius + cr.radius) {
          const drops = cr.takeDamage(b.damage);
          if (drops.length > 0) {
            this.pickups.push(...drops);
            if (b.shooterId === 'player') {
              storage.updateQuestProgress(0, 0, 1);
            }
          }
          b.isDead = true;
          break;
        }
      }
      if (b.isDead) {
        this.bullets.splice(i, 1);
        continue;
      }

      // Hit Characters
      for (let e = 0; e < entities.length; e++) {
        const target = entities[e];
        if (!target.isAlive || target.id === b.shooterId) continue;

        if (dist(b.x, b.y, target.x, target.y) < b.radius + target.radius) {
          const attacker = entities.find((ent) => ent.id === b.shooterId) || null;
          target.takeDamage(b.damage, attacker);

          if (b.weapon.hitStopMs) hitStop.trigger(b.weapon.hitStopMs);

          if (!b.piercing) {
            b.isDead = true;
            break;
          }
        }
      }

      if (b.isDead) {
        this.bullets.splice(i, 1);
      }
    }

    // 7. Storm Zone Damage
    if (this.player.isAlive && !this.storm.isInside(this.player.x, this.player.y)) {
      this.player.takeDamage(this.storm.dps * dt);
      if (Math.random() < 0.15) {
        particles.spawnSparks(this.player.x, this.player.y, 4, '#ef4444', 120);
      }
    }

    for (let i = 0; i < this.bots.length; i++) {
      const b = this.bots[i];
      if (b.isAlive && !this.storm.isInside(b.x, b.y)) {
        b.takeDamage(this.storm.dps * dt);
      }
    }

    // 8. Check Match Outcome
    if (this.player && !this.player.isAlive) {
      this.triggerMatchDefeat();
    } else if (this.bots.every((b) => !b.isAlive)) {
      this.triggerMatchVictory(3); // Lone survivor gets 3 stars!
    }

    // 9. Update HUD status
    const livingCount = (this.player.isAlive ? 1 : 0) + this.bots.filter((b) => b.isAlive).length;
    const totalCount = 1 + this.bots.length;
    const stars = this.evaluateStars();
    const dashPct = this.player.dashCooldownTimer > 0 ? 1 - this.player.dashCooldownTimer / this.player.dashCooldown : 1;

    this.hud.updateHUD(
      this.sector,
      livingCount,
      totalCount,
      this.player.kills,
      stars,
      {
        icon: this.player.activeWeapon.icon,
        name: this.player.activeWeapon.name,
        namePt: this.player.activeWeapon.namePt,
        clipAmmo: this.player.clipAmmo,
        reserveAmmo: this.player.reserveAmmo
      },
      dashPct,
      this.currentMap
    );

    // 10. Update Camera smooth follow
    const targetCamX = this.player.x + (this.mouse.worldX - this.player.x) * 0.15;
    const targetCamY = this.player.y + (this.mouse.worldY - this.player.y) * 0.15;
    this.camera.x += (targetCamX - this.camera.x) * 0.1;
    this.camera.y += (targetCamY - this.camera.y) * 0.1;
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.viewW, this.viewH);

    ctx.save();
    // Screen shake
    shaker.apply(ctx);

    // Camera transform
    const camLeft = this.camera.x - this.viewW * 0.5;
    const camTop = this.camera.y - this.viewH * 0.5;
    ctx.translate(-camLeft, -camTop);

    // 1. Draw High-Impact Themed Floor
    cyberRenderer.drawMapFloor(ctx, this.currentMap, camLeft, camTop, camLeft + this.viewW, camTop + this.viewH);

    // 2. Draw Destructible Covers & Explosive Fuel Barrels
    for (let i = 0; i < this.destructibleCovers.length; i++) {
      this.destructibleCovers[i].draw(ctx);
    }

    // 3. Draw Themed Obstacles, Server Racks & Holographic Billboards
    for (let i = 0; i < this.obstacles.length; i++) {
      cyberRenderer.drawObstacle(ctx, this.obstacles[i], this.currentMap.theme);
    }

    // 4. Draw Tactical Drop Pods (Supply Crates) & Holographic Pickups
    for (let i = 0; i < this.crates.length; i++) {
      this.crates[i].draw(ctx);
    }
    for (let i = 0; i < this.pickups.length; i++) {
      this.pickups[i].draw(ctx);
    }

    // 5. Draw Projectiles
    for (let i = 0; i < this.bullets.length; i++) {
      this.bullets[i].draw(ctx);
    }

    // 6. Draw Particles
    particles.draw(ctx);

    // 7. Draw Bots & Player
    for (let i = 0; i < this.bots.length; i++) {
      this.bots[i].draw(ctx);
    }
    if (this.player) {
      this.player.draw(ctx);
    }

    // 8. Draw Storm Zone
    this.storm.draw(ctx, camLeft, camTop, camLeft + this.viewW, camTop + this.viewH);

    // 9. Draw Combat Floaters
    floaters.draw(ctx);

    ctx.restore();

    // 10. Draw Minimap Radar in top right
    this.drawMinimap(ctx);
  }

  drawMinimap(ctx) {
    const size = 110;
    const margin = 14;
    const mapX = this.viewW - size - margin;
    const mapY = margin + 50; // Below top bar

    ctx.save();
    ctx.fillStyle = 'rgba(7, 13, 28, 0.85)';
    ctx.strokeStyle = this.currentMap ? this.currentMap.accentColor : '#00f5ff';
    ctx.lineWidth = 2;
    ctx.shadowColor = this.currentMap ? this.currentMap.accentColor : '#00f5ff';
    ctx.shadowBlur = 10;
    ctx.fillRect(mapX, mapY, size, size);
    ctx.strokeRect(mapX, mapY, size, size);

    const arenaW = this.currentMap ? this.currentMap.arenaWidth : this.sector.arenaWidth;
    const arenaH = this.currentMap ? this.currentMap.arenaHeight : this.sector.arenaHeight;
    const scaleX = size / arenaW;
    const scaleY = size / arenaH;

    // Storm on minimap
    const stormMx = mapX + this.storm.centerX * scaleX;
    const stormMy = mapY + this.storm.centerY * scaleY;
    const stormMr = this.storm.currentRadius * scaleX;
    ctx.strokeStyle = this.currentMap ? this.currentMap.stormBorderColor : '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(stormMx, stormMy, stormMr, 0, Math.PI * 2);
    ctx.stroke();

    // Bots on minimap (red dots)
    ctx.fillStyle = '#f43f5e';
    for (let i = 0; i < this.bots.length; i++) {
      const b = this.bots[i];
      if (b.isAlive) {
        ctx.fillRect(mapX + b.x * scaleX - 1.5, mapY + b.y * scaleY - 1.5, 3, 3);
      }
    }

    // Crates on minimap (yellow dots)
    ctx.fillStyle = '#facc15';
    for (let i = 0; i < this.crates.length; i++) {
      if (!this.crates[i].isOpened) {
        ctx.fillRect(mapX + this.crates[i].x * scaleX - 1, mapY + this.crates[i].y * scaleY - 1, 2, 2);
      }
    }

    // Player on minimap (cyan dot)
    if (this.player && this.player.isAlive) {
      ctx.fillStyle = '#00f5ff';
      ctx.shadowColor = '#00f5ff';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(mapX + this.player.x * scaleX, mapY + this.player.y * scaleY, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
