import { prisma } from '../../config/db';

export interface DashboardResult {
  totalUsers: number;
  totalCommissionEarned: number;
  pendingCommission: number;
  withdrawableBalance: number;
  last7DaysEarnings: { date: string; amount: number }[];
}

function toNumber(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'object' && value !== null && 'toNumber' in value) {
    return (value as { toNumber: () => number }).toNumber();
  }
  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
}

export const agentService = {
  async getDashboard(agentId: string): Promise<DashboardResult> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setUTCHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalCommissionResult,
      approvedWithdrawalsResult,
      last7DaysGrouped,
    ] = await Promise.all([
      prisma.user.count({ where: { agentId } }),
      prisma.commission.aggregate({
        where: { agentId },
        _sum: { amount: true },
      }),
      prisma.withdrawal.aggregate({
        where: { agentId, status: 'APPROVED' },
        _sum: { amount: true },
      }),
      prisma.commission.groupBy({
        by: ['date'],
        where: {
          agentId,
          date: { gte: sevenDaysAgo },
        },
        _sum: { amount: true },
        orderBy: { date: 'asc' },
      }),
    ]);

    const totalCommissionEarned = toNumber(totalCommissionResult._sum.amount);
    const totalApprovedWithdrawals = toNumber(approvedWithdrawalsResult._sum.amount);
    // Commission not yet withdrawn (earned minus approved payouts)
    const pendingCommission = Math.max(0, totalCommissionEarned - totalApprovedWithdrawals);
    const withdrawableBalance = pendingCommission;

    const last7DaysEarnings: { date: string; amount: number }[] = last7DaysGrouped.map((row: { date: Date; _sum: { amount: unknown } }) => ({
      date: (row.date instanceof Date ? row.date : new Date(row.date)).toISOString().slice(0, 10),
      amount: toNumber(row._sum.amount),
    }));

    return {
      totalUsers,
      totalCommissionEarned,
      pendingCommission,
      withdrawableBalance,
      last7DaysEarnings,
    };
  },

  async updateProfile(agentId: string, name: string): Promise<{ id: string; email: string; name: string; status: string }> {
    if (!name || typeof name !== 'string' || !name.trim()) {
      const err = new Error('Name is required');
      (err as Error & { statusCode?: number }).statusCode = 400;
      throw err;
    }
    const agent = await prisma.agent.update({
      where: { id: agentId },
      data: { name: name.trim() },
      select: { id: true, email: true, name: true, status: true },
    });
    return agent;
  },
};
