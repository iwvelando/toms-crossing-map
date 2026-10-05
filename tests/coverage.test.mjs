import test from "node:test";
import assert from "node:assert/strict";
import {
  inventory,
  validateMetadata,
  reconcile,
  recordReceipt,
  acceptSnapshot,
  emptyCoverage,
  projectionTargets,
} from "../scripts/atlas-coverage.mjs";
const metadata = {
  source_identity: { size: 100, mtime_ns: 1000 },
  query_interval: { start: 0, end: 50 },
  consulted_audio_intervals: [{ start: 0, end: 50 }],
  evidence_mode: "local-only",
  snapshot_mode: "known-through-reading-endpoint",
  reported_track: 2,
  reported_elapsed_seconds: 30,
  safe_elapsed_seconds: 25,
};
const source =
  "# Synthetic source\n\nScope is limited.\n\n## Journey\n\n| Event | People | Movement |\n|---|---|---|\n| DEMO-A | Person | Room to garden |\n";
const projection = {
  events: [{ id: "garden", chapter: 1 }],
  characters: [],
  locations: [],
  chapters: [],
};
const context = (text = source, meta = metadata, publicData = projection) => ({
  items: inventory(text),
  metadata: meta,
  source: text,
  projection: publicData,
});
function completed(ctx = context()) {
  let state = emptyCoverage(ctx.metadata);
  for (const item of ctx.items)
    state = recordReceipt(
      state,
      ctx,
      item.key,
      item.kind === "context" ? "context" : "complete",
      item.kind === "context" ? [] : ["events:garden"],
    );
  return acceptSnapshot(state, ctx);
}
test("fully reviewed identical inputs are a pure, repeatable no-op", () => {
  const ctx = context(),
    state = completed(ctx),
    before = JSON.stringify(state);
  assert.equal(reconcile(state, ctx).upToDate, true);
  assert.deepEqual(reconcile(state, ctx), reconcile(state, ctx));
  assert.deepEqual(acceptSnapshot(state, ctx), state);
  assert.equal(JSON.stringify(state), before);
});
test("appended rows, edited rows, prose edits and removals are distinct work", () => {
  const state = completed();
  assert.equal(
    reconcile(state, context(source + "| DEMO-B | Person | Garden to room |\n"))
      .counts.missing,
    1,
  );
  assert.equal(
    reconcile(state, context(source.replace("Room to garden", "Room to court")))
      .counts.changed,
    1,
  );
  assert.equal(
    reconcile(
      state,
      context(source.replace("Scope is limited.", "Scope changed.")),
    ).counts.changed,
    1,
  );
  assert.equal(
    reconcile(
      state,
      context(source.replace("| DEMO-A | Person | Room to garden |\n", "")),
    ).counts.removed,
    1,
  );
});
test("partial and blocked receipts are never complete; event rows cannot be dismissed as context", () => {
  const ctx = context(),
    item = ctx.items.find((x) => x.kind === "record");
  for (const status of ["partial", "blocked"]) {
    const state = recordReceipt(
      emptyCoverage(metadata),
      ctx,
      item.key,
      status,
      [],
    );
    assert.equal(reconcile(state, ctx).upToDate, false);
    assert.throws(() => acceptSnapshot(state, ctx), /Unresolved/);
  }
  assert.throws(
    () => recordReceipt(emptyCoverage(metadata), ctx, item.key, "context", []),
    /Context/,
  );
});
test("metadata changes require explicit snapshot review; invalid scope fails closed", () => {
  const state = completed(),
    ctx = context(source, {
      ...metadata,
      query_interval: { start: 0, end: 60 },
    });
  assert.equal(reconcile(state, ctx).snapshotChanged, true);
  assert.equal(reconcile(state, ctx).upToDate, false);
  assert.equal(reconcile(acceptSnapshot(state, ctx), ctx).upToDate, true);
  assert.throws(
    () => validateMetadata({ ...metadata, evidence_mode: "external" }),
    /local-only/,
  );
  assert.throws(
    () => validateMetadata({ ...metadata, safe_elapsed_seconds: 31 }),
    /buffer/,
  );
  assert.throws(
    () =>
      validateMetadata({
        ...metadata,
        consulted_audio_intervals: [{ start: 0, end: 51 }],
      }),
    /interval/,
  );
  assert.throws(
    () =>
      reconcile(
        state,
        context(source, {
          ...metadata,
          source_identity: { size: 101, mtime_ns: 1000 },
        }),
      ),
    /Source identity/,
  );
});
test("changed/deleted public targets and unaccounted public records cannot be missed", () => {
  const state = completed();
  const changed = { ...projection, events: [{ id: "garden", chapter: 2 }] };
  assert.equal(
    reconcile(state, context(source, metadata, changed)).counts.drift,
    1,
  );
  assert.equal(
    reconcile(state, context(source, metadata, { ...projection, events: [] }))
      .counts.drift,
    1,
  );
  const added = { ...projection, characters: [{ id: "extra" }] };
  assert.deepEqual(
    reconcile(state, context(source, metadata, added)).unmappedTargets,
    ["characters:extra"],
  );
});
test("malformed or ambiguous source tables fail instead of silently skipping content", () => {
  assert.throws(
    () => inventory(source + "| DEMO-A | Person | Again |\n"),
    /Duplicate/,
  );
  assert.throws(() => inventory(source + "| BROKEN | Person |\n"), /columns/);
  assert.throws(() => inventory("| A | B |\n| 1 | 2 |"), /table/);
  assert.throws(() => inventory("A | B\n--- | ---\n1 | 2"), /table/);
  const escaped = inventory(
    source.replace("Room to garden", "Room \\| garden"),
  );
  assert.equal(escaped.length, 2);
});

test("blank lines retain table columns, identities and all continuation rows", () => {
  const continued = source + "\n| DEMO-B | Person | Garden to court |\n";
  const rows = inventory(continued).filter(item => item.kind === "record");
  assert.equal(rows.length, 2);
  const fingerprints = text => inventory(text).map(({ line, ...item }) => item);
  assert.deepEqual(fingerprints(continued), fingerprints(continued.replace("\n\n| DEMO-B", "\n| DEMO-B")));
  assert.throws(() => inventory(source + "\n| DEMO-A | Person | Again |\n"), /Duplicate/);
  assert.throws(() => inventory(source + "\n| BROKEN | Person |\n"), /columns/);
  assert.throws(() => inventory(source + "\nProse ends the table.\n| DEMO-B | Person | Garden |\n"), /table/);
  const restarted = continued.replace("| DEMO-B", "| Event | People | Movement |\n|---|---|---|\n| DEMO-B");
  assert.deepEqual(fingerprints(restarted), fingerprints(continued));
});
test("receipts contain hashes and public IDs, never source text or file paths", () => {
  const serialized = JSON.stringify(completed());
  for (const raw of [
    "DEMO-A",
    "Room to garden",
    "Scope is limited",
    "Synthetic source",
    "source_identity",
  ])
    assert(!serialized.includes(raw));
  assert(serialized.includes("events:garden"));
});
test("versioned handoffs gate check, recording and acceptance before changing receipts", async () => {
  const { readFile } = await import("node:fs/promises");
  const fixture = JSON.parse(await readFile(new URL("../contracts/movement-format-cases.json", import.meta.url)));
  const ctx = context(fixture.source, fixture.metadata), state = completed(ctx);
  assert.equal(reconcile(state, ctx).upToDate, true);
  const before = JSON.stringify(state);
  const mismatched = context(fixture.source + "Changed prose.\n", fixture.metadata);
  assert.throws(() => reconcile(state, mismatched), /hash mismatch/);
  assert.throws(() => acceptSnapshot(state, mismatched), /hash mismatch/);
  assert.throws(() => recordReceipt(state, mismatched, ctx.items[0].key, "context"), /hash mismatch/);
  assert.equal(JSON.stringify(state), before);
});
test("coverage validation rejects malformed receipts and targets", () => {
  const state = completed(),
    ctx = context();
  const key = Object.keys(state.receipts)[0];
  assert.throws(
    () =>
      reconcile(
        {
          ...state,
          receipts: {
            ...state.receipts,
            [key]: { ...state.receipts[key], status: "ignored" },
          },
        },
        ctx,
      ),
    /status/,
  );
  assert.throws(
    () =>
      projectionTargets({
        ...projection,
        events: [{ id: "duplicate" }, { id: "duplicate" }],
      }),
    /Duplicate/,
  );
  assert.throws(
    () => recordReceipt(state, ctx, key, "complete", ["events:missing"]),
    /target/,
  );
});

test("committed coverage schema and public targets validate without private inputs", async () => {
  const { readFile } = await import("node:fs/promises");
  const { validateCoverage } = await import("../scripts/atlas-coverage.mjs");
  const { readProjection } = await import("../scripts/atlas-projection.mjs");
  const state = validateCoverage(
    JSON.parse(
      await readFile(
        new URL("../data/atlas-coverage.json", import.meta.url),
        "utf8",
      ),
    ),
  );
  const targets = projectionTargets(await readProjection());
  for (const receipt of Object.values(state.receipts))
    for (const [ref, hash] of Object.entries(receipt.targets))
      assert.equal(targets[ref], hash, `Review drift for ${ref}`);
});

test("CLI is source-local, append-aware, and does not write an up-to-date tree", async () => {
  const { mkdtemp, mkdir, writeFile, readFile, copyFile, stat, rm } =
    await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { spawnSync } = await import("node:child_process");
  const dir = await mkdtemp(join(tmpdir(), "atlas-fixture-"));
  try {
    for (const sub of ["scripts", "src", "data", "contracts", "public/models"])
      await mkdir(join(dir, sub), { recursive: true });
    for (const script of [
      "atlas-coverage.mjs",
      "atlas-sync.mjs",
      "atlas-projection.mjs",
      "movement-format.mjs",
    ])
      await copyFile(
        new URL(`../scripts/${script}`, import.meta.url),
        join(dir, "scripts", script),
      );
    await copyFile(new URL("../contracts/movement-format-v1.json", import.meta.url), join(dir, "contracts/movement-format-v1.json"));
    await writeFile(join(dir, "package.json"), '{"type":"module"}');
    await writeFile(join(dir, "index.html"), "<title>Synthetic atlas</title>");
    await writeFile(
      join(dir, "src/story.js"),
      'export const chapter={id:1}; export const characters=[]; export const locations=[]; export const events=[{id:"garden"}];',
    );
    await writeFile(join(dir, "src/chapters.js"), 'export const maximumChapter=1; export async function loadThrough(){return {chapters:[{id:1}],characters:[],locations:[],events:[{id:"garden"}]};}');
    await writeFile(join(dir, "movements.md"), source);
    await writeFile(join(dir, "metadata.json"), JSON.stringify(metadata));
    await writeFile(
      join(dir, "data/atlas-coverage.json"),
      JSON.stringify(emptyCoverage(metadata)),
    );
    const run = (...args) =>
      spawnSync(
        process.execPath,
        [join(dir, "scripts/atlas-sync.mjs"), ...args],
        { cwd: dir, encoding: "utf8" },
      );
    let result = run("check", "--details");
    assert.equal(result.status, 2);
    for (const item of JSON.parse(result.stdout).items) {
      const args = [
        "record",
        "--key",
        item.key,
        "--status",
        item.kind === "context" ? "context" : "complete",
      ];
      if (item.kind === "record")
        args.push("--target", "events:garden", "--target", "chapters:1");
      result = run(...args);
      assert.equal(result.status, 0, result.stderr);
    }
    result = run("accept");
    assert.equal(result.status, 0, result.stderr);
    const path = join(dir, "data/atlas-coverage.json"),
      before = await readFile(path, "utf8"),
      mtime = (await stat(path)).mtimeMs;
    for (const command of ["check", "check", "accept"])
      assert.equal(run(command).status, 0);
    assert.equal(await readFile(path, "utf8"), before);
    assert.equal((await stat(path)).mtimeMs, mtime);
    await writeFile(
      join(dir, "src/renderer.js"),
      "// New implementation requiring review",
    );
    result = run("check");
    assert.equal(result.status, 2);
    assert.equal(JSON.parse(result.stdout).snapshotChanged, true);
    await writeFile(
      join(dir, "movements.md"),
      source + "| DEMO-B | Person | Return |\n",
    );
    assert.equal(JSON.parse(run("check").stdout).counts.missing, 1);
    await writeFile(
      join(dir, "metadata.json"),
      '{"private-note":"SYNTHETIC-SECRET" BROKEN}',
    );
    result = run("check");
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Invalid JSON/);
    assert(!result.stderr.includes("SYNTHETIC-SECRET"));
    await rm(join(dir, "metadata.json"));
    result = run("check");
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Missing local inputs/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
