import { readdir, readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { auditText } from "./public-audit.mjs";
const files = await readdir("dist", { recursive: true });
const forbidden =
  /(?:movements\.md|metadata\.json|transcript|manifest\.json|chunk_\d+|evidence\.md|\.map$|\.env|\.m4b$|\.wav$|\.mp3$)/i;
assert(
  !files.some((name) => forbidden.test(name)),
  "Private source files leaked into dist",
);
for (const file of files.filter((name) => /\.(js|html|css|json)$/.test(name))) {
  const text = await readFile(`dist/${file}`, "utf8");
  auditText(file, text);
  assert(
    !/heard-so-far|query_\d{8}|chunk_\d+|\bW\d{2}\b|\bTrack \d+\b|\boccurrence \d+\b/.test(
      text,
    ),
    "Private research references leaked into dist",
  );
  assert(
    !/https?:\/\/(?:fonts\.googleapis|fonts\.gstatic|unpkg|cdn\.jsdelivr)/.test(
      text,
    ),
    "Runtime CDN dependency",
  );
}
assert(files.includes("models/kalin-pawn.glb"), "Pawn asset missing");
console.log(
  "Static bundle check passed: no source ledger, transcripts, audio, or local paths.",
);

const notices = await readFile("dist/THIRD-PARTY-NOTICES.txt", "utf8");
for (const name of ["three", "vite"])
  assert(
    notices.includes(`--- ${name} `),
    `Missing license notice for ${name}`,
  );

for (const name of ["index.html", "404.html", "favicon.svg", "og-image.png", "apple-touch-icon.png", "LICENSE.txt"])
  assert(files.includes(name), `Missing release asset: ${name}`);
assert(files.some(name => /^assets\/.*\.js$/.test(name)), "Missing application bundle");
