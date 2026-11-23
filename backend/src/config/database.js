import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === 'development'
      ? ['error', 'warn']
      : ['error'],
});

export async function testConnection() {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error(`Database connection failed: ${error.message}`);
    throw error;
  }
}

export default prisma;
