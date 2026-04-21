# QR Studio — Full-stack QR SaaS

Professional QR code generator with **React + Tailwind + Framer Motion** frontend and **FastAPI** backend: static and dynamic (tracked) codes, JWT auth, PostgreSQL/SQLite, scan analytics, rate limiting, and deployment-ready layout.

## Project layout

| Path | Purpose |
|------|---------|
| `backend/` | FastAPI app (`app/`), SQLite or PostgreSQL, JWT, QR PNG storage under `storage/` |
| `frontend/` | Vite + React + TypeScript, Tailwind CSS v4, Framer Motion, Recharts |
| `main.py` (root) | Legacy Flask demo (optional; not used by QR Studio) |

## Quick start (local)

### 1. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate       # macOS/Linux

pip install -r requirements.txt
copy .env.example .env          # edit SECRET_KEY and DATABASE_URL if needed

uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- API: `http://127.0.0.1:8000`
- Interactive docs: `http://127.0.0.1:8000/docs` (OpenAPI / Swagger)
- ReDoc: `http://127.0.0.1:8000/redoc`

Set **`PUBLIC_BASE_URL`** in `.env` to the URL users will scan (e.g. your Render/Railway URL). Dynamic QR images encode `{PUBLIC_BASE_URL}/r/{public_code}`.

**Auth:** Login returns a short-lived **access token** (JWT) and opaque **refresh token** (stored in the DB). The frontend refreshes access tokens on `401` and calls **`POST /api/auth/logout`** with the refresh token on sign-out.

**Redis (optional):** Set `REDIS_URL` (e.g. `redis://localhost:6379/0`) to use Redis for distributed rate limits and a short TTL cache for the analytics overview. Without Redis, SlowAPI handles rate limits in-process (single instance).

**Production CORS:** Set `ENVIRONMENT=production` and list **explicit** origins in `CORS_ORIGINS` (no `*`); the app will fail fast at startup if that rule is violated.

### 2. Frontend

```bash
cd frontend
npm install
copy .env.example .env          # optional: VITE_API_URL=http://127.0.0.1:8000

npm run dev
```

- App: `http://localhost:5173`

### 3. PostgreSQL (production)

Set in `backend/.env`:

```env
DATABASE_URL=postgresql+psycopg2://USER:PASSWORD@HOST:5432/DATABASE
```

SQLite (`sqlite:///./qr_saas.db`) is fine for local development.

## Features

- **Frontend:** Landing hero with animated QR preview, generator (static/dynamic, text/URL/email/phone), dashboard with copy/share, **lazy-loaded** analytics route (Recharts in a separate chunk), dark/light theme, responsive layout, Framer Motion transitions.
- **Backend:** QR generation (PNG on disk), dynamic redirect `/r/{code}` with scan logging (IP, user agent, device class), JWT access + **refresh tokens**, optional **Redis** rate limits + analytics cache, SlowAPI fallback when Redis is off, Pydantic validation.

## Deployment

### Frontend — Vercel

1. Root directory: `frontend`
2. Build command: `npm run build`
3. Output directory: `dist`
4. Environment variable: `VITE_API_URL=https://your-api.example.com` (no trailing slash)

### Backend — Render / Railway

1. Root directory: `backend`
2. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Set environment variables from `backend/.env.example` plus `DATABASE_URL` and a strong `SECRET_KEY`
4. Ensure `PUBLIC_BASE_URL` is your public API URL (HTTPS)

### Database — Supabase / managed PostgreSQL

Create a Postgres database and paste the connection string into `DATABASE_URL` using the `postgresql+psycopg2://` form.

## Security notes

- Change **`SECRET_KEY`** for any shared or production deployment.
- Use **`ENVIRONMENT=production`** with explicit **`CORS_ORIGINS`** (no wildcard).
- Access tokens are short-lived; refresh tokens are rotated server-side and can be revoked via **`POST /api/auth/logout`**.
- With **`REDIS_URL`**, rate limits are shared across API workers; without it, SlowAPI limits each process separately.

## API documentation

- **Swagger UI:** `/docs` on the running API
- **Summary:** see [`docs/API.md`](docs/API.md)

## License

Use and modify freely for your projects.
