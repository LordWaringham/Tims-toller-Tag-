/**
 * Für wen das Spiel gemacht ist.
 *
 * Drei Kinder an einem Tablet brauchen drei Spielstände. Sonst findet die
 * Zweite alles schon aufgeschlossen vor, und die Reise durch den Tag — das
 * Herzstück des Spiels — fällt für sie aus.
 */

export interface Kind {
  id: string;
  name: string;
  /** Wird für ihren Knopf und ihr Stickerheft verwendet. */
  farbe: string;
  hell: string;
  /** Frühere ID, falls der Name einmal falsch geschrieben war. */
  frueher?: string;
}

export const KINDER: Kind[] = [
  { id: "luise", name: "Luise", farbe: "#d95f8a", hell: "#f8c8da", frueher: "luisa" },
  { id: "maya", name: "Maya", farbe: "#3e8fb0", hell: "#b7dced" },
  { id: "marla", name: "Marla", farbe: "#6ba32f", hell: "#cfe8a8" },
];

/** Von wem das Spiel kommt. */
export const SCHENKER = "Onkel Tom";

/**
 * Sein Bild — wird auf dem Titelbild eingeblendet, während die Widmung
 * gesprochen wird.
 *
 * Die Datei ist nicht Teil des Spiels: Liegt sie nicht in `public/`, erscheint
 * einfach kein Bild, und alles andere läuft weiter wie bisher. Ein Kind, das
 * „von Onkel Tom" hört, soll wissen, wer das ist.
 */
export const SCHENKER_BILD = "/onkel-tom.webp";

/** „Luise, Maya und Marla“ — für Widmungen und Anreden. */
export const NAMEN = KINDER.map((k) => k.name)
  .join(", ")
  .replace(/, ([^,]*)$/, " und $1");

export function kindFinden(id: string | null): Kind | null {
  if (!id) return null;
  return KINDER.find((k) => k.id === id) ?? null;
}
