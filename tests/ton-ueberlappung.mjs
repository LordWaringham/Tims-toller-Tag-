import { ADRESSE, browserStarten, kindWaehlen } from "./helfer.mjs";

const browser = await browserStarten(["--autoplay-policy=no-user-gesture-required"]);
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

// Jedes Abspielen und Anhalten mitschreiben, um Überlappungen zu finden.
await page.addInitScript(() => {
  const w = window;
  w.__ton = { ereignisse: [], laufend: 0, maxGleichzeitig: 0 };
  const play = HTMLMediaElement.prototype.play;
  const pause = HTMLMediaElement.prototype.pause;
  HTMLMediaElement.prototype.play = function (...args) {
    const datei = (this.src || "").split("/").pop();
    const p = play.apply(this, args);
    Promise.resolve(p)
      .then(() => {
        w.__ton.laufend++;
        w.__ton.maxGleichzeitig = Math.max(w.__ton.maxGleichzeitig, w.__ton.laufend);
        w.__ton.ereignisse.push({ t: Date.now(), art: "start", datei, gleichzeitig: w.__ton.laufend });
        this.addEventListener("ended", () => {
          w.__ton.laufend = Math.max(0, w.__ton.laufend - 1);
          w.__ton.ereignisse.push({ t: Date.now(), art: "ende", datei });
        }, { once: true });
      })
      .catch(() => {});
    return p;
  };
  HTMLMediaElement.prototype.pause = function (...args) {
    if (!this.paused && !this.ended) {
      w.__ton.laufend = Math.max(0, w.__ton.laufend - 1);
      w.__ton.ereignisse.push({ t: Date.now(), art: "abbruch", datei: (this.src || "").split("/").pop() });
    }
    return pause.apply(this, args);
  };
});

await page.goto(ADRESSE + "/", { waitUntil: "networkidle" });
await page.getByRole("button", { name: /Spielen|Weiterspielen/ }).click({ force: true });
await kindWaehlen(page);
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
await page.waitForTimeout(3000);

const ton = await page.evaluate(() => window.__ton);
const t0 = ton.ereignisse.length ? ton.ereignisse[0].t : 0;
console.log("\nAblauf:");
for (const e of ton.ereignisse) {
  console.log(`  +${String(e.t - t0).padStart(5)}ms  ${e.art.padEnd(8)} ${e.datei ?? ""}` +
    (e.gleichzeitig ? `   (gleichzeitig: ${e.gleichzeitig})` : ""));
}
console.log(`\nHöchste Zahl gleichzeitig laufender Audios: ${ton.maxGleichzeitig}`);
console.log(ton.maxGleichzeitig <= 1 ? "✅ keine Überlappung" : "❌ ÜBERLAPPUNG!");
if (ton.maxGleichzeitig > 1) process.exitCode = 1;

await browser.close();
