import test from "node:test";
import assert from "node:assert/strict";
import { auditPath, auditText } from "../scripts/public-audit.mjs";

test("release audit rejects staged research, credentials, and generated files", () => {
  for (const path of ["docs/evidence.md", "notes/transcript.txt", ".env.production", ".aws/credentials", ".claude/settings.local.json", "public/book.m4b", "public/leak.map", "dist/index.html", "node_modules/pkg/index.js", "private-key.pem"])
    assert.throws(() => auditPath(path), /Public release/);
  for (const path of ["src/story.js", "public/models/kalin-pawn.glb", "README.md", ".github/workflows/ci.yml"])
    assert.doesNotThrow(() => auditPath(path));
});
test("release audit rejects concrete secrets and machine paths", () => {
  for (const text of ["/" + "Users/example/private", "-----BEGIN " + "PRIVATE KEY-----", "AKIA" + "A".repeat(16), "ghp_" + "a".repeat(36)])
    assert.throws(() => auditText("src/sample.js", text), /Public release/);
  assert.doesNotThrow(() => auditText("README.md", "arn:aws:iam::634753796535:role/toms-crossing-map-deploy"));
});
