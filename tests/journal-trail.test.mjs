import test from "node:test";
import assert from "node:assert/strict";
import { getView, getJournalTrail } from "../src/story.js";
import { loadThrough, maximumChapter } from "../src/chapters.js";

const data = await loadThrough(maximumChapter);

test("journal history respects participant, layer, chapter scope and backwards navigation", () => {
  for (const chapter of data.chapters) for (const person of getView(chapter.id, 0, "", data).characters) {
    for (const layer of ["all", "journey", "dream"]) {
      const view = getView(chapter.id, 0, person.id, data, layer);
      const last = getView(chapter.id, view.events.length - 1, person.id, data, layer);
      for (const chapterOnly of [false, true]) {
        const trail = getJournalTrail(last, data, layer, chapterOnly);
        const expected = last.events.slice(0, last.index).filter(event => !chapterOnly || event.chapter === chapter.id);
        assert.deepEqual(trail.map(entry => entry.current.id), expected.map(event => event.id));
        for (const entry of trail) {
          assert.equal(entry.selected.id, person.id);
          assert(entry.locations.every(place => place.chapter <= chapter.id));
          if (["dream", "plan", "presence", "failed ascent"].includes(entry.current.kind)) assert.deepEqual(entry.drawnRoute, []);
        }
      }
      assert.deepEqual(getJournalTrail(view, data, layer), []);
    }
  }
  assert.deepEqual(getJournalTrail(getView(0, 20, "K", data), data), []);
  const empty = { ...getView(1, 10, "K", data), current: null };
  assert.deepEqual(getJournalTrail(empty, data), []);
});
