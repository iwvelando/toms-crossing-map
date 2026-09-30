import { test, expect } from "@playwright/test";
test("the static board stops drawing when idle and redraws after interaction", async ({ page }) => {
  await page.addInitScript(() => {
    window.drawCalls = 0;
    for (const method of ["drawElements", "drawArrays"]) {
      const original = WebGL2RenderingContext.prototype[method];
      WebGL2RenderingContext.prototype[method] = function (...args) {
        window.drawCalls++;
        return original.apply(this, args);
      };
    }
  });
  await page.goto("/");
  await expect(page.locator("#map")).toHaveAttribute("data-asset", "loaded");
  await expect.poll(() => page.evaluate(() => window.drawCalls)).toBeGreaterThan(0);
  await expect.poll(async () => {
    const before = await page.evaluate(() => window.drawCalls);
    await new Promise(resolve => setTimeout(resolve, 400));
    return (await page.evaluate(() => window.drawCalls)) - before;
  }).toBe(0);
  const redraw = async (action) => {
    const count = await page.evaluate(() => window.drawCalls);
    await action();
    await expect.poll(() => page.evaluate(() => window.drawCalls)).toBeGreaterThan(count);
  };
  await redraw(() => page.getByRole("button", { name: "Zoom in", exact: true }).click());
  await redraw(() => page.locator("#begin").click());
  await expect(page.locator(".map-label")).toHaveCount(3);
  await redraw(() => page.locator("#map").press("ArrowLeft"));
  await redraw(() => page.getByRole("button", { name: "Toggle overhead view" }).click());
  await redraw(() => page.getByRole("button", { name: "Reset map view" }).click());
  await redraw(() => page.setViewportSize({ width: 1000, height: 800 }));
});
