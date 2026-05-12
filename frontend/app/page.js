import { AsteroidsCardDashboard } from "@/components/AsteroidsCardDashboard";
import { compareSize } from "@/lib/sizeComparators";
import {
  getLastWeekRange,
  formatDateRange,
  formatDateLong,
  formatKm,
  lunarDistanceLabel,
} from "@/lib/utils";
import { TemporalSkyline } from "@/components/TemporalSkyline";

export default async function Dashboard() {
  const dates = getLastWeekRange();

  let asteroids = [];
  let fetchError = null;
  try {
    const res = await fetch(
      `http://localhost:8000/neo/feed?start_date=${dates.startDate}&end_date=${dates.endDate}`,
      { cache: "no-store" },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    asteroids = data.asteroids ?? [];
  } catch (err) {
    fetchError = err.message;
  }

  // -------- Stato di errore --------
  if (fetchError) {
    return (
      <main className="mx-auto max-w-7xl px-8 py-20">
        <p className="text-eyebrow mb-6">Bollettino · Errore di connessione</p>
        <h1>Il servizio non è raggiungibile.</h1>
        <p className="text-lede mt-6">
          Non sono riuscito a contattare il backend. Verifica che il server
          FastAPI sia in esecuzione su{" "}
          <code className="font-mono text-foreground">localhost:8000</code>,
          oppure riprova tra qualche istante.
        </p>
        <p className="text-meta mt-8">Dettaglio tecnico · {fetchError}</p>
      </main>
    );
  }

  // -------- Stato vuoto --------
  if (asteroids.length === 0) {
    return (
      <main className="mx-auto max-w-7xl px-8 py-20">
        <p className="text-eyebrow mb-6">
          Bollettino · {formatDateRange(dates.startDate, dates.endDate)}
        </p>
        <h1>Nessun asteroide in questo intervallo.</h1>
        <p className="text-lede mt-6">
          La NASA non ha registrato avvicinamenti significativi nel periodo
          selezionato. Prova ad allargare il range nella sezione{" "}
          <em>Esplora</em>.
        </p>
      </main>
    );
  }

  // -------- Calcoli derivati --------
  const total = asteroids.length;
  const hazardousCount = asteroids.filter(
    (a) => a.is_potentially_hazardous_asteroid,
  ).length;

  // Closest = primo della lista (backend ordina per distanza crescente)
  const closest = asteroids[0];
  const closestKm = Number(
    closest.close_approach_data[0].miss_distance.kilometers,
  );

  // Largest = asteroide con diametro_max massimo
  const largest = asteroids.reduce((best, a) => {
    const max = a.estimated_diameter.kilometers.estimated_diameter_max;
    const bestMax = best.estimated_diameter.kilometers.estimated_diameter_max;
    return max > bestMax ? a : best;
  }, asteroids[0]);
  const largestDiameterMeters =
    ((largest.estimated_diameter.kilometers.estimated_diameter_min +
      largest.estimated_diameter.kilometers.estimated_diameter_max) /
      2) *
    1000;
  const largestSize = compareSize(largestDiameterMeters, largest.id);

  return (
    <main className="mx-auto max-w-7xl px-8 py-16 flex flex-col gap-20">
      {/* ===== HERO ===== */}
      <section className="grid grid-cols-[1.1fr_1fr] gap-12 items-start">
        <div className="flex flex-col gap-8">
          <p className="text-eyebrow">
            Bollettino · {formatDateRange(dates.startDate, dates.endDate)} ·
            Settimana corrente
          </p>

          <h1 className="max-w-[18ch]">
            Questa settimana,{" "}
            <em className="text-primary not-italic font-normal italic">
              {total} {total === 1 ? "asteroide" : "asteroidi"}
            </em>{" "}
            {total === 1 ? "sfiorerà" : "sfioreranno"} la Terra.
          </h1>

          <p className="text-lede">
            {hazardousCount > 0 ?
              <>
                Di questi,{" "}
                <strong>
                  {hazardousCount}{" "}
                  {hazardousCount === 1 ?
                    "è classificato"
                  : "sono classificati"}{" "}
                  come potenzialmente{" "}
                  {hazardousCount === 1 ? "pericoloso" : "pericolosi"}
                </strong>{" "}
                dal Center for Near-Earth Object Studies della NASA. Il più
                vicino, <strong>{closest.name.replace(/[()]/g, "")}</strong>,
                passerà a una distanza pari a{" "}
                <strong>
                  {lunarDistanceLabel(closestKm).replace("×", "")} di distanza
                </strong>
                .
              </>
            : <>
                Nessuno è classificato come potenzialmente pericoloso dal Center
                for Near-Earth Object Studies della NASA. Il più vicino,{" "}
                <strong>{closest.name.replace(/[()]/g, "")}</strong>, passerà a
                una distanza pari a{" "}
                <strong>
                  {lunarDistanceLabel(closestKm).replace("×", "")} di distanza
                </strong>
                .
              </>
            }
          </p>
        </div>
        <div className="pt-12">
          <TemporalSkyline
            asteroids={asteroids}
            startDate={dates.startDate}
            endDate={dates.endDate}
          />
        </div>
      </section>

      {/* ===== KPI ===== */}
      <section className="grid grid-cols-3 gap-px bg-border border border-border">
        {/* KPI 1: Asteroide più vicino */}
        <article className="bg-card px-8 py-7 flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="text-label">Asteroide più vicino</span>
            <span className="text-meta">
              {formatDateLong(
                closest.close_approach_data[0].close_approach_date,
              )}
            </span>
          </div>
          <div className="text-data-lg">
            {formatKm(closestKm)}
            <span className="font-mono text-sm text-muted-foreground ml-2 font-normal">
              km
            </span>
          </div>
          <p className="text-sm text-muted-foreground !leading-snug !mt-0">
            <span className="text-primary font-medium">
              {lunarDistanceLabel(closestKm)}
            </span>
            {" · "}
            <span className="text-foreground">
              {closest.name.replace(/[()]/g, "")}
            </span>
          </p>
        </article>

        {/* KPI 2: Asteroidi totali */}
        <article className="bg-card px-8 py-7 flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="text-label">Asteroidi tracciati</span>
            <span className="text-meta">7 giorni</span>
          </div>
          <div className="text-data-lg">{total}</div>
          <p className="text-sm text-muted-foreground !leading-snug !mt-0">
            {hazardousCount > 0 ?
              <>
                Di cui{" "}
                <span className="text-primary font-medium">
                  {hazardousCount} potenzialmente{" "}
                  {hazardousCount === 1 ? "pericoloso" : "pericolosi"}
                </span>
              </>
            : <span className="text-foreground">
                Nessuno potenzialmente pericoloso
              </span>
            }
          </p>
        </article>

        {/* KPI 3: Più grande in transito */}
        <article className="bg-card px-8 py-7 flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="text-label">Più grande in transito</span>
            <span className="text-meta">
              ⌀ ≈ {Math.round(largestDiameterMeters)}m
            </span>
          </div>
          <div className="text-data-lg truncate">
            {largest.name.replace(/[()]/g, "")}
          </div>
          {largestSize && !largestSize.parts.fallback && (
            <p className="text-sm font-mono !leading-snug !mt-0 flex items-baseline gap-1">
              {largestSize.parts.prefix && (
                <span className="text-muted-foreground">
                  {largestSize.parts.prefix}
                </span>
              )}
              <span className="text-primary font-medium">
                {largestSize.parts.mult}
              </span>
              <span className="text-foreground">{largestSize.parts.label}</span>
            </p>
          )}
          {largestSize?.parts.fallback && (
            <p className="text-sm text-muted-foreground italic !leading-snug !mt-0">
              {largestSize.parts.fallback}
            </p>
          )}
        </article>
      </section>

      {/* ===== SECTION: I più vicini ===== */}
      <section className="flex flex-col gap-8">
        <div className="flex items-end justify-between">
          <h2 className="max-w-[20ch]">
            In avvicinamento.
            <br />I prossimi sette giorni.
          </h2>
          <div className="text-meta text-right">
            <span className="block text-foreground font-mono text-sm normal-case tracking-normal mb-1">
              {total} {total === 1 ? "oggetto tracciato" : "oggetti tracciati"}
            </span>
            <span>{formatDateRange(dates.startDate, dates.endDate)}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {asteroids.slice(0, 3).map((asteroid) => (
            <AsteroidsCardDashboard key={asteroid.id} asteroid={asteroid} />
          ))}
        </div>
      </section>
    </main>
  );
}
