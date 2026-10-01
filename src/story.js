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
