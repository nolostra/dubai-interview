import { prisma } from '../../config/db';

export interface ListUsersParams {
  agentId: string;
  page: number;
  limit: number;
}

export interface ListUsersResult {
  users: {
    id: string;
    name: string;
    email: string;
    status: string;
    createdAt: Date;
  }[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateUserInput {
  name: string;
  email: string;
}

export const userService = {
  async list(params: ListUsersParams): Promise<ListUsersResult> {
    const { agentId, page, limit } = params;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { agentId },
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where: { agentId } }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      users,
      total,
      page,
      limit,
      totalPages,
    };
  },

  async create(agentId: string, input: CreateUserInput) {
    const existing = await prisma.user.findUnique({
      where: {
        agentId_email: { agentId, email: input.email.trim().toLowerCase() },
      },
    });
    if (existing) {
      const error = new Error('A user with this email already exists');
      (error as Error & { statusCode?: number }).statusCode = 409;
      throw error;
    }

    const user = await prisma.user.create({
      data: {
        agentId,
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
      },
    });
    return user;
  },

  async getById(agentId: string, userId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, agentId },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
      },
    });
    if (!user) {
      const error = new Error('User not found');
      (error as Error & { statusCode?: number }).statusCode = 404;
      throw error;
    }
    return user;
  },

  async setStatus(agentId: string, userId: string, status: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, agentId },
    });
    if (!user) {
      const error = new Error('User not found');
      (error as Error & { statusCode?: number }).statusCode = 404;
      throw error;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { status: status as any }, // 'status' likely must be of enum type or compatible, cast as any if no enum imported
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
      },
    });
    return updated;
  },
};
