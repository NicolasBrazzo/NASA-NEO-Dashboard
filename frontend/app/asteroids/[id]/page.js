import Link from "next/link";
import { formatDistance, formatSpeed } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function Asteroid({ params }) {
  const { id } = await params;
  const res = await fetch(`${process.env.VITE_SERVER_URL}/neo/${id}`);
  const data = await res.json();

  const isHazardous = data.is_potentially_hazardous_asteroid;
  const orbital = data.orbital_data;
  const diameter = data.estimated_diameter.kilometers;

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 flex flex-col gap-10">

      {/* Breadcrumb */}
      <Link
        href="/asteroids"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline w-fit"
      >
        Esplora asteroidi
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-4xl">{data.name}</h1>
          <div className="flex items-center gap-3 shrink-0 pt-1">
            <span
              className={`text-xs font-mono px-2.5 py-1 rounded-full border ${
                isHazardous
                  ? "border-primary/40 text-primary bg-amber-muted"
                  : "border-border text-muted-foreground"
              }`}
            >
              {isHazardous ? "Potenzialmente pericoloso" : "Non pericoloso"}
            </span>
            <a
              href={data.nasa_jpl_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-muted-foreground hover:text-foreground
                         border border-border hover:border-foreground/20 rounded-md px-2.5 py-1
                         transition-colors no-underline"
            >
              NASA JPL
            </a>
          </div>
        </div>
      </div>

      {/* Quick facts + Orbital data */}
      <div className="grid grid-cols-2 gap-6">

        {/* Quick facts */}
        <div className="rounded-lg border border-border bg-card p-6 flex flex-col gap-5">
          <h3>Dati principali</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-label">Diametro min</span>
              <span className="text-data">{diameter.estimated_diameter_min.toFixed(3)} km</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-label">Diametro max</span>
              <span className="text-data">{diameter.estimated_diameter_max.toFixed(3)} km</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-label">Magnitudine assoluta</span>
              <span className="text-data">{data.absolute_magnitude_h}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-label">Velocità relativa</span>
              <span className="text-data">
                {formatSpeed(
                  data.close_approach_data[0]?.relative_velocity.kilometers_per_hour,
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Orbital data */}
        <div className="rounded-lg border border-border bg-card p-6 flex flex-col gap-5">
          <h3>Dati orbitali</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-label">Prima osservazione</span>
              <span className="text-data">{orbital.first_observation_date}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-label">Ultima osservazione</span>
              <span className="text-data">{orbital.last_observation_date}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-label">Periodo orbitale</span>
              <span className="text-data">
                {parseFloat(orbital.orbital_period).toFixed(1)} giorni
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-label">Incertezza orbita</span>
              <span className="text-data">{orbital.orbit_uncertainty} / 9</span>
            </div>
            <div className="flex flex-col gap-0.5 col-span-2">
              <span className="text-label">Intersezione minima orbita</span>
              <span className="text-data">{orbital.minimum_orbit_intersection} AU</span>
            </div>
          </div>
        </div>

      </div>

      {/* Close Approach Data */}
      <div className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h2>Close Approach Data</h2>
          <span className="text-label">
            {data.close_approach_data.length} avvicinamenti registrati
          </span>
        </div>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-label font-medium">Data</TableHead>
                <TableHead className="text-label font-medium text-right">Distanza</TableHead>
                <TableHead className="text-label font-medium text-right">Velocità</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.close_approach_data.map((approach, index) => (
                <TableRow
                  key={index}
                  className="border-border hover:bg-surface-raised transition-colors"
                >
                  <TableCell>
                    <span className="text-data">{approach.close_approach_date}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-data">
                      {formatDistance(approach.miss_distance.kilometers)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-data">
                      {formatSpeed(approach.relative_velocity.kilometers_per_hour)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

    </main>
  );
}