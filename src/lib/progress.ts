"use client";

import { useCallback, useSyncExternalStore } from "react";
import { STATIONS, type StationId } from "./stations";
import { KINDER } from "./kinder";

const KEY = "tims-toller-tag/v1";

export interface Progress {
  /** Stationen, die schon einmal geschafft wurden. */
  fertig: StationId[];
  /** Wurde der ganze Tag schon einmal durchgespielt? */
  tagGeschafft: boolean;
}

const LEER: Progress = { fertig: [], tagGeschafft: false };

/*
 * Jedes Kind hat seinen eigenen Stand.
 *
 * Er lebt außerhalb von React und wird über useSyncExternalStore gelesen. So
 * gibt es beim ersten Rendern keinen Umweg über einen Effekt, und Server- und
 * Browserstand können nicht auseinanderlaufen.
 */
const staende = new Map<string, Progress>();
const horcher = new Set<() => void>();

function schluessel(kindId: string) {
  return `${KEY}/${kindId}`;
}

function lesen(kindId: string): Progress {
  if (typeof localStorage === "undefined") return LEER;
  try {
    const roh = localStorage.getItem(schluessel(kindId));
    if (!roh) return LEER;
    const gelesen = JSON.parse(roh) as Partial<Progress>;
    const gueltig = new Set(STATIONS.map((s) => s.id));
    return {
      fertig: (gelesen.fertig ?? []).filter((id): id is StationId =>
        gueltig.has(id as StationId),
      ),
      tagGeschafft: Boolean(gelesen.tagGeschafft),
    };
  } catch {
    return LEER;
  }
}

/** Wird beim ersten Zugriff aus dem Speicher geladen und danach gehalten. */
function stand(kindId: string): Progress {
  let vorhanden = staende.get(kindId);
  if (!vorhanden) {
    vorhanden = lesen(kindId);
    staende.set(kindId, vorhanden);
  }
  return vorhanden;
}

function schreiben(kindId: string, neu: Progress) {
  staende.set(kindId, neu);
  try {
    localStorage.setItem(schluessel(kindId), JSON.stringify(neu));
  } catch {
    /* privater Modus o. ä. — dann eben nur für diese Sitzung */
  }
  horcher.forEach((h) => h());
}

function anmelden(fn: () => void) {
  horcher.add(fn);
  return () => {
    horcher.delete(fn);
  };
}

/**
 * Hat überhaupt schon jemand gespielt? Für „Weiterspielen" auf dem Titelbild.
 *
 * Bewusst über den Store und nicht direkt aus localStorage gelesen: Beim
 * Ausliefern der Seite gibt es keinen Speicher, im Browser schon — würde das
 * beim Rendern abgefragt, stünde erst „Spielen" und dann plötzlich
 * „Weiterspielen" da, und React meldet zu Recht einen Hydrationsfehler.
 */
export function useHatJemandGespielt(): boolean {
  const abonnieren = useCallback((fn: () => void) => anmelden(fn), []);
  const momentaufnahme = useCallback(
    () => KINDER.some((k) => stand(k.id).fertig.length > 0),
    [],
  );
  return useSyncExternalStore(abonnieren, momentaufnahme, () => false);
}

/** Wie weit ein Kind gekommen ist — für die Namensauswahl. */
export function fortschrittVon(kindId: string): number {
  return stand(kindId).fertig.length;
}

const serverMomentaufnahme = () => LEER;

export function useProgress(kindId: string | null) {
  const abonnieren = useCallback((fn: () => void) => anmelden(fn), []);
  const momentaufnahme = useCallback(
    () => (kindId ? stand(kindId) : LEER),
    [kindId],
  );
  const progress = useSyncExternalStore(abonnieren, momentaufnahme, serverMomentaufnahme);

  const abschliessen = useCallback(
    (id: StationId) => {
      if (!kindId) return;
      const alt = stand(kindId);
      if (alt.fertig.includes(id)) return;
      const fertig = [...alt.fertig, id];
      schreiben(kindId, {
        fertig,
        tagGeschafft: alt.tagGeschafft || fertig.length === STATIONS.length,
      });
    },
    [kindId],
  );

  const zuruecksetzen = useCallback(() => {
    if (kindId) schreiben(kindId, LEER);
  }, [kindId]);

  /**
   * Der Tag wird der Reihe nach gespielt: Station Nummer n ist offen, wenn
   * die Station davor geschafft ist. Einmal geschaffte Stationen bleiben offen.
   */
  const istOffen = useCallback(
    (id: StationId) => {
      const i = STATIONS.findIndex((s) => s.id === id);
      if (i <= 0) return true;
      return progress.fertig.includes(STATIONS[i - 1].id);
    },
    [progress.fertig],
  );

  const istFertig = useCallback(
    (id: StationId) => progress.fertig.includes(id),
    [progress.fertig],
  );

  /** Die Station, bei der es weitergeht. */
  const naechsteOffene = STATIONS.find((s) => !progress.fertig.includes(s.id)) ?? null;

  return {
    progress,
    abschliessen,
    zuruecksetzen,
    istOffen,
    istFertig,
    naechsteOffene,
    anzahlFertig: progress.fertig.length,
  };
}

/** Für die Elternseite: Stand aller Kinder auf einen Blick. */
export function useAlleStaende() {
  const abonnieren = useCallback((fn: () => void) => anmelden(fn), []);
  const momentaufnahme = useCallback(
    () => KINDER.map((k) => stand(k.id).fertig.length).join(","),
    [],
  );
  const schluesselWert = useSyncExternalStore(abonnieren, momentaufnahme, () => "");

  return {
    schluesselWert,
    staende: KINDER.map((k) => ({ kind: k, anzahl: stand(k.id).fertig.length })),
    einzelnZuruecksetzen: (kindId: string) => schreiben(kindId, LEER),
    allesZuruecksetzen: () => KINDER.forEach((k) => schreiben(k.id, LEER)),
  };
}
