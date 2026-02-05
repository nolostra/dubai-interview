import { userService } from '../user.service';
import { prisma } from '../../../config/db';

jest.mock('../../../config/db', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as any;

describe('userService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('returns paginated users for agent', async () => {
      const users = [
        {
          id: 'u1',
          name: 'User 1',
          email: 'u1@example.com',
          status: 'ACTIVE',
          createdAt: new Date(),
        },
      ];
      mockPrisma.user.findMany.mockResolvedValue(users);
      mockPrisma.user.count.mockResolvedValue(1);

      const result = await userService.list({ agentId: 'agent-1', page: 1, limit: 10 });

      expect(result.users).toEqual(users);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { agentId: 'agent-1' },
          skip: 0,
          take: 10,
        })
      );
    });
  });

  describe('create', () => {
    it('creates user when email is unique for agent', async () => {
      const created = {
        id: 'u1',
        name: 'John',
        email: 'john@example.com',
        status: 'ACTIVE',
        createdAt: new Date(),
      };
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(created);

      const result = await userService.create('agent-1', { name: 'John', email: 'john@example.com' });

      expect(result).toEqual(created);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          agentId: 'agent-1',
          name: 'John',
          email: 'john@example.com',
        },
        select: expect.any(Object),
      });
    });

    it('throws when email already exists for agent', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'existing',
        name: 'Existing',
        email: 'john@example.com',
        status: 'ACTIVE',
        createdAt: new Date(),
      } as never);

      await expect(
        userService.create('agent-1', { name: 'John', email: 'john@example.com' })
      ).rejects.toThrow('A user with this email already exists');
    });
  });

  describe('getById', () => {
    it('returns user when found and belongs to agent', async () => {
      const user = {
        id: 'u1',
        name: 'John',
        email: 'john@example.com',
        status: 'ACTIVE',
        createdAt: new Date(),
      };
      mockPrisma.user.findFirst.mockResolvedValue(user);

      const result = await userService.getById('agent-1', 'u1');
      expect(result).toEqual(user);
    });

    it('throws when user not found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      await expect(userService.getById('agent-1', 'missing')).rejects.toThrow('User not found');
    });
  });

  describe('setStatus', () => {
    it('updates user status when user belongs to agent', async () => {
      const existing = {
        id: 'u1',
        name: 'John',
        email: 'j@example.com',
        status: 'ACTIVE',
        createdAt: new Date(),
      };
      const updated = { ...existing, status: 'BLOCKED' };
      mockPrisma.user.findFirst.mockResolvedValue(existing);
      mockPrisma.user.update.mockResolvedValue(updated);

      const result = await userService.setStatus('agent-1', 'u1', 'BLOCKED');
      expect(result.status).toBe('BLOCKED');
    });

    it('throws when user not found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      await expect(userService.setStatus('agent-1', 'missing', 'BLOCKED')).rejects.toThrow('User not found');
    });
  });
});
