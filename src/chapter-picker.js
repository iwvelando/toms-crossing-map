import { createPicker } from "./picker.js";
import { maximumChapter, partialChapter, chapterWords } from "./chapter-boundary.js";

/** Chapter disclosure requires explicit pointer or keyboard selection. */
export function createChapterPicker(root, onChange) {
  root.querySelector("#chapter-limit-value").dataset.pickerValue = "";
  const picker = createPicker(root, value => onChange(Number(value)));
  return { setValue(value, chapters = []) {
    picker.setOptions(Array.from({ length: maximumChapter + 1 }, (_, i) => {
      const chapter = chapters.find(chapter => chapter.id === i);
      return { value: String(i), id: `chapter-option-${i}`, label: i === 0 ? "Before Chapter One" :
        `Chapter ${chapterWords[i - 1]}${chapter ? " · " + chapter.title : ""}${i === partialChapter ? " · partial" : ""}` };
    }), value);
  } };
}
