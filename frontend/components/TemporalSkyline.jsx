"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MONTHS_IT } from "@/lib/utils";

// =============================================================================
// TemporalSkyline
// -----------------------------------------------------------------------------
// Visualizza gli asteroidi della settimana come "skyline" temporale:
//   - 7 colonne, una per ogni giorno del range
//   - asse Y: distanza minima dalla Terra in scala log inversa
//     (più alto = più vicino → drammatico)
//   - larghezza punto: diametro stimato in scala log
//   - colore: ambra se hazardous, muted altrimenti
//   - linea tratteggiata: riferimento "1 LD" (Luna) come scala umana
//   - hover: focus dell'asteroide, dim degli altri
//   - click: naviga alla pagina dettaglio
// =============================================================================

const LUNAR_DISTANCE_KM = 384_400;

// viewBox del grafico — coordinate "logiche" su cui calcolare le posizioni.
// L'SVG poi si scala a piacere via CSS mantenendo le proporzioni.
const VB = { w: 800, h: 500 };
const PAD = { top: 40, right: 24, bottom: 56, left: 24 };

// Plot area (dove vivono i punti)
const PLOT = {
  x: PAD.left,
  y: PAD.top,
  w: VB.w - PAD.left - PAD.right,
  h: VB.h - PAD.top - PAD.bottom,
};

// ----- Helpers di scala -----

// Distanza min → y (scala log inversa: più piccola = più alto)
function scaleY(km, minKm, maxKm) {
  const logKm = Math.log10(km);
  const logMin = Math.log10(minKm);
  const logMax = Math.log10(maxKm);
  // Normalizzato 0–1 sull'estensione log
  const t = (logKm - logMin) / (logMax - logMin);
  // Inverso: distanza piccola → t piccolo → barra alta
  return PLOT.y + t * PLOT.h;
}

// Diametro → spessore della "barra/punto"
function scaleSize(diameterM, minM, maxM) {
  const logD = Math.log10(Math.max(diameterM, 1));
  const logMin = Math.log10(Math.max(minM, 1));
  const logMax = Math.log10(maxM);
  const t = (logD - logMin) / Math.max(logMax - logMin, 0.001);
  // Spessore tra 4 e 16 pixel
  return 4 + t * 12;
}

// Diff in giorni tra due date ISO (YYYY-MM-DD)
function dayDiff(startIso, isoDate) {
  const a = new Date(startIso + "T00:00:00Z").getTime();
  const b = new Date(isoDate + "T00:00:00Z").getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

// ISO date "+N giorni"
function addDays(startIso, n) {
  const d = new Date(startIso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

// "5", "12" — singolo numero del giorno per le label asse X
function dayLabel(date) {
  const day = date.getUTCDate();
  const month = MONTHS_IT[date.getUTCMonth()].slice(0, 3);
  return { day, month };
}

// =============================================================================
// COMPONENTE
// =============================================================================
export function TemporalSkyline({ asteroids, startDate, endDate }) {
  const router = useRouter();
  const [hoveredId, setHoveredId] = useState(null);

  // ---- Precalcolo punti ----
  const { points, days, yLuna, dayLabels, yRangeKm } = useMemo(() => {
    // Numero di giorni nel range (inclusivo)
    const totalDays = dayDiff(startDate, endDate) + 1;

    // Estremi per le scale
    let minKm = Infinity;
    let maxKm = -Infinity;
    let minD = Infinity;
    let maxD = -Infinity;

    const enriched = asteroids
      .map((a) => {
        const cad = a.close_approach_data?.[0];
        if (!cad) return null;
        const km = Number(cad.miss_distance?.kilometers);
        if (!Number.isFinite(km) || km <= 0) return null;
        const dMin = a.estimated_diameter?.kilometers?.estimated_diameter_min ?? 0;
        const dMax = a.estimated_diameter?.kilometers?.estimated_diameter_max ?? 0;
        const dMeters = ((dMin + dMax) / 2) * 1000;
        const dayIdx = dayDiff(startDate, cad.close_approach_date);
        if (dayIdx < 0 || dayIdx >= totalDays) return null;

        minKm = Math.min(minKm, km);
        maxKm = Math.max(maxKm, km);
        minD = Math.min(minD, dMeters);
        maxD = Math.max(maxD, dMeters);

        return {
          id: a.id,
          name: a.name.replace(/[()]/g, ""),
          hazardous: a.is_potentially_hazardous_asteroid,
          km,
          dMeters,
          dayIdx,
        };
      })
      .filter(Boolean);

    // Includo la Luna nello yRange così la linea di riferimento è sempre dentro
    const yMin = Math.min(minKm, LUNAR_DISTANCE_KM) * 0.85;
    const yMax = maxKm * 1.1;

    // Larghezza di una colonna giorno
    const colWidth = PLOT.w / totalDays;

    // Raggruppo per giorno per calcolare il "jitter" interno
    const byDay = {};
    for (const p of enriched) {
      (byDay[p.dayIdx] ||= []).push(p);
    }

    // Per ogni asteroide calcolo x,y,size
    const points = [];
    for (const [dayStr, list] of Object.entries(byDay)) {
      const dayIdx = Number(dayStr);
      const colCenter = PLOT.x + (dayIdx + 0.5) * colWidth;
      // Sotto-slot dentro la colonna: distribuiti su una banda del 60% colWidth
      const band = colWidth * 0.6;
      list.forEach((p, i) => {
        const offset =
          list.length === 1
            ? 0
            : -band / 2 + (i * band) / (list.length - 1);
        points.push({
          ...p,
          x: colCenter + offset,
          y: scaleY(p.km, yMin, yMax),
          size: scaleSize(p.dMeters, minD || 1, maxD || 1),
        });
      });
    }

    // Y della linea Luna
    const yLuna = scaleY(LUNAR_DISTANCE_KM, yMin, yMax);

    // Days array (per le label asse X)
    const days = Array.from({ length: totalDays }, (_, i) => {
      return { idx: i, date: addDays(startDate, i) };
    });

    const dayLabels = days.map((d) => ({
      ...d,
      ...dayLabel(d.date),
      colCenter: PLOT.x + (d.idx + 0.5) * colWidth,
    }));

    return {
      points,
      days,
      yLuna,
      dayLabels,
      yRangeKm: { min: yMin, max: yMax },
    };
  }, [asteroids, startDate, endDate]);

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${VB.w} ${VB.h}`}
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
        aria-label="Skyline temporale degli asteroidi della settimana"
        role="img"
      >
        {/* ===== Linea Luna (riferimento orizzontale) ===== */}
        <line
          x1={PLOT.x}
          x2={PLOT.x + PLOT.w}
          y1={yLuna}
          y2={yLuna}
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="2 4"
          className="text-border"
        />
        <text
          x={PLOT.x + PLOT.w - 4}
          y={yLuna - 6}
          textAnchor="end"
          className="fill-muted-foreground"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Distanza Luna · 1 LD
        </text>

        {/* ===== Barre + punti per ogni asteroide ===== */}
        {points.map((p) => {
          const isHovered = hoveredId === p.id;
          const isDimmed = hoveredId !== null && !isHovered;
          const fill = p.hazardous ? "var(--primary)" : "var(--muted-foreground)";
          const opacity = isDimmed ? 0.2 : 1;

          return (
            <g
              key={p.id}
              style={{ cursor: "pointer", transition: "opacity 150ms" }}
              opacity={opacity}
              onMouseEnter={() => setHoveredId(p.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => router.push(`/asteroids/${p.id}`)}
            >
              {/* Linea verticale dal "pavimento" al punto */}
              <line
                x1={p.x}
                x2={p.x}
                y1={PLOT.y + PLOT.h}
                y2={p.y}
                stroke={fill}
                strokeWidth={isHovered ? 2 : 1}
                opacity={isHovered ? 1 : 0.4}
              />
              {/* Punto in cima */}
              <circle
                cx={p.x}
                cy={p.y}
                r={p.size / 2}
                fill={fill}
              />
              {/* Alone solo per hazardous */}
              {p.hazardous && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={p.size}
                  fill="none"
                  stroke={fill}
                  strokeWidth="1"
                  opacity="0.3"
                />
              )}
              {/* Etichetta su hover */}
              {isHovered && (
                <g>
                  <text
                    x={p.x}
                    y={p.y - p.size - 8}
                    textAnchor="middle"
                    className="fill-foreground"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      fontWeight: 500,
                    }}
                  >
                    {p.name}
                  </text>
                  <text
                    x={p.x}
                    y={p.y - p.size - 22}
                    textAnchor="middle"
                    className="fill-muted-foreground"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 9,
                      letterSpacing: "0.05em",
                    }}
                  >
                    ×{(p.km / LUNAR_DISTANCE_KM).toFixed(1)} LD · ⌀ {Math.round(p.dMeters)}m
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* ===== Asse X: label giorni ===== */}
        {dayLabels.map((d) => (
          <g key={d.idx}>
            <text
              x={d.colCenter}
              y={PLOT.y + PLOT.h + 24}
              textAnchor="middle"
              className="fill-foreground"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {d.day}
            </text>
            <text
              x={d.colCenter}
              y={PLOT.y + PLOT.h + 40}
              textAnchor="middle"
              className="fill-muted-foreground"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {d.month}
            </text>
          </g>
        ))}

        {/* ===== Baseline (linea orizzontale del "pavimento") ===== */}
        <line
          x1={PLOT.x}
          x2={PLOT.x + PLOT.w}
          y1={PLOT.y + PLOT.h}
          y2={PLOT.y + PLOT.h}
          stroke="currentColor"
          strokeWidth="1"
          className="text-border"
        />
      </svg>

      {/* Legenda esterna all'SVG (più semplice da stilare con Tailwind) */}
      <div className="flex items-center justify-between mt-4 text-meta">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            Pericoloso
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-muted-foreground" />
            Sicuro
          </span>
        </div>
        <span>Altezza · vicinanza alla Terra · Larghezza · diametro stimato</span>
      </div>
    </div>
  );
}