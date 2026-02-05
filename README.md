# dubai-interview — Interview · Agent Panel MVP

Monorepo for a small Agent Panel MVP: **backend API** (Node.js + Express + Prisma + MongoDB) and **frontend dashboard** (React + Vite + Tailwind).

## Prerequisites

- Node.js (v18+)
- MongoDB (local or [Atlas](https://www.mongodb.com/cloud/atlas))
- npm or pnpm

## Quick start

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`: set `DATABASE_URL`, `JWT_SECRET`, and (optional) `ADMIN_API_KEY`.

```bash
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
```

Optional: create `.env` with `VITE_API_URL=http://localhost:3000/api`.

```bash
npm run dev
```

Frontend runs at **http://localhost:5173**.

### 3. Log in

Use **agent@example.com** / **agent123** (from seed) to log in and open the dashboard.

