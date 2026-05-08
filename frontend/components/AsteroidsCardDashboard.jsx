import { formatDiameter, formatDistance, formatSpeed } from "@/lib/utils";

export const AsteroidsCardDashboard = ({ asteroid }) => {
  return (
    <div className="p-4 rounded-lg shadow-md">
      <h3>{asteroid.name}</h3>
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
          asteroid.estimated_diameter.kilometers.estimated_diameter_max
        )}
      </p>
    </div>
  );
};
