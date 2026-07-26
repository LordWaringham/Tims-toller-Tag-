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
  /** Der Satz aus dem Buch, mit dem die Station endet. */
  abschluss: LineId;
  /** „Dafür bekommst du einen …-Sticker." */
  stickerSatz: LineId;
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
    abschluss: "s01-fertig",
    stickerSatz: "sticker-aufwachen",
    himmel: ["#2b3f6b", "#f0a868"],
  },
  {
    id: "anziehen",
    titel: "Anziehen",
    szene: "/scenes/anziehen.webp",
    sticker: "👕",
    lernziel: "Zuordnen und Farben",
    intro: "s02-intro",
    abschluss: "s02-fertig",
    stickerSatz: "sticker-anziehen",
    himmel: ["#7fa8d8", "#ffd9a0"],
  },
  {
    id: "fruehstueck",
    titel: "Frühstück",
    szene: "/scenes/fruehstueck.webp",
    sticker: "🍓",
    lernziel: "Zählen bis 5",
    intro: "s03-intro",
    abschluss: "s03-fertig",
    stickerSatz: "sticker-fruehstueck",
    himmel: ["#8fbce8", "#ffe6b8"],
  },
  {
    id: "turm",
    titel: "Turm bauen",
    szene: "/scenes/turm.webp",
    sticker: "🧱",
    lernziel: "Zählen und Feinmotorik",
    intro: "s04-intro",
    abschluss: "s04-fertig",
    stickerSatz: "sticker-turm",
    himmel: ["#9ccbec", "#ffeecb"],
  },
  {
    id: "aufraeumen",
    titel: "Aufräumen",
    szene: "/scenes/aufraeumen.webp",
    sticker: "🧸",
    lernziel: "Sortieren nach Kategorien",
    intro: "s05-intro",
    abschluss: "s05-fertig",
    stickerSatz: "sticker-aufraeumen",
    himmel: ["#a8d4f0", "#fff2d8"],
  },
  {
    id: "blumen",
    titel: "Blumen gießen",
    szene: "/scenes/blumen.webp",
    sticker: "🌼",
    lernziel: "Geduld und Ausdauer",
    intro: "s06-intro",
    abschluss: "s06-fertig",
    stickerSatz: "sticker-blumen",
    himmel: ["#a8d4f0", "#ffeed0"],
  },
  {
    id: "kekse",
    titel: "Kekse backen",
    szene: "/scenes/kekse.webp",
    sticker: "🍪",
    lernziel: "Reihenfolge und Formen",
    intro: "s07-intro",
    abschluss: "s07-fertig",
    stickerSatz: "sticker-kekse",
    himmel: ["#9fcbe8", "#ffe3bc"],
  },
  {
    id: "pfuetzen",
    titel: "Pfützen",
    szene: "/scenes/pfuetzen.webp",
    sticker: "👢",
    lernziel: "Rhythmus und Timing",
    intro: "s08-intro",
    abschluss: "s08-fertig",
    stickerSatz: "sticker-pfuetzen",
    himmel: ["#8296a8", "#c8d4dc"],
  },
  {
    id: "schafe",
    titel: "Schafe",
    szene: "/scenes/schafe.webp",
    sticker: "🐑",
    lernziel: "Zählen bis 10",
    intro: "s09-intro",
    abschluss: "s09-fertig",
    stickerSatz: "sticker-schafe",
    himmel: ["#8fc0e0", "#ffe0b0"],
  },
  {
    id: "schmetterlinge",
    titel: "Schmetterlinge",
    szene: "/scenes/schmetterlinge.webp",
    sticker: "🦋",
    lernziel: "Farben zuordnen",
    intro: "s10-intro",
    abschluss: "s10-fertig",
    stickerSatz: "sticker-schmetterlinge",
    himmel: ["#f0b070", "#ffd8a0"],
  },
  {
    id: "gutenacht",
    titel: "Gute Nacht",
    szene: "/scenes/gutenacht.webp",
    sticker: "⭐",
    lernziel: "Zur Ruhe kommen",
    intro: "s11-intro",
    abschluss: "s11-fertig",
    stickerSatz: "sticker-gutenacht",
    himmel: ["#141c38", "#3c4a78"],
  },
];

/**
 * Wie lange das fertige Bild stehen bleibt, bevor der Jubel kommt.
 *
 * Vorher waren es je nach Station 0,5 bis 1,2 Sekunden — zu wenig, um
 * überhaupt zu sehen, was man geschafft hat. Der Jubel legt sich mit Konfetti
 * und Weichzeichner über die Szene; wer die aufgegangene Sonne, den fertigen
 * Turm oder den angezogenen Tim nie zu Gesicht bekommt, erlebt den Erfolg
 * nicht, sondern wird nur davon überrascht.
 *
 * In dieser Pause passiert schon etwas: Der Sticker der Station leuchtet
 * unten in der Leiste auf, denn der Fortschritt wird sofort vermerkt.
 */
export const ERFOLGSPAUSE = 2000;

export const STATION_IDS = STATIONS.map((s) => s.id);

function stationIndex(id: StationId) {
  return STATIONS.findIndex((s) => s.id === id);
}

export function nextStation(id: StationId): Station | null {
  const i = stationIndex(id);
  return i >= 0 && i < STATIONS.length - 1 ? STATIONS[i + 1] : null;
}
