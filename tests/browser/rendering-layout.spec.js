import { test, expect } from "./fixtures.js";

test("reload releases the old WebGL context while cached navigation preserves it", async ({ page }) => {
  const key = "atlas-test-context-releases";
  await page.addInitScript(key => {
    const original = WebGL2RenderingContext.prototype.getExtension;
    WebGL2RenderingContext.prototype.getExtension = function (name) {
      const extension = original.call(this, name);
      if (name !== "WEBGL_lose_context" || !extension) return extension;
      return {
        loseContext() {
          localStorage.setItem(key, String(Number(localStorage.getItem(key) || 0) + 1));
          extension.loseContext();
        },
        restoreContext() { extension.restoreContext(); },
      };
    };
  }, key);
  await page.goto("/");
  await expect(page.locator("#map")).toHaveAttribute("data-asset", "procedural");
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true })));
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBeNull();
  expect(await page.locator("#map canvas").evaluate(canvas => canvas.getContext("webgl2").isContextLost())).toBe(false);
  await page.locator("#begin").click();
  await expect(page.locator("#map")).toHaveAttribute("data-pieces", "1");
  await page.reload();
  await expect(page.locator("#map")).toHaveAttribute("data-pieces", "1");
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe("1");
  await page.reload();
  await expect(page.locator("#map")).toHaveAttribute("data-pieces", "1");
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe("2");
});
