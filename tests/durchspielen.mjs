import {
  ADRESSE,
  BILDER,
  browserStarten,
  spielStarten,
  randPruefen,
  leistePruefen,
} from "./helfer.mjs";

const URL = ADRESSE + "/";
const SHOT = BILDER;

const fehler = [];

const browser = await browserStarten();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

page.on("console", (m) => {
  if (m.type() === "error") fehler.push(`console: ${m.text()}`);
});
page.on("pageerror", (e) => fehler.push(`pageerror: ${e.message}`));

const shot = async (name) => {
  await page.screenshot({ path: `${SHOT}/${name}.png` });
  // Bei der Gelegenheit gleich nachsehen, ob alles im Bild liegt.
  fehler.push(...(await randPruefen(page, name)));
  fehler.push(...(await leistePruefen(page, name)));
  console.log("  📸", name);
};

/** Mitte eines Elements in Seitenkoordinaten. */
const mitte = async (loc) => {
  const box = await loc.boundingBox();
  if (!box) throw new Error("kein Kasten");
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
};

const jubelWeg = async (station) => {
  const weiter = page.getByRole("button", { name: /Weiter|toller Tag/ });
  await weiter.waitFor({ state: "visible", timeout: 8000 }).catch(() => {
    fehler.push(`${station}: kein Weiter-Knopf erschienen`);
  });
};

console.log("→ Titelbild");
await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForTimeout(700);
await shot("01-titel");

await spielStarten(page);
await page.waitForTimeout(700);
await shot("02-tageskarte");

// ---------------------------------------------------------------- 1 Aufwachen
console.log("→ 1 Aufwachen");
await page.getByRole("button", { name: /1\. Aufwachen/ }).click({ force: true });
await page.waitForTimeout(800);
await shot("03-aufwachen-start");
await page.getByRole("button", { name: "Sonne" }).click({ force: true });
await page.waitForTimeout(900);
await page.getByRole("button", { name: "Teddy" }).click({ force: true });
await page.waitForTimeout(900);
await page.getByRole("button", { name: "Tim", exact: true }).click({ force: true });
await page.waitForTimeout(1200);
await shot("04-aufwachen-jubel");
await jubelWeg("Aufwachen");
await page.getByRole("button", { name: /^Weiter$/ }).click({ force: true });
await page.waitForTimeout(900);

// ----------------------------------------------------------------- 2 Anziehen
console.log("→ 2 Anziehen");
await shot("05-anziehen-start");
const shirt = page.locator('[aria-label="grünes T-Shirt"]');
// Ablageflächen haben kein Label — über Position ansteuern.
const buehne = page.locator(".buehne");
const bbox = await buehne.boundingBox();
const punkt = (px, py) => ({ x: bbox.x + (bbox.width * px) / 100, y: bbox.y + (bbox.height * py) / 100 });

const ziehenNachPunkt = async (loc, px, py) => {
  const a = await mitte(loc);
  const b = punkt(px, py);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  for (let i = 1; i <= 12; i++) {
    await page.mouse.move(a.x + ((b.x - a.x) * i) / 12, a.y + ((b.y - a.y) * i) / 12);
    await page.waitForTimeout(16);
  }
  await page.mouse.up();
  await page.waitForTimeout(360);
};

await ziehenNachPunkt(shirt, 50, 43);
await page.waitForTimeout(400);
await ziehenNachPunkt(page.locator('[aria-label="blaue Hose"]'), 50, 68);
await page.waitForTimeout(1600);
await shot("06-anziehen-jubel");
await jubelWeg("Anziehen");
await page.getByRole("button", { name: /^Weiter$/ }).click({ force: true });
await page.waitForTimeout(900);

// --------------------------------------------------------------- 3 Frühstück
console.log("→ 3 Frühstück");
await shot("07-fruehstueck-start");
for (const [art, anzahl] of [["Erdbeere", 3], ["Banane", 2], ["Heidelbeere", 5]]) {
  for (let i = 0; i < anzahl; i++) {
    await ziehenNachPunkt(page.locator(`[aria-label="${art}"]`).first(), 50, 66);
    await page.waitForTimeout(280);
  }
  await page.waitForTimeout(2200);
}
await page.waitForTimeout(900);
await shot("08-fruehstueck-jubel");
await jubelWeg("Frühstück");
await page.getByRole("button", { name: /^Weiter$/ }).click({ force: true });
await page.waitForTimeout(900);

// -------------------------------------------------------------------- 4 Turm
console.log("→ 4 Turm");
await shot("09-turm-start");
for (let i = 0; i < 6; i++) {
  const steine = page.locator('.buehne > .huelle');
  const anzahl = await steine.count();
  if (!anzahl) { fehler.push("Turm: keine Steine mehr"); break; }
  await ziehenNachPunkt(steine.first(), 68, 62);
  await page.waitForTimeout(420);
}
await page.waitForTimeout(1500);
await shot("10-turm-jubel");
await jubelWeg("Turm");
await page.getByRole("button", { name: /^Weiter$/ }).click({ force: true });
await page.waitForTimeout(900);

// -------------------------------------------------------------- 5 Aufräumen
console.log("→ 5 Aufräumen");
await shot("11-aufraeumen-start");
const kistenX = { Baustein: 20, Teddy: 50, Kuschelhase: 50, Ball: 80 };
for (const name of ["Baustein", "Baustein", "Teddy", "Kuschelhase", "Ball", "Ball"]) {
  const el = page.locator(`[aria-label="${name}"]`).first();
  if (!(await el.count())) continue;
  await ziehenNachPunkt(el, kistenX[name], 80);
  await page.waitForTimeout(320);
}
await page.waitForTimeout(1400);
await shot("12-aufraeumen-jubel");
await jubelWeg("Aufräumen");
await page.getByRole("button", { name: /^Weiter$/ }).click({ force: true });
await page.waitForTimeout(900);

// ----------------------------------------------------------------- 6 Blumen
console.log("→ 6 Blumen");
await shot("13-blumen-start");
const kanne = page.locator('.buehne > .z-40[style*="cursor"]').first();
for (const x of [15, 32, 50, 68, 85]) {
  const a = await mitte(kanne);
  const b = punkt(x + 4, 54);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) {
    await page.mouse.move(a.x + ((b.x - a.x) * i) / 10, a.y + ((b.y - a.y) * i) / 10);
    await page.waitForTimeout(20);
  }
  // halten, bis die Blume blüht
  for (let i = 0; i < 22; i++) {
    await page.mouse.move(b.x + (i % 2), b.y);
    await page.waitForTimeout(70);
  }
  await page.mouse.up();
  await page.waitForTimeout(260);
}
await page.waitForTimeout(1500);
await shot("14-blumen-jubel");
await jubelWeg("Blumen");
await page.getByRole("button", { name: /^Weiter$/ }).click({ force: true });
await page.waitForTimeout(900);

// ------------------------------------------------------------------ 7 Kekse
console.log("→ 7 Kekse");
await shot("15-kekse-zutaten");
// Die Zutaten werden in die Schüssel gezogen, nicht angetippt.
for (const z of ["Mehl", "Ei", "Zucker"]) {
  await ziehenNachPunkt(page.locator(`[aria-label="${z}"]`).first(), 52, 56);
  await page.waitForTimeout(400);
}
await page.waitForTimeout(1000);
await shot("16-kekse-ruehren");
// im Kreis rühren
const m = punkt(52, 56);
const r = bbox.width * 0.14;
await page.mouse.move(m.x + r, m.y);
await page.mouse.down();
for (let runde = 0; runde < 4; runde++) {
  for (let a = 0; a <= 360; a += 15) {
    const rad = (a * Math.PI) / 180;
    await page.mouse.move(m.x + Math.cos(rad) * r, m.y + Math.sin(rad) * r);
    await page.waitForTimeout(8);
  }
}
await page.mouse.up();
await page.waitForTimeout(1200);
await shot("17-kekse-ausstechen");
for (let i = 0; i < 5; i++) {
  const formen = page.locator('.buehne > .huelle');
  if (!(await formen.count())) { fehler.push("Kekse: keine Förmchen"); break; }
  await ziehenNachPunkt(formen.nth(i % (await formen.count())), 52, 56);
  await page.waitForTimeout(420);
}
await page.waitForTimeout(1500);
await shot("18-kekse-jubel");
await jubelWeg("Kekse");
await page.getByRole("button", { name: /^Weiter$/ }).click({ force: true });
await page.waitForTimeout(900);

// ---------------------------------------------------------------- 8 Pfützen
console.log("→ 8 Pfützen");
await shot("19-pfuetzen-start");
for (let i = 0; i < 6; i++) {
  const p = page.getByRole("button", { name: "Pfütze" });
  const n = await p.count();
  let geklickt = false;
  for (let k = 0; k < n; k++) {
    const el = p.nth(k);
    if (await el.isEnabled()) {
      await el.click({ force: true });
      geklickt = true;
      break;
    }
  }
  if (!geklickt) fehler.push(`Pfützen: keine aktive Pfütze bei Sprung ${i + 1}`);
  await page.waitForTimeout(700);
}
await page.waitForTimeout(1200);
await shot("20-pfuetzen-jubel");
await jubelWeg("Pfützen");
await page.getByRole("button", { name: /^Weiter$/ }).click({ force: true });
await page.waitForTimeout(900);

// ----------------------------------------------------------------- 9 Schafe
console.log("→ 9 Schafe");
await shot("21-schafe-zaehlen");
for (let i = 1; i <= 10; i++) {
  await page.getByRole("button", { name: `Schaf ${i}`, exact: true }).click({ force: true });
  await page.waitForTimeout(220);
}
await page.waitForTimeout(1400);
await shot("22-schafe-streicheln");
for (let i = 1; i <= 10; i++) {
  await page.getByRole("button", { name: `Schaf ${i}`, exact: true }).click({ force: true });
  await page.waitForTimeout(180);
}
await page.waitForTimeout(1400);
await shot("23-schafe-jubel");
await jubelWeg("Schafe");
await page.getByRole("button", { name: /^Weiter$/ }).click({ force: true });
await page.waitForTimeout(900);

// -------------------------------------------------------- 10 Schmetterlinge
console.log("→ 10 Schmetterlinge");
await shot("24-schmetterlinge-start");
// Blumen und Falter stehen jetzt in wechselnder Reihenfolge — also über
// ihre Namen suchen statt über feste Plätze.
for (const farbe of ["rot", "gelb", "blau", "lila", "orange"]) {
  const falter = page.locator(`[aria-label="Schmetterling ${farbe}"]`).first();
  const blume = page.locator(`[aria-label="Blume ${farbe}"]`).first();
  if (!(await falter.count()) || !(await blume.count())) {
    fehler.push(`Schmetterlinge: ${farbe} nicht gefunden`);
    continue;
  }
  const zb = await blume.boundingBox();
  const zielX = ((zb.x + zb.width / 2 - bbox.x) / bbox.width) * 100;
  const zielY = ((zb.y + zb.height / 2 - bbox.y) / bbox.height) * 100;
  await ziehenNachPunkt(falter, zielX, zielY);
  await page.waitForTimeout(400);
}
await page.waitForTimeout(1500);
await shot("25-schmetterlinge-jubel");
await jubelWeg("Schmetterlinge");
await page.getByRole("button", { name: /^Weiter$/ }).click({ force: true });
await page.waitForTimeout(900);

// ------------------------------------------------------------ 11 Gute Nacht
console.log("→ 11 Gute Nacht");
await shot("26-gutenacht-sterne");
const sterne = page.getByRole("button", { name: "Stern" });
const anzahlSterne = await sterne.count();
for (let i = 0; i < anzahlSterne; i++) {
  await sterne.nth(i).click({ force: true });
  await page.waitForTimeout(300);
}
/*
 * Jeder Tipp muss seinen eigenen Stern treffen.
 *
 * Als die Sterne enger zusammenrückten, überlappten sich zwei Tippflächen:
 * Der Tipp landete auf dem Nachbarn, zwei Sterne blieben dunkel, und die
 * Station kam nie zur Decke. Ein leuchtender Stern ist nicht mehr antippbar,
 * also müssen danach alle sieben Knöpfe gesperrt sein.
 */
const nochOffen = await sterne.evaluateAll((els) => els.filter((e) => !e.disabled).length);
if (nochOffen > 0) {
  throw new Error(`${nochOffen} von ${anzahlSterne} Sternen blieben dunkel — Tippflächen überlappen sich`);
}
await page.waitForTimeout(7000);
await shot("27-gutenacht-decke");
// Decke hochziehen
const deckeStart = punkt(50, 92);
await page.mouse.move(deckeStart.x, deckeStart.y);
await page.mouse.down();
for (let i = 1; i <= 14; i++) {
  await page.mouse.move(deckeStart.x, deckeStart.y - i * 12);
  await page.waitForTimeout(24);
}
await page.mouse.up();
await page.waitForTimeout(5000);
await shot("28-gutenacht-jubel");
await jubelWeg("Gute Nacht");
await page.getByRole("button", { name: /toller Tag/ }).click({ force: true });
await page.waitForTimeout(2500);
await shot("29-finale");

// Stickerheft
await page.getByRole("button", { name: /Zur Tageskarte/ }).click({ force: true });
await page.waitForTimeout(900);
await shot("30-tageskarte-voll");
await page.locator("button").filter({ hasText: /von 11/ }).first().click({ force: true });
// Die Sticker blenden versetzt ein — sonst zeigt das Bild den letzten
// noch halb eingeblendet, als wäre er nicht gesammelt.
await page.waitForTimeout(1200);
await page.waitForTimeout(900);
await shot("31-stickerheft");

console.log("\n" + (fehler.length ? "❌ Probleme:" : "✅ Durchlauf ohne Fehler"));
if (fehler.length) process.exitCode = 1;
fehler.forEach((f) => console.log("  -", f));

await browser.close();
