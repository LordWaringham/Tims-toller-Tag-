import { ADRESSE, browserStarten } from "./helfer.mjs";
const browser = await browserStarten();
const kontext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await kontext.newPage();

await page.goto(ADRESSE + "/", { waitUntil: "networkidle" });
await page.waitForFunction(() => navigator.serviceWorker?.controller != null, { timeout: 20000 })
  .catch(() => console.log("(kein Controller — SW evtl. erst beim naechsten Laden aktiv)"));
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(1000);

// Warten, bis die Aufnahmen abgelegt sind
for (let i = 0; i < 40; i++) {
  const n = await page.evaluate(async () => {
    const c = await caches.open("tims-toller-tag-v2");
    return (await c.keys()).filter((r) => r.url.includes("/audio/") && r.url.endsWith(".webm")).length;
  });
  if (n >= 73) { console.log(`Aufnahmen im Cache: ${n}`); break; }
  if (i === 39) console.log(`Aufnahmen im Cache: ${n} (von 73)`);
  await page.waitForTimeout(1000);
}

const gesamt = await page.evaluate(async () => {
  const c = await caches.open("tims-toller-tag-v2");
  const k = await c.keys();
  return { szenen: k.filter(r => r.url.includes("/scenes/")).length,
           audio: k.filter(r => r.url.includes("/audio/")).length, alle: k.length };
});
console.log("Cache-Inhalt:", JSON.stringify(gesamt));

console.log("\n→ Netz abschalten und neu laden");
await kontext.setOffline(true);
await page.reload({ waitUntil: "domcontentloaded" }).catch((e) => console.log("Laden:", e.message));
await page.waitForTimeout(1500);
const titelDa = await page.getByRole("button", { name: /Spielen|Weiterspielen/ }).count();
console.log("Startbildschirm offline sichtbar:", titelDa > 0);

const stimme = await page.evaluate(async () => {
  try {
    const r = await fetch("/audio/s01-intro.webm");
    return r.ok ? `ok (${(await r.blob()).size} Bytes)` : `Fehler ${r.status}`;
  } catch (e) { return "nicht erreichbar: " + e.message; }
});
console.log("Aufnahme offline abrufbar:", stimme);
if (!titelDa || !String(stimme).startsWith("ok")) process.exitCode = 1;
await browser.close();
