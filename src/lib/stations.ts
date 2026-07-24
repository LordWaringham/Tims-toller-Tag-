import type { LineId } from "./lines";

export type StationId =
  | "aufwachen"
  | "anziehen"
  | "fruehstueck"
  | "turm"
  | "aufraeumen"
  | "blumen"
  | "kekse"
  | "pfuetzen"
  | "schafe"
  | "schmetterlinge"
  | "gutenacht";

export interface Station {
  id: StationId;
  /** Beschriftung auf der Tageskarte. */
  titel: string;
  /** Hintergrundbild aus dem Buch. */
  szene: string;
  /** Sticker, den es fürs Abschließen gibt. */
  sticker: string;
  /** Was das Kind dabei übt — nur für Erwachsene sichtbar. */
  lernziel: string;
  intro: LineId;
  /** Himmelsfarben für diese Tageszeit (oben, unten). */
  himmel: [string, string];
}

export const STATIONS: Station[] = [
  {
    id: "aufwachen",
    titel: "Aufwachen",
    szene: "/scenes/aufwachen.webp",
    sticker: "☀️",
    lernziel: "Ursache und Wirkung",
    intro: "s01-intro",
    himmel: ["#2b3f6b", "#f0a868"],
  },
  {
    id: "anziehen",
    titel: "Anziehen",
    szene: "/scenes/anziehen.webp",
    sticker: "👕",
    lernziel: "Zuordnen und Farben",
    intro: "s02-intro",
    himmel: ["#7fa8d8", "#ffd9a0"],
  },
  {
    id: "fruehstueck",
    titel: "Frühstück",
    szene: "/scenes/fruehstueck.webp",
    sticker: "🍓",
    lernziel: "Zählen bis 5",
    intro: "s03-intro",
    himmel: ["#8fbce8", "#ffe6b8"],
  },
  {
    id: "turm",
    titel: "Turm bauen",
    szene: "/scenes/turm.webp",
    sticker: "🧱",
    lernziel: "Zählen und Feinmotorik",
    intro: "s04-intro",
    himmel: ["#9ccbec", "#ffeecb"],
  },
  {
    id: "aufraeumen",
    titel: "Aufräumen",
    szene: "/scenes/aufraeumen.webp",
    sticker: "🧸",
    lernziel: "Sortieren nach Kategorien",
    intro: "s05-intro",
    himmel: ["#a8d4f0", "#fff2d8"],
  },
  {
    id: "blumen",
    titel: "Blumen gießen",
    szene: "/scenes/blumen.webp",
    sticker: "🌼",
    lernziel: "Geduld und Ausdauer",
    intro: "s06-intro",
    himmel: ["#a8d4f0", "#ffeed0"],
  },
  {
    id: "kekse",
    titel: "Kekse backen",
    szene: "/scenes/kekse.webp",
    sticker: "🍪",
    lernziel: "Reihenfolge und Formen",
    intro: "s07-intro",
    himmel: ["#9fcbe8", "#ffe3bc"],
  },
  {
    id: "pfuetzen",
    titel: "Pfützen",
    szene: "/scenes/pfuetzen.webp",
    sticker: "👢",
    lernziel: "Rhythmus und Timing",
    intro: "s08-intro",
    himmel: ["#8296a8", "#c8d4dc"],
  },
  {
    id: "schafe",
    titel: "Schafe",
    szene: "/scenes/schafe.webp",
    sticker: "🐑",
    lernziel: "Zählen bis 10",
    intro: "s09-intro",
    himmel: ["#8fc0e0", "#ffe0b0"],
  },
  {
    id: "schmetterlinge",
    titel: "Schmetterlinge",
    szene: "/scenes/schmetterlinge.webp",
    sticker: "🦋",
    lernziel: "Farben zuordnen",
    intro: "s10-intro",
    himmel: ["#f0b070", "#ffd8a0"],
  },
  {
    id: "gutenacht",
    titel: "Gute Nacht",
    szene: "/scenes/gutenacht.webp",
    sticker: "⭐",
    lernziel: "Zur Ruhe kommen",
    intro: "s11-intro",
    himmel: ["#141c38", "#3c4a78"],
  },
];

export const STATION_IDS = STATIONS.map((s) => s.id);

export function stationIndex(id: StationId) {
  return STATIONS.findIndex((s) => s.id === id);
}

export function nextStation(id: StationId): Station | null {
  const i = stationIndex(id);
  return i >= 0 && i < STATIONS.length - 1 ? STATIONS[i + 1] : null;
}
