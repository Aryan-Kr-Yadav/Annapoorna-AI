# KrishiMitra AI 2.0

**An Intelligent Farm Management & Decision-Support Platform**

KrishiMitra AI 2.0 follows a farmer's crop through its entire lifecycle —
sowing, daily tasks, irrigation, soil, crop health, expenses, harvest,
and profit — with a context-aware AI assistant (KrishiMitra AI, powered
by Groq) layered on top of deterministic farm data rather than
replacing it.

This repository replaces the original Node/Express + React + Gemini
prototype with a production-shaped stack:

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Backend | FastAPI (Python) + SQLAlchemy + Alembic |
| Database | PostgreSQL + pgvector (for RAG) |
| AI | Groq (chat, vision, tool-calling) — backend-only |
| Auth | Self-hosted JWT (bcrypt + python-jose) |
| Image storage | Cloudinary or S3 (pluggable) |

---

## 1. Architecture

```
User → Farm → Crop Cycle → Farm Intelligence
```

A user can own multiple farms; each farm can have multiple crop cycles
(e.g. "Wheat — Rabi 2026", "Rice — Kharif 2027"). Tasks, irrigation
logs, soil tests, diagnoses, expenses and harvests all belong to a
crop cycle, which is what makes season-over-season analytics possible.

```
Next.js (Vercel)  →  FastAPI (Render/Railway)  →  PostgreSQL + pgvector (Neon/Supabase)
                              │
                              ├─ Groq (chat, vision, tool-calling) — backend only
                              ├─ Weather provider (via WeatherService abstraction)
                              ├─ Market data provider (cached, never live-claimed)
                              └─ Cloudinary / S3 (via storage abstraction)
```

**The one rule that shapes everything:** Groq is never the source of
truth for arithmetic, crop-stage calculation, expense totals, profit,
soil thresholds, or scheme eligibility. All of that is computed by
plain Python/SQL in `app/services/` and `app/data/`. Groq only
explains, converses, and retrieves — via a fixed, ownership-checked set
of tool functions (`app/ai/tools.py`) — data the backend already
computed.

---

## 2. What's implemented vs. what's a starting point

**Fully implemented, end-to-end (backend API + working frontend UI):**
farm/crop CRUD, deterministic crop lifecycle engine, task management,
irrigation logging, soil test recording with reference-range ratings,
Crop Doctor (image/symptom diagnosis via Groq vision, honest
"confidence unavailable" handling), expense tracking, harvest + profit/
ROI calculation, season reports, farm dashboard, weather (via
OpenWeatherMap, gracefully degrading if unconfigured), rule-based
irrigation alerts, government schemes navigator (seeded with 5 real
schemes), a floating + full-page AI assistant with tool-calling and
chat memory, RAG scaffolding (pgvector), a Smart Crop Planner using
deterministic agronomic rules, and a Crop Suitability/Analytics
dashboard with Recharts.

**Deliberately left as a scaffold for you to finish, because they need
real accounts/data you'll supply:**
- **Market intelligence**: the caching table, service, and UI are built,
  but there's no ingestion job pulling from a real mandi price API yet.
- **RAG knowledge base**: `knowledge_documents`/`knowledge_chunks` and
  the retrieval pipeline exist, but no documents have been ingested. See
  §7 below.
- **Notifications**: the model, service, and API exist; nothing yet
  proactively creates notifications (e.g. a daily scheduled job).
- **Daily farm briefing** (spec §24) and **voice input** (spec §27) are
  not built — the chat pipeline is architected so voice can plug in as
  another input to the same `/chat` endpoints later, and the dashboard's
  data already contains everything a deterministic daily briefing needs
  to compose, once you decide on the copy/format.
- **Notification-driven alerts** beyond the one irrigation rule shown on
  the dashboard.

**Removed from the original project:** the Gemini-based diagnosis/
schemes flow, the Express backend, the Vite/React frontend, and an
unresolved Git merge conflict that had corrupted
`backend/services/geminiService.js` and `backend/.env.example` in the
original repo (mentioned for the record — nothing to act on, since
none of that code carried forward).

---

## 3. Repository layout

```
backend/
  app/
    core/        # config, DB session, JWT auth, storage abstraction
    models/       # SQLAlchemy models (16 tables)
    schemas/      # Pydantic request/response schemas
    routers/      # one file per API area
    services/     # deterministic business logic (lifecycle, analytics, advisory, weather, market, schemes, notifications)
    ai/           # Groq client, tool-calling, context builder, RAG, prompts
    data/         # static reference data: crop lifecycles, soil ranges, crop suitability, schemes seed
  alembic/        # migrations
  scripts/        # seed_schemes.py
  tests/          # pytest — lifecycle, profit/expense math, ownership, advisory rules, soil ratings
  requirements.txt
  .env.example

frontend/
  app/            # Next.js App Router pages
  components/     # layout, assistant, dashboard, ui primitives
  lib/            # API client, types, farm context, utils
  package.json
  .env.example
```

---

## 4. Local setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- A PostgreSQL database with the `vector` extension available (a fresh
  local Postgres 15+/16 install has this if you `CREATE EXTENSION vector;`
  — see Neon/Supabase docs if you're using a managed instance)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # or venv\Scripts\activate on Windows
pip install -r requirements.txt

cp .env.example .env
# Fill in DATABASE_URL at minimum, and generate a JWT_SECRET_KEY:
#   python -c "import secrets; print(secrets.token_urlsafe(64))"
# Leave DEV_AUTH_BYPASS=true if you want to run the API before wiring up
# real accounts — never do this in production.

alembic upgrade head             # creates all tables + the vector extension
python -m scripts.seed_schemes    # loads the starter schemes data

uvicorn app.main:app --reload --port 8000
```

Visit `http://localhost:8000/docs` for interactive OpenAPI docs.

### Frontend

```bash
cd frontend
npm install

cp .env.example .env.local
# Fill in NEXT_PUBLIC_API_BASE_URL (defaults to localhost:8000 already).

npm run dev
```

Visit `http://localhost:3000`, click **Sign up**, and create an account —
this calls the backend's `/auth/register` directly (no third-party auth
provider involved).

---

## 5. Environment variables

See `backend/.env.example` and `frontend/.env.example` for the full,
commented list. At minimum, to run the whole stack for real (not
`DEV_AUTH_BYPASS`) you need:

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Neon / Supabase / any Postgres with `pgvector` |
| `JWT_SECRET_KEY` | Generate one: `python -c "import secrets; print(secrets.token_urlsafe(64))"` — keep it secret and stable (rotating it logs everyone out) |
| `XAI_API_KEY` | x.ai developer console |
| `WEATHER_API_KEY` | openweathermap.org (or swap the provider in `app/services/weather_service.py`) |
| `CLOUDINARY_URL` (or S3 creds) | cloudinary.com, or your AWS account |
| `MARKET_DATA_API_KEY` / `MARKET_DATA_BASE_URL` | e.g. data.gov.in's Agmarknet API — you'll need to write the small ingestion job that populates `cached_market_prices` |

The frontend only needs `NEXT_PUBLIC_API_BASE_URL` — there's no third-party
auth provider to configure.

---

## 6. Database migrations

The initial migration (`alembic/versions/0001_initial_schema.py`)
creates every table via `Base.metadata.create_all(...)` rather than 16
hand-written `op.create_table()` blocks — correct and fully reversible
for a brand-new database. **After running it once, generate all future
migrations the normal way:**

```bash
alembic revision --autogenerate -m "describe your change"
alembic upgrade head
```

---

## 7. Adding RAG knowledge content

`app/ai/rag.py` implements retrieval; nothing has been ingested yet.
To add a document:

```python
from app.core.database import SessionLocal
from app.models.knowledge import KnowledgeDocument
from app.ai.rag import embed_and_store_document

db = SessionLocal()
doc = KnowledgeDocument(title="...", category="disease_info", source_url="...")
db.add(doc); db.commit(); db.refresh(doc)

# chunks: split your source text into ~300-500 word pieces yourself first
await embed_and_store_document(db, doc, chunks=["chunk 1 text...", "chunk 2 text..."])
```

**Important caveat:** `app/ai/groq_client.create_embedding()` is
written against an OpenAI-compatible `/embeddings` schema as a
placeholder. If Groq's public API doesn't expose embeddings when you
build this out, swap in any embedding provider inside that one
function — nothing else needs to change.

---

## 8. Testing

```bash
cd backend
pytest -v
```

18 tests cover the crop lifecycle engine, profit/expense arithmetic,
ownership-check enforcement, rule-based irrigation alerts, and soil
reference-range ratings — the deterministic logic the "no fake data" /
"Groq never does arithmetic" rules depend on.

---

## 9. Deployment

- **Frontend → Vercel**: import the `frontend/` directory as the
  project root; set the env vars from §5.
- **Backend → Render or Railway**: point at `backend/`, start command
  `uvicorn app.main:app --host 0.0.0.0 --port $PORT`, run `alembic
  upgrade head` as a release/pre-deploy step.
- **Database → Neon or Supabase**: enable the `vector` extension in
  their dashboard/SQL editor before running migrations.

---

## 10. Security notes

- Every endpoint except `/auth/register`, `/auth/login`, `/`, and the
  health check requires a valid Bearer JWT, issued by this backend and
  verified with `python-jose` on every request (`app/core/security.py`).
- Passwords are hashed with bcrypt (via the `bcrypt` package) and never
  stored or logged in plain text. Login/register return an identical
  error for "no such user" and "wrong password" to avoid leaking which
  emails are registered.
- The frontend stores the JWT in a plain (non-httpOnly) cookie so both
  `middleware.ts` (route gating) and the browser-side API client (to set
  the `Authorization` header) can read it. **Trade-off, by design:** this
  is no more XSS-resistant than `localStorage` would be. If you need
  stronger protection, move to an httpOnly cookie set by a Next.js Route
  Handler that proxies calls to the backend (a small "BFF" layer),
  instead of calling FastAPI directly from the browser as this app does.
- Every farm/crop/task/etc. lookup goes through
  `app/services/ownership.py`, which joins back to `Farm.user_id` — a
  user can never read or modify another user's data, and Groq's tool
  functions enforce the same check.
- `GROQ_API_KEY` is read only from backend environment variables and is
  never sent to, or readable by, any frontend code.
- Uploaded images are validated for content-type and size (5MB limit)
  before being handed to the storage backend.

---

## 11. What to do next (suggested order)

1. Generate a `JWT_SECRET_KEY`, run `alembic upgrade head` against a
   real Postgres instance, and confirm `/auth/register` → `/farms` →
   `/farms/{id}/crops` works end-to-end from the frontend.
2. Get a Groq API key and test the chat assistant and Crop Doctor with
   Groq live (confirm the embeddings endpoint situation from §7 while
   you're there).
3. Get a weather API key and confirm the dashboard's weather card and
   irrigation alert populate correctly.
4. Review and expand the seeded schemes data in
   `app/data/schemes_seed.py` (dates are intentionally left blank —
   fill in real `last_verified` dates once you've checked each one).
5. Wire up a market-price ingestion job and RAG content before relying
   on those two features in front of real farmers.
