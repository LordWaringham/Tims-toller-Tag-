"use client";

/**
 * Ziehen und Ablegen für kleine Hände.
 *
 * Getroffen wird nicht dort, wo der Finger ist, sondern dort, wo das gezogene
 * Bild liegt — und zwar mit großzügigem Rand. Fünfjährige zielen ungenau, und
 * das Spiel soll ihnen entgegenkommen, nicht umgekehrt.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { motion } from "motion/react";
import * as sfx from "@/lib/sfx";

interface Zone {
  id: string;
  el: HTMLElement;
  /** Nimmt diese Zone dieses Element an? */
  akzeptiert?: (ziehId: string) => boolean;
  /**
   * Zusätzlicher Fangbereich in Prozent der Bühnenbreite.
   * Bewusst nicht in Pixeln: Wird das Tablet gedreht, ändert sich die
   * Bühnenbreite — ein einmal berechneter Pixelwert wäre danach falsch.
   */
  toleranzCqw: number;
}

interface DropApi {
  anmelden: (zone: Zone) => () => void;
  finden: (rect: DOMRect, ziehId: string) => string | null;
}

const DropCtx = createContext<DropApi | null>(null);

export function DropBereich({ children }: { children: ReactNode }) {
  const zonen = useRef(new Map<string, Zone>());

  const anmelden = useCallback((zone: Zone) => {
    zonen.current.set(zone.id, zone);
    return () => {
      zonen.current.delete(zone.id);
    };
  }, []);

  const finden = useCallback((rect: DOMRect, ziehId: string) => {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let beste: string | null = null;
    let besteDistanz = Infinity;

    for (const zone of zonen.current.values()) {
      if (zone.akzeptiert && !zone.akzeptiert(ziehId)) continue;
      const z = zone.el.getBoundingClientRect();
      const buehne = zone.el.closest(".buehne") as HTMLElement | null;
      const t = ((buehne?.clientWidth ?? 800) * zone.toleranzCqw) / 100;
      const innen =
        cx >= z.left - t && cx <= z.right + t && cy >= z.top - t && cy <= z.bottom + t;
      if (!innen) continue;
      // Bei überlappenden Zonen gewinnt die, deren Mitte am nächsten liegt.
      const dx = cx - (z.left + z.width / 2);
      const dy = cy - (z.top + z.height / 2);
      const d = dx * dx + dy * dy;
      if (d < besteDistanz) {
        besteDistanz = d;
        beste = zone.id;
      }
    }
    return beste;
  }, []);

  const api = useMemo(() => ({ anmelden, finden }), [anmelden, finden]);
  return <DropCtx.Provider value={api}>{children}</DropCtx.Provider>;
}

function useDropApi() {
  const api = useContext(DropCtx);
  if (!api) throw new Error("DropBereich fehlt");
  return api;
}

/** Eine Ablagefläche. */
export function Ablage({
  id,
  className,
  style,
  children,
  akzeptiert,
  toleranzCqw = 4,
}: {
  id: string;
  className?: string;
  style?: React.CSSProperties;
  children?: ReactNode;
  akzeptiert?: (ziehId: string) => boolean;
  /** Fangbereich rund um die Fläche, in Prozent der Bühnenbreite. */
  toleranzCqw?: number;
}) {
  const { anmelden } = useDropApi();
  const ref = useRef<HTMLDivElement>(null);
  const akzeptiertRef = useRef(akzeptiert);

  // Nach jedem Rendern nachziehen — Refs dürfen nicht während des Renderns
  // beschrieben werden, und die Prüfung läuft ohnehin erst im Ereignis.
  useEffect(() => {
    akzeptiertRef.current = akzeptiert;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return anmelden({
      id,
      el,
      toleranzCqw,
      akzeptiert: (ziehId) => akzeptiertRef.current?.(ziehId) ?? true,
    });
  }, [anmelden, id, toleranzCqw]);

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}

/**
 * Ein Gegenstand, den das Kind ziehen kann.
 *
 * Wie beim Tippziel hält die äußere Hülle die Position und das innere Element
 * bewegt sich — Motion würde ein `translate(-50%, -50%)` sonst überschreiben.
 */
export function Ziehbar({
  id,
  x,
  y,
  breite,
  zIndex = 30,
  className,
  children,
  onAblegen,
  aktiv = true,
  hinweis = false,
}: {
  id: string;
  /** Position der Mitte in Prozent der Bühne. */
  x: number;
  y: number;
  /** Breite in Prozent der Bühnenbreite. */
  breite: number;
  zIndex?: number;
  className?: string;
  children: ReactNode;
  /** Gibt true zurück, wenn der Gegenstand dort bleiben darf. */
  onAblegen: (zoneId: string | null) => boolean;
  aktiv?: boolean;
  hinweis?: boolean;
}) {
  const { finden } = useDropApi();
  const ref = useRef<HTMLDivElement>(null);
  const reactId = useId();

  const beenden = () => {
    const el = ref.current;
    if (!el) return;
    const zone = finden(el.getBoundingClientRect(), id);
    const angenommen = onAblegen(zone);
    if (!angenommen) sfx.nope();
  };

  return (
    <div
      className="huelle"
      style={{ left: `${x}%`, top: `${y}%`, width: `${breite}cqw`, zIndex }}
    >
      <motion.div
        ref={ref}
        key={reactId}
        className={className}
        style={{ touchAction: "none", cursor: aktiv ? "grab" : "default" }}
        drag={aktiv}
        dragSnapToOrigin
        dragMomentum={false}
        dragElastic={0.12}
        whileDrag={{ scale: 1.18, zIndex: 60, cursor: "grabbing" }}
        onDragStart={() => sfx.pop()}
        onDragEnd={beenden}
        animate={hinweis ? { scale: [1, 1.1, 1] } : { scale: 1 }}
        transition={
          hinweis
            ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
            : { type: "spring", stiffness: 380, damping: 26 }
        }
      >
        {children}
      </motion.div>
    </div>
  );
}
