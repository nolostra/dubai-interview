import express, { Request, Response } from 'express';
import { authRoutes } from './modules/auth/auth.routes';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { agentRoutes } from './modules/agent/agent.routes';
import { userRoutes } from './modules/user/user.routes';
import { commissionRoutes } from './modules/commission/commission.routes';
import { withdrawalRoutes } from './modules/withdrawal/withdrawal.routes';
import { withdrawalAdminRoutes } from './modules/withdrawal/withdrawal.admin.routes';

const app: express.Application = express();

// CORS: allow frontend (localhost / 127.0.0.1 on any port) to call API
app.use((req, res, next) => {
  const origin = req.headers.origin as string | undefined;
  let allowOrigin = process.env.CORS_ORIGIN || 'http://localhost:5174';
  if (!process.env.CORS_ORIGIN && origin && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
    allowOrigin = origin;
  }
  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Key');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.json());
app.use(requestLogger);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/commissions', commissionRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/admin/withdrawals', withdrawalAdminRoutes);

app.use((_req, _res, next) => {
  next(Object.assign(new Error('Not found'), { statusCode: 404 }));
});
app.use(errorHandler);

export { app };
