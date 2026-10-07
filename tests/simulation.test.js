import test from 'node:test';
import assert from 'node:assert/strict';
import { createCenteredActorRoot, createMirroredComposite, THREE } from '../src/act/engine.js';
import { createSoundFx } from '../src/act/sound.js';
import { createLegacyMode } from '../src/modes/legacy.js';
import {
  damageShieldAtSegment,
  damageShieldTile,
  formationInvaded,
  formationSpeed,
  invaderTouchesBarrier,
  legacyFireInterval,
  makeEnemyGrid,
  scoreForInvaderRow,
  stepFormation,
} from '../src/modes/legacy-simulation.js';
import { acceleratedRandomVelocity, ASTEROID_SPLIT_LOOP, splitChildrenFor, splitPairPositions, velocityTowardArenaCenter, wrapArenaPosition } from '../src/modes/asteroid-simulation.js';
import {
  circleIntersects,
  modelSizeForView,
  muzzlePosition,
  segmentIntersectsCircle,
  shipYawForAim,
  stepChaser,
} from '../src/act/simulation.js';

test('player view scale keeps the ship at one twenty-first of view height', () => {
  assert.equal(modelSizeForView(12), 24 / 21);
  assert.equal(modelSizeForView(9), 18 / 21);
});

test('composite enemy uses two copies centered together with one horizontally flipped', () => {
  const makeHalf = () => {
    const root = new THREE.Group();
    root.userData.footprintRadius = 1.1;
    root.userData.forwardExtent = 0.4;
    return root;
  };
  const composite = createMirroredComposite(makeHalf(), makeHalf());
  assert.equal(composite.children.length, 2);
  assert.equal(composite.children[0].position.x, 0);
  assert.equal(composite.children[1].position.x, 0);
  assert.equal(composite.children[0].scale.x, 1);
  assert.equal(composite.children[1].scale.x, -1);
  assert.ok(Math.abs(composite.userData.footprintRadius - 1.65) < 1e-9);
});

test('enemy motion is independent world-space motion, not inherited player translation', () => {
  const actor = { x: 0, z: 0, vx: 0, vz: 1 };
  const first = stepChaser(actor, { x: 0, z: 20 }, 2, 2, 1);
  assert.deepEqual(first, { x: 0, z: 2, vx: 0, vz: 1 });

  // The target moves ten world units; the enemy only advances by its own speed
  // and turns toward the new target position over time.
  const second = stepChaser(first, { x: 10, z: 20 }, 2, 0.2, 1);
  assert.ok(Math.hypot(second.x - first.x, second.z - first.z) <= 2 + 1e-9);
  assert.ok(second.x < 1);
});

test('zero-speed enemy stays at its recorded world position while player crosses cardinal extremes', () => {
  const enemy = { x: 4, z: -3, vx: 0, vz: 1 };
  const recorded = { x: enemy.x, z: enemy.z };
  const playerExtremes = [
    { x: 12, z: 0 },
    { x: -12, z: 0 },
    { x: 0, z: 12 },
    { x: 0, z: -12 },
  ];

  for (const player of playerExtremes) {
    const next = stepChaser(enemy, player, 0, 2.2, 1 / 60);
    assert.equal(next.x, recorded.x);
    assert.equal(next.z, recorded.z);
  }
});

test('centered visual stays inside an independent actor root at cardinal world positions', () => {
  const source = new THREE.Group();
  source.name = 'deliberately offset test model';
  source.position.set(7, 2, -5);
  const geometry = new THREE.BoxGeometry(2, 1, 3);
  geometry.translate(5, 0, -4);
  source.add(new THREE.Mesh(geometry, new THREE.MeshBasicMaterial()));

  const actor = createCenteredActorRoot(source, 2);
  const scene = new THREE.Scene();
  scene.add(actor);
  const positions = [
    { x: 12, z: 0, yaw: 0 },
    { x: -12, z: 0, yaw: Math.PI },
    { x: 0, z: 12, yaw: Math.PI / 2 },
    { x: 0, z: -12, yaw: -Math.PI / 2 },
  ];

  for (const { x, z, yaw } of positions) {
    actor.position.set(x, 0, z);
    actor.rotation.y = yaw;
    scene.updateMatrixWorld(true);
    const worldCenter = new THREE.Box3().setFromObject(actor).getCenter(new THREE.Vector3());
    assert.ok(Math.abs(worldCenter.x - x) < 1e-6, `expected x=${x}, got ${worldCenter.x}`);
    assert.ok(Math.abs(worldCenter.z - z) < 1e-6, `expected z=${z}, got ${worldCenter.z}`);
  }
});

test('circle collision includes exact contact and rejects a clear miss', () => {
  assert.equal(circleIntersects({ x: 0, z: 0 }, { x: 3, z: 4 }, 5), true);
  assert.equal(circleIntersects({ x: 0, z: 0 }, { x: 3, z: 4 }, 4.99), false);
});

test('segment collision catches a fast shot crossing a target between frames', () => {
  assert.equal(segmentIntersectsCircle({ x: -5, z: 0 }, { x: 5, z: 0 }, { x: 0, z: 0 }, 0.5), true);
  assert.equal(segmentIntersectsCircle({ x: -5, z: 2 }, { x: 5, z: 2 }, { x: 0, z: 0 }, 0.5), false);
});

test('muzzle point starts ahead of the ship along its current aim vector', () => {
  assert.deepEqual(muzzlePosition({ x: 4, z: -2 }, { x: 0, z: -1 }, 0.9), { x: 4, z: -2.98 });
});

test('player craft local -Z nose faces each selected cardinal aim direction', () => {
  for (const aim of [{ x: 0, z: -1 }, { x: 0, z: 1 }, { x: -1, z: 0 }, { x: 1, z: 0 }]) {
    const nose = new THREE.Vector3(0, 0, -1)
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), shipYawForAim(aim));
    assert.ok(Math.abs(nose.x - aim.x) < 1e-9);
    assert.ok(Math.abs(nose.z - aim.z) < 1e-9);
  }
});

test('sound cues unlock on demand and synthesize separate fire, hit and damage voices', async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'AudioContext');
  let oscillators = 0;
  let resumes = 0;
  class Param {
    setValueAtTime() {}
    linearRampToValueAtTime() {}
    exponentialRampToValueAtTime() {}
  }
  class Node {
    connect() {}
  }
  class FakeAudioContext {
    state = 'suspended';
    currentTime = 0;
    destination = new Node();
    createGain() { return Object.assign(new Node(), { gain: new Param() }); }
    createOscillator() {
      oscillators += 1;
      return Object.assign(new Node(), { frequency: new Param(), start() {}, stop() {} });
    }
    async resume() { resumes += 1; this.state = 'running'; }
  }

  Object.defineProperty(globalThis, 'AudioContext', { configurable: true, writable: true, value: FakeAudioContext });
  try {
    const sound = createSoundFx();
    await sound.unlock();
    sound.fire();
    sound.hit();
    sound.damage();
    assert.equal(resumes, 1);
    assert.equal(oscillators, 3);
  } finally {
    if (original) Object.defineProperty(globalThis, 'AudioContext', original);
    else delete globalThis.AudioContext;
  }
});

test('legacy formation reverses at screen edges and descends one step', () => {
  const next = stepFormation({ x: 0, z: -5, direction: 1, speed: 2 }, 1, -1, 1, 0.5);
  assert.deepEqual(next, { x: 0, z: -4.5, direction: -1, speed: 2 });
});

test('legacy haste is additive, based on defeats, and capped at twice ship speed', () => {
  const intactWaveOne = formationSpeed(0.72, 28, 28, 1);
  const thinWaveOne = formationSpeed(0.72, 28, 4, 1);
  const intactWaveTwo = formationSpeed(0.72, 28, 28, 2);
  assert.ok(thinWaveOne > intactWaveOne);
  assert.ok(intactWaveTwo > intactWaveOne);
  assert.equal(thinWaveOne, 0.72 + 24 * 0.28);
  assert.equal(formationSpeed(0.72, 55, 1, 99, 8.5 * 2), 17);
  assert.ok(formationSpeed(0.72, 55, 1, 99, 8.5 * 2) <= 2 * 8.5);
});

test('legacy randomized formation assigns alien model silhouettes from one closed-loop offset', () => {
  const grid = makeEnemyGrid(2, 4, ['alien', 'invaderA', 'invaderB'], 1);
  assert.deepEqual(grid.map(({ model }) => model), ['invaderA', 'invaderB', 'alien', 'invaderA', 'invaderB', 'alien', 'invaderA', 'invaderB']);
  assert.deepEqual(grid[4], { row: 1, column: 0, model: 'invaderB' });
});

test('asteroid enemies split along a randomized closed-loop order through A, B, and C', () => {
  assert.deepEqual(splitChildrenFor('A'), ['B', 'B']);
  assert.deepEqual(splitChildrenFor('B'), ['C', 'C']);
  assert.deepEqual(splitChildrenFor('C'), []);
  const pair = splitPairPositions({ x: 2, z: -3 }, 2, 0, 0);
  assert.deepEqual(pair, [{ x: 4, z: -3 }, { x: 0, z: -3 }]);
  assert.equal(ASTEROID_SPLIT_LOOP.length, 8);
  assert.deepEqual(splitPairPositions({ x: 0, z: 0 }, 1, 7, 2), [
    { x: Math.SQRT1_2, z: Math.SQRT1_2 },
    { x: -Math.SQRT1_2, z: -Math.SQRT1_2 },
  ]);
});

test('asteroid roots keep fixed inward velocity, fragments accelerate along a new vector, and edges wrap', () => {
  const root = velocityTowardArenaCenter({ x: 3, z: 4 }, 0.82);
  assert.ok(Math.abs(root.vx + 0.492) < 1e-9);
  assert.ok(Math.abs(root.vz + 0.656) < 1e-9);
  const fragment = acceleratedRandomVelocity(root, Math.PI / 2);
  assert.ok(Math.abs(Math.hypot(fragment.vx, fragment.vz) - 1.23) < 1e-9);
  assert.ok(Math.abs(fragment.vx) < 1e-9);
  assert.ok(fragment.vz > 0);
  assert.deepEqual(wrapArenaPosition({ x: 10.5, z: -6.5, vx: 1.23, vz: -0.4 }, 10, 6), {
    x: -10, z: 6, vx: 1.23, vz: -0.4,
  });
});

test('legacy fires 30 percent faster than the previous setting at 40 percent accuracy', () => {
  const expectedShots = Math.ceil(55 / 0.4);
  const baseline = legacyFireInterval(55, 0.6, 33);
  const previousInterval = baseline / 1.2;
  const interval = baseline / 1.56;
  assert.equal(expectedShots, 138);
  assert.ok(Math.abs((1 / interval) / (1 / previousInterval) - 1.3) < 1e-9);
  assert.ok(Math.abs((expectedShots - 1) * interval - (41.4 / 1.3)) < 0.01);
});

test('legacy shield contact removes an invader using combined radii', () => {
  assert.equal(invaderTouchesBarrier({ x: 0, z: 0, radius: 0.5 }, { x: 0.8, z: 0, radius: 0.3 }), true);
  assert.equal(invaderTouchesBarrier({ x: 0, z: 0, radius: 0.5 }, { x: 0.81, z: 0, radius: 0.3 }), false);
});

test('legacy invasion threshold and row scoring match the formation rules', () => {
  assert.equal(formationInvaded([{ z: 9.3 }], 10, 0.75), true);
  assert.equal(formationInvaded([{ z: 9.2 }], 10, 0.75), false);
  assert.deepEqual([0, 1, 2, 3].map((row) => scoreForInvaderRow(row, 4)), [30, 20, 10, 10]);
  assert.deepEqual([0, 1, 2, 3, 4].map((row) => scoreForInvaderRow(row, 5)), [30, 30, 20, 10, 10]);
});

test('legacy shield tiles block and take damage from both shot directions', () => {
  let tiles = [{ x: 0, z: 0, radius: 0.32, hp: 3 }];
  const upward = damageShieldAtSegment({ x: 0, z: 1 }, { x: 0, z: -1 }, tiles, 0.15);
  assert.equal(upward.hit, true);
  tiles[0] = upward.tile;
  assert.equal(tiles[0].hp, 2);
  const downward = damageShieldAtSegment({ x: 0, z: -1 }, { x: 0, z: 1 }, tiles, 0.15);
  assert.equal(downward.hit, true);
  tiles[0] = downward.tile;
  const lastHit = damageShieldTile(tiles[0]);
  assert.equal(lastHit.hp, 0);
  assert.equal(lastHit.destroyed, true);
});

test('legacy mode owns its actors, supports horizontal movement/fire, and cleans up on dispose', () => {
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const store = new Map();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem(key) { return store.get(key) ?? null; },
      setItem(key, value) { store.set(key, String(value)); },
    },
  });

  try {
    const scene = new THREE.Scene();
    const engine = {
      scene,
      makeModel(assetKey) {
        const model = new THREE.Group();
        model.userData.footprintRadius = 0.45;
        model.userData.assetKey = assetKey;
        model.add(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.7), new THREE.MeshBasicMaterial()));
        return model;
      },
    };
    const makeField = () => ({ textContent: '', innerHTML: '', style: {} });
    const ui = Object.fromEntries(['score', 'best', 'wave', 'waveDetail', 'health', 'healthFill', 'lives', 'weaponTitle', 'weaponSub', 'weaponState', 'final'].map((key) => [key, makeField()]));
    const keys = new Set(['KeyD']);
    const mode = createLegacyMode({
      engine,
      keys,
      ui,
      getBounds: () => ({ halfWidth: 12, halfHeight: 10 }),
      showScreen() {},
      showNotice() {},
      sound: { fire() {}, hit() {}, damage() {} },
    });

    mode.start();
    const initialX = mode.state.player.x;
    mode.update(0.1);
    assert.ok(mode.state.player.x > initialX);
    assert.equal(mode.state.invaders.length, 55);
    assert.equal(new Set(mode.state.invaders.map((invader) => invader.speed)).size, 1);
    assert.deepEqual(new Set(mode.state.invaders.map((invader) => invader.mesh.userData.assetKey)), new Set(['enemy', 'invaderA', 'invaderB']));
    const barrier = mode.state.shields[0];
    const invader = mode.state.invaders[0];
    mode.state.formation.x = barrier.x - invader.localX - mode.state.formation.direction * 0.72 * 0.01;
    mode.state.formation.z = barrier.z - invader.row * 0.95;
    mode.update(0.01);
    assert.equal(mode.state.invaders.length, 55, 'shield contact must not remove the invader or break the invasion condition');
    assert.ok(mode.state.shields.length < 28);
    assert.ok(mode.state.crumblingBarriers.length > 0);
    mode.update(0.5);
    assert.equal(mode.state.crumblingBarriers.length, 0);
    assert.equal(mode.state.invaders.length, 55);
    mode.state.player.x = 10.8;
    keys.add('Space');
    mode.update(0.01);
    assert.equal(mode.state.playerShots.length, 1);
    mode.update(0.4);
    assert.equal(mode.state.playerShots.length, 2, 'constant fire cadence can launch while earlier rounds are still in flight');
    keys.delete('Space');
    mode.state.formation.z = mode.state.player.z - 0.4;
    mode.update(0.01);
    assert.equal(mode.state.running, false, 'the invaders remain active and can still reach the cannon line');

    mode.dispose();
    assert.equal(scene.children.length, 0);
    assert.equal(mode.state.invaders.length, 0);
    assert.equal(mode.state.playerShots.length, 0);
  } finally {
    if (previousStorage) Object.defineProperty(globalThis, 'localStorage', previousStorage);
    else delete globalThis.localStorage;
  }
});
