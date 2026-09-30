# Implementation and expansion contract

## Small static application

- `src/story.js`: explicit curated projection, location reveal boundaries, and pure `getView` function. No runtime parsing of private working sources.
- `src/chapter-picker.js`: accessible select-only combobox. Keyboard exploration does not change the reading limit; explicit selection commits it.
- `src/main.js`: reading limit, selected movement, selected character, journal rendering, and accessible controls.
- `src/map.js`: Three.js orthographic scene, OrbitControls, stacked contour terrain, scene labels, evidence-ordered paths, and Blender pawn loading. Decorative geometry is schematic.
- `scripts/create-pawn.py`: non-destructive Blender asset recipe. Set `EXPORT_PATH` to export elsewhere; it restores prior selection and retains existing scene objects.
- `scripts/check-dist.mjs`: prevents obvious private source files, audio, absolute local paths, and runtime font/CDN dependencies from entering the production output.
- Tests cover closed disclosure boundaries, backwards movement, location resolution, chapter-only public data, browser controls, responsive layout, and journal fallback without WebGL.

## Disclosure is different from story time

Gate on when a claim is disclosed, not when the event supposedly happened. A recollection of an earlier event revealed in Chapter Eight must not become visible at a Chapter One boundary. Preserve `chapter` (disclosure), story time, classification, and attribution independently when expanding the schema. Exact source intervals belong in private research, not the public chapter data.

Every projected field must be valid at its disclosure boundary: names, labels, summaries, companions, routes, destinations, status, and chapter references. Do not expose future chapter titles in the limit selector. Geometry revealing a future named site needs its own disclosure boundary. Keep retrospective interpretations in separate records rather than overwriting early descriptions.

`getView` controls visible journal records, map labels, revealed landmarks, and traversed paths together. Backtracking rebuilds dynamic layers and clears old text. All reading state intentionally resets on reload; URL parameters cannot unlock content. Selection is a visibility control, not authorization.

The production bundle currently contains only the early curated sample. The chapter selector prevents accidental UI disclosure; it is not access control against someone inspecting downloaded JavaScript. When expanding, load separate chapter data only after explicit selection and retain a build-time maximum disclosure ceiling. Never ship the complete ledger by default, even if the UI initially hides it.

## Next implementation slices

1. Refine the schematic layout and marker scale while preserving the distinction between narrated relationships and invented geography.
2. Use the coverage reconciliation workflow in `docs/source-updates.md`; implement missing records with per-field disclosure provenance and a reviewed export allowlist.
3. Add characters as separate routes; preserve living travel, presence, reports, plans, recollections, and spectral layers as distinct classifications. The current atlas implements only one character’s travel.
4. Extend the evidence-approved geography with stable layout coordinates, source-supported relative constraints, and conflict notes. Coordinates must remain labeled as invented until evidence supports them.
5. Add chapter-level lazy loading and tests using synthetic future records to guard against mixed-disclosure summaries and place names.
6. Publish through the existing verified PR/CI workflow. Review the actual output inventory before each release.

## Known limitations

This sample stops partway through Chapter One and does not implement the entire chapter. The reading selector offers only before/through Chapter One. Selecting an entry shows the completed movement; it does not animate exact travel or imply continuous presence afterward. Routes are illustrative connectors, not surveyed tracks. Pawn selection focuses the current entry; character isolation is also available through the keyboard-accessible journal button. No saved reading progress, audio playback, geographic coordinates, or backend exists.

For many characters, replace per-object repeated meshes with instancing, add label collision handling, and retain rendering on demand. The renderer redraws on camera, resize, story, asset, and context-restoration changes; controls keep requesting frames only while damping moves the camera. Dynamic geometry is disposed when entries change; materials are shared. The asset loader retains a primitive brass fallback if the GLB cannot load. A WebGL initialization failure leaves the journal available.

## Public source and distribution

Scratch sources and private evidence notes are ignored and checked by `scripts/check-public.mjs`. Neither source data nor client bundles contain audiobook replay anchors. Use stable, descriptive event IDs in the public projection and maintain source mappings privately. The build must succeed without the ignored files present.

`build-notices.mjs` generates full software dependency notices. The intended Content Security Policy lives in `deploy/content-security-policy.txt`, and Vite preview serves it so browser tests exercise the production restrictions. The Verify workflow gates deployment on production build, release audit, Chromium, and iPhone WebKit checks. Infrastructure lives in `iwvelando/cloud-accounts`; deployment uses GitHub OIDC rather than stored AWS credentials.

The footer credits Mark Z. Danielewski, reserves the rights to the original novel, and identifies the project as an unaffiliated fan interpretation. Do not represent attribution as permission, or extend a software license to the novel.

## Source synchronization

`AGENTS.md` establishes the two-file book-source boundary and routes content updates to `skills/update-atlas/SKILL.md`. `scripts/atlas-coverage.mjs` is a pure reconciliation library; `scripts/atlas-sync.mjs` is the explicit local command interface; `scripts/atlas-projection.mjs` adapts the runtime data and hashes the rendering implementation. The tracked `data/atlas-coverage.json` stores only fingerprints, statuses, and public target references. It is never a browser import.

Completeness requires human/agent semantic review plus behavioral verification; a matching hash proves only that a previously reviewed input did not change. There is no automatic story-text importer or bulk “mark complete” operation. Public CI validates bookkeeping and synthetic deltas without private input files. See `docs/source-updates.md` for the state model and no-op contract.
