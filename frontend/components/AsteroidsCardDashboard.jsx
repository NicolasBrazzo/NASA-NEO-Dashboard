import Link from "next/link";
import {
  formatDateIt,
  formatDiameter,
  formatDistance,
  formatSpeed,
} from "@/lib/utils";

export const AsteroidsCardDashboard = ({ asteroid }) => {
  const approach = asteroid.close_approach_data[0];
  const isHazardous = asteroid.is_potentially_hazardous_asteroid;

  return (
    <Link
      href={`/asteroids/${asteroid.id}`}
      className="no-underline group"
    >
      <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-4 h-full transition-colors duration-150 group-hover:border-primary/40 group-hover:bg-surface-raised">

        {/* Header card */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="leading-snug">{asteroid.name}</h3>
          <span
            className={`shrink-0 text-xs font-mono px-2 py-0.5 rounded-full border ${
              isHazardous
                ? "border-primary/40 text-primary bg-amber-muted"
                : "border-border text-muted-foreground"
            }`}
          >
            {isHazardous ? "Pericoloso" : "Sicuro"}
          </span>
        </div>

        {/* Dati */}
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-0.5">
            <span className="text-label">Data avvicinamento</span>
            <span className="text-data">
              {formatDateIt(approach?.close_approach_date)}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-label">Distanza</span>
            <span className="text-data">
              {formatDistance(approach?.miss_distance.kilometers)}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-label">Velocità</span>
            <span className="text-data">
              {formatSpeed(approach?.relative_velocity.kilometers_per_hour)}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-label">Diametro stimato</span>
            <span className="text-data">
              {formatDiameter(
                asteroid.estimated_diameter.kilometers.estimated_diameter_min,
                asteroid.estimated_diameter.kilometers.estimated_diameter_max,
              )}
            </span>
          </div>
        </div>

      </div>
    </Link>
  );
};