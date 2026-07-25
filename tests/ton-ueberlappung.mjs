import { ADRESSE, browserStarten, spielStarten } from "./helfer.mjs";

const browser = await browserStarten(["--autoplay-policy=no-user-gesture-required"]);
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

// Jedes Abspielen und Anhalten mitschreiben, um Überlappungen zu finden.
await page.addInitScript(() => {
  const w = window;
  w.__ton = { ereignisse: [], laufend: 0, maxGleichzeitig: 0 };
  const play = HTMLMediaElement.prototype.play;
  const pause = HTMLMediaElement.prototype.pause;
  /*
   * Gezaehlt wird, was ein Ohr hoeren wuerde.
   *
   * play() liefert ein Versprechen, das erst spaeter erfuellt wird. Wird die
   * Aufnahme vorher schon wieder angehalten, faellt sie aus — sie darf dann
   * nicht mehr als laufend gezaehlt werden. Ohne diese Buchfuehrung meldete
   * der Test gelegentlich zwei gleichzeitige Audios, die nie erklangen.
   */
  HTMLMediaElement.prototype.play = function (...args) {
    // Das Element muss über die Rückrufe hinweg festgehalten werden.
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const el = this;
    const datei = (el.src || "").split("/").pop();
    el.__wartet = true;
    const p = play.apply(el, args);
    Promise.resolve(p)
      .then(() => {
        if (!el.__wartet) return; // zwischendurch angehalten
        el.__wartet = false;
        el.__laeuft = true;
        w.__ton.laufend++;
        w.__ton.maxGleichzeitig = Math.max(w.__ton.maxGleichzeitig, w.__ton.laufend);
        w.__ton.ereignisse.push({ t: Date.now(), art: "start", datei, gleichzeitig: w.__ton.laufend });
        el.addEventListener("ended", () => {
          if (!el.__laeuft) return;
          el.__laeuft = false;
          w.__ton.laufend = Math.max(0, w.__ton.laufend - 1);
          w.__ton.ereignisse.push({ t: Date.now(), art: "ende", datei });
        }, { once: true });
      })
      .catch(() => {
        el.__wartet = false;
      });
    return p;
  };
  HTMLMediaElement.prototype.pause = function (...args) {
    const datei = (this.src || "").split("/").pop();
    if (this.__wartet) {
      // Angehalten, bevor der Ton überhaupt einsetzte.
      this.__wartet = false;
      w.__ton.ereignisse.push({ t: Date.now(), art: "verworfen", datei });
    } else if (this.__laeuft) {
      this.__laeuft = false;
      w.__ton.laufend = Math.max(0, w.__ton.laufend - 1);
      w.__ton.ereignisse.push({ t: Date.now(), art: "abbruch", datei });
    }
    return pause.apply(this, args);
  };
});

await page.goto(ADRESSE + "/", { waitUntil: "networkidle" });
await spielStarten(page);
await page.waitForTimeout(600);
await page.getByRole("button", { name: /1\. Aufwachen/ }).click({ force: true });
await page.waitForTimeout(1500);

console.log("→ Sonne antippen (hier trat die Überlappung auf)");
await page.getByRole("button", { name: "Sonne" }).click({ force: true });
await page.waitForTimeout(3000);
console.log("→ Teddy antippen");
await page.getByRole("button", { name: "Teddy" }).click({ force: true });
await page.waitForTimeout(3000);
console.log("→ Tim antippen");
await page.getByRole("button", { name: "Tim", exact: true }).click({ force: true });
// Lang genug, dass der Jubel Lob und Abschlusssatz beide anfängt.
await page.waitForTimeout(9000);

const ton = await page.evaluate(() => window.__ton);
const t0 = ton.ereignisse.length ? ton.ereignisse[0].t : 0;
console.log("\nAblauf:");
for (const e of ton.ereignisse) {
  console.log(`  +${String(e.t - t0).padStart(5)}ms  ${e.art.padEnd(8)} ${e.datei ?? ""}` +
    (e.gleichzeitig ? `   (gleichzeitig: ${e.gleichzeitig})` : ""));
}
const fehler = [];
console.log(`\nHöchste Zahl gleichzeitig laufender Audios: ${ton.maxGleichzeitig}`);
if (ton.maxGleichzeitig > 1) fehler.push(`${ton.maxGleichzeitig} Audios gleichzeitig`);

/*
 * Im Jubel gehört das Lob nach vorn.
 *
 * Auf dem Bild steht „Klasse!" groß und der Satz aus dem Buch klein darunter;
 * die Stimme sagte es andersherum. Wer zusah, hörte den Abschlusssatz zu einem
 * Bild, das längst das Lob zeigte.
 */
const starts = ton.ereignisse.filter((e) => e.art === "start").map((e) => e.datei);
const lob = starts.findIndex((d) => /^lob-\d/.test(d));
const abschluss = starts.findIndex((d) => d === "s01-fertig.webm");
console.log(`Im Jubel: Lob an Stelle ${lob}, Abschlusssatz an Stelle ${abschluss}`);
if (lob < 0) fehler.push("Im Jubel kam gar kein Lob");
else if (abschluss < 0) fehler.push("Im Jubel kam der Abschlusssatz nicht");
else if (lob > abschluss) fehler.push("Der Abschlusssatz kam vor dem Lob");

console.log(fehler.length ? "❌ " + fehler.join("; ") : "✅ keine Überlappung, Jubel in der richtigen Reihenfolge");
if (fehler.length) process.exitCode = 1;

await browser.close();
