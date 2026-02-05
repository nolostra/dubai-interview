import { authService } from '../auth.service';
import { prisma } from '../../../config/db';
import * as password from '../../../utils/password';
import * as jwt from '../../../utils/jwt';

jest.mock('../../../config/db', () => ({
  prisma: {
    agent: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));
jest.mock('../../../utils/password');
jest.mock('../../../utils/jwt');
jest.mock('../../../utils/logger', () => ({ logger: { info: jest.fn() } }));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('returns agent and token when credentials are valid', async () => {
      const agent = {
        id: 'agent-1',
        email: 'agent@example.com',
        name: 'Test Agent',
        status: 'ACTIVE',
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.agent.findUnique.mockResolvedValue(agent);
      (password.comparePassword as jest.Mock).mockResolvedValue(true);
      (jwt.signToken as jest.Mock).mockReturnValue('fake-token');

      const result = await authService.login({ email: 'agent@example.com', password: 'secret' });

      expect(result.agent).toEqual({
        id: 'agent-1',
        email: 'agent@example.com',
        name: 'Test Agent',
        status: 'ACTIVE',
      });
      expect(result.token).toBe('fake-token');
      expect(mockPrisma.agent.findUnique).toHaveBeenCalledWith({
        where: { email: 'agent@example.com' },
      });
      expect(password.comparePassword).toHaveBeenCalledWith('secret', 'hashed');
    });

    it('throws when agent not found', async () => {
      mockPrisma.agent.findUnique.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'nobody@example.com', password: 'secret' })
      ).rejects.toThrow('Invalid email or password');
    });

    it('throws when password is wrong', async () => {
      const agent = {
        id: 'agent-1',
        email: 'agent@example.com',
        name: 'Test',
        status: 'ACTIVE',
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.agent.findUnique.mockResolvedValue(agent);
      (password.comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.login({ email: 'agent@example.com', password: 'wrong' })
      ).rejects.toThrow('Invalid email or password');
    });

    it('throws when agent status is not ACTIVE', async () => {
      const agent = {
        id: 'agent-1',
        email: 'agent@example.com',
        name: 'Test',
        status: 'INACTIVE',
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.agent.findUnique.mockResolvedValue(agent);

      await expect(
        authService.login({ email: 'agent@example.com', password: 'secret' })
      ).rejects.toThrow('Agent account is not active');
    });
  });

  describe('forgotPassword', () => {
    it('returns success message (dummy flow)', async () => {
      mockPrisma.agent.findUnique.mockResolvedValue(null);

      const result = await authService.forgotPassword('any@example.com');

      expect(result).toEqual({
        message: 'If an account exists, you will receive instructions.',
      });
      expect(mockPrisma.agent.findUnique).toHaveBeenCalledWith({
        where: { email: 'any@example.com' },
      });
    });
  });

  describe('changePassword', () => {
    it('updates password when current password is correct', async () => {
      const agent = {
        id: 'agent-1',
        email: 'a@b.com',
        name: 'A',
        status: 'ACTIVE',
        password: 'old-hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.agent.findUnique.mockResolvedValue(agent);
      (password.comparePassword as jest.Mock).mockResolvedValue(true);
      (password.hashPassword as jest.Mock).mockResolvedValue('new-hash');
      mockPrisma.agent.update.mockResolvedValue({ ...agent, password: 'new-hash' });

      const result = await authService.changePassword('agent-1', 'old', 'newpass');

      expect(result).toEqual({ message: 'Password updated' });
      expect(password.comparePassword).toHaveBeenCalledWith('old', 'old-hash');
      expect(password.hashPassword).toHaveBeenCalledWith('newpass');
      expect(mockPrisma.agent.update).toHaveBeenCalledWith({
        where: { id: 'agent-1' },
        data: { password: 'new-hash' },
      });
    });

    it('throws when agent not found', async () => {
      mockPrisma.agent.findUnique.mockResolvedValue(null);

      await expect(
        authService.changePassword('missing', 'old', 'new')
      ).rejects.toThrow('Agent not found');
    });

    it('throws when current password is incorrect', async () => {
      const agent = {
        id: 'agent-1',
        email: 'a@b.com',
        name: 'A',
        status: 'ACTIVE',
        password: 'hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.agent.findUnique.mockResolvedValue(agent);
      (password.comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.changePassword('agent-1', 'wrong', 'new')
      ).rejects.toThrow('Current password is incorrect');
    });
  });
});
