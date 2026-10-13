import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Dependabot merges run one at a time so simultaneous PRs don't race on main", () => {
  const workflow = readFileSync(new URL("../.github/workflows/dependabot-merge.yml", import.meta.url), "utf8");
  const block = workflow.match(/^concurrency:\n((?:  .*\n)+)/m);
  assert.ok(block, "dependabot-merge.yml needs a workflow-level concurrency group");
  assert.match(block[1], /^  group: \S+$/m);
  assert.match(block[1], /^  cancel-in-progress: false$/m, "a queued merge must wait, not be cancelled");
});
