from fastapi import APIRouter
from services.nasa import fetch_feed_range, fetch_neo

router = APIRouter()

@router.get("/feed")
async def get_feed(start_date: str, end_date: str, is_hazardous: bool = None, sort_by: str = "distance"):
    data = await fetch_feed_range(start_date, end_date)
    asteroids = []
    
    # Unisco tutte le liste di asteroidi in un'unica lista
    for _, asteroids_list in data.items():
        asteroids.extend(asteroids_list)
    
    # Rimuovo gli asteroidi con id duplicati
    unique_asteroids = {}
    for asteroid in asteroids:
        unique_asteroids[asteroid["id"]] = asteroid

    asteroids = list(unique_asteroids.values())

    # Filtra per pericolosità se specificato
    if is_hazardous is not None:
        asteroids = [a for a in asteroids if a["is_potentially_hazardous_asteroid"] == is_hazardous]

    if sort_by == "distance":
        asteroids = sorted(asteroids, key=lambda a: float(a["close_approach_data"][0]["miss_distance"]["kilometers"]))
    elif sort_by == "velocity":
        asteroids = sorted(asteroids, key=lambda a: float(a["close_approach_data"][0]["relative_velocity"]["kilometers_per_hour"]))

    return {"asteroids": asteroids}

@router.get("/stats")
async def get_stats(start_date: str, end_date: str):
    data = await fetch_feed_range(start_date, end_date)
    
    asteroids = []
    
    # Unisco tutte le liste di asteroidi in un'unica lista
    for _, asteroids_list in data.items():
        asteroids.extend(asteroids_list)
    
    # Rimuovo gli asteroidi con id duplicati
    unique_asteroids = {}
    for asteroid in asteroids:
        unique_asteroids[asteroid["id"]] = asteroid
    asteroids = list(unique_asteroids.values())
    
    # Conto quanti asteroidi sono classificati come pericolosi
    hazardous_count = sum(1 for a in asteroids if a["is_potentially_hazardous_asteroid"])
    
    # Costruisco una lista di punti per lo scatter chart distanza/tempo
    # Ogni punto ha la data di avvicinamento e la distanza dalla Terra in km
    distance_over_time = [
        {
            "date": a["close_approach_data"][0]["close_approach_date"],
            "distance": float(a["close_approach_data"][0]["miss_distance"]["kilometers"])
        }
        for a in asteroids
    ]

    # Definisco le fasce di dimensione in km e inizializzo i contatori a zero
    size_distribution = {
        "0-0.1km": 0,
        "0.1-0.5km": 0,
        "0.5-1km": 0,
        "1km+": 0
    }

    for a in asteroids:
        # Calcolo il diametro medio tra il minimo e il massimo stimato
        diameter = (
            a["estimated_diameter"]["kilometers"]["estimated_diameter_min"] +
            a["estimated_diameter"]["kilometers"]["estimated_diameter_max"]
        ) / 2
        
        # Incremento il contatore della fascia corrispondente
        if diameter < 0.1:
            size_distribution["0-0.1km"] += 1
        elif diameter < 0.5:
            size_distribution["0.1-0.5km"] += 1
        elif diameter < 1:
            size_distribution["0.5-1km"] += 1
        else:
            size_distribution["1km+"] += 1
        
    # Converto il dizionario in lista per Recharts
    # Da {"0-0.1km": 17} a [{"range": "0-0.1km", "count": 17}]
    size_distribution_list = [
        {"range": k, "count": v} 
        for k, v in size_distribution.items()
    ] 
    
    return {
        "hazardous_count": hazardous_count,
        "non_hazardous_count": len(asteroids) - hazardous_count,
        "distance_over_time": distance_over_time,
        "size_distribution": size_distribution_list
    }
    
@router.get("/{neo_id}")
async def get_neo(neo_id: str):
    data = await fetch_neo(neo_id)
    return data