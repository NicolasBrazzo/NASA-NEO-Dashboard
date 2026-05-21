"use client";

import {
  formatDiameter,
  formatDistance,
  formatSpeed,
  getLastWeekRange,
  parseApiError,
} from "@/lib/utils";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export const AsteroidsList = ({ asteroids }) => {
  const dates = getLastWeekRange();

  const [data, setData] = useState(asteroids);
  const [isHazardous, setIsHazardous] = useState(null);
  const [sortBy, setSortBy] = useState(null);
  const [dateFilter, setDateFilter] = useState({
    startDate: dates.startDate,
    endDate: dates.endDate,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isFirstRender = useRef(true);

  const fetchAsteroids = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `${process.env.NEXT_PUBLIC_API_URL}/neo/feed?start_date=${dateFilter.startDate}&end_date=${dateFilter.endDate}`;
      if (isHazardous !== null) url += `&is_hazardous=${isHazardous}`;
      if (sortBy !== null) url += `&sort_by=${sortBy}`;

      const response = await fetch(url);
      if (!response.ok) {
        const { message } = await parseApiError(response);
        setError(message);
        return;
      }
      const result = await response.json();
      setData(result.asteroids);
    } catch {
      setError("Impossibile contattare il server. Verifica la connessione.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Skip del primo render: i dati iniziali vengono dalla server page
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (dateFilter.startDate && dateFilter.endDate) {
      fetchAsteroids();
    }
  }, [isHazardous, sortBy, dateFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-8">
      {/* Filtri — barra contestuale sobria */}
      <div className="flex flex-wrap items-end gap-8 border-b border-border pb-6">
        {/* Date */}
        <div className="flex flex-col gap-1.5">
          <span className="text-eyebrow">Dal</span>
          <input
            type="date"
            value={dateFilter.startDate}
            onChange={(e) =>
              setDateFilter((prev) => ({ ...prev, startDate: e.target.value }))
            }
            className="h-8 bg-transparent text-sm text-foreground font-mono
                       border-0 border-b border-border focus:outline-none
                       focus:border-foreground transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-eyebrow">Al</span>
          <input
            type="date"
            value={dateFilter.endDate}
            onChange={(e) =>
              setDateFilter((prev) => ({ ...prev, endDate: e.target.value }))
            }
            className="h-8 bg-transparent text-sm text-foreground font-mono
                       border-0 border-b border-border focus:outline-none
                       focus:border-foreground transition-colors"
          />
        </div>

        {/* Pericolosità */}
        <div className="flex flex-col gap-1.5">
          <span className="text-eyebrow">Pericolosità</span>
          <Select
            onValueChange={(value) =>
              setIsHazardous(value === "all" ? null : value === "hazardous")
            }
          >
            <SelectTrigger className="w-40 h-8 text-sm border-0 border-b border-border rounded-none bg-transparent px-2 focus:ring-0">
              <SelectValue placeholder="Tutti" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti</SelectItem>
              <SelectItem value="hazardous">Pericolosi</SelectItem>
              <SelectItem value="non-hazardous">Non pericolosi</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Ordinamento */}
        <div className="flex flex-col gap-1.5">
          <span className="text-eyebrow">Ordina per</span>
          <Select
            onValueChange={(value) =>
              setSortBy(value === "none" ? null : value)
            }
          >
            <SelectTrigger className="w-36 h-8 text-sm border-0 border-b border-border rounded-none bg-transparent px-2 focus:ring-0">
              <SelectValue placeholder="Default" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Default</SelectItem>
              <SelectItem value="distance">Distanza</SelectItem>
              <SelectItem value="velocity">Velocità</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Conteggio risultati */}
        {!loading && !error && (
          <div className="ml-auto flex flex-col gap-1.5">
            <span className="text-eyebrow">Risultati</span>
            <span className="font-mono text-sm text-foreground">
              {data.length} oggett{data.length === 1 ? "o" : "i"}
            </span>
          </div>
        )}
      </div>

      {/* Tabella squadrata, in linea con il resto */}
      <div className="border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-label font-medium w-70">
                Nome
              </TableHead>
              <TableHead className="text-label font-medium">Data</TableHead>
              <TableHead className="text-label font-medium text-right">
                Distanza
              </TableHead>
              <TableHead className="text-label font-medium text-right">
                Velocità
              </TableHead>
              <TableHead className="text-label font-medium text-right">
                Diametro
              </TableHead>
              <TableHead className="text-label font-medium text-center">
                Stato
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {error ?
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <span className="text-sm text-destructive">{error}</span>
                </TableCell>
              </TableRow>
            : loading ?
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i} className="border-border">
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28 ml-auto" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28 ml-auto" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20 ml-auto" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16 mx-auto" />
                  </TableCell>
                </TableRow>
              ))
            : data.length === 0 ?
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <span className="text-sm text-muted-foreground">
                    Nessun asteroide trovato per questo periodo.
                  </span>
                </TableCell>
              </TableRow>
            : data.map((asteroid) => {
                const approach = asteroid.close_approach_data[0];
                const isHaz = asteroid.is_potentially_hazardous_asteroid;
                return (
                  <TableRow
                    key={asteroid.id}
                    className="border-border hover:bg-surface-raised transition-colors cursor-pointer"
                  >
                    <TableCell>
                      <Link
                        href={`/asteroids/${asteroid.id}`}
                        className="text-sm font-medium text-foreground no-underline hover:text-primary transition-colors"
                      >
                        {asteroid.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="text-data">
                        {approach?.close_approach_date}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-data">
                        {formatDistance(approach?.miss_distance.kilometers)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-data">
                        {formatSpeed(
                          approach?.relative_velocity.kilometers_per_hour,
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-data">
                        {formatDiameter(
                          asteroid.estimated_diameter.kilometers
                            .estimated_diameter_min,
                          asteroid.estimated_diameter.kilometers
                            .estimated_diameter_max,
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`font-mono text-[11px] uppercase tracking-widest px-2.5 py-1 border rounded-xs ${
                          isHaz ?
                            "border-primary/40 text-primary bg-amber-muted"
                          : "border-border text-muted-foreground"
                        }`}
                      >
                        {isHaz ? "Pericoloso" : "Sicuro"}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            }
          </TableBody>
        </Table>
      </div>
    </div>
  );
};