import { formatDistance, formatSpeed } from "@/lib/utils";

export default async function Asteroid({ params }) {
  const { id } = await params;
  const res = await fetch(`http://localhost:8000/neo/${id}`);
  const data = await res.json();
  
  return (
    <div>
      {/* HEADER */}
      <div>
        <h1>{data.name}</h1>
        {data.is_potentially_hazardous_asteroid ?
          <p className="text-red-500">Potentially Hazardous</p>
        : <p className="text-green-500">Not Potentially Hazardous</p>}
        <a href={data.nasa_jpl_url} target="_blank">NASA jpl</a>
      </div>
      {/* DATA */}
      <div>
        <p>
          Estimated Diameter:{" "}
          {data.estimated_diameter.kilometers.estimated_diameter_min.toFixed(3)}{" "}
          -{" "}
          {data.estimated_diameter.kilometers.estimated_diameter_max.toFixed(3)}{" "}
          km
        </p>
        <p>Absolute Magnitude: {data.absolute_magnitude_h}</p>
        <p>
          Relative Velocity:{" "}
          {formatSpeed(
            data.close_approach_data[0]?.relative_velocity
              .kilometers_per_hour,
          )}
        </p>
      </div>

      {/* CLOSE APPROACH DATA TABLE */}
      <div>
        <h2>Close Approach Data</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Distance</th>
              <th>Velocity</th>
            </tr>
          </thead>
          <tbody>
            {data.close_approach_data.map((approach, index) => (
              <tr key={index}>
                <td>{approach.close_approach_date}</td>
                <td>{formatDistance(approach.miss_distance.kilometers)}</td>
                <td>{formatSpeed(approach.relative_velocity.kilometers_per_hour)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ORBITAL DATA */}
      <div>
        <h2>Orbital Data</h2>
        <p>First observation date: {data.orbital_data.first_observation_date}</p>
        <p>Last observation date: {data.orbital_data.last_observation_date}</p>
        <p>Orbital Period: {data.orbital_data.orbital_period} days</p>
        <p>Orbit Uncertainty: {data.orbital_data.orbit_uncertainty}</p>
        <p>Minimum Orbit Intersection: {data.orbital_data.minimum_orbit_intersection}</p>
      </div>

    </div>
  );
}
