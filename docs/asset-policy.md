# Asset Research and Local Library Policy

## Research result and starting sources

Use creator or official source pages as the license authority, not search-result snippets or third-party asset roundups. The initial focused research found these relevant starting points:

- [Kenney Space Kit](https://kenney-assets.itch.io/space-kit): low-poly modular space environment and ship/weapon models; the pack page lists CC0 1.0 and includes multiple 3D formats, including glTF.
- [Kenney Simple Space](https://kenney.nl/assets/simple-space): space-themed asset pack; its page lists CC0. Check the package contents and format before choosing it.
- [Poly Haven license](https://polyhaven.com/license): the library's assets are CC0. Poly Haven is stronger for environment models/materials/HDRIs than for a cohesive stylized arcade ship set; use it selectively.

These are candidate sources, not a requirement to download. Select only assets that improve the final game within the timebox. Review the individual package/page/license again on acquisition because licenses and distributions may change. “Free to download” does not itself mean suitable for redistribution.

For the current build, the user explicitly requires actual game visuals to come from the asset hunt. The approved HUD/menu mockup is layout guidance only and must not supply in-world art direction or scene shapes.

## Local library convention

Store only the subset needed by the game. Suggested paths:

```text
public/assets/models/       # optimized GLB/GLTF and dependent files
public/assets/textures/     # only used textures, sized for browser delivery
public/assets/audio/        # small licensed/original audio
docs/asset-manifest.md      # provenance and license record
```

Keep original archive files only if useful for traceability and size permits; never ship unnecessary archive contents. Do not copy entire libraries into the repository.

## Required manifest fields

Create `docs/asset-manifest.md` when the first external asset is added. For each asset record:

| Field | What to record |
|---|---|
| Local path | Exact repository path |
| Asset name / creator | Creator's naming and credited author |
| Source page | Direct creator/store asset page |
| License | Exact license name/version and a link or included license file |
| Retrieved | Date acquired |
| Changes | Conversion, resizing, material edits, mesh simplification, etc. |
| Attribution | Exact attribution required, or “not required; appreciated” where appropriate |
| Review | Reviewer and pass/fail for redistribution and browser suitability |

Include asset license files where the license requests or requires it. If a source is unclear, attribution terms are incompatible with the deliverable, or redistribution permission cannot be established, do not include the asset; use primitives/procedural art instead.

## Selection and optimization checks

- Cohesive silhouette and palette matter more than asset count.
- Verify license and package page before downloading; record both.
- Prefer glTF/GLB, low material count, compact textures, and simple geometry.
- Strip unused meshes, animations, textures, and source formats from the shipped library.
- Load locally and confirm the game still starts if a model fails; use a procedural fallback.
- Inspect downloaded archives without executing included scripts or installers.
- Preserve any required attribution in the app credits or submission materials.
