import { readFile, writeFile } from "node:fs/promises";
// Three.js is the runtime dependency; Vite contributes a bundled preload helper.
const notices = [
  "Tom’s Crossing fan atlas — third-party software notices\n\nThese licenses cover software components only, not the novel or its characters and settings.",
];
for (const [name, filename] of [
  ["three", "LICENSE"],
  ["vite", "LICENSE.md"],
]) {
  const pkg = JSON.parse(
    await readFile(`node_modules/${name}/package.json`, "utf8"),
  );
  const license = await readFile(`node_modules/${name}/${filename}`, "utf8");
  notices.push(`\n--- ${name} ${pkg.version} ---\n\n${license}`);
}
await writeFile("public/THIRD-PARTY-NOTICES.txt", notices.join("\n"));
await writeFile("public/LICENSE.txt", await readFile("LICENSE", "utf8"));
