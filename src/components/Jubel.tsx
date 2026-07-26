"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { LINES, LOB_IDS, type LineId } from "@/lib/lines";
import * as voice from "@/lib/voice";
import * as sfx from "@/lib/sfx";
import { streuIn } from "@/lib/streu";

const KONFETTI_FARBEN = ["#e8622a", "#7fb03c", "#3e6c9e", "#f2c14e", "#d95f8a", "#68c3c0"];

function Konfetti() {
  const stuecke = useMemo(
    () =>
      Array.from({ length: 34 }, (_, i) => ({
        id: i,
        x: streuIn(i, 1, 0, 100),
        verzoegerung: streuIn(i, 2, 0, 0.6),
        dauer: streuIn(i, 3, 2.2, 3.6),
        farbe: KONFETTI_FARBEN[i % KONFETTI_FARBEN.length],
        drehung: streuIn(i, 4, -360, 360),
        breite: streuIn(i, 5, 1, 2.4),
      })),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {stuecke.map((s) => (
        <motion.span
          key={s.id}
          className="absolute rounded-[0.3cqw]"
          style={{
            left: `${s.x}%`,
            top: "-6%",
            width: `${s.breite}cqw`,
            height: `${s.breite * 1.7}cqw`,
            background: s.farbe,
          }}
          initial={{ y: 0, rotate: 0, opacity: 1 }}
          animate={{ y: "120cqh", rotate: s.drehung, opacity: [1, 1, 0.9, 0] }}
          transition={{ duration: s.dauer, delay: s.verzoegerung, ease: "easeIn" }}
        />
      ))}
    </div>
  );
}

/**
 * Der Moment nach einer geschafften Station: Konfetti, ein Sticker
 * und ein großer Weiter-Knopf. Kein Punktestand, keine Wertung.
 */
/**
 * Sicherheitsnetz für den Weiter-Knopf.
 *
 * Der Knopf wartet auf das Ende der Stimme. Bleibt die einmal hängen — ein
 * Versprechen, das nie erfüllt wird, weil der Browser die Aufnahme anhält —
 * säße das Kind vor einem Bildschirm ohne Ausweg. Nach dieser Zeit kommt der
 * Knopf auf jeden Fall. Drei Sätze dauern zusammen selten mehr als zehn
 * Sekunden.
 */
const NOTAUSGANG_MS = 15000;

export function Jubel({
  sichtbar,
  sticker,
  abschlussSatz,
  stickerSatz,
  onWeiter,
  weiterText = "Weiter",
  dunkel = false,
}: {
  sichtbar: boolean;
  sticker: string;
  /** Der Satz aus dem Buch, der die Station abschließt. */
  abschlussSatz: LineId;
  /** „Dafür bekommst du einen …-Sticker." — je Station ein eigener. */
  stickerSatz: LineId;
  onWeiter: () => void;
  weiterText?: string;
  dunkel?: boolean;
}) {
  // Wechselndes Lob, aber stabil für diesen Jubel.
  const [lob] = useState(
    () => LOB_IDS[Math.floor((Date.now() / 1000) % LOB_IDS.length)],
  );

  /*
   * Der Weiter-Knopf kommt erst, wenn die Stimme fertig ist.
   *
   * Vorher stand er von Anfang an da, und wer ihn drückte, schnitt dem
   * Sprecher mitten im Satz das Wort ab — gerade Kinder tippen auf alles,
   * was groß und orange ist. Jetzt ploppt er auf, wenn zugehört wurde.
   */
  const [stimmeFertig, setStimmeFertig] = useState(false);

  /*
   * Erst das Lob, dann der Satz aus dem Buch, dann der Sticker.
   *
   * Genau so steht es auch auf dem Bild: „Klasse!" groß, darunter „Aufstehen,
   * Teddy — der Tag beginnt." Andersherum hörte man den Abschlusssatz zu einem
   * Bild, das schon längst das Lob zeigte.
   */
  useEffect(() => {
    // Kein Zurücksetzen nötig: Eine Station wird nie wieder unfertig, und wer
    // sie erneut spielt, bekommt einen frisch gebauten Jubel.
    if (!sichtbar) return;
    sfx.fanfare();
    let abgebrochen = false;
    const fertig = () => {
      if (!abgebrochen) setStimmeFertig(true);
    };
    const notausgang = setTimeout(fertig, NOTAUSGANG_MS);
    /*
     * Wird mitten im Jubel stummgeschaltet, endet kein Satz mehr — die
     * angehaltene Aufnahme löst ihr Versprechen nie ein. Dann gibt es auch
     * nichts mehr zu Ende zu hören, und der Knopf darf sofort kommen.
     */
    const abmelden = voice.subscribeMuted(() => {
      if (voice.isMuted()) fertig();
    });
    (async () => {
      await voice.speak(lob);
      if (abgebrochen) return;
      await voice.speak(abschlussSatz);
      if (abgebrochen) return;
      await voice.speakLieber(stickerSatz, "sticker");
      fertig();
    })();
    return () => {
      abgebrochen = true;
      clearTimeout(notausgang);
      abmelden();
    };
  }, [sichtbar, abschlussSatz, stickerSatz, lob]);

  return (
    <AnimatePresence>
      {sichtbar && (
        <motion.div
          className="absolute inset-0 z-50 grid place-items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            background: dunkel ? "rgba(20, 28, 56, 0.72)" : "rgba(253, 246, 236, 0.78)",
            backdropFilter: "blur(4px)",
          }}
        >
          <Konfetti />
          <motion.div
            className="relative flex flex-col items-center gap-[2cqw] px-[6cqw] text-center"
            initial={{ scale: 0.6, y: "4cqw" }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.1 }}
          >
            <motion.div
              className="grid size-[26cqw] place-items-center rounded-full shadow-xl"
              style={{
                background: "radial-gradient(circle at 35% 30%, #fff9ec, #f6d9a8)",
                border: "0.8cqw solid rgba(255,255,255,0.9)",
              }}
              initial={{ rotate: -14, scale: 0.4 }}
              animate={{ rotate: [-14, 8, 0], scale: 1 }}
              transition={{ delay: 0.25, type: "spring", stiffness: 200, damping: 12 }}
            >
              <span className="text-[14cqw] leading-none">{sticker}</span>
            </motion.div>

            <p
              className="text-[4.4cqw] font-semibold"
              style={{ color: dunkel ? "#fdf6ec" : "#4a5748" }}
            >
              {LINES[lob]}
            </p>
            <p
              className="max-w-[70cqw] text-[3cqw] leading-snug"
              style={{ color: dunkel ? "rgba(253,246,236,0.8)" : "#6b7a68" }}
            >
              {LINES[abschlussSatz]}
            </p>

            {/*
              Der Platz ist von Anfang an reserviert: Sonst rutschte das ganze
              Bild nach oben, sobald der Knopf erscheint.
            */}
            <div className="mt-[1cqw] grid h-[11cqw] place-items-center">
              <AnimatePresence>
                {stimmeFertig && (
                  <motion.button
                    type="button"
                    onClick={onWeiter}
                    whileTap={{ scale: 0.94 }}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 16 }}
                    className="rounded-full px-[7cqw] py-[2.4cqw] text-[4cqw] font-semibold text-white shadow-lg"
                    style={{ background: "linear-gradient(180deg, #f0813c, #de5a22)" }}
                  >
                    {weiterText}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
