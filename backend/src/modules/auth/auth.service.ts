// import { AgentStatus } from '@prisma/client'; // Removed due to missing export
import { prisma } from '../../config/db';
import { comparePassword, hashPassword } from '../../utils/password';
import { signToken } from '../../utils/jwt';
import { logger } from '../../utils/logger';

export interface LoginInput {
  email: string;
  password: string;
}

export interface AgentAuthResult {
  agent: { id: string; email: string; name: string; status: string };
  token: string;
}

export interface ForgotPasswordResult {
  message: string;
}

export const authService = {
  /** Dummy forgot-password: always returns success (no email sent). */
  async forgotPassword(email: string): Promise<ForgotPasswordResult> {
    const agent = await prisma.agent.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (agent) {
      logger.info('Forgot password requested (dummy)', { email: agent.email });
    }
    return { message: 'If an account exists, you will receive instructions.' };
  },

  async changePassword(agentId: string, currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) {
      const err = new Error('Agent not found');
      (err as Error & { statusCode?: number }).statusCode = 401;
      throw err;
    }
    const valid = await comparePassword(currentPassword, agent.password);
    if (!valid) {
      const err = new Error('Current password is incorrect');
      (err as Error & { statusCode?: number }).statusCode = 400;
      throw err;
    }
    const hashed = await hashPassword(newPassword);
    await prisma.agent.update({ where: { id: agentId }, data: { password: hashed } });
    logger.info('Password changed', { agentId });
    return { message: 'Password updated' };
  },

  async login(input: LoginInput): Promise<AgentAuthResult> {
    const agent = await prisma.agent.findUnique({
      where: { email: input.email.toLowerCase().trim() },
    });

    if (!agent) {
      const error = new Error('Invalid email or password');
      (error as Error & { statusCode?: number }).statusCode = 401;
      throw error;
    }

    // 'AgentStatus' is not defined, so compare to string literal
    if (agent.status !== 'ACTIVE') {
      const error = new Error('Agent account is not active');
      (error as Error & { statusCode?: number }).statusCode = 403;
      throw error;
    }

    const valid = await comparePassword(input.password, agent.password);
    if (!valid) {
      const error = new Error('Invalid email or password');
      (error as Error & { statusCode?: number }).statusCode = 401;
      throw error;
    }

    const token = signToken({
      sub: agent.id,
      email: agent.email,
      role: 'AGENT',
    });

    logger.info('Agent logged in', { agentId: agent.id, email: agent.email });

    return {
      agent: {
        id: agent.id,
        email: agent.email,
        name: agent.name,
        status: agent.status,
      },
      token,
    };
  },
};
