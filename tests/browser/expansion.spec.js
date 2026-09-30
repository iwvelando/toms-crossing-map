import { test, expect } from "@playwright/test";

test("later payloads load only on selection; cached content retracts", async ({ page }) => {
  const chapters = new Set();
  page.on("request", request => {
    const match = request.url().match(/chapter-(\d+)/);
    if (match) chapters.add(Number(match[1]));
  });
  await page.goto("/?chapter=12");
  await page.evaluate(() => localStorage.setItem("chapter", "12"));
  expect([...chapters]).toEqual([]);
  await page.locator("#chapter-limit").click();
  await expect(page.locator("#chapter-options")).not.toContainText("Paddock B");
  await page.locator("#chapter-limit").press("End");
  expect([...chapters]).toEqual([]);
  await expect(page.locator("#locked-state")).toBeVisible();
  await page.locator("#chapter-limit").press("Enter");
  await expect(page.locator("#character-select option")).toHaveCount(52);
  expect([...chapters].sort((a, b) => a - b)).toEqual(Array.from({ length: 12 }, (_, i) => i + 1));
  await expect(page.locator(".chapter-heading p")).toContainText("Partial");
  const laterPeople = await page.locator("#character-select").innerText();
  await page.locator("#chapter-limit").click();
  await page.locator("#chapter-limit").press("Home");
  await page.locator("#chapter-limit").press("ArrowDown");
  await page.locator("#chapter-limit").press("Enter");
  await expect(page.locator("#entry-detail h3")).toHaveText("Leaving home");
  expect(await page.locator("#character-select").innerText()).not.toEqual(laterPeople);
  await expect(page.locator("#chapter-options")).not.toContainText("Ice!");
  await page.reload();
  await expect(page.locator("#locked-state")).toBeVisible();
  await expect(page.locator("#character-select option")).toHaveCount(0);
  await expect(page.locator("#entry-detail")).toBeEmpty();
});

test("all chapters, participants and layers have a working journal and safe map", async ({ page }) => {
  test.setTimeout(120000);
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  for (let chapter = 1; chapter <= 12; chapter++) {
    await page.locator("#chapter-limit").click();
    await page.locator(`#chapter-option-${chapter}`).click();
    await expect(page.locator("#load-status")).toHaveText("");
    await expect(page.locator(".chapter-heading .eyebrow")).not.toBeEmpty();
    await page.locator("#layer-select").selectOption("all");
    const people = chapter === 12
      ? await page.locator("#character-select option").evaluateAll(options => options.map(option => option.value))
      : ["K"];
    for (const id of people) {
      await page.locator("#character-select").selectOption(id);
      const entries = page.locator(".entry-button");
      for (let i = 0; i < await entries.count(); i++) {
        await entries.nth(i).click();
        await expect(page.locator("#entry-detail h3")).not.toBeEmpty();
        const classification = await page.locator("#map").getAttribute("data-kind");
        if (["plan", "dream", "presence", "failed ascent"].includes(classification)) await expect(page.locator("#map")).toHaveAttribute("data-route", "");
      }
    }
  }
  expect(errors).toEqual([]);
});

test("unavailable chapter load can be retried without restoring stale content", async ({ page }) => {
  await page.route("**/chapter-12-*.js", route => route.abort());
  await page.goto("/");
  await page.locator("#chapter-limit").click();
  await page.locator("#chapter-option-12").click();
  await expect(page.locator("#load-status")).toContainText("could not be opened");
  await expect(page.locator("#entry-detail")).toBeEmpty();
  await expect(page.locator(".map-label")).toHaveCount(0);
  await page.locator("#chapter-limit").click();
  await page.locator("#chapter-option-0").click();
  await expect(page.locator("#locked-state")).toBeVisible();
  await page.unroute("**/chapter-12-*.js");
  await page.reload();
  await expect(page.locator("#locked-state")).toBeVisible();
  await page.locator("#chapter-limit").click();
  await page.locator("#chapter-option-12").click();
  await expect(page.locator("#load-status")).toHaveText("");
  await expect(page.locator("#entry-detail h3")).not.toBeEmpty();
});

test("primitive pawn survives an unavailable model", async ({ page }) => {
  await page.route("**/models/*.glb", route => route.abort());
  await page.goto("/");
  await page.locator("#begin").click();
  await expect(page.locator("#map")).toHaveAttribute("data-asset", "fallback");
  await expect(page.locator("#entry-detail h3")).toHaveText("Leaving home");
  await expect(page.locator("#map")).toHaveAttribute("data-position", "WILLOW-OAK");
  await expect(page.locator(".map-label")).toHaveCount(3);
});
