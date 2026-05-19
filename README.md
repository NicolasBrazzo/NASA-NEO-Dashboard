# NASA NEO Dashboard

Dashboard full-stack per l'esplorazione degli asteroidi Near-Earth Objects tramite l'API NASA NeoWs.
Sviluppata come consegna per la challenge "NASA NEO Dashboard" di Arkemis / Il Programmatore Ignorante.

Frontend live: https://nasa-neo-dashboard-brz.vercel.app/
Backend live: https://nasa-neo-dashboard-production-d4ca.up.railway.app/

---

## Stack tecnico

**Backend**: Python · FastAPI 0.136.1 · httpx 0.28.1 · uvicorn 0.32.0
**Frontend**: Next.js 16.2.4 · React 19.2.4 · Tailwind CSS 4 · shadcn/ui
**Visualizzazioni**: Recharts 3.8.1 (grafici statistici) · SVG custom (radar HUD)
**Deploy**: Railway (backend) · Vercel (frontend)

---

## Funzionalita principali

- **Dashboard settimanale** (`/`): riepilogo degli asteroidi dell'ultima settimana, 3 KPI principali (totale, pericolosi, piu vicino) e radar visuale che posiziona ogni asteroide in scala logaritmica rispetto alla distanza Terra-Luna.
- **Lista asteroidi** (`/asteroids`): tabella completa con filtri per data, pericolosita e ordinamento per distanza o velocita.
- **Dettaglio asteroide** (`/asteroids/[id]`): dati orbitali, diametro stimato con comparatori di dimensione contestuali, radar storico degli avvicinamenti e tabella dei close approach.
- **Statistiche** (`/stats`): grafici aggregati su periodi configurabili — scatter della distanza nel tempo e distribuzione per fascia di diametro — con KPI calcolati lato client (totale, pericolosi, piu vicino, asteroidi sopra 1 km).

---

## Architettura

Il backend fa da proxy verso NASA: il frontend non chiama mai direttamente l'API NASA, e la chiave API non e mai esposta al client.

La NASA NeoWs API accetta al massimo 7 giorni per singola richiesta. Per range piu ampi, il backend spezza automaticamente l'intervallo in chunk da 7 giorni, li fetcha in sequenza e unisce i risultati. Gli asteroidi che compaiono in piu chunk (perche hanno avvicinamenti in giorni diversi) vengono deduplicati per ID prima di essere restituiti.

Il caching e in-memory: un dizionario Python (`cache = {}`) con chiave `"{start_date}_{end_date}"` per il feed e `"neo_{neo_id}"` per i dettagli singoli. Non c'e TTL: la cache persiste per tutta la vita del processo. Questo riduce le chiamate a NASA nelle sessioni attive, ma si svuota a ogni restart del backend.

---

## Endpoint backend

```
GET /neo/feed
  ?start_date=YYYY-MM-DD    (obbligatorio)
  ?end_date=YYYY-MM-DD      (obbligatorio)
  ?is_hazardous=true|false  (opzionale — filtra per pericolosita)
  ?sort_by=distance|velocity (opzionale — default: distance)

  → { "asteroids": [...] }
    Lista deduplicata e ordinata degli asteroidi nel periodo.
    Ogni oggetto contiene i campi NASA originali (close_approach_data,
    estimated_diameter, is_potentially_hazardous_asteroid, ecc.).


GET /neo/stats
  ?start_date=YYYY-MM-DD  (obbligatorio)
  ?end_date=YYYY-MM-DD    (obbligatorio)

  → {
      "hazardous_count": int,
      "non_hazardous_count": int,
      "distance_over_time": [{ "date": "YYYY-MM-DD", "distance": float }],
      "size_distribution": [
        { "range": "0-0.1km",   "count": int },
        { "range": "0.1-0.5km", "count": int },
        { "range": "0.5-1km",   "count": int },
        { "range": "1km+",      "count": int }
      ]
    }


GET /neo/{neo_id}
  → Oggetto NASA completo del singolo asteroide, con orbital_data
    e l'intero storico close_approach_data.
```

---

## Setup locale

### Backend

Prerequisiti: Python 3.9+

```bash
git clone <repo-url>
cd NASA_NEO_Dashboard/backend

python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt
```

Crea il file `.env` nella cartella `backend/`:

```env
NASA_API_KEY=la_tua_chiave_qui
FRONTEND_URL=http://localhost:3000
```

Ottieni una chiave API gratuita su https://api.nasa.gov (sezione "Generate API Key").

```bash
uvicorn main:app --reload --port 8000
```

Il backend risponde su `http://localhost:8000`.

### Frontend

Prerequisiti: Node.js 18+

```bash
cd NASA_NEO_Dashboard/frontend

npm install
```

Crea il file `.env.local` nella cartella `frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

```bash
npm run dev
```

Il frontend risponde su `http://localhost:3000`.

---

## Struttura cartelle

```
.
├── backend/
│   ├── main.py              # Entry point FastAPI, CORS middleware
│   ├── requirements.txt
│   ├── .env                 # (non in git) NASA_API_KEY, FRONTEND_URL
│   ├── routes/
│   │   └── neo.py           # Endpoint /neo/feed, /neo/stats, /neo/{id}
│   └── services/
│       └── nasa.py          # Fetch NASA API, cache in-memory, chunking
├── frontend/
│   ├── app/
│   │   ├── layout.js        # Root layout, Navbar, font Geist + Fraunces
│   │   ├── page.js          # / — Dashboard
│   │   ├── asteroids/
│   │   │   ├── page.js      # /asteroids — Lista
│   │   │   └── [id]/
│   │   │       └── page.js  # /asteroids/[id] — Dettaglio
│   │   └── stats/
│   │       └── page.js      # /stats — Statistiche
│   ├── components/
│   │   ├── AsteroidRadar.jsx    # SVG radar dashboard (scala log, golden angle)
│   │   ├── ApproachRadar.jsx    # SVG radar dettaglio (storico avvicinamenti)
│   │   ├── StatsCharts.jsx      # Recharts scatter + bar + KPI strip
│   │   ├── AsteroidsList.jsx
│   │   ├── AsteroidsCardDashboard.jsx
│   │   └── ui/              # Componenti shadcn
│   ├── lib/
│   │   ├── utils.js         # Helper date, distanze, formattazione italiana
│   │   └── sizeComparators.js # Hash deterministico + catalogo comparatori
│   ├── package.json
│   └── .env.local           # (non in git) NEXT_PUBLIC_API_URL
└── README.md
```

---

## Scelte di design e architettura

**Backend Python + frontend Next.js separati.** La traccia lo richiede, ma la separazione porta benefici concreti: la chiave NASA non e mai nel bundle del client, il backend puo aggregare e cachare dati che il frontend userebbe in piu richieste separate, e il chunking delle date e trasparente per il client.

**Cache in-memory senza TTL.** Un dizionario Python condiviso per l'intera vita del processo. E efficace per ridurre le chiamate a NASA durante una sessione, ma si svuota a ogni restart. Una cache con TTL o Redis sarebbe piu robusta, ma introduce complessita non giustificata per una challenge.

**Chunking trasparente delle date.** La funzione `fetch_feed_range()` in `services/nasa.py` spezza qualsiasi intervallo in chunk da 7 giorni, li fetcha in sequenza e unisce i `near_earth_objects` con `dict.update()`. La deduplica per ID avviene nel router, non nel service, per mantenere il service responsabile solo del fetch.

**Radar SVG custom invece di Recharts.** I componenti `AsteroidRadar` e `ApproachRadar` sono SVG puri con animazioni CSS (sweep 10s lineare, approach-pulse 2s, glow gaussiano). Il look HUD non era ottenibile con Recharts senza compromessi visivi. `AsteroidRadar` usa scala logaritmica per la distanza (asteroidi a 1 LD occupano piu spazio di quelli a 40 LD) e distribuzione a golden angle (137.5 gradi) per evitare sovrapposizioni. `ApproachRadar` usa scala lineare perche il range storico di un singolo asteroide e piu compresso.

**Stile editoriale.** Titoli in `Fraunces` (serif), dati e label in `Geist Mono`, palette dark con `oklch(0.78 0.16 65)` (ambra) come accento primario. I componenti shadcn sono usati come base strutturale ma le classi Tailwind sovrascrivono quasi tutto lo stile di default per coerenza con il language system.

---

## Limitazioni note

- **Cold start Railway**: il backend in free tier va in sleep dopo inattività. La prima richiesta dopo il sleep impiega ~30 secondi. Tutte le richieste successive sono normali.
- **Cache in-memory**: si svuota a ogni restart del processo. Su Railway il backend si riavvia spesso (sleep/wake), quindi la cache e praticamente inefficace in produzione tra sessioni distanti.
- **Nessun test automatico**: ne unit ne integration test. La correttezza dipende da test manuali.
- **Responsive mobile da rifinire**: il layout e ottimizzato per schermi >= 1280px. Su mobile alcune sezioni (radar, tabelle) non sono ottimali.
- **Nessuna gestione errori NASA API**: se NASA restituisce un errore (rate limit, downtime), il backend propaga il JSON di errore NASA al client senza gestione dedicata.

---

## Crediti e licenza

Dati: NASA NeoWs API — https://api.nasa.gov
Challenge: Arkemis / Il Programmatore Ignorante

Licenza MIT
