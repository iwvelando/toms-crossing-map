import { test, expect } from "@playwright/test";
import { openChapter, checkOverflow } from "./atlas-journey.js";
import { latestChapter } from "../helpers/atlas-cases.mjs";
import { loadThrough } from "../../src/chapters.js";
import { getLayerCharacters, getChapterOverview } from "../../src/story.js";
const data = await loadThrough(latestChapter);
const dreamChapter = data.chapters.findLast(chapter => getLayerCharacters(chapter.id, data, "dream", true).some(person => person.count)).id;

test("chapter comparison selects subsets, finds dreams, and retracts @usability", async ({ page }, testInfo) => {
  await openChapter(page, latestChapter);
  await page.locator("#map-mode").selectOption("chapter");
  await page.locator("#show-all").click();
  await expect(page.locator("#map")).toHaveAttribute("data-mode", "chapter");
  const boxes = page.locator("#path-characters input");
  expect(await boxes.count()).toBeGreaterThan(1);
  await expect(boxes.first()).toBeChecked();
  await page.locator("#show-none").click();
  await expect(page.locator("#map")).toHaveAttribute("data-pieces", "0");
  await expect(page.locator(".map-label")).toHaveCount(0);
  await boxes.first().check();
  await expect(page.locator("#comparison-status")).toContainText("1 selected");
  await boxes.first().focus();
  await boxes.first().press("Space");
  await expect(boxes.first()).toBeFocused();
  await expect(boxes.first()).not.toBeChecked();
  await page.locator("#show-all").click();
  await expect.poll(() => page.locator(".piece-label").count()).toBeGreaterThan(1);
  await page.locator("#show-locations").check();
  await expect.poll(() => page.locator(".map-label:not(.piece-label)").count()).toBeGreaterThan(0);
  await page.locator("#show-locations").uncheck();
  await checkOverflow(page);
  const toolbar = await page.locator(".map-toolbar").boundingBox();
  for (const label of await page.locator(".piece-label").all()) {
    const box = await label.boundingBox();
    if (box) expect(box.x + box.width <= toolbar.x || box.x >= toolbar.x + toolbar.width || box.y + box.height <= toolbar.y || box.y >= toolbar.y + toolbar.height).toBe(true);
  }
  await page.screenshot({ path: `test-results/${testInfo.project.name}-comparison.png`, fullPage: true });
  await page.locator("#layer-select").selectOption("dream");
  await expect(page.locator("#layer-status")).toContainText("character");
  await expect(page.locator("#map")).toHaveAttribute("data-route", "");
  await expect(page.locator("#comparison-status")).toContainText("0 with entries");
  await page.locator("#chapter-limit").click();
  await page.locator(`#chapter-option-${dreamChapter}`).click();
  await expect(page.locator("#load-status")).toHaveText("");
  await page.locator("#layer-select").selectOption("dream");
  await page.locator("#map-mode").selectOption("chapter");
  expect(await page.locator("#path-characters input:not(:disabled)").count()).toBeGreaterThan(0);
  await page.locator("#show-all").click();
  await expect(page.locator("#map")).toHaveAttribute("data-route", "");
  await page.locator("#expand-map").click();
  await expect(page.locator("main")).toHaveClass("expanded-map");
  await page.locator("#expand-map").click();
  await checkOverflow(page);
  await page.locator("#chapter-limit").click();
  await page.locator("#chapter-option-1").click();
  await expect(page.locator("#comparison")).toBeHidden();
  await page.locator("#chapter-limit").click();
  await page.locator("#chapter-option-0").click();
  await expect(page.locator("#path-characters")).toBeEmpty();
  await expect(page.locator("#map")).toHaveAttribute("data-pieces", "0");
  await expect(page.locator(".map-label")).toHaveCount(0);
});

test("layer discovery offers matching people without changing the layer @usability", async ({ page }) => {
  await openChapter(page, latestChapter);
  await page.locator("#layer-select").selectOption("dream");
  const option = page.locator("#character-select option").first();
  expect(await option.innerText()).toMatch(/· [1-9]\d* entr/);
  await page.locator("#character-select").selectOption(await option.getAttribute("value"));
  await expect(page.locator("#layer-select")).toHaveValue("dream");
  await expect(page.locator("#entry-detail h3")).not.toBeEmpty();
  await expect(page.locator("#map")).toHaveAttribute("data-route", "");
});

test("every chapter comparison preserves participant routes and exceptional layers @usability", async ({ page }) => {
  test.setTimeout(120000);
  for (const { id: chapter } of data.chapters) {
    await openChapter(page, chapter);
    await page.locator("#map-mode").selectOption("chapter");
    for (const layer of ["all", "journey", "dream", "plan", "spectral", "recollection"]) {
      await page.locator("#layer-select").selectOption(layer);
      const people = getLayerCharacters(chapter, data, layer, true).filter(person => person.count);
      if (people.length) await page.locator("#show-all").click();
      else await page.locator("#show-none").click();
      const expected = getChapterOverview(chapter, people.map(person => person.id), data, layer);
      await expect(page.locator("#map")).toHaveAttribute("data-route", expected.entries.flatMap(entry => entry.drawnRoute).join(","));
      const located = new Set(expected.entries.filter(entry => entry.locations.some(place => place.id === entry.position && Number.isFinite(place.x) && Number.isFinite(place.z))).map(entry => entry.selected.id));
      await expect(page.locator("#map")).toHaveAttribute("data-pieces", String(located.size));
      await checkOverflow(page);
    }
  }
});
