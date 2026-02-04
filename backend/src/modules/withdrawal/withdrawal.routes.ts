import express, { Router, RequestHandler } from 'express';
import { authMiddleware, agentGuard } from '../auth/auth.middleware';
import { withdrawalController } from './withdrawal.controller';

const router: express.Router = Router();

// All routes require Agent auth; agent can only access their own withdrawals
router.use(authMiddleware, agentGuard);

router.post('/', withdrawalController.request.bind(withdrawalController) as unknown as RequestHandler);
router.get('/', withdrawalController.list.bind(withdrawalController) as unknown as RequestHandler);

export const withdrawalRoutes: express.Router = router;
