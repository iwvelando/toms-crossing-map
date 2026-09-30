import test from "node:test";
import assert from "node:assert/strict";
import { getView } from "../src/story.js";
import { loadThrough, maximumChapter } from "../src/chapters.js";
const data = await loadThrough(maximumChapter);
test("closed boundary exposes no objects even with every payload cached", () => {
  for (const limit of [0, -1, 99, NaN, 1.5]) for (const step of [-1, 0, 100, NaN]) {
    const view = getView(limit, step, "K", data, "all");
    assert.equal(view.current, null);
    for (const key of ["events", "locations", "characters", "traversed", "chapters", "route", "drawnRoute"]) assert.deepEqual(view[key], []);
  }
});
test("stable first movements and selected-entry geometry retract", () => {
  assert.deepEqual(getView(1, 0, "K", data).locations.map(x => x.id), ["HOME-A", "PARK-K", "WILLOW-OAK"]);
  assert.equal(getView(1, 1, "K", data).current.id, "paddock");
  assert.equal(getView(1, 2, "K", data).current.id, "foothills");
  assert(getView(1, 2, "K", data).locations.some(x => x.id === "SHORE"));
  assert(!getView(1, 0, "K", data).locations.some(x => x.id === "SHORE"));
});
test("all participant routes resolve without future names, coordinates or notes", () => {
  for (const event of data.events) {
    assert(!("evidence" in event));
    assert(!("track" in event));
    for (const id of event.people) {
      const person = data.characters.find(x => x.id === id);
      assert(person && person.chapter <= event.chapter, `${event.id}: person ${id}`);
      const allowed = getView(event.chapter, 0, id, data, "all").events;
      const index = allowed.findIndex(x => x.id === event.id);
      assert(index >= 0);
      const view = getView(event.chapter, index, id, data, "all");
      for (const place of view.locations) assert(place.notes.every(note => note.chapter <= event.chapter));
      for (const placeId of [...event.route, ...view.route]) {
        const place = data.locations.find(x => x.id === placeId);
        assert(place && place.chapter <= event.chapter, `${event.id}: place ${placeId}`);
      }
      for (const placeId of view.drawnRoute) assert(Number.isFinite(view.locations.find(x => x.id === placeId).x));
    }
  }
  for (const collection of ["events", "locations", "characters", "chapters"]) assert.equal(new Set(data[collection].map(x => x.id)).size, data[collection].length);
  assert.equal(data.chapters.at(-1).partial, true);
});
