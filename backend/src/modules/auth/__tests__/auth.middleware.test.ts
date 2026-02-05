import { Request, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../auth.middleware';
import * as jwt from '../../../utils/jwt';

jest.mock('../../../utils/jwt');

describe('authMiddleware', () => {
  let req: Partial<AuthenticatedRequest>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('returns 401 when Authorization header is missing', () => {
    authMiddleware(req as AuthenticatedRequest, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing or invalid Authorization header' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when Authorization does not start with Bearer ', () => {
    req.headers = { authorization: 'Basic xyz' };
    authMiddleware(req as AuthenticatedRequest, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next and attaches user when token is valid', () => {
    req.headers = { authorization: 'Bearer valid-token' };
    const payload = { sub: 'agent-1', email: 'a@b.com', role: 'AGENT' as const };
    (jwt.verifyToken as jest.Mock).mockReturnValue(payload);

    authMiddleware(req as AuthenticatedRequest, res as Response, next);

    expect(jwt.verifyToken).toHaveBeenCalledWith('valid-token');
    expect((req as AuthenticatedRequest).user).toEqual(payload);
    expect((req as AuthenticatedRequest).agentId).toBe('agent-1');
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 401 when token is invalid or expired', () => {
    req.headers = { authorization: 'Bearer bad-token' };
    (jwt.verifyToken as jest.Mock).mockImplementation(() => {
      throw new Error('invalid');
    });

    authMiddleware(req as AuthenticatedRequest, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
    expect(next).not.toHaveBeenCalled();
  });
});
