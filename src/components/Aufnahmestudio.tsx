"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GRUPPEN, ANZAHL_SAETZE } from "@/lib/gruppen";
import type { LineId } from "@/lib/lines";
import {
  alleEntfernen,
  alleLaden,
  besteAufnahmeArt,
  entfernen,
  sichern,
  type Aufnahme,
} from "@/lib/aufnahmen";
import { packeZip } from "@/lib/zip";

type Zustand = "laedt" | "bereit" | "kein-mikrofon";

export function Aufnahmestudio() {
  const [zustand, setZustand] = useState<Zustand>("laedt");
  const [aufnahmen, setAufnahmen] = useState<Map<string, Aufnahme>>(new Map());
  const [laeuft, setLaeuft] = useState<LineId | null>(null);
  const [spielt, setSpielt] = useState<LineId | null>(null);
  const [dauer, setDauer] = useState(0);
  const [meldung, setMeldung] = useState<string | null>(null);
  const [packt, setPackt] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const stromRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startRef = useRef(0);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const art = useMemo(() => besteAufnahmeArt(), []);

  useEffect(() => {
    alleLaden()
      .then((geladen) => {
        setAufnahmen(geladen);
        setZustand("bereit");
      })
      .catch(() => setZustand("bereit"));
  }, []);

  // Mikrofon erst beim ersten Aufnehmen anfordern, nicht schon beim Öffnen.
  const mikrofon = useCallback(async () => {
    if (stromRef.current) return stromRef.current;
    const strom = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    });
    stromRef.current = strom;
    return strom;
  }, []);

  const starten = useCallback(
    async (id: LineId) => {
      if (laeuft) return;
      audioRef.current?.pause();
      setSpielt(null);
      try {
        const strom = await mikrofon();
        const recorder = new MediaRecorder(
          strom,
          art.mimeType ? { mimeType: art.mimeType } : undefined,
        );
        const stuecke: BlobPart[] = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) stuecke.push(e.data);
        };
        recorder.onstop = async () => {
          const blob = new Blob(stuecke, { type: art.mimeType || "audio/webm" });
          const neue: Aufnahme = {
            id,
            blob,
            endung: art.endung,
            dauer: (Date.now() - startRef.current) / 1000,
            zeitpunkt: Date.now(),
          };
          await sichern(neue);
          setAufnahmen((alt) => new Map(alt).set(id, neue));
        };
        recorderRef.current = recorder;
        startRef.current = Date.now();
        setDauer(0);
        recorder.start();
        setLaeuft(id);
        tickerRef.current = setInterval(
          () => setDauer((Date.now() - startRef.current) / 1000),
          100,
        );
      } catch {
        setZustand("kein-mikrofon");
      }
    },
    [art, laeuft, mikrofon],
  );

  const stoppen = useCallback(() => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    if (tickerRef.current) clearInterval(tickerRef.current);
    setLaeuft(null);
    setDauer(0);
  }, []);

  const anhoeren = useCallback(
    (id: LineId) => {
      const aufnahme = aufnahmen.get(id);
      if (!aufnahme) return;
      audioRef.current?.pause();
      const audio = new Audio(URL.createObjectURL(aufnahme.blob));
      audioRef.current = audio;
      audio.onended = () => setSpielt(null);
      audio.onerror = () => setSpielt(null);
      setSpielt(id);
      void audio.play();
    },
    [aufnahmen],
  );

  const loeschen = useCallback(async (id: LineId) => {
    await entfernen(id);
    setAufnahmen((alt) => {
      const neu = new Map(alt);
      neu.delete(id);
      return neu;
    });
  }, []);

  const herunterladen = useCallback(async () => {
    if (!aufnahmen.size) return;
    setPackt(true);
    setMeldung(null);
    try {
      const dateien = [];
      for (const aufnahme of aufnahmen.values()) {
        const puffer = new Uint8Array(await aufnahme.blob.arrayBuffer());
        dateien.push({ name: `${aufnahme.id}.${aufnahme.endung}`, daten: puffer });
      }
      dateien.sort((a, b) => a.name.localeCompare(b.name));
      const zip = packeZip(dateien);
      const url = URL.createObjectURL(zip);
      const a = document.createElement("a");
      a.href = url;
      a.download = "tims-toller-tag-audio.zip";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setMeldung(
        `${dateien.length} Aufnahmen gepackt. Den Inhalt des ZIPs nach public/audio/ hochladen.`,
      );
    } catch {
      setMeldung("Das Packen hat nicht geklappt. Bitte noch einmal versuchen.");
    } finally {
      setPackt(false);
    }
  }, [aufnahmen]);

  const fertig = aufnahmen.size;

  if (zustand === "laedt") {
    return <div className="min-h-dvh bg-creme" />;
  }

  return (
    <div className="min-h-dvh bg-creme pb-24">
      <Kopf
        fertig={fertig}
        packt={packt}
        onHerunterladen={herunterladen}
        onAllesLoeschen={async () => {
          if (!confirm("Wirklich alle Aufnahmen löschen?")) return;
          await alleEntfernen();
          setAufnahmen(new Map());
        }}
      />

      <div className="mx-auto max-w-3xl px-4">
        {zustand === "kein-mikrofon" && (
          <p className="mt-4 rounded-2xl bg-[#f7e2d5] p-4 text-sm" style={{ color: "#8a4522" }}>
            Kein Zugriff aufs Mikrofon. Bitte im Browser die Mikrofon-Berechtigung für
            diese Seite erlauben und dann neu laden.
          </p>
        )}

        <Anleitung endung={art.endung} />

        {meldung && (
          <p
            className="sticky top-[76px] z-10 mt-4 rounded-2xl bg-[#e3efd8] p-4 text-sm"
            style={{ color: "#3f6b28" }}
          >
            {meldung}
          </p>
        )}

        {GRUPPEN.map((gruppe) => {
          const inGruppe = gruppe.saetze.filter((s) => aufnahmen.has(s.id)).length;
          return (
            <section key={gruppe.titel} className="mt-8">
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <h2 className="text-lg font-bold" style={{ color: "#54604f" }}>
                  {gruppe.titel}
                </h2>
                <span
                  className="shrink-0 text-sm tabular-nums"
                  style={{ color: inGruppe === gruppe.saetze.length ? "#5a8c28" : "#8b978a" }}
                >
                  {inGruppe} / {gruppe.saetze.length}
                </span>
              </div>
              {gruppe.hinweis && (
                <p className="mb-3 text-sm" style={{ color: "#8b978a" }}>
                  {gruppe.hinweis}
                </p>
              )}

              <ul className="flex flex-col gap-2">
                {gruppe.saetze.map((satz) => (
                  <Zeile
                    key={satz.id}
                    id={satz.id}
                    text={satz.text}
                    aufnahme={aufnahmen.get(satz.id)}
                    nimmtAuf={laeuft === satz.id}
                    gesperrt={laeuft !== null && laeuft !== satz.id}
                    spielt={spielt === satz.id}
                    dauer={dauer}
                    onStart={() => starten(satz.id)}
                    onStop={stoppen}
                    onAnhoeren={() => anhoeren(satz.id)}
                    onLoeschen={() => loeschen(satz.id)}
                  />
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Kopf({
  fertig,
  packt,
  onHerunterladen,
  onAllesLoeschen,
}: {
  fertig: number;
  packt: boolean;
  onHerunterladen: () => void;
  onAllesLoeschen: () => void;
}) {
  const anteil = Math.round((fertig / ANZAHL_SAETZE) * 100);
  return (
    <header className="sticky top-0 z-20 border-b border-black/5 bg-creme/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-bold" style={{ color: "#54604f" }}>
            Sprechtexte aufnehmen
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/8">
              <div
                className="h-full rounded-full transition-[width] duration-300"
                style={{ width: `${anteil}%`, background: "#7fb03c" }}
              />
            </div>
            <span className="shrink-0 text-xs tabular-nums" style={{ color: "#8b978a" }}>
              {fertig} / {ANZAHL_SAETZE}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onHerunterladen}
          disabled={!fertig || packt}
          className="rounded-full px-5 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-40"
          style={{ background: "linear-gradient(180deg, #f0813c, #d9541c)" }}
        >
          {packt ? "packt …" : "Alle herunterladen"}
        </button>
        {fertig > 0 && (
          <button
            type="button"
            onClick={onAllesLoeschen}
            className="rounded-full bg-black/5 px-3 py-2 text-sm font-medium"
            style={{ color: "#8b978a" }}
          >
            Alles löschen
          </button>
        )}
      </div>
    </header>
  );
}

function Anleitung({ endung }: { endung: string }) {
  return (
    <details className="mt-4 rounded-2xl bg-white/70 p-4 text-sm leading-relaxed">
      <summary className="cursor-pointer font-semibold" style={{ color: "#54604f" }}>
        So geht es
      </summary>
      <ol className="mt-3 list-decimal space-y-1.5 pl-5">
        <li>
          Auf <strong>Aufnehmen</strong> tippen, den Satz sprechen, auf{" "}
          <strong>Fertig</strong> tippen. Ruhig und etwas langsamer als normal.
        </li>
        <li>
          Mit <strong>Anhören</strong> prüfen. Gefällt es nicht, einfach nochmal
          aufnehmen — die alte Aufnahme wird ersetzt.
        </li>
        <li>
          Am Ende oben auf <strong>Alle herunterladen</strong>. Du bekommst ein ZIP
          mit fertig benannten Dateien.
        </li>
        <li>
          Das ZIP entpacken und die Dateien auf GitHub nach{" "}
          <code className="rounded bg-black/5 px-1.5 py-0.5">public/audio/</code> hochladen
          (<em>Add file → Upload files</em>). Ein bis zwei Minuten später ist die neue
          Stimme im Spiel.
        </li>
      </ol>
      <p className="mt-3" style={{ color: "#8b978a" }}>
        Die Aufnahmen bleiben in diesem Browser gespeichert — du kannst das Fenster
        schließen und später weitermachen. Aufnahmeformat auf diesem Gerät:{" "}
        <code className="rounded bg-black/5 px-1.5 py-0.5">.{endung}</code>. Du musst nicht
        alle Sätze einsprechen; für jeden fehlenden liest weiterhin die Gerätestimme vor.
      </p>
    </details>
  );
}

function Zeile({
  id,
  text,
  aufnahme,
  nimmtAuf,
  gesperrt,
  spielt,
  dauer,
  onStart,
  onStop,
  onAnhoeren,
  onLoeschen,
}: {
  id: LineId;
  text: string;
  aufnahme?: Aufnahme;
  nimmtAuf: boolean;
  gesperrt: boolean;
  spielt: boolean;
  dauer: number;
  onStart: () => void;
  onStop: () => void;
  onAnhoeren: () => void;
  onLoeschen: () => void;
}) {
  return (
    <li
      className="flex flex-wrap items-center gap-3 rounded-2xl p-3 transition-colors"
      style={{
        background: nimmtAuf ? "#fbe4d8" : aufnahme ? "#eef4e8" : "rgba(255,255,255,0.7)",
      }}
    >
      <div className="min-w-0 flex-1">
        <p className="leading-snug" style={{ color: "#3f4a3d" }}>
          {text}
        </p>
        <code className="text-xs" style={{ color: "#9aa697" }}>
          {id}.{aufnahme?.endung ?? "…"}
        </code>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {aufnahme && !nimmtAuf && (
          <button
            type="button"
            onClick={onAnhoeren}
            aria-label="Anhören"
            className="rounded-full bg-white px-3 py-2 text-sm font-medium shadow-sm"
            style={{ color: "#5f6b5c" }}
          >
            {spielt ? "▶ läuft" : "▶ Anhören"}
          </button>
        )}

        {nimmtAuf ? (
          <button
            type="button"
            onClick={onStop}
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm"
            style={{ background: "#c62f2f" }}
          >
            <span className="size-2.5 rounded-full bg-white" />
            Fertig · {dauer.toFixed(1)}s
          </button>
        ) : (
          <button
            type="button"
            onClick={onStart}
            disabled={gesperrt}
            className="rounded-full px-4 py-2 text-sm font-semibold shadow-sm disabled:opacity-35"
            style={{
              background: aufnahme ? "rgba(0,0,0,0.06)" : "#f0813c",
              color: aufnahme ? "#5f6b5c" : "#fff",
            }}
          >
            {aufnahme ? "Nochmal" : "● Aufnehmen"}
          </button>
        )}

        {aufnahme && !nimmtAuf && (
          <button
            type="button"
            onClick={onLoeschen}
            aria-label="Aufnahme löschen"
            className="rounded-full px-2 py-2 text-sm"
            style={{ color: "#b0bbac" }}
          >
            ✕
          </button>
        )}
      </div>
    </li>
  );
}
