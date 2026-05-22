import Link from "next/link";
import { compareSize } from "@/lib/sizeComparators";
import {
  formatDistance,
  formatSpeed,
  formatDateLong,
  LUNAR_DISTANCE_KM,
} from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApproachRadar } from "@/components/ApproachRadar";
import { pageMetadata } from "@/lib/seo";


// =============================================================================
// HELPERS LOCALI
// =============================================================================

// Rimuove le parentesi dal nome NASA: "(2010 PK9)" → "2010 PK9"
function cleanName(name) {
  return name.replace(/[()]/g, "").trim();
}

// Trova il closest approach alla Terra (distanza minima storica)
function findClosestEarthApproach(closeApproachData) {
  const earthApproaches = closeApproachData.filter(
    (a) => a.orbiting_body === "Earth",
  );
  if (earthApproaches.length === 0) return null;
  return earthApproaches.reduce((min, a) => {
    const km = Number(a.miss_distance.kilometers);
    return km < Number(min.miss_distance.kilometers) ? a : min;
  }, earthApproaches[0]);
}

// Trova il prossimo avvicinamento alla Terra dopo oggi
function findNextEarthApproach(closeApproachData) {
  const today = new Date().toISOString().split("T")[0];
  return (
    closeApproachData
      .filter(
        (a) => a.orbiting_body === "Earth" && a.close_approach_date >= today,
      )
      .sort((a, b) =>
        a.close_approach_date.localeCompare(b.close_approach_date),
      )[0] ?? null
  );
}

// Costruisce la lede editoriale dai dati dell'asteroide
function buildLede(data) {
  const name = cleanName(data.name);
  const firstDate = formatDateLong(data.orbital_data.first_observation_date);
  const orbitClass =
    data.orbital_data.orbit_class?.orbit_class_description ?? null;
  const isPHA = data.is_potentially_hazardous_asteroid;

  let lede = `Scoperto per la prima volta il ${firstDate}, ${name} è un asteroide`;

  if (orbitClass) {
    // Prendo solo la prima frase della descrizione della classe orbitale
    const shortClass = orbitClass.split(";")[0].toLowerCase();
    lede += ` con un'orbita ${shortClass}`;
  }

  lede += ". ";

  if (isPHA) {
    lede +=
      "È classificato come potenzialmente pericoloso dalla NASA perché la sua orbita si avvicina significativamente a quella terrestre e le sue dimensioni superano i 140 metri.";
  } else {
    lede +=
      "Non è classificato come potenzialmente pericoloso: la sua orbita non interseca quella terrestre in modo significativo.";
  }

  return lede;
}

// =============================================================================
// METADATA
// Titolo e descrizione dinamici, derivati dai dati dell'asteroide.
// La fetch identica a quella della pagina viene deduplicata da Next.js.
// =============================================================================
export async function generateMetadata({ params }) {
  const { id } = await params;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/neo/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return pageMetadata({
        title: "Asteroide non trovato",
        description:
          "L'identificativo richiesto non corrisponde a nessun oggetto nel database NASA NeoWs.",
        path: `/asteroids/${id}`,
        ogType: "article",
      });
    }

    const data = await res.json();
    const name = cleanName(data.name);
    const description = `Dati orbitali, dimensioni stimate e avvicinamenti alla Terra dell'asteroide ${name}${
      data.is_potentially_hazardous_asteroid ?
        ", classificato come potenzialmente pericoloso dalla NASA"
      : ""
    }.`;

    return pageMetadata({
      title: name,
      description,
      path: `/asteroids/${id}`,
      ogType: "article",
    });
  } catch {
    return pageMetadata({
      title: "Dettaglio asteroide",
      description:
        "Scheda dettagliata di un oggetto vicino alla Terra tracciato dalla NASA.",
      path: `/asteroids/${id}`,
      ogType: "article",
    });
  }
}

// =============================================================================
// PAGE
// =============================================================================
export default async function AsteroidDetail({ params }) {
  const { id } = await params;

  // Fetch con gestione errori
  let data = null;
  let fetchError = null;
  let errorStatus = null;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/neo/${id}`, {
      cache: "no-store",
    });
    if (res.ok) {
      data = await res.json();
    } else {
      errorStatus = res.status;
      try {
        const body = await res.json();
        fetchError = body.detail ?? `HTTP ${res.status}`;
      } catch {
        fetchError = `HTTP ${res.status}`;
      }
    }
  } catch (err) {
    fetchError = err.message;
  }

  // -------- Stato 404 --------
  if (errorStatus === 404) {
    return (
      <main className="mx-auto max-w-7xl px-4 sm:px-8 py-16">
        <Link
          href="/asteroids"
          className="text-eyebrow no-underline hover:text-foreground transition-colors mb-12 block w-fit"
        >
          Esplora asteroidi
        </Link>
        <p className="text-eyebrow mb-6">Errore · 404</p>
        <h1>Asteroide non trovato.</h1>
        <p className="text-lede mt-6">
          L'identificativo{" "}
          <code className="font-mono text-foreground">{id}</code> non
          corrisponde a nessun oggetto nel database NASA NeoWs. Prova a cercarne
          un altro nella pagina <Link href="/asteroids">Esplora</Link>.
        </p>
      </main>
    );
  }

  // -------- Stato 429 / errore generico --------
  if (fetchError) {
    const isRateLimit = errorStatus === 429;
    return (
      <main className="mx-auto max-w-7xl px-4 sm:px-8 py-16">
        <Link
          href="/asteroids"
          className="text-eyebrow no-underline hover:text-foreground transition-colors mb-12 block w-fit"
        >
          Esplora asteroidi
        </Link>
        <p className="text-eyebrow mb-6">
          {isRateLimit ? "Rate limit" : "Errore di connessione"}
        </p>
        <h1>{isRateLimit ? "Limite API raggiunto." : "Il servizio non è raggiungibile."}</h1>
        <p className="text-lede mt-6">{fetchError}</p>
      </main>
    );
  }

  // -------- Calcoli derivati --------
  const name = cleanName(data.name);
  const isPHA = data.is_potentially_hazardous_asteroid;
  const orbital = data.orbital_data;
  const orbitClass = orbital.orbit_class;

  // Diametro
  const diameterMinM = data.estimated_diameter.meters.estimated_diameter_min;
  const diameterMaxM = data.estimated_diameter.meters.estimated_diameter_max;
  const diameterAvgM = (diameterMinM + diameterMaxM) / 2;
  const sizeRef = compareSize(diameterAvgM, data.id);

  // Avvicinamenti
  const closestEarth = findClosestEarthApproach(data.close_approach_data);
  const nextEarth = findNextEarthApproach(data.close_approach_data);

  // Tutti gli avvicinamenti alla Terra, dal più recente
  const earthApproaches = data.close_approach_data
    .filter((a) => a.orbiting_body === "Earth")
    .sort((a, b) => b.close_approach_date.localeCompare(a.close_approach_date))
    .slice(0, 20);

  const allEarthApproaches = data.close_approach_data
    .filter((a) => a.orbiting_body === "Earth")
    .sort((a, b) => a.close_approach_date.localeCompare(b.close_approach_date));

  // Velocità dall'avvicinamento più recente alla Terra disponibile
  const velocitySource = earthApproaches[0] ?? data.close_approach_data[0];

  // Lede
  const lede = buildLede(data);

  // Periodo orbitale formattato
  const periodDays = parseFloat(orbital.orbital_period).toFixed(1);
  const periodYears = (parseFloat(orbital.orbital_period) / 365.25).toFixed(2);

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-8 py-10 sm:py-16 flex flex-col gap-12 md:gap-20">
      {/* ===== BREADCRUMB ===== */}
      <Link
        href="/asteroids"
        className="text-eyebrow no-underline hover:text-foreground transition-colors w-fit -mb-12"
      >
        ← Esplora asteroidi
      </Link>

      {/* ===== HERO ===== */}
      <section className="flex flex-col gap-8">
        {/* Due colonne */}
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 lg:items-center">
          {/* Colonna sinistra: titolo, lede, badge, link */}
          <div className="flex flex-col gap-6 flex-1">
            {/* Eyebrow */}
            <p className="text-eyebrow">
              {data.designation}
              {orbitClass?.orbit_class_type && (
                <> · Classe {orbitClass.orbit_class_type}</>
              )}
              {" · "}Spk-id {data.neo_reference_id}
            </p>
            <h1>{name}</h1>
            <p className="text-lede">{lede}</p>
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className={`font-mono text-[11px] uppercase tracking-widest px-3 py-1.5 border rounded-xs ${
                  isPHA ?
                    "border-primary/40 text-primary bg-amber-muted"
                  : "border-border text-muted-foreground"
                }`}
              >
                {isPHA ? "Pericoloso" : "Sicuro"}
              </span>
              <a
                href={data.nasa_jpl_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground
                           hover:text-foreground border border-border hover:border-border-strong
                           rounded-xs px-3 py-1.5 transition-colors no-underline"
              >
                NASA JPL ↗
              </a>
            </div>
          </div>

          {/* Colonna destra: radar + legenda compatta */}
          <div className="flex flex-col gap-4 flex-1">
            <ApproachRadar approaches={allEarthApproaches} />
            <div className="flex flex-wrap justify-center border border-border py-3 gap-x-6 gap-y-2 px-1">
              <span className="font-mono text-[11px] text-primary flex items-center gap-1.5">
                ● Prossimo passaggio
              </span>
              <span
                className="font-mono text-[11px] flex items-center gap-1.5"
                style={{ color: "var(--chart-3)" }}
              >
                ● Storici
              </span>
              <span className="font-mono text-[11px] text-muted-foreground flex items-center gap-1.5">
                ● Futuri previsti
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== KPI STRIP — 4 metriche chiave ===== */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border">
        {/* KPI 1: Distanza minima storica */}
        <article className="bg-card px-6 py-6 flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="text-label">Distanza minima storica</span>
          </div>
          {closestEarth ?
            <>
              <div className="text-data-lg">
                {Math.round(
                  Number(closestEarth.miss_distance.kilometers) / 1000,
                ).toLocaleString("it-IT")}
                <span className="font-mono text-sm text-muted-foreground ml-2 font-normal">
                  × 10³ km
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-snug! mt-0!">
                <span className="text-primary font-medium font-mono">
                  ×
                  {(
                    Number(closestEarth.miss_distance.kilometers) /
                    LUNAR_DISTANCE_KM
                  ).toFixed(1)}{" "}
                  Terra–Luna
                </span>
                {" · "}
                <span className="text-meta">
                  {closestEarth.close_approach_date}
                </span>
              </p>
            </>
          : <p className="text-sm text-muted-foreground">
              Nessun dato disponibile
            </p>
          }
        </article>

        {/* KPI 2: Diametro stimato */}
        <article className="bg-card px-6 py-6 flex flex-col gap-2">
          <span className="text-label">Diametro stimato</span>
          <div className="text-data-lg">
            {Math.round(diameterAvgM)}
            <span className="font-mono text-sm text-muted-foreground ml-2 font-normal">
              m
            </span>
          </div>
          {sizeRef && !sizeRef.parts.fallback ?
            <p className="text-sm font-mono leading-snug! mt-0! flex items-baseline gap-1">
              {sizeRef.parts.prefix && (
                <span className="text-muted-foreground">
                  {sizeRef.parts.prefix}
                </span>
              )}
              <span className="text-primary font-medium">
                {sizeRef.parts.mult}
              </span>
              <span className="text-foreground">{sizeRef.parts.label}</span>
            </p>
          : <p className="text-sm text-muted-foreground leading-snug! mt-0!">
              {Math.round(diameterMinM)}–{Math.round(diameterMaxM)} m (min/max)
            </p>
          }
        </article>

        {/* KPI 3: Velocità relativa */}
        <article className="bg-card px-6 py-6 flex flex-col gap-2">
          <span className="text-label">Velocità relativa</span>
          <div className="text-data-lg">
            {Math.round(
              Number(velocitySource?.relative_velocity.kilometers_per_hour) /
                1000,
            ).toLocaleString("it-IT")}
            <span className="font-mono text-sm text-muted-foreground ml-2 font-normal">
              × 10³ km/h
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-snug! mt-0!">
            {(
              Number(velocitySource?.relative_velocity.kilometers_per_hour) /
              3600
            ).toFixed(1)}{" "}
            km/s
          </p>
        </article>

        {/* KPI 4: Periodo orbitale */}
        <article className="bg-card px-6 py-6 flex flex-col gap-2">
          <span className="text-label">Periodo orbitale</span>
          <div className="text-data-lg">
            {periodDays}
            <span className="font-mono text-sm text-muted-foreground ml-2 font-normal">
              giorni
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-snug! mt-0!">
            Equivale a{" "}
            <span className="text-foreground">{periodYears} anni</span>{" "}
            terrestri
          </p>
        </article>
      </section>

      {/* ===== DATI ORBITALI ===== */}
      <section className="flex flex-col gap-8">
        <h2>Dati orbitali</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border border border-border">
          {/* Colonna sinistra */}
          <div className="bg-card px-8 py-6 flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-label">Prima osservazione</span>
              <span className="text-data">
                {formatDateLong(orbital.first_observation_date)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-label">Ultima osservazione</span>
              <span className="text-data">
                {formatDateLong(orbital.last_observation_date)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-label">Arco dati</span>
              <span className="text-data">
                {parseInt(orbital.data_arc_in_days).toLocaleString("it-IT")}{" "}
                giorni
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-label">Osservazioni usate</span>
              <span className="text-data">{orbital.observations_used}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-label">Incertezza orbita</span>
              <span className="text-data">{orbital.orbit_uncertainty} / 9</span>
              <span className="text-meta normal-case tracking-normal">
                {orbital.orbit_uncertainty === "0" ?
                  "Orbita determinata con certezza massima"
                : "Orbita con incertezza residua"}
              </span>
            </div>
          </div>

          {/* Colonna destra */}
          <div className="bg-card px-8 py-6 flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-label">Eccentricità</span>
              <span className="text-data">
                {parseFloat(orbital.eccentricity).toFixed(6)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-label">Inclinazione</span>
              <span className="text-data">
                {parseFloat(orbital.inclination).toFixed(4)}°
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-label">Semiasse maggiore</span>
              <span className="text-data">
                {parseFloat(orbital.semi_major_axis).toFixed(6)} AU
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-label">
                Intersezione minima orbita (MOID)
              </span>
              <span className="text-data">
                {orbital.minimum_orbit_intersection} AU
              </span>
              <span className="text-meta normal-case tracking-normal">
                {(parseFloat(orbital.minimum_orbit_intersection) * 149597870.7)
                  .toFixed(0)
                  .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}{" "}
                km dalla Terra
              </span>
            </div>
            {orbitClass && (
              <div className="flex flex-col gap-1">
                <span className="text-label">Classe orbitale</span>
                <span className="text-data">{orbitClass.orbit_class_type}</span>
                <span className="text-meta normal-case tracking-normal">
                  {orbitClass.orbit_class_description}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===== TABELLA AVVICINAMENTI ALLA TERRA ===== */}
      <section className="flex flex-col gap-8">
        <div className="flex items-baseline justify-between">
          <h2>Avvicinamenti alla Terra</h2>
          <div className="text-meta text-right">
            <span className="block text-foreground font-mono text-sm normal-case tracking-normal mb-1">
              {
                data.close_approach_data.filter(
                  (a) => a.orbiting_body === "Earth",
                ).length
              }{" "}
              avvicinamenti registrati
            </span>
            <span>Ultimi 20 in ordine cronologico inverso</span>
          </div>
        </div>

        <div className="border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-label font-medium">Data</TableHead>
                <TableHead className="text-label font-medium text-right">
                  Distanza
                </TableHead>
                <TableHead className="text-label font-medium text-right">
                  In LD
                </TableHead>
                <TableHead className="text-label font-medium text-right">
                  Velocità
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {earthApproaches.length === 0 ?
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12">
                    <span className="text-sm text-muted-foreground">
                      Nessun avvicinamento alla Terra registrato.
                    </span>
                  </TableCell>
                </TableRow>
              : earthApproaches.map((approach, i) => {
                  const isClosest =
                    closestEarth &&
                    approach.close_approach_date ===
                      closestEarth.close_approach_date &&
                    approach.miss_distance.kilometers ===
                      closestEarth.miss_distance.kilometers;
                  const lunarDist = parseFloat(
                    approach.miss_distance.lunar,
                  ).toFixed(1);

                  return (
                    <TableRow
                      key={i}
                      className={`border-border transition-colors ${
                        isClosest ? "bg-amber-muted/40" : (
                          "hover:bg-surface-raised"
                        )
                      }`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="text-data">
                            {approach.close_approach_date}
                          </span>
                          {isClosest && (
                            <span className="font-mono text-[9px] uppercase tracking-widest text-primary border border-primary/40 px-1.5 py-0.5 rounded-xs">
                              Record
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-data">
                          {formatDistance(approach.miss_distance.kilometers)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-data text-muted-foreground">
                          {lunarDist} LD
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-data">
                          {formatSpeed(
                            approach.relative_velocity.kilometers_per_hour,
                          )}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              }
            </TableBody>
          </Table>
        </div>
      </section>
    </main>
  );
}
