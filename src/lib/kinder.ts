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
  /** Kein eigener Name, sondern der Platz für alle anderen. */
  gast?: boolean;
}

export const KINDER: Kind[] = [
  { id: "luise", name: "Luise", farbe: "#d95f8a", hell: "#f8c8da", frueher: "luisa" },
  { id: "maya", name: "Maya", farbe: "#3e8fb0", hell: "#b7dced" },
  { id: "marla", name: "Marla", farbe: "#6ba32f", hell: "#cfe8a8" },
  /*
   * Der Platz für alle anderen.
   *
   * Wer zu Besuch ist, soll mitspielen können, ohne den Stand von Luise, Maya
   * oder Marla zu überschreiben — genau dafür gibt es die getrennten Stände ja.
   * Der Gastplatz merkt sich seinen Fortschritt wie die anderen auch; auf der
   * Auswahlseite steht daneben ein kleiner Knopf, der ihn für den nächsten
   * Besuch wieder auf null stellt.
   */
  { id: "gast", name: "Gast", farbe: "#8a6fb8", hell: "#d5c8ec", gast: true },
];

/**
 * „Luises Tag mit Tim" — beim Gast ohne Namen.
 *
 * „Gasts Tag" ist kein Deutsch, und „Der Tag des Gastes" klingt wie eine
 * Einladungskarte. Die Anrede in der zweiten Person passt hier ohnehin besser:
 * Wer den Gastplatz nimmt, hat keinen Namen im Spiel, sondern ist einfach du.
 */
export function tagTitel(kind: Kind | null): string {
  if (!kind) return "Tims Tag";
  return kind.gast ? "Dein Tag mit Tim" : `${kind.name}s Tag mit Tim`;
}

export function stickerTitel(kind: Kind | null): string {
  if (!kind || kind.gast) return "Deine Sticker";
  return `${kind.name}s Sticker`;
}

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

/**
 * „Luise, Maya und Marla“ — für Widmungen und Anreden.
 *
 * Ohne den Gastplatz: Gewidmet ist das Spiel den dreien, und „Für Luise,
 * Maya, Marla und Gast" wäre nicht nur schief, sondern falsch.
 */
export const NAMEN = KINDER.filter((k) => !k.gast)
  .map((k) => k.name)
  .join(", ")
  .replace(/, ([^,]*)$/, " und $1");

export function kindFinden(id: string | null): Kind | null {
  if (!id) return null;
  return KINDER.find((k) => k.id === id) ?? null;
}
