# Integration points and the MVP's limitations

Use this list as a checklist for a supported content expansion, not a request to rewrite the app during an already-current run. Preserve independent user edits and inspect current code; these entry points may evolve.

| Area | Current seam | Required for expansion |
| --- | --- | --- |
| Public projection | `src/story.js`: one `chapter`, character list, locations, events, `getView` | Add explicit per-field/record disclosure and classification; keep stable IDs; no raw provenance. Update `scripts/atlas-projection.mjs` if exports or data layout change. |
| Chapter controls | `index.html`, `src/chapter-picker.js`, `src/main.js` | Remove the two-option labels and `value === 1` limit when adding chapters. Generate reader-facing choices from reviewed chapter metadata. Do not expose future chapter titles just because data exists. Test explicit commit, escape, touch, reset, and partial chapter labels. |
| Characters | `src/main.js`, `index.html`, `getView` | The single character button only toggles visibility. Add real selection/isolation for new people and companions; gate names before disclosure. Do not reuse the selected character's step index as a global reveal time. |
| Locations | `locations[].reveal`, map `update` | Current reveal is the sample's event index. Multi-character/multi-chapter expansion needs a stable disclosure timeline independent of array order and current selection. Notes introduced later must not mutate earlier labels. |
| Routes | `src/map.js` `routePaths`, `update`, `elevation` | Three paths are keyed by public event ID. Add actual drawing support for new travel records and non-travel journal entries. Validate all referenced locations and endpoint handling. Prefer a data-driven geometry layer as expansion requires it. Do not derive geography from another character's uncertain route. |
| Pieces | `src/map.js` single `pawnRoot` and fixed GLB URL | Reuse/recolor abstract pieces or map model URLs by character. Position the selected piece from that character's supported movement; do not imply all others stayed at their last location. Retain a per-piece primitive fallback. |
| Journal | `src/main.js`, static chapter/character markup | Replace hard-coded chapter text, person name, and counts with selected public data. Entries without reliable paths still need a useful journal and uncertainty state. |
| Public coverage copy | `index.html`, README, share metadata | Revise the small-sample scope only to match completed coverage. Keep title/description/share tags synchronized. Cards/icons remain under the closed boundary. |
| Loading | Currently one early bundle | Before shipping later material, introduce chapter payloads loaded only after selection. Shared names/assets/metadata must also honor disclosure. A UI toggle cannot undo having already displayed a future label. |
| Verification | `tests/story.test.mjs`, browser suites | Add synthetic cross-chapter and multi-character checks. Test removal of all later labels, notes, routes, companions, and status on backtracking. Retain render-on-demand, 360 px/iPhone, failure fallback, release audit, CSP, and live read-only smoke tests. |

Coverage is not visual completeness. A source receipt pointing to an event whose drawing is absent, whose chapter is unreachable, or whose journal still names the old character is not complete. Review the browser result, not only data arrays.

No content needs a more realistic model to count as complete. A labeled abstract token and schematic route are valid when they convey only what the supplied files establish.
