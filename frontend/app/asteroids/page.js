import { AsteroidsList } from "@/components/AsteroidsList";
import { getLastWeekRange } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default async function Asteroids() {
  const dates = getLastWeekRange();

  let asteroids = [];
  let fetchError = null;
  try {
    const res = await fetch(
      `${API_URL}/neo/feed?start_date=${dates.startDate}&end_date=${dates.endDate}`,
      { cache: "no-store" },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    asteroids = data.asteroids ?? [];
  } catch (err) {
    fetchError = err.message;
  }

  if (fetchError) {
    return (
      <main className="mx-auto max-w-7xl px-8 py-20">
        <p className="text-eyebrow mb-6">Errore di connessione</p>
        <h1>Non riesco a recuperare gli asteroidi.</h1>
        <p className="text-lede mt-6">
          Il servizio non risponde. Verifica che il backend sia attivo,
          oppure riprova tra qualche istante.
        </p>
        <p className="text-meta mt-8">Dettaglio tecnico · {fetchError}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 flex flex-col gap-10">
      <div className="flex flex-col gap-1">
        <h1>Esplora asteroidi</h1>
        <p>Filtra, ordina e analizza gli oggetti in avvicinamento alla Terra.</p>
      </div>
      <AsteroidsList asteroids={asteroids} />
    </main>
  );
}