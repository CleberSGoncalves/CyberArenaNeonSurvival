/**
 * @fileoverview High-Impact Cyberpunk Procedural Graphic Renderer
 * Replaces generic primitive shapes with detailed 2D cybernetic operatives,
 * tactical exo-armor, animated weapons with recoil, military supply pods,
 * and immersive environment materials.
 */

import { clamp } from './physics.js';

export class CyberRenderer {
  constructor() {
    this.tick = 0;
  }

  update(dt) {
    this.tick += dt;
  }

  /**
   * Renders a fully articulated Cybernetic Operative (Player or Bot)
   */
  drawOperative(ctx, char, isPlayer = false, aimLaser = true) {
    if (!char.isAlive) return;

    ctx.save();
    ctx.translate(char.x, char.y);

    // 1. Soft Grounded Drop Shadow
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 6, char.radius * 1.25, char.radius * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Aim Direction Rotation for Character Body & Hands
    ctx.rotate(char.angle);

    // Dynamic movement & walk animation
    const speed = Math.sqrt(char.vx * char.vx + char.vy * char.vy);
    const isMoving = speed > 10;
    const walkPhase = isMoving ? Math.sin(this.tick * 14) : 0;
    const recoilOffset = char.recoilOffset || 0;

    // 3. Cyber Boots / Legs (Top-Down Silhouette)
    const bootColor = '#0f172a';
    const bootTrim = isPlayer ? '#00f5ff' : '#64748b';
    ctx.save();
    // Left Boot
    ctx.fillStyle = bootColor;
    ctx.strokeStyle = bootTrim;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-char.radius * 0.7 + walkPhase * 4, -char.radius * 0.8, 12, 7, 2);
    ctx.fill();
    ctx.stroke();

    // Right Boot
    ctx.beginPath();
    ctx.roundRect(-char.radius * 0.7 - walkPhase * 4, char.radius * 0.4, 12, 7, 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 4. Exosuit Torso & Armor Chassis
    const armorMain = isPlayer ? '#091528' : char.difficulty === 'hard' ? '#200810' : '#111827';
    const armorAccent = char.color || (isPlayer ? '#00f5ff' : '#f43f5e');
    const glowColor = isPlayer ? 'rgba(0, 245, 255, 0.6)' : 'rgba(244, 63, 94, 0.6)';

    // Backpack Power Cell / Reactor Core (Pulsing)
    ctx.save();
    const corePulse = 0.8 + 0.2 * Math.sin(this.tick * 6);
    ctx.fillStyle = '#020617';
    ctx.strokeStyle = armorAccent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-char.radius * 0.9, -char.radius * 0.45, char.radius * 0.5, char.radius * 0.9, 3);
    ctx.fill();
    ctx.stroke();

    // Reactor Glow Node
    ctx.fillStyle = armorAccent;
    ctx.shadowColor = armorAccent;
    ctx.shadowBlur = 10 * corePulse;
    ctx.beginPath();
    ctx.arc(-char.radius * 0.65, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Main Chest Plate
    ctx.save();
    ctx.fillStyle = armorMain;
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, char.radius * 0.85, char.radius * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Tactical Shoulder Pauldrons (Left & Right)
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = armorAccent;
    ctx.lineWidth = 2;
    // Left Shoulder
    ctx.beginPath();
    ctx.arc(-2, -char.radius * 0.85, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Right Shoulder
    ctx.beginPath();
    ctx.arc(-2, char.radius * 0.85, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Faction Stripes on Chest
    ctx.strokeStyle = armorAccent;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-char.radius * 0.3, -char.radius * 0.4);
    ctx.lineTo(char.radius * 0.2, 0);
    ctx.lineTo(-char.radius * 0.3, char.radius * 0.4);
    ctx.stroke();
    ctx.restore();

    // 5. Combat Helmet & Tactical Visor
    ctx.save();
    // Helmet Base
    ctx.fillStyle = '#0a0f1d';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(char.radius * 0.15, 0, char.radius * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Glowing Neon Visor Slit
    const visorColor = isPlayer ? '#00f5ff' : char.difficulty === 'hard' ? '#fbbf24' : '#f43f5e';
    ctx.fillStyle = visorColor;
    ctx.shadowColor = visorColor;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    // Swept-forward cyber visor
    ctx.moveTo(char.radius * 0.35, -char.radius * 0.35);
    ctx.lineTo(char.radius * 0.65, -char.radius * 0.18);
    ctx.lineTo(char.radius * 0.65, char.radius * 0.18);
    ctx.lineTo(char.radius * 0.35, char.radius * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 6. Articulated Robotic Hands & Detailed Weapon Model
    this.drawEquippedWeapon(ctx, char, recoilOffset, isPlayer);

    // 7. Shield Energy Bubble (If active)
    if (char.shield > 0) {
      ctx.save();
      const shieldRatio = char.shield / char.maxShield;
      const shieldGlow = 0.25 + 0.25 * shieldRatio + 0.1 * Math.sin(this.tick * 8);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00f5ff';
      ctx.shadowBlur = 14;
      ctx.fillStyle = `rgba(56, 189, 248, ${shieldGlow * 0.4})`;
      ctx.beginPath();
      ctx.arc(0, 0, char.radius + 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Hexagonal Shield Pattern Overlay
      ctx.strokeStyle = 'rgba(0, 245, 255, 0.25)';
      ctx.lineWidth = 1;
      for (let h = 0; h < 6; h++) {
        const ang = (h * Math.PI) / 3 + this.tick * 0.5;
        ctx.beginPath();
        ctx.arc(Math.cos(ang) * (char.radius + 4), Math.sin(ang) * (char.radius + 4), 6, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.restore(); // Restore world transform

    // 8. Player Aiming Tactical Laser & Reticle
    if (isPlayer && aimLaser && char.isAlive) {
      this.drawAimLaser(ctx, char);
    }

    // 9. Floating Overhead Cyber HUD (Name, Health, Shield)
    this.drawOverheadHUD(ctx, char, isPlayer);
  }

  /**
   * Draws realistic 2D weapons with hands, barrels, and recoil
   */
  drawEquippedWeapon(ctx, char, recoil, isPlayer) {
    const w = char.activeWeapon || { id: 'neon_blaster', color: '#00f5ff' };
    const wepX = char.radius * 0.5 - recoil;
    const wepColor = w.color || '#00f5ff';

    ctx.save();
    ctx.translate(wepX, 0);

    // Robotic Gloves / Hands holding the gun
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    // Left hand
    ctx.beginPath();
    ctx.arc(4, -char.radius * 0.55, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Right hand
    ctx.beginPath();
    ctx.arc(6, char.radius * 0.55, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Weapon-specific geometry
    if (w.id === 'beam_katana') {
      // Curved glowing energy blade
      ctx.save();
      // Katana Hilt & Guard
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#64748b';
      ctx.fillRect(0, -3, 14, 6);
      ctx.fillStyle = '#334155';
      ctx.fillRect(14, -8, 3, 16); // Tsuba guard

      // Glowing Plasma Blade
      ctx.shadowColor = wepColor;
      ctx.shadowBlur = 18;
      ctx.strokeStyle = wepColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(17, 0);
      ctx.quadraticCurveTo(45, -6, 68, -2); // Curved blade tip
      ctx.stroke();

      // Blade White Core
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.quadraticCurveTo(44, -5, 66, -2);
      ctx.stroke();
      ctx.restore();

    } else if (w.id === 'pulse_shotgun') {
      // Heavy double barrel combat shotgun
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.fillRect(0, -6, 26, 12); // Receiver
      // Dual Barrels
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(26, -5, 14, 4);
      ctx.fillRect(26, 1, 14, 4);
      // Heat Sink Vents (Glowing)
      ctx.fillStyle = wepColor;
      ctx.shadowColor = wepColor;
      ctx.shadowBlur = 8;
      ctx.fillRect(6, -7, 12, 2);
      ctx.fillRect(6, 5, 12, 2);

    } else if (w.id === 'plasma_smg') {
      // Compact SMG with curved mag and top reflex sight
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, -5, 22, 10);
      // Curved Magazine
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(6, 5, 6, 10);
      // Muzzle
      ctx.fillStyle = '#334155';
      ctx.fillRect(22, -3, 8, 6);
      // Side LED battery
      ctx.fillStyle = wepColor;
      ctx.shadowColor = wepColor;
      ctx.shadowBlur = 10;
      ctx.fillRect(4, -6, 10, 2);

    } else if (w.id === 'emp_railgun') {
      // Long sniper chassis with electromagnetic coils
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, -5, 42, 10);
      // 3 Ring Capacitors
      ctx.fillStyle = wepColor;
      ctx.shadowColor = wepColor;
      ctx.shadowBlur = 12;
      ctx.fillRect(12, -7, 4, 14);
      ctx.fillRect(22, -7, 4, 14);
      ctx.fillRect(32, -7, 4, 14);
      // Scope
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(4, -9, 14, 4);

    } else {
      // Neon Blaster (Default Hand Cannon)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, -4, 18, 8);
      // Top Cooling Fins
      ctx.fillStyle = wepColor;
      ctx.shadowColor = wepColor;
      ctx.shadowBlur = 8;
      ctx.fillRect(4, -6, 8, 2);
      // Muzzle
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(18, -3, 6, 6);
    }

    ctx.restore();
  }

  /**
   * Draws precision laser sight and tactical target lead
   */
  drawAimLaser(ctx, char) {
    const laserLength = 340;
    const startX = char.x + Math.cos(char.angle) * (char.radius + 18);
    const startY = char.y + Math.sin(char.angle) * (char.radius + 18);
    const endX = startX + Math.cos(char.angle) * laserLength;
    const endY = startY + Math.sin(char.angle) * laserLength;

    ctx.save();
    // Dotted guideline
    ctx.strokeStyle = 'rgba(0, 245, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Laser Reticle at End
    ctx.setLineDash([]);
    ctx.strokeStyle = '#00f5ff';
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(endX, endY, 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(endX, endY, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.restore();
  }

  /**
   * High-tech Floating Overhead Health & Shield Bracket
   */
  drawOverheadHUD(ctx, char, isPlayer) {
    const barW = 44;
    const barH = 5;
    const barX = char.x - barW * 0.5;
    const barY = char.y - char.radius - 20;

    ctx.save();
    // Name Tag & Rank Label
    ctx.font = 'bold 9px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = isPlayer ? '#00f5ff' : '#cbd5e1';
    ctx.shadowColor = isPlayer ? '#00f5ff' : '#f43f5e';
    ctx.shadowBlur = 6;
    const roleTag = isPlayer ? 'YOU [P1]' : char.difficulty === 'hard' ? `[BOSS] ${char.name}` : char.name;
    ctx.fillText(roleTag, char.x, barY - 4);

    // Frame Backdrop with Angled Edges
    ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
    ctx.strokeStyle = isPlayer ? 'rgba(0, 245, 255, 0.5)' : 'rgba(100, 116, 139, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX - 2, barY - 1, barW + 4, barH * 2 + 5);
    ctx.fillRect(barX - 2, barY - 1, barW + 4, barH * 2 + 5);

    // Top Row: Shield Bar (Electric Cyan)
    const shieldPct = clamp(char.shield / char.maxShield, 0, 1);
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur = 4;
    ctx.fillRect(barX, barY + 1, barW * shieldPct, barH - 1);

    // Bottom Row: HP Bar (Dynamic Gradient)
    const hpPct = clamp(char.hp / char.maxHp, 0, 1);
    ctx.fillStyle = hpPct > 0.5 ? '#22c55e' : hpPct > 0.25 ? '#f59e0b' : '#ef4444';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 6;
    ctx.fillRect(barX, barY + barH + 2, barW * hpPct, barH - 1);

    ctx.restore();
  }

  /**
   * Renders Sci-Fi Tactical Drop Pods (Replaces generic wooden boxes)
   */
  drawTacticalDropPod(ctx, crate) {
    if (crate.isOpened) return;

    ctx.save();
    ctx.translate(crate.x, crate.y);
    const pulse = 0.85 + 0.15 * Math.sin(this.tick * 4 + crate.x);
    const w = crate.w || 44;
    const h = crate.h || 44;
    const hw = w * 0.5;
    const hh = h * 0.5;

    // Ground Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(0, 4, hw * 1.2, hh * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Octagonal Armor Casing
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 12 * pulse;

    ctx.beginPath();
    const cut = 8;
    ctx.moveTo(-hw + cut, -hh);
    ctx.lineTo(hw - cut, -hh);
    ctx.lineTo(hw, -hh + cut);
    ctx.lineTo(hw, hh - cut);
    ctx.lineTo(hw - cut, hh);
    ctx.lineTo(-hw + cut, hh);
    ctx.lineTo(-hw, hh - cut);
    ctx.lineTo(-hw, -hh + cut);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // High-Contrast Hazard Chevrons (Yellow/Black Warning)
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.35)';
    ctx.lineWidth = 4;
    for (let x = -hw * 2; x < hw * 2; x += 12) {
      ctx.beginPath();
      ctx.moveTo(x, -hh);
      ctx.lineTo(x + 12, hh);
      ctx.stroke();
    }
    ctx.restore();

    // Center Hydraulic Keypad / Hologram Lock
    ctx.fillStyle = '#020617';
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚡', 0, 0);

    // HP Mini Meter on Drop Pod
    if (crate.hp < crate.maxHp) {
      const hpPct = clamp(crate.hp / crate.maxHp, 0, 1);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(-hw, -hh - 8, w, 4);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-hw, -hh - 8, w * hpPct, 4);
    }

    ctx.restore();
  }

  /**
   * Renders Themed Obstacles (Server Racks, Barricades, Data Monoliths, Containers)
   */
  drawObstacle(ctx, obs, theme = 'neon') {
    ctx.save();
    const { x, y, w, h, type, color, borderColor, name } = obs;

    // Obstacle Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(x + 6, y + 6, w, h);

    // Main Chassis
    ctx.fillStyle = color || '#0f172a';
    ctx.strokeStyle = borderColor || '#00f5ff';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = borderColor || '#00f5ff';
    ctx.shadowBlur = 10;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);

    // Sub-type Details
    if (type === 'server_block') {
      // Blinking Data Center Server LEDs
      const rows = Math.floor(h / 18);
      for (let r = 0; r < rows; r++) {
        const ledY = y + 10 + r * 18;
        ctx.fillStyle = (Math.sin(this.tick * 8 + r) > 0) ? '#22c55e' : '#38bdf8';
        ctx.fillRect(x + 8, ledY, 6, 4);
        ctx.fillStyle = '#334155';
        ctx.fillRect(x + 20, ledY, w - 28, 4);
      }
    } else if (type === 'billboard' || type === 'building') {
      // Cyber Neon Typography & Logo
      ctx.fillStyle = borderColor;
      ctx.font = 'bold 11px "Orbitron", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(name || 'MEGACORP', x + w * 0.5, y + h * 0.5);

      // Neon Border Corner Brackets
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      const bSize = 8;
      ctx.strokeRect(x, y, bSize, bSize);
      ctx.strokeRect(x + w - bSize, y, bSize, bSize);
      ctx.strokeRect(x, y + h - bSize, bSize, bSize);
      ctx.strokeRect(x + w - bSize, y + h - bSize, bSize, bSize);
    } else if (type === 'container') {
      // Industrial Cargo Container Corrugation
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
      ctx.lineWidth = 3;
      for (let lx = x + 15; lx < x + w - 10; lx += 18) {
        ctx.beginPath();
        ctx.moveTo(lx, y + 4);
        ctx.lineTo(lx, y + h - 4);
        ctx.stroke();
      }
    } else if (type === 'monolith') {
      // Quantum Data Monolith with Central Rune
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 10, y + 10, w - 20, h - 20);
      ctx.fillStyle = '#34d399';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⬢', x + w * 0.5, y + h * 0.5);
    }

    ctx.restore();
  }

  /**
   * Renders Destructible Covers & Explosive Fuel Barrels
   */
  drawDestructibleCover(ctx, cov) {
    if (cov.isDestroyed) return;
    ctx.save();
    ctx.translate(cov.x + cov.w * 0.5, cov.y + cov.h * 0.5);

    const hw = cov.w * 0.5;
    const hh = cov.h * 0.5;

    if (cov.explosive || cov.type === 'explosive_barrel') {
      // Volatile Chemical Drum (Red & Warning Hazard)
      const flash = (cov.hp < cov.maxHp) ? (Math.sin(this.tick * 16) > 0 ? '#ffffff' : '#ef4444') : '#b91c1c';
      ctx.fillStyle = flash;
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(0, 0, hw, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Biohazard / Flame Warning Symbol
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🔥', 0, 0);

    } else {
      // Armored Data Pod / Destructible Crate
      ctx.fillStyle = cov.color || '#334155';
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      ctx.fillRect(-hw, -hh, cov.w, cov.h);
      ctx.strokeRect(-hw, -hh, cov.w, cov.h);

      // Cross Rivets
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.moveTo(-hw, -hh);
      ctx.lineTo(hw, hh);
      ctx.moveTo(hw, -hh);
      ctx.lineTo(-hw, hh);
      ctx.stroke();
    }

    // Health Bar for Destructible Cover
    if (cov.hp < cov.maxHp) {
      const pct = clamp(cov.hp / cov.maxHp, 0, 1);
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(-hw, -hh - 8, cov.w, 4);
      ctx.fillStyle = cov.explosive ? '#ef4444' : '#facc15';
      ctx.fillRect(-hw, -hh - 8, cov.w * pct, 4);
    }

    ctx.restore();
  }

  /**
   * Renders Rich Procedural Floor Patterns for the 3 Maps
   */
  drawMapFloor(ctx, map, viewLeft, viewTop, viewRight, viewBottom) {
    ctx.save();
    // 1. Solid Ambient Ground
    ctx.fillStyle = map.bgColor || '#030712';
    ctx.fillRect(viewLeft - 50, viewTop - 50, (viewRight - viewLeft) + 100, (viewBottom - viewTop) + 100);

    const gridSize = 120;
    const startX = Math.floor(viewLeft / gridSize) * gridSize;
    const startY = Math.floor(viewTop / gridSize) * gridSize;

    // 2. Themed Grid & Circuit Lines
    ctx.strokeStyle = map.gridColor || 'rgba(0, 245, 255, 0.1)';
    ctx.lineWidth = 1;

    for (let x = startX; x <= viewRight + gridSize; x += gridSize) {
      if (x >= 0 && x <= map.arenaWidth) {
        ctx.beginPath();
        ctx.moveTo(x, Math.max(0, viewTop));
        ctx.lineTo(x, Math.min(map.arenaHeight, viewBottom));
        ctx.stroke();
      }
    }

    for (let y = startY; y <= viewBottom + gridSize; y += gridSize) {
      if (y >= 0 && y <= map.arenaHeight) {
        ctx.beginPath();
        ctx.moveTo(Math.max(0, viewLeft), y);
        ctx.lineTo(Math.min(map.arenaWidth, viewRight), y);
        ctx.stroke();
      }
    }

    // 3. Themed Stencil Floor Emblems & Conduits
    const accent = map.accentColor || '#00f5ff';
    if (map.theme === 'neon') {
      // Neon District: Yellow-black roadway hazard stripes near perimeter
      ctx.strokeStyle = 'rgba(0, 245, 255, 0.2)';
      ctx.lineWidth = 3;
      ctx.strokeRect(100, 100, map.arenaWidth - 200, map.arenaHeight - 200);

      // Central Stencil Logo
      ctx.fillStyle = 'rgba(0, 245, 255, 0.08)';
      ctx.font = 'bold 48px "Orbitron", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('SECTOR 07 • CYBER ARENA', map.arenaWidth * 0.5, map.arenaHeight * 0.5 - 60);

    } else if (map.theme === 'matrix') {
      // Cyber Grid: Pulsing Data Junction Nodes at grid intersections
      ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
      for (let x = startX; x <= viewRight; x += gridSize * 2) {
        for (let y = startY; y <= viewBottom; y += gridSize * 2) {
          if (x > 0 && x < map.arenaWidth && y > 0 && y < map.arenaHeight) {
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

    } else if (map.theme === 'industrial') {
      // Industrial Sector: Hazard Chevrons & Rust Patches
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.18)';
      ctx.lineWidth = 6;
      ctx.setLineDash([20, 20]);
      ctx.strokeRect(80, 80, map.arenaWidth - 160, map.arenaHeight - 160);
      ctx.setLineDash([]);
    }

    // 4. Perimeter Laser Barrier (High Bloom Arena Edge)
    ctx.strokeStyle = map.stormBorderColor || '#00f5ff';
    ctx.lineWidth = 5;
    ctx.shadowColor = map.stormBorderColor || '#00f5ff';
    ctx.shadowBlur = 20;
    ctx.strokeRect(0, 0, map.arenaWidth, map.arenaHeight);

    ctx.restore();
  }
}

export const cyberRenderer = new CyberRenderer();
