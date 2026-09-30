# Tom’s Crossing — an unofficial fan atlas

A small static Three.js atlas of Mark Z. Danielewski’s novel. Preserve the carved tabletop design and the journal’s careful distinction between narrated relationships and illustrative geography. The app currently covers one character’s first three movements in Chapter One.

## Boundaries

- Keep reviewed reader-facing content in `src/story.js`. Private research, transcripts, audiobook files, replay anchors, timing ledgers, and source evidence stay outside published source and production assets. Never force-add ignored files.
- Preserve per-field disclosure boundaries. Names, labels, routes, and summaries must all be valid at the selected chapter. Backtracking retracts content; reload starts before Chapter One. URL parameters and stored state must not unlock content. Client-side gating prevents accidental spoilers; it is not access control.
- Terrain, distances, decorative objects, and path bends are illustrative. Keep uncertainty visible. Attribution is not permission: retain the fan-project disclosure and rights-holder credit, and do not reproduce book text or recordings.
- Preserve the journal when WebGL fails and the primitive pawn when model loading fails. Keep keyboard and touch chapter selection explicit: exploring an option must not reveal its content.
- Keep assets local. No analytics, external fonts, or runtime content services. Changes needing new resource types require the matching CSP in `deploy/content-security-policy.txt` and `iwvelando/cloud-accounts` before deployment.

## Discovery and changes

Use the installed `codebase-memory` skill for structural exploration; check coverage for relied-on files and read uncovered source directly. `src/main.js` owns UI state, `src/chapter-picker.js` owns selection, and `src/map.js` owns drawing and controls. `docs/architecture.md` describes the expansion contract.

Keep changes focused. Use failing tests first for behavior and release safeguards. Preserve user work. Stage explicit paths after inspecting them; never use blanket staging or force-add. Commit the npm lockfile and the small GLB with ordinary Git. Keep dependencies, build output, agent runtime state, private notes, and browser artifacts ignored. Software is MIT licensed; that license does not grant rights to the novel.

## Verification

Run `npm ci`, `npm run check`, and `npm run test:browser`. Install Chromium with `npx playwright install chromium`. Run `npm run test:webkit` after installing WebKit. Browser tests serve the production build under its production CSP, check the spoiler boundary, exercise every movement at 360 px, and preserve screenshots for visual review. Inspect desktop and phone screenshots when changing layout. Report actual checks and remaining limits.

`npm test` audits all public candidate files, including accidentally staged ignored files; `npm run build` audits the output. Inspect GLB metadata and the complete staged file inventory before public releases. Automated pattern checks are limited and do not replace review.

Link previews reuse the page title and description exactly. `npm run build && npm run share-card` regenerates the committed card and full-bleed icon from the site’s art under a closed reading boundary; inspect both before committing. The `@smoke` tests fetch these images from the site being tested.

## Hosting

`iwvelando/cloud-accounts` owns S3, CloudFront, ACM, Route53, and the scoped deploy role in `sites/toms-crossing-map.isaacvelando.com`. Publish only `dist/` through `.github/workflows/ci.yml`. Merging to `main` deploys after all verification jobs pass. Never deploy another way. Apply infrastructure first, make the source repository public, configure a main-only `production` environment, and set repository variable `DISTRIBUTION_ID` from Terraform’s output before merging the launch PR.

Match the reference repository’s squash-only merge policy and required `verify` check. Dependabot patch/minor updates merge only after Verify passes and dispatch a deployment; majors require review. The live `@smoke` suite is read-only. After the first deploy, run cloud-accounts’ acceptance script with the read-only AWS profile and record the site as Live there.
