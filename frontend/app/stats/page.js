import { StatsCharts } from "@/components/StatsCharts";
import { getLastWeekRange } from "@/lib/utils";

export default async function Stats() {
  const dates = getLastWeekRange();
  const res = await fetch(
    `http://localhost:8000/neo/stats?start_date=${dates.startDate}&end_date=${dates.endDate}`,
  );
  const data = await res.json();

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1>Statistiche</h1>
        <p>Distribuzione e distanze degli asteroidi nel periodo selezionato.</p>
      </div>
      <StatsCharts stats={data} />
    </main>
  );
}