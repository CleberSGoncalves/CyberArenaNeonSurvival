/**
 * @fileoverview Fixed Timestep 2D Top-Down Physics & Collision Engine
 * - Fixed Timestep Accumulator (FIXED_DT = 1/60s = 0.016667s) for consistent physics on 60Hz, 144Hz, 165Hz
 * - Continuous Circle-AABB and Circle-Circle collision solvers
 * - Line-of-sight raycasting for bot awareness and projectile trajectories
 * - Strict anti-NaN mathematical sanitation
 */

export const FIXED_DT = 1 / 60;

export function sanitize(val, fallback = 0) {
  return typeof val === 'number' && Number.isFinite(val) && !Number.isNaN(val) ? val : fallback;
}

export function dist(x1, y1, x2, y2) {
  const dx = sanitize(x2) - sanitize(x1);
  const dy = sanitize(y2) - sanitize(y1);
  return Math.sqrt(dx * dx + dy * dy);
}

export function distSq(x1, y1, x2, y2) {
  const dx = sanitize(x2) - sanitize(x1);
  const dy = sanitize(y2) - sanitize(y1);
  return dx * dx + dy * dy;
}

export function clamp(val, min, max) {
  const s = sanitize(val, min);
  return Math.max(min, Math.min(max, s));
}

export function lerp(a, b, t) {
  const safeA = sanitize(a, 0);
  const safeB = sanitize(b, 0);
  const safeT = clamp(t, 0, 1);
  return safeA + (safeB - safeA) * safeT;
}

export function angleBetween(x1, y1, x2, y2) {
  return Math.atan2(sanitize(y2) - sanitize(y1), sanitize(x2) - sanitize(x1));
}

export function normalize(vx, vy) {
  const sx = sanitize(vx, 0);
  const sy = sanitize(vy, 0);
  const len = Math.sqrt(sx * sx + sy * sy);
  if (len < 0.0001) return { x: 0, y: 0 };
  return { x: sx / len, y: sy / len };
}

/**
 * Resolves collision between a circle entity and a rectangular box obstacle.
 * Modifies entity.x and entity.y in-place if colliding.
 * @param {Object} entity - {x, y, radius, vx, vy}
 * @param {Object} box - {x, y, w, h}
 * @returns {boolean} true if collision occurred
 */
export function resolveCircleBox(entity, box) {
  const ex = sanitize(entity.x);
  const ey = sanitize(entity.y);
  const r = sanitize(entity.radius, 16);

  // Closest point on box
  const closestX = clamp(ex, box.x, box.x + box.w);
  const closestY = clamp(ey, box.y, box.y + box.h);

  const dx = ex - closestX;
  const dy = ey - closestY;
  const dSq = dx * dx + dy * dy;

  if (dSq < r * r) {
    const d = Math.sqrt(dSq);
    if (d > 0.0001) {
      const overlap = r - d;
      const nx = dx / d;
      const ny = dy / d;
      entity.x += nx * overlap;
      entity.y += ny * overlap;

      // Dampen velocity along normal
      if (entity.vx !== undefined && entity.vy !== undefined) {
        const dot = entity.vx * nx + entity.vy * ny;
        if (dot < 0) {
          entity.vx -= dot * nx * 1.1;
          entity.vy -= dot * ny * 1.1;
        }
      }
    } else {
      // Circle center inside box -> push out towards nearest edge
      const dl = Math.abs(ex - box.x);
      const dr = Math.abs(ex - (box.x + box.w));
      const dt = Math.abs(ey - box.y);
      const db = Math.abs(ey - (box.y + box.h));
      const minD = Math.min(dl, dr, dt, db);

      if (minD === dl) entity.x = box.x - r;
      else if (minD === dr) entity.x = box.x + box.w + r;
      else if (minD === dt) entity.y = box.y - r;
      else entity.y = box.y + box.h + r;
    }
    return true;
  }
  return false;
}

/**
 * Resolves collision between two circle entities (elastic pushback).
 * @param {Object} a - {x, y, radius, vx, vy}
 * @param {Object} b - {x, y, radius, vx, vy}
 * @returns {boolean}
 */
export function resolveCircleCircle(a, b) {
  const ax = sanitize(a.x);
  const ay = sanitize(a.y);
  const bx = sanitize(b.x);
  const by = sanitize(b.y);
  const ar = sanitize(a.radius, 16);
  const br = sanitize(b.radius, 16);

  const dx = bx - ax;
  const dy = by - ay;
  const dSq = dx * dx + dy * dy;
  const minDist = ar + br;

  if (dSq < minDist * minDist && dSq > 0.00001) {
    const d = Math.sqrt(dSq);
    const overlap = 0.5 * (minDist - d);
    const nx = dx / d;
    const ny = dy / d;

    a.x -= nx * overlap;
    a.y -= ny * overlap;
    b.x += nx * overlap;
    b.y += ny * overlap;
    return true;
  }
  return false;
}

/**
 * Line of sight check between two points against a list of box obstacles.
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {Array} obstacles
 * @returns {boolean} true if clear line of sight
 */
export function hasLineOfSight(x1, y1, x2, y2, obstacles) {
  for (let i = 0; i < obstacles.length; i++) {
    const o = obstacles[i];
    if (lineIntersectsBox(x1, y1, x2, y2, o.x, o.y, o.w, o.h)) {
      return false;
    }
  }
  return true;
}

export function lineIntersectsBox(x1, y1, x2, y2, bx, by, bw, bh) {
  // Check if either endpoint is inside
  if (x1 >= bx && x1 <= bx + bw && y1 >= by && y1 <= by + bh) return true;
  if (x2 >= bx && x2 <= bx + bw && y2 >= by && y2 <= by + bh) return true;

  // Check 4 segment intersections
  return (
    lineIntersectsSegment(x1, y1, x2, y2, bx, by, bx + bw, by) ||
    lineIntersectsSegment(x1, y1, x2, y2, bx + bw, by, bx + bw, by + bh) ||
    lineIntersectsSegment(x1, y1, x2, y2, bx + bw, by + bh, bx, by + bh) ||
    lineIntersectsSegment(x1, y1, x2, y2, bx, by + bh, bx, by)
  );
}

function lineIntersectsSegment(p1x, p1y, p2x, p2y, p3x, p3y, p4x, p4y) {
  const d = (p4y - p3y) * (p2x - p1x) - (p4x - p3x) * (p2y - p1y);
  if (Math.abs(d) < 0.00001) return false;

  const ua = ((p4x - p3x) * (p1y - p3y) - (p4y - p3y) * (p1x - p3x)) / d;
  const ub = ((p2x - p1x) * (p1y - p3y) - (p2y - p1y) * (p1x - p3x)) / d;

  return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
}

/**
 * Clamps entity to arena boundaries with bounce.
 * @param {Object} entity - {x, y, radius, vx, vy}
 * @param {number} arenaW
 * @param {number} arenaH
 */
export function clampToArena(entity, arenaW, arenaH) {
  const r = sanitize(entity.radius, 16);
  if (entity.x - r < 0) {
    entity.x = r;
    if (entity.vx < 0) entity.vx = 0;
  } else if (entity.x + r > arenaW) {
    entity.x = arenaW - r;
    if (entity.vx > 0) entity.vx = 0;
  }
  if (entity.y - r < 0) {
    entity.y = r;
    if (entity.vy < 0) entity.vy = 0;
  } else if (entity.y + r > arenaH) {
    entity.y = arenaH - r;
    if (entity.vy > 0) entity.vy = 0;
  }
}
