import { commissionService } from '../commission.service';
import { prisma } from '../../../config/db';

jest.mock('../../../config/db', () => ({
  prisma: {
    user: { findFirst: jest.fn() },
    commission: { create: jest.fn(), groupBy: jest.fn() },
  },
}));

const mockPrisma = prisma as any;

describe('commissionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCommission', () => {
    it('creates 10% commission when user belongs to agent', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'u1',
        name: 'User',
        email: 'u@example.com',
        status: 'ACTIVE',
        createdAt: new Date(),
      } as never);
      const record = {
        id: 'c1',
        agentId: 'agent-1',
        userId: 'u1',
        amount: 10,
        date: new Date('2025-02-01'),
      };
      mockPrisma.commission.create.mockResolvedValue(record);

      const result = await commissionService.createCommission('agent-1', {
        userId: 'u1',
        wagerAmount: 100,
        date: '2025-02-01',
      });

      expect(result.amount).toBe(10);
      expect(result.agentId).toBe('agent-1');
      expect(result.userId).toBe('u1');
      expect(mockPrisma.commission.create).toHaveBeenCalledWith({
        data: {
          agentId: 'agent-1',
          userId: 'u1',
          amount: 10,
          date: expect.any(Date),
        },
      });
    });

    it('throws when user not found or not belonging to agent', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      await expect(
        commissionService.createCommission('agent-1', { userId: 'u1', wagerAmount: 100 })
      ).rejects.toThrow('User not found or does not belong to you');
    });

    it('throws when wager amount is invalid', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'u1' } as never);
      await expect(
        commissionService.createCommission('agent-1', { userId: 'u1', wagerAmount: 0 })
      ).rejects.toThrow('Wager amount must be a positive number');
      await expect(
        commissionService.createCommission('agent-1', { userId: 'u1', wagerAmount: -10 })
      ).rejects.toThrow('Wager amount must be a positive number');
    });

    it('throws when date format is invalid', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'u1' } as never);
      await expect(
        commissionService.createCommission('agent-1', {
          userId: 'u1',
          wagerAmount: 100,
          date: 'not-a-date',
        })
      ).rejects.toThrow('Invalid date format');
    });
  });

  describe('getDateWiseHistory', () => {
    it('returns history grouped by date', async () => {
      mockPrisma.commission.groupBy.mockResolvedValue([
        { date: new Date('2025-02-01'), _sum: { amount: 50 }, _count: { id: 3 }, _avg: null, _min: null, _max: null },
      ] as never[]);

      const result = await commissionService.getDateWiseHistory('agent-1');

      expect(result.history).toHaveLength(1);
      expect(result.history[0]).toEqual({ date: '2025-02-01', totalAmount: 50, count: 3 });
    });
  });
});
