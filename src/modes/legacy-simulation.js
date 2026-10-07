import { segmentIntersectsCircle } from '../act/simulation.js';

export function stepFormation(formation, dt, minX, maxX, dropDistance = 0.42) {
  let x = formation.x;
  let z = formation.z;
  let direction = formation.direction || 1;
  let remaining = Math.max(0, dt);
  const speed = Math.max(0, formation.speed);

  if (speed === 0 || remaining === 0) return { ...formation };

  while (remaining > 0) {
    const edge = direction > 0 ? maxX : minX;
    const distance = Math.abs(edge - x);
    const timeToEdge = distance / speed;
    if (remaining < timeToEdge) {
      x += direction * speed * remaining;
      remaining = 0;
    } else {
      x = edge;
      z += dropDistance;
      direction *= -1;
      remaining = Math.max(0, remaining - timeToEdge);
    }
  }

  return { ...formation, x, z, direction };
}

export function formationSpeed(baseSpeed, initialCount, remainingCount, wave = 1, maxSpeed = 25.5) {
  const defeated = Math.max(0, initialCount - remainingCount);
  const additiveWaveHaste = Math.max(0, wave - 1) * 0.4;
  return Math.min(baseSpeed + defeated * 0.28 + additiveWaveHaste, maxSpeed);
}

export function makeEnemyGrid(rows, columns, modelRefs, offset = 0) {
  if (!modelRefs.length) throw new Error('Enemy grid needs at least one model reference');
  return Array.from({ length: rows * columns }, (_, index) => ({
    row: Math.floor(index / columns),
    column: index % columns,
    model: modelRefs[(index + offset) % modelRefs.length],
  }));
}

export function legacyFireInterval(enemyCount = 55, hitRate = 0.6, clearSeconds = 33) {
  const expectedShots = Math.ceil(enemyCount / hitRate);
  return clearSeconds / Math.max(1, expectedShots - 1);
}

export function invaderTouchesBarrier(invader, barrier) {
  return Math.hypot(invader.x - barrier.x, invader.z - barrier.z) <= invader.radius + barrier.radius;
}

export function formationInvaded(invaders, playerZ, margin = 0.75) {
  return invaders.some((invader) => invader.z >= playerZ - margin);
}

export function scoreForInvaderRow(row, rowCount) {
  const upperBandRows = Math.floor((rowCount - 1) / 2);
  const lowerBandRows = Math.ceil((rowCount - 1) / 2);
  if (row < upperBandRows) return 30;
  if (row >= rowCount - lowerBandRows) return 10;
  return 20;
}

export function damageShieldTile(tile) {
  const hp = Math.max(0, tile.hp - 1);
  return { ...tile, hp, destroyed: hp === 0 };
}

export function damageShieldAtSegment(start, end, tiles, shotRadius) {
  const index = tiles.findIndex((tile) => segmentIntersectsCircle(start, end, tile, shotRadius + tile.radius));
  if (index < 0) return { hit: false, index: -1, tile: null };
  return { hit: true, index, tile: damageShieldTile(tiles[index]) };
}
