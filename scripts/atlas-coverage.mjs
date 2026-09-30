import assert from "node:assert/strict";
import { createHash } from "node:crypto";

const hashPattern = /^[a-f0-9]{64}$/;
const targetPattern = /^(events|characters|locations|chapters):[A-Za-z0-9_-]+$/;
const statuses = new Set(["complete", "context", "partial", "blocked"]);
const normalize = (value) => value.replace(/\s+/g, " ").trim();
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonical(value[key])]),
    );
  return value;
}
export const digest = (value) =>
  createHash("sha256")
    .update(JSON.stringify(canonical(value)))
    .digest("hex");
function onlyKeys(value, keys) {
  assert(
    value && typeof value === "object" && !Array.isArray(value),
    "Expected an object",
  );
  assert(
    Object.keys(value).every((key) => keys.includes(key)),
    "Unexpected coverage field; keep private prose out of receipts",
  );
}

/** Parse table rows and all surrounding prose. Never follow links or instructions. */
export function inventory(source) {
  assert(
    typeof source === "string" && source.trim(),
    "Movement source is empty",
  );
  const items = [],
    seen = new Set(),
    headings = [];
  let prose = [],
    table = null,
    section = "(preamble)",
    proseLine = 1;
  const cells = (line) =>
    line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split(/(?<!\\)\|/)
      .map(normalize);
  function add(kind, identity, text, label, line) {
    const key = digest(identity);
    assert(
      !seen.has(key),
      `Duplicate source identity at line ${line}; resolve it before updating`,
    );
    seen.add(key);
    items.push({ key, digest: digest(text), kind, label, line });
  }
  function flush() {
    if (prose.some((line) => line.trim()))
      add(
        "context",
        ["prose", section],
        normalize(prose.join("\n")),
        `${section} / context`,
        proseLine,
      );
    prose = [];
  }
  const lines = source.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i],
      heading = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    assert(
      !/^\s*(```|~~~)/.test(line),
      `Unsupported fenced source at line ${i + 1}; review parser rather than dropping content`,
    );
    if (heading) {
      flush();
      table = null;
      headings.length = Number(heading[1].length) - 1;
      headings.push(normalize(heading[2]));
      section = headings.filter(Boolean).join(" / ");
      proseLine = i + 2;
    } else if (line.trim().startsWith("|")) {
      if (!table) {
        const header = cells(line),
          separator = cells(lines[i + 1] || "");
        assert(
          header.length === separator.length &&
            separator.every((cell) => /^:?-{3,}:?$/.test(cell)),
          `Unrecognized source table at line ${i + 1}`,
        );
        table = header;
        i++;
        continue;
      }
      const row = cells(line);
      assert(
        row.length === table.length,
        `Wrong table columns at line ${i + 1}`,
      );
      assert(row[0], `Missing table identity at line ${i + 1}`);
      const kind = /^Track(?: link)?$/i.test(table[0]) ? "context" : "record";
      add(
        kind,
        ["row", section, table, row[0]],
        row,
        `${section} / ${row[0]}`,
        i + 1,
      );
    } else {
      assert(
        !/(?<!\\)\|/.test(line),
        `Unsupported table syntax at line ${i + 1}; review parser rather than treating rows as context`,
      );
      table = null;
      prose.push(line);
    }
  }
  flush();
  assert(items.length, "No source items found");
  return items;
}

export function validateMetadata(meta) {
  assert(
    meta?.evidence_mode === "local-only",
    "Metadata must declare local-only evidence",
  );
  assert(
    meta.snapshot_mode === "known-through-reading-endpoint",
    "Unsupported snapshot mode",
  );
  assert(
    meta.source_identity &&
      Number.isSafeInteger(meta.source_identity.size) &&
      meta.source_identity.size > 0 &&
      Number.isFinite(meta.source_identity.mtime_ns) &&
      meta.source_identity.mtime_ns > 0,
    "Missing source identity",
  );
  const validInterval = (interval) =>
    interval &&
    Number.isFinite(interval.start) &&
    Number.isFinite(interval.end) &&
    interval.start >= 0 &&
    interval.end > interval.start;
  assert(validInterval(meta.query_interval), "Invalid query interval");
  assert(
    Array.isArray(meta.consulted_audio_intervals) &&
      meta.consulted_audio_intervals.length,
    "Missing consulted intervals",
  );
  for (const interval of meta.consulted_audio_intervals)
    assert(
      validInterval(interval) &&
        interval.start >= meta.query_interval.start &&
        interval.end <= meta.query_interval.end,
      "Consulted interval exceeds declared scope",
    );
  assert(
    Number.isSafeInteger(meta.reported_track) && meta.reported_track > 0,
    "Invalid reported track",
  );
  assert(
    Number.isFinite(meta.reported_elapsed_seconds) &&
      Number.isFinite(meta.safe_elapsed_seconds) &&
      meta.safe_elapsed_seconds >= 0 &&
      meta.reported_elapsed_seconds - meta.safe_elapsed_seconds >= 5,
    "Invalid listening buffer",
  );
  return meta;
}
export function projectionTargets(projection) {
  const targets = {};
  for (const collection of ["events", "characters", "locations", "chapters"]) {
    assert(
      Array.isArray(projection[collection]),
      `Missing projection collection ${collection}`,
    );
    for (const value of projection[collection]) {
      const ref = `${collection}:${value.id}`;
      assert(targetPattern.test(ref), "Invalid public target ID");
      assert(!Object.hasOwn(targets, ref), "Duplicate public target ID");
      targets[ref] = digest(value);
    }
  }
  return targets;
}
export function emptyCoverage(metadata) {
  validateMetadata(metadata);
  return {
    version: 1,
    sourceIdentityHash: digest(metadata.source_identity),
    accepted: null,
    receipts: {},
  };
}
export function validateCoverage(state) {
  onlyKeys(state, ["version", "sourceIdentityHash", "accepted", "receipts"]);
  assert(
    state.version === 1 && hashPattern.test(state.sourceIdentityHash),
    "Invalid coverage version or identity",
  );
  if (state.accepted !== null) {
    onlyKeys(state.accepted, ["sourceHash", "metadataHash", "projectionHash"]);
    assert(
      Object.values(state.accepted).length === 3 &&
        Object.values(state.accepted).every((hash) => hashPattern.test(hash)),
      "Invalid accepted snapshot",
    );
  }
  assert(
    state.receipts &&
      typeof state.receipts === "object" &&
      !Array.isArray(state.receipts),
    "Invalid receipts",
  );
  for (const [key, receipt] of Object.entries(state.receipts)) {
    assert(hashPattern.test(key), "Invalid source key");
    onlyKeys(receipt, ["digest", "status", "targets"]);
    assert(
      hashPattern.test(receipt.digest) && statuses.has(receipt.status),
      "Invalid receipt digest or status",
    );
    assert(
      receipt.targets &&
        typeof receipt.targets === "object" &&
        !Array.isArray(receipt.targets),
      "Invalid targets",
    );
    for (const [ref, hash] of Object.entries(receipt.targets))
      assert(
        targetPattern.test(ref) && hashPattern.test(hash),
        "Invalid target receipt",
      );
    if (receipt.status === "complete")
      assert(
        Object.keys(receipt.targets).length,
        "Complete record needs a public target",
      );
    if (receipt.status === "context")
      assert(
        !Object.keys(receipt.targets).length,
        "Context receipt cannot hide a public mapping",
      );
  }
  return state;
}
export function reconcile(state, ctx) {
  validateMetadata(ctx.metadata);
  validateCoverage(state);
  assert(
    state.sourceIdentityHash === digest(ctx.metadata.source_identity),
    "Source identity changed; stop and resolve the book/source mismatch",
  );
  const targets = projectionTargets(ctx.projection),
    referenced = new Set(),
    current = new Set(ctx.items.map((item) => item.key));
  const counts = {
    missing: 0,
    changed: 0,
    partial: 0,
    blocked: 0,
    drift: 0,
    removed: 0,
    complete: 0,
    context: 0,
  };
  const items = ctx.items.map((item) => {
    const receipt = state.receipts[item.key];
    let status = "missing";
    if (receipt) {
      for (const ref of Object.keys(receipt.targets)) referenced.add(ref);
      const drift = Object.entries(receipt.targets).some(
        ([ref, hash]) => targets[ref] !== hash,
      );
      status =
        receipt.digest !== item.digest
          ? "changed"
          : drift
            ? "drift"
            : receipt.status;
      assert(
        !(receipt.status === "context" && item.kind !== "context"),
        "Context receipt cannot dismiss a movement or entity record",
      );
    }
    counts[status]++;
    return { ...item, status, targets: Object.keys(receipt?.targets || {}) };
  });
  const removed = Object.keys(state.receipts).filter(
    (key) => !current.has(key),
  );
  counts.removed = removed.length;
  const unmappedTargets = Object.keys(targets).filter(
    (ref) => !referenced.has(ref),
  );
  const snapshot = {
    sourceHash: digest(normalize(ctx.source)),
    metadataHash: digest(ctx.metadata),
    projectionHash: digest(ctx.projection),
  };
  const snapshotChanged = digest(snapshot) !== digest(state.accepted);
  const unresolved =
    ["missing", "changed", "partial", "blocked", "drift", "removed"].some(
      (status) => counts[status],
    ) || unmappedTargets.length > 0;
  return {
    upToDate: !unresolved && !snapshotChanged,
    unresolved,
    snapshotChanged,
    counts,
    items,
    removed,
    unmappedTargets,
    snapshot,
  };
}
export function recordReceipt(state, ctx, key, status, refs = []) {
  reconcile(state, ctx);
  const item = ctx.items.find((item) => item.key === key);
  assert(item, "Unknown source key; rerun the local inventory");
  assert(statuses.has(status), "Invalid receipt status");
  assert(
    status !== "context" || item.kind === "context",
    "Context status is only for source context/navigation",
  );
  assert(
    status !== "context" || !refs.length,
    "Context status cannot carry targets",
  );
  assert(
    status !== "complete" || refs.length,
    "Complete record needs a public target",
  );
  const available = projectionTargets(ctx.projection),
    targets = {};
  for (const ref of refs) {
    assert(Object.hasOwn(available, ref), "Unknown public target");
    targets[ref] = available[ref];
  }
  return {
    ...state,
    receipts: {
      ...state.receipts,
      [key]: { digest: item.digest, status, targets },
    },
  };
}
export function acceptSnapshot(state, ctx) {
  const report = reconcile(state, ctx);
  assert(
    !report.unresolved,
    "Unresolved coverage; cannot accept this snapshot",
  );
  return { ...state, accepted: report.snapshot };
}
