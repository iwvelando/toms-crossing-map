import { readdir, readFile } from "node:fs/promises";
import { relative, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chapter, characters, locations, events } from "../src/story.js";
import { digest } from "./atlas-coverage.mjs";

// Update this adapter when the runtime gains a chapters array or split data files.
// Hash rendering code/assets as well as records so a removed route or model
// cannot leave an earlier "fully reviewed" snapshot looking current.
export async function readProjection() {
  const implementation = {};
  const root = fileURLToPath(new URL("../", import.meta.url));
  for (const directory of ["src", "public/models"]) {
    for (const path of (
      await readdir(new URL(`../${directory}/`, import.meta.url), {
        recursive: true,
        withFileTypes: true,
      })
    )
      .filter((entry) => entry.isFile())
      .sort((a, b) =>
        `${a.parentPath}/${a.name}`.localeCompare(`${b.parentPath}/${b.name}`),
      )) {
      const bytes = await readFile(`${path.parentPath}/${path.name}`);
      // Hash values only; absolute machine paths never enter the receipt.
      const filename = relative(
        root,
        join(path.parentPath, path.name),
      ).replaceAll("\\", "/");
      implementation[filename] = digest(bytes.toString("base64"));
    }
  }
  implementation["index.html"] = digest(
    await readFile(new URL("../index.html", import.meta.url), "utf8"),
  );
  return { chapters: [chapter], characters, locations, events, implementation };
}
