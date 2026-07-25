# Tims toller Tag — das Spiel

Ein Mitmachspiel nach dem Bilderbuch *„Tims toller Tag“* — für **Luisa, Maya
und Marla**, von **Onkel Tom**. Jede Buchseite ist eine Station: vom Aufwachen
bis zum Gutenachtgruß, mit denselben Illustrationen und denselben Sätzen wie
im Buch.

Jedes der drei Kinder hat einen eigenen Spielstand. Beim Start wird gefragt,
wer heute spielt — sonst fände die Zweite alles schon aufgeschlossen vor, und
die Reise durch den Tag fiele für sie aus.

## Wie es sich spielt

Der Tag wird der Reihe nach gespielt. Auf der Tageskarte leuchtet immer die
Station, bei der es weitergeht; die späteren sind noch verschlossen. Für jede
geschaffte Station gibt es einen Sticker fürs Stickerheft, und am Ende des Tages
steht wieder der Satz aus dem Buch: *„Das war ein toller Tag. Bis morgen!“*

| # | Station | Was zu tun ist | Was dabei geübt wird |
|---|---------|----------------|----------------------|
| 1 | Aufwachen | Sonne, Teddy und Tim wecken | Ursache und Wirkung |
| 2 | Anziehen | Tim ein Oberteil und eine Hose anziehen | Zuordnen und Farben |
| 3 | Frühstück | Die Schüssel mit Früchten füllen | Zählen bis 5 |
| 4 | Turm bauen | Sechs Bausteine stapeln | Zählen und Feinmotorik |
| 5 | Aufräumen | Spielzeug in die richtige Kiste sortieren | Kategorien |
| 6 | Blumen gießen | Die Gießkanne über jede Blume halten | Geduld und Ausdauer |
| 7 | Kekse backen | Zutaten, rühren, ausstechen | Reihenfolge und Formen |
| 8 | Pfützen | In jede Pfütze springen | Rhythmus und Timing |
| 9 | Schafe | Zehn Schafe zählen und streicheln | Zählen bis 10 |
| 10 | Schmetterlinge | Jeden Falter zur passenden Blume bringen | Farben zuordnen |
| 11 | Gute Nacht | Sternbild antippen, Tim zudecken | Zur Ruhe kommen |

## Was bewusst fehlt

Das Spiel ist für ein Kind gebaut, das noch nicht lesen kann und noch nicht
verlieren mag.

- **Kein Verlieren.** Keine Zeit, keine Punkte, kein Rot, kein Fehlerton. Was
  nicht passt, hüpft freundlich zurück.
- **Kein Lesen nötig.** Jeder Hinweis wird vorgelesen und ist zusätzlich als
  Bild da. Der Lautsprecher oben wiederholt ihn beliebig oft.
- **Große Ziele.** Tippflächen und Fangbereiche sind großzügig — Fünfjährige
  zielen ungenau, und das Spiel kommt ihnen entgegen.
- **Sanfte Hilfe.** Wenn eine Weile nichts passiert, wackelt die richtige Stelle.
- **Keine Werbung, keine Käufe, keine Links nach außen, keine Datensammlung.**
  Der Fortschritt bleibt in `localStorage` auf dem Gerät.

## Eigene Stimme einsprechen

Standardmäßig liest die deutsche Stimme des Geräts vor. Alle Sätze können durch
echte Aufnahmen ersetzt werden — am einfachsten über das eingebaute
**Aufnahmestudio unter [`/aufnahme`](https://tims-toller-tag.vercel.app/aufnahme)**.
Die Seite ist bewusst nicht aus dem Spiel heraus verlinkt; sie wird über die
Adresse aufgerufen:

1. Alle Sätze stehen dort untereinander, jeder mit einem Aufnahmeknopf.
   Eingesprochen wird direkt im Browser, auch am Handy.
2. Was schon im Spiel liegt, ist grün und als *schon im Spiel* gekennzeichnet —
   auch auf einem fremden Gerät. Offen steht oben, wie viele Sätze noch fehlen.
3. Jede Aufnahme lässt sich sofort anhören und beliebig oft neu machen. Die
   Aufnahmen liegen in IndexedDB — das Fenster darf zwischendurch zu sein.
4. **Herunterladen** liefert ein ZIP — nur mit den neu aufgenommenen Sätzen.
5. Den Inhalt des ZIPs nach `public/audio/` hochladen (auf GitHub:
   *Add file → Upload files*). Der nächste Build übernimmt sie automatisch.

Von Hand geht es auch: Datei nach der ID des Satzes benennen und in
`public/audio/` legen, z. B. `s03-erdbeeren.mp3`. Erlaubt sind `.mp3`, `.m4a`,
`.wav`, `.ogg`, `.webm` und `.aac`.

Ein Hinweis zur Reihenfolge: Die Sätze unter *Allgemein* und die Zahlen kommen
in **allen** Stationen vor. Wer nur einen Teil einspricht, sollte mit diesen 21
anfangen — sonst wechselt die Stimme mitten im Spiel ständig.

Die vollständige Liste mit Dateinamen und Text steht in
**[SPRECHTEXTE.md](SPRECHTEXTE.md)**. Es müssen nicht alle Sätze sein: für jeden
fehlenden springt die Gerätestimme ein, man kann also jederzeit ein paar
nachreichen.

```bash
npm run sprechtexte   # SPRECHTEXTE.md neu erzeugen (nach Textänderungen)
npm run audio         # nachsehen, welche Aufnahmen vorhanden sind
```

## Entwickeln

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # statischer Export nach out/
npm run lint
npm test         # Browsertests, siehe tests/README.md
```

`npm test` spielt das gebaute Spiel in einem echten Browser durch: alle elf
Stationen, vier Bildschirmgrößen, der Offline-Betrieb und die Frage, ob je
zwei Sätze gleichzeitig erklingen. Fast jeder Fehler in diesem Projekt war
nur so zu finden — Näheres in [tests/README.md](tests/README.md).

## Auf Vercel veröffentlichen

Das Spiel ist ein statischer Export (`output: "export"`) und braucht keinen
Server. Repository in Vercel importieren — das Next.js-Preset passt ohne
Änderung. Ansonsten reicht auch der Inhalt von `out/` auf beliebigem Webspace.

Auf dem Tablet lässt sich die Seite über *Zum Home-Bildschirm hinzufügen*
ablegen; sie startet dann im Vollbild und funktioniert auch **ohne Internet**
(Service Worker, alle Bilder werden vorab gespeichert).

## Aufbau

```
src/
  app/            Seitengerüst, Schriften, Grundstile
  components/     Bühne, Sprechblase, Tippziel, Ziehen und Ablegen, Jubel …
  stationen/      die elf Mini-Spiele
  lib/
    lines.ts      alle gesprochenen Sätze (Quelle für SPRECHTEXTE.md)
    voice.ts      Aufnahme bevorzugt, sonst Gerätestimme
    sfx.ts        Geräusche, im Browser erzeugt — keine Audiodateien
    stations.ts   Reihenfolge, Sticker, Himmelsfarben
    kinder.ts     Luisa, Maya, Marla — und von wem das Spiel kommt
    progress.ts   Fortschritt je Kind im localStorage
public/
  scenes/         die zwölf Illustrationen aus dem Buch
  audio/          die eingesprochenen Sätze
tests/            Browsertests (Playwright)
```

Zwei Dinge, über die man beim Weiterbauen leicht stolpert:

- **Position und Animation gehören getrennt.** Motion verwaltet `transform`
  selbst; ein `translate(-50%, -50%)` am selben Element wird überschrieben.
  Deshalb sitzt die Position auf einer äußeren Hülle (`.huelle`) und die
  Animation auf dem Element darin.
- **Animierbare CSS-Eigenschaften gehören in `animate`, nicht in `style`.**
  Motion übernimmt sie beim ersten Rendern und ignoriert spätere Änderungen
  über `style` — sonst bleiben etwa Blüten für immer blass.

Maße stehen in `cqw` (Prozent der Bühnenbreite) und Positionen in Prozent.
Dadurch sitzt alles auf jedem Bildschirm gleich, vom Handy bis zum Tablet.
