/**
 * Gemeinsames Rüstzeug für die Browsertests.
 *
 * Die Tests fahren das gebaute Spiel in einem echten Browser durch. Das ist
 * hier kein Luxus: Fast alle Fehler, die in diesem Projekt auftraten, waren
 * erst im Browser zu sehen — überschriebene Positionen, gleichzeitig
 * abgespielte Sätze, ein Bild, das sich nie änderte. Reine Einheitstests
 * hätten keinen davon gefunden.
 */

import { chromium } from "playwright";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const WURZEL = join(dirname(fileURLToPath(import.meta.url)), "..");
export const ADRESSE = process.env.TTT_URL ?? "http://localhost:4173";
export const BILDER = join(WURZEL, "tests", "bilder");

mkdirSync(BILDER, { recursive: true });

/**
 * Im Container liegt Chromium an fester Stelle, sonst nimmt Playwright seinen
 * eigenen. Über PLAYWRIGHT_CHROMIUM lässt sich ein anderer Pfad angeben.
 */
function startOptionen(zusatz = []) {
  const pfad = process.env.PLAYWRIGHT_CHROMIUM ?? "/opt/pw-browsers/chromium";
  const optionen = { args: zusatz };
  if (existsSync(pfad)) optionen.executablePath = pfad;
  return optionen;
}

export async function browserStarten(zusatzArgumente = []) {
  return chromium.launch(startOptionen(zusatzArgumente));
}

/** Setzt den Spielstand eines Kindes, damit eine Station direkt erreichbar ist. */
export async function standSetzen(page, fertigeStationen, kindId = "luise") {
  await page.evaluate(
    ([fertig, kind]) => {
      localStorage.setItem(
        `tims-toller-tag/v1/${kind}`,
        JSON.stringify({ fertig, tagGeschafft: fertig.length >= 11 }),
      );
    },
    [fertigeStationen, kindId],
  );
}

/** Nach dem Startknopf fragt das Spiel, wer heute spielt. */
export async function kindWaehlen(page, name = "Luise") {
  const knopf = page.getByRole("button", { name: new RegExp(`${name} spielt`) });
  await knopf.waitFor({ timeout: 12000 });
  await knopf.click({ force: true });
  await page.waitForTimeout(600);
}

/**
 * Vom Titelbild bis zur Tageskarte.
 *
 * Auf dem Titelbild läuft seit Neuestem erst die Begrüßung, und der Knopf
 * heißt währenddessen „Weiter". Ein zweites Tippen überspringt sie — Tests
 * sollen nicht zehn Sekunden lang zuhören.
 */
export async function zurAuswahl(page) {
  await page.getByRole("button", { name: /Spielen|Weiterspielen/ }).click({ force: true });
  await page.waitForTimeout(350);
  const weiter = page.getByRole("button", { name: /^Weiter$/ });
  if (await weiter.count()) await weiter.click({ force: true });
  await page.waitForTimeout(500);
}

export async function spielStarten(page, name = "Luise") {
  await zurAuswahl(page);
  await kindWaehlen(page, name);
}

/** Punkt in Prozent der Bühne in Seitenkoordinaten umrechnen. */
export async function buehnenPunkt(page, xProzent, yProzent) {
  const kasten = await page.locator(".buehne").boundingBox();
  return {
    x: kasten.x + (kasten.width * xProzent) / 100,
    y: kasten.y + (kasten.height * yProzent) / 100,
  };
}

/** Zieht ein Element auf einen Punkt der Bühne — in Schritten, wie ein Finger. */
export async function ziehenAufPunkt(page, element, xProzent, yProzent, schritte = 12) {
  const kasten = await element.boundingBox();
  if (!kasten) throw new Error("Element nicht sichtbar");
  const von = { x: kasten.x + kasten.width / 2, y: kasten.y + kasten.height / 2 };
  const nach = await buehnenPunkt(page, xProzent, yProzent);
  await page.mouse.move(von.x, von.y);
  await page.mouse.down();
  for (let i = 1; i <= schritte; i++) {
    await page.mouse.move(
      von.x + ((nach.x - von.x) * i) / schritte,
      von.y + ((nach.y - von.y) * i) / schritte,
    );
    await page.waitForTimeout(16);
  }
  await page.mouse.up();
  await page.waitForTimeout(340);
}

/** Sammelt Konsolen- und Seitenfehler ein. */
export function fehlerSammeln(page, hinein) {
  page.on("console", (m) => {
    if (m.type() === "error") hinein.push(`console: ${m.text()}`);
  });
  page.on("pageerror", (e) => hinein.push(`pageerror: ${e.message}`));
}

/** Einheitlicher Abschluss: Bericht und passender Rückgabewert. */
export function bericht(name, fehler) {
  if (fehler.length) {
    console.log(`\n❌ ${name}: ${fehler.length} Problem(e)`);
    fehler.forEach((f) => console.log("   -", f));
    process.exitCode = 1;
  } else {
    console.log(`\n✅ ${name}: ohne Fehler`);
  }
}
