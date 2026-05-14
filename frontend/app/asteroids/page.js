import { AsteroidsList } from "@/components/AsteroidsList";
import { getLastWeekRange } from "@/lib/utils";

export default async function Asteroids() {
  const dates = getLastWeekRange();
  const baseUrl = process.env.NEXT_PUBLIC_VITE_SERVER_URL; 
  const res = await fetch(
    `${baseUrl}/neo/feed?start_date=${dates.startDate}&end_date=${dates.endDate}`,
  );
  const data = await res.json();

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 flex flex-col gap-10">
      <div className="flex flex-col gap-1">
        <h1>Esplora asteroidi</h1>
        <p>Filtra, ordina e analizza gli oggetti in avvicinamento alla Terra.</p>
      </div>
      <AsteroidsList asteroids={data.asteroids} />
    </main>
  );
}