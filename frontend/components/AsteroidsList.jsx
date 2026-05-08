"use client";
import {
  formatDiameter,
  formatDistance,
  formatSpeed,
  getLastWeekRange,
} from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const AsteroidsList = ({ asteroids }) => {
  const dates = getLastWeekRange();

  const [data, setData] = useState(asteroids);
  const [isHazardous, setIsHazardous] = useState(null);
  const [sortBy, setSortBy] = useState(null);
  const [dateFilter, setDateFilter] = useState({
    startDate: dates.startDate,
    endDate: dates.endDate,
  });

  console.log(data);

  const fetchAsteroids = async () => {
    let url = `http://localhost:8000/neo/feed?start_date=${dateFilter.startDate}&end_date=${dateFilter.endDate}`;
    if (isHazardous !== null) {
      url += `&is_hazardous=${isHazardous}`;
    }
    if (sortBy !== null) {
      url += `&sort_by=${sortBy}`;
    }

    console.log(url);
    const response = await fetch(url);
    const result = await response.json();
    setData(result.asteroids);
  };

  useEffect(() => {
    if (dateFilter.startDate && dateFilter.endDate) {
      fetchAsteroids();
    }
  }, [isHazardous, sortBy, dateFilter]);

  return (
    <div>
      <div>
        <p>Filter by Hazardousness:</p>
        <Select
          onValueChange={(value) =>
            setIsHazardous(value === "all" ? null : value === "hazardous")
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Tutti" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti</SelectItem>
            <SelectItem value="hazardous">Pericolosi</SelectItem>
            <SelectItem value="non-hazardous">Non pericolosi</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <p>Sort By:</p>
        <Select
          onValueChange={(value) =>
            setSortBy(value === "distance" ? "distance" : value === "velocity" ? "velocity" : null)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Tutti" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="distance">Distanza</SelectItem>
            <SelectItem value="velocity">Velocità</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        {data.map((asteroid) => (
          <div key={asteroid.id}>
            <Link href={`/asteroids/${asteroid.id}`}>
              <h3>{asteroid.name}</h3>
            </Link>
            {asteroid.is_potentially_hazardous_asteroid ?
              <p className="text-red-500">Potentially Hazardous</p>
            : <p className="text-green-500">Not Potentially Hazardous</p>}
            <p>
              Close Approach Data:{" "}
              {asteroid.close_approach_data[0]?.close_approach_date}
            </p>
            <p>
              Miss Distance:{" "}
              {formatDistance(
                asteroid.close_approach_data[0]?.miss_distance.kilometers,
              )}
            </p>
            <p>
              Relative Velocity:{" "}
              {formatSpeed(
                asteroid.close_approach_data[0]?.relative_velocity
                  .kilometers_per_hour,
              )}
            </p>
            <p>
              Diameter:{" "}
              {formatDiameter(
                asteroid.estimated_diameter.kilometers.estimated_diameter_min,
                asteroid.estimated_diameter.kilometers.estimated_diameter_max,
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
