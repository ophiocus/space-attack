# Space Attack — Game Brief

## Product intent

A compact, polished, single-player browser arcade game inspired by classic space attack games. The player pilots a small ship in a top-down arena and survives increasingly varied waves. The presentation should feel like a cute miniature diorama, while controls and enemy danger stay immediately readable.

The game has two selectable modes on the shared ACT engine. **Asteroid Mode** is the completed twin-stick horde-survival loop. **Legacy Mode** is the fixed-screen formation-defense loop in the Space Invaders family.

### Game modes

- **Asteroid Mode:** WASD moves freely; arrow keys aim; hold Space to fire toward the last aim direction. Root rocks enter with fixed inward velocity and never steer toward the player; broken fragments accelerate to 1.5× speed along new random vectors. Rocks wrap to the opposite screen edge while preserving velocity. Waves spawn A enemies; A splits into two B enemies on impact, B splits into two C enemies, and C ends the chain. Each enemy is a mirrored two-model composite made from large Kenney crystal/rock assets. Split directions follow a closed eight-direction loop with one run-level randomized starting offset. Enemies damage only by contact; there is no Asteroid enemy firing. Waves, scoring, hull, and pickups follow its own rules.
- **Legacy Mode:** A/D or Left/Right moves the cannon horizontally along the ground; holding Space fires at a constant cadence 30% faster than the previous setting, tuned for a 40% hit rate. For a 55-invader wave this projects to about 31.8 seconds of continuous firing. A formation sweeps across the arena, descends on edge reversals, and gains additive haste as invaders are destroyed, capped at twice cannon speed. Every invader shares speed and formation behavior; three locally bundled silhouettes cycle through each formation from one randomized loop offset. Invaders fire slow, sparse downward shots. Locally sourced platform assets form destructible shields that stop and take damage from both shot directions. When an invader touches a shield, the shield crumbles down and immediately leaves active collision; the invader continues advancing. Reaching the cannon line ends the run; destroying a formation starts a faster wave closer to the cannon. Score depends on the invader's row.
- Each mode owns its simulation, combat, scoring, wave, and restart state. The ACT engine, launcher, scene, assets, and common shell/HUD are shared. See [mode-architecture.md](mode-architecture.md) for the current boundary and migration notes.

## Runtime direction

- The **launcher** is a plain HTML/CSS/JavaScript browser shell that runs locally and displays an accurate local-preview warning/status bar while it is not hosted.
- Delivery renderer scope: desktop browsers with Three.js `WebGLRenderer` and WebGL2 GPU acceleration. The user-facing Performance mode lowers pixel ratio and bypasses tilt-shift post-processing; there is no separate CPU software-renderer backend.
- The game runtime is the **ACT engine** (working title), built on Three.js. Start with vanilla JavaScript ES modules; another framework requires a concrete need or a user iteration prompt.
- The first implementation unit was the engine foundation: boot, render, resize, bounded update loop, lifecycle/restart, visible startup failure handling, and a performance-setting seam. That foundation is now integrated with the first playable keyboard shooter slice. Continue adding discrete, user-steered gameplay units and preserve the local-first browser workflow.

## Required playable experience

- Desktop browser game implemented with Three.js.
- Top-down playfield and a single player ship.
- Start menu allows choosing either Asteroid Mode or Legacy Mode and shows the selected mode's controls.
- Asteroid keyboard scheme: `WASD` moves, arrow keys independently aim (including diagonal combinations), and holding `Space` fires in the last selected aim direction (default up). Legacy keyboard scheme: `A/D` or `Left/Right` moves horizontally, and `Space` fires upward. Show the selected mapping on the start screen and HUD.
- Enemies arrive in waves. At least one enemy pursues or attacks the player; collision and damage rules are visible/understandable.
- Player weapons can hit enemies; enemies and/or hazards can damage the player.
- Visible score and health or lives; score changes on defeat, health changes on damage.
- Threat rises over time through wave size, spawn cadence, enemy speed, or a carefully tuned mix. Communicate the wave number.
- Start screen, game-over state, and restart path. Restart resets run score, health, enemies, timers, and wave state.

## Stretch goals

- Distinct enemy and obstacle types that change the player's choices.
- A small set of contextual power-ups (for example, repair, temporary shield, or faster shot). Communicate pickup and expiry clearly.
- High score persisted locally, with clear labeling as local/browser high score.
- Ambient triggers or enemy traps that are visible, optional, and fair.
- Gamepad support with an on-screen hint when detected. Keyboard remains fully usable.
- Music or synthesized MIDI-like backing plus a few short local sound samples; mute/volume control if audio is present.

## Abridged landing menu

Keep the first screen short and launch-focused:

- Game title: **SPACE ATTACK** with the miniature-space visual identity.
- One-line premise: survive the incoming waves; avoid a long story setup.
- One primary action: **Start Run**.
- A compact **How to Play** key guide visible on the menu: `WASD` move, arrow keys aim, hold `Space` to fire in the last aim direction.
- Best score only if local high-score persistence is implemented; label it as a local record.
- Keep the local-preview banner in the launcher shell, outside the game HUD. It should say the build is local/not hosted while served locally.

Do not add account, profile, store, or multi-screen setup flows. Starting a run should be one obvious action.

## HUD and game-state UI

Keep the HUD anchored to the playfield edges and leave the center clear for combat. Labels must accompany icons/bars; use shape and text as well as color to convey meaning.

| Position | Required item | Behavior |
|---|---|---|
| Top left | **Score** | Current run score, updated immediately on enemy defeat. Show local best score in a smaller secondary label only if persistence is implemented. |
| Top center | **Wave** | Current wave number and a short state such as “Wave 03” or “Incoming”; optionally show enemies remaining/countdown when it helps explain pacing. |
| Top right | **Pause** | Keyboard-accessible button; pauses simulation and opens a compact overlay with Resume and Restart. |
| Bottom left | **Hull / lives** | A labeled health bar with numeric current/max health, plus distinct life pips if the game uses multiple lives. Damage visibly reduces health and gives brief feedback/invulnerability indication. |
| Bottom right | **Weapon** | Weapon name/type and a concise ready/recharging cue. Show a power-up icon/timer only while an effect is active; omit empty inventory slots. |
| Center, transient | **Combat notice** | Brief wave-start, pickup, or damage notice; auto-clears and never hides the player or a threat for long. |
| Lower safe edge | **Controls hint** | Compact `WASD Move · Arrows Aim · Space Fire`, visible during play without obscuring hazards. |

The game-over overlay should show final score, wave reached, local-best result if available, and a single **Play Again** action; a small **Menu** action is secondary. Restart resets health, score, enemies, projectiles, wave timers, active effects, and temporary UI notices. If audio exists, expose mute in the menu/pause overlay. Do not show sound controls when there is no sound.

The local-preview banner is launcher status, not an in-game score/status widget. Keep it visible in local previews but visually distinct and outside the center of the arena.

## Camera and art direction

- Orthographic or near-orthographic camera, looking down at a defined arena plane. The playable area should remain visible on common desktop aspect ratios.
- Diorama/tilt-shift inspiration: miniature scale cues, compact low-poly models, soft but directional lighting, restrained depth of field only around the outer edge, and a composed background.
- Keep the center play area sharp. Never apply blur over enemies, projectiles, player, HUD, or control text.
- Use color, silhouette, and animation to distinguish player, enemies, shots, pickups, and damage. Do not rely on color alone.
- Source all visible ship, enemy, obstacle, and environment art from the asset hunt and bundle it locally. Procedural geometry may be used only for functional transient effects (such as simple projectiles) or non-art collision logic, not as a substitute for sourced game-world art.

### Approved visual boundary

The approved mockup is a layout reference for HUD and the abridged landing menu only. It is not a visual reference for the playable world's palette, models, lighting, typography, or decorative effects. Derive all in-world visuals from the asset hunt and the acquired assets, with documented provenance. Use Three.js only to place, light, and animate those sourced assets.

## Rules and feel

- Controls must be responsive and consistent across keyboard layouts where practical. Avoid browser scrolling for gameplay keys while the game has focus.
- Use delta time for motion and clamp unusually large frame deltas after tab suspension.
- Define clear hitboxes. Feedback should make hits and player damage evident.
- Keep a brief invulnerability window or equivalent grace after damage to avoid instant repeated hits; signal it visually.
- Scale difficulty gradually and cap spawns/particles so long runs cannot flood the scene.
- Support pause or safe focus-loss behavior if time allows; prevent invisible play while the tab is backgrounded.
- Audio starts only after user interaction and respects browser autoplay rules.

## Acceptance checklist

- [ ] Abridged landing menu shows Start Run and the `WASD` / arrows / `Space` control guide.
- [ ] Landing menu lets the player select either mode, and shows that mode's controls.
- [ ] HUD shows score, wave, hull health/lives, pause, weapon state, and a non-obstructive controls hint.
- [ ] Keyboard movement works in all directions.
- [ ] Keyboard firing/aiming works independently of movement.
- [ ] Legacy cannon moves horizontally and fires upward; its formation advances, descends at edges, and escalates as it thins.
- [ ] Legacy invader fire is blocked by destructible locally sourced shield tiles, and enemy/player shots both damage them.
- [ ] Waves spawn, change, and get more challenging.
- [ ] Player shots collide with enemies and affect score.
- [ ] Enemy/hazard contact affects health/lives and shows feedback.
- [ ] Score and health/lives remain visible during play.
- [ ] Game-over occurs and restart produces a clean new run.
- [ ] Core play functions without external network asset requests.
- [ ] Performance mode visibly offers a lower-cost rendering path/settings.
- [ ] No severe console errors on fresh load.
- [ ] Local run instructions and asset/license provenance are present.
