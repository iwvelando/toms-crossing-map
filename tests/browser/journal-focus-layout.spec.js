import { test, expect } from "@playwright/test";
import { openChapter, checkOverflow, selectControl } from "./atlas-journey.js";
import { loadThrough } from "../../src/chapters.js";
import { getView } from "../../src/story.js";
import { latestChapter } from "../helpers/atlas-cases.mjs";

const data = await loadThrough(latestChapter);

for (const mode of ["entry", "chapter"]) test(`${mode} retains the followed character's earlier trail at intermediate opacity`, async ({ page }, testInfo) => {
  await openChapter(page, 1);
  await selectControl(page, "#map-mode", mode);
  if (mode === "chapter") await page.locator("#show-all").click();
  await selectControl(page, "#character-select", "K");
  await page.locator(".entry-button").nth(2).click();
  const rendered = () => page.locator("#map").evaluate(node => JSON.parse(node.dataset.renderedRoutes || "[]"));
  await expect.poll(async () => (await rendered()).find(route => route.event === "leaving-home" && route.character === "K")?.opacity).toBe(0.6);
  expect((await rendered()).find(route => route.event === "foothills" && route.character === "K")?.opacity).toBe(1);
  for (const route of (await rendered()).filter(route => route.character !== "K")) expect(route.opacity).toBe(0.22);
  await page.screenshot({ path: `test-results/${testInfo.project.name}-${mode}-trail.png`, fullPage: true });
  // Stepping backwards retracts history; later entries never become earlier trails.
  await page.locator(".entry-button").first().click();
  expect((await rendered()).filter(route => route.opacity === 0.6)).toEqual([]);
  if (mode === "entry") expect((await rendered()).map(route => route.event)).toEqual(["leaving-home"]);
  else {
    await page.locator("#show-none").click();
    await page.locator(".entry-button").nth(2).click();
    expect((await rendered()).find(route => route.event === "leaving-home")?.opacity).toBe(0.6);
  }
});

let sample;
let unlocated;
for (const { id: chapter } of data.chapters) {
  for (const person of getView(chapter, 0, "", data, "all").characters) {
    const view = getView(chapter, 0, person.id, data, "all");
    const entries = view.events.flatMap((event, index) => event.chapter === chapter ? [getView(chapter, index, person.id, data, "all")] : []);
    const last = entries.at(-1);
    const first = entries.find(entry => entry !== last && entry.position && entry.position !== last?.position && entry.locations.some(place => place.id === entry.position && Number.isFinite(place.x) && Number.isFinite(place.z)));
    if (first && last?.locations.some(place => place.id === last.position && Number.isFinite(place.x) && Number.isFinite(place.z))) { sample = { chapter, person, first, last, entries }; break; }
  }
  if (sample) break;
}
for (const { id: chapter } of data.chapters) {
  for (const person of getView(chapter, 0, "", data, "all").characters) {
    const view = getView(chapter, 0, person.id, data, "all");
    const events = view.events.filter(event => event.chapter === chapter);
    const index = events.findIndex(event => {
      const entry = getView(chapter, view.events.indexOf(event), person.id, data, "all");
      return !entry.locations.some(place => place.id === entry.position && Number.isFinite(place.x) && Number.isFinite(place.z));
    });
    if (index >= 0) { unlocated = { chapter, person, index }; break; }
  }
  if (unlocated) break;
}

test("comparison journal focus follows earlier entries while solid pieces stay put", async ({ page }, testInfo) => {
  await openChapter(page, sample.chapter);
  await selectControl(page, "#map-mode", "chapter");
  await page.locator("#show-all").click();
  await selectControl(page, "#character-select", sample.person.id);
  await page.locator(".entry-button").nth(sample.entries.indexOf(sample.first)).click();
  const solid = page.locator(`.piece-label:not(.journal-focus-label)[data-character="${sample.person.id}"]`);
  await expect(solid).toHaveAttribute("data-position", sample.last.position);
  const pieces = await page.locator("#map").getAttribute("data-pieces");
  await expect(page.locator("#map")).toHaveAttribute("data-focus-position", sample.first.position);
  await expect(page.locator("#map")).toHaveAttribute("data-focus-ghost", "false");
  const focus = page.locator(".journal-focus-label");
  await expect(focus).toHaveAttribute("data-character", sample.person.id);
  await expect(focus).toHaveAttribute("data-event", sample.first.current.id);
  await expect(page.locator(".journal-focus-marker")).toBeVisible();
  await expect(focus).toHaveCSS("opacity", "1");
  await expect(solid).toHaveCSS("opacity", "0.22");
  await expect(page.locator("#map")).toHaveAttribute("data-focus-route", sample.first.drawnRoute.join(","));

  await checkOverflow(page);
  await page.screenshot({ path: `test-results/${testInfo.project.name}-journal-focus.png`, fullPage: true });
  await page.locator(".entry-button").last().click();
  await expect(page.locator("#map")).toHaveAttribute("data-focus-ghost", "false");
  await expect(page.locator("#map")).toHaveAttribute("data-focus-position", sample.last.position);
  await expect(page.locator("#map")).toHaveAttribute("data-pieces", pieces);
  await expect(solid).toHaveAttribute("data-position", sample.last.position);
  await expect(solid).toHaveCSS("opacity", "1");
  await expect(page.locator("#map")).toHaveAttribute("data-history-positions", new RegExp(sample.first.position));
  // Following the journal is independent of the comparison checkbox set.
  await page.locator("#show-none").click();
  await page.locator(".entry-button").nth(sample.entries.indexOf(sample.first)).click();
  await expect(page.locator("#map")).toHaveAttribute("data-pieces", "0");
  await expect(focus).toBeVisible();
  await selectControl(page, "#map-mode", "entry");
  await expect(focus).toHaveCount(0);
  await expect(page.locator("#map")).toHaveAttribute("data-focus-position", "");
  await page.locator("#chapter-limit").click();
  await page.locator("#chapter-option-0").click();
  await expect(page.locator(".journal-focus-marker")).toHaveCount(0);
  await expect(page.locator("#map")).toHaveAttribute("data-pieces", "0");
});

test("journal arrows stay above changing entry content, and reduced motion keeps the focus still", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openChapter(page, sample.chapter);
  await selectControl(page, "#map-mode", "chapter");
  await page.locator("#show-all").click();
  await selectControl(page, "#character-select", sample.person.id);
  await page.locator(".step-controls").scrollIntoViewIfNeeded();
  const before = await page.locator("#next").boundingBox();
  const y = await page.evaluate(() => scrollY);
  await page.locator("#next").click();
  const after = await page.locator("#next").boundingBox();
  expect(after.y).toBeCloseTo(before.y, 0);
  expect(await page.evaluate(() => scrollY)).toBeCloseTo(y, 0);
  expect(await page.locator(".step-controls").evaluate(element => Boolean(element.compareDocumentPosition(document.querySelector("#entries")) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
  await expect(page.locator(".journal-focus-marker")).toHaveCSS("animation-name", "none");
});

test("character changes update journal focus; unlocated entries stay journal-only without a model download", async ({ page }) => {
  await page.route("**/models/kalin-pawn.glb", route => route.abort());
  await openChapter(page, sample.chapter);
  await expect(page.locator("#map")).toHaveAttribute("data-asset", "procedural");
  await selectControl(page, "#map-mode", "chapter");
  await page.locator("#show-all").click();
  await selectControl(page, "#character-select", sample.person.id);
  await page.locator(".entry-button").nth(sample.entries.indexOf(sample.first)).click();
  await expect(page.locator("#map")).toHaveAttribute("data-focus-ghost", "false");
  const other = getView(sample.chapter, 0, "", data, "all").characters.find(person => person.id !== sample.person.id && getView(sample.chapter, 0, person.id, data, "all").events.some(event => event.chapter === sample.chapter));
  await selectControl(page, "#character-select", other.id);
  await expect(page.locator(".journal-focus-label[data-character='" + sample.person.id + "']")).toHaveCount(0);
  await openChapter(page, unlocated.chapter);
  await selectControl(page, "#map-mode", "chapter");
  await page.locator("#show-all").click();
  await selectControl(page, "#character-select", unlocated.person.id);
  await page.locator(".entry-button").nth(unlocated.index).click();
  await expect(page.locator("#entry-detail h3")).not.toBeEmpty();
  await expect(page.locator("#journal-focus-status")).toContainText("no mapped position");
  await expect(page.locator("#map")).toHaveAttribute("data-focus-position", "");
  await expect(page.locator("#map")).toHaveAttribute("data-focus-ghost", "false");
  await expect(page.locator(".journal-focus-marker, .journal-focus-label")).toHaveCount(0);
});
