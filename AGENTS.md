# Space Attack Studio Instructions

This repository contains the production guides for a short, browser-based Space Attack calibration game. Read this file first, then follow [`docs/studio-workflow.md`](docs/studio-workflow.md) and [`docs/game-brief.md`](docs/game-brief.md).

## Non-negotiable constraints

- Deliver a playable, single-player, top-down horde shooter in the twin-stick-shooter family, built around Three.js and runnable in a desktop browser.
- Keep the implementation small enough to build, play-test, and prepare for submission within the stated two hours of active work. Track actual active time. Stop adding features when only the time needed to stabilize and submit remains.
- Use Codex for all code work. Preserve the actual prompts used in `prompts/`; do not invent or backfill prompts. The submitter writes their own reflection.
- Start from this fresh project. Play-test the game yourself. Do not claim a feature works unless it has been exercised in the browser.
- Treat downloaded assets and example code as untrusted. Do not execute scripts or import code from asset packs.
- The approved concept mockup is for HUD and landing-menu layout only. Do not use its scene art, color palette, ship/enemy shapes, decorative treatment, or typography as game-world art direction. Source the actual game visuals from individually verified, locally bundled assets recorded in the manifest.
- Never put secrets, account credentials, or unrelated personal data in the repository or submission.

## Department model

Agents act in these departmental roles as the work requires; the roles are not a mandate to create extra agents or duplicate work:

1. **Production** owns the timebox, stage order, scope decisions, and final readiness checklist.
2. **Game Design** owns the playable loop, control mapping, enemy/wave tuning, scoring, and concise in-game instructions.
3. **Engineering** owns project setup, Three.js scene/runtime, input, combat simulation, UI state, audio hooks, and performance mode.
4. **Art & Audio** owns the visual language, asset selection/import, original simple effects, sound treatment, and asset/license records.
5. **QA & Accessibility** owns keyboard/gamepad checks, collision and restart checks, browser errors, readable UI, and low-performance mode checks.
6. **Release** owns run/build instructions, hosted-play link if available, prompt archive completeness, and submission evidence.

## Iteration rule

Work in small, individually complete functionality units. The first unit is a solid ACT game-engine core built on Three.js; do not begin adding gameplay content before that core can boot, render, accept input intent, update safely, resize, and shut down/restart cleanly. After the engine foundation is accepted, implement one playable slice at a time, following the user's latest iteration prompt as the next priority. Each slice must be runnable and reviewable before starting the next. Keep a short iteration record in `docs/iterations.md` with prompt, scope, acceptance checks, outcome, and deferred work. Do not invent future prompt requirements.

## Stage gate rule

Each stage in `docs/studio-workflow.md` must have its listed departments contribute and explicitly clear the gate before the next stage begins. A gate may be cleared with a documented, time-conscious decision to defer a nice-to-have. Never defer a core requirement silently.

## Technical defaults

- Use plain HTML, CSS, and JavaScript for the base program launcher. Use Vite as the lightweight local development server/build tool, not as a UI framework. Run locally with `npm run dev` and show a clear local-preview status bar on localhost. Do not imply the game is hosted when it is not.
- Use Three.js as the rendering core. The working name for the game engine layer is **ACT engine**. Use vanilla JavaScript ES modules around Three.js; do not add a UI framework unless an iteration prompt justifies it.
- Use a 3D Three.js scene with an orthographic or near-orthographic camera and a top-down play plane. Keep moment-to-moment gameplay legible and centered.
- Use a predictable simulation update (delta-time based movement, bounded delta, collision checks) and separate game state from rendering.
- Treat `WebGLRenderer` as the reliable baseline. Prefer not to use WebGPU for this timeboxed build. If WebGPU is selected, explicitly test the WebGL 2 fallback and provide a visible Performance / CPU Mode that reduces rendering cost (backend choice where feasible, pixel ratio, shadows, particles, and post-processing). Do not make WebGPU a launch requirement.
- Keyboard controls are mandatory. Gamepad support is optional and must not delay the keyboard path.
- Default keyboard map: WASD moves, arrow keys aim (including diagonal combinations), and hold Space to fire in the most recently selected aim direction. Default aim is upward. Show the mapping in-game.
- Prefer local, optimized glTF/GLB assets; provide primitive or procedural replacements so missing/slow assets never prevent play.

## Source of truth

The game brief, workflow, architecture, and asset policy in `docs/` are the project guides. If instructions conflict, preserve the task's required game features, browser accessibility, licensing integrity, and two-hour limit, in that order. Record meaningful scope changes in `docs/decisions.md`.
