import "./style.css";
import { getView, combinePayloads } from "./story.js";
import { loadThrough } from "./chapters.js";
import { createMap } from "./map.js";
import { createChapterPicker } from "./chapter-picker.js";

const $ = selector => document.querySelector(selector);
let limit = 0, step = 0, selected = true, characterId = "K", layer = "journey", map;
let data = combinePayloads([]), revision = 0, loading = false, loadError = false;
const chapterPicker = createChapterPicker($("#chapter-picker"), setLimit);
function selectStep(index) { step = index; selected = true; render(); }
try { map = createMap($("#map"), $("#map-labels"), selectStep); }
catch (error) {
  console.warn("3D map unavailable:", error);
  $("#map-fallback").hidden = false;
  document.querySelectorAll(".map-toolbar button").forEach(button => button.disabled = true);
}
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = text;
  return node;
}
function render() {
  const view = getView(limit, step, characterId, data, layer);
  step = view.index;
  chapterPicker.setValue(limit, view.chapters);
  $("#locked-state").hidden = limit > 0;
  $("#unlocked-state").hidden = limit === 0;
  $("#entries").replaceChildren();
  $("#entry-detail").replaceChildren();
  $("#character-select").replaceChildren(...view.characters.map(person => {
    const option = element("option", "", person.name);
    option.value = person.id;
    return option;
  }));
  $("#character-select").value = characterId;
  $("#character-select").disabled = loading;
  $("#layer-select").value = layer;
  $("#empty-state").hidden = Boolean(view.current) || loading || loadError;
  $("#load-status").textContent = loading ? "Opening selected chapters…" : loadError ? "The chapter could not be opened. Reload the page to retry." : "";
  $("#character .avatar").textContent = view.selected?.initial || "";
  $("#character strong").textContent = view.selected?.name || "";
  $("#character").setAttribute("aria-pressed", String(selected));
  $("#character small").textContent = selected ? "Selected character" : "Route hidden · click to show";
  const boundary = view.chapters.at(-1);
  $(".chapter-heading .eyebrow").textContent = boundary?.label || "";
  $(".chapter-heading h2").textContent = boundary?.title || "";
  $(".chapter-heading p").textContent = boundary?.scope || "";
  $("#step-count").textContent = view.current ? `ENTRY ${step + 1} OF ${view.events.length}` : "NO ENTRY";
  $("#previous").disabled = !view.current || step === 0;
  $("#next").disabled = !view.current || step === view.events.length - 1;
  if (view.current) {
    view.events.forEach((event, index) => {
      const li = document.createElement("li"), button = document.createElement("button");
      button.className = "entry-button";
      button.append(element("span", "entry-number", String(index + 1).padStart(2, "0")), element("span", "", event.title));
      if (index === step) button.setAttribute("aria-current", "step");
      button.onclick = () => selectStep(index);
      li.append(button); $("#entries").append(li);
    });
    const event = view.current;
    const details = document.createElement("details");
    details.append(element("summary", "", "What the map can establish"), element("p", "", event.note));
    details.append(element("p", "", "Lines show only the selected entry. All coordinates, bends, distances and terrain are illustrative; a position records an observation, not continued presence."));
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
  map?.update(view, selected);
}
async function setLimit(value) {
  const ownRevision = ++revision;
  limit = Number.isInteger(value) && value >= 0 && value <= 12 ? value : 0;
  step = 0; selected = true; characterId = "K"; layer = "journey";
  data = combinePayloads([]); loadError = false; loading = limit > 0;
  render();
  if (!limit) return;
  try {
    const next = await loadThrough(limit);
    if (ownRevision !== revision) return;
    data = next;
  } catch (error) {
    if (ownRevision !== revision) return;
    console.warn("Chapter loading unavailable:", error);
    loadError = true;
  }
  loading = false; render();
}
$("#begin").onclick = () => setLimit(1);
$("#previous").onclick = () => selectStep(step - 1);
$("#next").onclick = () => selectStep(step + 1);
$("#character-select").onchange = event => { characterId = event.target.value; step = 0; layer = "all"; selected = true; render(); };
$("#layer-select").onchange = event => { layer = event.target.value; step = 0; render(); };
$("#character").onclick = () => { selected = !selected; render(); };
$("#zoom-in").onclick = () => map?.zoom(1.2);
$("#zoom-out").onclick = () => map?.zoom(1 / 1.2);
$("#view-top").onclick = () => $("#view-top").setAttribute("aria-pressed", String(map?.toggleTop()));
$("#reset-view").onclick = () => { map?.reset(); $("#view-top").setAttribute("aria-pressed", "false"); };
$("#about-button").onclick = () => $("#about").showModal();
$("#close-about").onclick = () => $("#about").close();
$("#about").addEventListener("click", event => {
  if (event.target === $("#about")) {
    const rect = $("#about").getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) $("#about").close();
  }
});
// No URL or storage can advance the reading boundary; stale loads cannot restore it.
render();
