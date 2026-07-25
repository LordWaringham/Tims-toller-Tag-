import { ADRESSE, BILDER, browserStarten, spielStarten, standSetzen } from "./helfer.mjs";
import { join } from "node:path";
const browser = await browserStarten();
const groessen = [
  ["ipad-quer", 1180, 820],
  ["ipad-hoch", 820, 1180],
  ["handy-quer", 844, 390],
  ["handy-hoch", 390, 844],
];
for (const [name, w, h] of groessen) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const fehler = [];
  page.on("pageerror", (e) => fehler.push(e.message));
  await page.goto(ADRESSE + "/", { waitUntil: "networkidle" });
  // Zwei Stationen vorgeben, damit die dritte offen ist.
  await standSetzen(page, ["aufwachen", "anziehen"]);
  await page.reload({ waitUntil: "networkidle" });
  await spielStarten(page);
  await page.waitForTimeout(900);
  await page.screenshot({ path: join(BILDER, `gr-${name}-karte.png`) });
  await page.getByRole("button", { name: /3\. Frühstück/ }).click({ force: true });
  await page.waitForTimeout(1100);
  await page.screenshot({ path: join(BILDER, `gr-${name}-station.png`) });
  // Läuft die Seite horizontal über?
  const ueberlauf = await page.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  console.log(`${name.padEnd(12)} ${w}x${h}  Überlauf: ${ueberlauf}  Fehler: ${fehler.length}`);
  if (ueberlauf || fehler.length) process.exitCode = 1;
  await page.close();
}
await browser.close();
