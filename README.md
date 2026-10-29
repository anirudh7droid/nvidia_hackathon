# Autonomous Deep-Dive Research Agent

Built for the Nebius × NVIDIA Global AI Hackathon. A FastAPI backend runs a
3-step agentic pipeline (plan → search → synthesize) on Nebius AI Studio's
Nemotron model and Tavily search, streaming live progress and the final
cited Markdown report to a Next.js frontend over Server-Sent Events.

## Structure

- `backend/` — FastAPI + Uvicorn, SSE streaming, Nebius (OpenAI-compatible) + Tavily.
- `frontend/` — Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + Framer Motion.

## Backend setup

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env           # then fill in real keys
uvicorn main:app --reload --port 8000
```

Required `.env` values:

```
NEBIUS_API_KEY=...
TAVILY_API_KEY=...
```

## Frontend setup

```bash
cd frontend
npm install
cp .env.local.example .env.local   # defaults to http://localhost:8000
npm run dev
```

Open http://localhost:3000. The backend must be running on port 8000 (or
update `NEXT_PUBLIC_API_BASE_URL` in `.env.local`).

## Notes

- Without valid API keys, the agent degrades gracefully: the query planner
  falls back to naive queries if Nemotron's JSON response can't be parsed,
  and the pipeline surfaces a user-facing error (via a toast) if Tavily
  returns no sources.
- CORS is restricted to `http://localhost:3000` in `backend/main.py`.
