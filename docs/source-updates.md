# Updating from a new local movement snapshot

Copy the current **`movements.md` and `metadata.json` together** into the repository root. They remain ignored. Append ledger entries as needed, but keep metadata as one valid JSON object describing the full copied snapshot; do not concatenate multiple JSON documents. Ask the agent:

> Update the atlas from the two local source files using `skills/update-atlas/SKILL.md`. Reconcile existing coverage first, use no other book sources, and make no changes if the atlas is already up to date.

The root agent instructions route both Codex and Claude to that skill. Its Blender guide is conditional: a new character can use an existing abstract piece. A normal content update needs neither Blender nor access to another repository.

## Versioned movement handoff

`heard-so-far` produces full, frozen movement snapshots with its repo-local
`skills/log-movements/SKILL.md` and `companion/movements.py`. Its
[movement contract](https://github.com/iwvelando/heard-so-far/blob/main/spec/movements.md)
owns the format. This atlas vendors the exact descriptor in
[`contracts/movement-format-v1.json`](../contracts/movement-format-v1.json) and
the shared synthetic test corpus in
[`contracts/movement-format-cases.json`](../contracts/movement-format-cases.json).
Coordinate changes in both repos; a new column/meaning/required field needs a new
version, supported here before the producer starts exporting it.

v1 metadata declares `format_version: 1` and `movements_sha256`, a SHA-256 of the
exact accompanying UTF-8 Markdown bytes. It retains private source identity and
numeric evidence/listening intervals, adds the reported track start and a
`reading_endpoint` with numeric chapter and `partial` / `complete` coverage, and
declares all consulted manifest paths. The track table explicitly maps tracks
to chapters and coverage. Movement, plan, and last-established rows carry
`Disclosure chapter`; character/location scope fields qualify individual labels.
All tables use exact headers from the descriptor. Blank-separated continuation
rows, repeated headers, and escaped pipes are supported. Unknown columns,
unsupported syntax/versions, duplicate identities, out-of-scope chapters, and
mismatched hashes fail before reconciliation, recording, or acceptance.

Copy both files from one export into the ignored root paths, then run
`npm run atlas:check`. No producer checkout, Python, audio, transcript, or journal
is needed here. Paths in metadata are provenance data; this consumer never opens
them. Producer validation checks local progress and transcript completeness;
consumer validation checks the declared pair's shape and boundaries. Neither
certifies the prose, chapter mapping, evidence accuracy, or supported public
coverage. Review every claim and disclosure under the normal skill before
recording receipts.

Existing unversioned pairs keep the legacy parser and receipts. Unknown declared
versions cannot fall back to legacy. Do not modify existing local inputs just to
add a version or hash. A reviewed producer migration creates a new full snapshot;
changed headers alter source identities and require deliberate coverage
reconciliation, never a blanket receipt reset or automatic acceptance. No raw
producer artifact or provenance enters Git or the production build.

## What the checker does

`npm run atlas:check` is read-only and works without installing dependencies. It inventories every Markdown table row and each section's surrounding prose, compares their fingerprints with reviewed receipts, verifies references to public objects, and compares the accepted metadata and implementation snapshot. It never opens a link/path found in the inputs and never reads audio/transcripts. It does not automatically generate prose, infer chapter boundaries, or declare facts correct.

| Exit | Meaning | Agent action |
| --- | --- | --- |
| 0 | All source items and public records reviewed, no pending gaps, same accepted source/metadata/implementation | Report up to date and stop without writes, asset work, commits, or deployment. |
| 2 | Missing/changed/partial/blocked/removed items, public drift, unreviewed targets, or snapshot review remains | Inspect the local delta; implement only justified missing content or revise existing content. |
| 1 | Missing inputs, unsupported/malformed data, or source identity mismatch | Resolve the inputs first. Never fetch book facts or silently reset coverage. |

An unchanged blocker is not a reason to invent content, and it is not complete coverage. Report it without churn. An unchanged fully accepted snapshot is a strict no-op, including receipt modification times.

Run `npm run atlas:check -- --details` to see source labels, local line numbers, opaque keys, and public target IDs. **That detailed output is private.** Keep any saved report under ignored `local/`; do not publish it in repository history, a PR, an issue, CI logs, or a site asset. The default summary prints counts and already-public target IDs only.

## The tracked receipt file

`data/atlas-coverage.json` is development bookkeeping, never a runtime import or public build asset. It contains only:

- A format version and hash of source identity; no audio path or source identity fields.
- Opaque hashes of logical source keys and reviewed source contents.
- Status and hashes of referenced public records.
- Hashes of the last fully reviewed source document, metadata, and implementation snapshot.

Fingerprints are change detectors, not an encryption/privacy guarantee or a license to copy source material. No raw row IDs, source prose, replay times, chapter titles beyond public coverage, machine paths, or private reasons belong in receipts. Keep optional detailed rationale in ignored local notes; future agents must be able to re-evaluate from the two current inputs without those notes.

The initial receipts identify the three existing public movement entries as **partial**. They have not certified all claims/participants in their source rows, supporting entities, or later material. The initial inventory is intentionally incomplete; do not blanket-accept it to silence the checker.

## Recording reviewed work

The detail report gives a 64-character `key` for each item. After implementing and verifying it:

```sh
npm run atlas:record -- --key <key-from-local-report> --status complete --target events:<public-id> --target locations:<public-id>
npm run atlas:record -- --key <key-from-local-report> --status partial --target events:<public-id>
npm run atlas:record -- --key <key-from-local-report> --status blocked
npm run atlas:record -- --key <key-from-local-report> --status context
```

Targets use `events:`, `characters:`, `locations:`, or `chapters:` plus an existing public ID. Multiple targets per item and many items sharing a target are supported. The command captures current hashes; it does not evaluate whether the chosen targets express the source accurately. Never refresh a receipt merely to conceal a content change.

- **complete:** All material claims/participants in a source record are represented appropriately, including uncertainty. Requires at least one public target. An event may be journal-only when no reliable route exists.
- **context:** Reviewed prose or track-navigation context needs no direct public object. Movement, character, location, and other claim-table rows cannot use this status. A prose correction affecting the map must first be reflected in the relevant public objects.
- **partial:** Some implementation exists, but material claims or participants remain unaccounted for.
- **blocked:** Safe interpretation or presentation is not established from the two allowed files. Record the blocker locally if useful; never fetch missing book information.

`missing`, `changed`, `drift`, and `removed` are computed report states, not statuses to write. `drift` means a referenced public object changed or disappeared after review. A later source row can strengthen or revise an existing target without creating a new movement.

Once **every** item and public target has been reviewed and tests/visual checks pass:

```sh
npm run atlas:accept
npm run atlas:check
```

`accept` refuses outstanding items or unreferenced public records. It acknowledges the current metadata and full source snapshot, so changes outside a single row—such as row reordering—cannot silently pass. Rendering source files, HTML, and models are also fingerprinted: a changed route renderer must be reviewed rather than inheriting an old completeness claim. Repeating `record`/`accept` with identical values preserves file contents and mtime.

## Append, correction, and schema rules

Stable table first-column IDs are important. The source key hashes the heading hierarchy, column headers, and first-column ID; changing one is treated as removal plus addition. Row text changes invalidate the old receipt. Whitespace-only formatting is normalized. Reordering rows changes the whole-source snapshot even if individual row hashes match. Duplicate identities, malformed table widths, and unrecognized table syntax fail closed rather than dropping data.

If an updated source intentionally removes/renames an item, review the previous public targets and amend/retract them as needed. Then explicitly remove that obsolete opaque receipt from `data/atlas-coverage.json`, record the replacement if any, and review the final snapshot. There is no bulk discard command. Removal is not automatically permission to delete existing public facts. Missing prior source text or ambiguous corrections may require clarification from the user.

Metadata is mandatory for synchronization. Validate local-only provenance, identity, snapshot mode, finite intervals, and the listening buffer. The tool checks the supported fields; the agent must also compare the ledger's scope and referenced chapter/track intervals to that metadata. A newer endpoint does not make inferred or unheard trailing material valid. An old/missing/contradictory metadata file is a blocker. When the input format changes, adapt the parser and synthetic tests deliberately; never omit unreadable sections to get a green result.

The development-only adapter in `scripts/atlas-projection.mjs` combines all reviewed chapter payloads and public arrays. Keep it aligned with the application's payload structure. Extend target collections/validation if a new public concept cannot be expressed by the existing collections. Do not bypass receipts to accommodate a new data shape.

## Verification without private sources

Ordinary `npm test`, builds, and CI require no private inputs. They validate the receipt schema, referenced public objects, release boundaries, and synthetic append/change/no-op cases. Local `atlas:check` is intentionally separate: the public CI cannot certify completeness against a private ledger it does not possess. Never upload the inputs to CI to make that check available.

Follow `AGENTS.md` for the full source audit, browser, iPhone WebKit, visual, and deployment checks. Review staged files explicitly. Source synchronization does not change the hosting or merge policy.
