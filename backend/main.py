from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import neo
import os

# Creazione dell'app FastAPI
app = FastAPI(title="NASA NEO Dashboard API")

allowed_origins = [
    "http://localhost:3000",
    "https://localhost:3000",
]

# Se è settata FRONTEND_URL come env, la aggiungiamo (sarà il dominio Vercel)
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    # Regex per accettare temporaneamente tutti i preview Vercel
    # (utili durante lo sviluppo, sono i deploy automatici per branch)
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(neo.router, prefix="/neo")