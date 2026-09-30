# Tom’s Crossing — an unofficial fan atlas

A chapter-based tabletop atlas of **Tom’s Crossing by Mark Z. Danielewski**. Explore a carved landscape, follow a character’s movements, and read a short journal alongside the map. The current atlas covers one character’s first three movements in Chapter One.

This is an independent fan interpretation, not an official map. It is not affiliated with, endorsed by, or sponsored by the author or publisher. The original novel and its characters and settings are © Mark Z. Danielewski. All rights reserved. The website contains original summaries and illustrative geometry, not excerpts from the novel or audiobook recordings.

The atlas is being built from one reader’s audiobook listening. Character and place spellings are taken from audio rather than printed text and will be refined as the project develops.

## Explore

Choose the chapter you’ve finished, then select a journal entry or use the previous/next buttons. Drag to orbit, **Shift-drag or right-drag to pan**, and scroll to zoom. On touch screens, use one finger to orbit and two fingers to pan or zoom. Keyboard users can focus the map and use arrows to rotate, Shift + arrows to pan, +/− to zoom, and Home to reset.

The chapter menu supports arrows, Home/End, first-letter navigation, Enter/Space to confirm, and Escape to cancel. Exploring an option does not reveal its content until you confirm it. The character button hides or shows the route. Choosing “Before Chapter One” removes all story labels and journal entries. Every reload starts with this boundary closed.

## Run locally

Requires Node.js 22.12 or later.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. The map requires WebGL; the journal remains available if 3D rendering fails. There are no accounts, analytics, external fonts, or runtime content services.

```sh
npm test
npm run build
npx playwright install chromium
npm run test:browser
npm run preview
```

Browser tests build and serve the production site under its intended Content Security Policy (CSP), including desktop and phone layouts. `PLAYWRIGHT_CHROMIUM_EXECUTABLE` can point to an existing Chromium executable when using a locally managed browser installation.

## Interpretation and scope

The board is schematic. Coordinates, elevation, decorative trees/buildings, distances, and precise path bends are artistic staging. Gold lines communicate journey order. The journal explains uncertainties. The pawn is a symbolic game piece, not a depiction of the character’s appearance.

`src/story.js` contains only reviewed, reader-facing chapter data. Private research, transcripts, timing references, and working notes must remain outside published source and production assets. The root scratch files and private evidence notes are ignored; `npm test` checks that they are absent from the public candidate file set, including accidentally staged files. Do not force-add ignored research files.

## Assets and Git

Commit `public/models/kalin-pawn.glb` with ordinary Git: it is approximately 76 KB and does not need Git Large File Storage (LFS). `.gitattributes` marks GLB files as binary. The editable Blender recipe is `scripts/create-pawn.py`; no Blender installation is needed to build the site from the committed model. Keep `dist/`, dependencies, test output, and generated notices ignored. Commit `package-lock.json`.

## Hosting

`npm run build` produces a self-contained `dist/` directory. The Amazon S3 (Simple Storage Service) and CloudFront deployment uploads **only its contents**, with `index.html` as the default root object. No backend or client-side route fallback is required. Relative asset URLs support subdirectory hosting.

The structure follows the companion Shelf Life project’s static-site conventions: local assets, generated dependency notices, distribution checks, and browser tests under the intended CSP. `deploy/content-security-policy.txt` contains that policy; `npm run preview` sends it as a response header. Inline style attributes are permitted for positioning 3D labels, but inline scripts are not.

Use short/no-cache headers for HTML and stable filenames such as `models/kalin-pawn.glb`; use long immutable caching for hashed `assets/`. Upload new assets before the new HTML and preserve assets still used by open pages. Serve GLB as `model/gltf-binary` and use HTTPS. Hosting infrastructure is defined in `iwvelando/cloud-accounts` at `sites/toms-crossing-map.isaacvelando.com`. The Verify workflow checks the production build in Chromium and WebKit before deploying from `main` through the main-only `production` environment. Infrastructure has been applied and the workflow uses distribution `E262JGOFD733DT`. The public repository has a main-only production environment; merging the verified launch PR publishes its first content. See [the launch checklist](docs/launch.md).

The site’s software is MIT licensed; builds include `LICENSE.txt` and `THIRD-PARTY-NOTICES.txt` for Three.js and Vite’s generated runtime helper. These software licenses do not grant rights to the novel or its characters and settings.

See [the architecture notes](docs/architecture.md) for the disclosure contract and extension points.

Link previews use the same title and description as the page, plus a composed dark card of the atlas’s art. Canonical and preview URLs point to `https://toms-crossing-map.isaacvelando.com/`. Run `npm run build && npm run share-card` to regenerate `public/og-image.png` and `public/apple-touch-icon.png`; inspect and commit both. The card contains no revealed story labels.
