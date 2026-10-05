import { test } from "./fixtures.js";
import { participantCases, latestChapter } from "../helpers/atlas-cases.mjs";
import { checkOverflow, openChapter, visitEntries } from "./atlas-journey.js";

for (const { batch, steps } of participantCases) {
  test(`participant layout batch ${batch + 1} fits the phone screen`, async ({ page }) => {
    test.setTimeout(120000);
    await openChapter(page, latestChapter);
    await visitEntries(page, steps, () => checkOverflow(page));
  });
}
