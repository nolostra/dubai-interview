import { Prisma, WithdrawalStatus } from '@prisma/client';
import { prisma } from '../../config/db';

type TransactionClient = Omit<Prisma.TransactionClient, symbol>;

function toNumber(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'object' && value !== null && 'toNumber' in value) {
    return (value as { toNumber: () => number }).toNumber();
  }
  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
}

function roundAmount(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface RequestWithdrawalResult {
  id: string;
  agentId: string;
  amount: number;
  status: WithdrawalStatus;
  createdAt: Date;
}

export interface WithdrawalListItem {
  id: string;
  amount: number;
  status: WithdrawalStatus;
  createdAt: Date;
}

export const withdrawalService = {
  /**
   * Get current withdrawable balance for an agent (total commission - approved withdrawals).
   */
  async getWithdrawableBalance(agentId: string): Promise<number> {
    const [commissionSum, approvedSum] = await Promise.all([
      prisma.commission.aggregate({
        where: { agentId },
        _sum: { amount: true },
      }),
      prisma.withdrawal.aggregate({
        where: { agentId, status: WithdrawalStatus.APPROVED },
        _sum: { amount: true },
      }),
    ]);
    const total = toNumber(commissionSum._sum.amount);
    const approved = toNumber(approvedSum._sum.amount);
    return Math.max(0, roundAmount(total - approved));
  },

  /**
   * Agent requests withdrawal. Validates against withdrawable balance in a transaction.
   */
  async requestWithdrawal(
    agentId: string,
    amount: number
  ): Promise<RequestWithdrawalResult> {
    if (amount <= 0 || !Number.isFinite(amount)) {
      const error = new Error('Amount must be a positive number');
      (error as Error & { statusCode?: number }).statusCode = 400;
      throw error;
    }

    const roundedAmount = roundAmount(amount);

    const result = await prisma.$transaction(async (tx: TransactionClient) => {
      const [commissionSum, approvedSum] = await Promise.all([
        tx.commission.aggregate({
          where: { agentId },
          _sum: { amount: true },
        }),
        tx.withdrawal.aggregate({
          where: { agentId, status: WithdrawalStatus.APPROVED },
          _sum: { amount: true },
        }),
      ]);
      const totalCommission = toNumber(commissionSum._sum.amount);
      const totalApproved = toNumber(approvedSum._sum.amount);
      const withdrawable = Math.max(0, roundAmount(totalCommission - totalApproved));

      if (roundedAmount > withdrawable) {
        const error = new Error(
          `Insufficient balance. Withdrawable: ${withdrawable}`
        );
        (error as Error & { statusCode?: number }).statusCode = 400;
        throw error;
      }

      const withdrawal = await tx.withdrawal.create({
        data: {
          agentId,
          amount: roundedAmount,
          status: WithdrawalStatus.PENDING,
        },
      });

      return withdrawal;
    });

    return {
      id: result.id,
      agentId: result.agentId,
      amount: toNumber(result.amount),
      status: result.status,
      createdAt: result.createdAt,
    };
  },

  /**
   * List withdrawals for an agent (own only).
   */
  async listByAgent(agentId: string): Promise<WithdrawalListItem[]> {
    const list = await prisma.withdrawal.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true,
      },
    });
    return list.map((row: { id: string; amount: unknown; status: WithdrawalStatus; createdAt: Date }) => ({
      id: row.id,
      amount: toNumber(row.amount),
      status: row.status,
      createdAt: row.createdAt,
    }));
  },

  /**
   * Admin: approve withdrawal. Validates balance in transaction, then updates status.
   */
  async approveWithdrawal(withdrawalId: string): Promise<RequestWithdrawalResult> {
    const result = await prisma.$transaction(async (tx: TransactionClient) => {
      const withdrawal = await tx.withdrawal.findUnique({
        where: { id: withdrawalId },
      });
      if (!withdrawal) {
        const error = new Error('Withdrawal not found');
        (error as Error & { statusCode?: number }).statusCode = 404;
        throw error;
      }
      if (withdrawal.status !== WithdrawalStatus.PENDING) {
        const error = new Error(
          `Withdrawal is not pending (current: ${withdrawal.status})`
        );
        (error as Error & { statusCode?: number }).statusCode = 400;
        throw error;
      }

      const amount = toNumber(withdrawal.amount);
      const [commissionSum, approvedSum] = await Promise.all([
        tx.commission.aggregate({
          where: { agentId: withdrawal.agentId },
          _sum: { amount: true },
        }),
        tx.withdrawal.aggregate({
          where: {
            agentId: withdrawal.agentId,
            status: WithdrawalStatus.APPROVED,
          },
          _sum: { amount: true },
        }),
      ]);
      const totalCommission = toNumber(commissionSum._sum.amount);
      const totalApproved = toNumber(approvedSum._sum.amount);
      const withdrawable = Math.max(0, roundAmount(totalCommission - totalApproved));

      if (amount > withdrawable) {
        const error = new Error(
          `Insufficient agent balance to approve. Withdrawable: ${withdrawable}`
        );
        (error as Error & { statusCode?: number }).statusCode = 400;
        throw error;
      }

      const updated = await tx.withdrawal.update({
        where: { id: withdrawalId },
        data: { status: WithdrawalStatus.APPROVED },
      });
      return updated;
    });

    return {
      id: result.id,
      agentId: result.agentId,
      amount: toNumber(result.amount),
      status: result.status,
      createdAt: result.createdAt,
    };
  },

  /**
   * Admin: reject withdrawal.
   */
  async rejectWithdrawal(withdrawalId: string): Promise<RequestWithdrawalResult> {
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
    });
    if (!withdrawal) {
      const error = new Error('Withdrawal not found');
      (error as Error & { statusCode?: number }).statusCode = 404;
      throw error;
    }
    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      const error = new Error(
        `Withdrawal is not pending (current: ${withdrawal.status})`
      );
      (error as Error & { statusCode?: number }).statusCode = 400;
      throw error;
    }

    const updated = await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: { status: WithdrawalStatus.REJECTED },
    });

    return {
      id: updated.id,
      agentId: updated.agentId,
      amount: toNumber(updated.amount),
      status: updated.status,
      createdAt: updated.createdAt,
    };
  },
};
