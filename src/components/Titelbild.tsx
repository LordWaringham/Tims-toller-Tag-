"use client";

import { motion } from "motion/react";
import * as voice from "@/lib/voice";
import * as sfx from "@/lib/sfx";
import { KINDER, SCHENKER } from "@/lib/kinder";

/** Startbildschirm mit dem Buchcover. */
export function Titelbild({
  onSpielen,
  onEltern,
  weiterspielen,
}: {
  onSpielen: () => void;
  onEltern: () => void;
  /** true, wenn schon ein Tag begonnen wurde. */
  weiterspielen: boolean;
}) {
  const starten = () => {
    // Muss aus der Nutzergeste heraus passieren, sonst bleibt iOS stumm.
    voice.unlockAudio();
    sfx.unlockSfx();
    sfx.chime(4);
    // Die Widmung dazwischen bleibt still, bis eine Aufnahme dafür vorliegt.
    void (async () => {
      await voice.speak("titel");
      await voice.speakWennAufgenommen("widmung");
      await voice.speak("willkommen");
    })();
    onSpielen();
  };

  return (
    <div className="grid min-h-dvh w-full place-items-center bg-nacht">
      <div className="buehne">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url(/scenes/cover.webp)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(253,246,236,0.55) 0%, rgba(253,246,236,0) 38%, rgba(253,246,236,0.1) 70%, rgba(90,140,40,0.35) 100%)",
          }}
          aria-hidden
        />

        {/* Der Spielen-Knopf sitzt bewusst unter Tims Gesicht, nicht darauf. */}
        <div className="absolute inset-0 flex flex-col items-center py-[5cqw]">
          <motion.h1
            initial={{ y: "-2cqw", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="textschatten text-[8.5cqw] leading-none font-bold tracking-wide"
            style={{ color: "#54604f" }}
          >
            Tims toller Tag
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-[1.2cqw] rounded-full px-[3.4cqw] py-[0.9cqw] text-[3cqw] font-semibold"
            style={{ background: "rgba(255,255,255,0.72)", color: "#54604f" }}
          >
            Für {KINDER.map((k) => k.name).join(", ").replace(/, ([^,]*)$/, " und $1")}
          </motion.p>

          <div className="flex-[1.35]" />

          <motion.button
            type="button"
            onClick={starten}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.25, type: "spring", stiffness: 200, damping: 16 }}
            whileTap={{ scale: 0.94 }}
            className="schwebt flex items-center gap-[2.4cqw] rounded-full px-[8cqw] py-[3cqw] text-[5.6cqw] font-semibold text-white shadow-2xl"
            style={{ background: "linear-gradient(180deg, #f0813c, #d9541c)" }}
          >
            <svg viewBox="0 0 24 24" className="size-[6cqw]" aria-hidden>
              <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
            </svg>
            {weiterspielen ? "Weiterspielen" : "Spielen"}
          </motion.button>

          <div className="flex-[0.5]" />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="mb-[1.6cqw] rounded-full px-[3cqw] py-[0.8cqw] text-[2.8cqw] font-semibold"
            style={{ background: "rgba(255,255,255,0.72)", color: "#54604f" }}
          >
            von {SCHENKER}
          </motion.p>

          <button
            type="button"
            onClick={onEltern}
            className="rounded-full px-[3.5cqw] py-[1.4cqw] text-[2.6cqw] font-medium shadow-sm"
            style={{ background: "rgba(255,255,255,0.8)", color: "#5f6b5c" }}
          >
            Erläuterungen für Erwachsene
          </button>
        </div>
      </div>
    </div>
  );
}
