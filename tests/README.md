# Browsertests

```bash
npm run build
npm test
```

`npm test` startet sich selbst einen Webserver auf `out/`, führt alle Prüfungen
aus und beendet ihn wieder. Läuft schon einer, wird er benutzt — eine andere
Adresse geht über `TTT_URL`.

Einzeln:

```bash
npm run test:durchlauf   # alle elf Stationen von vorn bis hinten durchspielen
npm run test:groessen    # Handy und Tablet, quer und hoch
npm run test:ton         # spielt das Spiel zwei Sätze gleichzeitig ab?
npm run test:offline     # läuft alles ohne Netz, samt Sprachaufnahmen?
npm run test:aufnahme    # Aufnahmestudio bis zum fertigen ZIP
npm run test:kinder      # bleiben die drei Spielstände getrennt?
```

Screenshots landen in `tests/bilder/` und sind nicht eingecheckt. Sie lohnen
den Blick: Manche Fehler bestehen jede Zusicherung und sind trotzdem auf einen
Blick zu sehen.

## Warum echte Browsertests

Fast alle Fehler in diesem Projekt waren nur im Browser zu finden:

- Motion überschrieb die Positionierung, sodass alles Ziehbare um seine halbe
  Größe verschoben saß — die Hosen ragten aus dem Bild.
- Motion übernahm `filter` beim ersten Rendern und ignorierte spätere
  Änderungen; die Blumen blühten nie sichtbar auf, obwohl der Zustand stimmte.
- Zwei Sätze starteten in derselben Millisekunde, weil beide auf dasselbe
  Laden warteten.
- Ohne Netz fehlten sämtliche Sprachaufnahmen.

Kein einziger davon wäre einem Einheitstest aufgefallen. `test:ton` zählt
deshalb mit, wie viele Audioelemente gleichzeitig laufen, und `test:offline`
schaltet das Netz wirklich ab.

Ein Test, der immer grün ist, beweist nichts: Wer eine dieser Prüfungen ändert,
sollte den Fehler einmal absichtlich wieder einbauen und nachsehen, ob sie
anschlägt.
