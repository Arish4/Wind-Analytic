# Windcast: day-ahead wind forecast intelligence

A pilot web app for a UK utility's day-ahead trading desk. It answers two questions for every purchase decision
made in **January 2026**:

1. **What did the latest wind forecast say at the moment we had to decide?**
2. **How wrong do those forecasts tend to be?** Measured as MAE, RMSE, bias, P10/P50/P90 error, by hour of
   day, by delivery day and by forecast lead time.

**Live app:** `<add your Vercel URL here>`

Data: Elexon BMRS only, national level, wind only:
[FUELHH](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream) (actuals, `fuelType = WIND`)
and [WINDFOR](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream) (forecasts).

---

## Headline findings (default 09:00 cutoff, delivery 2 Jan – 1 Feb 2026)

| Metric | Value |
|---|---|
| Hourly samples | 744 |
| Mean absolute error | 2.02 GW (17.9% of mean output) |
| RMSE | 2.50 GW |
| Bias | **+1.75 GW**: forecasts ran high, so a desk trusting them would under-buy |
| P90 error ("shortfall buffer") | 4.2 GW covers 9 in 10 hours |
| Hardest hour | 05:00 (≈2.4 GW MAE) |
| Lead time | 0–6h forecasts miss 28% less than 48–72h ones |

---

## How the analysis works

- **Delivery day D** is a UK local day. The decision for D is made on **D‑1 at the cutoff** (default 09:00 UK,
  adjustable in the UI).
- "Purchase decisions in January 2026" means decisions on 1–31 Jan, so **delivery days 2 Jan – 1 Feb**.
- For each target hour of D we take the **newest WINDFOR forecast published at or before the deadline**. That is
  the forecast the trader really had.
- WINDFOR is hourly and FUELHH is half-hourly, so they are joined on identical `startTime` (the HH:00 slots).
- Error is defined as `forecast − actual`, so a **positive** error means less wind arrived than planned (shortfall
  risk). The P90 of that error is the buffer that would have covered 90% of hours.
- The lead-time view uses **every** forecast for those hours (not only the decision one), grouped into horizon
  buckets (0–6h … 48–72h).

---

## Architecture

```
React (clean architecture)  ──HTTP/JSON──▶  Django REST API (layered)  ──▶  Elexon BMRS
                                               └─ file cache (24h)
```

Two ways to run the same code:
- **Docker** (local or any container host): one image runs Django with gunicorn, and WhiteNoise serves the built
  React app from the same origin.
- **Vercel** (the hosted demo): the React build is served as static files, and Django runs as a Python
  serverless function (`api/index.py`) behind `/api/*`. It's still the same origin, so no CORS is needed.

### Backend: layered architecture (Django + DRF)

Dependencies point inwards only: `api → application → domain`, and `infrastructure` implements the
application's ports.

| Layer | Folder | Responsibility |
|---|---|---|
| Domain | `forecasting/domain/` | Pure Python business rules: entities, decision deadline, forecast selection, error metrics, horizon buckets. No Django, no I/O. |
| Application | `forecasting/application/` | Use cases (`BuildDayAheadReport`, `BuildHorizonReport`), the ports they depend on (`ActualGenerationSource`, `ForecastSource`) and the pilot scope. |
| Infrastructure | `forecasting/infrastructure/` | Elexon HTTP client, Elexon implementations of the ports, caching decorators. |
| Interface | `forecasting/api/` | DRF views, query validation (serializers), JSON presenters, error mapping (upstream down → 503). |
| Composition root | `forecasting/container.py` | The only place that picks concrete classes; tests swap in fakes. |

How SOLID shows up:
- **S**: each module has one job (selection, metrics, HTTP, caching, presentation).
- **O**: caching is added by wrapping a source (decorator), with no change to the Elexon code.
- **L**: any `ForecastSource` works: Elexon, cached, or the in-memory fake used in tests.
- **I**: two small ports instead of one "data service".
- **D**: use cases depend on `Protocol` ports; `container.py` injects the implementations.

### Frontend: clean architecture (React + TypeScript + Vite)

| Layer | Folder | Responsibility |
|---|---|---|
| Domain | `src/domain/` | Types and pure business logic (`insights.ts`: shortfall buffer, bias direction, hardest hour, freshness gain). |
| Application | `src/application/` | `ForecastGateway` port and use cases (`LoadForecastDashboard`, `LoadPilotMeta`). |
| Infrastructure | `src/infrastructure/` | `HttpForecastGateway`: calls the API and maps snake_case DTOs to domain models. |
| Presentation | `src/presentation/` | React components, pages, hooks, styles. Use cases are injected via React context. |
| Composition root | `src/main.tsx` | Wires the gateway into the use cases. |

---

## Files and directories

```
wind-forecast/
├── Dockerfile               multi-stage: build React, then Python image serving API + static app
├── docker-compose.yml       run everything locally with one command
├── vercel.json              Vercel build (React static) + routing of /api/* to the Python function
├── api/index.py             Vercel serverless entry point that exposes the Django WSGI app
├── requirements.txt         points Vercel at backend/requirements.txt
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── config/              Django settings, urls, wsgi
│   ├── forecasting/
│   │   ├── domain/          entities, delivery (deadline), forecast_selection, metrics, horizon
│   │   ├── application/     ports, use_cases, scope (pilot period + default cutoff)
│   │   ├── infrastructure/  elexon_client, elexon_sources, cached_sources
│   │   ├── api/             views, serializers, presenters, exceptions, urls
│   │   └── container.py     dependency wiring
│   └── tests/               domain unit tests + API tests with in-memory fakes
└── frontend/
    ├── index.html, vite.config.ts, package.json, tsconfig.json
    └── src/
        ├── domain/          models, insights, daySnapshot, dates (+ tests)
        ├── application/     ForecastGateway port, use cases (+ tests)
        ├── infrastructure/  HttpForecastGateway
        ├── presentation/    components/, pages/, hooks/, styles/, format.ts, dependencies.tsx
        └── main.tsx
```

## API

| Endpoint | Description |
|---|---|
| `GET /api/health` | Liveness check |
| `GET /api/meta` | Pilot period, default cutoff |
| `GET /api/reports/day-ahead?start=2026-01-02&end=2026-02-01&cutoff=09:00` | Decision-time forecast vs actual, summary, by hour, by day |
| `GET /api/reports/horizon?start=2026-01-02&end=2026-02-01` | Error by forecast lead time |

---

## Running it

### With Docker (recommended)

```bash
docker compose up --build
```
Open http://localhost:8000.

### Without Docker (development)

Backend (Python 3.12):
```bash
cd backend
python -m venv .venv
.venv/Scripts/activate        # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python manage.py runserver 8010
```

Frontend (Node 20+), in a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173. Vite proxies `/api` to Django on port 8010.

### Tests

```bash
cd backend && python manage.py test tests
cd frontend && npm test
```

### Deploying to Vercel

1. Push the repo to GitHub.
2. On [vercel.com](https://vercel.com), click **Add New → Project**, import the repo, and keep the **Root
   Directory** as the repo root. `vercel.json` already sets the install, build and output commands.
3. Under **Environment Variables**, add `DJANGO_SECRET_KEY` with any long random string.
4. Click **Deploy**. Vercel builds `frontend/` into static files and turns `api/index.py` into a Python
   function serving `/api/*`.

Or from the command line: `npm i -g vercel`, then `vercel` (preview) and `vercel --prod` (production).

Vercel doesn't run Docker containers, so Docker is used for local runs and container hosts, and Vercel for
the hosted demo. On Vercel the Elexon cache lives in `/tmp` for as long as a function instance stays warm, so
the first request after a cold start takes a few seconds.

### Configuration (environment variables)

| Variable | Default | Purpose |
|---|---|---|
| `DJANGO_SECRET_KEY` | dev key | Set in production |
| `DJANGO_DEBUG` | `true` (`false` in Docker) | |
| `DJANGO_ALLOWED_HOSTS` | `*` | |
| `ELEXON_CACHE_SECONDS` | `86400` | Cache time for Elexon responses |
| `FRONTEND_DIST` | `../frontend/dist` | Built React app served by WhiteNoise |
| `VITE_API_BASE_URL` | empty (same origin) | Only if the frontend is hosted separately |

---

## Design decisions and limits

- **No database**: the data is public, historical and small (~20k forecast rows), so a file cache is enough and
  there are no migrations to manage.
- **The decision cutoff is a parameter** because exchanges and internal processes differ. Moving it from 09:00 to
  12:00 lets the 11:30 forecast in and lowers MAE (2.02 → 1.88 GW).
- The comparison is hourly (WINDFOR resolution). The FUELHH :30 slots are not used.
- The scope is fixed to the pilot window, and the API rejects dates outside it.

## AI tools

This project was built with help from **Claude (Anthropic) via Claude Code**, which was used for scaffolding, code
generation, tests and documentation. All analysis choices were reviewed and the output was checked against the
live Elexon data.
