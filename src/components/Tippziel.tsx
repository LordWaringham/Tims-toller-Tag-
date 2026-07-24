"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { motion } from "motion/react";

/**
 * Eine große, verzeihende Tippfläche.
 * Passiert eine Weile nichts, wackelt sie sanft — nie ein Fehler, nur ein Wink.
 *
 * Die Hülle außen hält die Position, der Knopf innen bewegt sich. Beides am
 * selben Element würde sich um `transform` streiten (siehe globals.css).
 */
export function Tippziel({
  x,
  y,
  groesse,
  onTipp,
  children,
  aktiv = true,
  hinweisNach = 5000,
  ringHinweis = true,
  label,
  style,
  className = "",
}: {
  /** Position in Prozent der Bühne. */
  x: number;
  y: number;
  /** Größe in Prozent der Bühnenbreite. */
  groesse: number;
  onTipp: () => void;
  children?: ReactNode;
  aktiv?: boolean;
  /** Nach wie vielen Millisekunden Untätigkeit der Hinweis erscheint. 0 = nie. */
  hinweisNach?: number;
  ringHinweis?: boolean;
  label?: string;
  /** Zusätzliche Angaben für die Hülle, z. B. zIndex. */
  style?: CSSProperties;
  className?: string;
}) {
  const zeigHinweis = useHinweis(aktiv, hinweisNach);

  return (
    <div
      className="huelle"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${groesse}cqw`,
        height: `${groesse}cqw`,
        ...style,
      }}
    >
      <motion.button
        type="button"
        aria-label={label}
        disabled={!aktiv}
        onClick={onTipp}
        whileTap={{ scale: 0.88 }}
        className={`tippflaeche ${className}`}
        animate={
          zeigHinweis
            ? { scale: [1, 1.12, 1], opacity: 1 }
            : { scale: 1, opacity: aktiv ? 1 : 0.55 }
        }
        transition={
          zeigHinweis
            ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.25 }
        }
      >
        {zeigHinweis && ringHinweis && <span className="hinweis-ring" />}
        {children}
      </motion.button>
    </div>
  );
}

/** true, sobald das Kind eine Weile nichts getan hat. */
export function useHinweis(aktiv: boolean, verzoegerung = 5000) {
  const [faellig, setFaellig] = useState(false);

  useEffect(() => {
    if (!aktiv || verzoegerung <= 0) return;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const starten = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setFaellig(true), verzoegerung);
    };
    // Jede Berührung verschiebt den Hinweis wieder nach hinten.
    const zuruecksetzen = () => {
      setFaellig(false);
      starten();
    };

    starten();
    window.addEventListener("pointerdown", zuruecksetzen);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("pointerdown", zuruecksetzen);
    };
  }, [aktiv, verzoegerung]);

  // Abgeleitet statt zurückgesetzt: ein inaktives Ziel winkt nie.
  return faellig && aktiv && verzoegerung > 0;
}
