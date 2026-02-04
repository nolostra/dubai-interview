import { Response, NextFunction } from 'express';
import { commissionService } from './commission.service';
import { AgentRequest } from '../auth/auth.middleware';

export const commissionController = {
  async create(req: AgentRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, wagerAmount, date } = req.body;

      if (!userId || typeof userId !== 'string' || !userId.trim()) {
        res.status(400).json({ error: 'userId is required' });
        return;
      }
      const wager = typeof wagerAmount === 'number' ? wagerAmount : parseFloat(String(wagerAmount));
      if (!Number.isFinite(wager)) {
        res.status(400).json({ error: 'wagerAmount must be a number' });
        return;
      }

      const record = await commissionService.createCommission(req.agent.id, {
        userId: userId.trim(),
        wagerAmount: wager,
        date: typeof date === 'string' && date.trim() ? date.trim() : undefined,
      });
      res.status(201).json(record);
    } catch (err) {
      next(err);
    }
  },

  async getDateWiseHistory(req: AgentRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
      const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : undefined;
      const format = typeof req.query.format === 'string' ? req.query.format : undefined;

      const result = await commissionService.getDateWiseHistory(
        req.agent.id,
        startDate,
        endDate
      );

      if (format === 'csv') {
        const header = 'date,totalAmount,count';
        const rows = result.history.map((r) => `${r.date},${r.totalAmount},${r.count}`);
        const csv = [header, ...rows].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="commission-history.csv"');
        res.status(200).send(csv);
        return;
      }

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
};
