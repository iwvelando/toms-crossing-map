import test from "node:test";
import assert from "node:assert/strict";
import { getChapterOverview, getLayerCharacters } from "../src/story.js";

const data = {
  chapters: [{ id: 1 }, { id: 2 }],
  characters: [{ id: "a", chapter: 1 }, { id: "b", chapter: 1 }, { id: "future", chapter: 2 }],
  locations: [{ id: "x", chapter: 1, x: 0, z: 0, notes: [{ chapter: 2, text: "future" }] },
    { id: "y", chapter: 1, x: 1, z: 1 }, { id: "future-place", chapter: 2, x: 2, z: 2 }],
  events: [
    { id: "old", chapter: 1, people: ["a"], actors: ["a"], route: ["x", "y"], kind: "travel" },
    { id: "shared", chapter: 2, people: ["a", "b"], actors: ["a"], route: ["x", "y"], routes: { b: ["y"] }, kind: "travel" },
    { id: "dream", chapter: 2, people: ["b"], actors: ["b"], route: ["x", "future-place"], kind: "dream", position: null },
  ],
};

test("overview uses only the chosen chapter and selected participants' own routes", () => {
  const view = getChapterOverview(2, ["a", "b"], data, "all");
  assert.deepEqual(view.entries.map(entry => entry.current.id), ["shared", "shared", "dream"]);
  assert.deepEqual(view.entries[0].drawnRoute, ["x", "y"]);
  assert.deepEqual(view.entries[1].drawnRoute, []);
  assert.equal(view.entries[1].current.kind, "presence");
  assert.deepEqual(view.entries[2].drawnRoute, []);
  assert.equal(view.entries[2].position, null);
  assert(view.entries.every(entry => entry.current.chapter === 2));
  assert.deepEqual(getChapterOverview(2, ["a"], data, "all").entries.map(entry => entry.selected.id), ["a"]);
  assert.deepEqual(getChapterOverview(2, [], data, "all").locations, []);
});

test("comparison and layer counts retract future people, locations and notes", () => {
  for (const limit of [0, -1, 99, NaN, 1.5]) {
    const view = getChapterOverview(limit, ["a", "b", "future"], data, "all");
    assert.deepEqual(view.entries, []);
    assert.deepEqual(view.locations, []);
    assert.deepEqual(view.characters, []);
    assert.deepEqual(getLayerCharacters(limit, data, "all"), []);
  }
  const early = getChapterOverview(1, ["a", "future"], data, "all");
  assert(!JSON.stringify(early).includes("future"));
  assert.deepEqual(getLayerCharacters(2, data, "dream").map(person => [person.id, person.count]), [["a", 0], ["b", 1], ["future", 0]]);
  assert.deepEqual(getLayerCharacters(2, data, "all", true).map(person => person.count), [1, 2, 0]);
});
