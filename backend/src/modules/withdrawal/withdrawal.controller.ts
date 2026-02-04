import { Response, NextFunction } from 'express';
import { withdrawalService } from './withdrawal.service';
import { AgentRequest } from '../auth/auth.middleware';

export const withdrawalController = {
  async request(req: AgentRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const amount =
        typeof req.body.amount === 'number'
          ? req.body.amount
          : parseFloat(String(req.body.amount));

      if (!Number.isFinite(amount)) {
        res.status(400).json({ error: 'amount must be a number' });
        return;
      }

      const withdrawal = await withdrawalService.requestWithdrawal(req.agent.id, amount);
      res.status(201).json(withdrawal);
    } catch (err) {
      next(err);
    }
  },

  async list(req: AgentRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const list = await withdrawalService.listByAgent(req.agent.id);
      res.status(200).json({ withdrawals: list });
    } catch (err) {
      next(err);
    }
  },
};
