# Agent Dashboard (React + Tailwind)

Minimal React dashboard with login, KPI cards, earnings chart, users table, and withdrawals table.

## Setup

```bash
npm install
```

## Run

```bash
npm run dev
```

Open http://localhost:5173. Use the login page; after "login" you are redirected to the dashboard (token stored in `localStorage`). API URLs are placeholders in `src/api.ts`; set `VITE_API_URL` in `.env` to point at your backend.

## Build

```bash
npm run build
```
