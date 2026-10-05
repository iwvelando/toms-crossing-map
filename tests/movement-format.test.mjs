import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { validateMovementPair } from "../scripts/movement-format.mjs";
const fixture = JSON.parse(await readFile(new URL("../contracts/movement-format-cases.json", import.meta.url)));
for (const example of fixture.cases) test(`movement contract: ${example.name}`, () => {
  const source = (example.replace ? fixture.source.replace(...example.replace) : fixture.source) + (example.append || "");
  const metadata = { ...fixture.metadata, ...example.metadata_patch };
  if (example.rehash !== false) metadata.movements_sha256 = createHash("sha256").update(source).digest("hex");
  if (example.valid) assert.equal(validateMovementPair(source, metadata), 1);
  else assert.throws(() => validateMovementPair(source, metadata));
});
test("unversioned inputs stay readable; unknown versions cannot masquerade as legacy", () => {
  assert.equal(validateMovementPair("legacy", {}), 0);
  for (const version of [null, 0, 2, "1", true])
    assert.throws(() => validateMovementPair("legacy", { format_version: version }));
  assert.throws(() => validateMovementPair("legacy", { movements_sha256: "orphan" }));
});
