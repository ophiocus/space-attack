import { segmentIntersectsCircle } from '../act/simulation.js';
import { THREE } from '../act/engine.js';
import {
  damageShieldAtSegment,
  formationInvaded,
  formationSpeed,
  makeEnemyGrid,
  invaderTouchesBarrier,
  legacyFireInterval,
  scoreForInvaderRow,
  stepFormation,
} from './legacy-simulation.js';

const PLAYER_SPEED = 8.5;
const PLAYER_Z_OFFSET = 1.8;
const SHOT_SPEED = 15;
const ENEMY_SHOT_SPEED = 3.1;
const PLAYER_TARGET_ACCURACY = 0.4;
const PLAYER_FIRE_RATE_MULTIPLIER = 1.56;
const PLAYER_BASELINE_INTERVAL = legacyFireInterval(55, 0.6, 33);
const PLAYER_EXPECTED_SHOTS = Math.ceil(55 / PLAYER_TARGET_ACCURACY);
// Preserve the requested 30% rate increase over the previous 1.2× setting.
const PLAYER_CLEAR_TARGET_SECONDS = (PLAYER_EXPECTED_SHOTS - 1)
  * PLAYER_BASELINE_INTERVAL / PLAYER_FIRE_RATE_MULTIPLIER;
const PLAYER_FIRE_INTERVAL = legacyFireInterval(55, PLAYER_TARGET_ACCURACY, PLAYER_CLEAR_TARGET_SECONDS);

export function createLegacyMode({ engine, keys, ui, getBounds, showScreen, showNotice, sound }) {
  const scene = engine.scene;
  const state = {
    actors: [], invaders: [], playerShots: [], enemyShots: [], shields: [], crumblingBarriers: [],
    score: 0, best: Number(localStorage.getItem('spaceAttackLegacyBest') || 0),
    wave: 1, lives: 3, health: 100, invulnerable: 0,
    fireClock: 0, enemyFireClock: 2.8, shooterCursor: 0, waveClock: 0,
    formation: { x: 0, z: 0, direction: 1, speed: 0.75, halfSpan: 0 },
    player: null, running: false, disposed: false,
  };

  function removeVisual(entity, disposeGeometry = true) {
    if (!entity?.mesh) return;
    scene.remove(entity.mesh);
    entity.mesh.traverse((child) => {
      if (disposeGeometry) child.geometry?.dispose();
      if (Array.isArray(child.material)) child.material.forEach((material) => material.dispose());
      else child.material?.dispose();
    });
  }

  function clearActors() {
    for (const entity of state.actors) removeVisual(entity, false);
    for (const shot of [...state.playerShots, ...state.enemyShots]) removeVisual(shot);
    for (const tile of [...state.shields, ...state.crumblingBarriers]) removeVisual(tile);
    state.actors.length = 0;
    state.invaders.length = 0;
    state.playerShots.length = 0;
    state.enemyShots.length = 0;
    state.shields.length = 0;
    state.crumblingBarriers.length = 0;
    state.player = null;
  }

  function setHud() {
    ui.score.textContent = state.score.toLocaleString();
    ui.best.textContent = `BEST ${state.best.toLocaleString()}`;
    ui.wave.textContent = String(state.wave).padStart(2, '0');
    ui.waveDetail.textContent = `${state.invaders.length} INVADERS LEFT`;
    ui.health.textContent = `${Math.max(0, state.health)} / 100`;
    ui.healthFill.style.width = `${Math.max(0, state.health)}%`;
    ui.lives.innerHTML = `CANNONS&nbsp; ${Array.from({ length: 3 }, (_, index) => `<span class="${index >= state.lives ? 'lost' : ''}">●</span>`).join(' ')}`;
    if (ui.weaponTitle) ui.weaponTitle.textContent = 'Laser Cannon';
    if (ui.weaponSub) ui.weaponSub.textContent = 'UPWARD · CONSTANT RATE';
    ui.weaponState.textContent = keys.has('Space') ? 'FIRING' : 'READY';
  }

  function addActor(mesh, x, y, z) {
    mesh.position.set(x, y, z);
    scene.add(mesh);
    const actor = { mesh, x, y, z };
    state.actors.push(actor);
    return actor;
  }

  function spawnInvaders() {
    state.invaders.length = 0;
    const { halfWidth, halfHeight } = getBounds();
    const columns = Math.max(7, Math.min(11, Math.floor((halfWidth * 1.5) / 1.35)));
    const rows = 5;
    const spacingX = 1.35;
    const spacingZ = 0.95;
    const halfSpan = ((columns - 1) * spacingX) / 2 + 0.65;
    state.formation = {
      x: 0,
      z: -halfHeight + 1.8 + Math.min(state.wave - 1, 5) * 0.48,
      direction: state.wave % 2 === 0 ? -1 : 1,
      speed: 0.72,
      halfSpan,
    };
    const modelRefs = ['enemy', 'invaderA', 'invaderB'];
    const gridOffset = Math.floor(Math.random() * modelRefs.length);
    for (const cell of makeEnemyGrid(rows, columns, modelRefs, gridOffset)) {
      const mesh = engine.makeModel(cell.model, 0.96);
      const localX = (cell.column - (columns - 1) / 2) * spacingX;
      const z = state.formation.z + cell.row * spacingZ;
      const enemy = addActor(mesh, localX, 0.35, z);
      enemy.localX = localX;
      enemy.row = cell.row;
      enemy.rowCount = rows;
      enemy.speed = 0.72;
      enemy.ai = 'formation';
      enemy.radius = Math.max(0.36, mesh.userData.footprintRadius * 0.7);
      state.invaders.push(enemy);
    }
    state.shooterCursor = 0;
    state.enemyFireClock = Math.max(1.4, 3.2 - (state.wave - 1) * 0.16);
    state.initialCount = state.invaders.length;
    state.waveClock = 0;
    showNotice(`LEGACY WAVE ${String(state.wave).padStart(2, '0')} · FORMATION INCOMING`, 'wave', 1.6);
    setHud();
  }

  function addShields() {
    const { halfWidth } = getBounds();
    const centers = [-halfWidth * 0.57, -halfWidth * 0.19, halfWidth * 0.19, halfWidth * 0.57];
    for (const centerX of centers) {
      for (let row = 0; row < 2; row += 1) {
        for (let column = 0; column < 5; column += 1) {
          if ((row === 1 && (column === 0 || column === 4)) || (row === 0 && column === 2)) continue;
          const x = centerX + (column - 2) * 0.43;
          const z = PLAYER_Z_OFFSET - 1.25 + row * 0.34;
          const mesh = engine.makeModel('platform', 0.48);
          mesh.position.set(x, 0.62, z);
          scene.add(mesh);
          state.shields.push({ mesh, x, y: 0.62, z, radius: Math.max(0.23, mesh.userData.footprintRadius * 0.75), hp: 3 });
        }
      }
    }
  }

  function spawnShot(list, x, z, direction, speed, color) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 6),
      new THREE.MeshBasicMaterial({ color }),
    );
    mesh.position.set(x, 0.56, z);
    scene.add(mesh);
    list.push({ mesh, x, z, vx: 0, vz: direction * speed, radius: 0.15 });
  }

  function firePlayerShot() {
    const muzzleZ = state.player.z - 0.7;
    spawnShot(state.playerShots, state.player.x, muzzleZ, -1, SHOT_SPEED, '#e7edb1');
    state.fireClock = PLAYER_FIRE_INTERVAL;
    sound.fire();
  }

  function crumbleBarriersTouchedByInvaders() {
    const touched = new Set();
    for (const invader of state.invaders) {
      for (const barrier of state.shields) {
        if (invaderTouchesBarrier(invader, barrier)) touched.add(barrier);
      }
    }
    for (const barrier of touched) {
      state.shields.splice(state.shields.indexOf(barrier), 1);
      barrier.crumbleTime = 0;
      barrier.crumbleStartY = barrier.y;
      state.crumblingBarriers.push(barrier);
    }
    return touched.size;
  }

  function updateCrumbling(dt) {
    for (let index = state.crumblingBarriers.length - 1; index >= 0; index -= 1) {
      const barrier = state.crumblingBarriers[index];
      barrier.crumbleTime += dt;
      const progress = Math.min(1, barrier.crumbleTime / 0.42);
      barrier.mesh.position.y = barrier.crumbleStartY - progress * 0.72;
      barrier.mesh.rotation.x += dt * 7;
      barrier.mesh.rotation.z += dt * 5;
      barrier.mesh.scale.setScalar(1 - progress * 0.78);
      if (progress < 1) continue;
      removeVisual(barrier, false);
      state.crumblingBarriers.splice(index, 1);
    }
  }

  function fireInvaderShot() {
    if (state.invaders.length === 0) return;
    const shooter = state.invaders[state.shooterCursor % state.invaders.length];
    state.shooterCursor += 1;
    spawnShot(state.enemyShots, state.formation.x + shooter.localX, shooter.z + 0.52, 1, ENEMY_SHOT_SPEED, '#ed9585');
    state.enemyFireClock = Math.max(1.4, 3.2 - (state.wave - 1) * 0.16);
  }

  function hitShield(shot) {
    const impact = damageShieldAtSegment(
      { x: shot.prevX, z: shot.prevZ }, { x: shot.x, z: shot.z }, state.shields, shot.radius,
    );
    if (!impact.hit) return false;
    const tile = state.shields[impact.index];
    tile.hp = impact.tile.hp;
    if (impact.tile.destroyed) {
      removeVisual(tile);
      state.shields.splice(impact.index, 1);
    } else {
      const damageTint = tile.hp === 2 ? '#c4ae73' : '#a56f68';
      tile.mesh.traverse((child) => {
        if (!child.isMesh) return;
        if (Array.isArray(child.material)) child.material.forEach((material) => material.color?.set(damageTint));
        else child.material?.color?.set(damageTint);
      });
      tile.mesh.scale.setScalar(0.88 + tile.hp * 0.06);
    }
    return true;
  }

  function updateShots(list, dt, friendly) {
    for (let index = list.length - 1; index >= 0; index -= 1) {
      const shot = list[index];
      shot.prevX = shot.x;
      shot.prevZ = shot.z;
      shot.x += shot.vx * dt;
      shot.z += shot.vz * dt;
      shot.mesh.position.set(shot.x, 0.56, shot.z);
      let remove = hitShield(shot);

      if (!remove && friendly) {
        for (let targetIndex = state.invaders.length - 1; targetIndex >= 0; targetIndex -= 1) {
          const target = state.invaders[targetIndex];
          const targetX = state.formation.x + target.localX;
          if (!segmentIntersectsCircle({ x: shot.prevX, z: shot.prevZ }, { x: shot.x, z: shot.z }, { x: targetX, z: target.z }, shot.radius + target.radius)) continue;
          state.score += scoreForInvaderRow(target.row, target.rowCount);
          if (state.score > state.best) {
            state.best = state.score;
            localStorage.setItem('spaceAttackLegacyBest', String(state.best));
          }
          removeVisual(target, false);
          state.actors.splice(state.actors.indexOf(target), 1);
          state.invaders.splice(targetIndex, 1);
          sound.hit();
          showNotice(`INVADER HIT · +${scoreForInvaderRow(target.row, target.rowCount)}`, 'hit', 0.45);
          setHud();
          remove = true;
          break;
        }
      } else if (!remove && !friendly && state.invulnerable <= 0
        && segmentIntersectsCircle({ x: shot.prevX, z: shot.prevZ }, { x: shot.x, z: shot.z }, state.player, shot.radius + state.player.radius)) {
        state.health -= 34;
        state.invulnerable = 0.8;
        sound.damage();
        showNotice('CANNON HIT · -34', 'damage', 0.65);
        if (state.health <= 0) {
          state.lives -= 1;
          if (state.lives <= 0) {
            endRun();
            remove = true;
          } else state.health = 100;
        }
        setHud();
        remove = true;
      }

      const bounds = getBounds();
      if (Math.abs(shot.x) > bounds.halfWidth || Math.abs(shot.z) > bounds.halfHeight) remove = true;
      if (remove) {
        removeVisual(shot);
        list.splice(index, 1);
      }
    }
  }

  function endRun() {
    state.running = false;
    ui.final.textContent = `LEGACY SCORE ${state.score.toLocaleString()} · WAVE ${state.wave} · BEST ${state.best.toLocaleString()}`;
    showScreen('gameover');
  }

  function start() {
    clearActors();
    state.score = 0;
    state.best = Number(localStorage.getItem('spaceAttackLegacyBest') || 0);
    state.wave = 1;
    state.lives = 3;
    state.health = 100;
    state.invulnerable = 0;
    state.fireClock = 0;
    state.running = true;
    state.disposed = false;
    const { halfWidth, halfHeight } = getBounds();
    const playerSize = Math.min(1.55, (halfHeight * 2) / 15);
    const mesh = engine.makeModel('player', playerSize);
    state.player = addActor(mesh, 0, 0.36, halfHeight - PLAYER_Z_OFFSET);
    state.player.radius = Math.max(0.34, mesh.userData.footprintRadius * 0.6);
    state.player.lastShot = false;
    addShields();
    spawnInvaders();
    setHud();
  }

  function update(dt) {
    if (!state.running) return;
    const bounds = getBounds();
    const horizontal = Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft'));
    state.player.x = Math.max(-bounds.halfWidth + 0.7, Math.min(bounds.halfWidth - 0.7, state.player.x + horizontal * PLAYER_SPEED * dt));
    state.player.mesh.position.x = state.player.x;
    state.invulnerable = Math.max(0, state.invulnerable - dt);
    state.player.mesh.visible = state.invulnerable <= 0 || Math.floor(state.invulnerable * 16) % 2 === 0;
    state.fireClock = Math.max(0, state.fireClock - dt);
    if (keys.has('Space') && state.fireClock <= 0) firePlayerShot();

    if (state.invaders.length > 0) {
      const speed = formationSpeed(0.72, state.initialCount, state.invaders.length, state.wave, PLAYER_SPEED * 2);
      state.formation = stepFormation(
        { ...state.formation, speed }, dt,
        -bounds.halfWidth + state.formation.halfSpan + 0.35,
        bounds.halfWidth - state.formation.halfSpan - 0.35,
      );
      for (const invader of state.invaders) {
        invader.x = state.formation.x + invader.localX;
        invader.z = state.formation.z + invader.row * 0.95;
        invader.mesh.position.set(invader.x, invader.y, invader.z);
      }
      if (crumbleBarriersTouchedByInvaders() > 0) {
        sound.hit();
        showNotice('BARRIER CRUMBLED · INVADERS ADVANCING', 'damage', 0.65);
        setHud();
      }
      state.enemyFireClock -= dt;
      if (state.enemyFireClock <= 0) fireInvaderShot();
      if (formationInvaded(state.invaders, state.player.z, 0.55)) {
        endRun();
        return;
      }
    } else {
      state.waveClock += dt;
      if (state.waveClock >= 1.25) {
        state.wave += 1;
        spawnInvaders();
      }
    }

    updateShots(state.playerShots, dt, true);
    updateShots(state.enemyShots, dt, false);
    updateCrumbling(dt);
    if (state.running) setHud();
  }

  function dispose() {
    clearActors();
    state.running = false;
    state.disposed = true;
  }

  return { start, update, dispose, get state() { return state; } };
}
