import express, { Router, RequestHandler } from 'express';
import { authController } from './auth.controller';
import { authMiddleware, agentGuard } from './auth.middleware';

const router: express.Router = Router();

router.post('/login', authController.login.bind(authController) as unknown as RequestHandler);
router.post('/forgot-password', authController.forgotPassword.bind(authController) as unknown as RequestHandler);

// Protected: requires valid JWT with Agent role and ACTIVE status
router.get('/me', authMiddleware, agentGuard, authController.me.bind(authController) as unknown as RequestHandler);
router.patch('/change-password', authMiddleware, agentGuard, authController.changePassword.bind(authController) as unknown as RequestHandler);

export const authRoutes: express.Router = router;
