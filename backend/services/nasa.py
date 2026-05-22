import httpx
import logging
import os
import time
from fastapi import HTTPException
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

logger = logging.getLogger(__name__)
NASA_API_KEY = os.getenv("NASA_API_KEY")
NASA_BASE_URL = "https://api.nasa.gov/neo/rest/v1"

CACHE_TTL = 3600  # secondi (1 ora): quanto a lungo un dato resta valido in cache
cache = {}


def cache_get(key: str):
    """Ritorna il dato in cache se presente e non ancora scaduto, altrimenti None."""
    entry = cache.get(key)
    if entry is None:
        return None
    if time.time() > entry["expires_at"]:
        del cache[key]  # voce scaduta: la rimuoviamo per non accumulare dati vecchi
        return None
    return entry["data"]


def cache_set(key: str, data):
    """Salva il dato in cache con scadenza fra CACHE_TTL secondi."""
    cache[key] = {"data": data, "expires_at": time.time() + CACHE_TTL}


async def fetch_feed(start_date: str, end_date: str):
    cache_key = f"{start_date}_{end_date}"

    cached = cache_get(cache_key)
    if cached is not None:
        return cached

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{NASA_BASE_URL}/feed",
                params={
                    "start_date": start_date,
                    "end_date": end_date,
                    "api_key": NASA_API_KEY,
                },
            )
            response.raise_for_status()
            data = response.json()
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=503,
            detail="Il servizio NASA non risponde in questo momento. Riprova tra qualche istante.",
        )
    except httpx.HTTPStatusError as e:
        status = e.response.status_code
        if status == 429:
            logger.warning("NASA rate limit hit: feed %s – %s", start_date, end_date)
            raise HTTPException(
                status_code=429,
                detail="Limite di richieste NASA raggiunto. Riprova tra qualche minuto.",
                headers={"Retry-After": "60"},
            )
        raise HTTPException(
            status_code=503,
            detail="La NASA ha risposto con un errore imprevisto. Riprova tra qualche istante.",
        )
    except httpx.RequestError:
        raise HTTPException(
            status_code=503,
            detail="Connessione alla NASA non riuscita. Riprova tra qualche istante.",
        )

    cache_set(cache_key, data)
    return data

async def fetch_feed_range(start_date: str, end_date: str):
    start = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")

    chunks = []
    current = start
    while current < end:
        chunk_end = min(current + timedelta(days=7), end)
        chunks.append(
            await fetch_feed(current.strftime("%Y-%m-%d"), chunk_end.strftime("%Y-%m-%d"))
        )
        current = chunk_end

    result = {}
    for chunk in chunks:
        result.update(chunk["near_earth_objects"])
    return result

async def fetch_neo(neo_id: str):
    cache_key = f"neo_{neo_id}"

    cached = cache_get(cache_key)
    if cached is not None:
        return cached

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{NASA_BASE_URL}/neo/{neo_id}",
                params={"api_key": NASA_API_KEY},
            )
            response.raise_for_status()
            data = response.json()
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=503,
            detail="Il servizio NASA non risponde in questo momento. Riprova tra qualche istante.",
        )
    except httpx.HTTPStatusError as e:
        status = e.response.status_code
        if status == 429:
            logger.warning("NASA rate limit hit: neo/%s", neo_id)
            raise HTTPException(
                status_code=429,
                detail="Limite di richieste NASA raggiunto. Riprova tra qualche minuto.",
                headers={"Retry-After": "60"},
            )
        if status == 404:
            raise HTTPException(status_code=404, detail=f"Asteroide {neo_id} non trovato.")
        raise HTTPException(
            status_code=503,
            detail="La NASA ha risposto con un errore imprevisto. Riprova tra qualche istante.",
        )
    except httpx.RequestError:
        raise HTTPException(
            status_code=503,
            detail="Connessione alla NASA non riuscita. Riprova tra qualche istante.",
        )

    cache_set(cache_key, data)
    return data