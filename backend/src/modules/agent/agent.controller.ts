import { Response, NextFunction } from 'express';
import { agentService } from './agent.service';
import { AgentRequest } from '../auth/auth.middleware';

export const agentController = {
  async getDashboard(
    req: AgentRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { agent } = req;
      const dashboard = await agentService.getDashboard(agent.id);
      res.status(200).json(dashboard);
    } catch (err) {
      next(err);
    }
  },

  getProfile(req: AgentRequest, res: Response): void {
    res.status(200).json({ agent: req.agent });
  },

  async updateProfile(req: AgentRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name } = req.body;
      if (!name || typeof name !== 'string' || !name.trim()) {
        res.status(400).json({ error: 'Name is required' });
        return;
      }
      const agent = await agentService.updateProfile(req.agent.id, name);
      res.status(200).json({ agent });
    } catch (err) {
      next(err);
    }
  },
};
