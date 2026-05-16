"use client";

import { useMemo } from "react";

// =============================================================================
// AsteroidRadar
// -----------------------------------------------------------------------------
// Radar HUD-style con:
//  - 4 cerchi di distanza (1, 10, 30, 50 LD)
//  - Terra al centro, Luna in orbita lenta
//  - Sweep ambra che ruota in senso orario
//  - Asteroidi posizionati per distanza reale (raggio) e ID (angolo)
//  - Annotazioni HUD ai 4 angoli
//
// Tutti i colori passano da CSS vars di globals.css.
// L'unico "trucco" è nei gradient SVG: <stop stopColor="var(...)"> non
// funziona su Safari, quindi usiamo style={{ stopColor: 'var(...)' }}.
// =============================================================================

// ----- Costanti geometriche -----
// Le BANDS legano LD ↔ raggio in pixel del viewBox.
// Usando interpolazione lineare a tratti, un asteroide a esattamente N LD
// finisce esattamente sul cerchio che riporta "N LD" come etichetta.
// Le posizioni sono scelte "a occhio" per dare densità a ridosso della Luna
// e respiro nella periferia (effetto log-like senza essere log reale).
// Configurazione scala del radar

const RADAR = {
  innerRadius: 40, // raggio del cerchio "1 LD" (orbita Luna)
  outerRadius: 230, // raggio del cerchio esterno (range massimo)
  minLD: 1, // distanza al cerchio più interno
  maxLD: 50, // distanza al cerchio esterno (RANGE 50 LD)
};

// Etichette dei cerchi di distanza da mostrare graficamente
const LABEL_DISTANCES = [1, 10, 30, 50];

const EARTH_RADIUS = 22; // raggio della "sfera" Terra al centro
const ASTEROID_SIZE_SAFE = 3; // raggio del puntino se sicuro
const ASTEROID_SIZE_PHA = 5; // raggio del puntino se pericoloso

// 1 AU ≈ 389 LD (la NASA a volte restituisce solo astronomical)
const AU_TO_LD = 389;

// ----- Helpers -----

/**
 * Converte una distanza in LD nel raggio SVG corrispondente.
 *
 * Usa scala logaritmica inversa: gli asteroidi vicini (1-10 LD) occupano
 * proporzionalmente più spazio del radar, gli asteroidi lontani (30-50 LD)
 * vengono compressi verso il bordo. Questo bilancia visivamente la
 * distribuzione reale degli asteroidi NEO, che sono concentrati a 20-50 LD.
 *
 * Mapping verificato:
 *   1 LD  → 40px  (cerchio Luna)
 *   10 LD → ~152px
 *   30 LD → ~205px
 *   50 LD → 230px (bordo esterno)
 */
function distanceToRadius(ld) {
  // Clamp ai limiti
  if (ld <= RADAR.minLD) return RADAR.innerRadius;
  if (ld >= RADAR.maxLD) return RADAR.outerRadius;

  // Scala log: t va da 0 (a minLD) a 1 (a maxLD)
  const t = Math.log10(ld) / Math.log10(RADAR.maxLD);
  return RADAR.innerRadius + t * (RADAR.outerRadius - RADAR.innerRadius);
}

/**
 * Estrae la distanza in LD dall'oggetto asteroide.
 * Restituisce null se non disponibile (l'asteroide verrà filtrato fuori).
 */
function extractDistanceLD(asteroid) {
  const approach = asteroid.close_approach_data?.[0];
  if (!approach) return null;

  // Caso 1: NASA fornisce già LD
  const ld = approach.miss_distance?.lunar;
  if (ld != null) {
    const v = parseFloat(ld);
    return Number.isFinite(v) ? v : null;
  }

  // Caso 2: NASA fornisce solo AU → convertiamo
  const au = approach.miss_distance?.astronomical;
  if (au != null) {
    const v = parseFloat(au) * AU_TO_LD;
    return Number.isFinite(v) ? v : null;
  }

  return null;
}

/**
 * Calcola l'angolo di un asteroide in modo deterministico ma "ben distribuito".
 * Usa l'angolo aureo (137.5°): moltiplicando un intero progressivo per 137.5°,
 * gli angoli risultanti riempiono il cerchio in modo molto uniforme (è la
 * stessa tecnica con cui i girasoli dispongono i semi).
 *
 * Sorgente del numero "seed": ultime 3 cifre del neo_reference_id, oppure
 * l'indice se l'ID manca o non è numerico.
 */
function computeAngleDeg(asteroid, index) {
  // Usiamo l'indice progressivo come seed: l'angolo aureo applicato a
  // numeri sequenziali (0, 1, 2, 3...) distribuisce i punti in modo
  // visivamente perfetto sul cerchio. È la stessa tecnica che usano i
  // girasoli per disporre i semi (phyllotaxis).
  return (index * 137.5) % 360;
}

// =============================================================================
// COMPONENTE
// =============================================================================
export const AsteroidRadar = ({ asteroids, startDate, endDate }) => {
  // Precalcolo tutto in un solo useMemo: distanza, angolo, posizione cartesiana.
  // Filtro fuori gli asteroidi senza distanza valida (meglio escluderli che
  // mostrarli a un valore arbitrario che confonderebbe il lettore).
  // Ordino dal più lontano al più vicino: i vicini vengono disegnati per ultimi
  // quindi finiscono "sopra" agli altri nello stacking SVG.
  const processedAsteroids = useMemo(() => {
    return asteroids
      .map((a, i) => {
        const ld = extractDistanceLD(a);
        if (ld == null) return null;

        const r = distanceToRadius(ld);
        const angleDeg = computeAngleDeg(a, i);
        const angleRad = (angleDeg * Math.PI) / 180;

        return {
          id: a.id ?? `idx-${i}`,
          isPHA: a.is_potentially_hazardous_asteroid,
          ld,
          // Arrotondiamo a 2 decimali per evitare hydration mismatch: i calcoli
          // trigonometrici producono float con 15+ cifre, e la serializzazione
          // server e client a volte produce stringhe diverse per lo stesso numero.
          // 2 decimali sono ampiamente sufficienti per il posizionamento SVG.
          x: Number((Math.cos(angleRad) * r).toFixed(2)),
          y: Number((Math.sin(angleRad) * r).toFixed(2)),
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.ld - a.ld); // più lontani prima, vicini sopra
  }, [asteroids]);

  // Contatori per la HUD
  const totalCount = processedAsteroids.length;
  const phaCount = processedAsteroids.filter((a) => a.isPHA).length;

  return (
    <div className="relative w-full aspect-square max-w-[500px]">
      <style>{`
        @keyframes radar-sweep {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes radar-moon-orbit {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

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

        {/* === Cerchi di distanza ===
    Generati dalla scala log inversa, le etichette in LABEL_DISTANCES
    determinano sia cerchi che testo. Il cerchio più esterno (50 LD) è
    più visibile, gli interni più tenui. */}
        {LABEL_DISTANCES.map((ld, i) => {
          const r = distanceToRadius(ld);
          const isOutermost = i === LABEL_DISTANCES.length - 1;
          return (
            <circle
              key={`band-${ld}`}
              cx="0"
              cy="0"
              r={r}
              stroke="var(--border-strong)"
              fill="none"
              strokeWidth="1"
              opacity={isOutermost ? 1 : 0.4}
            />
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

        {/* === Etichette di distanza ===
            Posizionate appena sopra ai rispettivi cerchi sul lato N. */}
        {LABEL_DISTANCES.filter((ld) => ld !== RADAR.maxLD).map((ld) => {
          const r = distanceToRadius(ld);
          return (
            <text
              key={`label-${ld}`}
              x="0"
              y={-(r + 5)}
              textAnchor="middle"
              fontSize="8"
              opacity={0.6}
              fill="var(--muted-foreground)"
              fontFamily="monospace"
            >
              {ld} LD
            </text>
          );
        })}
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

        {/* === Asteroidi ===
            Fissi, ordinati dal più lontano al più vicino così i vicini
            stanno sopra nello stacking. */}
        {processedAsteroids.map((a) => (
          <g key={a.id}>
            {a.isPHA && (
              <circle
                cx={a.x}
                cy={a.y}
                r={10}
                fill="none"
                stroke="var(--primary)"
                strokeWidth="1"
                opacity={0.3}
              />
            )}
            <circle
              cx={a.x}
              cy={a.y}
              r={a.isPHA ? ASTEROID_SIZE_PHA : ASTEROID_SIZE_SAFE}
              fill={a.isPHA ? "var(--primary)" : "var(--chart-3)"}
              opacity={0.9}
            />
          </g>
        ))}

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

        {/* === Sweep del radar ===
            10s/giro in senso orario. Sopra agli asteroidi così "passa sopra".
            Il path del settore è geometricamente preciso: 30° di apertura
            centrati sull'asse +X. Calcoli:
              ±15° = ±0.2618 rad
              x = 230 * cos(15°) ≈ 222.16
              y = 230 * sin(15°) ≈ 59.53 */}
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
