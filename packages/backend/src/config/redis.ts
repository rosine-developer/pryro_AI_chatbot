import Redis from 'ioredis';
import { logger } from '../utils/logger';

let redis: Redis | null = null;

if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    reconnectOnError(err) {
      if (err.message.includes('READONLY')) return true;
      return false;
    },
  });

  redis.on('connect', () => logger.info('Redis connected'));
  redis.on('ready', () => logger.info('Redis ready'));
  redis.on('error', (err) => logger.error('Redis error', { error: err.message }));
  redis.on('close', () => logger.warn('Redis connection closed'));

  process.on('beforeExit', async () => {
    await redis?.quit();
    logger.info('Redis disconnected');
  });
} else {
  logger.warn('REDIS_URL not set — running without cache (DB fallback active)');
}

export { redis };
export default redis;
