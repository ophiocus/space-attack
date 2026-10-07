import { createEngine, THREE } from './act/engine.js';
import { createSoundFx } from './act/sound.js';
import { createLegacyMode } from './modes/legacy.js';
import { acceleratedRandomVelocity, splitChildrenFor, splitPairPositions, velocityTowardArenaCenter, wrapArenaPosition } from './modes/asteroid-simulation.js';
import {
  circleIntersects,
  modelSizeForView,
  muzzlePosition,
  shipYawForAim,
  segmentIntersectsCircle,
} from './act/simulation.js';

const $ = (selector) => document.querySelector(selector);
const uiRoot = $('#ui-root');
const gameRoot = $('#game-root');
const loading = $('#loading');
const localBanner = $('#local-banner');
const localHost = ['localhost', '127.0.0.1', '::1'].includes(location.hostname);
localBanner.hidden = !localHost;

const hudMarkup = `
  <div class="ui-layer">
    <div class="top-hud" data-hud hidden>
      <div class="hud-box"><span class="hud-label">Score</span><span class="hud-number" id="score-readout">0</span><div class="hud-small" id="best-readout">BEST 0</div></div>
      <div class="hud-box wave-box"><span class="hud-label">Wave</span><span class="hud-number" id="wave-readout">01</span><div class="hud-small" id="wave-detail">READY</div></div>
      <button class="pause-button" id="pause-button" type="button">Ⅱ &nbsp; Pause</button>
    </div>
    <div class="bottom-hud" data-hud hidden>
      <div class="health-box"><div class="health-head"><span class="hud-label">Hull</span><span class="health-value" id="health-readout">100 / 100</span></div><div class="health-track"><div class="health-fill" id="health-fill"></div></div><div class="life-row" id="lives-readout">LIVES&nbsp; ● ● ●</div></div>
      <div class="controls-hint" id="controls-hint"><kbd>WASD</kbd> Move &nbsp; <kbd>Arrows</kbd> Aim &nbsp; <kbd>Space</kbd> Fire · <kbd>F3</kbd> Hitboxes</div>
      <div class="weapon-box"><div class="weapon-head"><span class="weapon-title">Blaster</span><span class="weapon-state" id="weapon-state">READY</span></div><div class="weapon-sub">AUTOMATIC · SINGLE SHOT</div></div>
    </div>
    <section class="overlay" id="menu-screen" aria-label="Landing menu">
      <div class="menu-panel">
        <div class="menu-kicker" id="mode-kicker">ASTEROID MODE · ENDLESS WAVES</div>
        <h1 class="menu-title">Space<br>Attack</h1>
        <p class="menu-copy" id="mode-copy">Pilot your ship. Hold the line.</p>
        <div class="mode-picker" role="group" aria-label="Choose a game mode">
          <button class="mode-option selected" id="asteroid-mode" type="button" aria-pressed="true"><strong>Asteroid Mode</strong><span>Horde survival · twin-stick controls</span></button>
          <button class="mode-option" id="legacy-mode" type="button" aria-pressed="false"><strong>Legacy Mode</strong><span>Formation defense · shields and cannon</span></button>
        </div>
        <button class="primary-button" id="start-button" type="button">Start Asteroid Mode</button>
        <div class="local-best" id="menu-best">LOCAL BEST · 0</div>
        <button class="small-button performance-toggle" id="performance-toggle" type="button" aria-pressed="false">Performance mode · off</button>
        <div class="render-scope">Three.js WebGL · GPU accelerated · desktop browser</div>
        <div class="menu-controls" id="menu-controls"><span><kbd>WASD</kbd> Move</span><span><kbd>Arrows</kbd> Aim</span><span><kbd>Space</kbd> Fire</span></div>
      </div>
    </section>
    <section class="overlay" id="pause-screen" aria-label="Paused" hidden>
      <div class="state-panel"><h2 class="state-title">Paused</h2><p class="state-copy">Take a breath, pilot.</p><button class="primary-button" id="resume-button" type="button">Resume</button><div class="secondary-actions"><button class="small-button" id="restart-from-pause" type="button">Restart Run</button><button class="small-button" id="menu-from-pause" type="button">Menu</button></div></div>
    </section>
    <section class="overlay" id="gameover-screen" aria-label="Game over" hidden>
      <div class="state-panel"><div class="menu-kicker" id="gameover-kicker">Asteroid mode · run complete</div><h2 class="state-title" id="gameover-title">Ship Lost</h2><p class="state-copy" id="final-score">Score 0 · Wave 1</p><button class="primary-button" id="play-again-button" type="button">Play Again</button><div class="secondary-actions"><button class="small-button" id="credits-button" type="button">Thank You</button><button class="small-button" id="menu-from-gameover" type="button">Menu</button></div></div>
    </section>
    <section class="credits-screen" id="credits-screen" aria-label="Thank you credits" hidden>
      <button class="small-button credits-close" id="credits-close" type="button">Back to game over · Esc</button>
      <div class="credits-viewport"><div class="credits-content" id="credits-content">
        <p class="credits-kicker">SPACE ATTACK · A SMALL THANK YOU</p><h2>Made with care</h2>
        <p class="credits-label">AUTHORS</p><p>Carlos · Author<br>Codex (OpenAI) · Co-author</p>
        <p class="credits-label">CAST & CREW</p><p>Carlos · Author · Caffe ingestion<br>Sandra · Homemaker<br>Antonia · Morale Booster<br>Codex (OpenAI) · Co-author</p>
        <p>[Additional collaborators — names and roles to add]</p>
        <p class="credits-label">FRAMEWORKS & RUNTIME</p><p><a href="https://threejs.org/" target="_blank" rel="noreferrer">Three.js</a> · 3D engine and WebGL renderer<br><a href="https://vite.dev/" target="_blank" rel="noreferrer">Vite</a> · local development and build<br>Vanilla HTML, CSS and JavaScript · browser interface and gameplay</p>
        <p class="credits-label">LOCAL GAME ASSETS · KENNEY SPACE KIT · CC0</p><p><a href="https://kenney.nl/assets/space-kit" target="_blank" rel="noreferrer">Kenney Space Kit</a><br>Player: Craft Speeder A<br>Legacy invaders: Alien, Astronaut A, Astronaut B<br>Asteroid enemies: Rock Crystals Large A, Rock Large A, Rock Large B<br>World: Meteor Detailed, Rock, Rock Crystals, Platform Large, Terrain</p>
        <p class="credits-finale">THANK YOU FOR PLAYING</p>
        <p class="credits-label">A RECIPE FOR THE ROAD</p><h2>Gingerbread People</h2>
        <p>Mix 350 g flour, 1 tsp baking soda, 2 tsp ground ginger, 1 tsp cinnamon, and a pinch of salt. Rub in 125 g cold butter until crumbly. Stir in 100 g brown sugar, 1 egg, and 4 tbsp golden syrup to form a dough. Chill 30 minutes, roll to 5 mm, and cut little people. Bake at 180°C / 350°F for 8–10 minutes. Cool, decorate, share.</p>
      </div></div>
    </section>
    <section class="overlay" id="error-screen" aria-label="Game could not start" hidden>
      <div class="state-panel error-panel"><strong>Could not load the local game assets.</strong><span id="error-detail">Restart the local development server and try again.</span></div>
    </section>
    <div class="notice" id="wave-notice" role="status" aria-live="polite" hidden>WAVE 01 · INCOMING</div>
    <div class="damage-flash" id="damage-flash" aria-hidden="true"></div>
  </div>`;
uiRoot.innerHTML = hudMarkup;

const game = {
  engine: null,
  screen: 'menu',
  mode: 'asteroid',
  score: 0,
  best: Number(localStorage.getItem('spaceAttackBest') || 0),
  wave: 1,
  health: 100,
  lives: 3,
  player: null,
  enemies: [],
  splitOffset: 0,
  splitSequence: 0,
  shots: [],
  pickups: [],
  obstacles: [],
  sceneProps: [],
  sharedProps: [],
  legacyProps: [],
  decorProps: [],
  floor: null,
  held: new Set(),
  // Ground-plane vector; Y is reserved for model/projectile height.
  aim: { x: 0, z: -1 },
  world: { halfWidth: 12, halfHeight: 9 },
  shotClock: 0,
  damageClock: 0,
  invulnerable: 0,
  spawnClock: 0,
  spawnLeft: 0,
  waveDelay: 0,
  noticeClock: 0,
  performance: false,
  lastHud: '',
  showHitboxes: false,
  damageFlashTimer: 0,
};

const sound = createSoundFx();

const ui = {
  menu: $('#menu-screen'), pause: $('#pause-screen'), over: $('#gameover-screen'), credits: $('#credits-screen'), error: $('#error-screen'),
  score: $('#score-readout'), best: $('#best-readout'), menuBest: $('#menu-best'), wave: $('#wave-readout'),
  waveDetail: $('#wave-detail'), health: $('#health-readout'), healthFill: $('#health-fill'), lives: $('#lives-readout'),
  final: $('#final-score'), notice: $('#wave-notice'), weaponState: $('#weapon-state'), damageFlash: $('#damage-flash'),
  weaponTitle: $('.weapon-title'), weaponSub: $('.weapon-sub'),
  healthLabel: $('.health-head .hud-label'),
};

let legacyMode = null;

function modeBest() {
  const key = game.mode === 'legacy' ? 'spaceAttackLegacyBest' : 'spaceAttackBest';
  return Number(localStorage.getItem(key) || 0);
}

function updateModeMenu() {
  const legacy = game.mode === 'legacy';
  ui.healthLabel.textContent = legacy ? 'Cannon' : 'Hull';
  ui.weaponTitle.textContent = legacy ? 'Laser Cannon' : 'Blaster';
  ui.weaponSub.textContent = legacy ? 'UPWARD · SINGLE ROUND' : 'AUTOMATIC · SINGLE SHOT';
  $('#asteroid-mode').classList.toggle('selected', !legacy);
  $('#asteroid-mode').setAttribute('aria-pressed', String(!legacy));
  $('#legacy-mode').classList.toggle('selected', legacy);
  $('#legacy-mode').setAttribute('aria-pressed', String(legacy));
  $('#start-button').textContent = `Start ${legacy ? 'Legacy' : 'Asteroid'} Mode`;
  $('#mode-kicker').textContent = legacy ? 'LEGACY MODE · FORMATION DEFENSE' : 'ASTEROID MODE · ENDLESS WAVES';
  $('#mode-copy').textContent = legacy ? 'Hold the line. Keep the formation back.' : 'Pilot your ship. Hold the line.';
  $('#menu-controls').innerHTML = legacy
    ? '<span><kbd>A / D</kbd> Move</span><span><kbd>← / →</kbd> Move</span><span><kbd>Space</kbd> Fire Up</span>'
    : '<span><kbd>WASD</kbd> Move</span><span><kbd>Arrows</kbd> Aim</span><span><kbd>Space</kbd> Fire</span>';
  $('#controls-hint').innerHTML = legacy
    ? '<kbd>A / D</kbd> or <kbd>← / →</kbd> Move &nbsp; <kbd>Space</kbd> Fire Up · One shot'
    : '<kbd>WASD</kbd> Move &nbsp; <kbd>Arrows</kbd> Aim &nbsp; <kbd>Space</kbd> Fire · <kbd>F3</kbd> Hitboxes';
  ui.menuBest.textContent = `LOCAL BEST · ${modeBest().toLocaleString()}`;
}

function showNotice(message, tone = 'wave', duration = 1.1) {
  ui.notice.textContent = message;
  ui.notice.classList.remove('notice-hit', 'notice-damage');
  if (tone === 'hit') ui.notice.classList.add('notice-hit');
  if (tone === 'damage') ui.notice.classList.add('notice-damage');
  ui.notice.hidden = false;
  game.noticeClock = duration;
}

function makeHitbox(radius, color) {
  const inner = Math.max(0.01, radius - 0.035);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(inner, radius, 40),
    new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.75, depthWrite: false }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -0.43;
  ring.visible = game.showHitboxes;
  // Hitbox markers stay in the scene's world frame; they never inherit actor transforms.
  game.engine.scene.add(ring);
  return ring;
}

function syncHitbox(actor) {
  if (actor.hitbox) actor.hitbox.position.set(actor.x, -0.43, actor.z);
}

function removeEntity(entity) {
  game.engine.scene.remove(entity.mesh);
  if (entity.hitbox) {
    game.engine.scene.remove(entity.hitbox);
    entity.hitbox.geometry.dispose();
    entity.hitbox.material.dispose();
  }
}

function showScreen(name) {
  game.screen = name;
  ui.menu.hidden = name !== 'menu';
  ui.pause.hidden = name !== 'paused';
  ui.over.hidden = name !== 'gameover';
  ui.credits.hidden = name !== 'credits';
  ui.error.hidden = name !== 'error';
  document.querySelectorAll('[data-hud]').forEach((node) => { node.hidden = name !== 'playing' && name !== 'paused'; });
  if (name !== 'playing') game.held.clear();
  if (name !== 'playing') ui.weaponState.textContent = 'READY';
  if (name === 'menu') updateModeMenu();
}

function updateHud() {
  ui.score.textContent = game.score.toLocaleString();
  ui.best.textContent = `BEST ${game.best.toLocaleString()}`;
  ui.wave.textContent = String(game.wave).padStart(2, '0');
  const remaining = game.enemies.length + game.spawnLeft;
  const enemyLabel = remaining === 1 ? 'ENEMY' : 'ENEMIES';
  ui.waveDetail.textContent = game.screen === 'playing' ? `${remaining} ${enemyLabel} LEFT` : 'PAUSED';
  ui.health.textContent = `${Math.max(0, game.health)} / 100`;
  ui.healthFill.style.width = `${Math.max(0, game.health)}%`;
  ui.lives.innerHTML = `LIVES&nbsp; ${Array.from({ length: 3 }, (_, i) => `<span class="${i >= game.lives ? 'lost' : ''}">●</span>`).join(' ')}`;
}

function addArena() {
  const { halfWidth, halfHeight } = game.engine.bounds;
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshStandardMaterial({ color: '#22282a', roughness: 0.93, metalness: 0.04 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.62;
  floor.scale.set(halfWidth * 2, halfHeight * 2, 1);
  game.floor = floor;
  game.engine.scene.add(floor);
  game.sharedProps.push(floor);
  const terrain = game.engine.makeModel('terrain', Math.max(halfWidth, halfHeight) * 1.75);
  terrain.position.set(0, -0.57, 0);
  game.engine.scene.add(terrain);
  game.sharedProps.push(terrain);

  const placements = [
    [-10.2, -8.3, 'meteor', 1.35], [10.2, -8.1, 'rock', 1.1],
    [-10.1, 8.1, 'crystals', 1.25], [10.15, 8.25, 'meteor', 1.3],
    [-9.7, -1.5, 'platform', 1.35], [9.7, 1.4, 'platform', 1.25],
  ];
  placements.forEach(([x, z, kind, size], index) => {
    const mesh = game.engine.makeModel(kind, size);
    mesh.position.set(x, 0, z);
    mesh.rotation.y = Math.random() * Math.PI * 2;
    game.engine.scene.add(mesh);
    game.sceneProps.push(mesh);
    game.decorProps.push({ mesh, spin: 0.08 + index * 0.013, axis: index % 2 ? 'x' : 'z' });
  });
  // Legacy floor dressing stays at the far edge of the formation and never collides.
  for (const [x, z, kind, size] of [[-10.4, -9.1, 'rock', 0.72], [10.4, -9.0, 'crystals', 0.8]]) {
    const mesh = game.engine.makeModel(kind, size);
    mesh.position.set(x, -0.42, z);
    game.engine.scene.add(mesh);
    mesh.visible = false;
    game.legacyProps.push(mesh);
  }
}

function setAsteroidSceneVisible(visible) {
  for (const prop of game.sharedProps) prop.visible = true;
  for (const prop of game.sceneProps) prop.visible = visible;
  for (const prop of game.legacyProps) prop.visible = !visible;
}

function clearAsteroidActors() {
  game.enemies.forEach(removeEntity);
  game.pickups.forEach(removeEntity);
  for (const shot of game.shots) {
    game.engine.scene.remove(shot.mesh);
    shot.mesh.geometry.dispose();
    shot.mesh.material.dispose();
  }
  game.enemies.length = 0;
  game.shots.length = 0;
  game.pickups.length = 0;
  if (game.player) removeEntity(game.player);
  game.player = null;
}

function clearRun() {
  clearAsteroidActors();
  const playerSize = modelSizeForView(game.engine.bounds.halfHeight);
  const playerMesh = game.engine.makeModel('player', playerSize);
  game.player = {
    mesh: playerMesh,
    x: 0,
    z: 4.8,
    radius: Math.max(0.2, playerMesh.userData.footprintRadius * 0.72),
    muzzleOffset: playerMesh.userData.forwardExtent,
  };
  game.player.mesh.position.set(0, 0, game.player.z);
  game.player.hitbox = makeHitbox(game.player.radius, '#d1ed6b');
  syncHitbox(game.player);
  game.engine.scene.add(game.player.mesh);
  game.score = 0;
  game.wave = 1;
  game.splitOffset = Math.floor(Math.random() * 8);
  game.splitSequence = 0;
  game.health = 100;
  game.lives = 3;
  game.aim = { x: 0, z: -1 };
  game.shotClock = 0;
  game.damageClock = 0;
  game.invulnerable = 0;
  game.waveDelay = 0;
  startWave();
}

function startWave() {
  game.spawnLeft = Math.min(2 + game.wave, 15);
  game.spawnClock = 0.7;
  game.waveDelay = 0;
  showNotice(`WAVE ${String(game.wave).padStart(2, '0')} · INCOMING`, 'wave', 1.5);
  updateHud();
}

function spawnEnemy(x, z, type = 'A', velocity = null) {
  const isWaveSpawn = x === undefined || z === undefined;
  if (x === undefined || z === undefined) {
    const { halfWidth, halfHeight } = game.world;
    const edge = Math.floor(Math.random() * 4);
    if (game.wave === 1) {
      // The first wave approaches from the direction the ship already faces,
      // giving a new player time to learn the twin-stick controls.
      x = (Math.random() * 2 - 1) * 2.6;
      z = -halfHeight + 0.9;
    } else if (edge < 2) {
      x = (Math.random() * 2 - 1) * Math.max(2, halfWidth - 1.4);
      z = edge === 0 ? -halfHeight + 0.8 : halfHeight - 0.8;
    } else {
      x = edge === 2 ? -halfWidth + 0.8 : halfWidth - 0.8;
      z = (Math.random() * 2 - 1) * (halfHeight - 1.4);
    }
  }
  const size = type === 'A' ? 1.5 : type === 'B' ? 1.08 : 0.76;
  const mesh = game.engine.makeMirroredComposite(`asteroid${type}`, size);
  mesh.position.set(x, 0, z);
  const radius = Math.max(0.18, mesh.userData.footprintRadius * 0.72);
  const motion = velocity || velocityTowardArenaCenter({ x, z }, 0.82);
  const enemy = {
    mesh,
    x,
    z,
    radius,
    type,
    speed: Math.hypot(motion.vx, motion.vz),
    vx: motion.vx,
    vz: motion.vz,
    hitClock: 0,
  };
  enemy.hitbox = makeHitbox(radius, '#ef786a');
  syncHitbox(enemy);
  game.engine.scene.add(mesh);
  game.enemies.push(enemy);
  if (isWaveSpawn) game.spawnLeft -= 1;
  updateHud();
}

function fireShot() {
  const geometry = new THREE.SphereGeometry(0.09, 8, 6);
  const material = new THREE.MeshBasicMaterial({ color: '#e7edb1' });
  const mesh = new THREE.Mesh(geometry, material);
  const muzzle = muzzlePosition(game.player, game.aim, game.player.muzzleOffset, 0.1);
  mesh.position.set(muzzle.x, 0.35, muzzle.z);
  game.engine.scene.add(mesh);
  game.shots.push({ mesh, x: muzzle.x, z: muzzle.z, vx: game.aim.x * 14, vz: game.aim.z * 14, life: 1.5, radius: 0.1 });
  sound.fire();
}

function spawnRepair(x, z) {
  const mesh = game.engine.makeModel('crystals', 0.78);
  mesh.position.set(x, 0.12, z);
  game.engine.scene.add(mesh);
  game.pickups.push({ mesh, x, z, life: 10, radius: Math.max(0.18, mesh.userData.footprintRadius * 0.85) });
}

function takeDamage() {
  if (game.invulnerable > 0 || game.screen !== 'playing') return;
  game.health -= 15;
  game.invulnerable = 1.5;
  sound.damage();
  showNotice('HULL HIT · -15', 'damage', 0.75);
  ui.damageFlash.classList.remove('active');
  void ui.damageFlash.offsetWidth;
  ui.damageFlash.classList.add('active');
  if (game.health <= 0) {
    game.lives -= 1;
    if (game.lives <= 0) {
      finishRun();
      return;
    }
    game.health = 100;
  }
  updateHud();
}

function finishRun() {
  game.best = Math.max(game.score, game.best);
  localStorage.setItem('spaceAttackBest', String(game.best));
  ui.final.textContent = `SCORE ${game.score.toLocaleString()} · WAVE ${game.wave} · BEST ${game.best.toLocaleString()}`;
  showScreen('gameover');
  ui.notice.hidden = true;
}

function updatePlayer(dt) {
  const keys = game.held;
  const x = Number(keys.has('KeyD')) - Number(keys.has('KeyA'));
  const z = Number(keys.has('KeyS')) - Number(keys.has('KeyW'));
  const moveLength = Math.hypot(x, z);
  const moveScale = moveLength > 0 ? (6 * dt) / moveLength : 0;
  const moveX = x * moveScale;
  const moveZ = z * moveScale;
  game.player.x = THREE.MathUtils.clamp(game.player.x + moveX, -game.world.halfWidth + 0.9, game.world.halfWidth - 0.9);
  game.player.z = THREE.MathUtils.clamp(game.player.z + moveZ, -game.world.halfHeight + 0.9, game.world.halfHeight - 0.9);
  const aimX = Number(keys.has('ArrowRight')) - Number(keys.has('ArrowLeft'));
  const aimZ = Number(keys.has('ArrowDown')) - Number(keys.has('ArrowUp'));
  if (aimX || aimZ) {
    const aimLength = Math.hypot(aimX, aimZ);
    game.aim = { x: aimX / aimLength, z: aimZ / aimLength };
  }
  for (const obstacle of game.obstacles) {
    const minDistance = obstacle.radius + game.player.radius;
    if (circleIntersects(game.player, obstacle, minDistance)) {
      game.player.x -= moveX;
      game.player.z -= moveZ;
      break;
    }
  }
  game.player.mesh.position.set(game.player.x, 0, game.player.z);
  game.player.mesh.rotation.y = shipYawForAim(game.aim);
  syncHitbox(game.player);
  ui.weaponState.textContent = keys.has('Space') ? 'FIRING' : 'READY';
  game.invulnerable = Math.max(0, game.invulnerable - dt);
  game.player.mesh.visible = game.invulnerable <= 0 || Math.floor(game.invulnerable * 12) % 2 === 0;
  game.shotClock -= dt;
  if (keys.has('Space') && game.shotClock <= 0) {
    fireShot();
    game.shotClock = 0.22;
  }
}

function updateEnemies(dt) {
  for (let i = game.enemies.length - 1; i >= 0; i -= 1) {
    const enemy = game.enemies[i];
    // Rocks keep their spawn/split velocity; they do not steer toward the ship.
    enemy.x += enemy.vx * dt;
    enemy.z += enemy.vz * dt;
    Object.assign(enemy, wrapArenaPosition(enemy, game.world.halfWidth, game.world.halfHeight));
    enemy.mesh.position.set(enemy.x, 0, enemy.z);
    enemy.mesh.rotation.y = Math.atan2(enemy.vx, enemy.vz);
    syncHitbox(enemy);
    enemy.hitClock -= dt;
    const combinedRadius = enemy.radius + game.player.radius;
    if (circleIntersects(enemy, game.player, combinedRadius) && enemy.hitClock <= 0) {
      takeDamage();
      const dx = enemy.x - game.player.x;
      const dz = enemy.z - game.player.z;
      const distance = Math.hypot(dx, dz) || 1;
      enemy.x = game.player.x + (dx / distance) * (combinedRadius + 0.12);
      enemy.z = game.player.z + (dz / distance) * (combinedRadius + 0.12);
      enemy.mesh.position.set(enemy.x, 0, enemy.z);
      enemy.mesh.rotation.y = Math.atan2(enemy.vx, enemy.vz);
      syncHitbox(enemy);
      enemy.hitClock = 1.35;
    }
  }
}

function updateShots(dt) {
  for (let i = game.shots.length - 1; i >= 0; i -= 1) {
    const shot = game.shots[i];
    shot.life -= dt;
    const start = { x: shot.x, z: shot.z };
    shot.x += shot.vx * dt;
    shot.z += shot.vz * dt;
    const end = { x: shot.x, z: shot.z };
    shot.mesh.position.set(shot.x, 0.35, shot.z);
    const expired = shot.life <= 0;
    const outsideArena = Math.abs(shot.x) > game.world.halfWidth || Math.abs(shot.z) > game.world.halfHeight;
    let remove = false;
    for (const obstacle of game.obstacles) {
      if (segmentIntersectsCircle(start, end, obstacle, obstacle.radius + shot.radius)) { remove = true; break; }
    }
    if (!remove) {
      for (let j = game.enemies.length - 1; j >= 0; j -= 1) {
        const enemy = game.enemies[j];
        if (segmentIntersectsCircle(start, end, enemy, shot.radius + enemy.radius)) {
          removeEntity(enemy);
          game.enemies.splice(j, 1);
          const points = enemy.type === 'A' ? 100 : enemy.type === 'B' ? 50 : 25;
          game.score += points;
          if (game.score > game.best) {
            game.best = game.score;
            localStorage.setItem('spaceAttackBest', String(game.best));
          }
          if (game.health < 100 && enemy.type === 'A' && Math.random() < 0.18) spawnRepair(enemy.x, enemy.z);
          const childTypes = splitChildrenFor(enemy.type);
          if (childTypes.length) {
            const positions = splitPairPositions(enemy, enemy.type === 'A' ? 0.72 : 0.48, game.splitOffset, game.splitSequence++);
            positions.forEach((position, childIndex) => {
              const angle = Math.random() * Math.PI * 2;
              const velocity = acceleratedRandomVelocity(enemy, angle);
              spawnEnemy(position.x, position.z, childTypes[childIndex], velocity);
            });
          }
          sound.hit();
          showNotice(`${enemy.type} SPLIT · +${points}`, 'hit', 0.55);
          updateHud();
          remove = true;
          break;
        }
      }
    }
    if (!remove && (expired || outsideArena)) remove = true;
    if (remove) {
      game.engine.scene.remove(shot.mesh);
      shot.mesh.geometry.dispose();
      shot.mesh.material.dispose();
      game.shots.splice(i, 1);
    }
  }
}

function updatePickups(dt) {
  for (let i = game.pickups.length - 1; i >= 0; i -= 1) {
    const pickup = game.pickups[i];
    pickup.life -= dt;
    pickup.mesh.rotation.y += dt * 1.4;
    pickup.mesh.position.y = 0.12 + Math.sin(pickup.life * 4) * 0.08;
    if (circleIntersects(game.player, pickup, game.player.radius + pickup.radius) && game.health < 100) {
      game.health = Math.min(100, game.health + 30);
      showNotice('REPAIR · +30 HULL', 'wave', 1.2);
      updateHud();
      pickup.life = 0;
    }
    if (pickup.life <= 0) {
      game.engine.scene.remove(pickup.mesh);
      game.pickups.splice(i, 1);
    }
  }
}

function updateAsteroid(dt) {
  if (game.screen !== 'playing') return;
  updatePlayer(dt);
  updateEnemies(dt);
  updateShots(dt);
  updatePickups(dt);
  if (game.screen !== 'playing') return;
  if (game.spawnLeft > 0) {
    game.spawnClock -= dt;
    if (game.spawnClock <= 0) {
      spawnEnemy();
      game.spawnClock = Math.max(0.5, 1.3 - game.wave * 0.04);
    }
  } else if (game.enemies.length === 0) {
    game.waveDelay += dt;
    if (game.waveDelay >= 1.5) {
      game.wave += 1;
      startWave();
    }
  }
  if (game.noticeClock > 0) {
    game.noticeClock -= dt;
    if (game.noticeClock <= 0) ui.notice.hidden = true;
  }
}

const asteroidMode = {
  start: () => clearRun(),
  update: (dt) => updateAsteroid(dt),
  dispose: () => clearAsteroidActors(),
  setVisible: (visible) => setAsteroidSceneVisible(visible),
};

function frame(dt) {
  if (game.screen !== 'playing') return;
  for (const { mesh, spin, axis } of game.decorProps) mesh.rotation[axis] += spin * dt;
  if (game.mode === 'legacy') legacyMode?.update(dt);
  else asteroidMode.update(dt);
  const focus = game.mode === 'legacy' ? legacyMode?.state.player : game.player;
  if (focus) game.engine.setFocusWorld(focus.x, focus.y ?? 0, focus.z);
  if (game.mode === 'legacy' && game.noticeClock > 0) {
    game.noticeClock -= dt;
    if (game.noticeClock <= 0) ui.notice.hidden = true;
  }
}

function startRun() {
  void sound.unlock();
  if (game.mode === 'legacy') {
    asteroidMode.dispose();
    asteroidMode.setVisible(false);
    legacyMode?.dispose();
    legacyMode = createLegacyMode({
      engine: game.engine,
      keys: game.held,
      ui,
      getBounds: () => game.world,
      showScreen,
      showNotice,
      sound,
    });
    $('#gameover-kicker').textContent = 'Legacy mode · invasion repelled';
    $('#gameover-title').textContent = 'Cannons Lost';
    legacyMode.start();
  } else {
    legacyMode?.dispose();
    legacyMode = null;
    asteroidMode.setVisible(true);
    $('#gameover-kicker').textContent = 'Asteroid mode · run complete';
    $('#gameover-title').textContent = 'Ship Lost';
    asteroidMode.start();
  }
  showScreen('playing');
  if (game.mode === 'asteroid') updateHud();
}

function returnToMenu() {
  legacyMode?.dispose();
  legacyMode = null;
  asteroidMode.dispose();
  asteroidMode.setVisible(true);
  showScreen('menu');
}

function togglePause() {
  if (game.screen === 'playing') showScreen('paused');
  else if (game.screen === 'paused') showScreen('playing');
}

const keyCodes = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'F3']);
window.addEventListener('keydown', (event) => {
  if (keyCodes.has(event.code)) event.preventDefault();
  if (event.code === 'F3' && !event.repeat && game.screen !== 'menu' && game.screen !== 'gameover') {
    game.showHitboxes = !game.showHitboxes;
    if (game.player?.hitbox) game.player.hitbox.visible = game.showHitboxes;
    for (const enemy of game.enemies) enemy.hitbox.visible = game.showHitboxes;
    for (const obstacle of game.obstacles) obstacle.hitbox.visible = game.showHitboxes;
    return;
  }
  if (event.code === 'Escape') {
    if (game.screen === 'credits') showScreen('gameover');
    else togglePause();
    return;
  }
  if (game.screen === 'playing' && keyCodes.has(event.code)) game.held.add(event.code);
});
window.addEventListener('keyup', (event) => { game.held.delete(event.code); });
window.addEventListener('blur', () => game.held.clear());
document.addEventListener('visibilitychange', () => { if (document.hidden) game.held.clear(); });

$('#asteroid-mode').addEventListener('click', () => { game.mode = 'asteroid'; updateModeMenu(); });
$('#legacy-mode').addEventListener('click', () => { game.mode = 'legacy'; updateModeMenu(); });
$('#start-button').addEventListener('click', startRun);
$('#play-again-button').addEventListener('click', startRun);
$('#resume-button').addEventListener('click', () => showScreen('playing'));
$('#pause-button').addEventListener('click', togglePause);
$('#restart-from-pause').addEventListener('click', startRun);
$('#menu-from-pause').addEventListener('click', returnToMenu);
$('#menu-from-gameover').addEventListener('click', returnToMenu);
$('#credits-button').addEventListener('click', () => showScreen('credits'));
$('#credits-close').addEventListener('click', () => showScreen('gameover'));
$('#credits-content').addEventListener('animationend', () => {
  if (game.screen === 'credits') showScreen('gameover');
});
$('#performance-toggle').addEventListener('click', (event) => {
  game.performance = !game.performance;
  game.engine?.setPerformanceMode(game.performance);
  event.currentTarget.setAttribute('aria-pressed', String(game.performance));
  event.currentTarget.textContent = `Performance mode · ${game.performance ? 'on' : 'off'}`;
});

try {
  game.engine = await createEngine({
    mount: gameRoot,
    onFrame: frame,
    onResize: (bounds) => {
      game.world = { halfWidth: bounds.halfWidth - 0.8, halfHeight: bounds.halfHeight - 0.8 };
      if (game.floor) game.floor.scale.set(bounds.halfWidth * 2, bounds.halfHeight * 2, 1);
    },
    onLoading: (count, total) => { loading.textContent = `Loading local space assets… ${count}/${total}`; },
  });
  legacyMode = createLegacyMode({
    engine: game.engine,
    keys: game.held,
    ui,
    getBounds: () => game.world,
    showScreen,
    showNotice,
    sound,
  });
  addArena();
  loading.hidden = true;
  updateHud();
  showScreen('menu');
} catch (error) {
  console.error(error);
  loading.hidden = true;
  $('#error-detail').textContent = `${error.message} Check that the local asset files are present, then reload.`;
  showScreen('error');
}
