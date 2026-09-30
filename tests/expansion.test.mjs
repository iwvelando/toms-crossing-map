import test from "node:test";
import assert from "node:assert/strict";
import { getView, combinePayloads } from "../src/story.js";
import { loadThrough } from "../src/chapters.js";

test("later chapter payloads require a committed boundary", async () => {
  const calls = [];
  const loaders = [1, 2, 3].map(id => async () => {
    calls.push(id);
    return { default: { chapters: [{ id }], characters: [], locations: [], events: [] } };
  });
  await loadThrough(0, loaders);
  assert.deepEqual(calls, []);
  await loadThrough(2, loaders);
  assert.deepEqual(calls, [1, 2]);
  await assert.rejects(loadThrough(99, loaders));
});

test("synthetic later labels, companions, notes and routes retract together", () => {
  const early = { chapters: [{ id: 1 }], characters: [{ id: "a", chapter: 1, name: "Early" }], locations: [{ id: "p", chapter: 1, name: "Early place", notes: [{ chapter: 1, text: "Early note" }, { chapter: 2, text: "Later note" }] }], events: [{ id: "first", chapter: 1, people: ["a"], actors: ["a"], route: ["p"], kind: "presence" }] };
  const later = { chapters: [{ id: 2 }], characters: [{ id: "b", chapter: 2, name: "Later" }], locations: [{ id: "q", chapter: 2, name: "Later place" }], eventAdditions: [{ id: "first", chapter: 2, people: ["b"], note: "Later identity" }], events: [{ id: "second", chapter: 2, people: ["a", "b"], actors: ["a", "b"], route: ["p", "q"], kind: "travel" }] };
  const data = combinePayloads([early, later]);
  assert.equal(getView(2, 1, "a", data).current.id, "second");
  const back = getView(1, 50, "a", data);
  assert.equal(back.current.id, "first");
  assert.deepEqual(back.characters.map(x => x.id), ["a"]);
  assert.deepEqual(back.locations.map(x => x.id), ["p"]);
  assert.equal(JSON.stringify(back).includes("Later"), false);
  assert.equal(getView(0, 50, "a", data).current, null);
  assert.deepEqual(getView(2, 1, "b", data).route, ["p", "q"]);
  assert.equal(getView(2, 0, "b", data).current.id, "first");
  assert.deepEqual(getView(2, 0, "unknown", data).locations, []);
});

test("presence, failed travel and plans never become completed routes", () => {
  const data = { chapters: [], characters: [{id: "a", chapter: 1}], locations: [{id: "p", chapter: 1}, {id: "q", chapter: 1}], events: [{id: "plan", chapter: 1, people: ["a"], actors: ["a"], route: ["p", "q"], kind: "plan", position: null}] };
  assert.equal(getView(1, 0, "a", data).position, null);
  assert.deepEqual(getView(1, 0, "a", data).drawnRoute, []);
});

test("shared scenes preserve each participant's route and movement kind", () => {
  const data = {
    chapters: [],
    characters: ["traveler", "observer", "unknown"].map(id => ({ id, chapter: 1 }))
      .concat({ id: "spirit", chapter: 1, spectral: true }),
    locations: [{ id: "start", chapter: 1, x: 0, z: 0 }, { id: "end", chapter: 1, x: 1, z: 1 }],
    events: [{ id: "shared", chapter: 1, people: ["traveler", "observer", "unknown", "spirit"],
      actors: ["traveler", "spirit"], route: ["start", "end"], routes: { observer: ["end"], unknown: [] }, kind: "travel" }],
  };
  const traveler = getView(1, 0, "traveler", data);
  assert.deepEqual(traveler.drawnRoute, ["start", "end"]);
  const observer = getView(1, 0, "observer", data);
  assert.equal(observer.current.kind, "presence");
  assert.deepEqual(observer.drawnRoute, []);
  assert.equal(observer.position, "end");
  assert.deepEqual(observer.locations.map(place => place.id), ["end"]);
  const unknown = getView(1, 0, "unknown", data);
  assert.deepEqual(unknown.route, []);
  assert.deepEqual(unknown.locations, []);
  assert.equal(unknown.position, null);
  assert.equal(getView(1, 0, "spirit", data).current, null);
  assert.equal(getView(1, 0, "spirit", data, "spectral").current.kind, "spectral");
  data.events[0].kind = "recollection";
  assert.equal(getView(1, 0, "spirit", data, "recollection").current.kind, "recollection");
  data.events[0].kind = "bodily relocation";
  assert.equal(getView(1, 0, "traveler", data).current.kind, "bodily relocation");
  assert.equal(getView(1, 0, "observer", data).current.kind, "presence");
});
