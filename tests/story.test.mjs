import test from "node:test";
import assert from "node:assert/strict";
import { getView, events, locations, chapter } from "../src/story.js";
test("closed boundary exposes no story objects at any requested step", () => {
  for (const step of [-1, 0, 2, 100, NaN]) {
    const view = getView(0, step);
    assert.equal(view.current, null);
    assert.deepEqual(view.events, []);
    assert.deepEqual(view.locations, []);
    assert.deepEqual(view.characters, []);
    assert.deepEqual(view.traversed, []);
  }
});
test("locations and routes reveal monotonically with movement, and retract", () => {
  assert.deepEqual(
    getView(1, 0).locations.map((x) => x.id),
    ["HOME-A", "PARK-K", "WILLOW-OAK"],
  );
  assert.equal(
    getView(1, 1).locations.some((x) => x.id === "SHORE"),
    false,
  );
  assert.equal(
    getView(1, 2).locations.some((x) => x.id === "SHORE"),
    true,
  );
  assert.equal(getView(1, 0).traversed.length, 1);
  assert.equal(getView(1, 99).index, 2);
  assert.equal(getView(1, -10).index, 0);
});
test("every route resolves to supported, revealed locations and chapter boundaries", () => {
  for (const [index, event] of events.entries()) {
    assert.equal(event.chapter, 1);
    assert.equal(event.character, "K");
    for (const id of event.route) {
      const place = locations.find((x) => x.id === id);
      assert(place);
      assert(place.reveal <= index);
    }
    assert.equal(event.chapter, chapter.id);
    assert(!("evidence" in event));
    assert(!("track" in chapter));
  }
});
test("unknown characters cannot expose routes or locations", () => {
  const view = getView(1, 2, "unknown");
  assert.equal(view.current, null);
  assert.deepEqual(view.locations, []);
  assert.deepEqual(view.traversed, []);
});
