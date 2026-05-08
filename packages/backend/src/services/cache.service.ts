import { redis } from '../config/redis';
import { KnowledgeEntry } from '../models/types';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';

const KNOWLEDGE_BASE_KEY = 'knowledge_base';
const KNOWLEDGE_BASE_TTL = 3600; // 1 hour

export class CacheService {
  /**
   * Load knowledge base into cache
   */
  async loadKnowledgeBase(): Promise<void> {
    try {
      const entries = await prisma.knowledgeEntry.findMany({
        where: { isActive: true },
      });

      await redis.set(KNOWLEDGE_BASE_KEY, JSON.stringify(entries), 'EX', KNOWLEDGE_BASE_TTL);

      logger.info('Knowledge base loaded into cache', {
        count: entries.length,
      });
    } catch (error) {
      logger.error('Failed to load knowledge base into cache', { error });
      throw error;
    }
  }

  /**
   * Get knowledge base from cache
   */
  async getKnowledgeBase(): Promise<KnowledgeEntry[]> {
    try {
      const cached = await redis.get(KNOWLEDGE_BASE_KEY);

      if (cached) {
        return JSON.parse(cached);
      }

      // Cache miss - load from database
      await this.loadKnowledgeBase();
      const reloaded = await redis.get(KNOWLEDGE_BASE_KEY);

      return reloaded ? JSON.parse(reloaded) : [];
    } catch (error) {
      logger.error('Failed to get knowledge base from cache', { error });
      // Fallback to database
      return await prisma.knowledgeEntry.findMany({
        where: { isActive: true },
      });
    }
  }

  /**
   * Invalidate knowledge base cache
   */
  async invalidateKnowledgeBase(): Promise<void> {
    try {
      await redis.del(KNOWLEDGE_BASE_KEY);
      logger.info('Knowledge base cache invalidated');
    } catch (error) {
      logger.error('Failed to invalidate knowledge base cache', { error });
    }
  }

  /**
   * Set cache value with TTL
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await redis.set(key, serialized, 'EX', ttl);
      } else {
        await redis.set(key, serialized);
      }
    } catch (error) {
      logger.error('Failed to set cache value', { error, key });
    }
  }

  /**
   * Get cache value
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Failed to get cache value', { error, key });
      return null;
    }
  }

  /**
   * Delete cache value
   */
  async delete(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      logger.error('Failed to delete cache value', { error, key });
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Failed to check cache key existence', { error, key });
      return false;
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      await redis.flushdb();
      logger.info('Cache cleared');
    } catch (error) {
      logger.error('Failed to clear cache', { error });
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    connected: boolean;
    keys: number;
    memory: string;
  }> {
    try {
      const info = await redis.info('memory');
      const keys = await redis.dbsize();
      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const memory = memoryMatch ? memoryMatch[1].trim() : 'unknown';

      return {
        connected: redis.status === 'ready',
        keys,
        memory,
      };
    } catch (error) {
      logger.error('Failed to get cache stats', { error });
      return {
        connected: false,
        keys: 0,
        memory: 'unknown',
      };
    }
  }
}

export const cacheService = new CacheService();
