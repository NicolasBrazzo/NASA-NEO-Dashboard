import { StatsCharts } from "@/components/StatsCharts";
import { getLastWeekRange } from "@/lib/utils";

export default async function Stats() {
  const dates = getLastWeekRange();
  const baseUrl = process.env.NEXT_PUBLIC_VITE_SERVER_URL;
  const res = await fetch(
    `${baseUrl}/neo/stats?start_date=${dates.startDate}&end_date=${dates.endDate}`,
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