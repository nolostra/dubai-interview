import { Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { AgentRequest } from './auth.middleware';

export const authController = {
  async login(req: import('express').Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || typeof email !== 'string' || !email.trim()) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }
      if (!password || typeof password !== 'string') {
        res.status(400).json({ error: 'Password is required' });
        return;
      }

      const result = await authService.login({
        email: email.trim(),
        password,
      });

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  async me(req: AgentRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({ agent: req.agent });
    } catch (err) {
      next(err);
    }
  },

  async forgotPassword(req: import('express').Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
      if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }
      const result = await authService.forgotPassword(email);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  async changePassword(req: AgentRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || typeof currentPassword !== 'string') {
        res.status(400).json({ error: 'Current password is required' });
        return;
      }
      if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
        res.status(400).json({ error: 'New password must be at least 6 characters' });
        return;
      }
      const result = await authService.changePassword(req.agent.id, currentPassword, newPassword);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
};
