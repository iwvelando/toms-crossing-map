import { test, expect } from "@playwright/test";
import { latestChapter } from "../helpers/atlas-cases.mjs";
test("chapter gate, route steps, character isolation, and reset @smoke", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("#map canvas")).toBeVisible();
  await expect(page.locator("#map")).toHaveAttribute("data-asset", "procedural");
  await expect(page.locator(".map-label")).toHaveCount(0);
  await expect(page.locator("#unlocked-state")).toBeHidden();
  await page.getByRole("button", { name: "I’ve finished Chapter One" }).click();
  await expect(page.locator("#entry-detail h3")).toHaveText("Leaving home");
  await expect(page.locator(".map-label")).toHaveCount(3);
  await page.getByRole("button", { name: "Next movement" }).click();
  await expect(page.locator("#entry-detail h3")).toHaveText(
    "Out of the paddock",
  );
  await page.getByRole("button", { name: "Next movement" }).click();
  await expect(page.locator("#entry-detail h3")).toHaveText(
    "Above the tree streets",
  );
  await expect(page.locator(".map-label")).toHaveCount(3);
  await expect(
    page.getByRole("button", { name: "Next movement" }),
  ).toBeEnabled();
  await expect(page.locator("#character")).toHaveCount(0);
  await expect(page.locator("#map")).toHaveAttribute("data-pieces", "1");
  await page.getByRole("button", { name: "Toggle overhead view" }).click();
  await expect(page.locator("#view-top")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Reset map view" }).click();
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await page.getByRole("button", { name: "Zoom out", exact: true }).click();
  await page.screenshot({
    path: "test-results/atlas-desktop.png",
    fullPage: true,
  });
  await page.locator("#chapter-limit").click();
  await page.getByRole("option", { name: /Before Chapter One/ }).click();
  await expect(page.locator(".map-label")).toHaveCount(0);
  await expect(page.locator("#entries")).toBeEmpty();
  await expect(page.locator("#entry-detail")).toBeEmpty();
  await page.locator("#begin").click();
  await expect(page.locator("#entry-detail h3")).toHaveText("Leaving home");
  await page.reload();
  await expect(page.locator("#entry-detail h3")).toHaveText("Leaving home");
  expect(errors).toEqual([]);
});
test("mobile layout and journal remain usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator("#begin").click();
  await page.getByRole("button", { name: "Next movement" }).click();
  await expect(page.locator("#entry-detail h3")).toHaveText(
    "Out of the paddock",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/atlas-mobile.png",
    fullPage: true,
  });
});
test("journal works when WebGL is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type.startsWith("webgl")
        ? null
        : original.call(this, type, ...args);
    };
  });
  await page.goto("/");
  await expect(page.locator("#map-fallback")).toBeVisible();
  await page.locator("#begin").click();
  await page.getByRole("button", { name: "Next movement" }).click();
  await expect(page.locator("#entry-detail h3")).toHaveText(
    "Out of the paddock",
  );
});

test("chapter picker commits only explicit selections and supports dismissal", async ({
  page,
}) => {
  await page.goto("/");
  const picker = page.locator("#chapter-limit");
  await picker.focus();
  await picker.press("ArrowDown");
  await picker.press("End");
  await expect(picker).toHaveAttribute(
    "aria-activedescendant",
    `chapter-option-${latestChapter}`,
  );
  await expect(page.locator("#locked-state")).toBeVisible();
  await picker.press("Escape");
  await expect(page.getByRole("listbox")).toBeHidden();
  await expect(page.locator("#locked-state")).toBeVisible();
  await picker.press("c");
  await picker.press("Enter");
  await expect(page.locator("#entry-detail h3")).toHaveText("Leaving home");
  await expect(picker).toContainText("Chapter One · Paddock B");
  await picker.press(" ");
  await picker.press("Home");
  await picker.press("Enter");
  await expect(page.locator("#locked-state")).toBeVisible();
  await picker.click();
  await page.mouse.click(20, 200);
  await expect(page.getByRole("listbox")).toBeHidden();
  await picker.focus();
  await picker.press("Enter");
  await picker.press("Tab");
  await expect(page.getByRole("listbox")).toBeHidden();
});

test("public copy, attribution, distribution notices, and CSP @smoke", async ({
  page, baseURL,
}) => {
  const violations = [];
  await page.addInitScript(() => {
    window.cspViolations = [];
    document.addEventListener("securitypolicyviolation", (event) =>
      window.cspViolations.push(event.violatedDirective),
    );
  });
  page.on("request", (request) => {
    if (
      !request.url().startsWith(new URL(baseURL).origin + "/") &&
      !request.url().startsWith("data:")
    )
      violations.push(request.url());
  });
  const response = await page.goto("/");
  expect(response.headers()["content-security-policy"]).toContain(
    "script-src 'self'",
  );
  await page.locator("#begin").click();
  await expect(page.locator("#map")).toHaveAttribute("data-asset", "procedural");
  await expect(page.locator(".page-footer")).toContainText(
    "Mark Z. Danielewski",
  );
  await expect(page.locator(".page-footer")).toContainText(
    "not affiliated with",
  );
  await page.locator("#about-button").click();
  await expect(page.locator("#about")).toContainText(
    "audio rather than printed text",
  );
  const copy = await page.locator("body").innerText();
  expect(copy).not.toMatch(
    /proof of concept|prototype|ledger|heard-so-far|track \d+|replay|occurrence \d+/i,
  );
  await page.locator("#close-about").click();
  const notices = await page.request.get("/THIRD-PARTY-NOTICES.txt");
  expect(notices.ok()).toBe(true);
  expect(await notices.text()).toContain("three.js authors");
  expect(await page.evaluate(() => window.cspViolations)).toEqual([]);
  expect(violations).toEqual([]);
});

test("styled chapter menu fits a phone and allows touch selection", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator("#chapter-limit").click();
  const box = await page.getByRole("listbox").boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(390);
  await page.screenshot({ path: "test-results/chapter-menu-mobile.png" });
  await page.getByRole("option", { name: /^Chapter One/ }).click();
  await expect(page.locator("#entry-detail h3")).toHaveText("Leaving home");
});
