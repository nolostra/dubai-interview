# Interview Backend (Agent Panel API)

Node.js Express backend with TypeScript, Prisma (MongoDB), JWT, and bcrypt.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and set:
   - `DATABASE_URL` — MongoDB connection string
   - `JWT_SECRET` — Secret for signing JWTs
   - `ADMIN_API_KEY` — (optional) Key for admin withdrawal approve/reject (`X-Admin-Key` header)

3. Generate Prisma client and apply schema (MongoDB uses `db push`):
   ```bash
   npm run prisma:generate
   npx prisma db push
   ```

4. Seed dummy data (creates agent `agent@example.com` / `agent123` and sample users/commissions):
   ```bash
   npm run prisma:seed
   ```

5. Run in development:
   ```bash
   npm run dev
   ```

6. Build and run in production:
   ```bash
   npm run build
   npm start
   ```

## API (Agent Panel)

All protected routes require header: `Authorization: Bearer <token>` (from login).

### Auth (no token)
- `POST /api/auth/login` — Body: `{ "email", "password" }`. Returns `{ agent, token }`.
- `POST /api/auth/forgot-password` — Body: `{ "email" }`. Dummy flow (no email sent).

### Auth (with token)
- `GET /api/auth/me` — Current agent profile.
- `PATCH /api/auth/change-password` — Body: `{ "currentPassword", "newPassword" }`.

### Agents (with token)
- `GET /api/agents/dashboard` — KPIs: totalUsers, totalCommissionEarned, pendingCommission, withdrawableBalance, last7DaysEarnings.
- `GET /api/agents/profile` — Agent profile.
- `PATCH /api/agents/profile` — Body: `{ "name" }`.

### Users (with token)
- `GET /api/users?page=1&limit=10` — Paginated list of users under agent.
- `POST /api/users` — Body: `{ "name", "email" }`.
- `GET /api/users/:id` — User details.
- `PATCH /api/users/:id/block` — Block user.
- `PATCH /api/users/:id/unblock` — Unblock user.

### Commissions (with token)
- `POST /api/commissions` — Body: `{ "userId", "wagerAmount", "date" }` (optional YYYY-MM-DD). Commission 10%.
- `GET /api/commissions/history?startDate=&endDate=&format=` — Date-wise history. `format=csv` returns CSV download.

### Withdrawals (with token)
- `POST /api/withdrawals` — Body: `{ "amount" }`. Validates against withdrawable balance.
- `GET /api/withdrawals` — List agent’s withdrawals.

### Admin (header `X-Admin-Key: <ADMIN_API_KEY>`)
- `PATCH /api/admin/withdrawals/:id/approve` — Approve pending withdrawal.
- `PATCH /api/admin/withdrawals/:id/reject` — Reject pending withdrawal.

### Health
- `GET /health` — Health check.

## Postman

Import `postman/Agent-Panel-API.json` and set:
- Env var `baseUrl` = `http://localhost:3000`
- After login, set `token` from response and use in Authorization for protected requests.
