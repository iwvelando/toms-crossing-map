// Reviewed, reader-facing chapter data. Private research stays outside this module.
export const chapter = { id: 1, title: "Paddock B", label: "Chapter One" };
export const characters = [
  { id: "K", name: "Kalin March", initial: "K", chapter: 1 },
];
export const locations = [
  {
    id: "HOME-A",
    name: "March apartment",
    x: -10,
    z: 5,
    y: 0.12,
    reveal: 0,
    chapter: 1,
  },
  {
    id: "PARK-K",
    name: "Kiwanis Park",
    x: -6.5,
    z: 3,
    y: 0.12,
    reveal: 0,
    chapter: 1,
  },
  {
    id: "WILLOW-OAK",
    name: "Willow & Oak",
    x: -2.6,
    z: 4.6,
    y: 0.12,
    reveal: 0,
    chapter: 1,
  },
  {
    id: "PAD-B",
    name: "Paddock B",
    x: -1.2,
    z: 1.8,
    y: 0.12,
    reveal: 1,
    chapter: 1,
  },
  {
    id: "HILLS",
    name: "Oak Hills",
    x: 3.3,
    z: -0.4,
    y: 0.73,
    reveal: 2,
    chapter: 1,
  },
  {
    id: "SHORE",
    name: "Shoreline path",
    x: 8,
    z: -4.5,
    y: 1.95,
    reveal: 2,
    chapter: 1,
  },
];
export const events = [
  {
    id: "leaving-home",
    character: "K",
    chapter: 1,
    title: "Leaving home",
    time: "Wednesday · about 4:07 p.m.",
    mode: "On foot",
    summary:
      "Kalin leaves the March apartment, crosses the small parking lot, and leaves the street for Kiwanis Park. He continues to Willow and Oak.",
    route: ["HOME-A", "PARK-K", "WILLOW-OAK"],
    note: "The order of these places is narrated. The street alignment and distances between them are not established.",
  },
  {
    id: "paddock",
    character: "K",
    chapter: 1,
    title: "Out of the paddock",
    time: "Wednesday · after leaving home",
    mode: "Riding Navidad · leading Mouse",
    summary:
      "Finding Paddock A empty, Kalin enters Paddock B, halters the horses, mounts Navidad, and leads Mouse out onto Willow.",
    route: ["WILLOW-OAK", "PAD-B", "WILLOW-OAK"],
    note: "The exit onto Willow is distinct from the gate between Paddocks A and B. This route does not assign responsibility for the earlier transfer of the horses.",
  },
  {
    id: "foothills",
    character: "K",
    chapter: 1,
    title: "Above the tree streets",
    time: "Wednesday · afternoon / evening",
    mode: "Riding Navidad · leading Mouse",
    summary:
      "Kalin leaves Willow for a narrow path through brush, passes through Oak Hills and undeveloped lots, and climbs two switchbacks. A steeper ascent brings the horses to the gravel service path.",
    route: ["WILLOW-OAK", "HILLS", "SHORE"],
    note: "The ascent and two switchbacks are narrated. Their shapes, bearings, and elevations on this board are illustrative.",
  },
];
export function getView(limit, step, characterId = "K") {
  const allowed = events.filter(
    (event) => event.chapter <= limit && event.character === characterId,
  );
  const index = Math.max(
    0,
    Math.min(Number.isFinite(step) ? Math.floor(step) : 0, allowed.length - 1),
  );
  return {
    events: allowed,
    index,
    current: allowed[index] ?? null,
    characters: characters.filter((person) => person.chapter <= limit),
    locations: locations.filter(
      (place) =>
        place.chapter <= limit && place.reveal <= index && allowed.length,
    ),
    traversed: allowed.slice(0, index + 1),
  };
}
