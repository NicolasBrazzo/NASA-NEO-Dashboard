import { StatsCharts } from "@/components/StatsCharts";
import { getLastWeekRange } from "@/lib/utils";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Statistiche",
  description:
    "Dati aggregati sui Near-Earth Objects: distribuzione degli avvicinamenti nello spazio e delle dimensioni degli asteroidi, dai più piccoli ai più grandi.",
  path: "/stats",
});

export default async function Stats() {
  const dates = getLastWeekRange();

  let initialData = null;
  let fetchError = null;
  let errorStatus = null;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/neo/stats?start_date=${dates.startDate}&end_date=${dates.endDate}`,
      { cache: "no-store" },
    );
    if (!res.ok) {
      errorStatus = res.status;
      try {
        const body = await res.json();
        fetchError = body.detail ?? `HTTP ${res.status}`;
      } catch {
        fetchError = `HTTP ${res.status}`;
      }
    } else {
      initialData = await res.json();
    }
  } catch (err) {
    fetchError = err.message;
  }

  if (fetchError) {
    const isRateLimit = errorStatus === 429;
    return (
      <main className="mx-auto w-full max-w-7xl px-4 sm:px-8 py-16">
        <p className="text-eyebrow mb-6">
          Statistiche · {isRateLimit ? "Rate limit" : "Errore di connessione"}
        </p>
        <h1>
          {isRateLimit ?
            "Limite API raggiunto."
          : "Il servizio non è raggiungibile."}
        </h1>
        <p className="text-lede mt-6">{fetchError}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 sm:px-8 py-10 sm:py-16 flex flex-col gap-12 md:gap-20">
      <div className="flex flex-col gap-3">
        <p className="text-eyebrow">DATI AGGREGATI · NEAR-EARTH OBJECTS</p>
        <h1>Statistiche</h1>
        <p className="text-lede">
          I due grafici raccontano la stessa popolazione di asteroidi da due
          angolazioni: nello spazio (quanto sono passati vicini) e nelle
          dimensioni (quanti sono piccoli, quanti grandi).
        </p>
      </div>
      <StatsCharts initialData={initialData} />
    </main>
  );
}
