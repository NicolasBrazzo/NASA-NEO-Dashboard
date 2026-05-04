import httpx
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

NASA_API_KEY = os.getenv("NASA_API_KEY")
NASA_BASE_URL = "https://api.nasa.gov/neo/rest/v1"

cache = {}

async def fetch_feed(start_date: str, end_date: str):
    cache_key = f"{start_date}_{end_date}"
    
    if cache_key in cache:
        return cache[cache_key]
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{NASA_BASE_URL}/feed",
            params={
                "start_date": start_date,
                "end_date": end_date,
                "api_key": NASA_API_KEY
            }
        )
        data = response.json()
    
    cache[cache_key] = data
    return data

async def fetch_feed_range(start_date: str, end_date: str):
    start = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date , "%Y-%m-%d")
    
    data = []
    
    current = start 
    while current < end:  
        chunk_end = min(current + timedelta(days=7), end)
        data.append(await fetch_feed(current.strftime("%Y-%m-%d"), chunk_end.strftime("%Y-%m-%d")))
        current = chunk_end 
        
    result = {}
    for chunk in data:
        result.update(chunk["near_earth_objects"])
        
    return result
