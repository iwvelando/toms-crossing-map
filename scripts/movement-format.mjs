import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

// Mirrored verbatim from heard-so-far/spec; no runtime or private-source import.
const contract = JSON.parse(readFileSync(new URL("../contracts/movement-format-v1.json", import.meta.url), "utf8"));
const object = value => value !== null && typeof value === "object" && !Array.isArray(value);
const number = value => typeof value === "number" && Number.isFinite(value) && value >= 0;
const integer = value => Number.isSafeInteger(value) && value > 0;
const text = value => typeof value === "string" && value.trim().length > 0;
const span = value => object(value) && Object.keys(value).length === 2 && number(value.start) && number(value.end) && value.start < value.end;
const inside = (value, outer) => span(value) && value.start >= outer.start && value.end <= outer.end;
const normalize = value => value.replace(/\s+/g, " ").trim();
const cells = line => line.trim().slice(1, -1).split(/(?<!\\)\|/).map(normalize);
const separator = line => /^\s*\|(?:\s*:?-{3,}:?\s*\|)+\s*$/.test(line || "");

export function validateMovementMetadata(meta) {
  assert(object(meta), "Invalid movement metadata object");
  if (!Object.hasOwn(meta, "format_version")) {
    assert(!Object.hasOwn(meta, "movements_sha256"), "Missing movement format_version");
    return 0; // Existing atlas receipts remain valid for unversioned local pairs.
  }
  assert(meta.format_version === contract.version, "Unsupported movement format_version");
  assert(contract.required_metadata.every(key => Object.hasOwn(meta, key)), "Missing movement metadata field");
  assert(Object.keys(meta).every(key => [...contract.required_metadata, ...contract.optional_metadata].includes(key)), "Unknown movement metadata field");
  assert(typeof meta.movements_sha256 === "string" && /^[a-f0-9]{64}$/.test(meta.movements_sha256), "Invalid movements_sha256");
  const identity = meta.source_identity;
  assert(object(identity) && Object.keys(identity).length === 3 && text(identity.resolved_audio_path) && integer(identity.size) && number(identity.mtime_ns) && Number.isInteger(identity.mtime_ns) && identity.mtime_ns > 0, "Invalid movement source identity");
  assert(meta.evidence_mode === "local-only" && meta.snapshot_mode === "known-through-reading-endpoint", "Unsupported movement evidence or snapshot mode");
  assert(span(meta.query_interval), "Invalid movement query interval");
  assert(Array.isArray(meta.consulted_audio_intervals) && meta.consulted_audio_intervals.length && meta.consulted_audio_intervals.every(value => inside(value, meta.query_interval)), "Movement evidence exceeds query interval");
  assert(integer(meta.reported_track) && number(meta.reported_track_start_seconds) && number(meta.reported_elapsed_seconds) && number(meta.safe_elapsed_seconds) && meta.reported_elapsed_seconds - meta.safe_elapsed_seconds >= 5, "Invalid movement listening buffer");
  assert(meta.query_interval.end <= meta.reported_track_start_seconds + meta.safe_elapsed_seconds, "Movement query exceeds listening endpoint");
  const endpoint = meta.reading_endpoint;
  assert(object(endpoint) && Object.keys(endpoint).length === 2 && integer(endpoint.chapter) && ["partial", "complete"].includes(endpoint.coverage), "Invalid movement reading endpoint");
  assert(Array.isArray(meta.transcript_manifests) && meta.transcript_manifests.length === meta.consulted_audio_intervals.length && meta.transcript_manifests.every(text), "Invalid movement transcript manifests");
  assert(meta.selected_theme === null && meta.rendered === false, "Movement ledger must be an unrendered text snapshot");
  if (Object.hasOwn(meta, "update_interval")) assert(inside(meta.update_interval, meta.query_interval), "Invalid movement update interval");
  if (Object.hasOwn(meta, "previous_snapshot")) {
    const previous = meta.previous_snapshot;
    assert(object(previous) && Object.keys(previous).length === 2 && text(previous.path) && inside(previous.query_interval, meta.query_interval), "Invalid movement previous snapshot");
  }
  for (const key of ["journal_entry_id", "previous_journal_entry_id"]) if (Object.hasOwn(meta, key)) assert(typeof meta[key] === "string" && /^[0-9a-f]{32}$/.test(meta[key]), "Invalid movement journal identifier");
  if (Object.hasOwn(meta, "updated_local_date")) assert(typeof meta.updated_local_date === "string" && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(meta.updated_local_date), "Invalid movement update date");
  return 1;
}

export function validateMovementPair(source, meta) {
  const version = validateMovementMetadata(meta);
  if (!version) return 0;
  assert(typeof source === "string" && source.trim(), "Empty movement ledger");
  assert(createHash("sha256").update(source, "utf8").digest("hex") === meta.movements_sha256, "Movement pair hash mismatch; copy both files from one export");
  const seen = new Set(), roles = new Set(), rows = [], headings = [];
  let table = null, title = false;
  const lines = source.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i], heading = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    assert(!/^\s*(```|~~~)/.test(line), `Unsupported movement fence at line ${i + 1}`);
    if (heading) {
      const level = heading[1].length;
      if (level === 1) { assert(!title, "Movement ledger needs one stable title"); title = true; }
      assert(title && level <= headings.length + 1, `Invalid movement heading hierarchy at line ${i + 1}`);
      headings.length = level - 1;
      headings.push(normalize(heading[2]));
      table = null;
    } else if (line.trim().startsWith("|")) {
      assert(title && headings.length >= 2 && line.startsWith("|") && line.trim().endsWith("|"), `Invalid movement table at line ${i + 1}`);
      if (!table || separator(lines[i + 1])) {
        const columns = cells(line), rule = cells(lines[i + 1] || "");
        assert(separator(lines[i + 1]) && lines[i + 1].startsWith("|") && columns.length === rule.length, `Invalid movement table header at line ${i + 1}`);
        table = contract.tables.find(candidate => JSON.stringify(candidate.columns) === JSON.stringify(columns));
        assert(table, `Unsupported movement columns at line ${i + 1}`);
        roles.add(table.role);
        i++;
      } else {
        assert(!separator(line), `Orphan movement separator at line ${i + 1}`);
        const row = cells(line);
        assert(row.length === table.columns.length && row.every(text), `Invalid movement row at line ${i + 1}`);
        const key = JSON.stringify([headings, table.columns, row[0]]);
        assert(!seen.has(key), `Duplicate movement identity at line ${i + 1}`);
        seen.add(key); rows.push({ table, row });
      }
    } else {
      assert(!/(?<!\\)\|/.test(line), `Unsupported movement pipe syntax at line ${i + 1}`);
      if (line.trim()) table = null;
    }
  }
  assert(contract.tables.filter(table => table.required).every(table => roles.has(table.role)), "Missing required movement tables");
  const chapterSet = new Set(), tracks = new Set();
  let previousTrack = 0, previousChapter = 0;
  const positive = value => /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value));
  for (const { table, row } of rows.filter(value => value.table.role === "tracks")) {
    const track = Number(row[0]), chapter = Number(row[3]);
    assert(positive(row[0]) && positive(row[2]) && positive(row[3]) && track > previousTrack && track <= meta.reported_track && chapter >= previousChapter && chapter <= meta.reading_endpoint.chapter && !tracks.has(track), "Invalid movement track/chapter mapping");
    const coverage = chapter === meta.reading_endpoint.chapter ? meta.reading_endpoint.coverage : "complete";
    assert(row[4] === coverage, "Movement chapter coverage disagrees with endpoint");
    tracks.add(track); chapterSet.add(chapter); previousTrack = track; previousChapter = chapter;
  }
  assert(chapterSet.has(meta.reading_endpoint.chapter), "Missing movement endpoint chapter mapping");
  for (const { table, row } of rows) {
    const disclosure = table.columns.indexOf("Disclosure chapter");
    if (disclosure >= 0) assert(positive(row[disclosure]) && chapterSet.has(Number(row[disclosure])), "Movement disclosure has no permitted chapter mapping");
    if (table.role === "transcripts") {
      const start = Number(row[2]), end = Number(row[3]);
      const decimal = value => /^(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/.test(value);
      assert(decimal(row[2]) && decimal(row[3]) && number(start) && number(end) && meta.consulted_audio_intervals.some(span => inside({ start, end }, span)), "Movement transcript navigation exceeds evidence scope");
    }
  }
  return 1;
}
