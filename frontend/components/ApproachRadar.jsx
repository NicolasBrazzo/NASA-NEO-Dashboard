"use client";

import { useMemo } from "react";
import { formatDateIt } from "@/lib/utils";

// =============================================================================
// ApproachRadar
// -----------------------------------------------------------------------------

const RADAR = {
  innerRadius: 40, // raggio del cerchio "1 LD" (orbita Luna)
  outerRadius: 230, // raggio del cerchio esterno (range massimo)
};

const EARTH_RADIUS = 22; // raggio della "sfera" Terra al centro
const ASTEROID_SIZE_SAFE = 3; // raggio del puntino se sicuro
const ASTEROID_SIZE_PHA = 5; // raggio del puntino se pericoloso

// ----- Helpers -----
function distanceToRadius(km, minKm, maxKm) {
  if (maxKm === minKm) {
    return (RADAR.innerRadius + RADAR.outerRadius) / 2;
  }
  const t = (km - minKm) / (maxKm - minKm);
  return RADAR.innerRadius + t * (RADAR.outerRadius - RADAR.innerRadius);
}

function formatScaleKm(km) {
  if (km >= 1_000_000) return `${(km / 1_000_000).toFixed(1)}M km`;
  if (km >= 1_000) return `${Math.round(km / 1_000)}k km`;
  return `${Math.round(km)} km`;
}

// =============================================================================
// COMPONENTE
// =============================================================================
export const ApproachRadar = ({ approaches }) => {
  const processedAsteroids = useMemo(() => {
    const distances = approaches.map((a) => Number(a.miss_distance.kilometers));
    const minKm = Math.min(...distances);
    const maxKm = Math.max(...distances);

    const today = new Date().toISOString().split("T")[0];
    const nextIndex = approaches.findIndex(
      (a) => a.close_approach_date >= today,
    );

    return approaches.map((approach, i) => {
      const km = Number(approach.miss_distance.kilometers);

      let r = distanceToRadius(km, minKm, maxKm);

      // Angolo aureo sull'indice cronologico
      const angleDeg = (i * 137.5) % 360;
      const angleRad = (angleDeg * Math.PI) / 180;

      return {
        id: `approach-${i}`,
        date: approach.close_approach_date,
        km,
        x: Number((Math.cos(angleRad) * r).toFixed(2)),
        y: Number((Math.sin(angleRad) * r).toFixed(2)),
        isNext: i === nextIndex,
        isPast: approach.close_approach_date < today,
      };
    });
  }, [approaches]);

  const scaleKm = useMemo(() => {
    if (approaches.length === 0) return { min: 0, mid: 0, max: 0 };
    const distances = approaches.map((a) => Number(a.miss_distance.kilometers));
    const min = Math.min(...distances);
    const max = Math.max(...distances);
    const mid = (min + max) / 2;
    return { min, mid, max };
  }, [approaches]);

  // Contatori per la HUD
  const totalCount = processedAsteroids.length;
  const phaCount = processedAsteroids.filter((a) => a.isPHA).length;

  return (
    <div className="relative w-full aspect-square max-w-125">
      <svg viewBox="-250 -250 500 500" className="w-full h-full">
        <defs>
          {/* === Gradiente Terra ===
              Luce simulata dall'alto-sinistra (cx=30%, cy=30%).
              I colori dei "blu Terra" stanno in chart-4 e chart-3 del sistema. */}
          <radialGradient id="earthGrad" cx="30%" cy="30%">
            <stop
              offset="0%"
              style={{ stopColor: "var(--chart-3)", stopOpacity: 1 }}
            />
            <stop
              offset="100%"
              style={{ stopColor: "var(--chart-4)", stopOpacity: 1 }}
            />
          </radialGradient>

          {/* === Gradiente sweep ===
              Trasparente al centro → ambra pieno al bordo.
              Tutto ruota col <g> che lo contiene. */}
          <linearGradient id="sweepGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop
              offset="0%"
              style={{ stopColor: "var(--primary)", stopOpacity: 0 }}
            />
            <stop
              offset="30%"
              style={{ stopColor: "var(--primary)", stopOpacity: 0.1 }}
            />
            <stop
              offset="70%"
              style={{ stopColor: "var(--primary)", stopOpacity: 0.4 }}
            />
            <stop
              offset="100%"
              style={{ stopColor: "var(--primary)", stopOpacity: 0.9 }}
            />
          </linearGradient>

          {/* === Filter glow ===
              Sfocatura gaussiana + merge con originale → alone luminoso.
              Usato per la linea principale dello sweep e la punta. */}
          <filter id="radarGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* === Sfondo scuro circolare del radar === */}
        <circle cx="0" cy="0" r="240" fill="var(--background)" opacity={0.5} />

        {/* === Cerchi di distanza + label dinamici (min / mid / max) === */}
        {[
          { km: scaleKm.min, label: formatScaleKm(scaleKm.min) },
          { km: scaleKm.mid, label: formatScaleKm(scaleKm.mid) },
          { km: scaleKm.max, label: formatScaleKm(scaleKm.max) },
        ].map(({ km, label }, i, arr) => {
          const r = distanceToRadius(km, scaleKm.min, scaleKm.max);
          const isOutermost = i === arr.length - 1;
          return (
            <g key={`scale-${i}`}>
              <circle
                cx="0"
                cy="0"
                r={r}
                stroke="var(--border-strong)"
                fill="none"
                strokeWidth="1"
                opacity={isOutermost ? 1 : 0.4}
              />
              <text
                x="0"
                y={-(r + 5)}
                textAnchor="middle"
                fontSize="8"
                opacity={0.6}
                fill="var(--muted-foreground)"
                fontFamily="monospace"
              >
                {label}
              </text>
            </g>
          );
        })}
        {/* === Assi cardinali === */}
        <line
          x1="-230"
          y1="0"
          x2="230"
          y2="0"
          stroke="var(--border-strong)"
          strokeWidth="1"
          opacity={0.2}
        />
        <line
          x1="0"
          y1="-230"
          x2="0"
          y2="230"
          stroke="var(--border-strong)"
          strokeWidth="1"
          opacity={0.2}
        />

        {/* === Punti cardinali ===
            In muted-foreground, non ambra: l'accent è riservato a sweep e PHA. */}
        <text
          x="0"
          y="-240"
          textAnchor="middle"
          fontSize="11"
          fontFamily="monospace"
          fontWeight="bold"
          fill="var(--muted-foreground)"
        >
          N
        </text>
        <text
          x="240"
          y="4"
          textAnchor="middle"
          fontSize="11"
          fontFamily="monospace"
          fontWeight="bold"
          fill="var(--muted-foreground)"
        >
          E
        </text>
        <text
          x="0"
          y="248"
          textAnchor="middle"
          fontSize="11"
          fontFamily="monospace"
          fontWeight="bold"
          fill="var(--muted-foreground)"
        >
          S
        </text>
        <text
          x="-240"
          y="4"
          textAnchor="middle"
          fontSize="11"
          fontFamily="monospace"
          fontWeight="bold"
          fill="var(--muted-foreground)"
        >
          W
        </text>

        {/* === Terra al centro con aloni concentrici === */}
        <circle cx="0" cy="0" r={EARTH_RADIUS} fill="url(#earthGrad)" />
        <circle
          cx="0"
          cy="0"
          r={EARTH_RADIUS + 2}
          fill="none"
          stroke="var(--chart-3)"
          strokeWidth="1"
          opacity={0.3}
        />
        <circle
          cx="0"
          cy="0"
          r={EARTH_RADIUS + 6}
          fill="none"
          stroke="var(--chart-3)"
          strokeWidth="0.5"
          opacity={0.15}
        />

        {/* === Luna in orbita ===
            Sul cerchio 1 LD (r=40), ruota lenta (60s/giro) in senso orario.
            transformOrigin '0 0' = centro del viewBox = Terra. */}
        <g
          style={{
            transformOrigin: "0px 0px",
            animation: "radar-moon-orbit 60s linear infinite",
          }}
        >
          <circle
            cx={RADAR.innerRadius}
            cy="0"
            r="5"
            fill="var(--moon, #D4CFC0)"
            opacity={0.9}
          />
          <circle
            cx={RADAR.innerRadius}
            cy="0"
            r="8"
            fill="none"
            stroke="var(--moon, #D4CFC0)"
            strokeWidth="0.5"
            opacity={0.2}
          />
        </g>

        {/* === Passaggi passati e futuri (non-prossimi) === */}
        {processedAsteroids
          .filter((a) => !a.isNext)
          .map((a) => (
            <circle
              key={a.id}
              cx={a.x}
              cy={a.y}
              r={ASTEROID_SIZE_SAFE}
              fill={a.isPast ? "var(--chart-3)" : "var(--muted-foreground)"}
              opacity={a.isPast ? 0.5 : 0.8}
            />
          ))}

        {/* === Prossimo passaggio futuro — disegnato per ultimo, sopra a tutti === */}
        {processedAsteroids
          .filter((a) => a.isNext)
          .map((a) => (
            <g key={a.id}>
              {/* Alone pulse */}
              <circle
                cx={a.x}
                cy={a.y}
                r="8"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="1.5"
                opacity="0"
                style={{ animation: "approach-pulse 2s ease-out infinite" }}
              />
              {/* Puntino principale */}
              <circle
                cx={a.x}
                cy={a.y}
                r={ASTEROID_SIZE_PHA}
                fill="var(--primary)"
                opacity={1}
              />
              {/* Label data */}
              <text
                x={a.x + 8}
                y={a.y - 8}
                fontSize="10"
                fill="var(--primary)"
                opacity={0.9}
              >
                NEXT · {formatDateIt(a.date)}
              </text>
            </g>
          ))}

        {/* === Sweep del radar === */}
        <g
          style={{
            transformOrigin: "0px 0px",
            animation: "radar-sweep 10s linear infinite",
          }}
        >
          <path
            d="M 0 0 L 222.16 -59.53 A 230 230 0 0 1 222.16 59.53 Z"
            fill="url(#sweepGrad)"
            opacity={0.5}
          />
          <line
            x1="0"
            y1="0"
            x2="235"
            y2="0"
            stroke="var(--primary)"
            strokeWidth="2.5"
            opacity={0.9}
            filter="url(#radarGlow)"
          />
          <circle
            cx="235"
            cy="0"
            r="4"
            fill="var(--primary)"
            opacity={1}
            filter="url(#radarGlow)"
          />
          <line
            x1="0"
            y1="0"
            x2="222.16"
            y2="-59.53"
            stroke="var(--primary)"
            strokeWidth="1"
            opacity={0.4}
          />
          <line
            x1="0"
            y1="0"
            x2="222.16"
            y2="59.53"
            stroke="var(--primary)"
            strokeWidth="1"
            opacity={0.4}
          />
        </g>

        {/* === HUD: in alto a sinistra === */}
        <text
          x="-235"
          y="-215"
          fontSize="10"
          fontFamily="monospace"
          fontWeight="bold"
          fill="var(--primary)"
        >
          ● SCOPE 01
        </text>
        <text
          x="-235"
          y="-202"
          fontSize="9"
          fontFamily="monospace"
          fill="var(--muted-foreground)"
        >
          RANGE 50 LD
        </text>

        {/* === HUD: in alto a destra === */}
        <text
          x="235"
          y="-215"
          textAnchor="end"
          fontSize="10"
          fontFamily="monospace"
          fill="var(--muted-foreground)"
        >
          {totalCount} TGT
        </text>
        <text
          x="235"
          y="-202"
          textAnchor="end"
          fontSize="10"
          fontFamily="monospace"
          fontWeight="bold"
          fill="var(--primary)"
        >
          {phaCount} PHA
        </text>

        {/* === HUD: in basso === */}
        <text
          x="-235"
          y="235"
          fontSize="8"
          fontFamily="monospace"
          fill="var(--text-faint)"
        >
          EARTH · GEOCENTRIC
        </text>
        <text
          x="235"
          y="235"
          textAnchor="end"
          fontSize="8"
          fontFamily="monospace"
          fill="var(--chart-3)"
        >
          ● LIVE
        </text>
      </svg>
    </div>
  );
};
