# Space Attack submission package

This package contains the complete playable project source, a production build, the selected local Kenney Space Kit assets and source archive, project guides, iteration notes, and the preserved prompt files.

## Run

Use Node.js 20.19+ or 22.12+:

```sh
npm install
npm run dev
```

Vite prints the local URL. The app is not hosted; the menu identifies the local preview. To rebuild the static bundle, run `npm run build`.

## Delivery notes

- The game has Asteroid and Legacy modes. The Legacy formation speed caps at twice cannon speed.
- All 20 unit tests pass. The production build succeeds with Vite's advisory that the Three.js bundle exceeds 500 kB minified.
- The Thank You credits include links to Three.js, Vite, and Kenney Space Kit.
- The `prompts/` folder preserves the saved prompts. No reflection was generated; the submitter must write it in their own words.
- No hosted-play URL is included yet. A GitHub Pages Actions workflow is included; push this project to a public GitHub repository and enable **Settings → Pages → GitHub Actions** to publish it. The project path and bundled model URLs are configured for Pages subpaths.
- The published Pages site and public source repository will be accessible to anyone, so check the repository contents before pushing.
- `node_modules/` is excluded; dependencies are declared in `package.json` and `package-lock.json`.
