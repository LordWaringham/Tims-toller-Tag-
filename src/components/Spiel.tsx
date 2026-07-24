"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { STATIONS, nextStation, type StationId } from "@/lib/stations";
import { useProgress } from "@/lib/progress";
import * as voice from "@/lib/voice";

import { Titelbild } from "./Titelbild";
import { Tageskarte } from "./Tageskarte";
import { Stickerheft } from "./Stickerheft";
import { Elternseite } from "./Elternseite";
import { Finale } from "./Finale";
import type { StationProps } from "./StationRahmen";

import { Aufwachen } from "@/stationen/Aufwachen";
import { Anziehen } from "@/stationen/Anziehen";
import { Fruehstueck } from "@/stationen/Fruehstueck";
import { Turm } from "@/stationen/Turm";
import { Aufraeumen } from "@/stationen/Aufraeumen";
import { Blumen } from "@/stationen/Blumen";
import { Kekse } from "@/stationen/Kekse";
import { Pfuetzen } from "@/stationen/Pfuetzen";
import { Schafe } from "@/stationen/Schafe";
import { Schmetterlinge } from "@/stationen/Schmetterlinge";
import { GuteNacht } from "@/stationen/GuteNacht";

const SPIELE: Record<StationId, (p: StationProps) => React.ReactElement> = {
  aufwachen: Aufwachen,
  anziehen: Anziehen,
  fruehstueck: Fruehstueck,
  turm: Turm,
  aufraeumen: Aufraeumen,
  blumen: Blumen,
  kekse: Kekse,
  pfuetzen: Pfuetzen,
  schafe: Schafe,
  schmetterlinge: Schmetterlinge,
  gutenacht: GuteNacht,
};

type Ansicht = "titel" | "karte" | "station" | "sticker" | "eltern" | "finale";

export function Spiel() {
  const { abschliessen, zuruecksetzen, istOffen, istFertig, naechsteOffene, anzahlFertig } =
    useProgress();
  const [ansicht, setAnsicht] = useState<Ansicht>("titel");
  const [aktuell, setAktuell] = useState<StationId | null>(null);
  /** Zählt bei jedem Start hoch, damit eine Station sauber neu beginnt. */
  const [lauf, setLauf] = useState(0);

  useEffect(() => {
    voice.restoreMuted();
  }, []);

  const stationStarten = useCallback((id: StationId) => {
    setAktuell(id);
    setLauf((n) => n + 1);
    setAnsicht("station");
  }, []);

  const weiter = useCallback(() => {
    if (!aktuell) return setAnsicht("karte");
    const naechste = nextStation(aktuell);
    if (!naechste) {
      setAnsicht("finale");
      return;
    }
    stationStarten(naechste.id);
  }, [aktuell, stationStarten]);

  const nochmal = useCallback(() => {
    stationStarten(STATIONS[0].id);
  }, [stationStarten]);

  const Station = aktuell ? SPIELE[aktuell] : null;

  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={`${ansicht}-${aktuell ?? ""}-${lauf}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.28 }}
      >
        {ansicht === "titel" && (
          <Titelbild
            weiterspielen={anzahlFertig > 0}
            onSpielen={() => setAnsicht("karte")}
            onEltern={() => setAnsicht("eltern")}
          />
        )}

        {ansicht === "karte" && (
          <Tageskarte
            istOffen={istOffen}
            istFertig={istFertig}
            naechste={naechsteOffene?.id ?? null}
            onStation={stationStarten}
            onSticker={() => setAnsicht("sticker")}
            onTitel={() => setAnsicht("titel")}
          />
        )}

        {ansicht === "station" && Station && aktuell && (
          <Station
            onGeschafft={() => abschliessen(aktuell)}
            onWeiter={weiter}
            onZurueck={() => setAnsicht("karte")}
          />
        )}

        {ansicht === "sticker" && (
          <Stickerheft istFertig={istFertig} onZurueck={() => setAnsicht("karte")} />
        )}

        {ansicht === "eltern" && (
          <Elternseite
            anzahlFertig={anzahlFertig}
            onZuruecksetzen={zuruecksetzen}
            onZurueck={() => setAnsicht("titel")}
          />
        )}

        {ansicht === "finale" && (
          <Finale onKarte={() => setAnsicht("karte")} onNochmal={nochmal} />
        )}
      </motion.main>
    </AnimatePresence>
  );
}
