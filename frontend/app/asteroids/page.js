import { AsteroidsList } from "@/components/AsteroidsList";
import { getLastWeekRange } from "@/lib/utils";
import { pageMetadata } from "@/lib/seo";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const metadata = pageMetadata({
  title: "Esplora asteroidi",
  description:
    "Il catalogo completo dei Near-Earth Objects che hanno attraversato il vicinato della Terra: orbita, dimensioni e tutti gli avvicinamenti registrati dalla NASA.",
  path: "/asteroids",
});

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
      <main className="mx-auto w-full max-w-7xl px-4 sm:px-8 py-16">
        <p className="text-eyebrow mb-6">Errore di connessione</p>
        <h1>Non riesco a recuperare gli asteroidi.</h1>
        <p className="text-lede mt-6">
          Il servizio non risponde. Verifica che il backend sia attivo, oppure
          riprova tra qualche istante.
        </p>
        <p className="text-meta mt-8">Dettaglio tecnico · {fetchError}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 sm:px-8 py-10 sm:py-16 flex flex-col gap-12 md:gap-20">
      <div className="flex flex-col gap-3">
        <p className="text-eyebrow">Catalogo · Near-Earth Objects</p>
        <h1>Esplora asteroidi</h1>
        <p className="text-lede">
          Ogni oggetto in questa lista ha attraversato il vicinato della Terra
          nell'intervallo selezionato. Cliccane uno per leggere la sua storia
          completa: orbita, dimensioni, e tutti i passaggi registrati dalla
          NASA.
        </p>
      </div>
      <AsteroidsList asteroids={asteroids} />
    </main>
  );
}