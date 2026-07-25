/**
 * Führt alle Browsertests nacheinander aus.
 *
 * Baut vorher nicht selbst — dafür ist `npm run build` da. Erwartet das
 * fertige `out/` und startet sich einen kleinen Webserver darauf, sofern
 * unter TTT_URL nicht schon einer läuft.
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { WURZEL, ADRESSE } from "./helfer.mjs";

const TESTS = [
  ["Voller Durchlauf", "durchspielen.mjs"],
  ["Bildschirmgrößen", "groessen.mjs"],
  ["Gleichzeitiger Ton", "ton-ueberlappung.mjs"],
  ["Offline-Betrieb", "offline.mjs"],
  ["Aufnahmestudio", "aufnahmestudio.mjs"],
];

function laufen(befehl, argumente, optionen = {}) {
  return new Promise((erfuellen) => {
    const kind = spawn(befehl, argumente, { stdio: "inherit", ...optionen });
    kind.on("exit", (code) => erfuellen(code ?? 1));
  });
}

async function erreichbar() {
  try {
    const a = await fetch(ADRESSE + "/", { signal: AbortSignal.timeout(2000) });
    return a.ok;
  } catch {
    return false;
  }
}

async function main() {
  if (!existsSync(join(WURZEL, "out", "index.html"))) {
    console.error("Kein Build gefunden. Erst `npm run build` ausführen.");
    process.exit(1);
  }

  let server = null;
  if (!(await erreichbar())) {
    console.log(`Starte Webserver auf ${ADRESSE} …`);
    server = spawn("npx", ["--yes", "serve@latest", "out", "-l", "4173"], {
      cwd: WURZEL,
      stdio: "ignore",
      detached: true,
    });
    for (let i = 0; i < 20 && !(await erreichbar()); i++) {
      await new Promise((r) => setTimeout(r, 700));
    }
    if (!(await erreichbar())) {
      console.error("Webserver kam nicht hoch.");
      process.exit(1);
    }
  }

  const gescheitert = [];
  for (const [name, datei] of TESTS) {
    console.log(`\n───── ${name} ─────`);
    const code = await laufen("node", [join(WURZEL, "tests", datei)], { cwd: WURZEL });
    if (code !== 0) gescheitert.push(name);
  }

  if (server) process.kill(-server.pid);

  console.log("\n═════════════════════════");
  if (gescheitert.length) {
    console.log("❌ Gescheitert: " + gescheitert.join(", "));
    process.exit(1);
  }
  console.log(`✅ Alle ${TESTS.length} Prüfungen bestanden`);
}

main();
