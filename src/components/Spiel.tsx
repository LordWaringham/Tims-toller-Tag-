"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { STATIONS, nextStation, type StationId } from "@/lib/stations";
import { useProgress, useHatJemandGespielt, fortschrittVon } from "@/lib/progress";
import { kindFinden, type Kind } from "@/lib/kinder";
import * as voice from "@/lib/voice";

import { Titelbild } from "./Titelbild";
import { WerSpielt } from "./WerSpielt";
import { Tageskarte } from "./Tageskarte";
import { Stickerheft } from "./Stickerheft";
import { Elternseite } from "./Elternseite";
import { Finale } from "./Finale";
import { Querformat } from "./Querformat";
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

type Ansicht = "titel" | "wer" | "karte" | "station" | "sticker" | "eltern" | "finale";

export function Spiel() {
  const [kindId, setKindId] = useState<string | null>(null);
  const kind = kindFinden(kindId);
  const { abschliessen, istOffen, istFertig, naechsteOffene } = useProgress(kindId);
  const hatJemandGespielt = useHatJemandGespielt();
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

  const kindGewaehlt = useCallback((gewaehlt: Kind) => {
    setKindId(gewaehlt.id);
    setAnsicht("karte");
  }, []);

  const Station = aktuell ? SPIELE[aktuell] : null;

  return (
    <>
      <Querformat />
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
              weiterspielen={hatJemandGespielt}
              onSpielen={() => setAnsicht("wer")}
              onEltern={() => setAnsicht("eltern")}
            />
          )}

          {ansicht === "wer" && (
            <WerSpielt
              onGewaehlt={kindGewaehlt}
              onZurueck={() => setAnsicht("titel")}
              fortschritt={fortschrittVon}
            />
          )}

          {ansicht === "karte" && (
            <Tageskarte
              kind={kind}
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
            <Stickerheft
              kind={kind}
              istFertig={istFertig}
              onZurueck={() => setAnsicht("karte")}
            />
          )}

          {ansicht === "eltern" && (
            <Elternseite onZurueck={() => setAnsicht("titel")} />
          )}

          {ansicht === "finale" && (
            <Finale kind={kind} onKarte={() => setAnsicht("karte")} onNochmal={nochmal} />
          )}
        </motion.main>
      </AnimatePresence>
    </>
  );
}
