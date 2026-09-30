import { test, expect } from "@playwright/test";
test("all atlas states fit and work on a narrow screen", async ({ page }, testInfo) => {
  await page.goto("/");
  const overflow = async () => expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await overflow();
  await page.getByRole("combobox").click();
  const box = await page.getByRole("listbox").boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize().width);
  await page.getByRole("option", { name: /Chapter One Paddock B/ }).click();
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
