import { combinePayloads } from "./story.js";
// Only numbers and the reviewed partial boundary belong in the initial catalog.
export const maximumChapter = 12;
export const loaders = [
  () => import("./chapters/chapter-01.js"),
  () => import("./chapters/chapter-02.js"),
  () => import("./chapters/chapter-03.js"),
  () => import("./chapters/chapter-04.js"),
  () => import("./chapters/chapter-05.js"),
  () => import("./chapters/chapter-06.js"),
  () => import("./chapters/chapter-07.js"),
  () => import("./chapters/chapter-08.js"),
  () => import("./chapters/chapter-09.js"),
  () => import("./chapters/chapter-10.js"),
  () => import("./chapters/chapter-11.js"),
  () => import("./chapters/chapter-12.js"),
];
export async function loadThrough(limit, sources = loaders) {
  if (!Number.isInteger(limit) || limit < 0 || limit > sources.length) throw new Error("Unsupported reading boundary");
  const payloads = [];
  for (let i = 0; i < limit; i++) payloads.push((await sources[i]()).default);
  return combinePayloads(payloads);
}
