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
/**
 * Bis hierher gilt eine Pause noch als „am Anfang".
 *
 * Nicht jede Aufnahme fängt exakt bei 0,000 s an; 0,05 s waren zu streng und
 * ließen Dateien mit einer vollen Sekunde Stille durchrutschen.
 */
const NOCH_AM_ANFANG = 0.2;
/** Ab so viel toter Zeit stimmt etwas mit der Aufnahme nicht. */
const VERDAECHTIG = 30;

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
      /*
       * `aresample` vor der Messung ist der entscheidende Teil.
       *
       * Aufnahmen aus dem Browser können Lücken enthalten: Schläft das Gerät
       * zwischen „Aufnehmen" und dem ersten Wort ein, steht im ersten Paket
       * die Zeit 0 und im nächsten eine halbe Stunde später — dazwischen ist
       * nichts, nicht einmal Stille. silencedetect sieht davon nichts und
       * meldet eine makellose Datei. `aresample=async=1:first_pts=0` füllt die
       * Lücke mit echter Stille, und damit wird sie messbar.
       */
      "-af",
      `aresample=async=1:first_pts=0,silencedetect=noise=${STILLE_DB}dB:d=${MINDESTENS}`,
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

  /*
   * Geschnitten wird nur bis zum allerersten Ton.
   *
   * Ein Versuch, dabei einen Knacks vom Antippen zu überspringen und erst beim
   * ersten „richtigen" Ton zu schneiden, ging schief: In s06-fertig steht bei
   * 0,42 s ein kurzes erstes Wort bei −20 dB, gefolgt von einer Wortpause. Für
   * die Regel sah das aus wie ein Knacks — und das Wort war weg. Lieber bleibt
   * in ein paar Aufnahmen ein Klick samt kurzer Pause stehen, als dass eine
   * Silbe verschwindet.
   */
  const vorn = anfaenge.length && anfaenge[0] <= NOCH_AM_ANFANG ? (enden[0] ?? dauer) : 0;
  const hinten = anfaenge.length > enden.length ? dauer - anfaenge.at(-1) : 0;
  return { dauer, vorn, hinten };
}

/** Wie lang ist eine Datei wirklich? */
function messenDauer(pfad) {
  const lauf = spawnSync(
    FFMPEG,
    ["-hide_banner", "-nostats", "-i", pfad, "-f", "null", "-"],
    { encoding: "utf8" },
  );
  const t = [...(lauf.stderr ?? "").matchAll(/time=(\d+):(\d+):([\d.]+)/g)].at(-1);
  return t ? Number(t[1]) * 3600 + Number(t[2]) * 60 + Number(t[3]) : 0;
}

const nurPruefen = process.argv.includes("--pruefen");
/** Zweite Kodierung erlauben? Siehe Kommentar unten — mit Vorsicht. */
const neuKodierenErlaubt = process.argv.includes("--neu-kodieren");
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
  if (weg > VERDAECHTIG) {
    console.log(
      `  ⚠  ${Math.round(weg)}s tote Zeit — da ist beim Aufnehmen etwas schiefgegangen ` +
        "(Gerät eingeschlafen?). Nach dem Schnitt bitte einmal anhören.",
    );
  }
  if (nurPruefen) {
    geschnitten++;
    gespart += weg;
    continue;
  }

  // Die Endung muss stimmen: ffmpeg leitet daraus das Format ab.
  const endung = datei.slice(datei.lastIndexOf("."));
  const ziel = `${pfad}.zwischen${endung}`;

  function schneiden(neuKodieren) {
    const argumente = ["-hide_banner", "-loglevel", "error", "-y", "-ss", start.toFixed(3)];
    if (ende < dauer) argumente.push("-to", ende.toFixed(3));
    argumente.push("-i", pfad);
    if (neuKodieren) argumente.push("-c:a", "libopus", "-b:a", "48k", "-application", "voip");
    else argumente.push("-c", "copy");
    argumente.push(ziel);
    const lauf = spawnSync(FFMPEG, argumente, { encoding: "utf8" });
    const groesse = statSync(ziel, { throwIfNoEntry: false })?.size ?? 0;
    return lauf.status === 0 && groesse > 0 ? null : lauf.stderr?.trim() || "leere Datei";
  }

  /*
   * Geschnitten wird nur kopierend — das ist nachweislich verlustfrei.
   *
   * WebM aus dem Browser besteht oft aus einem einzigen großen Cluster, und
   * ein Kopierschnitt kann nur an Clustergrenzen ansetzen: Kleine Schnitte
   * verpuffen dann, und in ein paar Aufnahmen bleiben zwei bis fünf Zehntel
   * Stille stehen. Mit --neu-kodieren ginge auch das, kostet aber eine zweite
   * Kodierung über eine bereits verlustbehaftete Aufnahme. Standardmäßig
   * nicht: Ein bisschen Stille ist billiger als ein Risiko an einer Stimme,
   * die man nicht noch einmal aufnehmen kann.
   */
  let fehler = schneiden(false);
  if (!fehler && neuKodierenErlaubt) {
    const gewollt = ende - start;
    if (messenDauer(ziel) > gewollt + 0.08) fehler = schneiden(true);
  }
  if (fehler) {
    console.error(`  ✗ ${datei}: ${fehler}`);
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
