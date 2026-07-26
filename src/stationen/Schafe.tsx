"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { StationRahmen, type StationProps } from "@/components/StationRahmen";
import { ERFOLGSPAUSE, STATIONS } from "@/lib/stations";
import { zahl, type LineId } from "@/lib/lines";
import * as sfx from "@/lib/sfx";
import * as voice from "@/lib/voice";
import { neueSaat, streuIn } from "@/lib/streu";

const STATION = STATIONS[8];

/*
 * Zehn Schafe, alle vollstaendig im Bild.
 *
 * Die hintere Reihe stand frueher bis x=88; mit der Streuung ragte das
 * zehnte Schaf ueber den rechten Rand hinaus und war nur halb antippbar.
 */
const SCHAFE = [
  { id: "a", x: 13, y: 56 },
  { id: "b", x: 30, y: 54 },
  { id: "c", x: 47, y: 56 },
  { id: "d", x: 64, y: 54 },
  { id: "e", x: 81, y: 56 },
  { id: "f", x: 16, y: 76 },
  { id: "g", x: 33, y: 78 },
  { id: "h", x: 50, y: 76 },
  { id: "i", x: 67, y: 78 },
  { id: "j", x: 84, y: 76 },
];

type Phase = "zaehlen" | "streicheln";

/**
 * Erst zählen, dann streicheln.
 * Beim Streicheln reicht es, mit dem Finger über die Herde zu fahren — das
 * gelingt auch, wenn das Zielen noch nicht so klappt.
 */
export function Schafe({ onGeschafft, onWeiter, onZurueck }: StationProps) {
  // Nur die Aufstellung wechselt, nie die Anzahl.
  const [saat] = useState(neueSaat);
  const herde = SCHAFE.map((schaf, i) => ({
    ...schaf,
    x: schaf.x + streuIn(i, saat, -2.5, 2.5),
    y: schaf.y + streuIn(i, saat + 1, -2.5, 2.5),
    // Die hintere Reihe steht weiter weg und ist deshalb kleiner.
    groesse: 0.84 + ((schaf.y - 54) / 24) * 0.16,
  }));

  const [phase, setPhase] = useState<Phase>("zaehlen");
  const [gezaehlt, setGezaehlt] = useState<string[]>([]);
  const [gestreichelt, setGestreichelt] = useState<string[]>([]);
  const [fertig, setFertig] = useState(false);
  const fingerUnten = useRef(false);

  const satz: LineId =
    phase === "zaehlen"
      ? "s09-intro"
      : "s09-streicheln";

  // Für das Streicheln muss bekannt sein, ob der Finger gerade aufliegt.
  useEffect(() => {
    const runter = () => (fingerUnten.current = true);
    const hoch = () => (fingerUnten.current = false);
    window.addEventListener("pointerdown", runter);
    window.addEventListener("pointerup", hoch);
    window.addEventListener("pointercancel", hoch);
    return () => {
      window.removeEventListener("pointerdown", runter);
      window.removeEventListener("pointerup", hoch);
      window.removeEventListener("pointercancel", hoch);
    };
  }, []);

  const zaehlen = (id: string) => {
    if (phase !== "zaehlen" || gezaehlt.includes(id)) return;
    const neu = [...gezaehlt, id];
    setGezaehlt(neu);
    sfx.bleat();
    const zahlSatz = zahl(neu.length);
    if (zahlSatz) void voice.speak(zahlSatz);

    if (neu.length >= SCHAFE.length) {
      setTimeout(() => setPhase("streicheln"), 900);
    }
  };

  const streicheln = (id: string) => {
    if (phase !== "streicheln" || gestreichelt.includes(id)) return;
    const neu = [...gestreichelt, id];
    setGestreichelt(neu);
    sfx.chime(neu.length);
    if (neu.length === 1) void voice.speak("s09-maeh");

    if (neu.length >= SCHAFE.length) {
      onGeschafft();
      setTimeout(() => setFertig(true), ERFOLGSPAUSE);
    }
  };

  return (
    <StationRahmen
      station={STATION}
      satz={satz}
      fertig={fertig}
      onWeiter={onWeiter}
      onZurueck={onZurueck}
      abschlussSatz="s09-fertig"
      unschaerfe={1.1}
      schleier={0.42}
    >
      {/* Wiese */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[52%]"
        style={{
          background: "linear-gradient(180deg, rgba(140,190,80,0.55) 0%, rgba(95,156,44,0.8) 100%)",
          borderTopLeftRadius: "50% 14%",
          borderTopRightRadius: "50% 14%",
        }}
        aria-hidden
      />

      {herde.map((schaf, i) => {
        const nummer = gezaehlt.indexOf(schaf.id) + 1;
        const gezaehltJa = nummer > 0;
        const gestreicheltJa = gestreichelt.includes(schaf.id);
        const aktiv = phase === "zaehlen" ? !gezaehltJa : !gestreicheltJa;

        return (
          /*
           * Position außen, Animation innen.
           *
           * Beides am selben Element ging schief: Motion verwaltet `transform`
           * selbst, sobald etwas animiert wird, und überschrieb das
           * `translate(-50%, -50%)`. Die ganze Herde saß dadurch um ihre halbe
           * Größe nach rechts unten verschoben — das zehnte Schaf ragte
           * dadurch aus dem Bild, obwohl seine Zahl im Code passte.
           */
          <div
            key={schaf.id}
            className="huelle z-20"
            style={{
              left: `${schaf.x}%`,
              top: `${schaf.y}%`,
              width: `${18 * schaf.groesse}cqw`,
            }}
          >
          <motion.button
            type="button"
            aria-label={`Schaf ${i + 1}`}
            disabled={!aktiv}
            className="block w-full"
            style={{
              background: "none",
              border: "none",
              padding: 0,
              touchAction: "none",
            }}
            onPointerDown={() => (phase === "zaehlen" ? zaehlen(schaf.id) : streicheln(schaf.id))}
            onPointerEnter={() => {
              if (phase === "streicheln" && fingerUnten.current) streicheln(schaf.id);
            }}
            whileTap={{ scale: 0.94 }}
            animate={
              aktiv && phase === "streicheln"
                ? { scale: [1, 1.03, 1] }
                : { scale: 1 }
            }
            transition={{ duration: 2, repeat: aktiv && phase === "streicheln" ? Infinity : 0 }}
          >
            <SchafGrafik zufrieden={gestreicheltJa} />

            {/* Zahl beim Zählen */}
            <AnimatePresence>
              {gezaehltJa && phase === "zaehlen" && (
                <motion.span
                  className="absolute grid place-items-center rounded-full font-bold text-white shadow-md"
                  style={{
                    left: "50%",
                    top: "-14%",
                    width: "8cqw",
                    height: "8cqw",
                    transform: "translateX(-50%)",
                    background: "#e8622a",
                    fontSize: "4cqw",
                  }}
                  initial={{ scale: 0, y: "2cqw" }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 16 }}
                >
                  {nummer}
                </motion.span>
              )}
            </AnimatePresence>

            {/* Herzchen beim Streicheln */}
            <AnimatePresence>
              {gestreicheltJa && (
                <motion.span
                  className="pointer-events-none absolute text-[5cqw]"
                  style={{ left: "62%", top: "-6%" }}
                  initial={{ opacity: 0, y: 0, scale: 0.5 }}
                  animate={{ opacity: [0, 1, 1, 0], y: "-9cqw", scale: 1 }}
                  transition={{ duration: 1.6 }}
                >
                  💛
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
          </div>
        );
      })}

      {/* Zähler */}
      <div
        className="pointer-events-none absolute z-30 flex items-center gap-[1.4cqw] rounded-full px-[3cqw] py-[1.2cqw] shadow-md"
        style={{
          left: "50%",
          top: "28%",
          transform: "translate(-50%, -50%)",
          background: "rgba(255,255,255,0.9)",
        }}
      >
        <span className="text-[3.6cqw] leading-none">{phase === "zaehlen" ? "🔢" : "🖐️"}</span>
        <span className="text-[4.2cqw] leading-none font-bold" style={{ color: "#e8622a" }}>
          {phase === "zaehlen" ? gezaehlt.length : gestreichelt.length}
        </span>
        <span className="text-[2.6cqw] font-semibold" style={{ color: "#5f6b5c" }}>
          von {SCHAFE.length}
        </span>
      </div>
    </StationRahmen>
  );
}

function SchafGrafik({ zufrieden }: { zufrieden: boolean }) {
  return (
    <svg viewBox="0 0 120 100" className="w-full drop-shadow-md" aria-hidden>
      {/* Beine */}
      <rect x="34" y="66" width="8" height="24" rx="4" fill="#8a7a6a" />
      <rect x="52" y="68" width="8" height="22" rx="4" fill="#8a7a6a" />
      <rect x="72" y="66" width="8" height="24" rx="4" fill="#8a7a6a" />

      {/* Wollkörper */}
      <g fill="#fdf8ef" stroke="#d8cdbb" strokeWidth="2.5">
        <circle cx="44" cy="52" r="19" />
        <circle cx="64" cy="46" r="21" />
        <circle cx="82" cy="54" r="17" />
        <circle cx="58" cy="64" r="18" />
        <circle cx="76" cy="66" r="15" />
      </g>

      {/* Kopf */}
      <ellipse cx="27" cy="44" rx="15" ry="17" fill="#f0e2d0" stroke="#c9b8a2" strokeWidth="2.5" />
      {/* Ohren */}
      <ellipse cx="13" cy="38" rx="8" ry="5" fill="#e2d2be" stroke="#c9b8a2" strokeWidth="2" transform="rotate(-24 13 38)" />
      <ellipse cx="40" cy="34" rx="7" ry="4.5" fill="#e2d2be" stroke="#c9b8a2" strokeWidth="2" transform="rotate(18 40 34)" />
      {/* Wollschopf */}
      <circle cx="26" cy="30" r="10" fill="#fdf8ef" stroke="#d8cdbb" strokeWidth="2.5" />

      {/* Augen */}
      {zufrieden ? (
        <>
          <path d="M20 44 q4 4 8 0" fill="none" stroke="#5a4a3a" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M31 44 q3.5 4 7 0" fill="none" stroke="#5a4a3a" strokeWidth="2.2" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="24" cy="44" r="3" fill="#4a3a2c" />
          <circle cx="34" cy="43" r="3" fill="#4a3a2c" />
          <circle cx="25" cy="43" r="1" fill="#fff" />
          <circle cx="35" cy="42" r="1" fill="#fff" />
        </>
      )}

      {/* Schnauze */}
      <ellipse cx="28" cy="54" rx="7" ry="5" fill="#e6d4c0" />
      <path
        d={zufrieden ? "M25 54 q3.5 4 7 0" : "M25 55 h6"}
        fill="none"
        stroke="#8a7364"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
