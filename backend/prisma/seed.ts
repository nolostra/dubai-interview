import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

async function main() {
  const hashed = await bcrypt.hash('agent123', SALT_ROUNDS);

  const agent = await prisma.agent.upsert({
    where: { email: 'agent@example.com' },
    update: {},
    create: {
      name: 'Demo Agent',
      email: 'agent@example.com',
      password: hashed,
    },
  });

  const user1 = await prisma.user.upsert({
    where: { agentId_email: { agentId: agent.id, email: 'player1@example.com' } },
    update: {},
    create: {
      agentId: agent.id,
      name: 'Player One',
      email: 'player1@example.com',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { agentId_email: { agentId: agent.id, email: 'player2@example.com' } },
    update: {},
    create: {
      agentId: agent.id,
      name: 'Player Two',
      email: 'player2@example.com',
    },
  });

  // Clear existing commissions and withdrawals for this agent so re-seed gives clean 7 days
  await prisma.commission.deleteMany({ where: { agentId: agent.id } });
  await prisma.withdrawal.deleteMany({ where: { agentId: agent.id } });

  // Last 7 days: one date per day, normalized to start of day (UTC)
  const msPerDay = 86400000;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const commissionData: { agentId: string; userId: string; amount: number; date: Date }[] = [];
  const users = [user1, user2];
  const amountsPerDay = [
    [10.5, 25, 8],
    [15, 12, 20, 5],
    [30, 18],
    [22, 14, 9],
    [11, 28, 16],
    [19, 7, 24],
    [13, 21, 6, 17],
  ];

  for (let d = 0; d < 7; d++) {
    const date = new Date(today.getTime() - (6 - d) * msPerDay);
    const dayAmounts = amountsPerDay[d] ?? [10, 15];
    for (let i = 0; i < dayAmounts.length; i++) {
      commissionData.push({
        agentId: agent.id,
        userId: users[i % users.length].id,
        amount: dayAmounts[i],
        date,
      });
    }
  }

  await prisma.commission.createMany({
    data: commissionData,
  });

  // Optional: one pending withdrawal for demo
  await prisma.withdrawal.create({
    data: {
      agentId: agent.id,
      amount: 20,
      status: 'PENDING',
    },
  });

  console.log('Seed done. Agent:', agent.email, 'Password: agent123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
