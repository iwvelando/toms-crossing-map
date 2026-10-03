// Pure disclosure projection. Chapter payloads enter only after explicit selection.
export function combinePayloads(payloads) {
  const data = { chapters: [], characters: [], locations: [], events: [] };
  for (const payload of payloads) {
    for (const key of Object.keys(data)) data[key].push(...(payload[key] || []));
  }
  data.events = data.events.map(event => ({ ...event, disclosures: [...(event.disclosures || [])] }));
  data.locations = data.locations.map(place => ({ ...place, notes: [...(place.notes || [])] }));
  for (const payload of payloads) {
    for (const addition of payload.eventAdditions || []) {
      const event = data.events.find(event => event.id === addition.id);
      if (!event) throw new Error("Disclosure references an unknown event");
      const { id, ...disclosure } = addition;
      event.disclosures.push(disclosure);
    }
    for (const note of payload.annotations || []) {
      const place = data.locations.find(place => place.id === note.id);
      if (!place) throw new Error("Annotation references an unknown location");
      place.notes.push({ chapter: note.chapter, text: note.text });
    }
  }
  return data;
}
const initial = combinePayloads([]);
function disclosedEvent(event, limit) {
  const { disclosures = [], ...visible } = event;
  for (const disclosure of disclosures.filter(disclosure => disclosure.chapter <= limit)) {
    visible.routes = { ...visible.routes, ...(disclosure.routes || {}) };
    visible.people = [...new Set([...visible.people, ...(disclosure.people || [])])];
    visible.note = `${visible.note} ${disclosure.note || ""}`.trim();
  }
  return visible;
}
function forParticipant(event, person) {
  const personId = person.id;
  if (person.spectral && !["recollection", "plan", "dream"].includes(event.kind))
    return { ...event, kind: "spectral", mode: "Spectral accompaniment / presence" };
  const route = event.routes?.[personId];
  if (route?.length === 1 && !event.actors.includes(personId) && ["travel", "failed ascent", "bodily relocation"].includes(event.kind))
    return { ...event, kind: "presence", mode: "Presence during another participant's movement", position: route[0] };
  return event;
}
export function getView(limit, step, characterId = "K", data = initial, layer = "journey") {
  const safe = Number.isInteger(limit) && limit > 0 && limit <= 12 ? limit : 0;
  const visibleCharacters = safe ? data.characters.filter(person => person.chapter <= safe) : [];
  const selected = visibleCharacters.find(person => person.id === characterId);
  const allowed = selected ? data.events.map(event => forParticipant(disclosedEvent(event, safe), selected)).filter(event => event.chapter <= safe && event.people.includes(characterId) &&
    (layer === "all" || (layer === "journey" ? !["recollection", "plan", "spectral", "dream"].includes(event.kind) : event.kind === layer))) : [];
  const index = Math.max(0, Math.min(Number.isFinite(step) ? Math.floor(step) : 0, allowed.length - 1));
  const current = allowed[index] ?? null;
  const route = current ? (current.routes?.[characterId] ?? (current.actors.includes(characterId) ? current.route : [])) : [];
  const places = new Set([...route, ...(current?.places || [])]);
  const visibleLocations = data.locations.filter(place => place.chapter <= safe && places.has(place.id))
    .map(place => ({ ...place, notes: (place.notes || []).filter(note => note.chapter <= safe), reveal: index }));
  const draw = current && !["plan", "dream", "presence", "failed ascent"].includes(current.kind) && route.length > 1 &&
    route.every(id => visibleLocations.some(place => place.id === id && Number.isFinite(place.x) && Number.isFinite(place.z)));
  const position = current && current.position !== null ? route.at(-1) ?? null : null;
  return { events: allowed, index, current, characters: visibleCharacters, locations: visibleLocations,
    traversed: current ? [current] : [], route, drawnRoute: draw ? route : [], position, selected,
    chapters: safe ? data.chapters.filter(c => c.id <= safe) : [] };
}

// Counts and comparison reuse the same per-participant disclosure projection.
export function getLayerCharacters(limit, data = initial, layer = "all", chapterOnly = false) {
  return getView(limit, 0, "", data, layer).characters.map(person => {
    const events = getView(limit, 0, person.id, data, layer).events;
    return { ...person, count: events.filter(event => !chapterOnly || event.chapter === limit).length };
  });
}

export function getChapterOverview(limit, characterIds, data = initial, layer = "all") {
  const characters = getLayerCharacters(limit, data, layer, true);
  const chosen = new Set(characterIds);
  const entries = characters.filter(person => chosen.has(person.id)).flatMap(person => {
    const view = getView(limit, 0, person.id, data, layer);
    return view.events.flatMap((event, index) => event.chapter === limit ? [getView(limit, index, person.id, data, layer)] : []);
  });
  const places = new Map();
  for (const entry of entries) for (const place of entry.locations) {
    if (!places.has(place.id)) places.set(place.id, { ...place, characterId: entry.selected.id, reveal: entry.index });
  }
  return { characters, entries, locations: [...places.values()] };
}

// Journal focus is an observation from this entry, never a carried-forward position.
export function getChapterJournalFocus(view) {
  if (!view.selected || !view.current || view.current.chapter !== view.chapters.at(-1)?.id) return null;
  const location = view.locations.find(place => place.id === view.position && Number.isFinite(place.x) && Number.isFinite(place.z));
  if (!location) return null;
  const final = view.events.findLast(event => event.chapter === view.current.chapter);
  return { location, ghost: final?.id !== view.current.id };
}
