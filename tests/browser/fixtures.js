import { test as base, expect } from "@playwright/test";

// Exercise discarded-page cleanup before closing Playwright's context,
// which otherwise skips the app's navigation lifecycle.
export const test = base.extend({
  // WebKit's GPU state can survive context teardown on the hosted runner.
  // Give each test its own browser process, retaining the project's device,
  // viewport, storage, and URL options. Chromium keeps its ordinary fixture.
  context: async ({ context, browserName, playwright }, use, testInfo) => {
    if (browserName !== "webkit") {
      await use(context);
      return;
    }
    const browser = await playwright.webkit.launch();
    let isolated;
    try {
      isolated = await browser.newContext(testInfo.project.use);
      await use(isolated);
    } finally {
      // Close the context first so Playwright can finish traces and snapshots.
      await isolated?.close();
      await browser.close();
    }
  },
  page: async ({ page }, use) => {
    await use(page);
    if (!page.isClosed()) {
      await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: false })));
    }
  },
});
export { expect };
