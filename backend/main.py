from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import neo
from dotenv import load_dotenv

# Creazione dell'app FastAPI
app = FastAPI(title="NASA NEO Dashboard API")

app.add_middleware(
    CORSMiddleware,
    # In produzione metti il link del frontend invece di localhost
    allow_origins=[load_dotenv().get('FRONTEND_URL')],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Includi il router per le rotte relative ai NEO
app.include_router(neo.router, prefix="/neo")