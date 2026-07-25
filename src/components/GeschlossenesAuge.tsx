"use client";

import { useId } from "react";
import { motion } from "motion/react";

/**
 * Ein geschlossenes Auge, das über ein gemaltes offenes gelegt wird.
 *
 * Im Buch schlafen Tim und Teddy, sind aber mit offenen Augen gezeichnet — sie
 * sollen ja gleich wach werden. Beim Wecken sähe das komisch aus: Man tippt
 * jemanden wach, der einen schon ansieht. Also liegt bis zum Antippen ein Lid
 * darüber, das beim Wecken aufgeht.
 *
 * Das Lid ist keine Grafik aus dem Buch, sondern nachgezeichnet: eine Fläche in
 * der Haut- beziehungsweise Fellfarbe der Umgebung, weich am Rand, darüber der
 * Lidstrich. Die Farben sind aus der Illustration abgegriffen, der weiche Rand
 * lässt den Flicken im gemalten Bild verschwinden.
 */
export function GeschlossenesAuge({
  x,
  y,
  breite,
  hoehe,
  oben,
  unten,
  wimper,
  neigung = 0,
  offen,
  verzoegerung = 0,
  helligkeit = 1,
}: {
  /** Mitte des Auges in Prozent der Bühne. */
  x: number;
  y: number;
  /** Maße des Lids in cqw. */
  breite: number;
  hoehe: number;
  /** Haut- oder Fellfarbe oberhalb des Auges … */
  oben: string;
  /** … und unterhalb. Dazwischen wird verlaufen, wie ein Lid gewölbt ist. */
  unten: string;
  /** Farbe des Lidstrichs. */
  wimper: string;
  /** Drehung in Grad, wenn der Kopf schief liegt. */
  neigung?: number;
  offen: boolean;
  verzoegerung?: number;
  /**
   * Dieselbe Abdunklung, die auf der Illustration liegt.
   *
   * Der Nachtschleier liegt über allem, die Aufhellung des Zimmers aber nur
   * auf dem Bild. Ohne diesen Wert leuchteten die Lider im dunklen Zimmer, als
   * wären sie aus einer anderen Szene.
   */
  helligkeit?: number;
}) {
  // Jedes Lid braucht seinen eigenen Verlauf — vier gleiche IDs im Dokument
  // ließen alle vier denselben verwenden.
  const verlaufId = useId();

  return (
    <div
      // Unter dem Nachtschleier der Station, nicht darüber: Ein Lid, das über
      // dem Schleier läge, leuchtete im dunklen Zimmer wie ein Fleck.
      className="huelle pointer-events-none z-[5]"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${breite}cqw`,
        height: `${hoehe}cqw`,
        filter: `brightness(${helligkeit})`,
        transition: "filter 0.9s ease",
      }}
      aria-hidden
    >
      <motion.div
        className="size-full"
        initial={false}
        animate={{ opacity: offen ? 0 : 1, scaleY: offen ? 0.2 : 1 }}
        transition={{ duration: 0.45, delay: verzoegerung, ease: "easeOut" }}
        style={{ rotate: neigung }}
      >
        <svg viewBox="0 0 100 70" className="size-full overflow-visible">
          <defs>
            <linearGradient id={`lid-${verlaufId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={oben} />
              <stop offset="100%" stopColor={unten} />
            </linearGradient>
          </defs>
          {/* Die Fläche deckt das gemalte Auge zu — mit weichem Rand, damit sie
              im gemalten Bild nicht als Flicken auffällt. */}
          <ellipse
            cx="50"
            cy="34"
            rx="50"
            ry="34"
            fill={`url(#lid-${verlaufId})`}
            style={{ filter: "blur(3px)" }}
          />
          {/* Der Lidstrich: eine flache Kurve, an den Enden dünner. */}
          <path
            d="M10 28 Q50 54 90 28"
            fill="none"
            stroke={wimper}
            strokeWidth="6"
            strokeLinecap="round"
            opacity="0.85"
          />
        </svg>
      </motion.div>
    </div>
  );
}
