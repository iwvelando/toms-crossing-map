# Tom’s Crossing — an unofficial fan atlas

A chapter-based tabletop atlas of **Tom’s Crossing by Mark Z. Danielewski**. Explore a carved landscape, follow a character’s movements, and read a short journal alongside the map. The current atlas covers the supplied movement data through part of Chapter Sixteen, with separate character and companion journals. The final chapter remains partial.

This is an independent fan interpretation, not an official map. It is not affiliated with, endorsed by, or sponsored by the author or publisher. The original novel and its characters and settings are © Mark Z. Danielewski. All rights reserved. The website contains original summaries and illustrative geometry, not excerpts from the novel or audiobook recordings.

The atlas is being built from one reader’s audiobook listening. Character and place spellings are taken from audio rather than printed text and will be refined as the project develops.

## Explore

[Open the deployed atlas](https://toms-crossing-map.isaacvelando.com/).

Choose the chapter you’ve finished, then select a journal entry or use the previous/next buttons. Drag to orbit, **Shift-drag or right-drag to pan**, and scroll to zoom. On touch screens, use one finger to orbit and two fingers to pan or zoom. Keyboard users can focus the map and use arrows to rotate, Shift + arrows to pan, +/− to zoom, and Home to reset.

All dropdown menus share the atlas styling and support arrows, Home/End, type-ahead, Enter/Space to confirm, and Escape to cancel. Exploring an option does not reveal its content until you confirm it. Select a journal layer, then a character or companion. Character options show entry counts and put matching people first; selecting Dreams takes you directly to a participant with dream entries. The followed character’s selected entry is always visible. Earlier accounts, plans, spectral events and dreams remain distinct. Choosing “Before Chapter One” removes all story labels and journal entries. The reading limit, selected character and entry, journal layer, comparison choices, location-label setting, legend visibility, board layout, map camera and journal disclosure panel are saved in this browser and restored automatically on reload. A new browser or invalid saved state starts before Chapter One. Selecting “Before Chapter One” also saves the closed boundary. URL parameters cannot advance it.

Choose **Compare paths in this chapter** to select any set of participants, or use **Show everyone**. Comparison covers only the chapter at the reading limit and the chosen layer. Matching route colors, distinct piece shapes, and numbered badges identify participants; the optional **Character legend** below the board opens their journals. Its full rows wrap without covering the scene. Location names are optional in comparison. Use **Expand map width** for a wider board. In both modes, the selected journal entry’s route and piece are fully opaque, while that character’s earlier routes and mapped positions stay visible at 60% opacity. Entry mode retains history through the selected entry; comparison limits history to the chosen chapter. Other comparison entries stay at 22% opacity. Repeated historical positions are combined, and separate routes are never joined across unobserved gaps. These marks do not imply simultaneous or continuous presence. Different characters’ journals do not share a synchronized timeline. The selected entry has a target marker and numbered Journal badge at its own mapped location. The marker pulses briefly, with a still marker for reduced-motion preferences. Unlocated entries remain journal-only. Previous/next controls stay in the journal above the entry text. Map tools sit outside the visualization; the scene has no navigation panel or heading overlay. The dark, starry setting and taller carved mountain ranges remain illustrative.

The theme follows your system by default. Use the **Light / Dark** button to switch and save a preference, or **Auto** to follow the system again. Both the interface and the tabletop lighting change with the theme. Blocked or full local storage leaves the atlas usable for the current visit.

## Run locally

Requires Node.js 22.12 or later and Make.

```sh
make setup
make dev
```

`make dev` opens your local browser and reloads changes as you edit. For a production preview with the site's CSP, use `make preview`; it rebuilds first and opens the browser. Both servers bind to localhost; stop them with Ctrl-C. Pass Vite options with, for example, `make dev ARGS="--port 5174"`. Run `make help` (or just `make`) for all targets. The existing npm commands remain available without Make.

The map requires WebGL; the journal remains available if 3D rendering fails. There are no accounts, analytics, external fonts, or runtime content services.

```sh
make check
make browsers
make test-browser
make test-webkit
```

Browser tests build and serve the production site under its intended Content Security Policy (CSP), including desktop and phone layouts. `PLAYWRIGHT_CHROMIUM_EXECUTABLE` can point to an existing Chromium executable when using a locally managed browser installation.

Exhaustive checks derive their cases from the public chapter catalog and visit at most 20 entries per case. New content adds cases without expanding a single test's timeout. CI distributes Chromium/phone cases across four shards and WebKit cases across two; every shard must pass the required verification check. Chapter boundary cases visit newly disclosed entries, while participant cases cover every entry at the current maximum boundary.

## Interpretation and scope

The board is schematic. Coordinates, elevation, decorative trees/buildings, distances, and precise path bends are artistic staging. Lines communicate narrated order within each separate entry; colors identify participants, while the journal states each entry’s classification. Plans and dreams do not draw completed paths. The journal explains uncertainties. Numbered pieces use individual colors and five abstract shapes, with the numbers distinguishing larger casts. Every piece uses the same geometric base and stem with a distinct head. They are symbolic game pieces, not depictions of characters’ appearances.

`src/chapters/` contains reviewed, reader-facing paraphrases in separate chapter payloads. `src/story.js` projects only the selected disclosure boundary; `src/chapters.js` loads payloads after explicit chapter selection. Private research, transcripts, timing references, and working notes must remain outside published source and production assets. The root scratch files and private evidence notes are ignored; `npm test` checks that they are absent from the public candidate file set, including accidentally staged files. Do not force-add ignored research files.

## Updating the atlas as you read

Copy the current `movements.md` and `metadata.json` into the repository root, then ask an agent to update from those two files using [the repo skill](skills/update-atlas/SKILL.md). They remain private and ignored. **No other book sources are authorized**, including linked transcripts, other repositories, or web research.

`npm run atlas:check` compares the local snapshot with reviewed coverage. When everything is accounted for, the agent stops without editing the site or regenerating assets. New rows, corrections, changed scope, and partial/blocked work are reported separately. A reviewed snapshot covers the supplied claims, including their stated uncertainty; it does not certify missing information or completion of the partial final chapter.

See [the source-update guide](docs/source-updates.md) for commands and the append/correction workflow. Public CI uses synthetic fixtures and never needs the private source files.

## Assets and Git

The original `public/models/kalin-pawn.glb` and its Blender recipe, `scripts/create-pawn.py`, are retained as design assets. The runtime now builds every character piece from consistent local Three.js geometry and makes no model downloads. Keep the small GLB in ordinary Git; no Git Large File Storage (LFS) or Blender installation is needed. Keep `dist/`, dependencies, test output, and generated notices ignored. Commit `package-lock.json`.

## Hosting

`npm run build` produces a self-contained `dist/` directory. The Amazon S3 (Simple Storage Service) and CloudFront deployment uploads **only its contents**, with `index.html` as the default root object. No backend or client-side route fallback is required. Relative asset URLs support subdirectory hosting.

The structure follows the companion Shelf Life project’s static-site conventions: local assets, generated dependency notices, distribution checks, and browser tests under the intended CSP. `deploy/content-security-policy.txt` contains that policy; `npm run preview` sends it as a response header. Inline style attributes are permitted for positioning 3D labels, but inline scripts are not.

Use short/no-cache headers for HTML and stable filenames such as `models/kalin-pawn.glb`; use long immutable caching for hashed `assets/`. Upload new assets before the new HTML and preserve assets still used by open pages. Serve GLB as `model/gltf-binary` and use HTTPS. Hosting infrastructure is defined in `iwvelando/cloud-accounts` at `sites/toms-crossing-map.isaacvelando.com`. The Verify workflow checks the production build in Chromium and WebKit before deploying from `main` through the main-only `production` environment. Infrastructure has been applied and the workflow uses distribution `E262JGOFD733DT`. The public repository has a main-only production environment; merging a verified PR publishes its changes. See [the launch checklist](docs/launch.md).

The site’s software is MIT licensed; builds include `LICENSE.txt` and `THIRD-PARTY-NOTICES.txt` for Three.js and Vite’s generated runtime helper. These software licenses do not grant rights to the novel or its characters and settings.

See [the architecture notes](docs/architecture.md) for the disclosure contract and extension points.

Link previews use the same title and description as the page, plus a composed dark card of the atlas’s art. Canonical and preview URLs point to `https://toms-crossing-map.isaacvelando.com/`. Run `npm run build && npm run share-card` to regenerate `public/og-image.png` and `public/apple-touch-icon.png`; inspect and commit both. The card contains no revealed story labels.
