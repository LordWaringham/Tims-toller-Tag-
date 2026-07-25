/**
 * Die Elternseite.
 *
 * Der Grund für diesen Test: Beim Umbau auf drei Spielstände lief das
 * Zurücksetzen ins Leere. Die Seite wird vom Titelbild aus geöffnet, also
 * bevor ein Kind gewählt ist — und griff auf den Stand eben dieses nicht
 * gewählten Kindes zu. Der Bestätigungsdialog erschien, der Knopf ließ sich
 * drücken, und es passierte nichts. Ein stiller Fehler, der aussieht wie
 * Erfolg, ist schlimmer als einer, der auffällt.
 */

import { join } from "node:path";
import { ADRESSE, BILDER, browserStarten, fehlerSammeln, bericht } from "./helfer.mjs";

const fehler = [];
const browser = await browserStarten();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
fehlerSammeln(page, fehler);

await page.goto(ADRESSE + "/", { waitUntil: "networkidle" });

// Zwei Kindern einen Stand geben, dem dritten nicht.
await page.evaluate(() => {
  localStorage.setItem(
    "tims-toller-tag/v1/luise",
    JSON.stringify({ fertig: ["aufwachen", "anziehen", "fruehstueck"], tagGeschafft: false }),
  );
  localStorage.setItem(
    "tims-toller-tag/v1/maya",
    JSON.stringify({ fertig: ["aufwachen"], tagGeschafft: false }),
  );
  localStorage.removeItem("tims-toller-tag/v1/marla");
});
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(500);

await page.getByRole("button", { name: /Erwachsene/ }).click({ force: true });
await page.waitForTimeout(600);
await page.screenshot({ path: join(BILDER, "elternseite.png"), fullPage: true });

const text = await page.locator("body").innerText();
console.log("Fortschritt laut Seite:");
for (const zeile of text.split("\n").filter((z) => /Stationen/.test(z))) {
  console.log("  " + zeile.trim());
}

// Jedes Kind muss mit seinem eigenen Stand auftauchen.
if (!/Luise[\s\S]{0,40}3 von 11/.test(text)) fehler.push("Luises Stand (3) fehlt");
if (!/Maya[\s\S]{0,40}1 von 11/.test(text)) fehler.push("Mayas Stand (1) fehlt");
if (!/Marla[\s\S]{0,40}0 von 11/.test(text)) fehler.push("Marlas Stand (0) fehlt");

// Einzeln zurücksetzen muss wirklich wirken.
const zuruecksetzen = page.getByRole("button", { name: "zurücksetzen" });
const vorher = await zuruecksetzen.count();
console.log(`Einzelne Zurücksetz-Knöpfe: ${vorher} (erwartet 2, Marla hat nichts)`);
if (vorher !== 2) fehler.push(`Erwartet 2 Zurücksetz-Knöpfe, gefunden ${vorher}`);

await zuruecksetzen.first().click({ force: true });
await page.waitForTimeout(400);
const luiseDanach = await page.evaluate(() =>
  localStorage.getItem("tims-toller-tag/v1/luise"),
);
console.log("Luise im Speicher danach:", luiseDanach);
if (luiseDanach && JSON.parse(luiseDanach).fertig.length !== 0) {
  fehler.push("Einzelnes Zurücksetzen hat nichts bewirkt");
}
const mayaDanach = await page.evaluate(() => localStorage.getItem("tims-toller-tag/v1/maya"));
if (!mayaDanach || JSON.parse(mayaDanach).fertig.length !== 1) {
  fehler.push("Mayas Stand wurde mit zurückgesetzt, obwohl nur Luise gemeint war");
}

// Und alles zurücksetzen ebenso.
await page.getByRole("button", { name: /allen dreien von vorne/ }).click({ force: true });
await page.waitForTimeout(300);
await page.getByRole("button", { name: /Ja, bei allen dreien/ }).click({ force: true });
await page.waitForTimeout(500);
const alle = await page.evaluate(() =>
  ["luise", "maya", "marla"].map((k) => {
    const roh = localStorage.getItem(`tims-toller-tag/v1/${k}`);
    return roh ? JSON.parse(roh).fertig.length : 0;
  }),
);
console.log("Nach 'alles zurücksetzen':", alle.join(", "));
if (alle.some((n) => n !== 0)) fehler.push("Alles zurücksetzen hat nicht gewirkt");

await browser.close();
bericht("Elternseite", fehler);
