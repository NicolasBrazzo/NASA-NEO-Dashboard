"use client";

import { getLastWeekRange } from "@/lib/utils";
import { useEffect, useState } from "react";
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

export const StatsCharts = ({ stats }) => {
  const [data, setData] = useState(stats);
  const [dateFilter, setDateFilter] = useState(getLastWeekRange());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAsteroidStats = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `http://localhost:8000/neo/stats?start_date=${dateFilter.startDate}&end_date=${dateFilter.endDate}`;

      const response = await fetch(url);
      const result = await response.json();
      setData(result);
    } catch (err) {
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

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f7f"];

  return (
    <div>
      <div>
        <p>Filter by Date:</p>
        <input
          type="date"
          value={dateFilter.startDate}
          onChange={(e) =>
            setDateFilter((prev) => ({ ...prev, startDate: e.target.value }))
          }
        />
        <input
          type="date"
          value={dateFilter.endDate}
          onChange={(e) =>
            setDateFilter((prev) => ({ ...prev, endDate: e.target.value }))
          }
        />
      </div>

      {error ?
        <p className="text-red-500">{error}</p>
      : loading ?
        <p>Loading...</p>
      : <div>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart>
              <XAxis type="category" dataKey="date" name="Date" />
              <YAxis
                dataKey="distance"
                name="Distance"
                tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M km`}
              />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Scatter name="NEO Distance" data={sortedData} fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>

          {/* grafico pie per stats.size_distribution  */}
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={data.size_distribution}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
                nameKey="range"
                label={({ range, percent }) =>
                  `${range}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {data.size_distribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      }
    </div>
  );
};
