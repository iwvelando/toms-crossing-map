import test from "node:test";
import assert from "node:assert/strict";
import { createAtlasCases } from "./helpers/atlas-cases.mjs";
import { getView } from "../src/story.js";

test("large synthetic atlases retain exhaustive coverage in bounded browser cases", () => {
  const data = {
    chapters: Array.from({ length: 12 }, (_, index) => ({ id: index + 1 })),
    characters: [{ id: "K", chapter: 1 }, { id: "companion", chapter: 1 }, { id: "unlocated", chapter: 12 }],
    locations: [{ id: "place", chapter: 1 }],
    events: Array.from({ length: 1200 }, (_, index) => ({ id: `synthetic-${index}`, chapter: 1 + Math.floor(index / 100),
      people: ["K", "companion"], actors: ["K", "companion"], route: ["place"], kind: "presence" })),
  };
  const { chapterCases, participantCases } = createAtlasCases(data, 12);
  assert([...chapterCases, ...participantCases].every(entry => entry.steps.length > 0 && entry.steps.length <= 20));
  const disclosed = chapterCases.flatMap(entry => entry.steps.map(step => {
    const event = getView(entry.chapter, step.index, step.characterId, data, "all").current;
    assert.equal(event.chapter, entry.chapter);
    return event.id;
  }));
  assert.equal(disclosed.length, data.events.length);
  assert.equal(new Set(disclosed).size, data.events.length);
  const participantSteps = participantCases.flatMap(entry => entry.steps);
  for (const person of data.characters.slice(0, 2)) {
    const indices = participantSteps.filter(step => step.characterId === person.id).map(step => step.index);
    assert.deepEqual(indices, Array.from({ length: 1200 }, (_, index) => index));
  }
  assert.deepEqual(participantSteps.filter(step => step.characterId === "unlocated"), [{ characterId: "unlocated", index: null }]);
});

test("a chapter without new entries still gets a boundary check", () => {
  const data = { chapters: [{ id: 1 }, { id: 2 }], characters: [{ id: "K", chapter: 1 }], locations: [],
    events: [{ id: "early", chapter: 1, people: ["K"], actors: ["K"], route: [], kind: "presence" }] };
  assert.deepEqual(createAtlasCases(data, 2).chapterCases.map(entry => [entry.chapter, entry.steps]), [
    [1, [{ characterId: "K", index: 0 }]], [2, [{ characterId: "K", index: 0 }]],
  ]);
  for (const size of [0, -1, 1.5, NaN]) assert.throws(() => createAtlasCases(data, 2, size));
});
