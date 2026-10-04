import { test, expect } from "@playwright/test";
import { openChapter, checkOverflow, selectControl } from "./atlas-journey.js";
const key = "toms-crossing-map.state";

test("themes follow the system until a saved toggle overrides it", async ({ page }, testInfo) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.locator("#theme-toggle").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.locator("#begin").click();
  await expect(page.locator("#entry-detail h3")).not.toBeEmpty();
  await checkOverflow(page);
  await page.screenshot({ path: `test-results/${testInfo.project.name}-light-theme.png`, fullPage: true });
  await page.locator("#theme-toggle").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.screenshot({ path: `test-results/${testInfo.project.name}-dark-theme.png`, fullPage: true });
  await page.locator("#theme-system").click();
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("reading progress and journal selections restore automatically, and backtracking persists", async ({ page }) => {
  await openChapter(page, 1);
  await page.locator(".entry-button").nth(1).click();
  const title = await page.locator("#entry-detail h3").innerText();
  // Old hidden-character preferences must not hide the followed participant.
  await page.evaluate(key => { const state = JSON.parse(localStorage.getItem(key)); state.selected = false; localStorage.setItem(key, JSON.stringify(state)); }, key);
  await page.reload();
  await page.locator("#view-top").click();
  await page.locator("#expand-map").click();
  await page.reload();
  await expect(page.locator("#entry-detail h3")).toHaveText(title);
  await expect(page.locator("#layer-select")).toHaveValue("all");
  await expect(page.locator("#character")).toHaveCount(0);
  await expect(page.locator("#map")).toHaveAttribute("data-pieces", "1");
  await expect(page.locator("#view-top")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("main")).toHaveClass("expanded-map");
  await page.locator("#chapter-limit").click();
  await page.locator("#chapter-option-0").click();
  await page.reload();
  await expect(page.locator("#locked-state")).toBeVisible();
  await expect(page.locator(".map-label")).toHaveCount(0);
});

test("comparison choices and optional labels survive reload", async ({ page }) => {
  await openChapter(page, 1);
  await selectControl(page, "#map-mode", "chapter");
  await page.locator("#show-all").click();
  await page.locator("#comparison-summary").click();
  const inputs = page.locator("#path-characters input:not(:disabled)");
  await inputs.first().uncheck();
  await page.locator("#show-locations").check();
  const chosen = await inputs.evaluateAll(nodes => nodes.filter(node => node.checked).map(node => node.value));
  const person = await page.locator("#character-select option").last().getAttribute("value");
  await selectControl(page, "#character-select", person);
  await page.reload();
  await expect(page.locator("#map-mode")).toHaveValue("chapter");
  await expect(page.locator("#show-locations")).toBeChecked();
  await expect(page.locator("#character-select")).toHaveValue(person);
  expect(await inputs.evaluateAll(nodes => nodes.filter(node => node.checked).map(node => node.value))).toEqual(chosen);
});

test("invalid saved boundaries and unavailable storage fall back safely", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(key => localStorage.setItem(key, JSON.stringify({ version: 1, limit: 99 })), key);
  await page.reload();
  await expect(page.locator("#locked-state")).toBeVisible();
  await page.addInitScript(() => {
    Storage.prototype.getItem = Storage.prototype.setItem = () => { throw new Error("Unavailable"); };
  });
  await page.reload();
  await page.locator("#theme-toggle").click();
  await page.locator("#begin").click();
  await expect(page.locator("#entry-detail h3")).not.toBeEmpty();
});

test("saved IDs cannot reveal participants or entries outside the saved reading limit", async ({ page }) => {
  await page.addInitScript(key => localStorage.setItem(key, JSON.stringify({ version: 1, limit: 1, characterId: "future-id", eventId: "future-entry", compared: ["future-id"], layer: "all" })), key);
  const chapters = new Set();
  page.on("request", request => {
    const match = request.url().match(/chapter-(\d+)/);
    if (match) chapters.add(Number(match[1]));
  });
  await page.goto("/");
  await expect(page.locator("#entry-detail h3")).not.toBeEmpty();
  await expect(page.locator("#character-select")).toHaveValue("K");
  expect([...chapters]).toEqual([1]);
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
  expect(saved.compared).toEqual([]);
  expect(saved.eventId).not.toBe("future-entry");
});

test("reported progress is saved even when a chapter download fails", async ({ page }) => {
  await page.goto("/");
  await page.route("**/chapter-02-*.js", route => route.abort());
  await page.locator("#chapter-limit").click();
  await page.locator("#chapter-option-2").click();
  await expect(page.locator("#load-status")).toContainText("could not be opened");
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).limit, key)).toBe(2);
  await page.unroute("**/chapter-02-*.js");
  await page.reload();
  await expect(page.locator(".chapter-heading .eyebrow")).toHaveText("Chapter Two");
  await expect(page.locator("#load-status")).toHaveText("");
});
