"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import * as voice from "@/lib/voice";
import * as sfx from "@/lib/sfx";
import { NAMEN, SCHENKER } from "@/lib/kinder";

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
  /** Läuft gerade die Begrüßung? */
  const [laeuft, setLaeuft] = useState(false);
  const abgebrochen = useRef(false);
  useEffect(
    () => () => {
      abgebrochen.current = true;
    },
    [],
  );

  /*
   * Die Begrüßung gehört auf die Startseite, nicht auf die Namensauswahl.
   *
   * Vorher wurde beim Tippen sofort weitergeschaltet, und „Tims toller Tag —
   * für Luise, Maya und Marla — Hallo! Ich bin Tim" lief über einem Bild, das
   * schon nach dem Namen fragte. Jetzt bleibt das Titelbild stehen, solange
   * gesprochen wird, und geht danach von selbst weiter.
   *
   * Losgetreten wird es weiterhin vom Tippen: Ohne Nutzergeste lässt kein
   * Browser Ton zu — ganz von allein kann die Begrüßung nicht anfangen. Wer
   * nicht zuhören mag, tippt ein zweites Mal und ist sofort weiter.
   */
  const starten = () => {
    if (laeuft) {
      voice.stopSpeaking(true);
      onSpielen();
      return;
    }
    // Muss aus der Nutzergeste heraus passieren, sonst bleibt iOS stumm.
    voice.unlockAudio();
    sfx.unlockSfx();
    sfx.chime(4);
    setLaeuft(true);
    void (async () => {
      await voice.speak("titel");
      // Die Widmung bleibt still, bis eine Aufnahme dafür vorliegt.
      await voice.speakWennAufgenommen("widmung");
      await voice.speak("willkommen");
      if (!abgebrochen.current) onSpielen();
    })();
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

        {/*
          Tim steht mitten im Bild und winkt — was vor ihm liegt, verdeckt ihn.
          Deshalb nur drei Dinge übereinander: Titel oben, Knopf in der Mitte,
          die Widmung als eine einzige Zeile unten. Der Erwachsenenknopf sitzt
          in der Ecke, wo ihn ein Kind nicht versehentlich trifft.
        */}
        <div className="absolute inset-0 flex flex-col items-center py-[4cqw]">
          <motion.h1
            initial={{ y: "-2cqw", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="textschatten text-[8.5cqw] leading-none font-bold tracking-wide"
            style={{ color: "#54604f" }}
          >
            Tims toller Tag
          </motion.h1>

          <div className="flex-[1.5]" />

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
            {laeuft ? (
              <motion.svg
                viewBox="0 0 24 24"
                className="size-[6cqw]"
                animate={{ scale: [1, 1.16, 1] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                aria-hidden
              >
                <path
                  d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4zM16 8.6a5 5 0 010 6.8M18.6 6a8.5 8.5 0 010 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </motion.svg>
            ) : (
              <svg viewBox="0 0 24 24" className="size-[6cqw]" aria-hidden>
                <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
              </svg>
            )}
            {laeuft ? "Weiter" : weiterspielen ? "Weiterspielen" : "Spielen"}
          </motion.button>

          {/* Direkt unter dem Knopf, nicht ganz unten — dort sitzt der
              Erwachsenenknopf, und beide nebeneinander überschnitten sich. */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-[2.6cqw] rounded-full px-[3.6cqw] py-[1cqw] text-[2.9cqw] font-semibold whitespace-nowrap"
            style={{ background: "rgba(255,255,255,0.75)", color: "#54604f" }}
          >
            Für {NAMEN} — von {SCHENKER}
          </motion.p>

          <div className="flex-1" />
        </div>

        {/*
          Während der Begrüßung ist die ganze Fläche ein Weiter-Knopf. Ein
          fünfjähriges Kind tippt irgendwohin, nicht zielsicher auf den Knopf.
        */}
        {laeuft && (
          <button
            type="button"
            onClick={starten}
            aria-label="Begrüßung überspringen"
            className="absolute inset-0 z-30 border-none bg-transparent p-0"
          />
        )}

        <button
          type="button"
          onClick={onEltern}
          className="absolute right-[2.4cqw] bottom-[2.4cqw] z-40 rounded-full px-[2.8cqw] py-[1.1cqw] text-[2.3cqw] font-medium shadow-sm"
          style={{ background: "rgba(255,255,255,0.8)", color: "#5f6b5c" }}
        >
          Erläuterungen für Erwachsene
        </button>
      </div>
    </div>
  );
}
