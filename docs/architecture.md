# Implementation and expansion contract

## Small static application

- `src/story.js`: pure `getView` disclosure projection and payload composition; `src/chapters/` holds reviewed chapter paraphrases. No runtime parsing of private working sources.
- `src/chapter-picker.js`: accessible select-only combobox. Keyboard exploration does not change the reading limit; explicit selection commits it.
- `src/main.js`: reading limit, selected movement, selected character, comparison selection, layer discovery, journal rendering, and accessible controls.
- `src/preferences.js`: validates versioned reading, selection, layout and camera preferences; storage failures are tolerated.
- `public/theme-init.js`: local script that resolves saved or system theme before the first paint under the production CSP.
- `src/theme.js`: persisted light/dark controls, return-to-system control and live system-theme changes.
- `src/pieces.js`: shared numbered participant identities, colors and abstract shapes.
- `src/map.js`: Three.js orthographic scene, OrbitControls, stacked contour terrain, scene labels, evidence-ordered paths, and Blender pawn loading. Decorative geometry is schematic.
- `scripts/create-pawn.py`: non-destructive Blender asset recipe. Set `EXPORT_PATH` to export elsewhere; it restores prior selection and retains existing scene objects.
- `scripts/check-dist.mjs`: prevents obvious private source files, audio, absolute local paths, and runtime font/CDN dependencies from entering the production output.
- Tests cover closed disclosure boundaries, backwards movement, location resolution, chapter-only public data, browser controls, responsive layout, and journal fallback without WebGL.

## Disclosure is different from story time

Gate on when a claim is disclosed, not when the event supposedly happened. A recollection of an earlier event revealed in Chapter Eight must not become visible at a Chapter One boundary. Preserve `chapter` (disclosure), story time, classification, and attribution independently when expanding the schema. Exact source intervals belong in private research, not the public chapter data.

Every projected field must be valid at its disclosure boundary: names, labels, summaries, companions, routes, destinations, status, and chapter references. Do not expose future chapter titles in the limit selector. Geometry revealing a future named site needs its own disclosure boundary. Keep retrospective interpretations in separate records rather than overwriting early descriptions.

`getView` controls visible journal records, map labels, revealed landmarks, and traversed paths together. Backtracking rebuilds dynamic layers and clears old text. A fresh browser starts closed. Versioned preferences in local storage restore the validated reading limit automatically on reload; URL parameters cannot advance it. Saved character IDs, comparison IDs and event IDs are reconciled against the loaded disclosure boundary before rendering. Invalid versions or boundaries fail closed; malformed optional preferences fall back to defaults. Unknown or future IDs are discarded, and stale loads cannot restore a superseded boundary. Storage errors leave the journal and map usable. Only preferences and public IDs are stored, never chapter payloads or source evidence. Selection is a visibility control, not authorization.

The initial application contains a numbered chapter catalog and no story payload. `src/chapters.js` loads only chapters through an explicitly committed boundary. Chapter titles, character names and place notes enter the UI from those payloads. The chapter selector prevents accidental UI disclosure; it is not access control against someone inspecting downloaded JavaScript. The build-time ceiling is twelve; its final payload explicitly describes partial coverage. Backtracking also removes cached later titles from the picker. Failed or superseded loads cannot restore story state.

## Next implementation slices

1. Refine the schematic layout and marker scale while preserving the distinction between narrated relationships and invented geography.
2. Use the coverage reconciliation workflow in `docs/source-updates.md`; implement missing records with per-field disclosure provenance and a reviewed export allowlist.
3. Add characters as separate routes; preserve living travel, presence, reports, plans, recollections, and spectral layers as distinct classifications. The atlas supports per-participant routes and positions; a destination participant never inherits the traveler's path.
4. Extend the evidence-approved geography with stable layout coordinates, source-supported relative constraints, and conflict notes. Coordinates must remain labeled as invented until evidence supports them.
5. Add chapter-level lazy loading and tests using synthetic future records to guard against mixed-disclosure summaries and place names.
6. Publish through the existing verified PR/CI workflow. Review the actual output inventory before each release.

## Known limitations

Coverage extends through part of Chapter Twelve. The reading selector offers a closed boundary and twelve numbered choices, with the final chapter marked partial. Broad and unlocated places stay journal-only. Selecting an entry shows the completed movement; it does not animate exact travel or imply continuous presence afterward. Routes are illustrative connectors, not surveyed tracks. Pawn selection focuses the current entry; character/companion selection and journal-layer filtering are explicit controls. Participants have stable numbered identities, route colors and five recurring abstract piece shapes. Numbers distinguish participants with similar colors or recurring shapes. Reading progress and UI selections are saved per browser and origin. No audio playback, geographic coordinates, or backend exists.

Entry mode draws the selected entry’s places and route. The comparison journal also shows only that chapter’s entries. Chapter comparison projects each chosen participant’s entries disclosed in exactly the selected chapter and layer through `getChapterOverview`, reusing `getView` for per-participant disclosure and route rules. It never connects separate entries into a continuous route. Each piece marks that participant’s last located entry in the chosen chapter, not a simultaneous or continued position. Layer counts put matching participants first and automatically select one with entries when changing layers. Comparison has explicit all/none and individual checkboxes, optional location labels, numbered piece markers and a scrollable character legend. Expanding the board moves the journal beneath it. Labels retain collision handling and phone numbering; rendering remains on demand. The renderer redraws on camera, resize, story, asset, and context-restoration changes; controls keep requesting frames only while damping moves the camera. Dynamic geometry is disposed when entries or comparison choices change; participant materials are shared. Loaded pawn geometry is cloned for orb pieces; other shapes use procedural local geometry. The asset loader retains a primitive brass fallback if the GLB cannot load. A WebGL initialization failure leaves the journal available.

## Public source and distribution

Scratch sources and private evidence notes are ignored and checked by `scripts/check-public.mjs`. Neither source data nor client bundles contain audiobook replay anchors. Use stable, descriptive event IDs in the public projection and maintain source mappings privately. The build must succeed without the ignored files present.

`build-notices.mjs` generates full software dependency notices. The intended Content Security Policy lives in `deploy/content-security-policy.txt`, and Vite preview serves it so browser tests exercise the production restrictions. The Verify workflow gates deployment on production build, release audit, Chromium, and iPhone WebKit checks. Infrastructure lives in `iwvelando/cloud-accounts`; deployment uses GitHub OIDC rather than stored AWS credentials.

The footer credits Mark Z. Danielewski, reserves the rights to the original novel, and identifies the project as an unaffiliated fan interpretation. Do not represent attribution as permission, or extend a software license to the novel.

## Source synchronization

`AGENTS.md` establishes the two-file book-source boundary and routes content updates to `skills/update-atlas/SKILL.md`. `scripts/atlas-coverage.mjs` is a pure reconciliation library; `scripts/atlas-sync.mjs` is the explicit local command interface; `scripts/atlas-projection.mjs` composes all reviewed chapter payloads for development bookkeeping and hashes the rendering implementation; it is never a runtime import. The tracked `data/atlas-coverage.json` stores only fingerprints, statuses, and public target references. It is never a browser import.

Completeness requires human/agent semantic review plus behavioral verification; a matching hash proves only that a previously reviewed input did not change. There is no automatic story-text importer or bulk “mark complete” operation. Public CI validates bookkeeping and synthetic deltas without private input files. See `docs/source-updates.md` for the state model and no-op contract.
