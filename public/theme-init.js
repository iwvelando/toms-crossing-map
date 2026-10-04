// Run before the first paint. This local script also works under the production CSP.
(() => {
  let preference = "system";
  try {
    const saved = localStorage.getItem("toms-crossing-map.theme");
    if (saved === "light" || saved === "dark") preference = saved;
  } catch { /* Use the system preference when storage is unavailable. */ }
  const theme = preference === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : preference;
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.themePreference = preference;
})();
