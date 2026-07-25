"use client";

import { AnimatePresence, motion } from "motion/react";
import { LINES, type LineId } from "@/lib/lines";
import * as voice from "@/lib/voice";

/**
 * Der Hinweistext oben auf der Bühne — im Stil der blauen Textseiten des Buchs.
 * Der Lautsprecher wiederholt den Satz, so oft das Kind mag.
 */
export function Sprechblase({
  id,
  dunkel = false,
}: {
  id: LineId | null;
  /** Für die Abendstationen: heller Text auf dunklem Grund. */
  dunkel?: boolean;
}) {
  const text = id ? LINES[id] : null;

  // Der seitliche Rand hält den Zurück- und den Tonknopf frei.
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex justify-center px-[11cqw] py-[2cqw]">
      <AnimatePresence mode="wait">
        {text && (
          <motion.div
            key={id}
            initial={{ y: "-120%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-120%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="pointer-events-auto flex max-w-[78cqw] items-center gap-[1.6cqw] rounded-full px-[3cqw] py-[1.6cqw] shadow-lg"
            style={{
              background: dunkel ? "rgba(27, 37, 69, 0.88)" : "rgba(169, 212, 229, 0.94)",
              backdropFilter: "blur(6px)",
            }}
          >
            <button
              type="button"
              onClick={() => id && voice.speak(id)}
              aria-label="Nochmal vorlesen"
              className="grid size-[8cqw] shrink-0 place-items-center rounded-full transition active:scale-90"
              style={{ background: dunkel ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.7)" }}
            >
              <svg viewBox="0 0 24 24" className="size-[4.4cqw]" aria-hidden>
                <path
                  d="M4 9.5h3.2L12 5.6v12.8L7.2 14.5H4z"
                  fill={dunkel ? "#fdf6ec" : "#5f6b5c"}
                />
                <path
                  d="M15.4 8.6a4.6 4.6 0 0 1 0 6.8M17.9 6a8 8 0 0 1 0 12"
                  fill="none"
                  stroke={dunkel ? "#fdf6ec" : "#5f6b5c"}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <p
              className="text-[3.1cqw] leading-tight font-medium"
              style={{ color: dunkel ? "#fdf6ec" : "#4a5748" }}
            >
              {text}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
