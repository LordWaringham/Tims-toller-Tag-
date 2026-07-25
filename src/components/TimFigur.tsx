"use client";

/**
 * Tim als Vektorgrafik — angelehnt an die Buchillustrationen:
 * struppiges oranges Haar, rundes Gesicht, große braune Augen.
 *
 * Er wird nur dort gebraucht, wo Tim sich verändern muss, also beim Anziehen.
 * Überall sonst ist die Originalillustration zu sehen — eine gezeichnete Figur
 * neben einer gemalten wirkt sonst wie ein Fremdkörper. Deshalb hier weiche
 * Verläufe statt flacher Flächen: Das kommt dem Buch näher als reine Farben.
 */

const HAUT = "#f6d2b3";
const HAUT_TIEF = "#e3b189";
const UMRISS = "#9a6a48";
const HAAR = "#ef7326";
const HAAR_TIEF = "#c9501a";
const HAAR_HELL = "#ffa04d";

export type Pose = "stehen" | "winken";

export function TimFigur({
  shirtFarbe,
  hoseFarbe,
  hoseKurz = false,
  pose = "stehen",
  augenZu = false,
  className,
  style,
}: {
  /** Kein Wert = Tim trägt noch kein Oberteil. */
  shirtFarbe?: string;
  hoseFarbe?: string;
  /** Kurze Hose — dann bleibt das Pflaster am Knie zu sehen. */
  hoseKurz?: boolean;
  pose?: Pose;
  augenZu?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const winkt = pose === "winken";

  return (
    <svg viewBox="0 0 100 172" className={className} style={style} aria-hidden>
      <defs>
        <radialGradient id="timHaut" cx="38%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#fde3c9" />
          <stop offset="100%" stopColor={HAUT} />
        </radialGradient>
        <linearGradient id="timHaar" x1="20%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stopColor={HAAR_HELL} />
          <stop offset="60%" stopColor={HAAR} />
          <stop offset="100%" stopColor={HAAR_TIEF} />
        </linearGradient>
        <linearGradient id="timStoff" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.28)" />
          <stop offset="55%" stopColor="rgba(255,255,255,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.16)" />
        </linearGradient>
      </defs>

      {/* Schatten auf dem Boden */}
      <ellipse cx="50" cy="166" rx="26" ry="5" fill="rgba(120,90,60,0.16)" />

      {/* ------------------------------------------------------------- Beine */}
      <g>
        {/* Bei kurzer Hose bleiben die Beine Haut und bekommen oben ein Höschen. */}
        <path
          d="M39 98 h10 v50 q-5 2 -10 0z"
          fill={hoseFarbe && !hoseKurz ? hoseFarbe : HAUT}
          stroke={UMRISS}
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        <path
          d="M53 98 h10 v50 q-5 2 -10 0z"
          fill={hoseFarbe && !hoseKurz ? hoseFarbe : HAUT}
          stroke={UMRISS}
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        {hoseFarbe && !hoseKurz && (
          <path d="M39 98 h24 v50 q-12 3 -24 0z" fill="url(#timStoff)" opacity="0.9" />
        )}
        {hoseFarbe && hoseKurz && (
          <g>
            <path
              d="M37 96 h28 v11 q-14 3 -28 0z"
              fill={hoseFarbe}
              stroke={UMRISS}
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
            <path d="M37 96 h28 v11 q-14 3 -28 0z" fill="url(#timStoff)" opacity="0.9" />
          </g>
        )}

        {/*
          Das Pflaster am Knie.

          In den Bilderbüchern von Katharina Wieker trägt Tim fast immer eines —
          er lernt ja gerade Rad fahren. Es sitzt auf der Haut und verschwindet
          folgerichtig unter der Hose, sobald das Kind ihm eine angezogen hat.
        */}
        {(!hoseFarbe || hoseKurz) && (
          <g transform="rotate(-14 44 113)">
            <rect
              x="38.9"
              y="110"
              width="10.2"
              height="6"
              rx="2.8"
              fill="#f7d8ae"
              stroke="#d3a674"
              strokeWidth="0.7"
            />
            <rect x="42.1" y="111.3" width="3.8" height="3.4" rx="1.1" fill="#e9c395" />
            {[40.4, 47.2].map((x) =>
              [111.4, 113.6].map((y) => (
                <circle key={`${x}-${y}`} cx={x} cy={y} r="0.42" fill="#d3a674" />
              )),
            )}
          </g>
        )}
        {/* Schuhe */}
        <path
          d="M35 148 q9 -3 15 0 v6 q0 4 -5 4 h-6 q-4 0 -4 -4z"
          fill="#7a5238"
          stroke="#5c3c28"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path
          d="M50 148 q9 -3 15 0 v6 q0 4 -4 4 h-6 q-5 0 -5 -4z"
          fill="#7a5238"
          stroke="#5c3c28"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </g>

      {/* Unterhose, solange keine Hose gewählt ist */}
      {!hoseFarbe && (
        <path
          d="M36 94 h28 v11 q-14 4 -28 0z"
          fill="#eef2f6"
          stroke="#c9d2da"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      )}

      {/* --------------------------------------------------------- Oberkörper */}
      {shirtFarbe ? (
        <g>
          <path
            d="M31 63 q19 -7 38 0 l3 39 q-22 6 -44 0z"
            fill={shirtFarbe}
            stroke={UMRISS}
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <path d="M31 63 q19 -7 38 0 l3 39 q-22 6 -44 0z" fill="url(#timStoff)" />
          {/* Kragen */}
          <path
            d="M42 62 q8 7 16 0"
            fill="none"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        </g>
      ) : (
        <g>
          <path
            d="M33 62 q17 -6 34 0 l2 40 q-19 5 -38 0z"
            fill="#f7f3e9"
            stroke="#d8d0bf"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <path d="M33 62 q17 -6 34 0 l2 40 q-19 5 -38 0z" fill="url(#timStoff)" opacity="0.6" />
        </g>
      )}

      {/* -------------------------------------------------------------- Arme */}
      {/*
        Als geschlossene Formen statt als Striche gezeichnet: Der Arm wird zum
        Handgelenk hin schmaler, so wie er es in der Illustration auch tut.
      */}
      <g>
        {winkt ? (
          <path
            d="M33 66 q-13 -3 -20 -15 l6 -4 q8 10 18 13z"
            fill={HAUT}
            stroke={UMRISS}
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M33 66 q-10 12 -13 30 l7 1 q4 -17 12 -27z"
            fill={HAUT}
            stroke={UMRISS}
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        )}
        {winkt ? (
          <path
            d="M67 66 q13 -3 20 -15 l-6 -4 q-8 10 -18 13z"
            fill={HAUT}
            stroke={UMRISS}
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M67 66 q10 12 13 30 l-7 1 q-4 -17 -12 -27z"
            fill={HAUT}
            stroke={UMRISS}
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        )}
        {/* Hände */}
        <circle
          cx={winkt ? 11 : 23}
          cy={winkt ? 45 : 98}
          r="5.6"
          fill="url(#timHaut)"
          stroke={UMRISS}
          strokeWidth="1.2"
        />
        <circle
          cx={winkt ? 89 : 77}
          cy={winkt ? 45 : 98}
          r="5.6"
          fill="url(#timHaut)"
          stroke={UMRISS}
          strokeWidth="1.2"
        />
        {/* Kurze Ärmel über den Schultern */}
        {shirtFarbe && (
          <>
            <path
              d="M31 63 q-8 3 -10 13 l12 4 q2 -11 4 -15z"
              fill={shirtFarbe}
              stroke={UMRISS}
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <path
              d="M69 63 q8 3 10 13 l-12 4 q-2 -11 -4 -15z"
              fill={shirtFarbe}
              stroke={UMRISS}
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </>
        )}
      </g>

      {/* -------------------------------------------------------------- Kopf */}
      <g>
        {/* Hals */}
        <path d="M44 54 h12 v10 q-6 3 -12 0z" fill={HAUT_TIEF} />

        <ellipse
          cx="50"
          cy="36"
          rx="23"
          ry="24"
          fill="url(#timHaut)"
          stroke={UMRISS}
          strokeWidth="1.4"
        />
        {/* Ohren */}
        <ellipse cx="27" cy="39" rx="4.4" ry="5.6" fill={HAUT} stroke={UMRISS} strokeWidth="1.1" />
        <ellipse cx="73" cy="39" rx="4.4" ry="5.6" fill={HAUT} stroke={UMRISS} strokeWidth="1.1" />

        {/* Struppiges Haar in einzelnen Strähnen, nach rechts gekämmt */}
        <path
          d="M27 33 q-1 -16 12 -22 q9 -5 18 -3 q14 3 16 16 q1 5 0 10
             q-3 -6 -8 -8 q-13 3 -24 -1 q-8 2 -11 8 q-2 1 -3 0z"
          fill="url(#timHaar)"
          stroke={HAAR_TIEF}
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
        {/* einzelne abstehende Spitzen */}
        <path
          d="M37 13 q-4 -4 -1 -7 q1 4 4 5z
             M49 9 q0 -5 5 -6 q-3 3 -2 6z
             M61 11 q5 -3 8 1 q-4 0 -6 3z"
          fill={HAAR}
          stroke={HAAR_TIEF}
          strokeWidth="0.9"
          strokeLinejoin="round"
        />
        {/* Glanz im Haar */}
        <path
          d="M38 18 q8 -5 17 -3"
          fill="none"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />

        {/* Augenbrauen */}
        <path
          d="M36 30 q5 -3 9 -1"
          fill="none"
          stroke={HAAR_TIEF}
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          d="M55 29 q4 -2 9 1"
          fill="none"
          stroke={HAAR_TIEF}
          strokeWidth="1.7"
          strokeLinecap="round"
        />

        {/* Augen */}
        {augenZu ? (
          <>
            <path d="M36 38 q5 5 10 0" fill="none" stroke={UMRISS} strokeWidth="1.9" strokeLinecap="round" />
            <path d="M54 38 q5 5 10 0" fill="none" stroke={UMRISS} strokeWidth="1.9" strokeLinecap="round" />
          </>
        ) : (
          <>
            <ellipse cx="41" cy="37" rx="4.6" ry="5.4" fill="#fff" stroke="#d8c0aa" strokeWidth="0.6" />
            <ellipse cx="59" cy="37" rx="4.6" ry="5.4" fill="#fff" stroke="#d8c0aa" strokeWidth="0.6" />
            <circle cx="41.5" cy="37.6" r="3" fill="#5a3b22" />
            <circle cx="59.5" cy="37.6" r="3" fill="#5a3b22" />
            <circle cx="42.6" cy="36.2" r="1.2" fill="#fff" />
            <circle cx="60.6" cy="36.2" r="1.2" fill="#fff" />
          </>
        )}

        {/* Nase und Mund */}
        <path
          d="M50 41 q2.5 3.5 -0.5 5"
          fill="none"
          stroke={HAUT_TIEF}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M42 49 q8 7 16 0"
          fill="none"
          stroke={UMRISS}
          strokeWidth="1.9"
          strokeLinecap="round"
        />
        {/* Wangen */}
        <ellipse cx="33" cy="45" rx="4.4" ry="2.8" fill="#f19a80" opacity="0.5" />
        <ellipse cx="67" cy="45" rx="4.4" ry="2.8" fill="#f19a80" opacity="0.5" />
      </g>
    </svg>
  );
}
