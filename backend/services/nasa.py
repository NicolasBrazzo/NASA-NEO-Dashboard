import httpx
import os
from dotenv import load_dotenv

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