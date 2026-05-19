import { StatsCharts } from "@/components/StatsCharts";

export default function Stats() {
  
  return (
    <main className="mx-auto max-w-7xl px-8 py-16 flex flex-col gap-20">
      <div className="flex flex-col gap-3">
        <p className="text-eyebrow">DATI AGGREGATI · NEAR-EARTH OBJECTS</p>
        <h1>Statistiche</h1>
        <p className="text-lede">
          I due grafici raccontano la stessa popolazione di asteroidi da due
          angolazioni: nello spazio (quanto sono passati vicini) e nelle
          dimensioni (quanti sono piccoli, quanti grandi).
        </p>
      </div>
      <StatsCharts />
    </main>
  );
}
