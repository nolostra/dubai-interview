import express, { Request, Response } from 'express';
import { authRoutes } from './modules/auth/auth.routes';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { logger } from './utils/logger';
import { agentRoutes } from './modules/agent/agent.routes';
import { userRoutes } from './modules/user/user.routes';
import { commissionRoutes } from './modules/commission/commission.routes';
import { withdrawalRoutes } from './modules/withdrawal/withdrawal.routes';
import { withdrawalAdminRoutes } from './modules/withdrawal/withdrawal.admin.routes';

const app: express.Application = express();

// CORS: allow configured origins (comma-separated) or localhost; normalize trailing slash
const normalizeOrigin = (o: string) => o.replace(/\/$/, '');
app.use((req, res, next) => {
  const origin = req.headers.origin as string | undefined;
  let allowOrigin: string | null = null;
  const corsEnv = process.env.CORS_ORIGIN?.trim();
  if (origin) {
    const normalized = normalizeOrigin(origin);
    if (corsEnv) {
      const allowed = corsEnv.split(',').map((s) => normalizeOrigin(s.trim()));
      if (allowed.includes(normalized)) allowOrigin = origin;
    } else if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      allowOrigin = origin;
    }
  }
  if (!allowOrigin) allowOrigin = 'http://localhost:5174';
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

app.get('/', (_req: Request, res: Response) => {
  res.json({ service: 'agent-panel-api', health: '/health', api: '/api' });
});

app.use('/api/auth', authRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/commissions', commissionRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/admin/withdrawals', withdrawalAdminRoutes);

app.get('/favicon.ico', (_req: Request, res: Response) => res.status(204).end());

app.use((req, _res, next) => {
  logger.warn('Not found', { method: req.method, path: req.path, url: req.url });
  next(Object.assign(new Error('Not found'), { statusCode: 404 }));
});
app.use(errorHandler);

export { app };
export default app;
