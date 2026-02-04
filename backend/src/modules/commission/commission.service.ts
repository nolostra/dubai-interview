import { prisma } from '../../config/db';

const COMMISSION_RATE = 0.1; // 10%

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

export interface CreateCommissionInput {
  userId: string;
  wagerAmount: number;
  date?: string; // YYYY-MM-DD, default today
}

export interface DateWiseEntry {
  date: string;
  totalAmount: number;
  count: number;
}

export interface DateWiseHistoryResult {
  history: DateWiseEntry[];
}

export const commissionService = {
  /**
   * Commission = 10% of wager amount.
   * Creates a commission record for the agent and user (user must belong to agent).
   */
  async createCommission(
    agentId: string,
    input: CreateCommissionInput
  ): Promise<{ id: string; agentId: string; userId: string; amount: number; date: string }> {
    const user = await prisma.user.findFirst({
      where: { id: input.userId, agentId },
    });
    if (!user) {
      const error = new Error('User not found or does not belong to you');
      (error as Error & { statusCode?: number }).statusCode = 404;
      throw error;
    }

    if (input.wagerAmount <= 0 || !Number.isFinite(input.wagerAmount)) {
      const error = new Error('Wager amount must be a positive number');
      (error as Error & { statusCode?: number }).statusCode = 400;
      throw error;
    }

    const amount = roundAmount(input.wagerAmount * COMMISSION_RATE);
    const dateStr = input.date ?? new Date().toISOString().slice(0, 10);
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) {
      const error = new Error('Invalid date format; use YYYY-MM-DD');
      (error as Error & { statusCode?: number }).statusCode = 400;
      throw error;
    }

    const record = await prisma.commission.create({
      data: {
        agentId,
        userId: input.userId,
        amount,
        date,
      },
    });

    return {
      id: record.id,
      agentId: record.agentId,
      userId: record.userId,
      amount: toNumber(record.amount),
      date: record.date.toISOString().slice(0, 10),
    };
  },

  /**
   * Date-wise commission history for the agent (grouped by date).
   */
  async getDateWiseHistory(
    agentId: string,
    startDate?: string,
    endDate?: string
  ): Promise<DateWiseHistoryResult> {
    const where: { agentId: string; date?: { gte?: Date; lte?: Date } } = { agentId };

    if (startDate) {
      const d = new Date(startDate);
      if (!Number.isNaN(d.getTime())) {
        where.date = { ...where.date, gte: d };
      }
    }
    if (endDate) {
      const d = new Date(endDate);
      if (!Number.isNaN(d.getTime())) {
        where.date = { ...where.date, lte: d };
      }
    }

    const grouped = await prisma.commission.groupBy({
      by: ['date'],
      where,
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { date: 'asc' },
    });

    const history: DateWiseEntry[] = grouped.map((row: { date: Date; _sum: { amount: number | null }, _count: { id: number } }) => ({
      date: row.date.toISOString().slice(0, 10),
      totalAmount: toNumber(row._sum.amount),
      count: row._count.id,
    }));

    return { history };
  },
};
