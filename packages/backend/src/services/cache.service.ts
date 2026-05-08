import { redis } from '../config/redis';
import { KnowledgeEntry } from '../models/types';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';

const KNOWLEDGE_BASE_KEY = 'knowledge_base';
const KNOWLEDGE_BASE_TTL = 3600; // 1 hour

export class CacheService {
  private get hasRedis(): boolean {
    return redis !== null && redis.status === 'ready';
  }

  async loadKnowledgeBase(): Promise<void> {
    if (!this.hasRedis) return;
    try {
      const entries = await prisma.knowledgeEntry.findMany({ where: { isActive: true } });
      await redis!.set(KNOWLEDGE_BASE_KEY, JSON.stringify(entries), 'EX', KNOWLEDGE_BASE_TTL);
      logger.info('Knowledge base loaded into cache', { count: entries.length });
    } catch (error) {
      logger.error('Failed to load knowledge base into cache', { error });
    }
  }

  async getKnowledgeBase(): Promise<KnowledgeEntry[]> {
    // No Redis — go straight to DB
    if (!this.hasRedis) {
      return prisma.knowledgeEntry.findMany({ where: { isActive: true } });
    }
    try {
      const cached = await redis!.get(KNOWLEDGE_BASE_KEY);
      if (cached) return JSON.parse(cached);
      await this.loadKnowledgeBase();
      const reloaded = await redis!.get(KNOWLEDGE_BASE_KEY);
      return reloaded ? JSON.parse(reloaded) : [];
    } catch (error) {
      logger.error('Failed to get knowledge base from cache', { error });
      return prisma.knowledgeEntry.findMany({ where: { isActive: true } });
    }
  }

  async invalidateKnowledgeBase(): Promise<void> {
    if (!this.hasRedis) return;
    try {
      await redis!.del(KNOWLEDGE_BASE_KEY);
      logger.info('Knowledge base cache invalidated');
    } catch (error) {
      logger.error('Failed to invalidate knowledge base cache', { error });
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.hasRedis) return;
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await redis!.set(key, serialized, 'EX', ttl);
      } else {
        await redis!.set(key, serialized);
      }
    } catch (error) {
      logger.error('Failed to set cache value', { error, key });
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.hasRedis) return null;
    try {
      const value = await redis!.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Failed to get cache value', { error, key });
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.hasRedis) return;
    try {
      await redis!.del(key);
    } catch (error) {
      logger.error('Failed to delete cache value', { error, key });
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.hasRedis) return false;
    try {
      const result = await redis!.exists(key);
      return result === 1;
    } catch (error) {
      return false;
    }
  }

  async clear(): Promise<void> {
    if (!this.hasRedis) return;
    try {
      await redis!.flushdb();
      logger.info('Cache cleared');
    } catch (error) {
      logger.error('Failed to clear cache', { error });
    }
  }

  async getStats(): Promise<{ connected: boolean; keys: number; memory: string }> {
    if (!this.hasRedis) return { connected: false, keys: 0, memory: 'N/A (no Redis)' };
    try {
      const info = await redis!.info('memory');
      const keys = await redis!.dbsize();
      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const memory = memoryMatch ? memoryMatch[1].trim() : 'unknown';
      return { connected: true, keys, memory };
    } catch (error) {
      return { connected: false, keys: 0, memory: 'unknown' };
    }
  }
}

export const cacheService = new CacheService();
