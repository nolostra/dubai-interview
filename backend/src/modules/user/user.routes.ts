import express, { Router, RequestHandler } from 'express';
import { authMiddleware, agentGuard } from '../auth/auth.middleware';
import { userController } from './user.controller';

const router: express.Router = Router();

// All routes require Agent auth; agent can only access their own users
router.use(authMiddleware, agentGuard);

router.get('/', userController.list.bind(userController) as unknown as RequestHandler);
router.post('/', userController.create.bind(userController) as unknown as RequestHandler);
router.get('/:id', userController.getById.bind(userController) as unknown as RequestHandler);
router.patch('/:id/block', userController.block.bind(userController) as unknown as RequestHandler);
router.patch('/:id/unblock', userController.unblock.bind(userController) as unknown as RequestHandler);

export const userRoutes: express.Router = router;
