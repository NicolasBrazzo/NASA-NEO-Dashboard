"use client";

import { getLastWeekRange, getToday, parseApiError } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const CustomTooltipScatter = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 flex flex-col gap-1">
      <span className="text-label">{d?.date}</span>
      <span className="text-data">
        {(d?.distance / 1_000_000).toFixed(2)} M km
      </span>
    </div>
  );
};

const CustomTooltipPie = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 flex flex-col gap-1">
      <span className="text-label">{payload[0]?.name}</span>
      <span className="text-data">{payload[0]?.value} asteroidi</span>
    </div>
  );
};

export const StatsCharts = ({ initialData }) => {
  const [data, setData] = useState(initialData);
  const [dateFilter, setDateFilter] = useState(getLastWeekRange());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);

  const isFirstRender = useRef(true);

  const fetchAsteroidStats = async () => {
    const today = getToday();

    if (dateFilter.startDate > today || dateFilter.endDate > today) {
      setError("Le date non possono essere nel futuro.");
      setErrorStatus("validation");
      return;
    }
    if (dateFilter.startDate > dateFilter.endDate) {
      setError("La data di inizio deve essere precedente alla data di fine.");
      setErrorStatus("validation");
      return;
    }

    setLoading(true);
    setError(null);
    setErrorStatus(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/neo/stats?start_date=${dateFilter.startDate}&end_date=${dateFilter.endDate}`,
      );
      if (!res.ok) {
        const { message, status } = await parseApiError(res);
        setError(message);
        setErrorStatus(status);
        return;
      }
      const result = await res.json();
      setData(result);
    } catch {
      setError("Impossibile contattare il server. Verifica la connessione.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (dateFilter.startDate && dateFilter.endDate) {
      fetchAsteroidStats();
    }
  }, [dateFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const sortedData = [...(data?.distance_over_time || [])].sort(
    (a, b) => new Date(a.date) - new Date(b.date),
  );

  const kpis =
    data ?
      {
        total: data.hazardous_count + data.non_hazardous_count,
        hazardous: data.hazardous_count,
        hazardousPercent: (
          (data.hazardous_count /
            (data.hazardous_count + data.non_hazardous_count)) *
          100
        ).toFixed(0),
        closest:
          data.distance_over_time.length > 0 ?
            data.distance_over_time.reduce(
              (min, d) => (d.distance < min.distance ? d : min),
              data.distance_over_time[0],
            )
          : null,
        largeCount:
          data.size_distribution.find((s) => s.range === "1km+")?.count ?? 0,
      }
    : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Filtri date */}
      <div className="flex items-end gap-8 border-b border-border pb-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-eyebrow">Dal</span>
          <input
            type="date"
            value={dateFilter.startDate}
            max={getToday()}
            onChange={(e) =>
              setDateFilter((prev) => ({ ...prev, startDate: e.target.value }))
            }
            className="h-8 bg-transparent text-sm text-foreground font-mono
                 border-0 border-b border-border focus:outline-none
                 focus:border-foreground transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-eyebrow">Al</span>
          <input
            type="date"
            value={dateFilter.endDate}
            max={getToday()}
            onChange={(e) =>
              setDateFilter((prev) => ({ ...prev, endDate: e.target.value }))
            }
            className="h-8 bg-transparent text-sm text-foreground font-mono
                 border-0 border-b border-border focus:outline-none
                 focus:border-foreground transition-colors"
          />
        </div>
      </div>

      {/* KPI Strip */}
      {kpis && !error ?
        <section className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border">
          <article className="bg-card px-6 py-6 flex flex-col gap-2">
            <span className="text-label">Totale asteroidi</span>
            <div className="text-data-lg">{kpis.total}</div>
            <p className="text-sm text-muted-foreground leading-snug">
              Oggetti registrati nel periodo selezionato
            </p>
          </article>

          <article className="bg-card px-6 py-6 flex flex-col gap-2">
            <span className="text-label">Pericolosi</span>
            <div className="text-data-lg">
              {kpis.hazardous}
              <span className="font-mono text-sm text-muted-foreground ml-2 font-normal">
                / {kpis.total}
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-snug">
              <span className="text-primary font-mono">
                {kpis.hazardousPercent}%
              </span>{" "}
              del totale
            </p>
          </article>

          <article className="bg-card px-6 py-6 flex flex-col gap-2">
            <span className="text-label">Più vicino del periodo</span>
            {kpis.closest ?
              <>
                <div className="text-data-lg">
                  {Math.round(kpis.closest.distance / 1000).toLocaleString("it-IT")}
                  <span className="font-mono text-sm text-muted-foreground ml-2 font-normal">
                    × 10³ km
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-snug font-mono">
                  {kpis.closest.date}
                </p>
              </>
            : <span className="text-sm text-muted-foreground">Nessun dato</span>
            }
          </article>

          <article className="bg-card px-6 py-6 flex flex-col gap-2">
            <span className="text-label">Sopra 1 km</span>
            <div className="text-data-lg">{kpis.largeCount}</div>
            <p className="text-sm text-muted-foreground leading-snug">
              Asteroidi con diametro stimato superiore a 1 chilometro
            </p>
          </article>
        </section>
      : null}

      {/* Contenuto: errore / skeleton / grafici */}
      {error ?
        <div className="border border-border bg-card px-8 py-12 flex flex-col gap-4">
          <p className="text-eyebrow">
            {errorStatus === 429 ? "Rate limit" : "Errore"}
          </p>
          <p className="text-lede">{error}</p>
          {errorStatus !== "validation" && (
            <button
              onClick={fetchAsteroidStats}
              className="w-fit font-mono text-[11px] uppercase tracking-widest
                         border border-border px-4 py-2
                         hover:border-foreground transition-colors"
            >
              Riprova →
            </button>
          )}
        </div>
      : loading ?
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-border bg-card p-8 flex flex-col gap-6">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-80 w-full" />
          </div>
          <div className="border border-border bg-card p-8 flex flex-col gap-6">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-80 w-full" />
          </div>
        </div>
      : <div className="flex flex-col gap-6 md:flex-row">
          {/* Scatter — distanza nel tempo */}
          <div className="border border-border bg-card p-8 flex flex-col gap-6 flex-1">
            <div className="flex flex-col gap-2">
              <span className="text-eyebrow">Grafico 01</span>
              <h3 className="text-2xl">Distanza nel tempo</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Miss distance in milioni di km per ogni avvicinamento alla Terra
                del periodo selezionato.
              </p>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <ScatterChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <XAxis
                  type="category"
                  dataKey="date"
                  name="Data"
                  tick={{
                    fontSize: 11,
                    fill: "oklch(0.52 0.008 240)",
                    fontFamily: "var(--font-geist-mono)",
                  }}
                  tickLine={false}
                  axisLine={{ stroke: "oklch(1 0 0 / 8%)" }}
                />
                <YAxis
                  dataKey="distance"
                  name="Distanza"
                  tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`}
                  tick={{
                    fontSize: 11,
                    fill: "oklch(0.52 0.008 240)",
                    fontFamily: "var(--font-geist-mono)",
                  }}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                />
                <Tooltip
                  content={<CustomTooltipScatter />}
                  cursor={{
                    strokeDasharray: "3 3",
                    stroke: "oklch(1 0 0 / 15%)",
                  }}
                />
                <Scatter
                  name="Distanza"
                  data={sortedData}
                  fill="oklch(0.78 0.16 65)"
                  opacity={0.85}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Bar — distribuzione dimensioni */}
          <div className="border border-border bg-card p-8 flex flex-col gap-6 flex-1">
            <div className="flex flex-col gap-2">
              <span className="text-eyebrow">Grafico 02</span>
              <h3 className="text-2xl">Distribuzione dimensioni</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Numero di asteroidi per fascia di diametro stimato, in
                chilometri.
              </p>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={data?.size_distribution || []}
                layout="vertical"
                margin={{ top: 8, right: 24, bottom: 8, left: 0 }}
              >
                <XAxis
                  type="number"
                  tick={{
                    fontSize: 11,
                    fill: "oklch(0.52 0.008 240)",
                    fontFamily: "var(--font-geist-mono)",
                  }}
                  tickLine={false}
                  axisLine={{ stroke: "oklch(1 0 0 / 8%)" }}
                />
                <YAxis
                  type="category"
                  dataKey="range"
                  tick={{
                    fontSize: 11,
                    fill: "oklch(0.52 0.008 240)",
                    fontFamily: "var(--font-geist-mono)",
                  }}
                  tickLine={false}
                  axisLine={false}
                  width={70}
                />
                <Tooltip
                  content={<CustomTooltipPie />}
                  cursor={{ fill: "oklch(1 0 0 / 4%)" }}
                />
                <Bar
                  dataKey="count"
                  fill="oklch(0.78 0.16 65)"
                  opacity={0.85}
                  radius={[0, 0, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      }
    </div>
  );
};
