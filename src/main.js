import "./style.css";
import { getView, combinePayloads, getLayerCharacters, getChapterOverview, getChapterJournalFocus, getJournalTrail } from "./story.js";
import { pieceStyle } from "./pieces.js";
import { loadThrough } from "./chapters.js";
import { createMap } from "./map.js";
import { createSelectPicker } from "./picker.js";
import { createChapterPicker } from "./chapter-picker.js";
import { readState, writeState } from "./preferences.js";
import { createThemeControl } from "./theme.js";

const $ = selector => document.querySelector(selector);
let limit = 0, step = 0, characterId = "K", layer = "journey", map;
let data = combinePayloads([]), revision = 0, loading = false, loadError = false;
let mapMode = "entry", compared = new Set(["K"]);
let showLocations = false;
let journalIndices = [];
let initialized = false, eventId = null, detailsOpen = false, cameraSaveTimer;
const savedState = readState();
const layerLabels = new Map([...$("#layer-select").options].map(option => [option.value, option.textContent]));
function stateSnapshot() {
  return { version: 1, limit, characterId, eventId, layer, mapMode, compared: [...compared], showLocations, legendOpen: $("#legend").open,
    expanded: $("main").classList.contains("expanded-map"), detailsOpen, camera: map?.getCamera() ?? savedState?.camera ?? null };
}
function persistState() {
  if (!initialized || loading || loadError) return;
  writeState(stateSnapshot());
}
function scheduleCameraSave() {
  clearTimeout(cameraSaveTimer);
  cameraSaveTimer = setTimeout(persistState, 150);
}
const selectPickers = ["#map-mode", "#layer-select", "#character-select"].map(id => createSelectPicker($(id)));
const chapterPicker = createChapterPicker($("#chapter-picker"), setLimit);
function selectStep(index, personId) { if (personId) characterId = personId; step = index; render(); }
try { map = createMap($("#map"), $("#map-labels"), selectStep, scheduleCameraSave); }
catch (error) {
  console.warn("3D map unavailable:", error);
  $("#map-fallback").hidden = false;
  document.querySelectorAll(".map-toolbar button").forEach(button => button.disabled = true);
}
createThemeControl(theme => map?.setTheme(theme));
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = text;
  return node;
}
function render() {
  const focusedPath = document.activeElement?.closest("#path-characters") ? document.activeElement.value : null;
  let view = getView(limit, step, characterId, data, layer);
  if (mapMode === "chapter" && view.current?.chapter !== limit) {
    const first = view.events.findIndex(event => event.chapter === limit);
    view = getView(limit, first < 0 ? 0 : first, characterId, data, layer);
  }
  const participants = getLayerCharacters(limit, data, layer, mapMode === "chapter");
  // Keep empty journals selectable, but put people with entries first.
  const matching = participants.filter(person => person.count > 0);
  const ordered = [...matching, ...participants.filter(person => !person.count)];
  const overview = getChapterOverview(limit, compared, data, layer);
  journalIndices = view.events.flatMap((event, index) => mapMode === "entry" || event.chapter === limit ? [index] : []);
  // A participant with no entries in this chapter has an empty comparison journal.
  if (mapMode === "chapter" && !journalIndices.length) view = { ...view, current: null, route: [], drawnRoute: [], position: null, locations: [] };
  step = view.index;
  eventId = view.current?.id ?? null;
  chapterPicker.setValue(limit, view.chapters);
  $("#locked-state").hidden = limit > 0;
  $("#unlocked-state").hidden = limit === 0;
  $("#entries").replaceChildren();
  $("#entry-detail").replaceChildren();
  $("#character-select").replaceChildren(...ordered.map(person => {
    const option = element("option", "", `${person.name} · ${person.count} ${person.count === 1 ? "entry" : "entries"}`);
    option.value = person.id;
    return option;
  }));
  $("#character-select").value = characterId;
  $("#character-select").disabled = loading;
  $("#layer-select").value = layer;
  for (const option of $("#layer-select").options) {
    const count = getLayerCharacters(limit, data, option.value, mapMode === "chapter").filter(person => person.count).length;
    option.textContent = `${layerLabels.get(option.value)} · ${count} ${count === 1 ? "character" : "characters"}`;
  }
  $("#layer-select").disabled = loading;
  $("#map-mode").disabled = loading;
  $("#layer-status").textContent = limit && !loading ? `${matching.length} ${matching.length === 1 ? "character" : "characters"} · ${mapMode === "chapter" ? "This chapter only" : "Through your reading limit"}` : "";
  $("#map-mode").value = mapMode;
  $("#show-locations").checked = showLocations;
  $("#comparison").hidden = mapMode !== "chapter";
  $("#path-characters").replaceChildren();
  const chapterPeople = overview.characters.filter(person => person.count);
  if (limit && !loading) for (const person of chapterPeople) {
    const row = element("label", "path-character", "");
    const input = document.createElement("input");
    input.type = "checkbox"; input.value = person.id;
    input.checked = Boolean(person.count && compared.has(person.id)); input.disabled = !person.count;
    input.onchange = () => { input.checked ? compared.add(person.id) : compared.delete(person.id); render(); };
    const style = pieceStyle(person.id, view.characters);
    const badge = element("span", `piece-badge piece-${style.shape}`, String(style.number));
    badge.style.setProperty("--piece-color", style.color);
    row.append(input, badge, element("span", "", person.name), element("small", "", String(person.count)));
    $("#path-characters").append(row);
  }
  if (focusedPath) [...$("#path-characters").querySelectorAll("input")].find(input => input.value === focusedPath)?.focus({ preventScroll: true });
  const chosenPeople = chapterPeople.filter(person => compared.has(person.id));
  $("#comparison-status").textContent = `${chosenPeople.length} selected · ${chapterPeople.length} with entries in this chapter and layer`;
  $("#comparison-summary").textContent = `Choose paths · ${chosenPeople.length} of ${chapterPeople.length} selected`;
  $("#show-all").disabled = loading || !chapterPeople.length;
  $("#show-none").disabled = loading;
  $("#empty-state").hidden = Boolean(view.current) || loading || loadError;
  $("#load-status").textContent = loading ? "Opening selected chapters…" : loadError ? "The chapter could not be opened. Reload the page to retry." : "";
  $("#character-select-label").textContent = mapMode === "chapter" ? "Follow in journal · character or companion" : "Character or companion";
  const boundary = view.chapters.at(-1);
  $(".chapter-heading .eyebrow").textContent = boundary?.label || "";
  $(".chapter-heading h2").textContent = boundary?.title || "";
  $(".chapter-heading p").textContent = boundary?.scope || "";
  const journalIndex = journalIndices.indexOf(step);
  $("#step-count").textContent = view.current ? `ENTRY ${journalIndex + 1} OF ${journalIndices.length}` : "NO ENTRY";
  $("#previous").disabled = !view.current || journalIndex <= 0;
  $("#next").disabled = !view.current || journalIndex === journalIndices.length - 1;
  const focus = mapMode === "chapter" ? getChapterJournalFocus(view) : null;
  $("#journal-focus-status").hidden = mapMode !== "chapter" || !view.current;
  $("#journal-focus-status").textContent = focus ? `◎ Selected journal entry: ${focus.location.name}. Earlier entries in this journal are softly visible; other chapter paths are fainter.` : "This entry has no mapped position; the journal retains the account.";
  if (view.current) {
    journalIndices.forEach((index, number) => {
      const event = view.events[index];
      const li = document.createElement("li"), button = document.createElement("button");
      button.className = "entry-button";
      button.append(element("span", "entry-number", String(number + 1).padStart(2, "0")), element("span", "", event.title));
      if (index === step) button.setAttribute("aria-current", "step");
      button.onclick = () => selectStep(index);
      li.append(button); $("#entries").append(li);
    });
    const event = view.current;
    const details = document.createElement("details");
    details.open = detailsOpen;
    details.ontoggle = () => {
      if (!details.isConnected) return;
      detailsOpen = details.open; persistState();
    };
    details.append(element("summary", "", "What the map can establish"), element("p", "", event.note));
    details.append(element("p", "", "The current entry is fully visible, with earlier entries in this journal softly visible behind it. Chapter comparison adds selected participants’ separate entries in that chapter. All coordinates, bends, distances and terrain are illustrative; positions record observations, not continued presence."));
    for (const place of view.locations) {
      for (const note of place.notes) details.append(element("p", "", `${place.name}: ${note.text}`));
    }
    const people = event.people.map(id => view.characters.find(person => person.id === id)?.name).filter(Boolean);
    const placeNames = view.route.map(id => view.locations.find(p => p.id === id)?.name).filter(Boolean);
    $("#entry-detail").append(element("span", "entry-time", event.time), element("h3", "", event.title),
      element("span", "mode", event.mode), element("p", "", event.summary), element("p", "participants", people.join(" · ")),
      element("p", "place-sequence", placeNames.length ? placeNames.join(" → ") : "Location or route not established."),
      details, element("span", "chapter-reference", event.reference));
  }
  const trail = getJournalTrail(view, data, layer, mapMode === "chapter");
  map?.update(view, true, mapMode === "chapter" ? { ...overview, showLocations } : null, trail);
  $(".map-key").replaceChildren();
  const keyPeople = mapMode === "chapter" ? chosenPeople : view.selected ? [view.selected] : [];
  for (const person of keyPeople) {
    const identity = pieceStyle(person.id, view.characters);
    const button = element("button", "legend-person", "");
    button.style.setProperty("--piece-color", identity.color);
    if (person.id === characterId) button.setAttribute("aria-current", "true");
    button.append(element("span", `piece-badge piece-${identity.shape}`, String(identity.number)), element("span", "", person.name));
    button.onclick = () => { characterId = person.id; step = 0; render(); };
    $(".map-key").append(button);
  }
  $("#legend").hidden = !keyPeople.length;
  selectPickers.forEach(picker => picker.sync());
  persistState();
}
async function setLimit(value, restored = null) {
  const ownRevision = ++revision;
  limit = Number.isInteger(value) && value >= 0 && value <= 12 ? value : 0;
  step = 0; characterId = "K"; layer = "journey";
  mapMode = "entry"; compared = new Set(["K"]);
  detailsOpen = false;
  if (restored) {
    $("#legend").open = restored.legendOpen;
    showLocations = restored.showLocations; detailsOpen = restored.detailsOpen;
    $("main").classList.toggle("expanded-map", restored.expanded);
    $("#expand-map").setAttribute("aria-pressed", String(restored.expanded));
    if (restored.camera) {
      map?.restoreCamera(restored.camera);
      $("#view-top").setAttribute("aria-pressed", String(restored.camera.overhead));
    }
  }
  $("#comparison-options").open = false;
  data = combinePayloads([]); loadError = false; loading = limit > 0;
  eventId = null;
  // Record an explicit reading-limit choice even if its download is interrupted.
  if (initialized && !restored) writeState(stateSnapshot());
  render();
  if (!limit) return;
  try {
    const next = await loadThrough(limit);
    if (ownRevision !== revision) return;
    data = next;
    if (restored) {
      const people = getView(limit, 0, "", data, "all").characters;
      const ids = new Set(people.map(person => person.id));
      characterId = ids.has(restored.characterId) ? restored.characterId : ids.has("K") ? "K" : people[0]?.id || "K";
      layer = restored.layer; mapMode = restored.mapMode;
      compared = new Set(restored.compared.filter(id => ids.has(id)));
      step = Math.max(0, getView(limit, 0, characterId, data, layer).events.findIndex(event => event.id === restored.eventId));
    }
  } catch (error) {
    if (ownRevision !== revision) return;
    console.warn("Chapter loading unavailable:", error);
    loadError = true;
  }
  loading = false; render();
}
$("#begin").onclick = () => setLimit(1);
$("#previous").onclick = () => selectStep(journalIndices[journalIndices.indexOf(step) - 1]);
$("#next").onclick = () => selectStep(journalIndices[journalIndices.indexOf(step) + 1]);
$("#character-select").onchange = event => { characterId = event.target.value; step = 0; render(); };
$("#layer-select").onchange = event => {
  layer = event.target.value; step = 0;
  const people = getLayerCharacters(limit, data, layer, mapMode === "chapter");
  if (!people.find(person => person.id === characterId)?.count) characterId = people.find(person => person.count)?.id || characterId;
  render();
};
$("#map-mode").onchange = event => {
  mapMode = event.target.value;
  const people = getLayerCharacters(limit, data, layer, mapMode === "chapter");
  if (!people.find(person => person.id === characterId)?.count) {
    characterId = people.find(person => person.count)?.id || characterId;
    step = 0;
  }
  compared.add(characterId); render();
};
$("#show-all").onclick = () => { compared = new Set(getLayerCharacters(limit, data, layer, true).filter(person => person.count).map(person => person.id)); render(); };
$("#show-none").onclick = () => { compared.clear(); render(); };
$("#show-locations").onchange = event => { showLocations = event.target.checked; render(); };
$("#legend").ontoggle = persistState;
$("#zoom-in").onclick = () => map?.zoom(1.2);
$("#zoom-out").onclick = () => map?.zoom(1 / 1.2);
$("#view-top").onclick = () => $("#view-top").setAttribute("aria-pressed", String(map?.toggleTop()));
$("#reset-view").onclick = () => { map?.reset(); $("#view-top").setAttribute("aria-pressed", "false"); };
$("#expand-map").onclick = () => {
  const expanded = $("main").classList.toggle("expanded-map");
  $("#expand-map").setAttribute("aria-pressed", String(expanded));
  persistState();
};
$("#about-button").onclick = () => $("#about").showModal();
$("#close-about").onclick = () => $("#about").close();
$("#about").addEventListener("click", event => {
  if (event.target === $("#about")) {
    const rect = $("#about").getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) $("#about").close();
  }
});
// URLs cannot advance the boundary. Restore only validated saved preferences;
// lazy loading and per-field disclosure still follow that explicit reading limit.
window.addEventListener("pagehide", persistState);
render();
await setLimit(savedState?.limit ?? 0, savedState);
initialized = true;
persistState();
