"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { StationRahmen, type StationProps } from "@/components/StationRahmen";
import { Ablage, Ziehbar } from "@/components/dnd";
import { Tippziel } from "@/components/Tippziel";
import { STATIONS } from "@/lib/stations";
import { zahl, type LineId } from "@/lib/lines";
import * as sfx from "@/lib/sfx";
import * as voice from "@/lib/voice";

const STATION = STATIONS[6];

type Phase = "zutaten" | "ruehren" | "ausstechen";
type Form = "stern" | "herz" | "kreis";

const ZUTATEN: { id: string; name: string; farbe: string; x: number; y: number }[] = [
  { id: "mehl", name: "Mehl", farbe: "#f2e6cf", x: 14, y: 32 },
  { id: "ei", name: "Ei", farbe: "#fff6e0", x: 14, y: 56 },
  { id: "zucker", name: "Zucker", farbe: "#ffffff", x: 14, y: 80 },
];

const FORMEN: { form: Form; y: number }[] = [
  { form: "stern", y: 30 },
  { form: "herz", y: 55 },
  { form: "kreis", y: 80 },
];

const RUEHR_ZIEL = Math.PI * 2 * 3; // drei volle Umdrehungen
const KEKS_ZIEL = 5;

interface Keks {
  key: number;
  form: Form;
}

/**
 * Backen in drei Schritten — Zutaten, Rühren, Ausstechen.
 * Die einzige Station mit einer echten Reihenfolge: erst dies, dann das.
 */
export function Kekse({ onGeschafft, onWeiter, onZurueck }: StationProps) {
  const [phase, setPhase] = useState<Phase>("zutaten");
  const [drin, setDrin] = useState<string[]>([]);
  const [drehung, setDrehung] = useState(0);
  const [ruehrt, setRuehrt] = useState(false);
  const [winkel, setWinkel] = useState(0);
  const [kekse, setKekse] = useState<Keks[]>([]);
  const [fertig, setFertig] = useState(false);

  const letzterWinkel = useRef<number | null>(null);
  const naechsterKey = useRef(0);
  const schuesselRef = useRef<HTMLDivElement>(null);

  const satz: LineId =
    phase === "zutaten"
      ? drin.length === 0
        ? "s07-intro"
        : "s07-zutaten"
      : phase === "ruehren"
        ? "s07-ruehren"
        : "s07-ausstechen";

  // ------------------------------------------------------------- Zutaten
  const zutatRein = (id: string) => {
    if (drin.includes(id)) return;
    sfx.pop();
    const neu = [...drin, id];
    setDrin(neu);
    if (neu.length >= ZUTATEN.length) {
      setTimeout(() => setPhase("ruehren"), 700);
    }
  };

  // -------------------------------------------------------------- Rühren
  const winkelZurSchuessel = (e: React.PointerEvent) => {
    const el = schuesselRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return Math.atan2(
      e.clientY - (r.top + r.height / 2),
      e.clientX - (r.left + r.width / 2),
    );
  };

  const ruehrBewegung = (e: React.PointerEvent) => {
    if (!ruehrt || phase !== "ruehren") return;
    const jetzt = winkelZurSchuessel(e);
    if (jetzt === null) return;
    setWinkel(jetzt);

    if (letzterWinkel.current !== null) {
      let delta = jetzt - letzterWinkel.current;
      // Sprung über den Nullpunkt abfangen
      if (delta > Math.PI) delta -= Math.PI * 2;
      if (delta < -Math.PI) delta += Math.PI * 2;
      // In beide Richtungen rühren ist erlaubt.
      setDrehung((alt) => {
        const neu = alt + Math.abs(delta);
        const vorher = Math.floor(alt / (Math.PI * 2));
        const nachher = Math.floor(neu / (Math.PI * 2));
        if (nachher > vorher) sfx.chime(nachher + 2);
        if (neu >= RUEHR_ZIEL && alt < RUEHR_ZIEL) {
          setTimeout(() => setPhase("ausstechen"), 600);
        }
        return neu;
      });
    }
    letzterWinkel.current = jetzt;
  };

  // ---------------------------------------------------------- Ausstechen
  const ausstechen = (form: Form, zone: string | null) => {
    if (zone !== "teig") return false;
    const neu = [...kekse, { key: naechsterKey.current++, form }];
    setKekse(neu);
    sfx.place();
    const zahlSatz = zahl(neu.length);
    if (zahlSatz) void voice.speak(zahlSatz);

    if (neu.length >= KEKS_ZIEL) {
      onGeschafft();
      setTimeout(() => setFertig(true), 1100);
    }
    return true;
  };

  const ruehrAnteil = Math.min(1, drehung / RUEHR_ZIEL);
  const teigFarbe = phase === "zutaten" ? "#f6efe0" : mischFarbe(ruehrAnteil);

  return (
    <StationRahmen
      station={STATION}
      satz={satz}
      fertig={fertig}
      onWeiter={onWeiter}
      onZurueck={onZurueck}
      abschlussSatz="s07-fertig"
      unschaerfe={1.2}
      schleier={0.48}
    >
      {/* ----------------------------------------------- Schüssel / Teig */}
      <div
        ref={schuesselRef}
        className="absolute z-10"
        style={{
          left: "52%",
          top: "56%",
          width: "44cqw",
          height: "44cqw",
          transform: "translate(-50%, -50%)",
          touchAction: "none",
        }}
        onPointerDown={(e) => {
          if (phase !== "ruehren") return;
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          setRuehrt(true);
          letzterWinkel.current = winkelZurSchuessel(e);
        }}
        onPointerMove={ruehrBewegung}
        onPointerUp={() => {
          setRuehrt(false);
          letzterWinkel.current = null;
        }}
        onPointerLeave={() => {
          setRuehrt(false);
          letzterWinkel.current = null;
        }}
      >
        {phase === "ausstechen" ? (
          <Ablage
            id="teig"
            toleranzCqw={7}
            style={{ width: "100%", height: "100%", position: "relative" }}
          >
            <TeigFlaeche farbe={teigFarbe} loecher={kekse.length} />
          </Ablage>
        ) : (
          <Schuessel farbe={teigFarbe} fuellstand={drin.length / ZUTATEN.length} />
        )}

        {/* Rührfortschritt */}
        {phase === "ruehren" && (
          <>
            <svg
              viewBox="0 0 100 100"
              className="pointer-events-none absolute inset-[-6%] size-[112%]"
              aria-hidden
            >
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="4"
              />
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="#e8622a"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 46}
                strokeDashoffset={2 * Math.PI * 46 * (1 - ruehrAnteil)}
                transform="rotate(-90 50 50)"
              />
            </svg>
            {/*
              Der Löffel kreist um die Mitte der Schüssel: ein Drehpunkt ohne
              eigene Größe, in dem der Löffel nach außen zeigt. Bei rotate 0
              zeigt er nach unten, deshalb die Verschiebung um 90 Grad.
            */}
            <motion.div
              className="pointer-events-none absolute"
              style={{ left: "50%", top: "50%", width: 0, height: 0 }}
              animate={{ rotate: (winkel * 180) / Math.PI - 90 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
            >
              <div
                style={{
                  position: "absolute",
                  left: "-4.5cqw",
                  top: "-15cqw",
                  width: "9cqw",
                }}
              >
                <Loeffel />
              </div>
            </motion.div>
          </>
        )}
      </div>

      {/* -------------------------------------------------- Phase Zutaten */}
      {phase === "zutaten" &&
        ZUTATEN.map((zutat, i) => (
          <Tippziel
            key={zutat.id}
            x={zutat.x}
            y={zutat.y}
            groesse={16}
            aktiv={!drin.includes(zutat.id)}
            label={zutat.name}
            onTipp={() => zutatRein(zutat.id)}
            hinweisNach={i === 0 ? 4000 : 0}
            style={{ zIndex: 30 }}
          >
            <AnimatePresence>
              {!drin.includes(zutat.id) && (
                <motion.div
                  className="flex w-full flex-col items-center gap-[0.6cqw]"
                  exit={{ scale: 0.3, x: "20cqw", y: "-6cqw", opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Zutat id={zutat.id} farbe={zutat.farbe} />
                  <span
                    className="rounded-full px-[1.6cqw] py-[0.4cqw] text-[2cqw] font-semibold"
                    style={{ background: "rgba(255,255,255,0.85)", color: "#5f6b5c" }}
                  >
                    {zutat.name}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </Tippziel>
        ))}

      {/* ----------------------------------------------- Phase Ausstechen */}
      {phase === "ausstechen" &&
        FORMEN.map(({ form, y }) => (
          <Ziehbar
            key={form}
            id={form}
            onAblegen={(zone) => ausstechen(form, zone)}
            x={11}
            y={y}
            breite={14}
          >
            <FormGrafik form={form} ausstecher />
          </Ziehbar>
        ))}

      {/* ------------------------------------------------------ Backblech */}
      {phase === "ausstechen" && (
        <div
          className="absolute z-20 flex items-center gap-[2cqw] rounded-[2.5cqw] px-[3cqw] py-[1.6cqw]"
          style={{
            left: "50%",
            // Über der Stickerleiste, sonst liegt sie auf dem Blech.
            bottom: "9.5%",
            transform: "translateX(-50%)",
            minWidth: "58cqw",
            background: "rgba(140,128,116,0.55)",
            border: "0.7cqw solid rgba(95,84,74,0.6)",
            boxShadow: "inset 0 0.6cqw 1cqw rgba(0,0,0,0.18)",
          }}
        >
          <span
            className="shrink-0 rounded-full bg-white/85 px-[2cqw] py-[0.6cqw] text-[2.4cqw] font-bold"
            style={{ color: "#e8622a" }}
          >
            {kekse.length} von {KEKS_ZIEL}
          </span>
          <AnimatePresence>
            {kekse.map((keks) => (
              <motion.div
                key={keks.key}
                className="w-[8cqw] shrink-0"
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 16 }}
              >
                <FormGrafik form={keks.form} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </StationRahmen>
  );
}

/** Vom hellen Mehl zum fertigen Teig. */
function mischFarbe(t: number) {
  const von = [246, 239, 224];
  const nach = [214, 168, 106];
  const c = von.map((v, i) => Math.round(v + (nach[i] - v) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

function Schuessel({ farbe, fuellstand }: { farbe: string; fuellstand: number }) {
  return (
    <svg viewBox="0 0 100 100" className="size-full drop-shadow-lg" aria-hidden>
      <defs>
        <clipPath id="schuesselInnen">
          <path d="M12 42 h76 q-6 44 -38 44 q-32 0 -38 -44z" />
        </clipPath>
      </defs>
      <path
        d="M8 40 h84 q-4 50 -42 50 q-38 0 -42 -50z"
        fill="#3f86a8"
        stroke="#2b6480"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <g clipPath="url(#schuesselInnen)">
        <rect
          x="10"
          y={86 - 44 * Math.max(0.12, fuellstand)}
          width="80"
          height="60"
          fill={farbe}
        />
      </g>
      <ellipse cx="50" cy="40" rx="42" ry="9" fill="#59a4c4" />
      <ellipse cx="50" cy="40" rx="36" ry="6.5" fill={farbe} opacity={fuellstand > 0 ? 1 : 0.35} />
      <path
        d="M22 58 q6 14 16 20"
        fill="none"
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TeigFlaeche({ farbe, loecher }: { farbe: string; loecher: number }) {
  return (
    <svg viewBox="0 0 100 100" className="size-full drop-shadow-lg" aria-hidden>
      <path
        d="M50 8 q30 0 38 26 q8 26 -12 44 q-22 18 -46 8 q-24 -10 -26 -34 q-2 -28 22 -38 q12 -6 24 -6z"
        fill={farbe}
        stroke="rgba(150,110,60,0.5)"
        strokeWidth="2.5"
      />
      {/* Ausgestochene Stellen */}
      {Array.from({ length: loecher }, (_, i) => {
        const winkel = (i / 5) * Math.PI * 2 - Math.PI / 2;
        return (
          <circle
            key={i}
            cx={50 + Math.cos(winkel) * 24}
            cy={50 + Math.sin(winkel) * 24}
            r="10"
            fill="rgba(120,90,50,0.22)"
          />
        );
      })}
      {[
        [30, 30],
        [66, 38],
        [42, 66],
        [70, 68],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2" fill="rgba(140,100,50,0.28)" />
      ))}
    </svg>
  );
}

function Loeffel() {
  return (
    <svg viewBox="0 0 40 120" className="w-full drop-shadow-md" aria-hidden>
      <rect x="16" y="6" width="8" height="82" rx="4" fill="#c08c4e" />
      <ellipse cx="20" cy="98" rx="15" ry="19" fill="#d9a469" stroke="#a9743a" strokeWidth="2.5" />
      <ellipse cx="20" cy="96" rx="10" ry="13" fill="#c08c4e" />
    </svg>
  );
}

function Zutat({ id, farbe }: { id: string; farbe: string }) {
  if (id === "ei") {
    return (
      <svg viewBox="0 0 100 100" className="w-full drop-shadow-md" aria-hidden>
        <ellipse cx="50" cy="56" rx="30" ry="38" fill={farbe} stroke="#d8bf94" strokeWidth="3" />
        <ellipse cx="40" cy="42" rx="10" ry="13" fill="rgba(255,255,255,0.7)" />
      </svg>
    );
  }
  if (id === "zucker") {
    return (
      <svg viewBox="0 0 100 100" className="w-full drop-shadow-md" aria-hidden>
        <path d="M22 34 h56 l-6 54 h-44z" fill={farbe} stroke="#cfc4ae" strokeWidth="3" />
        <rect x="18" y="24" width="64" height="14" rx="5" fill="#e6ddc8" stroke="#cfc4ae" strokeWidth="3" />
        {[
          [38, 52],
          [56, 60],
          [46, 70],
          [64, 76],
        ].map(([x, y], i) => (
          <rect key={i} x={x} y={y} width="7" height="7" rx="1.5" fill="#fff" stroke="#dcd2bc" strokeWidth="1.5" />
        ))}
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 100 100" className="w-full drop-shadow-md" aria-hidden>
      <path d="M24 30 h52 l-4 58 h-44z" fill="#c9a882" stroke="#a1815d" strokeWidth="3" />
      <path d="M24 30 q26 -12 52 0" fill="#dcc09c" stroke="#a1815d" strokeWidth="3" />
      <ellipse cx="50" cy="60" rx="17" ry="13" fill={farbe} />
      <text x="50" y="66" textAnchor="middle" fontSize="16" fill="#a1815d" fontWeight="700">
        Mehl
      </text>
    </svg>
  );
}

function FormGrafik({ form, ausstecher = false }: { form: Form; ausstecher?: boolean }) {
  const fuellung = ausstecher ? "rgba(255,255,255,0.5)" : "#d6a86a";
  const strich = ausstecher ? "#5c7180" : "#a9743a";
  const breite = ausstecher ? 9 : 3;

  const pfad =
    form === "stern"
      ? "M50 8 L61 38 L94 38 L67 57 L77 88 L50 69 L23 88 L33 57 L6 38 L39 38z"
      : form === "herz"
        ? "M50 88 C10 60 12 22 34 18 C44 16 50 26 50 32 C50 26 56 16 66 18 C88 22 90 60 50 88z"
        : "M50 10 a40 40 0 1 0 0.1 0z";

  return (
    <svg viewBox="0 0 100 100" className="w-full drop-shadow-md" aria-hidden>
      <path
        d={pfad}
        fill={fuellung}
        stroke={strich}
        strokeWidth={breite}
        strokeLinejoin="round"
      />
      {!ausstecher && (
        <>
          <circle cx="42" cy="46" r="3.4" fill="#7a5230" />
          <circle cx="60" cy="52" r="3.4" fill="#7a5230" />
          <circle cx="48" cy="64" r="3.4" fill="#7a5230" />
        </>
      )}
    </svg>
  );
}
