import { test as base, expect } from "@playwright/test";

// Closing a Playwright context does not give the app a navigation lifecycle.
// Discard its board explicitly before teardown so GPU contexts cannot collect
// across tests in the shared WebKit browser process.
export const test = base.extend({
  page: async ({ page }, use) => {
    await use(page);
    if (!page.isClosed()) {
      await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: false })));
    }
  },
});
export { expect };
