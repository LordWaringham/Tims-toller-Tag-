/**
 * Schneidet die Stille am Anfang und Ende der Sprachaufnahmen weg.
 *
 * Zwischen dem Tippen auf „Aufnehmen" und dem ersten Wort vergeht beim
 * Einsprechen fast immer ein Moment. Im Spiel wird daraus eine Pause vor
 * jedem Satz — bei 77 Aufnahmen summierte sich das auf knapp 48 Sekunden
 * Warten, das niemand hören will.
 *
 * Geschnitten wird ohne neu zu kodieren (`-c copy`): Opus-Pakete sind 20 ms
 * lang, das reicht hier völlig, und die Aufnahme verliert keine Qualität.
 * Vor dem ersten Wort bleibt ein kurzer Vorlauf stehen, damit kein Anlaut
 * abgeschnitten wird.
 *
 *   node scripts/audio-kuerzen.mjs           # schneiden
 *   node scripts/audio-kuerzen.mjs --pruefen # nur nachsehen, nichts ändern
 *
 * Braucht ffmpeg: entweder im PATH, über die Umgebungsvariable FFMPEG oder
 * als installiertes Paket ffmpeg-static.
 */

import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { readdirSync, renameSync, statSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), "..");
const AUDIO = join(WURZEL, "public", "audio");

/** Alles unter dieser Lautstärke gilt als Stille. */
const STILLE_DB = -45;
/** So lange muss es leise sein, damit es als Pause zählt. */
const MINDESTENS = 0.08;
/** So viel Vorlauf bleibt vor dem ersten Wort stehen. */
const VORLAUF = 0.06;
/** So viel Nachlauf bleibt hinter dem letzten Wort stehen. */
const NACHLAUF = 0.12;
/** Kürzer als das lohnt den Schnitt nicht. */
const LOHNT_SICH = 0.12;

function ffmpegFinden() {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  try {
    return createRequire(import.meta.url)("ffmpeg-static");
  } catch {
    /* nicht installiert — dann eben aus dem PATH */
  }
  const wo = spawnSync("ffmpeg", ["-version"], { encoding: "utf8" });
  if (wo.status === 0) return "ffmpeg";
  return null;
}

const FFMPEG = ffmpegFinden();
if (!FFMPEG) {
  console.error(
    "ffmpeg nicht gefunden. Entweder installieren, in FFMPEG angeben oder\n" +
      "`npm install --no-save ffmpeg-static` ausführen.",
  );
  process.exit(1);
}

/** Wo fängt der Ton an, wo hört er auf? Beides in Sekunden. */
function grenzen(pfad) {
  const lauf = spawnSync(
    FFMPEG,
    [
      "-hide_banner", "-nostats", "-i", pfad,
      "-af", `silencedetect=noise=${STILLE_DB}dB:d=${MINDESTENS}`,
      "-f", "null", "-",
    ],
    { encoding: "utf8" },
  );
  // silencedetect schreibt nach stderr, nicht nach stdout.
  const roh = lauf.stderr ?? "";

  const gemessen = /Duration: (\d+):(\d+):([\d.]+)/.exec(roh);
  let dauer = gemessen
    ? Number(gemessen[1]) * 3600 + Number(gemessen[2]) * 60 + Number(gemessen[3])
    : 0;
  // Bei WebM aus dem Browser fehlt die Dauer im Kopf oft — dann zählt die
  // zuletzt verarbeitete Zeit.
  const zuletzt = [...roh.matchAll(/time=(\d+):(\d+):([\d.]+)/g)].at(-1);
  if (zuletzt) {
    dauer = Math.max(
      dauer,
      Number(zuletzt[1]) * 3600 + Number(zuletzt[2]) * 60 + Number(zuletzt[3]),
    );
  }

  const anfaenge = [...roh.matchAll(/silence_start: ([-\d.]+)/g)].map((m) => Number(m[1]));
  const enden = [...roh.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]));

  const vorn = anfaenge.length && anfaenge[0] <= 0.05 ? (enden[0] ?? dauer) : 0;
  const hinten = anfaenge.length > enden.length ? dauer - anfaenge.at(-1) : 0;
  return { dauer, vorn, hinten };
}

const nurPruefen = process.argv.includes("--pruefen");
const dateien = readdirSync(AUDIO)
  .filter((d) => /\.(webm|mp3|m4a|wav|ogg|aac)$/i.test(d))
  .sort();

let geschnitten = 0;
let gespart = 0;

for (const datei of dateien) {
  const pfad = join(AUDIO, datei);
  const { dauer, vorn, hinten } = grenzen(pfad);

  const start = Math.max(0, vorn - VORLAUF);
  const ende = hinten > 0 ? Math.max(start + 0.3, dauer - hinten + NACHLAUF) : dauer;
  const weg = start + (dauer - ende);
  if (weg < LOHNT_SICH) continue;

  console.log(
    `${datei.padEnd(24)} ${dauer.toFixed(2)}s → ${(ende - start).toFixed(2)}s ` +
      `(vorn ${start.toFixed(2)}s${hinten > 0 ? `, hinten ${(dauer - ende).toFixed(2)}s` : ""})`,
  );
  if (nurPruefen) {
    geschnitten++;
    gespart += weg;
    continue;
  }

  // Die Endung muss stimmen: ffmpeg leitet daraus das Format ab.
  const endung = datei.slice(datei.lastIndexOf("."));
  const ziel = `${pfad}.zwischen${endung}`;
  const argumente = ["-hide_banner", "-loglevel", "error", "-y", "-ss", start.toFixed(3)];
  if (ende < dauer) argumente.push("-to", ende.toFixed(3));
  argumente.push("-i", pfad, "-c", "copy", ziel);

  const lauf = spawnSync(FFMPEG, argumente, { encoding: "utf8" });
  if (lauf.status !== 0 || !statSync(ziel, { throwIfNoEntry: false })?.size) {
    console.error(`  ✗ ${datei}: ${lauf.stderr?.trim() || "leere Datei"}`);
    try {
      unlinkSync(ziel);
    } catch {
      /* war schon weg */
    }
    continue;
  }
  renameSync(ziel, pfad);
  geschnitten++;
  gespart += weg;
}

console.log(
  `\n${geschnitten} von ${dateien.length} Aufnahmen ${nurPruefen ? "wären zu kürzen" : "gekürzt"} — ` +
    `${gespart.toFixed(1)}s Stille${nurPruefen ? "" : " weg"}.`,
);
