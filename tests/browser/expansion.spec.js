import { test, expect } from "@playwright/test";
import { chapterCases, participantCases, latestChapter, latestChapterIsPartial, visibleCharacterCount } from "../helpers/atlas-cases.mjs";
import { openChapter, visitEntries } from "./atlas-journey.js";

test("fresh boundaries ignore URLs; committed and restored content stays bounded", async ({ page }) => {
  const chapters = new Set();
  page.on("request", request => {
    const match = request.url().match(/chapter-(\d+)/);
    if (match) chapters.add(Number(match[1]));
  });
  await page.goto(`/?chapter=${latestChapter}`);
  await page.evaluate(chapter => localStorage.setItem("chapter", String(chapter)), latestChapter);
  expect([...chapters]).toEqual([]);
  await page.locator("#chapter-limit").click();
  const closedLastLabel = await page.locator(`#chapter-option-${latestChapter}`).innerText();
  await expect(page.locator("#chapter-options")).not.toContainText("Paddock B");
  await page.locator("#chapter-limit").press("End");
  expect([...chapters]).toEqual([]);
  await expect(page.locator("#locked-state")).toBeVisible();
  await page.locator("#chapter-limit").press("Enter");
  await expect(page.locator("#character-select option")).toHaveCount(visibleCharacterCount);
  expect([...chapters].sort((a, b) => a - b)).toEqual(Array.from({ length: latestChapter }, (_, i) => i + 1));
  if (latestChapterIsPartial) await expect(page.locator(".chapter-heading p")).toContainText("Partial");
  else await expect(page.locator(".chapter-heading p")).not.toContainText("Partial");
  const laterPeople = await page.locator("#character-select").innerText();
  await page.locator("#chapter-limit").click();
  await page.locator("#chapter-limit").press("Home");
  await page.locator("#chapter-limit").press("ArrowDown");
  await page.locator("#chapter-limit").press("Enter");
  await expect(page.locator("#entry-detail h3")).toHaveText("Leaving home");
  expect(await page.locator("#character-select").innerText()).not.toEqual(laterPeople);
  await expect(page.locator(`#chapter-option-${latestChapter}`)).toHaveText(closedLastLabel);
  await page.reload();
  await expect(page.locator("#entry-detail h3")).toHaveText("Leaving home");
  expect(await page.locator("#character-select").innerText()).not.toEqual(laterPeople);
});

for (const { chapter, batch, steps } of chapterCases) {
  test(`chapter ${chapter} disclosure batch ${batch + 1} has a working journal and safe map`, async ({ page }) => {
    test.setTimeout(120000);
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await openChapter(page, chapter);
    await visitEntries(page, steps);
    expect(errors).toEqual([]);
  });
}

for (const { batch, steps } of participantCases) {
  test(`participant journal batch ${batch + 1} has a working journal and safe map`, async ({ page }) => {
    test.setTimeout(120000);
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await openChapter(page, latestChapter);
    await visitEntries(page, steps);
    expect(errors).toEqual([]);
  });
}

test("unavailable chapter load can be retried without restoring stale content", async ({ page }) => {
  const payload = `**/chapter-${String(latestChapter).padStart(2, "0")}-*.js`;
  await page.route(payload, route => route.abort());
  await page.goto("/");
  await page.locator("#chapter-limit").click();
  await page.locator(`#chapter-option-${latestChapter}`).click();
  await expect(page.locator("#load-status")).toContainText("could not be opened");
  await expect(page.locator("#entry-detail")).toBeEmpty();
  await expect(page.locator(".map-label")).toHaveCount(0);
  await page.locator("#chapter-limit").click();
  await page.locator("#chapter-option-0").click();
  await expect(page.locator("#locked-state")).toBeVisible();
  await page.unroute(payload);
  await page.reload();
  await expect(page.locator("#locked-state")).toBeVisible();
  await page.locator("#chapter-limit").click();
  await page.locator(`#chapter-option-${latestChapter}`).click();
  await expect(page.locator("#load-status")).toHaveText("");
  await expect(page.locator("#entry-detail h3")).not.toBeEmpty();
});

test("geometric pieces need no model download", async ({ page }) => {
  const models = [];
  page.on("request", request => { if (request.url().endsWith(".glb")) models.push(request.url()); });
  await page.route("**/models/*.glb", route => route.abort());
  await page.goto("/");
  await page.locator("#begin").click();
  await expect(page.locator("#map")).toHaveAttribute("data-asset", "procedural");
  expect(models).toEqual([]);
  await expect(page.locator("#entry-detail h3")).toHaveText("Leaving home");
  await expect(page.locator("#map")).toHaveAttribute("data-position", "WILLOW-OAK");
  await expect(page.locator(".map-label")).toHaveCount(3);
});
