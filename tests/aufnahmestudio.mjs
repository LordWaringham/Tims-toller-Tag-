import { ADRESSE, BILDER, browserStarten } from "./helfer.mjs";
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
page.on("console", (m) => { if (m.type() === "error") fehler.push(`console: ${m.text()}`); });

await page.goto(ADRESSE + "/aufnahme", { waitUntil: "networkidle" });
await page.waitForTimeout(900);

const zeilen = await page.locator("li").count();
console.log("Zeilen auf der Seite:", zeilen);
console.log("Kopfzeile:", (await page.locator("header").innerText()).replace(/\n/g, " | "));
await page.screenshot({ path: `${SHOT}/aufnahme-leer.png`, fullPage: false });

// Drei Sätze aufnehmen
const nehmenWir = 3;
for (let i = 0; i < nehmenWir; i++) {
  const knopf = page.getByRole("button", { name: /Aufnehmen/ }).first();
  await knopf.click();
  await page.waitForTimeout(700);
  const fertig = page.getByRole("button", { name: /Fertig/ });
  await fertig.click({ timeout: 5000 });
  await page.waitForTimeout(500);
  console.log(`  Satz ${i + 1} aufgenommen`);
}

await page.waitForTimeout(600);
console.log("Kopfzeile danach:", (await page.locator("header").innerText()).replace(/\n/g, " | "));
await page.screenshot({ path: `${SHOT}/aufnahme-mit.png` });

// Abspielen prüfen
await page.getByRole("button", { name: /Anhören/ }).first().click();
await page.waitForTimeout(800);

// Überstehen die Aufnahmen ein Neuladen?
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const nachReload = await page.locator("header").innerText();
console.log("Nach Neuladen:", nachReload.replace(/\n/g, " | "));

// ZIP herunterladen
const downloadPromise = page.waitForEvent("download", { timeout: 20000 });
await page.getByRole("button", { name: /Alle herunterladen/ }).click();
const download = await downloadPromise;
const pfad = `${ZIEL}/${download.suggestedFilename()}`;
await download.saveAs(pfad);
console.log("ZIP gespeichert:", pfad);

console.log(fehler.length ? "❌ Fehler:" : "✅ keine Konsolenfehler");
if (fehler.length) process.exitCode = 1;
fehler.forEach((f) => console.log("  -", f));
await browser.close();
