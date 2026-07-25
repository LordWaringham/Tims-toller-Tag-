/**
 * Gestreute, aber feste Zufallswerte.
 *
 * Konfetti, Regentropfen und Sterne sollen unregelmäßig aussehen — aber immer
 * gleich, sobald sie einmal berechnet sind. Echtes Math.random() beim Rendern
 * würde bei jedem neuen Rendern andere Werte liefern und die Tropfen springen
 * lassen. Diese Funktion liefert zu gleichen Eingaben immer dasselbe Ergebnis.
 */
export function streu(index: number, salz = 0): number {
  // Ganzzahliger Hash (xorshift-artig), danach auf 0…1 normiert.
  let h = (index + 1) * 374761393 + salz * 668265263;
  h = (h ^ (h >>> 13)) >>> 0;
  h = Math.imul(h, 1274126177) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 4294967296;
}

/** Streuwert in einem Bereich. */
export function streuIn(index: number, salz: number, von: number, bis: number): number {
  return von + streu(index, salz) * (bis - von);
}

/**
 * Eine Saat, die sich bei jedem Aufruf einer Station ändert.
 *
 * Gedacht für Anordnung und Farben, damit ein Kind, das den Tag zum zehnten
 * Mal spielt, nicht jedes Mal exakt dasselbe Bild sieht. Bewusst *nicht* für
 * die Aufgaben selbst: Dass immer drei Erdbeeren gefragt sind, ist kein Mangel
 * an Abwechslung, sondern der Grund, warum das Zählen sitzen bleibt.
 */
export function neueSaat(): number {
  return Math.floor(Date.now() / 1000) % 9973;
}

/** Mischt eine Liste anhand der Saat — gleiche Saat, gleiche Reihenfolge. */
export function mischen<T>(liste: readonly T[], saat: number): T[] {
  const kopie = [...liste];
  for (let i = kopie.length - 1; i > 0; i--) {
    const j = Math.floor(streu(i, saat) * (i + 1));
    [kopie[i], kopie[j]] = [kopie[j], kopie[i]];
  }
  return kopie;
}
