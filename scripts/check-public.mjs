import { execFileSync } from "node:child_process";
import { readFile, lstat } from "node:fs/promises";
import assert from "node:assert/strict";
import { auditPath, auditText } from "./public-audit.mjs";
// Include staged files: ignores cannot protect something already in the index.
const files = [...new Set(execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean))];
for (const file of files) {
  auditPath(file);
  assert(!(await lstat(file)).isSymbolicLink(), `Public release: symlink ${file}`);
  if (!/\.(?:png|glb)$/.test(file))
    auditText(file, await readFile(file, "utf8"));
  if (file.endsWith(".glb")) {
    const data = await readFile(file);
    assert.equal(data.toString("utf8", 0, 4), "glTF");
    const length = data.readUInt32LE(12);
    // Inspect the GLB JSON metadata too; binary buffers contain no source notes.
    auditText(file, data.toString("utf8", 20, 20 + length));
  }
}
console.log(`Public release audit passed (${files.length} candidate files, including staged files).`);
