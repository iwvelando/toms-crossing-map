import { getView } from "../../src/story.js";
import { loadThrough, maximumChapter } from "../../src/chapters.js";

// Bound the number of UI interactions per test as chapters and participants grow.
// Only public runtime payloads supply the matrix; private inputs are never read.
export function createAtlasCases(data, boundary, batchSize = 20) {
  if (!Number.isInteger(batchSize) || batchSize < 1) throw new Error("Invalid batch size");
  const split = steps => Array.from({ length: Math.ceil(steps.length / batchSize) },
    (_, batch) => ({ batch, steps: steps.slice(batch * batchSize, (batch + 1) * batchSize) }));
  const chapterCases = data.chapters.filter(chapter => chapter.id <= boundary).flatMap(chapter => {
    const view = getView(chapter.id, 0, "K", data, "all");
    // Earlier entries already have their own boundary cases. Visit newly disclosed
    // entries here, or the first available entry for a chapter with no new ones.
    const indices = view.events.flatMap((event, index) => event.chapter === chapter.id ? [index] : []);
    const steps = (indices.length ? indices : [view.current ? 0 : null])
      .map(index => ({ characterId: "K", index }));
    return split(steps).map(batch => ({ chapter: chapter.id, ...batch }));
  });
  const participantSteps = data.characters.filter(person => person.chapter <= boundary).flatMap(person => {
    const events = getView(boundary, 0, person.id, data, "all").events;
    return events.length ? events.map((_, index) => ({ characterId: person.id, index }))
      : [{ characterId: person.id, index: null }];
  });
  return { chapterCases, participantCases: split(participantSteps) };
}

export const latestChapter = maximumChapter;
const data = await loadThrough(latestChapter);
export const latestChapterIsPartial = Boolean(data.chapters.find(chapter => chapter.id === latestChapter)?.partial);
export const visibleCharacterCount = data.characters.filter(person => person.chapter <= latestChapter).length;
export const { chapterCases, participantCases } = createAtlasCases(data, latestChapter);
