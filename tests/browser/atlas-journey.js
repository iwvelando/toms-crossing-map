import { expect } from "@playwright/test";

export async function checkOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
}

export async function openChapter(page, chapter) {
  await page.goto("/");
  await page.locator("#chapter-limit").click();
  await page.locator(`#chapter-option-${chapter}`).click();
  await expect(page.locator("#load-status")).toHaveText("");
  await expect(page.locator(".chapter-heading .eyebrow")).not.toBeEmpty();
  await selectControl(page, "#layer-select", "all");
}

export async function visitEntries(page, steps, afterEntry = async () => {}) {
  let selected;
  for (const { characterId, index } of steps) {
    if (selected !== characterId) {
      await selectControl(page, "#character-select", characterId);
      selected = characterId;
    }
    if (index === null) {
      await expect(page.locator("#entry-detail")).toBeEmpty();
      await expect(page.locator("#empty-state")).toBeVisible();
    } else {
      await page.locator(".entry-button").nth(index).click();
      await expect(page.locator("#entry-detail h3")).not.toBeEmpty();
      const classification = await page.locator("#map").getAttribute("data-kind");
      if (["plan", "dream", "presence", "failed ascent"].includes(classification))
        await expect(page.locator("#map")).toHaveAttribute("data-route", "");
    }
    await afterEntry();
  }
}

// Exercise the same explicit menu selection used by readers, including on touch.
export async function selectControl(page, selector, value) {
  await page.locator(`${selector}-trigger`).click();
  await page.locator(`${selector}-options [data-value="${value}"]`).click();
}
