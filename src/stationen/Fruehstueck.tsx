"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { StationRahmen, type StationProps } from "@/components/StationRahmen";
import { Ablage, Ziehbar } from "@/components/dnd";
import { Frucht, FRUCHT_NAME, type FruchtArt } from "@/components/Fruechte";
import { ERFOLGSPAUSE, STATIONS } from "@/lib/stations";
import { zahl, type LineId } from "@/lib/lines";
import * as sfx from "@/lib/sfx";
import * as voice from "@/lib/voice";
import { streuIn } from "@/lib/streu";

const STATION = STATIONS[2];

interface Runde {
  art: FruchtArt;
  anzahl: number;
  satz: LineId;
}

const RUNDEN: Runde[] = [
  { art: "erdbeere", anzahl: 3, satz: "s03-erdbeeren" },
  { art: "banane", anzahl: 2, satz: "s03-bananen" },
  { art: "heidelbeere", anzahl: 5, satz: "s03-heidelbeeren" },
];

/** Die drei Spender links. */
const SPENDER: { art: FruchtArt; y: number }[] = [
  { art: "erdbeere", y: 27 },
  { art: "banane", y: 50 },
  { art: "heidelbeere", y: 73 },
];

interface InSchuessel {
  key: number;
  art: FruchtArt;
  x: number;
  y: number;
  dreh: number;
}

/**
 * Zählen bis fünf.
 * Rechts zeigt eine Karte, wie viele Früchte noch fehlen — so sieht das Kind
 * die Zahl, bevor es sie hören kann.
 */
export function Fruehstueck({ onGeschafft, onWeiter, onZurueck }: StationProps) {
  const [runde, setRunde] = useState(0);
  const [gezaehlt, setGezaehlt] = useState(0);
  const [schuessel, setSchuessel] = useState<InSchuessel[]>([]);
  const [danebenGetippt, setDanebenGetippt] = useState(0);
  const [milch, setMilch] = useState(false);
  const [fertig, setFertig] = useState(false);
  const naechsterKey = useRef(0);

  const aktuell = RUNDEN[Math.min(runde, RUNDEN.length - 1)];
  const satz: LineId = runde === 0 && gezaehlt === 0 ? "s03-intro" : aktuell.satz;

  const hineinlegen = (art: FruchtArt, zone: string | null) => {
    if (zone !== "schuessel") return false;

    if (art !== aktuell.art) {
      // Kein Fehler — die Frucht landet trotzdem in der Schüssel, sie zählt nur nicht mit.
      setDanebenGetippt((n) => n + 1);
      sfx.nope();
      setSchuessel((alt) => [...alt, neueFrucht(art, naechsterKey.current++)]);
      return true;
    }

    const neu = gezaehlt + 1;
    setGezaehlt(neu);
    setSchuessel((alt) => [...alt, neueFrucht(art, naechsterKey.current++)]);
    sfx.chime(neu + 1);
    const zahlSatz = zahl(neu);
    if (zahlSatz) void voice.speak(zahlSatz);

    if (neu >= aktuell.anzahl) {
      const letzte = runde >= RUNDEN.length - 1;
      if (letzte) {
        /*
         * Zum Schluss kommt die Milch dazu.
         *
         * Das ist die Belohnung und zugleich das Zeichen, dass es geschafft
         * ist: Die Schüssel füllt sich sichtbar, bevor der Jubel kommt. Erst
         * damit ist aus den Früchten ein Frühstück geworden.
         */
        onGeschafft();
        setTimeout(() => {
          setMilch(true);
          sfx.water();
        }, 350);
        setTimeout(() => setFertig(true), ERFOLGSPAUSE + 900);
      } else {
        setTimeout(() => {
          setRunde((r) => r + 1);
          setGezaehlt(0);
          setDanebenGetippt(0);
        }, 1100);
      }
    }
    return true;
  };

  return (
    <StationRahmen
      station={STATION}
      satz={satz}
      fertig={fertig}
      onWeiter={onWeiter}
      onZurueck={onZurueck}
      abschlussSatz="s03-fertig"
      unschaerfe={1.0}
      schleier={0.42}
    >
      {/* -------------------------------------------------- Spender (links) */}
      {SPENDER.map((spender) => {
        const gefragt = spender.art === aktuell.art;
        return (
          <div key={spender.art}>
            <Ziehbar
              id={spender.art}
              onAblegen={(zone) => hineinlegen(spender.art, zone)}
              hinweis={gefragt && danebenGetippt >= 2}
              x={9}
              y={spender.y}
              breite={13}
            >
              <motion.div
                animate={{ scale: gefragt ? 1 : 0.82, opacity: gefragt ? 1 : 0.62 }}
                transition={{ type: "spring", stiffness: 240, damping: 20 }}
                className="drop-shadow-md"
                aria-label={FRUCHT_NAME[spender.art]}
              >
                <Frucht art={spender.art} className="w-full" />
              </motion.div>
            </Ziehbar>
            {/* Korbkante, damit klar ist: hier gibt es immer Nachschub */}
            <div
              className="pointer-events-none absolute z-20"
              style={{
                left: "9%",
                top: `${spender.y + 7}%`,
                width: "16cqw",
                height: "4cqw",
                transform: "translate(-50%, -50%)",
                borderRadius: "0 0 3cqw 3cqw",
                background: "rgba(200,160,110,0.55)",
                border: "0.4cqw solid rgba(150,110,70,0.5)",
                borderTop: "none",
              }}
              aria-hidden
            />
          </div>
        );
      })}

      {/* ------------------------------------------------ Auftrag (rechts) */}
      <div
        className="absolute z-30 flex flex-col items-center gap-[1.2cqw] rounded-[3cqw] px-[2.4cqw] py-[2cqw] shadow-lg"
        style={{
          left: "83%",
          top: "45%",
          transform: "translate(-50%, -50%)",
          background: "rgba(255,255,255,0.9)",
        }}
      >
        <span className="text-[2.4cqw] font-semibold" style={{ color: "#5f6b5c" }}>
          Tim möchte
        </span>
        <span className="text-[7cqw] leading-none font-bold" style={{ color: "#e8622a" }}>
          {aktuell.anzahl}
        </span>
        <div className="flex flex-col gap-[0.8cqw]">
          {Array.from({ length: aktuell.anzahl }, (_, i) => (
            <span
              key={i}
              className="grid place-items-center rounded-full"
              style={{
                width: "6cqw",
                height: "6cqw",
                background: i < gezaehlt ? "rgba(126,176,60,0.28)" : "rgba(0,0,0,0.05)",
              }}
            >
              <Frucht
                art={aktuell.art}
                className="w-[4.4cqw]"
              />
              {i < gezaehlt && (
                <motion.span
                  className="absolute text-[3.4cqw]"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  ✓
                </motion.span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/*
        Eine eigene, leere Schüssel.

        Auf der Buchillustration ist die Schüssel bereits randvoll — das Kind
        soll sie aber selbst füllen. Deshalb liegt hier eine gezeichnete
        Schüssel darüber: hinten die Innenseite, dann die Früchte, davor die
        Vorderwand. So liegen die Früchte sichtbar *in* der Schüssel.
      */}
      <div
        className="huelle pointer-events-none"
        style={{ left: "50%", top: "76%", width: "62cqw", zIndex: 8 }}
        aria-hidden
      >
        <SchuesselRueckseite />
      </div>

      <Ablage
        id="schuessel"
        toleranzCqw={10}
        style={{
          position: "absolute",
          left: "50%",
          top: "66%",
          width: "44cqw",
          height: "15cqw",
          transform: "translate(-50%, -50%)",
          zIndex: 10,
        }}
      >
        <AnimatePresence>
          {schuessel.map((f) => (
            <motion.div
              key={f.key}
              className="absolute"
              style={{
                left: `${f.x}%`,
                top: `${f.y}%`,
                width: "8.5cqw",
                // `translate` statt `transform`: Motion verwaltet `transform`
                // selbst und überschriebe die Zentrierung — die Früchte lägen
                // um ihre halbe Größe nach rechts unten versetzt.
                translate: "-50% -50%",
              }}
              initial={{ scale: 0, y: "-10cqw", rotate: 0 }}
              animate={{ scale: 1, y: 0, rotate: f.dreh }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
            >
              <Frucht art={f.art} className="w-full drop-shadow" geschaelt />
            </motion.div>
          ))}
        </AnimatePresence>
      </Ablage>

      {/* Die Milch liegt hinter den Früchten — sie schwimmen darauf. */}
      <AnimatePresence>
        {milch && (
          <motion.div
            className="huelle pointer-events-none"
            style={{ left: "50%", top: "76%", width: "62cqw", zIndex: 9 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            aria-hidden
          >
            <Milch />
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="huelle pointer-events-none"
        style={{ left: "50%", top: "76%", width: "62cqw", zIndex: 12 }}
        aria-hidden
      >
        <SchuesselVorderseite />
      </div>
    </StationRahmen>
  );
}

/** Innenseite der Schüssel — liegt hinter den Früchten. */
function SchuesselRueckseite() {
  return (
    <svg viewBox="0 0 200 130" className="w-full" aria-hidden>
      <ellipse cx="100" cy="34" rx="96" ry="26" fill="#2f7d9c" />
      <ellipse cx="100" cy="35" rx="88" ry="21" fill="#1e5670" />
      <ellipse cx="100" cy="31" rx="88" ry="21" fill="#26688a" />
    </svg>
  );
}

/** Vorderwand der Schüssel — liegt vor den Früchten. */
function SchuesselVorderseite() {
  return (
    <svg viewBox="0 0 200 130" className="w-full drop-shadow-lg" aria-hidden>
      <defs>
        <linearGradient id="schuesselFarbe" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4fa3c4" />
          <stop offset="70%" stopColor="#2f7d9c" />
          <stop offset="100%" stopColor="#215d75" />
        </linearGradient>
      </defs>
      <path
        d="M4 34 A96 26 0 0 0 196 34 C196 92 154 126 100 126 C46 126 4 92 4 34z"
        fill="url(#schuesselFarbe)"
      />
      {/* Glanzlicht */}
      <path
        d="M28 56 C34 84 56 104 82 112"
        fill="none"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="9"
        strokeLinecap="round"
      />
      {/* Rand */}
      <path
        d="M4 34 A96 26 0 0 0 196 34"
        fill="none"
        stroke="#69b6d4"
        strokeWidth="4"
      />
      {/* Fuß */}
      <ellipse cx="100" cy="126" rx="34" ry="5" fill="rgba(0,0,0,0.12)" />
    </svg>
  );
}

/** Früchte verteilen sich in der Schüssel — gestreut, aber je Platz fest. */
function neueFrucht(art: FruchtArt, key: number): InSchuessel {
  return {
    key,
    art,
    x: streuIn(key, 11, 12, 88),
    y: streuIn(key, 12, 22, 78),
    dreh: streuIn(key, 13, -25, 25),
  };
}

/**
 * Milch, die in die Schüssel läuft.
 *
 * Der Strahl kommt von oben, dann steigt der Spiegel. Die Form folgt der
 * Innenseite der Schüssel aus SchuesselRueckseite, damit die Milch wirklich
 * darin steht und nicht davor liegt.
 */
function Milch() {
  return (
    <svg viewBox="0 0 200 130" className="w-full overflow-visible" aria-hidden>
      <defs>
        {/*
          Sichtbar ist von der Schüssel nur die Öffnung.

          Die Vorderseite ist eine gefüllte Fläche und deckt alles darunter zu;
          ein Milchspiegel im Bauch der Schüssel wäre unsichtbar. Gefüllt wird
          deshalb genau die Ellipse der Öffnung — von unten nach oben, so wie
          man beim Hineinschauen den Spiegel steigen sieht.
        */}
        <clipPath id="schuesselOeffnung">
          <ellipse cx="100" cy="34" rx="94" ry="25" />
        </clipPath>
      </defs>

      {/* Der Strahl von oben */}
      <motion.rect
        x="94"
        y="-64"
        width="12"
        height="86"
        rx="6"
        fill="#fdfbf4"
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ opacity: [0, 1, 1, 0], scaleY: [0, 1, 1, 1] }}
        transition={{ duration: 1.6, times: [0, 0.16, 0.72, 1], ease: "easeOut" }}
        style={{ transformOrigin: "100px -64px" }}
      />

      <g clipPath="url(#schuesselOeffnung)">
        {/*
          Verschoben statt in der Höhe verändert: Motion deutet `y` an einem
          SVG-Element als Verschiebung, nicht als Attribut — eine Animation von
          `y` und `height` bliebe wirkungslos.
        */}
        <motion.g
          initial={{ y: 42 }}
          animate={{ y: 0 }}
          transition={{ duration: 1.2, delay: 0.34, ease: "easeOut" }}
        >
          <rect x="0" y="26" width="200" height="46" fill="#fdfbf4" />
          <ellipse cx="100" cy="26" rx="92" ry="8" fill="#ffffff" />
          <ellipse cx="100" cy="26" rx="92" ry="8" fill="rgba(180,198,212,0.22)" />
        </motion.g>
      </g>
    </svg>
  );
}
