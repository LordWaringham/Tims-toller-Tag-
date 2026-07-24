/**
 * Ein sehr kleiner ZIP-Packer.
 *
 * Die Aufnahmen sind bereits komprimiert (Opus bzw. AAC), deshalb werden sie
 * ohne weitere Komprimierung abgelegt ("store"). Das macht den Packer kurz
 * genug, um ohne zusätzliche Abhängigkeit auszukommen.
 */

const CRC_TABELLE = (() => {
  const tabelle = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    tabelle[i] = c >>> 0;
  }
  return tabelle;
})();

function crc32(daten: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < daten.length; i++) {
    c = CRC_TABELLE[(c ^ daten[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

/** Datum und Uhrzeit im alten DOS-Format, das ZIP bis heute verwendet. */
function dosZeit(d: Date) {
  const zeit =
    (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2);
  const datum =
    ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { zeit, datum };
}

interface Eintrag {
  name: string;
  daten: Uint8Array;
}

class Puffer {
  private teile: Uint8Array[] = [];
  laenge = 0;

  schreibe(bytes: Uint8Array) {
    this.teile.push(bytes);
    this.laenge += bytes.length;
  }

  u16(wert: number) {
    const b = new Uint8Array(2);
    new DataView(b.buffer).setUint16(0, wert, true);
    this.schreibe(b);
  }

  u32(wert: number) {
    const b = new Uint8Array(4);
    new DataView(b.buffer).setUint32(0, wert >>> 0, true);
    this.schreibe(b);
  }

  fertig(): Uint8Array {
    const alles = new Uint8Array(this.laenge);
    let pos = 0;
    for (const teil of this.teile) {
      alles.set(teil, pos);
      pos += teil.length;
    }
    return alles;
  }
}

/** Packt Dateien in ein ZIP-Archiv. */
export function packeZip(dateien: Eintrag[]): Blob {
  const kodierer = new TextEncoder();
  const aus = new Puffer();
  const verzeichnis: { name: Uint8Array; crc: number; groesse: number; versatz: number }[] = [];
  const { zeit, datum } = dosZeit(new Date());

  for (const datei of dateien) {
    const name = kodierer.encode(datei.name);
    const crc = crc32(datei.daten);
    const versatz = aus.laenge;

    // Lokaler Dateikopf
    aus.u32(0x04034b50);
    aus.u16(20); // benötigte Version
    aus.u16(0x0800); // Dateinamen sind UTF-8
    aus.u16(0); // Methode 0 = ohne Komprimierung
    aus.u16(zeit);
    aus.u16(datum);
    aus.u32(crc);
    aus.u32(datei.daten.length);
    aus.u32(datei.daten.length);
    aus.u16(name.length);
    aus.u16(0); // keine Zusatzfelder
    aus.schreibe(name);
    aus.schreibe(datei.daten);

    verzeichnis.push({ name, crc, groesse: datei.daten.length, versatz });
  }

  const verzeichnisStart = aus.laenge;
  for (const eintrag of verzeichnis) {
    aus.u32(0x02014b50);
    aus.u16(20); // erzeugt von
    aus.u16(20); // benötigte Version
    aus.u16(0x0800);
    aus.u16(0);
    aus.u16(zeit);
    aus.u16(datum);
    aus.u32(eintrag.crc);
    aus.u32(eintrag.groesse);
    aus.u32(eintrag.groesse);
    aus.u16(eintrag.name.length);
    aus.u16(0); // Zusatzfelder
    aus.u16(0); // Kommentar
    aus.u16(0); // Datenträger
    aus.u16(0); // interne Merkmale
    aus.u32(0); // externe Merkmale
    aus.u32(eintrag.versatz);
    aus.schreibe(eintrag.name);
  }
  const verzeichnisLaenge = aus.laenge - verzeichnisStart;

  // Abschluss des Zentralverzeichnisses
  aus.u32(0x06054b50);
  aus.u16(0);
  aus.u16(0);
  aus.u16(verzeichnis.length);
  aus.u16(verzeichnis.length);
  aus.u32(verzeichnisLaenge);
  aus.u32(verzeichnisStart);
  aus.u16(0);

  return new Blob([aus.fertig() as unknown as BlobPart], { type: "application/zip" });
}
