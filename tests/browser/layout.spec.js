import { test, expect } from "@playwright/test";
test("all atlas states fit and work on a narrow screen", async ({ page }, testInfo) => {
  test.setTimeout(240000);
  await page.goto("/");
  const overflow = async () => expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
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
  for (let chapter = 2; chapter <= 12; chapter++) {
    await page.locator("#chapter-limit").click();
    await page.locator(`#chapter-option-${chapter}`).click();
    await expect(page.locator("#load-status")).toHaveText("");
    const entries = page.locator(".entry-button");
    for (let i = 0; i < await entries.count(); i++) {
      await entries.nth(i).click();
      await overflow();
    }
    await page.screenshot({ path: `test-results/${testInfo.project.name}-chapter-${chapter}.png`, fullPage: true });
  }
  if (testInfo.project.name !== "chromium") {
    const people = await page.locator("#character-select option").evaluateAll(options => options.map(option => option.value));
    for (const id of people) {
      await page.locator("#character-select").selectOption(id);
      const entries = page.locator(".entry-button");
      for (let i = 0; i < await entries.count(); i++) {
        await entries.nth(i).click();
        await expect(page.locator("#entry-detail h3")).not.toBeEmpty();
        await overflow();
      }
    }
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
