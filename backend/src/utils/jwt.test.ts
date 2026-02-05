import { signToken, verifyToken } from './jwt';

describe('jwt', () => {
  describe('signToken', () => {
    it('returns a non-empty string', () => {
      const token = signToken({
        sub: 'agent-1',
        email: 'a@b.com',
        role: 'AGENT',
      });
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
      expect(token.split('.')).toHaveLength(3); // JWT format
    });
  });

  describe('verifyToken', () => {
    it('decodes payload when token is valid', () => {
      const payload = { sub: 'agent-1', email: 'a@b.com', role: 'AGENT' as const };
      const token = signToken(payload);
      const decoded = verifyToken(token);
      expect(decoded.sub).toBe('agent-1');
      expect(decoded.email).toBe('a@b.com');
      expect(decoded.role).toBe('AGENT');
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    it('throws when token is invalid', () => {
      expect(() => verifyToken('invalid-token')).toThrow();
    });

    it('throws when token is tampered', () => {
      const token = signToken({ sub: 'agent-1', email: 'a@b.com', role: 'AGENT' });
      const parts = token.split('.');
      const tampered = `${parts[0]}.${parts[1]}.x`;
      expect(() => verifyToken(tampered)).toThrow();
    });
  });
});
