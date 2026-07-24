import { LINES, type LineId } from "./lines";

/** Die Sätze in derselben Ordnung wie in SPRECHTEXTE.md. */
export interface Gruppe {
  titel: string;
  /** Kurzer Hinweis, worauf es beim Einsprechen ankommt. */
  hinweis?: string;
  saetze: { id: LineId; text: string }[];
}

const ALLE = Object.entries(LINES) as [LineId, string][];

function passend(pruefung: (id: string) => boolean) {
  return ALLE.filter(([id]) => pruefung(id)).map(([id, text]) => ({ id, text }));
}

const STATIONEN: { praefix: string; titel: string }[] = [
  { praefix: "s01", titel: "1 · Aufwachen" },
  { praefix: "s02", titel: "2 · Anziehen" },
  { praefix: "s03", titel: "3 · Frühstück" },
  { praefix: "s04", titel: "4 · Turm bauen" },
  { praefix: "s05", titel: "5 · Aufräumen" },
  { praefix: "s06", titel: "6 · Blumen gießen" },
  { praefix: "s07", titel: "7 · Kekse backen" },
  { praefix: "s08", titel: "8 · Pfützen" },
  { praefix: "s09", titel: "9 · Schafe" },
  { praefix: "s10", titel: "10 · Schmetterlinge" },
  { praefix: "s11", titel: "11 · Gute Nacht" },
];

export const GRUPPEN: Gruppe[] = [
  {
    titel: "Allgemein",
    hinweis:
      "Diese Sätze kommen in jeder Station vor. Mit ihnen anfangen — dann wirkt deine Stimme sofort überall.",
    saetze: passend((id) => !/^s\d\d-/.test(id) && !/^zahl-/.test(id)),
  },
  {
    titel: "Zahlen zum Mitzählen",
    hinweis: "Beim Zählen kommen sie einzeln und schnell hintereinander. Kurz und klar sprechen.",
    saetze: passend((id) => /^zahl-/.test(id)),
  },
  ...STATIONEN.map(({ praefix, titel }) => ({
    titel,
    saetze: passend((id) => id.startsWith(praefix + "-")),
  })),
];

export const ANZAHL_SAETZE = GRUPPEN.reduce((s, g) => s + g.saetze.length, 0);
