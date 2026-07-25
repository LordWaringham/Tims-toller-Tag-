/**
 * Das Aufnahmestudio unter /aufnahme.
 *
 * Zwei Dinge werden geprüft: dass eine Aufnahme wirklich entsteht, ein
 * Neuladen übersteht und als ZIP herauskommt — und dass die Seite weiß, was
 * schon im Spiel liegt. Ohne das Zweite zeigte sie auf einem frischen Gerät
 * „0 von 77“, und man müsste raten, welche Sätze noch fehlen.
 */

import { ADRESSE, BILDER, bericht, browserStarten } from "./helfer.mjs";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const SHOT = BILDER;
const ZIEL = join(BILDER, "..", "zip");
mkdirSync(ZIEL, { recursive: true });

const fehler = [];
const browser = await browserStarten([
  "--use-fake-device-for-media-stream",
  "--use-fake-ui-for-media-stream",
  "--autoplay-policy=no-user-gesture-required",
]);
const kontext = await browser.newContext({
  viewport: { width: 1100, height: 900 },
  permissions: ["microphone"],
  acceptDownloads: true,
});
const page = await kontext.newPage();
page.on("pageerror", (e) => fehler.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") fehler.push(`console: ${m.text()}`);
});

await page.goto(ADRESSE + "/aufnahme", { waitUntil: "networkidle" });
await page.waitForTimeout(900);

const zeilen = await page.locator("li").count();
console.log("Zeilen auf der Seite:", zeilen);

/** Liest den Zählerstand „73 / 77“ aus der Kopfzeile. */
async function stand() {
  const text = await page.locator("header").innerText();
  const treffer = text.match(/(\d+)\s*\/\s*(\d+)/);
  if (!treffer) return null;
  return { fertig: Number(treffer[1]), gesamt: Number(treffer[2]) };
}

// Wie viele Aufnahmen liegen tatsächlich im Build?
const imManifest = await page.evaluate(async () => {
  const a = await fetch("/audio/manifest.json");
  return a.ok ? Object.keys(await a.json()).length : 0;
});
console.log("Aufnahmen im Manifest:", imManifest);

const anfang = await stand();
console.log("Kopfzeile:", (await page.locator("header").innerText()).replace(/\n/g, " | "));
await page.screenshot({ path: `${SHOT}/aufnahme-leer.png`, fullPage: false });

if (!anfang) {
  fehler.push("Kein Zählerstand in der Kopfzeile gefunden");
} else if (anfang.fertig !== imManifest) {
  fehler.push(
    `Kopfzeile zeigt ${anfang.fertig} von ${anfang.gesamt}, im Manifest liegen aber ${imManifest} Aufnahmen`,
  );
}

// Schon vorhandene Sätze müssen als solche erkennbar sein.
// Nur die Kennzeichnung an den Sätzen zählen — in der Anleitung steht der
// Begriff ebenfalls, und der zählte anfangs mit.
const schonImSpiel = await page.locator('li span:text-is("schon im Spiel")').count();
console.log("Als „schon im Spiel“ gekennzeichnet:", schonImSpiel);
if (imManifest > 0 && schonImSpiel !== imManifest) {
  fehler.push(`Erwartet ${imManifest} Hinweise „schon im Spiel“, gefunden ${schonImSpiel}`);
}

// Und anhören lassen müssen sie sich auch, ohne dass hier je aufgenommen wurde.
const anhoerenVorher = await page.getByRole("button", { name: /Anhören/ }).count();
if (imManifest > 0 && anhoerenVorher === 0) {
  fehler.push("Für die Sätze im Spiel gibt es keinen Anhören-Knopf");
}

// Drei noch fehlende Sätze aufnehmen.
const nehmenWir = 3;
for (let i = 0; i < nehmenWir; i++) {
  const knopf = page.getByRole("button", { name: /● Aufnehmen/ }).first();
  if (!(await knopf.count())) {
    console.log("  Alle Sätze sind schon eingesprochen — nichts mehr aufzunehmen");
    break;
  }
  await knopf.click();
  await page.waitForTimeout(700);
  await page.getByRole("button", { name: /Fertig/ }).click({ timeout: 5000 });
  await page.waitForTimeout(500);
  console.log(`  Satz ${i + 1} aufgenommen`);
}

await page.waitForTimeout(600);
const danach = await stand();
console.log("Kopfzeile danach:", (await page.locator("header").innerText()).replace(/\n/g, " | "));
await page.screenshot({ path: `${SHOT}/aufnahme-mit.png` });

if (anfang && danach && danach.fertig !== anfang.fertig + nehmenWir) {
  fehler.push(
    `Nach ${nehmenWir} Aufnahmen erwartet ${anfang.fertig + nehmenWir}, gezeigt ${danach.fertig}`,
  );
}

// Abspielen prüfen.
await page.getByRole("button", { name: /Anhören/ }).first().click();
await page.waitForTimeout(800);

// Überstehen die Aufnahmen ein Neuladen?
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const nachReload = await stand();
console.log("Nach Neuladen:", (await page.locator("header").innerText()).replace(/\n/g, " | "));
if (danach && nachReload && nachReload.fertig !== danach.fertig) {
  fehler.push(`Nach dem Neuladen ${nachReload.fertig} statt ${danach.fertig}`);
}

// Das ZIP enthält nur die neuen Aufnahmen, nicht die 73 aus dem Spiel.
const downloadPromise = page.waitForEvent("download", { timeout: 20000 });
await page.getByRole("button", { name: /herunterladen/ }).click();
const download = await downloadPromise;
const pfad = `${ZIEL}/${download.suggestedFilename()}`;
await download.saveAs(pfad);
console.log("ZIP gespeichert:", pfad);

const knopfText = await page.getByRole("button", { name: /herunterladen/ }).innerText();
console.log("Knopfbeschriftung:", knopfText);
if (!knopfText.includes(String(nehmenWir))) {
  fehler.push(`Knopf sollte ${nehmenWir} neue Aufnahmen ankündigen, sagt aber „${knopfText}“`);
}

await browser.close();
bericht("Aufnahmestudio", fehler);
