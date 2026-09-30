import "./style.css";
import { getView } from "./story.js";
import { createMap } from "./map.js";
import { createChapterPicker } from "./chapter-picker.js";

const $ = (selector) => document.querySelector(selector);
let limit = 0,
  step = 0,
  selected = true,
  map;
const chapterPicker = createChapterPicker($("#chapter-picker"), setLimit);
function selectStep(index) {
  step = index;
  selected = true;
  render();
}
try {
  map = createMap($("#map"), $("#map-labels"), selectStep);
} catch (error) {
  console.warn("3D map unavailable:", error);
  $("#map-fallback").hidden = false;
  document
    .querySelectorAll(".map-toolbar button")
    .forEach((button) => (button.disabled = true));
}
function render() {
  const view = getView(limit, step);
  step = view.index;
  chapterPicker.setValue(limit);
  $("#locked-state").hidden = Boolean(view.current);
  $("#unlocked-state").hidden = !view.current;
  $("#entries").replaceChildren();
  $("#entry-detail").replaceChildren();
  if (view.current) {
    view.events.forEach((event, index) => {
      const li = document.createElement("li"),
        button = document.createElement("button");
      button.className = "entry-button";
      button.innerHTML = `<span class="entry-number">${String(index + 1).padStart(2, "0")}</span><span>${event.title}</span>`;
      if (index === step) button.setAttribute("aria-current", "step");
      button.onclick = () => selectStep(index);
      li.append(button);
      $("#entries").append(li);
    });
    const event = view.current;
    $("#entry-detail").innerHTML =
      `<span class="entry-time">${event.time}</span><h3>${event.title}</h3><span class="mode">${event.mode}</span><p>${event.summary}</p><details><summary>What the map can establish</summary><p>${event.note}</p></details><span class="chapter-reference">Chapter One · Paddock B</span>`;
    $("#step-count").textContent =
      `MOVEMENT ${step + 1} OF ${view.events.length}`;
    $("#previous").disabled = step === 0;
    $("#next").disabled = step === view.events.length - 1;
    $("#character").setAttribute("aria-pressed", String(selected));
    $("#character small").textContent = selected
      ? "Selected character"
      : "Route hidden · click to show";
  }
  map?.update(view, selected);
}
function setLimit(value) {
  limit = value === 1 ? 1 : 0;
  step = 0;
  selected = true;
  render();
}
$("#begin").onclick = () => setLimit(1);
$("#previous").onclick = () => selectStep(step - 1);
$("#next").onclick = () => selectStep(step + 1);
$("#character").onclick = () => {
  selected = !selected;
  render();
};
$("#zoom-in").onclick = () => map?.zoom(1.2);
$("#zoom-out").onclick = () => map?.zoom(1 / 1.2);
$("#view-top").onclick = () =>
  $("#view-top").setAttribute("aria-pressed", String(map?.toggleTop()));
$("#reset-view").onclick = () => {
  map?.reset();
  $("#view-top").setAttribute("aria-pressed", "false");
};
$("#about-button").onclick = () => $("#about").showModal();
$("#close-about").onclick = () => $("#about").close();
$("#about").addEventListener("click", (event) => {
  if (event.target === $("#about")) {
    const rect = $("#about").getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      $("#about").close();
  }
});
// Intentionally no stored reading progress or URL-controlled unlocks.
render();
