export const SHIP_SCREEN_DIVISOR = 21;

export function modelSizeForView(halfViewHeight, screenDivisor = SHIP_SCREEN_DIVISOR) {
  return (halfViewHeight * 2) / screenDivisor;
}

// The bundled player craft's nose faces local -Z, while enemies face +Z.
export function shipYawForAim(aim) {
  return Math.atan2(aim.x, aim.z) + Math.PI;
}

export function stepChaser(actor, target, speed, turnRate, dt) {
  const desiredX = target.x - actor.x;
  const desiredZ = target.z - actor.z;
  const desiredHeading = Math.atan2(desiredX, desiredZ);
  const currentHeading = Math.atan2(actor.vx, actor.vz);
  let deltaHeading = desiredHeading - currentHeading;
  deltaHeading = Math.atan2(Math.sin(deltaHeading), Math.cos(deltaHeading));
  const turn = Math.max(-turnRate * dt, Math.min(turnRate * dt, deltaHeading));
  const heading = currentHeading + turn;
  const vx = Math.sin(heading);
  const vz = Math.cos(heading);
  return {
    x: actor.x + vx * speed * dt,
    z: actor.z + vz * speed * dt,
    vx,
    vz,
  };
}

export function circleIntersects(a, b, radius) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return dx * dx + dz * dz <= radius * radius;
}

export function segmentIntersectsCircle(start, end, center, radius) {
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const lengthSquared = dx * dx + dz * dz;
  const t = lengthSquared === 0
    ? 0
    : Math.max(0, Math.min(1, ((center.x - start.x) * dx + (center.z - start.z) * dz) / lengthSquared));
  const closest = { x: start.x + dx * t, z: start.z + dz * t };
  return circleIntersects(closest, center, radius);
}

export function muzzlePosition(position, aim, forwardExtent, padding = 0.08) {
  const length = forwardExtent + padding;
  return { x: position.x + aim.x * length, z: position.z + aim.z * length };
}
