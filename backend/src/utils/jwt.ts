import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export type AgentRole = 'AGENT';

export interface JwtPayload {
  sub: string;   // agentId
  email?: string;
  role: AgentRole;
  iat?: number;
  exp?: number;
}

export function signToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
