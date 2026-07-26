/**
 * Drei Kinder, drei Spielstände.
 *
 * Der wichtigste Punkt hier: Wenn Luise den Tag durchspielt, darf Maya nicht
 * alles schon aufgeschlossen vorfinden. Sonst fällt für sie die Reise durch
 * den Tag aus — das Herzstück des Spiels.
 */

import { join } from "node:path";
import { ADRESSE, BILDER, browserStarten, fehlerSammeln, bericht, zurAuswahl } from "./helfer.mjs";

const fehler = [];
const browser = await browserStarten();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
fehlerSammeln(page, fehler);

await page.goto(ADRESSE + "/", { waitUntil: "networkidle" });
await page.evaluate(() => {
  ["luise", "maya", "marla"].forEach((k) => localStorage.removeItem(`tims-toller-tag/v1/${k}`));
});
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(700);

const titel = await page.locator(".buehne").innerText();
console.log("Titelbild:", titel.replace(/\n/g, " · "));
for (const name of ["Luise", "Maya", "Marla", "Onkel Tom"]) {
  if (!titel.includes(name)) fehler.push(`Titelbild nennt ${name} nicht`);
}
await page.screenshot({ path: join(BILDER, "titel-persoenlich.png") });

await zurAuswahl(page);
await page.screenshot({ path: join(BILDER, "wer-spielt.png") });
console.log("Auswahl:", (await page.locator(".buehne").innerText()).replace(/\n/g, " · "));

// ---------------------------------------------------- Luise spielt Station 1
await page.getByRole("button", { name: /Luise spielt/ }).click({ force: true });
await page.waitForTimeout(700);
const karteTitel = await page.locator("h2").first().innerText();
console.log("Karte:", karteTitel);
if (!karteTitel.includes("Luise")) fehler.push("Tageskarte nennt Luise nicht");

await page.getByRole("button", { name: /1\. Aufwachen/ }).click({ force: true });
await page.waitForTimeout(900);
for (const ziel of ["Sonne", "Teddy", "Tim"]) {
  await page.getByRole("button", { name: ziel, exact: true }).click({ force: true });
  await page.waitForTimeout(2800);
}
await page
  .getByRole("button", { name: /^Weiter$/ })
  // Der Knopf kommt erst, wenn die drei Jubelsätze gesprochen sind.
  .waitFor({ timeout: 20000 })
  .catch(() => fehler.push("Luise konnte Station 1 nicht abschließen"));
console.log("Luise hat Station 1 geschafft");

// --------------------------------------------- Maya faengt trotzdem bei null an
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(600);
await zurAuswahl(page);
const auswahl = await page.locator(".buehne").innerText();
console.log("Auswahl danach:", auswahl.replace(/\n/g, " · "));
if (!/Luise[\s\S]*1 von 11/.test(auswahl)) fehler.push("Luises Fortschritt fehlt in der Auswahl");

await page.getByRole("button", { name: /Maya spielt/ }).click({ force: true });
await page.waitForTimeout(800);
const station2 = await page
  .getByRole("button", { name: /2\. Anziehen/ })
  .getAttribute("aria-label");
const zuFuerMaya = station2.includes("geschlossen");
console.log("Für Maya ist Station 2:", zuFuerMaya ? "noch zu" : "offen");
if (!zuFuerMaya) fehler.push("Maya erbt Luises Fortschritt — die Staende sind nicht getrennt");

const zaehler = await page.locator("button").filter({ hasText: /von 11/ }).first().innerText();
console.log("Mayas Zähler:", zaehler.replace(/\n/g, " "));
if (!zaehler.includes("0 von 11")) fehler.push("Mayas Zähler steht nicht auf null");

// ------------------------------------- Der alte Stand unter „luisa" zieht mit
// Die Älteste hieß im Spiel eine Weile lang Luisa und heißt in Wahrheit Luise.
// Wer in der Zwischenzeit gespielt hat, darf deswegen nicht wieder bei Station
// eins landen.
await page.evaluate(() => {
  localStorage.removeItem("tims-toller-tag/v1/luise");
  localStorage.setItem(
    "tims-toller-tag/v1/luisa",
    JSON.stringify({ fertig: ["aufwachen", "anziehen"], tagGeschafft: false }),
  );
});
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(600);
await zurAuswahl(page);
const nachUmbenennung = await page.locator(".buehne").innerText();
console.log("Nach der Umbenennung:", nachUmbenennung.replace(/\n/g, " · "));
if (!/Luise[\s\S]*2 von 11/.test(nachUmbenennung)) {
  fehler.push("Der Stand von „luisa\" ist bei der Umbenennung verloren gegangen");
}
const alteTaste = await page.evaluate(() => localStorage.getItem("tims-toller-tag/v1/luisa"));
if (alteTaste !== null) fehler.push("Der alte Schlüssel „luisa\" liegt noch im Speicher");

await browser.close();
bericht("Drei Spielstände", fehler);
