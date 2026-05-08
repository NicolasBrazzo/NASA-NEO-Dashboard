import { AsteroidsCardDashboard } from "@/components/AsteroidsCardDashboard";
import { getLastWeekRange } from "@/lib/utils";

export default async function Dashboard() {
  const dates =  getLastWeekRange();

  const res = await fetch(
    `http://localhost:8000/neo/feed?start_date=${dates.startDate}&end_date=${dates.endDate}`,
  );
  const data = await res.json();

  return (
    <div>
      <h1>NASA NEO Dashboard</h1>

      <div className="flex items-center justify-center gap-10">
        <div>
          <h2>Total Count</h2>
          <p>{data.asteroids.length}</p>
        </div>
        <div>
          <h2>Hazardous Count</h2>
          <p>
            {
              data.asteroids.filter((a) => a.is_potentially_hazardous_asteroid)
                .length
            }
          </p>
        </div>
      </div>

      <div className="flex justify-center items-center w-full gap-10">
        {data.asteroids.slice(0, 3).map((asteroid) => (
          <AsteroidsCardDashboard key={asteroid.id} asteroid={asteroid} />
        ))}
      </div>
    </div>
  );
}
