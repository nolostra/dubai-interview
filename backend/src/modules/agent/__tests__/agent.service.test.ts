import { agentService } from '../agent.service';
import { prisma } from '../../../config/db';

jest.mock('../../../config/db', () => ({
  prisma: {
    user: { count: jest.fn() },
    commission: {
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    withdrawal: { aggregate: jest.fn() },
    agent: { update: jest.fn() },
  },
}));

const mockPrisma = prisma as any;

describe('agentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboard', () => {
    it('returns dashboard stats for agent', async () => {
      mockPrisma.user.count.mockResolvedValue(10);
      mockPrisma.commission.aggregate.mockResolvedValue({
        _sum: { amount: 100 },
        _avg: null,
        _count: { id: 0 },
        _min: null,
        _max: null,
      });
      mockPrisma.withdrawal.aggregate.mockResolvedValue({
        _sum: { amount: 30 },
        _avg: null,
        _count: { id: 0 },
        _min: null,
        _max: null,
      });
      mockPrisma.commission.groupBy.mockResolvedValue([
        { date: new Date('2025-02-01'), _sum: { amount: 20 }, _count: { id: 2 }, _avg: null, _min: null, _max: null },
        { date: new Date('2025-02-02'), _sum: { amount: 15 }, _count: { id: 1 }, _avg: null, _min: null, _max: null },
      ] as never[]);

      const result = await agentService.getDashboard('agent-1');

      expect(result.totalUsers).toBe(10);
      expect(result.totalCommissionEarned).toBe(100);
      expect(result.pendingCommission).toBe(70);
      expect(result.withdrawableBalance).toBe(70);
      expect(result.last7DaysEarnings).toHaveLength(2);
      expect(result.last7DaysEarnings[0]).toEqual({ date: '2025-02-01', amount: 20 });
      expect(result.last7DaysEarnings[1]).toEqual({ date: '2025-02-02', amount: 15 });
    });
  });

  describe('updateProfile', () => {
    it('updates agent name and returns profile', async () => {
      const updated = {
        id: 'agent-1',
        email: 'a@b.com',
        name: 'New Name',
        status: 'ACTIVE',
      };
      mockPrisma.agent.update.mockResolvedValue(updated);

      const result = await agentService.updateProfile('agent-1', 'New Name');

      expect(result).toEqual(updated);
      expect(mockPrisma.agent.update).toHaveBeenCalledWith({
        where: { id: 'agent-1' },
        data: { name: 'New Name' },
        select: { id: true, email: true, name: true, status: true },
      });
    });

    it('throws when name is empty', async () => {
      await expect(agentService.updateProfile('agent-1', '')).rejects.toThrow('Name is required');
      await expect(agentService.updateProfile('agent-1', '   ')).rejects.toThrow('Name is required');
    });
  });
});
