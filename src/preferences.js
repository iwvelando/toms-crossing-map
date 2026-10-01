export const STATE_KEY = "toms-crossing-map.state";
export const THEME_KEY = "toms-crossing-map.theme";
const layers = new Set(["journey", "all", "recollection", "plan", "spectral", "dream"]);
const validId = value => typeof value === "string" && /^[\w-]{1,120}$/.test(value);
const vector = value => Array.isArray(value) && value.length === 3 && value.every(number => Number.isFinite(number) && Math.abs(number) <= 500);

export function normalizeState(value) {
  if (!value || Array.isArray(value) || value.version !== 1 || !Number.isInteger(value.limit) || value.limit < 0 || value.limit > 12) return null;
  const camera = value.camera;
  const validCamera = camera && vector(camera.position) && vector(camera.target) && Number.isFinite(camera.zoom) && camera.zoom >= 0.65 && camera.zoom <= 3 && Math.hypot(...camera.position.map((number, index) => number - camera.target[index])) > 0.1;
  return {
    version: 1, limit: value.limit,
    characterId: validId(value.characterId) ? value.characterId : "K",
    eventId: validId(value.eventId) ? value.eventId : null,
    layer: layers.has(value.layer) ? value.layer : "journey",
    mapMode: value.mapMode === "chapter" ? "chapter" : "entry",
    compared: Array.isArray(value.compared) ? [...new Set(value.compared.filter(validId))].slice(0, 200) : ["K"],
    selected: value.selected !== false,
    showLocations: value.showLocations === true,
    expanded: value.expanded === true,
    detailsOpen: value.detailsOpen === true,
    camera: validCamera ? { position: [...camera.position], target: [...camera.target], zoom: camera.zoom, overhead: camera.overhead === true } : null,
  };
}
export function readState(storage) {
  try { return normalizeState(JSON.parse((storage ?? globalThis.localStorage).getItem(STATE_KEY))); }
  catch { return null; }
}
export function writeState(value, storage) {
  try {
    const safe = normalizeState(value);
    if (safe) (storage ?? globalThis.localStorage).setItem(STATE_KEY, JSON.stringify(safe));
  } catch { /* Private browsing or a full store must not break the atlas. */ }
}
