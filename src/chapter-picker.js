/** Select-only combobox: exploring options never changes the reading boundary. */
export function createChapterPicker(root, onChange) {
  const trigger = root.querySelector('[role="combobox"]');
  const valueLabel = root.querySelector("#chapter-limit-value");
  const list = root.querySelector('[role="listbox"]');
  const words = ["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];
  list.replaceChildren();
  const labels = ["Before Chapter One", ...words.map((word, i) => `Chapter ${word}${i === 11 ? " · partial" : ""}`)];
  const options = labels.map((label, index) => {
    const option = document.createElement("li");
    option.id = `chapter-option-${index}`;
    option.setAttribute("role", "option");
    option.dataset.value = index;
    const text = document.createElement("span");
    text.textContent = label;
    option.append(text);
    list.append(option);
    return option;
  });
  let selected = 0;
  let active = 0;

  function highlight(index) {
    active = Math.max(0, Math.min(options.length - 1, index));
    options.forEach((option, i) =>
      option.classList.toggle("focused", i === active),
    );
    trigger.setAttribute("aria-activedescendant", options[active].id);
  }
  function open(index = selected) {
    list.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    highlight(index);
  }
  function close() {
    list.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    trigger.removeAttribute("aria-activedescendant");
  }
  function choose(index) {
    close();
    trigger.focus({ preventScroll: true });
    onChange(Number(options[index].dataset.value));
  }
  function setValue(value, chapters = []) {
    options.forEach((option, i) => {
      const chapter = chapters.find(chapter => chapter.id === i);
      labels[i] = i === 0 ? "Before Chapter One" : `Chapter ${words[i - 1]}${chapter ? " · " + chapter.title : ""}${i === 12 ? " · partial" : ""}`;
      option.firstChild.textContent = labels[i];
    });
    selected = options.findIndex(
      (option) => Number(option.dataset.value) === value,
    );
    if (selected < 0) selected = 0;
    valueLabel.textContent = labels[selected];
    options.forEach((option, i) =>
      option.setAttribute("aria-selected", String(i === selected)),
    );
  }
  trigger.addEventListener("click", () => (list.hidden ? open() : close()));
  options.forEach((option, index) => {
    // Keep focus on the combobox while pointer selection commits an option.
    option.addEventListener("pointerdown", (event) => event.preventDefault());
    option.addEventListener("click", () => choose(index));
    option.addEventListener("pointermove", () => highlight(index));
  });
  trigger.addEventListener("keydown", (event) => {
    const { key } = event;
    if (key === "Tab") {
      close();
      return;
    }
    if (key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (["ArrowDown", "ArrowUp", "Home", "End", "Enter", " "].includes(key)) {
      event.preventDefault();
      if (key === "Enter" || key === " ") {
        if (list.hidden) open();
        else choose(active);
      } else if (key === "Home") open(0);
      else if (key === "End") open(options.length - 1);
      else if (list.hidden) open();
      else highlight(active + (key === "ArrowDown" ? 1 : -1));
    } else if (
      key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      const match = labels.findIndex((label) =>
        label.toLowerCase().startsWith(key.toLowerCase()),
      );
      if (match >= 0) {
        event.preventDefault();
        open(match);
      }
    }
  });
  document.addEventListener("pointerdown", (event) => {
    if (!root.contains(event.target)) close();
  });
  root.addEventListener("focusout", (event) => {
    if (!root.contains(event.relatedTarget)) close();
  });
  return { setValue };
}
