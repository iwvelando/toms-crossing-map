import { readFile, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { readProjection } from "./atlas-projection.mjs";
import { validateMovementPair } from "./movement-format.mjs";
import {
  inventory,
  reconcile,
  recordReceipt,
  acceptSnapshot,
  validateMetadata,
} from "./atlas-coverage.mjs";

// This CLI reads only these two book sources. Never dereference their paths/links.
const statePath = new URL("../data/atlas-coverage.json", import.meta.url);
const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    details: { type: "boolean" },
    key: { type: "string" },
    status: { type: "string" },
    target: { type: "string", multiple: true },
  },
});
const command = positionals[0] || "check";
try {
  if (
    positionals.length > 1 ||
    !["check", "record", "accept"].includes(command)
  )
    throw new Error(
      "Use check [--details], record --key HASH --status STATUS [--target COLLECTION:ID], or accept",
    );
  const metadata = JSON.parse(
    await readFile(new URL("../metadata.json", import.meta.url), "utf8"),
  );
  validateMetadata(metadata);
  const source = await readFile(
    new URL("../movements.md", import.meta.url),
    "utf8",
  );
  validateMovementPair(source, metadata);
  const state = JSON.parse(await readFile(statePath, "utf8"));
  const ctx = {
    source,
    metadata,
    items: inventory(source),
    projection: await readProjection(),
  };
  if (command === "check") {
    const report = reconcile(state, ctx);
    console.log(
      JSON.stringify(
        {
          upToDate: report.upToDate,
          counts: report.counts,
          snapshotChanged: report.snapshotChanged,
          unmappedTargets: report.unmappedTargets,
          ...(values.details
            ? {
                items: report.items.map(({ digest, ...item }) => item),
                removed: report.removed,
              }
            : {}),
        },
        null,
        2,
      ),
    );
    process.exitCode = report.upToDate ? 0 : 2;
  } else {
    const next =
      command === "accept"
        ? acceptSnapshot(state, ctx)
        : recordReceipt(
            state,
            ctx,
            values.key,
            values.status,
            values.target || [],
          );
    next.receipts = Object.fromEntries(
      Object.entries(next.receipts).sort(([a], [b]) => a.localeCompare(b)),
    );
    const serialized = JSON.stringify(next, null, 2) + "\n";
    // Repeated commands preserve file contents and mtime when nothing changed.
    if (serialized !== (await readFile(statePath, "utf8")))
      await writeFile(statePath, serialized);
    console.log(
      command === "accept"
        ? "Reviewed snapshot accepted."
        : "Receipt recorded; run atlas:check to see remaining work.",
    );
  }
} catch (error) {
  // Avoid printing parsed source objects or source paths in errors.
  console.error(
    error.code === "ENOENT"
      ? "Missing local inputs or coverage state. Supply movements.md and metadata.json; do not fetch replacements."
      : error instanceof SyntaxError
        ? "Invalid JSON in metadata or coverage state; inspect the local files."
        : error.message,
  );
  process.exitCode = 1;
}
