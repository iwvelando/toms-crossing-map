/** Shared select-only combobox. Exploration never commits a selection. */
export function createPicker(root, onChange) {
  const trigger = root.querySelector('[role="combobox"]');
  const label = root.querySelector('[data-picker-value]');
  const list = root.querySelector('[role="listbox"]');
  list.classList.add("picker-options");
  list.setAttribute("popover", "manual");
  let items = [], selected = 0, active = 0, search = "", typedAt = 0;
  function close() {
    if (list.matches(":popover-open")) list.hidePopover();
    list.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    trigger.removeAttribute("aria-activedescendant");
  }
  function highlight(index) {
    active = Math.max(0, Math.min(items.length - 1, index));
    [...list.children].forEach((node, i) => node.classList.toggle("focused", i === active));
    const node = list.children[active];
    if (!node) return;
    trigger.setAttribute("aria-activedescendant", node.id);
    if (node.offsetTop < list.scrollTop) list.scrollTop = node.offsetTop;
    else if (node.offsetTop + node.offsetHeight > list.scrollTop + list.clientHeight)
      list.scrollTop = node.offsetTop + node.offsetHeight - list.clientHeight;
  }
  function position() {
    const rect = trigger.getBoundingClientRect();
    const below = innerHeight - rect.bottom - 12, above = rect.top - 12;
    const upward = below < 220 && above > below;
    Object.assign(list.style, {
      width: `${Math.min(Math.max(rect.width, 260), innerWidth - 24)}px`,
      maxHeight: `${Math.max(80, Math.min(400, upward ? above : below))}px`,
      left: `${Math.max(12, Math.min(rect.left, innerWidth - Math.max(rect.width, 260) - 12))}px`,
      top: upward ? "auto" : `${rect.bottom + 6}px`,
      bottom: upward ? `${innerHeight - rect.top + 6}px` : "auto",
    });
  }
  function open(index = selected) {
    if (trigger.disabled || !items.length) return;
    document.dispatchEvent(new CustomEvent("atlas-picker-open", { detail: trigger.id }));
    position();
    list.hidden = false;
    list.showPopover();
    trigger.setAttribute("aria-expanded", "true");
    highlight(index);
  }
  function choose(index) {
    const item = items[index];
    if (!item) return;
    close();
    trigger.focus({ preventScroll: true });
    onChange(item.value);
  }
  function setOptions(options, value, disabled = false) {
    close();
    items = options;
    selected = Math.max(0, items.findIndex(item => item.value === String(value)));
    trigger.disabled = disabled || !items.length;
    label.textContent = items[selected]?.label || "No characters available";
    list.replaceChildren(...items.map((item, index) => {
      const node = document.createElement("li");
      node.id = item.id;
      node.dataset.value = item.value;
      node.setAttribute("role", "option");
      node.setAttribute("aria-selected", String(index === selected));
      node.textContent = item.label;
      node.onpointerdown = event => event.preventDefault();
      node.onclick = () => choose(index);
      node.onpointermove = () => highlight(index);
      return node;
    }));
  }
  trigger.onclick = () => list.hidden ? open() : close();
  trigger.addEventListener("keydown", event => {
    const { key } = event;
    if (key === "Tab") { close(); return; }
    if (key === "Escape") { event.preventDefault(); close(); return; }
    if (["ArrowDown", "ArrowUp", "Home", "End", "Enter", " "].includes(key)) {
      event.preventDefault();
      if (key === "Enter" || key === " ") list.hidden ? open() : choose(active);
      else if (key === "Home") open(0);
      else if (key === "End") open(items.length - 1);
      else if (list.hidden) open();
      else highlight(active + (key === "ArrowDown" ? 1 : -1));
    } else if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const now = Date.now();
      search = now - typedAt < 700 ? search + key.toLowerCase() : key.toLowerCase();
      typedAt = now;
      let match = items.findIndex(item => item.label.toLowerCase().startsWith(search));
      if (match < 0) { search = key.toLowerCase(); match = items.findIndex(item => item.label.toLowerCase().startsWith(search)); }
      if (match >= 0) { event.preventDefault(); open(match); }
    }
  });
  document.addEventListener("atlas-picker-open", event => { if (event.detail !== trigger.id) close(); });
  document.addEventListener("pointerdown", event => { if (!root.contains(event.target)) close(); });
  document.addEventListener("scroll", event => {
    if (!list.hidden && !list.contains(event.target)) position();
  }, true);
  window.addEventListener("resize", close);
  root.addEventListener("focusout", event => { if (!root.contains(event.relatedTarget)) close(); });
  return { setOptions };
}

/** Native options remain a hidden value store; only the styled control is interactive. */
export function createSelectPicker(select) {
  const old = select.parentElement;
  const root = document.createElement("div");
  root.className = "journal-control select-picker";
  const caption = old.querySelector("span") || document.createElement("span");
  if (!caption.textContent) caption.textContent = old.firstChild.textContent;
  caption.id ||= `${select.id}-label`;
  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.id = `${select.id}-trigger`;
  trigger.className = "picker-trigger";
  trigger.setAttribute("role", "combobox");
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-controls", `${select.id}-options`);
  const label = document.createElement("span");
  label.id = `${select.id}-value`;
  label.dataset.pickerValue = "";
  trigger.setAttribute("aria-labelledby", `${caption.id} ${label.id}`);
  trigger.append(label);
  const list = document.createElement("ul");
  list.id = `${select.id}-options`;
  list.setAttribute("role", "listbox");
  list.setAttribute("aria-labelledby", caption.id);
  list.hidden = true;
  select.hidden = true;
  old.replaceWith(root);
  root.append(caption, select, trigger, list);
  const picker = createPicker(root, value => {
    select.value = value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
  return { sync: () => picker.setOptions([...select.options].map(option => ({
    value: option.value, label: option.textContent, id: `${select.id}-option-${option.value}`,
  })), select.value, select.disabled) };
}
