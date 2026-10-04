import { test, expect } from "@playwright/test";
import { openChapter, checkOverflow, selectControl } from "./atlas-journey.js";

test("the board stays open, with optional legend and controls outside the scene", async ({ page }, testInfo) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await openChapter(page, 1);
  await expect(page.locator("#character, #board-reader, .map-heading")).toHaveCount(0);
  await expect(page.locator(".map-panel .map-toolbar, .map-panel .map-key")).toHaveCount(0);
  await expect(page.locator("#legend")).not.toHaveAttribute("open", "");
  await page.locator("#legend summary").click();
  await expect(page.locator(".legend-person")).toBeVisible();
  await page.reload();
  await expect(page.locator("#legend")).toHaveAttribute("open", "");
  await page.locator("#legend summary").click();
  await checkOverflow(page);
  await page.screenshot({ path: `test-results/${testInfo.project.name}-immersive-dark.png`, fullPage: true });
  await page.locator("#theme-toggle").click();
  await page.screenshot({ path: `test-results/${testInfo.project.name}-immersive-light.png`, fullPage: true });
});

test("a full legend expands the page without overlapping the footer", async ({ page }) => {
  await page.setViewportSize({ width: 760, height: 900 });
  await openChapter(page, 12);
  await selectControl(page, "#map-mode", "chapter");
  await page.locator("#show-all").click();
  await page.locator("#legend summary").click();
  const legend = await page.locator("#legend").boundingBox();
  const footer = await page.locator(".page-footer").boundingBox();
  expect(legend.y + legend.height).toBeLessThanOrEqual(footer.y);
  for (const person of await page.locator(".legend-person").all()) {
    const bounds = await person.boundingBox();
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(legend.y + legend.height);
  }
  await checkOverflow(page);
});

test("all dropdowns share explicit keyboard selection and a complete focus border", async ({ page }) => {
  await openChapter(page, 1);
  for (const id of ["chapter-limit", "map-mode-trigger", "layer-select-trigger", "character-select-trigger"]) {
    const trigger = page.locator(`#${id}`);
    const original = await trigger.innerText();
    await trigger.click();
    await trigger.press("ArrowDown");
    await expect(trigger).toHaveText(original);
    const activeId = await trigger.getAttribute("aria-activedescendant");
    const focus = page.locator(`#${activeId}`);
    await expect(focus).toBeVisible();
    const border = await focus.evaluate(node => {
      const style = getComputedStyle(node);
      return [style.borderTopColor, style.borderRightColor, style.borderBottomColor, style.borderLeftColor];
    });
    expect(new Set(border).size).toBe(1);
    await trigger.press("Escape");
    await expect(trigger).toHaveText(original);
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  }
  await page.locator("#layer-select-trigger").click();
  await page.locator("#layer-select-trigger").press("End");
  await page.locator("#layer-select-trigger").press("Enter");
  await expect(page.locator("#layer-select")).toHaveValue("all");
});
