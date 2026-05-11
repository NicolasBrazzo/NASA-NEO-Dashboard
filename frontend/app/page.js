import { AsteroidsCardDashboard } from "@/components/AsteroidsCardDashboard";
import { getLastWeekRange } from "@/lib/utils";

export default async function Dashboard() {
  const dates = getLastWeekRange();
  const res = await fetch(
    `http://localhost:8000/neo/feed?start_date=${dates.startDate}&end_date=${dates.endDate}`,
  );
  const data = await res.json();

  const total = data.asteroids.length;
  const hazardous = data.asteroids.filter(
    (a) => a.is_potentially_hazardous_asteroid
  ).length;
  const closest = data.asteroids[0];

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 flex flex-col gap-10">

      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1>Near Earth Objects</h1>
        <p>
          Asteroidi in avvicinamento alla Terra negli ultimi 7 giorni —{" "}
          {dates.startDate} / {dates.endDate}
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-2">
          <span className="text-label">Totale asteroidi</span>
          <span className="text-data-lg">{total}</span>
        </div>
        <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-2">
          <span className="text-label">Potenzialmente pericolosi</span>
          <span className="text-data-lg text-primary">{hazardous}</span>
        </div>
        <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-2">
          <span className="text-label">Asteroide più vicino</span>
          <span className="text-data-lg truncate">{closest?.name}</span>
        </div>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-3">
        <h2>I più vicini</h2>
        <div className="grid grid-cols-3 gap-4">
          {data.asteroids.slice(0, 3).map((asteroid) => (
            <AsteroidsCardDashboard key={asteroid.id} asteroid={asteroid} />
          ))}
        </div>
      </div>

    </main>
  );
}