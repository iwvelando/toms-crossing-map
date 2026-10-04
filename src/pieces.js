// Abstract game pieces, never portraits. Identity stays stable across layers.
const colors = ["#efc477", "#79cbd8", "#ce9ee8", "#f19782", "#a8d397", "#a6b8ff", "#e9a6ce", "#d5d78a"];
const shapes = ["orb", "diamond", "spire", "cube", "ring"];
export function pieceStyle(id, characters) {
  const index = Math.max(0, characters.findIndex(person => person.id === id));
  const color = colors[index] || `hsl(${Math.round(index * 137.508) % 360}, ${55 + index % 3 * 8}%, ${68 + index % 2 * 8}%)`;
  return { number: index + 1, color, shape: shapes[index % shapes.length] };
}
