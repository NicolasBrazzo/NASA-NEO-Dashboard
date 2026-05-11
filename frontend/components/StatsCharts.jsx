"use client";

import { getLastWeekRange, getToday } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = [
  "oklch(0.78 0.16 65)", // ambra — primario
  "oklch(0.65 0.12 200)", // ciano
  "oklch(0.62 0.22 25)", // rosso
  "oklch(0.55 0.08 240)", // blu slate
];

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

export const StatsCharts = ({ stats }) => {
  const [data, setData] = useState(stats);
  const [dateFilter, setDateFilter] = useState(getLastWeekRange());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAsteroidStats = async () => {
    const today = getToday();

    // Validazione PRIMA di tutto
    if (dateFilter.startDate > today || dateFilter.endDate > today) {
      setError("Le date non possono essere nel futuro.");
      return;
    }
    if (dateFilter.startDate > dateFilter.endDate) {
      setError("La data di inizio deve essere precedente alla data di fine.");
      return;
    }

    // Solo se tutto ok, parte il fetch
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `http://localhost:8000/neo/stats?start_date=${dateFilter.startDate}&end_date=${dateFilter.endDate}`,
      );
      const result = await res.json();
      setData(result);
    } catch {
      setError("Errore nel caricamento delle statistiche.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dateFilter.startDate && dateFilter.endDate) {
      fetchAsteroidStats();
    }
  }, [dateFilter]);

  const sortedData = [...(data.distance_over_time || [])].sort(
    (a, b) => new Date(a.date) - new Date(b.date),
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Filtri date */}
      <div className="flex flex-wrap items-end gap-4 rounded-lg border border-border bg-card p-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-label">Dal</span>
          <input
            type="date"
            value={dateFilter.startDate}
            max={getToday()}
            onChange={(e) =>
              setDateFilter((prev) => ({ ...prev, startDate: e.target.value }))
            }
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm text-foreground font-mono
                       focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-label">Al</span>
          <input
            type="date"
            value={dateFilter.endDate}
            max={getToday()}
            onChange={(e) =>
              setDateFilter((prev) => ({ ...prev, endDate: e.target.value }))
            }
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm text-foreground font-mono
                       focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
          />
        </div>
      </div>

      {/* Contenuto */}
      {error ?
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <span className="text-sm text-destructive">{error}</span>
        </div>
      : loading ?
        <div className="grid grid-cols-2 gap-6">
          <div className="rounded-lg border border-border bg-card p-6 flex flex-col gap-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-[320px] w-full" />
          </div>
          <div className="rounded-lg border border-border bg-card p-6 flex flex-col gap-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-[320px] w-full" />
          </div>
        </div>
      : <div className="grid grid-cols-2 gap-6">
          {/* Scatter — distanza nel tempo */}
          <div className="rounded-lg border border-border bg-card p-6 flex flex-col gap-4">
            <div className="flex flex-col gap-0.5">
              <h3>Distanza nel tempo</h3>
              <p>Miss distance in milioni di km per ogni avvicinamento.</p>
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

          {/* Pie — distribuzione dimensioni */}
          <div className="rounded-lg border border-border bg-card p-6 flex flex-col gap-4">
            <div className="flex flex-col gap-0.5">
              <h3>Distribuzione dimensioni</h3>
              <p>Numero di asteroidi per fascia di diametro stimato.</p>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={data.size_distribution || []}
                  cx="50%"
                  cy="45%"
                  outerRadius={110}
                  dataKey="count"
                  nameKey="range"
                  labelLine={false}
                  // label={({ percent }) =>
                  //   percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ""
                  // }
                >
                  {(data.size_distribution || []).map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      opacity={0.9}
                    />
                  ))}
                </Pie>
                <Legend
                  formatter={(value) => (
                    <span
                      style={{
                        fontSize: 11,
                        color: "oklch(0.52 0.008 240)",
                        fontFamily: "var(--font-geist-mono)",
                      }}
                    >
                      {value}
                    </span>
                  )}
                />
                <Tooltip content={<CustomTooltipPie />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      }
    </div>
  );
};
