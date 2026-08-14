# IntelliShop

A full-stack e-commerce platform with a multi-vendor marketplace — built end to end with Next.js, FastAPI, and a Claude-powered AI shopping assistant featuring real tool-calling, streaming responses, and production-style safeguards (rate limiting, cost controls).

## Features

- **Auth** — registration/login for both customers and merchants, JWT-based sessions
- **Product catalog** — categories, search, price range and discount filters, sorting, pagination
- **Cart & checkout** — stock-aware ordering, order history
- **Wishlist** — save products for later
- **Merchant dashboard** — product management with image upload, order management, promotions/discount campaigns
- **AI shopping assistant** — a Claude-powered agent that can search products and manage the cart on the user's behalf (see [AI Shopping Assistant](#ai-shopping-assistant) below)
- **Dark mode**, responsive layout throughout

## AI Shopping Assistant

A floating chat widget (bottom-right corner) backed by Claude, available to any logged-in customer (not shown to merchant accounts, since it's a shopping tool, not a seller tool).

**What it can do**

- Search the product catalog by keyword and recommend real matches — it never invents products; every recommendation comes from an actual search result
- Check the contents of your cart
- Add products to your cart on your behalf, including adjusting quantity
- Answer general shopping questions in a normal back-and-forth conversation, streamed back token by token like a typical chat UI

**How to use it**

Click the chat icon, type what you're looking for in plain language (e.g. "find me a cheap desk lamp" or "add 2 of the bowl I just looked at to my cart"), and the assistant will call the relevant tool (search/cart) behind the scenes and reply with the result.

**Usage limits**

Because each message is a paid API call, the assistant has several built-in guardrails:

| Limit | Value | What happens if you hit it |
|---|---|---|
| Messages per user per day | 10 | Further messages are rejected until the next day with a clear in-chat message |
| Length of a single message | 500 characters | The message is rejected — shorten it and resend |
| Total conversation length per request | 4,000 characters | You'll be asked to start a new chat |
| Internal tool-call loop per request | 5 iterations | The assistant stops and asks you to rephrase, instead of looping indefinitely |

If the Anthropic API itself is unavailable (e.g. account credit exhausted), the assistant replies with a friendly "temporarily unavailable" message instead of breaking the chat.

## Tech Stack

**Frontend** — Next.js 16 (App Router, TypeScript), Tailwind CSS v4

**Backend** — FastAPI (Python), SQLAlchemy 2.0 (async), Alembic migrations

**Database** — PostgreSQL 17 (via Docker)

**AI** — Anthropic Claude API (tool use + streaming)

**Auth** — JWT (PyJWT + bcrypt)

## Project Structure

```
IntelliShop/
├── docker-compose.yml       # PostgreSQL container
├── backend/
│   ├── main.py               # FastAPI app entrypoint
│   ├── models.py             # SQLAlchemy models
│   ├── schemas.py            # Pydantic request/response schemas
│   ├── auth.py                # JWT auth helpers
│   ├── database.py            # DB session setup
│   ├── routers/                # API route modules
│   │   ├── auth.py, products.py, cart.py, orders.py
│   │   ├── wishlist.py, promotions.py
│   │   └── ai.py               # AI shopping assistant (tool loop + SSE streaming)
│   ├── alembic/                 # DB migrations
│   └── uploads/                  # Uploaded product images (local dev storage)
└── frontend/
    ├── app/                       # Next.js App Router pages
    │   ├── shop/, product/[id]/, cart/, orders/, wishlist/
    │   ├── login/, register/
    │   └── seller/                 # Merchant dashboard (products, orders, promotions)
    ├── components/                  # Shared UI (Nav, Footer, ProductCard, AiChat, ...)
    └── lib/                          # API client, React contexts, types, helpers
```

## Getting Started

**Prerequisites:** Node.js 20+, Python 3.11+, Docker

### 1. Start the database

```bash
git clone <repo-url>
cd IntelliShop
cp .env.example .env
docker compose up -d
```

### 2. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # macOS/Linux

pip install -r requirements.txt
cp .env.example .env        # fill in ANTHROPIC_API_KEY (see below)
python -m alembic upgrade head
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000` — interactive API docs at `http://localhost:8000/docs`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`.

## Environment Variables

**Root `.env`** (used by `docker-compose.yml`):

| Variable | Description |
|---|---|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Database credentials |
| `POSTGRES_PORT` | Host port mapped to Postgres (defaults to `5433` to avoid clashing with a local Postgres install) |

**`backend/.env`:**

| Variable | Description |
|---|---|
| `DATABASE_URL` | Async Postgres connection string, must match the root `.env` credentials |
| `JWT_SECRET_KEY` | Secret used to sign auth tokens — use a random string |
| `ANTHROPIC_API_KEY` | Your Anthropic API key ([console.anthropic.com](https://console.anthropic.com)). Required for the AI assistant feature — the rest of the site works fine without it |
| `ANTHROPIC_MODEL` | Optional, defaults to `claude-haiku-4-5-20251001` |

**`frontend/.env.local`:**

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL, defaults to `http://localhost:8000` |
