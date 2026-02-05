import { hashPassword, comparePassword } from './password';

describe('password', () => {
  describe('hashPassword', () => {
    it('returns a string different from plain password', async () => {
      const plain = 'mySecret123';
      const hashed = await hashPassword(plain);
      expect(hashed).not.toBe(plain);
      expect(typeof hashed).toBe('string');
      expect(hashed.length).toBeGreaterThan(0);
    });

    it('produces different hashes for same input (salt)', async () => {
      const plain = 'same';
      const h1 = await hashPassword(plain);
      const h2 = await hashPassword(plain);
      expect(h1).not.toBe(h2);
    });
  });

  describe('comparePassword', () => {
    it('returns true when plain matches hash', async () => {
      const plain = 'secret';
      const hashed = await hashPassword(plain);
      const result = await comparePassword(plain, hashed);
      expect(result).toBe(true);
    });

    it('returns false when plain does not match hash', async () => {
      const hashed = await hashPassword('correct');
      const result = await comparePassword('wrong', hashed);
      expect(result).toBe(false);
    });
  });
});
