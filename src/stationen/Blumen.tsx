"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { StationRahmen, type StationProps } from "@/components/StationRahmen";
import { STATIONS } from "@/lib/stations";
import type { LineId } from "@/lib/lines";
import * as sfx from "@/lib/sfx";
import * as voice from "@/lib/voice";

const STATION = STATIONS[5];

interface Blume {
  id: string;
  x: number;
  farbe: string;
  mitte: string;
}

const BLUMEN: Blume[] = [
  { id: "b1", x: 15, farbe: "#e8622a", mitte: "#ffd166" },
  { id: "b2", x: 32, farbe: "#d9483a", mitte: "#ffe6a0" },
  { id: "b3", x: 50, farbe: "#e88fb0", mitte: "#fff0c4" },
  { id: "b4", x: 68, farbe: "#f2b93c", mitte: "#e8622a" },
  { id: "b5", x: 85, farbe: "#c47ad9", mitte: "#ffe6a0" },
];

const BLUMEN_Y = 70; // Prozent der Bühnenhöhe
const PRO_TICK = 8; // wie schnell sich eine Blume füllt

/**
 * Gießen heißt hier: die Kanne über eine Blume halten und warten.
 * Bewusst kein schnelles Tippspiel — es geht um Geduld und darum, zu sehen,
 * dass etwas Zeit braucht.
 */
export function Blumen({ onGeschafft, onWeiter, onZurueck }: StationProps) {
  const [wasser, setWasser] = useState<Record<string, number>>(
    Object.fromEntries(BLUMEN.map((b) => [b.id, 0])),
  );
  const [giesst, setGiesst] = useState(false);
  const [zielBlume, setZielBlume] = useState<string | null>(null);
  const [fertig, setFertig] = useState(false);

  const kanneRef = useRef<HTMLDivElement>(null);
  const bluehendRef = useRef(new Set<string>());
  const tickRef = useRef(0);

  const bluehend = BLUMEN.filter((b) => (wasser[b.id] ?? 0) >= 100).length;
  const satz: LineId = bluehend === 0 ? "s06-intro" : "s06-blueht";
  /** Es wird nur gegossen, wenn die Kanne auch über einer Blume hängt. */
  const angepeilt = giesst && zielBlume !== null;

  // Solange gegossen wird, füllt sich die Blume unter der Kanne.
  useEffect(() => {
    if (!giesst) return;
    const id = setInterval(() => {
      const treffer = blumeUnterKanne(kanneRef.current);
      setZielBlume(treffer);
      if (!treffer) return;

      tickRef.current += 1;
      if (tickRef.current % 2 === 0) sfx.water();

      setWasser((alt) => {
        const jetzt = alt[treffer] ?? 0;
        if (jetzt >= 100) return alt;
        const neu = Math.min(100, jetzt + PRO_TICK);
        if (neu >= 100 && !bluehendRef.current.has(treffer)) {
          bluehendRef.current.add(treffer);
          sfx.sparkle();
          sfx.chime(bluehendRef.current.size + 2);
          if (bluehendRef.current.size >= BLUMEN.length) {
            onGeschafft();
            setTimeout(() => setFertig(true), 1100);
          } else if (bluehendRef.current.size === 1) {
            void voice.speak("s06-blueht");
          }
        }
        return { ...alt, [treffer]: neu };
      });
    }, 110);
    return () => clearInterval(id);
  }, [giesst, onGeschafft]);

  return (
    <StationRahmen
      station={STATION}
      satz={satz}
      fertig={fertig}
      onWeiter={onWeiter}
      onZurueck={onZurueck}
      abschlussSatz="s06-fertig"
      unschaerfe={1.0}
      schleier={0.42}
    >
      {/* Erde */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[18%]"
        style={{
          background: "linear-gradient(180deg, #a8825c 0%, #7d5f3f 100%)",
          borderTopLeftRadius: "50% 22%",
          borderTopRightRadius: "50% 22%",
        }}
        aria-hidden
      />

      {/* ------------------------------------------------------- Die Blumen */}
      {BLUMEN.map((blume) => (
        <BlumeGrafik
          key={blume.id}
          blume={blume}
          anteil={wasser[blume.id] ?? 0}
          angepeilt={giesst && zielBlume === blume.id}
        />
      ))}

      {/* ------------------------------------------------------- Die Kanne */}
      <motion.div
        ref={kanneRef}
        drag
        dragMomentum={false}
        dragElastic={0.05}
        onDragStart={() => {
          setGiesst(true);
          sfx.pop();
        }}
        onDragEnd={() => setGiesst(false)}
        onPointerDown={() => setGiesst(true)}
        onPointerUp={() => setGiesst(false)}
        whileDrag={{ rotate: -32, scale: 1.05 }}
        animate={{ rotate: angepeilt ? -32 : -6 }}
        className="absolute z-40"
        style={{
          left: "50%",
          top: "26%",
          width: "24cqw",
          // `translate` statt `transform`: Motion braucht `transform` fürs
          // Ziehen und Kippen und würde die Zentrierung überschreiben.
          translate: "-50% -50%",
          touchAction: "none",
          cursor: "grab",
        }}
      >
        <Giesskanne />
        {/* Wasserstrahl */}
        <AnimatePresence>
          {angepeilt && (
            <motion.div
              className="pointer-events-none absolute"
              style={{ left: "6%", top: "58%", width: "5cqw" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              aria-hidden
            >
              {Array.from({ length: 5 }, (_, i) => (
                <motion.span
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: "1.3cqw",
                    height: "2.2cqw",
                    background: "rgba(120,190,235,0.9)",
                    left: `${i * 1.2}cqw`,
                  }}
                  animate={{ y: ["0cqw", "16cqw"], opacity: [1, 0] }}
                  transition={{ duration: 0.55, repeat: Infinity, delay: i * 0.09 }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Fortschritt */}
      <div
        className="pointer-events-none absolute z-30 flex items-center gap-[1.2cqw] rounded-full px-[2.6cqw] py-[1.2cqw] shadow-md"
        style={{
          left: "13%",
          bottom: "4%",
          transform: "translateX(-50%)",
          background: "rgba(255,255,255,0.88)",
        }}
      >
        <span className="text-[3.4cqw] leading-none">🌼</span>
        <span className="text-[3cqw] font-bold" style={{ color: "#e8622a" }}>
          {bluehend} von {BLUMEN.length}
        </span>
      </div>
    </StationRahmen>
  );
}

/**
 * Welche Blume liegt unter der Kanne?
 *
 * Bewusst großzügig: Es zählt die Mitte der Kanne, nicht die Tülle. Die Tülle
 * wandert beim Kippen und Vergrößern der Kanne mit, und ein Kind, das die
 * Kanne sichtbar über eine Blume hält, soll auch gießen — ohne Millimeterarbeit.
 */
function blumeUnterKanne(kanne: HTMLElement | null): string | null {
  if (!kanne) return null;
  const buehne = kanne.closest(".buehne") as HTMLElement | null;
  if (!buehne) return null;

  const k = kanne.getBoundingClientRect();
  const b = buehne.getBoundingClientRect();
  const mitteX = ((k.left + k.width / 2 - b.left) / b.width) * 100;
  const mitteY = ((k.top + k.height / 2 - b.top) / b.height) * 100;

  // Die Kanne muss ungefähr auf Blumenhöhe sein — nicht ganz oben, nicht im Boden.
  if (mitteY < 18 || mitteY > BLUMEN_Y + 14) return null;

  let beste: string | null = null;
  let besteDistanz = Infinity;
  for (const blume of BLUMEN) {
    const dx = Math.abs(mitteX - blume.x);
    if (dx > 13) continue;
    if (dx < besteDistanz) {
      besteDistanz = dx;
      beste = blume.id;
    }
  }
  return beste;
}

function BlumeGrafik({
  blume,
  anteil,
  angepeilt,
}: {
  blume: Blume;
  anteil: number;
  angepeilt: boolean;
}) {
  const t = anteil / 100;
  /*
   * So sieht eine durstige Blume aus.
   *
   * Vorher stand sie kerzengerade in voller Blüte und war nur etwas blass —
   * und das Kind sollte sie gießen, damit sie aufblüht. Jetzt lässt sie den
   * Kopf hängen: Die Blüte kippt über den Stängelansatz nach unten, die
   * Blätter hängen mit, und alles ist kleiner und blasser. Mit dem Wasser
   * richtet sie sich auf.
   */
  const neigung = -7 * (1 - t); // der ganze Stängel neigt sich leicht
  /*
   * Die Blüte hängt herunter — sie wird verschoben, nicht gedreht.
   *
   * Eine Drehung bringt hier nichts: Die Blüte hat acht Blütenblätter im
   * 45-Grad-Abstand und sieht gedreht genauso aus wie vorher. Sichtbar wird
   * das Hängen erst, wenn der Kopf neben und unter den Stängelansatz rutscht
   * und der Stängel sich dorthin biegt.
   */
  const kopfX = -15 * (1 - t);
  const kopfY = 30 * (1 - t);
  const blattNeigung = 22 * (1 - t);
  const groesse = 0.52 + 0.48 * t;
  const farbkraft = 0.25 + 0.75 * t;
  const blueht = anteil >= 100;

  return (
    <div
      className="pointer-events-none absolute z-20"
      style={{
        left: `${blume.x}%`,
        top: `${BLUMEN_Y}%`,
        width: "17cqw",
        transform: "translate(-50%, -100%)",
        transformOrigin: "bottom center",
      }}
    >
      {/* Wasserstand am Topf */}
      <div
        className="absolute inset-x-[28%] bottom-[-3cqw] h-[1.2cqw] overflow-hidden rounded-full"
        style={{ background: "rgba(255,255,255,0.55)" }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: "#5aa8d8" }}
          animate={{ width: `${anteil}%` }}
          transition={{ duration: 0.15 }}
        />
      </div>

      {/*
        Wichtig: filter gehört in `animate`, nicht in `style`. Motion übernimmt
        animierbare CSS-Eigenschaften beim ersten Rendern und ignoriert spätere
        Änderungen über `style` — die Blüten blieben sonst für immer blass.
      */}
      <motion.svg
        viewBox="0 0 100 150"
        className="w-full"
        animate={{ rotate: neigung, filter: `saturate(${farbkraft})` }}
        transition={{ type: "spring", stiffness: 90, damping: 14 }}
        style={{ transformOrigin: "50% 100%" }}
        aria-hidden
      >
        {/* Stängel — biegt sich zur hängenden Blüte hin */}
        <motion.path
          fill="none"
          stroke="#5a8c28"
          strokeWidth="6"
          strokeLinecap="round"
          animate={{ d: blueht || t > 0.99 ? "M50 150 q-4 -40 0 -70" : gebogen(t) }}
          transition={{ type: "spring", stiffness: 90, damping: 15 }}
        />
        {/* Blätter — hängen mit, solange die Blume Durst hat */}
        <motion.path
          d="M50 120 q-22 -12 -26 4 q18 10 26 -4z"
          fill="#6ba32f"
          animate={{ rotate: blattNeigung }}
          transition={{ type: "spring", stiffness: 110, damping: 14 }}
          style={{ transformOrigin: "50px 120px" }}
        />
        <motion.path
          d="M50 100 q22 -12 26 4 q-18 10 -26 -4z"
          fill="#6ba32f"
          animate={{ rotate: -blattNeigung }}
          transition={{ type: "spring", stiffness: 110, damping: 14 }}
          style={{ transformOrigin: "50px 100px" }}
        />

        {/* Blüte — kippt über den Stängelansatz, wenn sie durstig ist */}
        <motion.g
          animate={{ scale: groesse, x: kopfX, y: kopfY }}
          transition={{ type: "spring", stiffness: 130, damping: 15 }}
          style={{ transformOrigin: "50px 80px" }}
        >
          {Array.from({ length: 8 }, (_, i) => (
            <ellipse
              key={i}
              cx="50"
              cy="36"
              rx="10"
              ry="19"
              fill={blume.farbe}
              transform={`rotate(${i * 45} 50 62)`}
            />
          ))}
          <circle cx="50" cy="62" r="12" fill={blume.mitte} />
          <circle cx="50" cy="62" r="12" fill="rgba(0,0,0,0.06)" />
        </motion.g>
      </motion.svg>

      {/* Funkeln beim Aufblühen */}
      <AnimatePresence>
        {blueht && (
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 1, scale: 0.6 }}
            animate={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 1 }}
            style={{
              background:
                "radial-gradient(circle at 50% 35%, rgba(255,240,180,0.9), transparent 62%)",
            }}
          />
        )}
      </AnimatePresence>

      {angepeilt && !blueht && (
        <div
          className="absolute inset-x-[10%] top-[10%] bottom-0 rounded-full"
          style={{ background: "rgba(120,190,235,0.16)" }}
        />
      )}
    </div>
  );
}

function Giesskanne() {
  return (
    <svg viewBox="0 0 120 100" className="w-full drop-shadow-lg" aria-hidden>
      {/* Tülle */}
      <path
        d="M34 52 L6 74 l8 10 l28 -18z"
        fill="#7fa85c"
        stroke="#5a7d3c"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Körper */}
      <path
        d="M34 34 h56 q10 0 10 12 v34 q0 12 -12 12 h-42 q-12 0 -12 -12z"
        fill="#8fb864"
        stroke="#5a7d3c"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Griff */}
      <path
        d="M56 34 q6 -22 26 -22 q20 0 20 22"
        fill="none"
        stroke="#5a7d3c"
        strokeWidth="7"
        strokeLinecap="round"
      />
      {/* Öffnung */}
      <ellipse cx="62" cy="34" rx="28" ry="6" fill="#6d9149" />
      <path
        d="M44 48 h40"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Der Stängel einer durstigen Blume.
 *
 * Er endet dort, wo die Blüte hängt: bei t=0 weit links unterhalb des
 * Ansatzes, bei t=1 gerade oben. Beide Formen haben denselben Aufbau, damit
 * Motion sauber zwischen ihnen überblenden kann.
 */
function gebogen(t: number): string {
  const endX = -15 * (1 - t);
  const endY = -70 + 30 * (1 - t);
  const griff = -4 - 8 * (1 - t);
  return `M50 150 q${griff.toFixed(1)} ${(endY * 0.62).toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}`;
}
