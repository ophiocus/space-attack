# Mode Architecture — Asteroid and Legacy

## L0 — Legacy rules and scope

Legacy is a fixed-screen formation shooter in the Space Invaders family. Its opening formation uses up to 55 invaders in five rows:

- The cannon moves on the horizontal ground axis only and fires vertically upward.
- A compact formation advances sideways, reverses at either screen edge, then steps downward. Thinning the formation increases its pace.
- Invaders fire slow, sparse downward rounds. The run ends if the formation reaches the cannon's ground line or the cannon loses its lives.
- All invaders use the same speed and formation AI. Three bundled silhouettes are assigned row-major through a closed model-reference loop, with one randomized starting offset per formation; shooter selection and cadence stay deterministic.
- Formation haste is additive from the fixed base speed and count defeated, plus a small wave increment. It is capped at three times player-cannon speed, and never feeds its prior frame's speed back into itself.
- Floating shield tiles block both sides' shots and lose integrity on each impact. Once a tile is destroyed, shots can pass through its gap.
- Clearing a formation starts a faster wave that begins progressively closer to the cannon, with a shorter enemy-fire interval. Score varies by invader row.

This uses the user's requested concise rules rather than reproducing every variation of the original arcade game. Primary references: [Taito Space Invaders Extreme help, Arcade Mode rules](https://taito.co.jp/en/steam/sie/help) and [Atari 7800 Space Invaders manual, gameplay and shields](https://www.ataricompendium.com/archives/manuals/7800/space_invaders.pdf). The Atari port documents horizontal-only cannon motion, upward fire, repeated formations, row scoring, and shields damaged by both friendly and enemy fire. The Taito help describes the invasion/life-loss and wave loop.

## L1 — Current dependency review

Before this iteration, `src/main.js` held the Asteroid game state, Asteroid arena setup, enemy spawning/steering, player movement/aim, shot collision, pickups, score/health updates, screen lifecycle, and global input listeners together. `src/act/engine.js` already provides the shared Three.js renderer, orthographic camera, local GLB loading, actor-root factory, resize handling, and animation loop. `src/act/simulation.js` contains reusable geometric and transform helpers alongside Asteroid's chaser rule. The launcher/HUD markup is assembled by the app shell in `src/main.js`.

### Shared app and engine responsibilities

- `src/main.js`: local-preview banner, engine bootstrap, mode selection, common menu/pause/game-over shell, held-key input collection, shared HUD nodes, and frame/lifecycle dispatch. The current Asteroid functions are exposed through a `start/update/dispose/setVisible` adapter here.
- `src/act/engine.js`: scene, renderer, camera, resize, bounded frame delta, local asset catalog, and independent actor roots. Modes receive the engine and own only their scene entities.
- `src/act/sound.js`: optional shared synthesized cues.
- Shared HUD and shell: score, best, wave, health/lives, notice, pause, restart, and game-over presentation. Mode controllers supply the current mode's values and screen transitions.

### Mode-owned responsibilities

- `src/modes/asteroid.js` (extraction target): Asteroid's free movement, independent aim, chasing enemies, arena obstacles, projectiles, repair pickups, and wave lifecycle.
- `src/modes/legacy.js`: Legacy formation movement, horizontal cannon input, single-lane player fire, sparse invader fire, destructible blockers, row score, invasion check, and Legacy wave lifecycle.
- `src/modes/legacy-simulation.js`: deterministic formation and blocker rules that can be unit-tested without Three.js or browser state.
- `src/modes/asteroid-simulation.js`: A→B→C split progression and closed-loop child-direction ordering for Asteroid Mode.

### Migration decision for this slice

Give each mode its own simulation state and `start/update/dispose` lifecycle now; keep the app shell and ACT engine shared. The already-working Asteroid loop remains in the shell as the compatibility mode for this iteration, guarded from Legacy dispatch, so this feature stays runnable and avoids a broad move-only rewrite while gameplay is being introduced. Extract its existing functions into `src/modes/asteroid.js` as a dedicated follow-up once Legacy behavior has passed the user's hands-on test. Do not share mode-specific enemy motion, collision rules, shot cadence, or movement controls.

## L2 — Legacy controller boundary

Legacy implements a `start()`, `update(dt)`, `dispose()` controller. It receives the existing ACT engine, current arena bounds, held-key set, shared HUD elements, sound cues, and screen-transition callbacks. It owns and cleans up every Legacy actor/projectile/shield tile it adds. The Asteroid adapter presents the same lifecycle plus `setVisible`, while Asteroid's implementation remains in the app shell until its extraction. The shell selects a mode only from the landing menu and dispatches `update` to exactly one active mode.

## L3 — Handover checklist

- Run unit tests for formation edge reversal/descent, additive/capped pressure as a wave thins, model-loop assignment, invasion threshold, row score, shield damage/destruction, and Asteroid A→B→C fragmentation.
- Build the browser bundle.
- Hand the local preview to the user for: selecting both modes; confirming Asteroid remains unchanged; Legacy left/right/fire; formation reversal/descent; both bullet directions stopping and damaging blockers; invader/player hits; score/wave progression; invasion/game-over; pause/restart/menu cleanup.
- Browser play-test remains pending with the user; code/unit checks alone do not clear the manual-play gate.
