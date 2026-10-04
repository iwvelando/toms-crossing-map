import { createPicker } from "./picker.js";

/** Chapter disclosure requires explicit pointer or keyboard selection. */
export function createChapterPicker(root, onChange) {
  root.querySelector("#chapter-limit-value").dataset.pickerValue = "";
  const picker = createPicker(root, value => onChange(Number(value)));
  const words = ["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];
  return { setValue(value, chapters = []) {
    picker.setOptions(Array.from({ length: 13 }, (_, i) => {
      const chapter = chapters.find(chapter => chapter.id === i);
      return { value: String(i), id: `chapter-option-${i}`, label: i === 0 ? "Before Chapter One" :
        `Chapter ${words[i - 1]}${chapter ? " · " + chapter.title : ""}${i === 12 ? " · partial" : ""}` };
    }), value);
  } };
}
