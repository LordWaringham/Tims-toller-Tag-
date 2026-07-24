/**
 * Erzeugt SPRECHTEXTE.md — die Liste aller Sätze zum Einsprechen,
 * direkt aus src/lib/lines.ts. So kann die Liste nie veralten.
 *
 *   npm run sprechtexte
 */

import { readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const wurzel = join(dirname(fileURLToPath(import.meta.url)), "..");

const ABSCHNITTE = [
  { praefix: null, titel: "Allgemein", test: (id) => !/^s\d\d-/.test(id) && !/^zahl-/.test(id) },
  { praefix: null, titel: "Zahlen zum Mitzählen", test: (id) => /^zahl-/.test(id) },
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

async function main() {
  const quelle = await readFile(join(wurzel, "src", "lib", "lines.ts"), "utf8");
  const block = quelle.slice(
    quelle.indexOf("export const LINES"),
    quelle.indexOf("} as const;"),
  );

  const saetze = [];
  for (const treffer of block.matchAll(/^\s*"?([a-z0-9-]+)"?\s*:\s*$/gm)) void treffer;
  // Werte können über mehrere Zeilen laufen — deshalb bis zum abschließenden ", lesen.
  for (const treffer of block.matchAll(/^\s*"?([a-z0-9-]+)"?:\s*((?:"[^"]*"\s*\+?\s*)+),/gms)) {
    const id = treffer[1];
    const text = treffer[2]
      .split(/"\s*\+\s*"/)
      .join("")
      .replace(/^"|"$/g, "")
      .replace(/\s+/g, " ")
      .trim();
    saetze.push({ id, text });
  }

  const zeilen = [];
  zeilen.push("# Sprechtexte");
  zeilen.push("");
  zeilen.push(
    "Alle Sätze, die das Spiel vorliest. Jede Aufnahme kommt als Datei nach `public/audio/`",
  );
  zeilen.push("und heißt genau wie die ID — also `s03-erdbeeren.mp3` für die ID `s03-erdbeeren`.");
  zeilen.push("");
  zeilen.push("**So geht's:**");
  zeilen.push("");
  zeilen.push("1. Satz aufnehmen (Handy-Diktiergerät reicht völlig).");
  zeilen.push("2. Datei nach `<ID>.mp3` benennen und in `public/audio/` legen.");
  zeilen.push("   Auch `.m4a`, `.wav`, `.ogg`, `.webm` und `.aac` funktionieren.");
  zeilen.push("3. `npm run build` — die Liste der Aufnahmen wird automatisch aktualisiert.");
  zeilen.push("");
  zeilen.push(
    "Es müssen nicht alle Sätze sein. Für jeden Satz ohne Aufnahme springt die deutsche",
  );
  zeilen.push("Stimme des Geräts ein, also kann man jederzeit ein paar Sätze nachreichen.");
  zeilen.push("");
  zeilen.push(`Insgesamt: **${saetze.length} Sätze**.`);
  zeilen.push("");

  const vergeben = new Set();
  for (const abschnitt of ABSCHNITTE) {
    const passend = saetze.filter((s) => {
      if (vergeben.has(s.id)) return false;
      return abschnitt.test ? abschnitt.test(s.id) : s.id.startsWith(abschnitt.praefix + "-");
    });
    if (!passend.length) continue;
    passend.forEach((s) => vergeben.add(s.id));

    zeilen.push(`## ${abschnitt.titel}`);
    zeilen.push("");
    zeilen.push("| Dateiname | Text |");
    zeilen.push("| --- | --- |");
    for (const satz of passend) {
      zeilen.push(`| \`${satz.id}.mp3\` | ${satz.text.replace(/\|/g, "\\|")} |`);
    }
    zeilen.push("");
  }

  await writeFile(join(wurzel, "SPRECHTEXTE.md"), zeilen.join("\n"), "utf8");
  console.log(`SPRECHTEXTE.md geschrieben — ${saetze.length} Sätze.`);
}

main().catch((fehler) => {
  console.error("sprechtexte:", fehler);
  process.exitCode = 1;
});
