"use client";
import { formatDiameter, formatDistance, formatSpeed } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";

export const AsteroidsList = ({ asteroids }) => {
  const [data, setData] = useState(asteroids);
  const [isHazardous, setIsHazardous] = useState(null);
  const [sortBy, setSortBy] = useState(null);
  const [dateFilter, setDateFilter] = useState({
    startDate: "",
    endDate: "",
  });

  const fetchAsteroids = async () => {
    let url = `http://localhost:8000/neo/feed?start_date=${dateFilter.startDate}&end_date=${dateFilter.endDate}`;
    if (isHazardous !== null) {
      url += `&is_hazardous=${isHazardous}`;
    }
    if (sortBy !== null) {
      url += `&sort_by=${sortBy}`;
    }
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
  );
};
