// Pixel-bot avatars in the Sundai "It Takes a Swarm" style. Pure data plus one
// SVG builder, so the look is deterministic per agent and needs no assets.

export const palette = [
  "#a99cf5", // lavender
  "#74a8f2", // sky
  "#f49ac1", // pink
  "#7ed8c3", // mint
  "#f6ad6e", // peach
  "#efe4cc", // cream
];

const SIZE = 16;
const GOLD = "#f5b942";
const LEAF = "#7bd88f";
const SCREEN = "#0b1020";

function hash(value) {
  let h = 2166136261;
  for (const ch of String(value)) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const channel = (shift) =>
    Math.round(((n >> shift) & 255) * (1 - amount))
      .toString(16)
      .padStart(2, "0");
  return "#" + channel(16) + channel(8) + channel(0);
}

// Each feature is a list of [row, col, colorKey] pixels painted in order.
const span = (row, from, to, key) =>
  Array.from({ length: to - from + 1 }, (_, i) => [row, from + i, key]);

const head = [
  ...span(4, 3, 12, "head"),
  ...[5, 6, 7, 8, 9, 10, 11, 12, 13].flatMap((r) => span(r, 2, 13, "head")),
  ...span(14, 3, 12, "shade"),
  // Side bolts, like the headphone ears in the project art.
  ...[8, 9, 10].flatMap((r) => [
    [r, 1, "shade"],
    [r, 14, "shade"],
  ]),
  // Face screen with pixel-rounded corners.
  ...span(6, 5, 10, "screen"),
  ...[7, 8, 9, 10, 11].flatMap((r) => span(r, 4, 11, "screen")),
  ...span(12, 5, 10, "screen"),
];

const tops = [
  // single antenna
  [...span(0, 7, 8, "gold"), ...span(1, 7, 8, "gold"), [1, 6, "gold"], [1, 9, "gold"], [0, 6, null], ...span(2, 7, 8, "shade"), ...span(3, 7, 8, "shade")],
  // twin antennas
  [[0, 4, "gold"], [0, 11, "gold"], [1, 4, "shade"], [1, 11, "shade"], [2, 4, "shade"], [2, 11, "shade"], [3, 4, "shade"], [3, 11, "shade"]],
  // cat ears
  [[1, 3, "head"], [1, 12, "head"], ...span(2, 3, 4, "head"), ...span(2, 11, 12, "head"), ...span(3, 3, 5, "head"), ...span(3, 10, 12, "head"), [2, 4, "cheek"], [2, 11, "cheek"]],
  // sprout
  [...span(1, 5, 6, "leaf"), ...span(1, 9, 10, "leaf"), [0, 5, "leaf"], [0, 10, "leaf"], ...span(2, 7, 8, "leaf"), ...span(3, 7, 8, "leaf")],
  // dome cap
  [...span(2, 6, 9, "shade"), ...span(3, 5, 10, "shade"), [2, 7, "gold"]],
];

const eyes = [
  // dots
  [...span(7, 5, 6, "eye"), ...span(8, 5, 6, "eye"), ...span(7, 9, 10, "eye"), ...span(8, 9, 10, "eye")],
  // happy ^ ^
  [[7, 6, "eye"], [8, 5, "eye"], [8, 7, "eye"], [7, 9, "eye"], [8, 8, "eye"], [8, 10, "eye"]],
  // visor
  [...span(7, 5, 10, "eye"), ...span(8, 5, 10, "eye"), [7, 6, "screen"]],
  // wink
  [...span(7, 5, 6, "eye"), ...span(8, 5, 6, "eye"), ...span(8, 9, 10, "eye")],
];

const mouths = [
  [[10, 6, "eye"], [10, 9, "eye"], ...span(11, 7, 8, "eye")],
  [...span(11, 7, 8, "eye"), [10, 4, "cheek"], [10, 11, "cheek"]],
];

/** Pick a stable look for an agent. Color follows list position so neighbors never clash. */
export function botTraits(id, index = 0) {
  const h = hash(id);
  return {
    color: palette[index % palette.length],
    top: h % tops.length,
    eyes: (h >>> 4) % eyes.length,
    mouth: (h >>> 8) % mouths.length,
  };
}

/** Build a crisp pixel-art SVG for one agent. */
export function botAvatar(document, id, index = 0) {
  const t = botTraits(id, index);
  const colors = {
    head: t.color,
    shade: shade(t.color, 0.28),
    screen: SCREEN,
    eye: "#eef2ff",
    gold: GOLD,
    leaf: LEAF,
    cheek: "#f49ac1",
  };
  const grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  for (const [r, c, key] of [...tops[t.top], ...head, ...eyes[t.eyes], ...mouths[t.mouth]])
    grid[r][c] = key;

  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `0 0 ${SIZE} ${SIZE}`);
  svg.setAttribute("shape-rendering", "crispEdges");
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("bot");
  // Merge horizontal runs of one color to keep the DOM small.
  grid.forEach((row, r) => {
    for (let c = 0; c < SIZE; ) {
      const key = row[c];
      let end = c;
      while (end + 1 < SIZE && row[end + 1] === key) end++;
      if (key) {
        const rect = document.createElementNS(ns, "rect");
        rect.setAttribute("x", c);
        rect.setAttribute("y", r);
        rect.setAttribute("width", end - c + 1);
        rect.setAttribute("height", 1);
        rect.setAttribute("fill", colors[key]);
        svg.append(rect);
      }
      c = end + 1;
    }
  });
  return svg;
}
