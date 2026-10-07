# Decision Log

Record only decisions that affect scope, architecture, assets, or a stage gate.

| Date | Decision | Reason | Gate / follow-up |
|---|---|---|---|
| 2026-10-07 | Use Three.js with WebGL as the initial baseline; treat WebGPU as optional and require an explicit low-cost mode if used. | Browser compatibility and the fixed two-hour production cap. | Architecture / verify renderer path and performance setting during QA. |
| 2026-10-07 | Start with no downloaded art; add only a small, locally bundled, verified asset subset if it saves time or materially improves the game. | Workspace is a fresh project; a cohesive procedural style is a valid fallback. | Content gate / record any acquired item in `asset-manifest.md`. |
| 2026-10-07 | Use plain HTML/CSS/JavaScript for the local launcher and vanilla JS ES modules around Three.js for the ACT engine working title. Deliver the engine foundation as the first complete unit; let later user prompts steer individual feature slices. | Keeps the local browser shell simple and makes each iteration runnable and reviewable within the timebox. | Iteration 0 / implement and clear the engine foundation before gameplay content. |
| 2026-10-07 | Use Vite for local development and static build, with no UI framework; use WASD to move, arrows to aim, and Space to fire in the last aim direction. Prefer WebGL for the two-hour build; require Performance / CPU Mode only if WebGPU is used. | Makes Three.js package imports and local browser launch straightforward while keeping controls and renderer behavior testable. | Bootstrap / verify `npm run dev`; QA checks the chosen renderer path. |
| 2026-10-07 | Add Legacy as an independent mode controller over the existing ACT engine; keep Asteroid behavior isolated from Legacy state and simulation. Defer moving the existing Asteroid implementation out of `main.js` until the Legacy hands-on check clears. | Preserves the approved playable mode and limits refactor risk while introducing a substantially different formation, weapon, and shield loop. | Mode architecture / both menu paths and lifecycle cleanup; see `mode-architecture.md`. |
