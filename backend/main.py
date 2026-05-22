from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routes import neo
import os

load_dotenv()

# Creazione dell'app FastAPI
app = FastAPI(title="NASA NEO Dashboard API")

# Origini consentite lette da .env (ALLOWED_ORIGINS), separate da virgola.
# Se la variabile non è settata si usano i default per lo sviluppo locale.
_default_origins = "http://localhost:3000,https://localhost:3000"
allowed_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", _default_origins).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    # Regex per accettare temporaneamente tutti i preview Vercel
    # (utili durante lo sviluppo, sono i deploy automatici per branch)
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Retry-After"],
)

app.include_router(neo.router, prefix="/neo")