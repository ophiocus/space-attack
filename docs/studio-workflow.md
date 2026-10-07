# Studio Workflow and Department Gates

## Goal and operating limits

Produce a small, polished, browser-playable Space Attack game. The source task limits active work to two hours, including play-testing and preparation for submission. Production starts a timer before implementation, keeps a simple running log, and stops feature work early enough to play-test, fix a blocker, capture required links, and prepare the submission. The planned stages below are gates, not a reason to create process overhead.

The game is single-player, top-down, horde-style, and twin-stick inspired. The player pilots a ship through enemy waves. Required: keyboard movement and independent firing direction, on-screen controls, working collisions, score, health/lives, rising difficulty, start screen, game over, and restart. Power-ups and gamepad are stretch goals. All core play must work without hosting, a gamepad, audio, or downloaded art.

## Iteration model

Production proceeds as a series of small, complete, playable units. The first unit is the engine foundation; after that, the user steers the sequence with iteration prompts. The prompt most recently supplied by the user defines the next slice, within the fixed game brief and time cap. Do not batch speculative features or move on while the current unit is broken.

Every iteration follows this short loop:

1. **Read and scope:** restate the prompt as observable behavior; list acceptance checks and dependencies; note the time remaining.
2. **Implement one unit:** make the smallest end-to-end change that satisfies this prompt. Keep the app runnable during the change.
3. **Check it:** run the app and perform the checks for this unit in a browser. Record pass/fail and any limitation; do not claim untested behavior.
4. **Close the iteration:** record the prompt, scope, files/areas changed, checks, outcome, and deferred work in `docs/iterations.md`; leave a stable app for review and further direction.
5. **Wait for steering:** proceed to the next iteration prompt from the user. Do not fill the gap with guessed product features. If a user prompt is already supplied, treat it as the next iteration and continue.

The short work loop does not waive stage gates: the gate is a quality bar for an iteration, not a long phase requiring several features. A gate can be cleared by the iteration that delivers the relevant unit.

Stages 2–4 below describe the studio's review responsibilities and final quality bars; they are not advance authorization to implement every listed feature. After Iteration 0, the user's next iteration prompt steers what is built next. Keep the final release gate in view, but do not pre-build optional content.

## Iteration 0: ACT engine foundation

This is the first complete functionality unit and the prerequisite for gameplay slices. Build a minimal **ACT engine** on Three.js, with the name treated as a working title. Use vanilla JavaScript ES modules. Use Vite for the local server and production build; keep it a toolchain choice, not a UI framework choice.

The engine foundation should provide:

- A base launcher made with HTML, CSS, and JavaScript, runnable locally with `npm run dev` through Vite.
- A visible local-preview warning/status bar when running locally; it must accurately indicate that the build is local and not hosted. Keep the banner out of the gameplay focus area.
- Renderer/canvas creation, scene and top-down camera setup, resize handling, and a stable animation/update loop with bounded delta time.
- Clear lifecycle and game-state hooks, a normalized input-intent boundary, and a simple scene/entity update boundary so later units do not tangle into the launcher.
- A visible startup or renderer error state rather than a blank screen; predictable restart/cleanup behavior.
- A simple renderer-quality config seam that later iterations can use. Keep WebGL as baseline; WebGPU remains optional and is not recommended for the first build.

Keep this foundation to roughly ten minutes of the two-hour budget. It is a thin kernel, not a reusable engine project: do not create a plugin system, entity-component framework, asset pipeline, generalized event bus, or renderer abstraction unless the first gameplay slice needs it. Do not add waves, enemies, weapons, pickups, art downloads, or elaborate UI during this unit. A small test scene or placeholder shape is enough to prove the engine. The engine unit is accepted when it starts locally, renders, resizes, reads a small normalized input intent, handles pause/resume or tab-focus without a giant delta, and can restart without duplicating the canvas or loop.

Once this foundation clears, use individual gameplay iterations such as movement, independent aim/fire, one enemy and collision, wave lifecycle, HUD/health/score, progression, and polish. The exact order after the foundation follows the user's prompts; this list is a suggested decomposition, not permission to implement them all at once.

## Suggested build order and time budget

Use this as an adjustable ceiling, not a promise that every item will fit. Keep a visible timer and protect the submission/testing reserve. If an iteration prompt changes priority, reallocate from polish and optional content first.

| Elapsed budget | Unit | Completion target |
|---|---|---|
| 0–10 min | Bootstrap + ACT kernel | Vite local server, launcher/banner, Three.js canvas/scene/camera, resize and bounded loop |
| 10–20 min | Player movement | Visible ship moves smoothly with WASD, stays in arena, diagonal speed normalized |
| 20–42 min | Aim, fire, one enemy, collisions | Arrow aim + Space fire; projectiles hit one enemy; enemy/player hit rules work and show damage |
| 42–57 min | Run states and HUD | Start, score, health/lives, game over, deterministic restart; on-screen key guide |
| 57–67 min | Waves and rising difficulty | Reproducible wave progression with one clear difficulty increase |
| 67–73 min | Minimum visual identity | Diorama-inspired palette, simple lighting/background, hit feedback; no expensive effects |
| 73–88 min | Browser play-test and fixes | Fresh load, full keyboard loop, restart, resize, console check, performance setting if implemented |
| 88–108 min | Reflection and submission | Actual active minutes, own-word reflection, links/materials, form completion |
| 108–120 min | Contingency | Fix one critical issue or use the time if setup/testing took longer |

The local build is a valid review target if hosting is unavailable. Decide early whether hosting is practical; do not sacrifice the working game, play-test, or form time to configure a new hosting account. Report hosting status honestly.

## Recommended vertical-slice sequence

After the kernel, code in this dependency order unless a user prompt directs otherwise: (1) bounded player movement, (2) independent aim and continuous fire, (3) one enemy with spawn and movement, (4) projectile/enemy and enemy/player collisions with damage feedback, (5) score and health UI, (6) start/game-over/restart, (7) waves and one difficulty ramp. Each slice should leave the previous loop playable. Add a power-up or second enemy only after the core acceptance checklist passes.

For sign-off, keep the department contributions lightweight: each relevant role adds a one-line check/result to the current iteration log. Do not hold meetings or write separate reports.

## Departments and authority

| Department | Owns | Clears by confirming |
|---|---|---|
| Production | Time, stage order, scope, decision log, submission readiness | The stage fits the remaining time and deliverables are explicit |
| Game Design | Core loop, keyboard scheme, wave/enemy rules, score and health feedback | The game is understandable and the core loop is finite/testable |
| Engineering | Three.js structure, game state, controls, combat/collisions, UI states, sound and performance hooks | The stage runs in the target browser and has no unresolved core blocker |
| Art & Audio | Diorama/miniature style, asset sourcing/import, sound, asset provenance | Art supports gameplay and all shipped assets have a recorded license/source |
| QA & Accessibility | Input and feature verification, legibility, browser/console checks, performance mode | The stage's checks were exercised and failures are recorded |
| Release | Run/build instructions, local assets, prompts, final evidence and form readiness | A reviewer can open/play the game and find required supporting material |

One agent may wear more than one role. Department review must still be recorded; do not create extra agents just to satisfy the table.

## Stages

### 0. Kickoff and timebox

**Lead:** Production. **Contributors:** all departments.

- Record start time and the two-hour hard stop in `docs/time-log.md` (create at implementation start).
- Confirm the project is clean and the work is inside this fresh project.
- Lock the core feature list from `game-brief.md`; rank all nice-to-haves below it.
- Choose the smallest viable stack and a single target desktop browser for initial play-test.

**Gate 0 clears when:** Production confirms time remaining is visible; Game Design has a one-sentence core loop and keyboard map; Engineering confirms a minimal Three.js/browser path; Art & Audio confirms an art fallback; QA confirms a short smoke checklist; Release confirms what must be submitted. No feature coding before this gate.

### 1. Engine foundation and greybox playable loop

**Lead:** Engineering. **Contributors:** Game Design, QA, Production.

- First deliver and clear Iteration 0: the ACT engine foundation described above.
- Then, only as the current iteration prompt directs, deliver a small greybox gameplay unit. Keep code runnable and add only the minimum shapes/UI needed to review that unit.
- Do not combine every game requirement into one oversized implementation pass.

**Gate 1 clears when:** the engine foundation acceptance checks pass; for each later greybox iteration, QA confirms that iteration's stated behavior; Engineering leaves a runnable build; Game Design and Production confirm scope is clear and fits remaining time. Repair the current unit before layering new behavior.

### 2. Content and visual identity

**Lead:** Art & Audio and Game Design. **Contributors:** Engineering, Production, QA.

- Add at most a few distinct enemy behaviors/silhouettes, an obstacle or two, and simple wave pacing that increases threat over time.
- Apply the cute miniature/diorama look with restrained low-poly geometry, layered space backdrop, soft lighting, and depth cues. Preserve strong contrast and player/enemy readability; tilt-shift blur is optional and must not blur important gameplay/UI.
- Perform a focused asset pass in approved libraries, download only assets that fill a real gap, and place optimized local copies in the project library with provenance.
- Add concise sound effects or a simple synthesized/MIDI cue only if it can be done without risking the playable build.

**Gate 2 clears when:** Art & Audio signs off the look and records source/license for every downloaded item; Game Design verifies the new content changes difficulty fairly; Engineering verifies all assets load locally and a primitive fallback remains; QA checks that effects do not obscure play; Production confirms required features remain on schedule. Defer optional power-ups, traps, and audio rather than destabilizing the loop.

### 3. Readability, polish, and renderer fallback (if used)

**Lead:** Engineering and QA. **Contributors:** Art & Audio, Game Design, Production.

- Add visual feedback for damage, firing, waves, score, health/lives, and game over. Keep the player and hazards identifiable at a glance.
- Add a visible control legend. If the implementation uses `WebGPURenderer`, add a visible **Performance / CPU Mode** that meaningfully lowers cost (for example, force WebGL where feasible, reduce pixel ratio/particles, and disable blur/shadows); test both modes. With the recommended WebGL-only path, this toggle is optional and should be added only if there is time and a clear benefit.
- `WebGLRenderer` is the baseline. If the implementation uses `WebGPURenderer`, test supported WebGPU and explicitly force/test its WebGL 2 fallback. Do not adopt WebGPU late if it adds startup risk.
- Add gamepad only after keyboard controls and all core gates pass. Show/hide a concise gamepad hint only if detection works.

**Gate 3 clears when:** if WebGPU is used, QA exercises WebGPU and Performance / CPU Mode plus the WebGL fallback, and confirms the low mode lowers cost; Engineering confirms browser startup and renderer initialization have a failure-safe path; Game Design confirms essential information is readable; Art & Audio confirms the visual finish does not undermine clarity; Production approves the scope as complete. Remove any polish that introduces a blocker.

### 4. Play-test and release handoff

**Lead:** QA & Accessibility and Release. **Contributors:** all departments.

- Play the game from a fresh browser load using only keyboard. Verify start, WASD movement, arrow aim, Space fire, enemy spawn/wave change, collisions, score, health/lives, difficulty increase, game over, and restart.
- Verify local assets load without network; inspect console for errors; resize the window once; if a performance mode is implemented, check that it visibly takes effect.
- If time remains, test a connected gamepad and a second browser. Record untested items honestly.
- Capture or record actual prompts used in `prompts/`. Record actual active minutes. Do not generate fake prompt history or ask an agent to write a first-person reflection for the submitter.
- Provide local run/build instructions, hosting link if successfully hosted, and a short known-limitations list.

**Gate 4 clears when:** QA reports each core check pass/fail; Engineering fixes or documents failures; Art & Audio verifies the asset manifest; Production checks the time limit and scope; Release confirms the reviewer-accessible game link (or reports hosting failure) and supporting materials are ready. This is the final gate; no feature work after it.

## Scope priority

1. Core loop and required features.
2. Clear presentation, control instructions, reliable restart, and basic audiovisual feedback.
3. A small number of meaningful enemy/obstacle variants and fair difficulty growth.
4. One or two simple power-ups, only if the core is stable.
5. Gamepad, traps, ambient triggers, WebGPU-specific effects, and extra content.

When time is short, cut from the bottom. Keep the mandatory keyboard/browser/Three.js path.

## Lightweight decision record

For a meaningful change, append a dated note to `docs/decisions.md`: decision, reason, affected stage/gate, and any follow-up. Avoid meeting notes or speculative design branches.
