import { WithdrawalStatus } from '@prisma/client';
import { withdrawalService } from '../withdrawal.service';
import { prisma } from '../../../config/db';

jest.mock('../../../config/db', () => ({
  prisma: {
    commission: { aggregate: jest.fn() },
    withdrawal: {
      aggregate: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((fn) => fn(prisma)),
  },
}));

const mockPrisma = prisma as any;

describe('withdrawalService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getWithdrawableBalance', () => {
    it('returns commission minus approved withdrawals', async () => {
      mockPrisma.commission.aggregate.mockResolvedValue({
        _sum: { amount: 100 },
        _avg: null,
        _count: { id: 0 },
        _min: null,
        _max: null,
      });
      mockPrisma.withdrawal.aggregate.mockResolvedValue({
        _sum: { amount: 40 },
        _avg: null,
        _count: { id: 0 },
        _min: null,
        _max: null,
      });

      const result = await withdrawalService.getWithdrawableBalance('agent-1');
      expect(result).toBe(60);
    });
  });

  describe('requestWithdrawal', () => {
    it('throws when amount is invalid', async () => {
      await expect(withdrawalService.requestWithdrawal('agent-1', 0)).rejects.toThrow(
        'Amount must be a positive number'
      );
      await expect(withdrawalService.requestWithdrawal('agent-1', -10)).rejects.toThrow(
        'Amount must be a positive number'
      );
    });

    it('creates withdrawal when balance is sufficient', async () => {
      mockPrisma.commission.aggregate.mockResolvedValue({
        _sum: { amount: 100 },
        _avg: null,
        _count: { id: 0 },
        _min: null,
        _max: null,
      });
      mockPrisma.withdrawal.aggregate.mockResolvedValue({
        _sum: { amount: 0 },
        _avg: null,
        _count: { id: 0 },
        _min: null,
        _max: null,
      });
      const created = {
        id: 'w1',
        agentId: 'agent-1',
        amount: 50,
        status: WithdrawalStatus.PENDING,
        createdAt: new Date(),
      };
      mockPrisma.withdrawal.create.mockResolvedValue(created);
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
        fn(mockPrisma)
      );

      const result = await withdrawalService.requestWithdrawal('agent-1', 50);
      expect(result.status).toBe(WithdrawalStatus.PENDING);
      expect(result.amount).toBe(50);
    });
  });

  describe('listByAgent', () => {
    it('returns withdrawals for agent', async () => {
      const list = [
        {
          id: 'w1',
          amount: 50,
          status: WithdrawalStatus.PENDING,
          createdAt: new Date(),
        },
      ];
      mockPrisma.withdrawal.findMany.mockResolvedValue(list);

      const result = await withdrawalService.listByAgent('agent-1');
      expect(result).toHaveLength(1);
      expect(result[0].amount).toBe(50);
      expect(result[0].status).toBe(WithdrawalStatus.PENDING);
    });
  });

  describe('rejectWithdrawal', () => {
    it('rejects pending withdrawal', async () => {
      const withdrawal = {
        id: 'w1',
        agentId: 'agent-1',
        amount: 50,
        status: WithdrawalStatus.PENDING,
        createdAt: new Date(),
      };
      const updated = { ...withdrawal, status: WithdrawalStatus.REJECTED };
      mockPrisma.withdrawal.findUnique.mockResolvedValue(withdrawal);
      mockPrisma.withdrawal.update.mockResolvedValue(updated);

      const result = await withdrawalService.rejectWithdrawal('w1');
      expect(result.status).toBe(WithdrawalStatus.REJECTED);
    });

    it('throws when withdrawal not found', async () => {
      mockPrisma.withdrawal.findUnique.mockResolvedValue(null);
      await expect(withdrawalService.rejectWithdrawal('missing')).rejects.toThrow('Withdrawal not found');
    });

    it('throws when withdrawal is not pending', async () => {
      mockPrisma.withdrawal.findUnique.mockResolvedValue({
        id: 'w1',
        status: WithdrawalStatus.APPROVED,
      } as never);
      await expect(withdrawalService.rejectWithdrawal('w1')).rejects.toThrow('not pending');
    });
  });
});
