/**
 * Schaut nach, welche Sprachaufnahmen in public/audio liegen, und schreibt
 * daraus public/audio/manifest.json.
 *
 * Läuft automatisch vor jedem Build. Neue Aufnahme einfach in den Ordner
 * legen und `npm run build` — mehr ist nicht nötig.
 */

import { readdir, writeFile, readFile } from "node:fs/promises";
import { join, dirname, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const wurzel = join(dirname(fileURLToPath(import.meta.url)), "..");
const audioOrdner = join(wurzel, "public", "audio");
const ziel = join(audioOrdner, "manifest.json");

const ERLAUBT = new Set([".mp3", ".m4a", ".ogg", ".wav", ".webm", ".aac"]);

/** Die gültigen IDs stehen in src/lib/lines.ts. */
async function bekannteIds() {
  const quelle = await readFile(join(wurzel, "src", "lib", "lines.ts"), "utf8");
  const ids = new Set();
  // Sowohl "mit-strich": "..." als auch schlicht titel: "..."
  for (const treffer of quelle.matchAll(/^\s*"?([a-z0-9-]+)"?\s*:\s*"/gm)) {
    ids.add(treffer[1]);
  }
  return ids;
}

async function main() {
  let dateien = [];
  try {
    dateien = await readdir(audioOrdner);
  } catch {
    console.log("audio-manifest: kein Ordner public/audio — überspringe.");
    return;
  }

  const ids = await bekannteIds();
  const manifest = {};
  const unbekannt = [];

  for (const datei of dateien) {
    const ext = extname(datei).toLowerCase();
    if (!ERLAUBT.has(ext)) continue;
    const id = basename(datei, ext);
    if (!ids.has(id)) {
      unbekannt.push(datei);
      continue;
    }
    manifest[id] = datei;
  }

  await writeFile(ziel, JSON.stringify(manifest, null, 2) + "\n", "utf8");

  const anzahl = Object.keys(manifest).length;
  console.log(
    anzahl === 0
      ? "audio-manifest: keine Aufnahmen gefunden — es liest die Gerätestimme vor."
      : `audio-manifest: ${anzahl} von ${ids.size} Sätzen sind eingesprochen.`,
  );
  if (unbekannt.length) {
    console.warn(
      `audio-manifest: ${unbekannt.length} Datei(en) passen zu keinem Satz und werden ignoriert:\n  ` +
        unbekannt.join("\n  "),
    );
  }
}

main().catch((fehler) => {
  console.error("audio-manifest:", fehler);
  process.exitCode = 1;
});
