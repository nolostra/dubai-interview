import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../../utils/jwt';
import { prisma } from '../../config/db';
// Removed direct import of AgentStatus due to lint error

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  agentId?: string;
}

export interface AgentRequest extends Request {
  agent: {
    id: string;
    email: string;
    name: string;
    status: string; // Changed from AgentStatus to string to fix lint error
  };
}

/**
 * Verifies JWT and attaches payload to req.user (sub = agentId).
 * Returns 401 if missing/invalid token.
 */
export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const payload = verifyToken(token);
    req.user = payload;
    req.agentId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Role-based guard: requires authMiddleware first.
 * Loads agent by agentId, ensures role is AGENT and status is ACTIVE.
 * Attaches agent to req.agent. Returns 403 if not allowed.
 */
export function agentGuard(
  req: AuthenticatedRequest & { agent?: { id: string; email: string; name: string; status: string } },
  res: Response,
  next: NextFunction
): void {
  const agentId = req.agentId ?? req.user?.sub;
  if (!agentId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  if (req.user?.role !== 'AGENT') {
    res.status(403).json({ error: 'Forbidden: Agent role required' });
    return;
  }

  void (async () => {
    try {
      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
        select: { id: true, email: true, name: true, status: true },
      });
      if (!agent) {
        res.status(401).json({ error: 'Agent not found' });
        return;
      }
      if (agent.status !== 'ACTIVE') {
        res.status(403).json({ error: 'Agent account is not active' });
        return;
      }
      req.agent = agent;
      next();
    } catch {
      res.status(500).json({ error: 'Internal server error' });
    }
  })();
}
