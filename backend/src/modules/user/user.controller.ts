import { Response, NextFunction } from 'express';
import { userService } from './user.service';
import { AgentRequest } from '../auth/auth.middleware';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: unknown): email is string {
  return typeof email === 'string' && EMAIL_REGEX.test(email.trim());
}

export const userController = {
  async list(req: AgentRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 10));
      const result = await userService.list({
        agentId: req.agent.id,
        page,
        limit,
      });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  async create(req: AgentRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email } = req.body;

      if (!name || typeof name !== 'string' || !name.trim()) {
        res.status(400).json({ error: 'Name is required' });
        return;
      }
      if (!email || typeof email !== 'string' || !email.trim()) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }
      if (!validateEmail(email)) {
        res.status(400).json({ error: 'Invalid email format' });
        return;
      }

      const user = await userService.create(req.agent.id, {
        name: name.trim(),
        email: email.trim(),
      });
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  },

  async getById(req: AgentRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = await userService.getById(req.agent.id, id);
      res.status(200).json(user);
    } catch (err) {
      next(err);
    }
  },

  async block(req: AgentRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = await userService.setStatus(req.agent.id, id, 'BLOCKED');
      res.status(200).json(user);
    } catch (err) {
      next(err);
    }
  },

  async unblock(req: AgentRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = await userService.setStatus(req.agent.id, id, 'ACTIVE');
      res.status(200).json(user);
    } catch (err) {
      next(err);
    }
  },
};
