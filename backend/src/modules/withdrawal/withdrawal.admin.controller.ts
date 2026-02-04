import { Request, Response, NextFunction } from 'express';
import { withdrawalService } from './withdrawal.service';

export const withdrawalAdminController = {
  async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const withdrawal = await withdrawalService.approveWithdrawal(id);
      res.status(200).json(withdrawal);
    } catch (err) {
      next(err);
    }
  },

  async reject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const withdrawal = await withdrawalService.rejectWithdrawal(id);
      res.status(200).json(withdrawal);
    } catch (err) {
      next(err);
    }
  },
};
