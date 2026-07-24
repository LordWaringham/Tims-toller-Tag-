"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";

/**
 * Bittet darum, das Gerät quer zu halten.
 *
 * Die Bühne behält immer ihr Seitenverhältnis von 4:3. Auf einem hochkant
 * gehaltenen Handy bleibt davon nur ein schmales Band in der Mitte übrig —
 * alles wird winzig, und genau das trifft Kinderfinger am härtesten.
 *
 * Der Hinweis verschwindet von selbst, sobald gedreht wird. Wer trotzdem
 * hochkant spielen möchte, kann ihn wegtippen; die Entscheidung hält für
 * diese Sitzung.
 */
export function Querformat() {
  const [zuSchmal, setZuSchmal] = useState(false);
  const [ignoriert, setIgnoriert] = useState(false);

  useEffect(() => {
    const pruefen = () => {
      const breite = window.innerWidth;
      const hoehe = window.innerHeight;
      // Anteil der Fensterhöhe, den die Bühne tatsächlich einnimmt.
      const anteil = (Math.min(breite, (hoehe * 4) / 3) * 0.75) / hoehe;
      setZuSchmal(anteil < 0.6);
    };
    pruefen();
    window.addEventListener("resize", pruefen);
    window.addEventListener("orientationchange", pruefen);
    return () => {
      window.removeEventListener("resize", pruefen);
      window.removeEventListener("orientationchange", pruefen);
    };
  }, []);

  if (!zuSchmal || ignoriert) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 px-8 text-center"
      style={{ background: "#fdf6ec" }}
    >
      <motion.svg
        viewBox="0 0 120 120"
        className="w-40"
        animate={{ rotate: [0, 0, -90, -90, 0] }}
        transition={{ duration: 3.4, repeat: Infinity, times: [0, 0.25, 0.5, 0.85, 1] }}
        aria-hidden
      >
        <rect
          x="34"
          y="14"
          width="52"
          height="92"
          rx="10"
          fill="#a9d4e5"
          stroke="#5f6b5c"
          strokeWidth="4"
        />
        <rect x="42" y="26" width="36" height="64" rx="3" fill="#fdf6ec" />
        <circle cx="60" cy="98" r="4" fill="#5f6b5c" />
      </motion.svg>

      <div>
        <p className="text-2xl font-bold" style={{ color: "#54604f" }}>
          Dreh das Gerät zur Seite
        </p>
        <p className="mt-2 text-base" style={{ color: "#8b978a" }}>
          Quer ist alles schön groß — so trifft man viel leichter.
        </p>
      </div>

      <button
        type="button"
        onClick={() => setIgnoriert(true)}
        className="rounded-full bg-black/5 px-5 py-2 text-sm font-medium"
        style={{ color: "#8b978a" }}
      >
        Trotzdem hochkant spielen
      </button>
    </div>
  );
}
