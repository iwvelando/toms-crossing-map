import test from "node:test";
import assert from "node:assert/strict";
import { normalizeState, readState, writeState, STATE_KEY } from "../src/preferences.js";
import { maximumChapter } from "../src/chapters.js";

test("saved reading state fails closed for corrupt or unsupported boundaries", () => {
  for (const value of [null, [], {}, { version: 2, limit: 1 }, ...[-1, maximumChapter + 1, 1.5, "12", NaN].map(limit => ({ version: 1, limit }))])
    assert.equal(normalizeState(value), null);
  assert.equal(readState({ getItem: () => "{broken" }), null);
});

test("the reviewed maximum survives validation and storage", () => {
  assert.equal(normalizeState({ version: 1, limit: maximumChapter }).limit, maximumChapter);
});
test("preferences retain valid selections and discard malformed optional fields", () => {
  const value = normalizeState({ version: 1, limit: 4, characterId: "K", eventId: "selected-entry", layer: "dream", mapMode: "chapter", compared: ["K", "K", null, "bad id"], selected: false, legendOpen: true, showLocations: true, expanded: true, camera: { position: [24, 32, 36], target: [0, 0, 0], zoom: 1.2, overhead: false } });
  assert.deepEqual(value.compared, ["K"]);
  assert.equal(value.eventId, "selected-entry");
  assert.equal(value.layer, "dream");
  assert.equal(value.legendOpen, true);
  assert(!("selected" in value));
  assert.equal(value.camera.zoom, 1.2);
  const invalid = normalizeState({ version: 1, limit: 1, layer: "invented", characterId: {}, camera: { position: [Infinity, 0, 0] } });
  assert.equal(invalid.layer, "journey");
  assert.equal(invalid.characterId, "K");
  assert.equal(invalid.camera, null);
});
test("storage failures leave the atlas usable; only validated preferences are saved", () => {
  const blocked = { getItem() { throw new Error("denied"); }, setItem() { throw new Error("full"); } };
  assert.equal(readState(blocked), null);
  assert.doesNotThrow(() => writeState({ version: 1, limit: 1 }, blocked));
  let stored;
  writeState({ version: 1, limit: 1, privateNotes: "not a preference" }, { setItem(key, value) { assert.equal(key, STATE_KEY); stored = JSON.parse(value); } });
  assert(!("privateNotes" in stored));
});
