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
