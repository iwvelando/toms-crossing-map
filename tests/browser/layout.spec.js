import { test, expect } from "@playwright/test";
import { chapterCases } from "../helpers/atlas-cases.mjs";
import { checkOverflow, openChapter, visitEntries } from "./atlas-journey.js";

test("chapter controls and journal fit a narrow screen", async ({ page }, testInfo) => {
  await page.goto("/");
  const overflow = () => checkOverflow(page);
  await overflow();
  await page.locator("#chapter-limit").click();
  const box = await page.getByRole("listbox").boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize().width);
  await page.getByRole("option", { name: /^Chapter One/ }).click();
  for (const selector of ["#character-select", "#layer-select"]) {
    await expect(page.locator(selector)).toBeVisible();
    expect((await page.locator(selector).boundingBox()).height).toBeGreaterThanOrEqual(44);
  }
  for (let i = 0; i < 3; i++) {
    await page.locator("#entry-detail summary").click();
    await overflow();
    await page.screenshot({ path: `test-results/${testInfo.project.name}-movement-${i}.png`, fullPage: true });
    if (i < 2) await page.getByRole("button", { name: "Next movement" }).click();
  }
  await page.locator("#character").click();
  await overflow();
  await page.locator("#about-button").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await overflow();
  await page.locator("#close-about").click();
  await page.reload();
  await expect(page.locator("#locked-state")).toBeVisible();
});

for (const { chapter, batch, steps } of chapterCases) {
  test(`chapter ${chapter} layout batch ${batch + 1} fits the screen`, async ({ page }, testInfo) => {
    test.setTimeout(120000);
    await openChapter(page, chapter);
    await visitEntries(page, steps, () => checkOverflow(page));
    await page.screenshot({ path: `test-results/${testInfo.project.name}-chapter-${chapter}-batch-${batch + 1}.png`, fullPage: true });
  });
}
