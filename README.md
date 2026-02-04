# Interview — Agent Panel MVP

Monorepo for a small **Agent Panel** MVP: backend API (Node.js + Express + Prisma + MongoDB) and frontend dashboard (React + Vite + Tailwind).

---

## Prerequisites

- **Node.js** (v18+)
- **MongoDB** (local or [Atlas](https://www.mongodb.com/atlas))
- **npm** or **pnpm**

---

## Quick start

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env: set DATABASE_URL, JWT_SECRET, (optional) ADMIN_API_KEY
npm run prisma:generate
npx prisma db push
npm run prisma:seed
npm run dev
```

Backend runs at **http://localhost:3000**.

### 2. Frontend

```bash
cd frontend
npm install
# Optional: create .env with VITE_API_URL=http://localhost:3000/api
npm run dev
```

Frontend runs at **http://localhost:5173**.

### 3. Log in

- **Email:** `agent@example.com`  
- **Password:** `agent123`  

(Seeded by `npm run prisma:seed` in the backend.)

---

## Project layout

| Folder      | Stack                          | Description                                      |
|------------|---------------------------------|--------------------------------------------------|
| **backend/**  | Node.js, Express, TypeScript, Prisma, MongoDB, JWT, bcrypt | REST API: auth, dashboard, users, commissions, withdrawals |
| **frontend/** | React, Vite, Tailwind, React Router           | Login, dashboard, users, commissions, withdrawals, settings |

---

## Environment

### Backend (`backend/.env`)

| Variable        | Description                                      |
|----------------|--------------------------------------------------|
| `DATABASE_URL` | MongoDB connection string (e.g. `mongodb://localhost:27017/interview_db`) |
| `JWT_SECRET`   | Secret for signing JWTs                          |
| `JWT_EXPIRES_IN` | Token expiry (default `7d`)                    |
| `ADMIN_API_KEY` | Optional; for admin approve/reject withdrawals (`X-Admin-Key` header) |

### Frontend (`frontend/.env`)

| Variable        | Description                                      |
|----------------|--------------------------------------------------|
| `VITE_API_URL` | Backend API base (default `http://localhost:3000/api`) |

---

## More details

- **Backend API & setup:** [backend/README.md](backend/README.md)  
- **Frontend setup:** [frontend/README.md](frontend/README.md)  
- **Task status & API list:** [AGENT_PANEL_STATUS.md](AGENT_PANEL_STATUS.md)

---

## One-liner (after env is set)

```bash
# Terminal 1
cd backend && npm install && npm run prisma:generate && npx prisma db push && npm run prisma:seed && npm run dev

# Terminal 2
cd frontend && npm install && npm run dev
```

Then open http://localhost:5173 and log in with `agent@example.com` / `agent123`.
