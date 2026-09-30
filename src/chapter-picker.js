/** Select-only combobox: exploring options never changes the reading boundary. */
export function createChapterPicker(root, onChange) {
  const trigger = root.querySelector('[role="combobox"]');
  const valueLabel = root.querySelector("#chapter-limit-value");
  const list = root.querySelector('[role="listbox"]');
  const options = [...list.querySelectorAll('[role="option"]')];
  const labels = ["Before Chapter One", "Chapter One · Paddock B"];
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
  function setValue(value) {
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
