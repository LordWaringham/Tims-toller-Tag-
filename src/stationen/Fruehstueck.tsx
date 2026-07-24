"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { StationRahmen, type StationProps } from "@/components/StationRahmen";
import { Ablage, Ziehbar } from "@/components/dnd";
import { Frucht, FRUCHT_NAME, type FruchtArt } from "@/components/Fruechte";
import { STATIONS } from "@/lib/stations";
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
      setTimeout(() => {
        if (letzte) {
          onGeschafft();
          setFertig(true);
        } else {
          setRunde((r) => r + 1);
          setGezaehlt(0);
          setDanebenGetippt(0);
        }
      }, 1100);
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
      schleier={0.18}
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

      {/* -------------------------------------------------------- Schüssel */}
      <Ablage
        id="schuessel"
        toleranzCqw={8}
        style={{
          position: "absolute",
          left: "50%",
          top: "66%",
          width: "50cqw",
          height: "26cqw",
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
                width: "9cqw",
                transform: "translate(-50%, -50%)",
              }}
              initial={{ scale: 0, y: "-8cqw", rotate: 0 }}
              animate={{ scale: 1, y: 0, rotate: f.dreh }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
            >
              <Frucht art={f.art} className="w-full drop-shadow" />
            </motion.div>
          ))}
        </AnimatePresence>
      </Ablage>
    </StationRahmen>
  );
}

/** Früchte verteilen sich in der Schüssel — gestreut, aber je Platz fest. */
function neueFrucht(art: FruchtArt, key: number): InSchuessel {
  return {
    key,
    art,
    x: streuIn(key, 11, 14, 86),
    y: streuIn(key, 12, 30, 76),
    dreh: streuIn(key, 13, -25, 25),
  };
}
