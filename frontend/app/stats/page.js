import { StatsCharts } from "@/components/StatsCharts";
import { getLastWeekRange } from "@/lib/utils";

export default async function Stats() {
  const dates =  getLastWeekRange();

  const res = await fetch(
    `http://localhost:8000/neo/stats?start_date=${dates.startDate}&end_date=${dates.endDate}`,
  );
  const data = await res.json();

  return (
    <div>
      <h1>Stats</h1>
        <StatsCharts stats={data} />
    </div>
  )
}
