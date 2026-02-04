import express, { Router } from 'express';
import { adminAuth } from '../../middleware/adminAuth';
import { withdrawalAdminController } from './withdrawal.admin.controller';

const router: express.Router = Router();

router.use(adminAuth);

router.patch(
  '/:id/approve',
  withdrawalAdminController.approve.bind(withdrawalAdminController)
);
router.patch(
  '/:id/reject',
  withdrawalAdminController.reject.bind(withdrawalAdminController)
);

export const withdrawalAdminRoutes: express.Router = router;
