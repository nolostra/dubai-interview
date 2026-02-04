import express, { Router, RequestHandler } from 'express';
import { authMiddleware, agentGuard } from '../auth/auth.middleware';
import { commissionController } from './commission.controller';

const router: express.Router = Router();

// All routes require Agent auth; agent can only access their own commissions
router.use(authMiddleware, agentGuard);

router.post('/', commissionController.create.bind(commissionController) as unknown as RequestHandler);
router.get('/history', commissionController.getDateWiseHistory.bind(commissionController) as unknown as RequestHandler);

export const commissionRoutes: express.Router = router;
