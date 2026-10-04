import test from "node:test";
import assert from "node:assert/strict";
import { getView, getChapterJournalFocus } from "../src/story.js";

const data = {
  chapters: [{ id: 1 }, { id: 2 }],
  characters: [{ id: "a", chapter: 1 }, { id: "b", chapter: 1 }],
  locations: [{ id: "x", chapter: 1, x: 0, z: 0 }, { id: "y", chapter: 1, x: 2, z: 3 }, { id: "unknown", chapter: 1 }],
  events: [
    { id: "early", chapter: 1, people: ["a"], actors: ["a"], route: ["x"], kind: "presence" },
    { id: "first", chapter: 2, people: ["a", "b"], actors: ["a"], route: ["x", "y"], routes: { b: ["x"] }, kind: "travel" },
    { id: "last", chapter: 2, people: ["a"], actors: ["a"], route: ["x"], kind: "presence" },
  ],
};

test("journal focus follows the selected participant's entry, with a ghost only before the final chapter entry", () => {
  const first = getChapterJournalFocus(getView(2, 1, "a", data, "all"));
  assert.equal(first.location.id, "y");
  assert.equal(first.ghost, true);
  const last = getChapterJournalFocus(getView(2, 2, "a", data, "all"));
  assert.equal(last.location.id, "x");
  assert.equal(last.ghost, false);
  const companion = getChapterJournalFocus(getView(2, 0, "b", data, "all"));
  assert.equal(companion.location.id, "x");
  assert.equal(companion.ghost, false);
});

test("focus never borrows another entry's location or a later chapter's position", () => {
  assert.equal(getChapterJournalFocus(getView(0, 0, "a", data, "all")), null);
  assert.equal(getChapterJournalFocus(getView(2, 0, "a", data, "all")), null);
  const unlocated = { ...data, events: [...data.events, { id: "unlocated", chapter: 2, people: ["a"], actors: ["a"], route: ["unknown"], kind: "presence" }] };
  assert.equal(getChapterJournalFocus(getView(2, 3, "a", unlocated, "all")), null);
  const dream = { ...data, events: [...data.events, { id: "dream", chapter: 2, people: ["a"], actors: ["a"], route: ["x"], kind: "dream", position: null }] };
  assert.equal(getChapterJournalFocus(getView(2, 3, "a", dream, "all")), null);
  assert.equal(getChapterJournalFocus(getView(1, 0, "a", data, "all")).ghost, false);
});
