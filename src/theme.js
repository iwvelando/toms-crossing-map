import { THEME_KEY } from "./preferences.js";

export function createThemeControl(onChange) {
  const system = window.matchMedia("(prefers-color-scheme: dark)");
  const root = document.documentElement;
  const toggle = document.querySelector("#theme-toggle");
  const automatic = document.querySelector("#theme-system");
  let preference = root.dataset.themePreference || "system";
  function apply() {
    const theme = preference === "system" ? (system.matches ? "dark" : "light") : preference;
    root.dataset.theme = theme;
    root.dataset.themePreference = preference;
    toggle.setAttribute("aria-pressed", String(theme === "dark"));
    toggle.textContent = theme === "dark" ? "☾ Dark" : "☀ Light";
    toggle.title = `Switch to ${theme === "dark" ? "light" : "dark"} theme`;
    automatic.disabled = preference === "system";
    document.querySelector('meta[name="theme-color"]').content = theme === "dark" ? "#0b1522" : "#eeede5";
    onChange(theme);
  }
  function choose(value) {
    preference = value;
    try {
      if (value === "system") localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, value);
    } catch { /* Theme changes still work without persistence. */ }
    apply();
  }
  toggle.onclick = () => choose(root.dataset.theme === "dark" ? "light" : "dark");
  automatic.onclick = () => choose("system");
  system.addEventListener("change", () => { if (preference === "system") apply(); });
  apply();
}
