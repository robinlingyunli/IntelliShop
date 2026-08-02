# IntelliShop

## Prerequisites

- Docker Desktop running
- Node.js
- Python (with `backend/venv` already set up)

## Start the database

```bash
cd IntelliShop
docker compose up -d
```

Postgres runs on `localhost:5433` (container auto-restarts with Docker Desktop after the first `up -d`).

## Start the backend

```bash
cd IntelliShop/backend
source venv/Scripts/activate
uvicorn main:app --reload --port 8000
```

Runs on `http://localhost:8000` (Swagger docs at `/docs`).

## Start the frontend

```bash
cd IntelliShop/frontend
npm run dev
```

Runs on `http://localhost:3000`.

## Notes

- All three (Docker, backend, frontend) need to be running for the site to work.
- If a port seems stuck/unresponsive after stopping and restarting the backend or frontend, a full computer reboot has reliably fixed it in the past.
