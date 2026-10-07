# Engineering Architecture Guide

## Launcher and ACT engine boundary

The **launcher** is the small browser shell: plain `index.html`, CSS, and JavaScript. It owns page metadata, the game mount element, local-preview status banner, and any start/loading/error container. It should run with the project's local development server. When served from localhost, show a clear, accurate status such as “Local preview — this build is running on your device.” Do not label a local build as hosted. If the same shell is deployed later, replace the local-only message with an accurate hosted/build status.

Use Vite as the local dev server and bundler so Three.js can be imported as a normal package and the same HTML entry can produce a static build. Keep UI code framework-free: `npm run dev` is the local run path and `npm run build` creates the review/deploy bundle. The launcher remains HTML/CSS/JS; Vite is tooling, not the game framework.

The **ACT engine** is the working name for the actual game runtime, built on Three.js. Use vanilla JavaScript ES modules as the initial framework choice: this keeps startup and architecture explicit and avoids spending the two-hour budget on framework setup. Revisit only if an iteration prompt or a concrete implementation need benefits from another framework. Keep the foundation to a small lifecycle, loop, scene, camera, and input-intent boundary; do not build a generic engine framework.

The foundation gate covers renderer/canvas lifecycle, scene/camera, resize, bounded update loop, input boundary, startup failure state, restart behavior, and a performance-setting seam. This gate is complete in the current build; later iterations should extend its small, explicit modules rather than replacing the working game with a placeholder.

Asteroid Mode controls: WASD movement; arrow keys aim in four or eight directions; hold Space to fire in the last non-zero aim direction, initially up. Normalize movement diagonals, but keep aim's cardinal/diagonal direction. Legacy Mode controls are intentionally different: A/D or Left/Right moves only on X; Space fires up the screen. Clear held input on blur/visibility loss. The shared shell dispatches input intent, but each mode interprets only its own mapping.

## Mode boundary

The ACT renderer, local asset loader, camera, bounded frame loop, input key collection, shared status/HUD shell, and sound hooks are shared. Asteroid and Legacy own separate movement, enemy/wave state, shot cadence, collision rules, scoring, and reset paths. The active mode is selected on the landing menu and receives frame updates; inactive mode entities must be removed or hidden before another mode starts. Legacy's formation/shield rules are isolated in `src/modes/legacy-simulation.js` and its scene/lifecycle in `src/modes/legacy.js`. The existing Asteroid loop remains in `src/main.js` during this Legacy slice; `docs/mode-architecture.md` records its extraction boundary and current migration decision.

## World coordinates and collision ownership

- The arena is the **XZ ground plane**. `x` and `z` are authoritative gameplay coordinates; `y` is vertical placement for meshes, the firing lane, lights, and camera.
- Player, enemy, obstacle, and projectile meshes are independent children of the scene root. Never parent enemies or projectiles under the player or camera. Copy each actor's world `x/z` state into its scene-root mesh after simulation updates.
- Enemies steer their own velocity toward the player with a turn-rate limit. A player's movement changes the enemy's future steering target, never the enemy's position or velocity directly.
- Normalize/center loaded GLB instances before positioning them in the world. Derive actor collision radii from each normalized model's XZ footprint. `F3` displays those exact circle colliders; player and enemy contact tests use the sum of the radii.
- Fire direction uses the same normalized XZ aim vector as the ship yaw. Asteroid shots start at the player's local -Z nose extent; Legacy fire is a fixed upward lane. Use swept segment-vs-circle checks so a fast projectile cannot skip a target between frames.
- Keep damage feedback legible: reduce the numeric hull and bar, show a short hit notice, flash the screen edge, and blink the ship during invulnerability.

The shared bootstrap remains in `src/main.js`; ACT rendering is in `src/act/`; Legacy mode rules are in `src/modes/`. Asteroid behavior is still in `src/main.js` for this slice and is the extraction target in the mode architecture plan. Focused Node unit checks live in `tests/simulation.test.js`.

## Recommended small-project layout

Keep the structure familiar and proportional to the timebox. Adjust filenames to the chosen starter, but preserve clear boundaries:

```text
index.html               # launcher shell and local preview status
src/launcher.js          # mount ACT, launcher status/error hooks
src/styles.css           # launcher and banner
src/
  main.js                 # bootstrap, renderer selection, resize, animation loop
  act/                    # small game-engine runtime modules
  game/Game.js            # state transitions and run lifecycle
  game/Simulation.js      # player/enemy/projectile updates and collision rules
  input/InputManager.js   # keyboard, optional gamepad, focus handling
  scene/createScene.js    # Three.js camera, lights, arena, object factories
  ui/HUD.js               # start/game-over, score/health/wave, controls/settings
  audio/Audio.js          # optional user-gesture audio and mute
public/assets/            # optimized local models, textures, audio
docs/asset-manifest.md    # source/license/import record for each external asset
```

Do not build a general-purpose engine. Implement only the reusable boundaries that make this game easy to reason about: state, input, simulation, rendering, and UI.

## Simulation and input

- Represent controls as intent (move vector, aim vector, fire state) so keyboard/gamepad share the same gameplay interface.
- Normalize diagonal movement. Aim independently from movement. The default mapping is WASD movement, arrow-key aim, and Space fire along the last aim direction; document the mapping on-screen.
- Use a fixed or bounded simulation step for stable collisions. A simple capped delta-time loop is sufficient for a short arcade game; prevent a long suspended-tab delta from teleporting actors.
- Store entities in small arrays or maps; remove defeated entities and bound particle/projectile lifetime. Avoid unbounded allocations in the per-frame path.
- Use simple circle/sphere or AABB hit tests. Keep render meshes and gameplay hitboxes coordinated but logically separate.
- Centralize game state transitions: `menu -> playing -> gameOver -> playing`. Restart must reset all run-specific state in one path.
- Pause or stop simulation on visibility loss if feasible. Release held inputs on `blur`/visibility changes so the ship does not remain stuck moving/firing.

## Three.js scene and rendering

- Use Three.js as the core 3D engine, even if gameplay is on a flat arena plane.
- Begin with `WebGLRenderer` for robust browser reach and low setup overhead. Optimize with a modest pixel ratio, simple materials/lights, and bounded effects.
- For this two-hour game, prefer WebGL and skip a WebGPU implementation unless the user specifically steers there. WebGPU adds initialization and compatibility work with little benefit for this small scene.
- If WebGPU is used, keep a visible “Performance / CPU Mode” that actually lowers rendering work. Test on WebGPU and force/test the WebGL 2 backend path; do not rely on fallback claims alone. Three.js documents automatic WebGL 2 fallback and `forceWebGL` support for `WebGPURenderer` in its [official guide](https://threejs.org/manual/pages/webgpurenderer).
- If WebGPU is used, a visible Performance / CPU Mode is required and must measurably reduce rendering work. At minimum, lower pixel ratio and effects/particle count; offer forced WebGL where feasible. With WebGL-only rendering, a low-quality toggle is optional.
- Use `setAnimationLoop` for rendering and dispose of transient geometry/materials where appropriate. Resize renderer and camera from the viewport.
- If renderer initialization fails, show an explanatory fallback/error state rather than a blank page.

## Asset loading

- Store shipped assets locally and load them from project-relative paths. Avoid runtime dependencies on asset-hosting sites.
- Prefer GLB/glTF. Keep meshes, textures, and audio compressed/resized to suit a small browser deliverable.
- Add loading progress only if useful; otherwise provide a clear loading/error state and procedural fallback.
- Read `asset-manifest.md` before adding an asset; keep source URL, creator, exact license/version, retrieval date, modifications, local filename, and attribution text if required.
- Do not use branded ships, characters, logos, music, or recognizable copyrighted designs without a clear license and task need.

## Audio

- Audio is optional. Start sound only after an explicit start/unmute action to satisfy autoplay policies.
- Prefer small original oscillator/noise effects or clearly licensed local samples. Provide mute and keep gameplay feedback visual.
- If MIDI is used, avoid external playback services and ensure the game remains playable with audio disabled.

## Browser and release behavior

- Ensure the document prevents accidental scrolling while gameplay input is active, without trapping normal browser controls outside the game surface.
- Keep keyboard focus visible and provide clickable start/restart controls.
- The game should not require login, network APIs, or server state. Local high score can use local storage, with safe parse/default behavior.
- Document the exact local run command and any build output path once implementation choices are known.
