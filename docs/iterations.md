# Iteration Log

Keep one concise entry per implementation iteration. Preserve the real prompt text when recording prompts; do not fabricate prompts after the fact. Record actual checks and outcomes, including failures. This log is not a substitute for the submitter's own reflection.

## Entry template

### Iteration N — short title

- **Prompt:**
- **Scope / acceptance checks:**
- **Time used / time remaining:**
- **Changed:**
- **Checks and outcome:**
- **Deferred / known limits:**
- **Gate:** clear / not clear

## Planning note

The user set the production direction: first establish a solid ACT engine foundation using Three.js, with a plain local HTML/CSS/JavaScript launcher and a clear local-run status banner. After that, the user will steer functionality through iteration prompts. The approved visual mockup informs HUD/menu layout only; actual in-game visual assets must come from the asset hunt. See the active implementation entry below.

### Iteration 1 — ACT foundation and playable Space Attack

- **Prompt:** Archived verbatim project and implementation prompts in [iteration-01.md](../prompts/iteration-01.md), including “Continue towards build” and the clarification that game-world art must come from the asset hunt.
- **Scope / acceptance checks:** Local Vite launcher and warning; sourced local game models; playable keyboard movement/aim/fire, enemies, collisions, score/health, waves, game-over/restart; HUD/menu per brief.
- **Time used / time remaining:** 22 active minutes logged at 11:35 America/Bogota; 98 minutes remained before the 13:13 cap. See [time-log.md](time-log.md).
- **Changed:** Built the vanilla HTML/CSS/JS launcher and Three.js ACT runtime with local asset loading, resize handling, bounded animation step and visible load-error state. Added a top-down playable loop with WASD movement, independent arrow-key aiming, hold-Space firing, enemy pursuit, projectile and obstacle collisions, health/lives, local best score, waves that increase in count and speed, repair-crystal drops, pause, game over and restart. Added a tutorial first wave aimed toward the default firing direction. The detailed landing menu and HUD show controls, score/best, wave/enemies remaining, hull/lives, weapon state, and transient wave/repair notices. Game-world models and pickup visuals come from the locally bundled Kenney Space Kit; the approved mockup was used for menu/HUD structure only.
- **Checks and outcome:** `npm run build` completed successfully. Browser play-test verified local warning/menu, WASD movement, arrow aim, firing and a scored kill, progression from Wave 1 to Wave 2, hull/damage feedback, pause/resume, best-score persistence across reload, hands-off game over, and Play Again resetting score/wave/hull/lives. The initial random-spawn trial was too punishing and scored zero; tuned the first wave to approach from the ship's default aim, reduced early pressure, and repeated play-test successfully. No formal test suite was added.
- **Deferred / known limits:** Gamepad, sound, additional enemy archetypes, ambient triggers/traps, mouse aiming and WebGPU are not implemented; WebGL is the shipped renderer, so a CPU/performance switch is unnecessary for this build. Browser bundle reports a 586.87 kB minified JS chunk (151.32 kB gzip); Vite emits its default >500 kB advisory. The reflection must be written by the submitter. Submission form remains unfilled.
- **Gate:** clear for first playable iteration; follow-up iteration can add stretch features or polish based on user steering.

### Iteration 2 — Spatial QA, feedback, sound, and mode naming

- **Prompt:** Archived verbatim in [iteration-02.md](../prompts/iteration-02.md).
- **Scope / acceptance checks:** Separate enemy world motion from player transforms; reduce the ship to a view-relative size; align ship facing and projectile origin/direction; make collision behavior inspectable and damage visible; add synthesized fire/hit/damage sound; label the current game as Asteroid Mode and expose the planned Legacy Mode in the landing menu. User will perform all browser play checks; agent scope is code and unit checks only.
- **Time used / time remaining:** 9 additional active minutes logged at 11:53 America/Bogota; 31 total minutes used, 89 remain before the timebox cap.
- **Changed:** Arena movement/collision math is now explicitly XZ with Y reserved for height. Meshes are independent scene-root instances driven from world positions. Enemies steer their own velocity with a turn limit. The orthographic view is expanded and the ship target size is calculated as 1/15 of view height. GLB roots are centered; the muzzle uses measured local forward extent and the same aim vector as ship rotation/projectile travel. Actor collision radii derive from normalized asset footprints; F3 shows exact player/enemy/obstacle rings. Bullet collisions use swept segment-circle checks. Damage and target hits get notices, hull feedback, and impact sounds. Added short Web Audio synth cues for fire/hit/damage, unlocked on Start. Landing menu names Asteroid Mode and shows Legacy Mode as planned after core iterations.
- **Checks and outcome:** `npm test` passed all six focused Node tests (view-relative size, independent chaser movement, circle contact, swept shot hit/miss, muzzle alignment, and synth-cue scheduling). `node --check` passed on the changed runtime/test modules. `npm run build` completed; Vite retains its >500 kB minified-chunk advisory. No browser/play test was performed at the user's direction; awaiting their hands-on check.
- **Deferred / known limits:** Legacy Mode remains a disabled planned option until the core mode is complete. Gamepad, extra enemy types, ambient triggers and traps remain stretch work. Audio is synthesized Web Audio, not recorded samples or an external MIDI file. Manual browser verification is intentionally left to the user.
- **Gate:** code and unit-check pass clear; manual play check pending from user.

### Iteration 3 — Isolate actor-root drift

- **Prompt:** Archived verbatim in [iteration-03.md](../prompts/iteration-03.md).
- **Scope / acceptance checks:** Isolate why a stationary enemy appears to move when the player crosses cardinal arena extremes. Keep this pass to the root cause and its regression coverage; the user will resume browser play checks.
- **Time used / time remaining:** 4 additional active minutes logged at 12:06 America/Bogota; 35 total minutes used and 85 minutes remained before the cap.
- **Changed:** Every GLB instance now has a zero-origin ACT actor root for gameplay world transforms. Model normalization/centering stays on a separate visual child. This prevents the per-frame actor-position write from replacing the model-centering offset; each actor’s world transform remains independent, following the Actor/root-component transform model.
- **Checks and outcome:** Added a zero-speed chaser regression that moves the target to all four cardinal extremes and asserts the enemy’s recorded world position remains fixed. Added a transform regression using deliberately offset geometry: translation and yaw at each cardinal point preserve the visual bounds center on the actor root. `npm test` passes all 8 focused unit tests, and `npm run build` completes successfully. Vite reports the existing >500 kB minified-chunk advisory. No browser play-test was performed; the user will test the running app.
- **Deferred / known limits:** Browser verification of perceived damage, hit feedback, and score reporting remains with the user. No gameplay tuning or additional features were added in this pass.
- **Gate:** root-transform code and unit regression checks clear; user play check pending.

### Iteration 4 — Correct player nose direction

- **Prompt:** Archived verbatim in [iteration-04.md](../prompts/iteration-04.md).
- **Scope / acceptance checks:** Fix only the ship's reversed up/down orientation; verify that its visual nose faces the selected cardinal aim direction.
- **Time used / time remaining:** 6 additional active minutes logged at 12:12 America/Bogota; 41 total minutes used and 79 minutes remained before the cap.
- **Changed:** Mapped aim yaw to the bundled craft's local -Z nose. Projectile and aim vectors are unchanged.
- **Checks and outcome:** Added a unit test checking the local -Z nose against all four cardinal aim vectors. `npm test` passes all 9 focused tests, and `npm run build` completes successfully. Vite retains its >500 kB minified-chunk advisory. No browser play-test was performed; user check requested.
- **Deferred / known limits:** User browser verification pending.
- **Gate:** code and unit checks clear; user play check pending.

### Iteration 5 — Legacy formation mode

- **Prompt:** Archived verbatim in [iteration-05.md](../prompts/iteration-05.md).
- **Scope / acceptance checks:** Follow L0–L3: document classic fixed-screen formation rules; map shared engine versus mode-owned dependencies; add selectable Legacy Mode; implement horizontal-only cannon movement, upward one-at-a-time shots, descending edge-reversing formation, sparse slow enemy fire, destructible two-sided shields, row score, waves, invasion/game-over, and restart; hand over for play checks.
- **Time used / time remaining:** 20 additional active minutes logged at 12:42 America/Bogota; 61 total minutes used and 59 minutes remained before the cap.
- **Changed:** Researched Taito and Atari rule references and recorded the mode boundary in [mode-architecture.md](mode-architecture.md). The landing menu now selects either mode and updates the controls. Legacy owns a separate simulation/controller and run state in `src/modes/legacy.js` and `legacy-simulation.js`; it reuses the Three.js ACT scene/engine, player/enemy assets, sourced local platform assets for shields, and audio hooks. Formation size adapts to viewport width up to 55 invaders. Score/best are separate per mode. Asteroid mode is guarded from Legacy updates and its static arena is hidden while Legacy is active.
- **Checks and outcome:** `node --check` passes on the changed runtime modules. `node --test --test-reporter=spec tests/simulation.test.js` passes all 14 tests, including formation edge/drop, thinning/wave difficulty, invasion, row score, upward/downward shield hits, and Legacy start/move/fire/dispose. Final `npm run build` succeeds; Vite keeps its >500 kB minified-chunk advisory. No browser play-test was performed, per the user's standing instruction to do direct play checks.
- **Departments:** Production kept the existing engine scope; Game Design matched the requested fixed-lane loop and row scoring; Engineering added mode dispatch and the Legacy lifecycle; Art & Audio reused locally licensed Kenney models and existing synthesized cues; QA cleared unit/build checks and handed over manual play; Release archived the prompt and updated run/control documentation.
- **Deferred / known limits:** Full extraction of the existing Asteroid implementation from `src/main.js` into a dedicated `src/modes/asteroid.js` is documented as the next architecture step after this Legacy play check. The fixed-stage/user play gate remains pending.
- **Gate:** L0 research, L1 plan, and L2 code/unit checks clear; L3 manual test pending with the user.

### Iteration 6 — Enemy primer and split progression

- **Prompt:** Archived verbatim in [iteration-06.md](../prompts/iteration-06.md).
- **Scope / acceptance checks:** Replace the runaway Legacy haste feedback with an additive defeat-count curve capped at 3× cannon speed; give Legacy invaders common speed/formation AI with three bundled silhouettes selected from one wave-level closed-loop offset; make Asteroid A enemies split into two B, then each B into two C, with child directions ordered by a run-level closed-loop offset. Preserve wave and score behavior.
- **Time used / time remaining:** 7 additional active minutes at 2026-10-07 13:00 America/Bogota; 68 total active minutes used and 52 remain before the hard stop. (Production time is tracked only while actively working.)
- **Changed:** `formationSpeed` now uses a fixed base plus defeated-invader haste and a wave increment, with a cap passed as three times `PLAYER_SPEED`; the controller no longer feeds the prior frame's speed back. Legacy formation variants use locally bundled Alien/Astronaut A/Astronaut B models. Legacy shooter selection and shot intervals are deterministic so the one wave-level model offset is its only Legacy random draw. Asteroid enemies are tagged A/B/C, use three local craft models, award type-based points (100/50/25), and split through an eight-direction child-placement loop whose offset is chosen once per run. Added extracted Kenney assets and manifest entries; updated mode brief/architecture and README.
- **Checks and outcome:** `node --test --test-reporter=spec tests/simulation.test.js` passes all 16 tests, including additive/capped haste, model-loop assignment/shared Legacy speed, and A→B→C split types and closed-loop positions. `node --check` passes for changed runtime modules. `npm run build` succeeds; Vite reports the existing >500 kB minified chunk advisory (603.26 kB). No browser play-test was performed; user will test both modes.
- **Departments:** Production held scope to the explicit mode changes; Game Design encoded the cap, equal Legacy attributes, and binary split chain; Engineering kept splits and formation rules in pure tested helpers; Art & Audio bundled distinct locally licensed models and updated provenance; QA cleared unit checks and left browser verification to the user; Release archived the exact prompt and refreshed documentation.
- **Deferred / known limits:** The local Kenney archive contains only one dedicated Alien GLB plus two astronaut silhouettes, so Legacy uses these verified three distinct forms. Asteroid fragments use the locally bundled Speeder B/C/D models. Only code/unit/build verification was in scope; browser play remains pending.
- **Gate:** code and unit gate clear after build; manual L3 check pending with user.

### Iteration 7 — Asteroid rock composites and view scale

- **Prompt:** Archived verbatim in [iteration-07.md](../prompts/iteration-07.md).
- **Scope / acceptance checks:** Replace Asteroid Speeder enemies with large crystal/rock models; compose each enemy from two copies of the same model, mirrored horizontally at the same origin; ensure Asteroid enemies do not fire; change the view-relative player model size from 1/15 to 1/21.
- **Time used / time remaining:** Included in the 23 active minutes logged for Iterations 7–8 below.
- **Changed:** Added Asteroid model keys for Rock Crystals Large A and Rock Large A/B. The ACT engine creates a centered pair of the selected GLB and flips the second along X; Asteroid A/B/C map to those assets while retaining split rules and contact damage. The shared view-size divisor is now 21. The Asteroid controller contains no enemy-shot creation/update path; Legacy fire remains mode-specific. Updated brief and asset manifest to mark superseded Speeder assets as not loaded.
- **Checks and outcome:** Combined unit suite covers 1/21 sizing and two-copy mirror placement; all 17 tests pass. Production build passes after post-processing and credits integration.
- **Deferred / known limits:** No browser play-test by the agent; user will inspect the visual composition.
- **Gate:** Code is covered by the combined Iteration 8 checks; manual user review pending.

### Iteration 8 — Diorama post-processing and credits

- **Prompt:** Archived verbatim in [iteration-08.md](../prompts/iteration-08.md), with the cast names/roles provided during implementation in [iteration-08-cast.md](../prompts/iteration-08-cast.md).
- **Scope / acceptance checks:** Apply diorama tilt-shift treatment to both modes; expose a reduced-cost mode; state the renderer/platform scope honestly; start a thank-you scroller from game-over with asset/framework URLs, Carlos as author, Codex as co-author, placeholders for other contributors, and a gingerbread person recipe at the end.
- **Time used / time remaining:** Iterations 7–8 used 23 additional active minutes at 2026-10-07 13:25 America/Bogota; 91 total active minutes logged and 29 remain within the 120-minute active-work cap. The original 13:13 wall-clock target was passed while following later user-steered tune-ups; total active work remains below the cap.
- **Changed:** Added a focused-band blur and subtle vignette through Three.js post-processing, enabled for both modes. Performance mode bypasses post-processing and renders at lower pixel ratio. The launcher states WebGL2/GPU desktop-browser scope; it does not claim a CPU software-render fallback. Added a game-over Thank You action and a credits scroller with CC0 asset source, framework links, Carlos as author, Codex as co-author, the cast/crew roles Carlos supplied, a placeholder for remaining contributors, and a gingerbread recipe.
- **Checks and outcome:** All 17 unit tests pass; `node --check` passes for changed JS modules; `npm run build` succeeds. Vite retains its >500 kB advisory (617.31 kB minified, 160.67 kB gzip). Visual shader appearance and credits playback are for the user to inspect in-browser; no browser play-test was performed.
- **Deferred / known limits:** No dedicated CPU renderer. WebGL2 availability and GPU acceleration are browser/platform requirements.
- **Gate:** Code/build checks clear; user visual review remains pending.

### Iteration 9 — Fixed rock motion and Legacy cadence/barrier contact

- **Prompt:** Archived verbatim in [iteration-09.md](../prompts/iteration-09.md). Clarification that the barrier (not the invader) crumbles is archived in [iteration-09-correction.md](../prompts/iteration-09-correction.md).
- **Scope / acceptance checks:** Remove Asteroid player-tracking; move root rocks at fixed speed, accelerate split fragments along random new vectors, and wrap at arena edges preserving the velocity vector. Set Legacy player fire cadence from expected shots at a 60% hit rate and a reference normal clear; when an invader touches a shield, crumble the shield out of active collision while the invader continues toward the cannon.
- **Time used / time remaining:** 18 additional active minutes at 2026-10-07 13:43 America/Bogota; 109 total active minutes logged, 11 remain under the 120-minute cap. See [time-log.md](time-log.md).
- **Changed:** Root rocks now move toward arena center at fixed speed 0.82 without steering; split fragments get independent random headings and 1.5× parent speed. Position wrapping is per axis and leaves velocity untouched. Legacy's 55-invader reference wave models 92 shots at 60% accuracy and fires at a fixed 33/91-second cadence, allowing several rounds in flight. Shield contact removes the barrier from collision immediately and starts its 0.42-second sink/shrink; invaders remain active and keep advancing toward the cannon line.
- **Checks and outcome:** 20 unit tests pass, including root/split velocity, edge wrapping, derived firing interval, barrier contact, and controller assertions that the barrier crumbles while invaders persist and can still trigger the loss condition. JS syntax checks pass. The production build succeeds with Vite's >500 kB advisory (618.20 kB minified, 160.99 kB gzip). No browser play-test was performed.
- **Deferred / known limits:** The 33-second normal-clear target is a tuning assumption used to turn the 60% accuracy target into a cadence; user can adjust that target after playing.
- **Gate:** Code/unit/build checks clear; user play-check pending.

### Iteration 10 — Legacy fire-rate calibration

- **Prompt:** Archived verbatim in [iteration-10.md](../prompts/iteration-10.md).
- **Scope / acceptance checks:** Increase fire rate by exactly 20% and recalibrate the normal-wave accuracy assumption to 40%.
- **Time used / time remaining:** 3 active minutes at 2026-10-07 13:46 America/Bogota; 112 total active minutes logged and 8 remain within the 120-minute cap.
- **Changed:** Fire interval is reduced by a factor of 1.2 from the previous setting. At 40% accuracy, 55 invaders require an expected 138 shots, giving an estimated 41.4-second continuous-fire clear.
- **Checks and outcome:** All 20 unit tests pass, including exact 1.2× rate increase and the 40%-accuracy expected clear-time calculation. Production build succeeds; Vite retains its >500 kB advisory (618.27 kB minified, 161.02 kB gzip).
- **Deferred / known limits:** Estimated fire time assumes continuous firing and ignores projectile travel and movement.
- **Gate:** Unit check pending.

### Iteration 11 — Focused diorama camera and visual dressing

- **Prompt:** Archived verbatim in [iteration-11.md](../prompts/iteration-11.md).
- **Scope / acceptance checks:** Keep the player ship in the tilt-shift focus; choose a restrained oblique camera with nonzero X/Y/Z position; make Asteroid props varied, slowly rotating, and collision-free; add non-colliding floor dressing in Legacy.
- **Time used / time remaining:** 4 active minutes at 2026-10-07 13:50 America/Bogota; 116 total active minutes logged and 4 remain within the 120-minute cap.
- **Changed:** Camera now uses a slight oblique view. Tilt-shift blur falls off radially from a world-space focus point updated from the active ship. Asteroid background models have varied sizes and slow in-place rotation and were removed from collision handling. Legacy receives two small edge props over the shared arena floor.
- **Checks and outcome:** 20 unit tests pass with direct `node --test tests/simulation.test.js`; Vite production build succeeds (618.84 kB minified, 161.26 kB gzip; existing large-chunk advisory). `npm test` exited without test output in this environment. No browser visual test was performed.
- **Deferred / known limits:** Visual camera framing and tilt-shift intensity await the user's browser check. Performance mode continues to disable post-processing.
- **Gate:** Code/unit/build checks clear; user visual check pending.

### Iteration 13 — Legacy fire-rate increase

- **Prompt:** Archived verbatim in [iteration-13.md](../prompts/iteration-13.md).
- **Scope / acceptance checks:** Increase the current Legacy firing rate by 30%; preserve the 40% accuracy assumption.
- **Changed:** Fire cadence is 1.56× the original baseline, which is 30% faster than the previous 1.2× calibration. The modeled 55-invader continuous-fire clear is now about 31.8 seconds.
- **Checks and outcome:** All 20 unit tests pass, including the 1.3× increase over the previous cadence. Production build succeeds (618.90 kB minified, 161.27 kB gzip; existing large-chunk advisory).
- **Gate:** Code/unit/build checks clear; user play-check pending.

### Iteration 12 — Legacy blur and haste caps

- **Prompt:** Archived verbatim in [iteration-12.md](../prompts/iteration-12.md).
- **Scope / acceptance checks:** Reduce the strongest tilt-shift blur where Legacy invaders appear; cap late-wave formation speed at 2× cannon speed.
- **Changed:** Reduced the tilt-shift maximum blur radius from 0.0038 to 0.0017 of screen dimensions. Legacy formation haste remains additive and now caps at twice player speed.
- **Checks and outcome:** All 20 unit tests pass, including the twice-speed cap. Production build succeeds (618.90 kB minified, 161.28 kB gzip; existing large-chunk advisory). No browser visual test was performed.
- **Gate:** Code/unit/build checks clear; user visual check pending.
