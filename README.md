# Space Attack

A local-first, single-player top-down arcade shooter built with Three.js and vanilla JavaScript. The ACT engine layer runs on WebGL; the launcher displays a status banner when served locally.

## Run locally

Requirements: Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://127.0.0.1:5173/`). Create a static production bundle with `npm run build`; Vite writes it to `dist/`.

## Publish on GitHub Pages

The repository includes a GitHub Actions workflow that runs the unit tests, builds the Vite app, and deploys `dist/` to GitHub Pages whenever `main` is pushed. It sets the Vite base path for repository subpaths and the model loader uses that base for local assets.

1. Create a **public** GitHub repository (GitHub Free supports Pages for public repositories).
2. Add it as this repository's `origin` remote and push the `main` branch. Push the project files, not `node_modules/` or the generated submission ZIP.
3. In GitHub, open the repository's **Settings → Pages** and select **GitHub Actions** as the build and deployment source.
4. Open the **Actions** tab and wait for “Deploy Space Attack to GitHub Pages” to complete. The run shows the playable Pages URL.

The deployed site and source repository are public, so review the files before pushing. Do not add credentials or private data.

## Controls

**Asteroid Mode**

- **WASD:** move
- **Arrow keys:** aim independently (diagonals supported)
- **Hold Space:** fire in the last aim direction

**Legacy Mode**

- **A/D or Left/Right:** move the cannon horizontally
- **Space:** fire upward, one shot at a time

- **Esc:** pause/resume
- **F3:** toggle exact player, enemy, and obstacle collision outlines (Asteroid Mode)

Use the on-screen Pause button as an alternative to Escape.

## Current game loop

**Asteroid Mode:** Survive horde waves, shoot to score, collect occasional crystal repair drops, and preserve hull across three lives. Mirrored two-model crystal/rock composites follow a split chain: A becomes two B, and each B becomes two C. Enemies damage only by contact. Later waves can enter from any edge and grow in size and speed. Decorative arena props are visual-only. Best score persists in this browser's local storage.

**Legacy Mode:** Hold a horizontal lane against five-row Space Invaders-style formations. Alien and astronaut silhouettes share one formation speed and behavior. The formation reverses and descends at arena edges; additive haste rises as invaders are defeated and caps at twice cannon speed. Invaders fire slow, sparse shots. Sourced local platform models form destructible shields that stop both upward and downward rounds. Clear formations for row-based points and faster waves; an invasion at the cannon line ends the run. Best score is saved separately per mode.

The diorama focus-band / tilt-shift effect uses a Three.js post-processing shader in the WebGL GPU renderer. The menu's Performance mode bypasses that pass and lowers pixel ratio. Delivery targets desktop browsers with WebGL2; no separate CPU software-renderer fallback is provided.

Short synthesized fire, hit, and damage tones start after the player begins a run. If Web Audio is unavailable or blocked, gameplay continues silently. The game-over screen offers a Thank You credits scroller with asset and framework links, contributor placeholders, and a gingerbread recipe.

## Assets

The in-world player, enemy, obstacle, terrain, and repair pickup models come from the locally bundled Kenney Space Kit. License and use notes are in [docs/asset-manifest.md](docs/asset-manifest.md); the original asset archive and license are retained in `asset-source/` and `public/assets/`.

## Project guides

Start with [AGENTS.md](AGENTS.md), [docs/studio-workflow.md](docs/studio-workflow.md), [docs/game-brief.md](docs/game-brief.md), and [docs/architecture-guide.md](docs/architecture-guide.md). Implementation prompts and actual play-test/time notes are in `prompts/` and `docs/`.

The production bundle currently emits Vite's advisory about the Three.js JavaScript chunk exceeding 500 kB minified. The Asteroid behavior still lives in the app shell; the mode architecture guide records its extraction boundary.
