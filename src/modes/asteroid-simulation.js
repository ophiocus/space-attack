export const ASTEROID_SPLIT_LOOP = [
  { x: -1, z: 0 }, { x: -Math.SQRT1_2, z: -Math.SQRT1_2 },
  { x: 0, z: -1 }, { x: Math.SQRT1_2, z: -Math.SQRT1_2 },
  { x: 1, z: 0 }, { x: Math.SQRT1_2, z: Math.SQRT1_2 },
  { x: 0, z: 1 }, { x: -Math.SQRT1_2, z: Math.SQRT1_2 },
];

export function splitChildrenFor(type) {
  if (type === 'A') return ['B', 'B'];
  if (type === 'B') return ['C', 'C'];
  return [];
}

export function splitPairPositions(origin, distance, offset, sequence) {
  const direction = ASTEROID_SPLIT_LOOP[(offset + sequence) % ASTEROID_SPLIT_LOOP.length];
  return [-1, 1].map((sign) => ({
    x: origin.x + direction.x * distance * sign,
    z: origin.z + direction.z * distance * sign,
  }));
}

export function velocityTowardArenaCenter(position, speed) {
  const length = Math.hypot(position.x, position.z) || 1;
  return { vx: (-position.x / length) * speed, vz: (-position.z / length) * speed };
}

export function acceleratedRandomVelocity(parentVelocity, angle, acceleration = 1.5) {
  const speed = Math.hypot(parentVelocity.vx, parentVelocity.vz) * acceleration;
  return { vx: Math.cos(angle) * speed, vz: Math.sin(angle) * speed };
}

export function wrapArenaPosition(position, halfWidth, halfHeight) {
  return {
    x: position.x < -halfWidth ? halfWidth : position.x > halfWidth ? -halfWidth : position.x,
    z: position.z < -halfHeight ? halfHeight : position.z > halfHeight ? -halfHeight : position.z,
    vx: position.vx,
    vz: position.vz,
  };
}
