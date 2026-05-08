import { AsteroidsList } from "@/components/AsteroidsList";
import { getLastWeekRange } from "@/lib/utils";

export default async function Asteroids() {
  const dates =  getLastWeekRange();

  const res = await fetch(
    `http://localhost:8000/neo/feed?start_date=${dates.startDate}&end_date=${dates.endDate}`,
  );
  const data = await res.json();

  return (
    <div>
      <h1>NASA NEO Dashboard</h1>
      <AsteroidsList asteroids={data.asteroids} />
    </div>
  )
}
