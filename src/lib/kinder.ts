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
}

export const KINDER: Kind[] = [
  { id: "luisa", name: "Luisa", farbe: "#d95f8a", hell: "#f8c8da" },
  { id: "maya", name: "Maya", farbe: "#3e8fb0", hell: "#b7dced" },
  { id: "marla", name: "Marla", farbe: "#6ba32f", hell: "#cfe8a8" },
];

/** Von wem das Spiel kommt. */
export const SCHENKER = "Onkel Tom";

export function kindFinden(id: string | null): Kind | null {
  if (!id) return null;
  return KINDER.find((k) => k.id === id) ?? null;
}
