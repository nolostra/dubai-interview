import express, { Router, RequestHandler } from 'express';
import { authMiddleware, agentGuard } from '../auth/auth.middleware';
import { agentController } from './agent.controller';

const router: express.Router = Router();

// All routes below require Agent auth (JWT + ACTIVE status)
router.use(authMiddleware, agentGuard);

router.get('/dashboard', agentController.getDashboard.bind(agentController) as unknown as RequestHandler);
router.get('/profile', agentController.getProfile.bind(agentController) as unknown as RequestHandler);
router.patch('/profile', agentController.updateProfile.bind(agentController) as unknown as RequestHandler);

export const agentRoutes: express.Router = router;
