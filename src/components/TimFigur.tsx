"use client";

/**
 * Tim als Vektorgrafik — angelehnt an die Buchillustrationen:
 * struppiges oranges Haar, rundes Gesicht, freundliche braune Augen.
 *
 * Wird dort gebraucht, wo Tim sich verändern muss (Anziehen, Springen).
 * Sonst ist immer die Originalillustration zu sehen.
 */

const HAUT = "#f7d3b4";
const HAUT_SCHATTEN = "#e8b892";
const HAAR = "#e8622a";
const HAAR_TIEF = "#c94b1a";
const UMRISS = "#8a5a3c";

export type Pose = "stehen" | "springen" | "winken";

export function TimFigur({
  shirtFarbe,
  hoseFarbe,
  pose = "stehen",
  augenZu = false,
  className,
  style,
}: {
  /** Kein Wert = Tim trägt noch kein Oberteil. */
  shirtFarbe?: string;
  hoseFarbe?: string;
  pose?: Pose;
  augenZu?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const springt = pose === "springen";
  const winkt = pose === "winken";

  return (
    <svg viewBox="0 0 100 170" className={className} style={style} aria-hidden>
      {/* ---------------------------------------------------------- Beine */}
      <g transform={springt ? "rotate(-6 50 104)" : undefined}>
        {/* linkes Bein */}
        <path
          d={
            springt
              ? "M40 100 q-3 20 -9 30 l11 6 q9 -18 12 -34z"
              : "M39 100 h11 v46 h-11z"
          }
          fill={hoseFarbe ?? HAUT}
          stroke={UMRISS}
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        {/* rechtes Bein */}
        <path
          d={
            springt
              ? "M53 100 q6 18 15 25 l-8 9 q-14 -12 -18 -32z"
              : "M52 100 h11 v46 h-11z"
          }
          fill={hoseFarbe ?? HAUT}
          stroke={UMRISS}
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        {/* Schuhe */}
        <ellipse
          cx={springt ? 38 : 44.5}
          cy={springt ? 138 : 150}
          rx="9"
          ry="5.5"
          fill="#7a5c46"
          stroke={UMRISS}
          strokeWidth="1.2"
        />
        <ellipse
          cx={springt ? 64 : 57.5}
          cy={springt ? 137 : 150}
          rx="9"
          ry="5.5"
          fill="#7a5c46"
          stroke={UMRISS}
          strokeWidth="1.2"
        />
      </g>

      {/* --------------------------------------------------------- Unterhose */}
      {!hoseFarbe && (
        <path
          d="M37 98 h28 v12 q-14 5 -28 0z"
          fill="#eef2f6"
          stroke={UMRISS}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      )}

      {/* ------------------------------------------------------------ Arme */}
      <g>
        <path
          d={
            springt || winkt
              ? "M31 70 q-13 -10 -16 -24"
              : "M31 70 q-10 14 -12 28"
          }
          fill="none"
          stroke={HAUT}
          strokeWidth="9"
          strokeLinecap="round"
        />
        <path
          d={springt ? "M69 70 q13 -10 16 -24" : "M69 70 q10 14 12 28"}
          fill="none"
          stroke={HAUT}
          strokeWidth="9"
          strokeLinecap="round"
        />
        {/* Hände */}
        <circle
          cx={springt || winkt ? 15 : 19}
          cy={springt || winkt ? 46 : 98}
          r="5.4"
          fill={HAUT}
          stroke={UMRISS}
          strokeWidth="1.1"
        />
        <circle
          cx={springt ? 85 : 81}
          cy={springt ? 46 : 98}
          r="5.4"
          fill={HAUT}
          stroke={UMRISS}
          strokeWidth="1.1"
        />
      </g>

      {/* ------------------------------------------------------- Oberkörper */}
      {shirtFarbe ? (
        <g>
          <path
            d="M32 64 q18 -6 36 0 l4 38 q-22 6 -44 0z"
            fill={shirtFarbe}
            stroke={UMRISS}
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          {/* Ärmel */}
          <path
            d="M32 64 q-7 3 -9 12 l10 5 q3 -10 3 -14z"
            fill={shirtFarbe}
            stroke={UMRISS}
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <path
            d="M68 64 q7 3 9 12 l-10 5 q-3 -10 -3 -14z"
            fill={shirtFarbe}
            stroke={UMRISS}
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          {/* Kragen */}
          <path
            d="M43 63 q7 6 14 0"
            fill="none"
            stroke="rgba(255,255,255,0.55)"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </g>
      ) : (
        <path
          d="M33 63 q17 -5 34 0 l3 38 q-20 5 -40 0z"
          fill="#f6f1e6"
          stroke={UMRISS}
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      )}

      {/* ------------------------------------------------------------ Kopf */}
      <g transform={springt ? "rotate(-4 50 40)" : undefined}>
        <path d="M44 55 h12 v11 h-12z" fill={HAUT_SCHATTEN} />
        <ellipse
          cx="50"
          cy="37"
          rx="23"
          ry="24"
          fill={HAUT}
          stroke={UMRISS}
          strokeWidth="1.5"
        />
        {/* Ohren */}
        <ellipse cx="27" cy="40" rx="4.2" ry="5.4" fill={HAUT} stroke={UMRISS} strokeWidth="1.2" />
        <ellipse cx="73" cy="40" rx="4.2" ry="5.4" fill={HAUT} stroke={UMRISS} strokeWidth="1.2" />

        {/* struppiges Haar */}
        <path
          d="M27 32 q1 -18 16 -22 q4 -4 10 -2 q3 -5 8 -2 q13 3 12 17 q1 6 -1 11
             q-3 -7 -9 -9 q-14 3 -25 -1 q-6 2 -9 9 q-2 -1 -2 -1z"
          fill={HAAR}
          stroke={HAAR_TIEF}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path
          d="M43 10 q-2 -6 4 -8 q-1 5 2 7z M60 8 q4 -5 8 -1 q-4 1 -5 5z"
          fill={HAAR}
        />

        {/* Augen */}
        {augenZu ? (
          <>
            <path
              d="M36 39 q5 4 10 0"
              fill="none"
              stroke={UMRISS}
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M54 39 q5 4 10 0"
              fill="none"
              stroke={UMRISS}
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </>
        ) : (
          <>
            <ellipse cx="41" cy="38" rx="4.4" ry="5" fill="#fff" />
            <ellipse cx="59" cy="38" rx="4.4" ry="5" fill="#fff" />
            <circle cx="41.6" cy="38.6" r="2.9" fill="#4a3122" />
            <circle cx="59.6" cy="38.6" r="2.9" fill="#4a3122" />
            <circle cx="42.7" cy="37.2" r="1.1" fill="#fff" />
            <circle cx="60.7" cy="37.2" r="1.1" fill="#fff" />
          </>
        )}

        {/* Augenbrauen */}
        <path
          d="M36 31 q5 -2.5 9 -0.5"
          fill="none"
          stroke={HAAR_TIEF}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M55 30.5 q4 -2 9 0.5"
          fill="none"
          stroke={HAAR_TIEF}
          strokeWidth="1.6"
          strokeLinecap="round"
        />

        {/* Nase und Mund */}
        <path
          d="M50 42 q2 3 -0.5 4.5"
          fill="none"
          stroke={HAUT_SCHATTEN}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M43 50 q7 6 14 0"
          fill="none"
          stroke={UMRISS}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        {/* Wangen */}
        <ellipse cx="33" cy="46" rx="4" ry="2.6" fill="#f2a58a" opacity="0.55" />
        <ellipse cx="67" cy="46" rx="4" ry="2.6" fill="#f2a58a" opacity="0.55" />
      </g>
    </svg>
  );
}
