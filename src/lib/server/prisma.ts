import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  __orthodoxPrisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.__orthodoxPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

globalForPrisma.__orthodoxPrisma = prisma;
