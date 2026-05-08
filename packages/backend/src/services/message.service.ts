import { prisma } from '../config/database';
import { Message, HistoryFilters } from '../models/types';
import { logger } from '../utils/logger';

export class MessageService {
  /**
   * Create a new message
   */
  async createMessage(data: {
    sessionId: string;
    userId: string;
    content: string;
    isUserMessage: boolean;
    aiSource?: 'KEYWORD' | 'AI_API' | 'FALLBACK';
    confidenceScore?: number;
    processingTimeMs?: number;
  }): Promise<Message> {
    try {
      const message = await prisma.message.create({
        data: {
          sessionId: data.sessionId,
          userId: data.userId,
          content: data.content,
          isUserMessage: data.isUserMessage,
          aiSource: data.aiSource || null,
          confidenceScore: data.confidenceScore || null,
          processingTimeMs: data.processingTimeMs || null,
          createdAt: new Date(),
        },
      });

      logger.info('Message created', {
        messageId: message.id,
        sessionId: data.sessionId,
        isUserMessage: data.isUserMessage,
      });

      return message;
    } catch (error) {
      logger.error('Failed to create message', { error, data });
      throw error;
    }
  }

  /**
   * Get messages by session ID
   */
  async getMessagesBySession(
    sessionId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ messages: Message[]; total: number; hasMore: boolean }> {
    const { limit = 50, offset = 0 } = options;

    try {
      const [messages, total] = await Promise.all([
        prisma.message.findMany({
          where: { sessionId },
          orderBy: { createdAt: 'asc' },
          take: limit,
          skip: offset,
        }),
        prisma.message.count({
          where: { sessionId },
        }),
      ]);

      return {
        messages,
        total,
        hasMore: offset + messages.length < total,
      };
    } catch (error) {
      logger.error('Failed to get messages by session', { error, sessionId });
      throw error;
    }
  }

  /**
   * Get recent messages for context (last N messages)
   */
  async getRecentMessages(sessionId: string, count: number = 10): Promise<Message[]> {
    try {
      const messages = await prisma.message.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'desc' },
        take: count,
      });

      // Return in chronological order (oldest first)
      return messages.reverse();
    } catch (error) {
      logger.error('Failed to get recent messages', { error, sessionId, count });
      throw error;
    }
  }

  /**
   * Get user's chat history with filters
   */
  async getChatHistory(
    userId: string,
    filters: HistoryFilters = {},
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ sessions: any[]; total: number }> {
    const { limit = 50, offset = 0 } = options;

    try {
      const where: any = { userId };

      if (filters.startDate || filters.endDate) {
        where.startedAt = {};
        if (filters.startDate) {
          where.startedAt.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.startedAt.lte = filters.endDate;
        }
      }

      let sessions = await prisma.session.findMany({
        where,
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { startedAt: 'desc' },
        take: limit,
        skip: offset,
      });

      // Filter by keyword if provided
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        sessions = sessions.filter((session) =>
          session.messages.some((msg) => msg.content.toLowerCase().includes(keyword))
        );
      }

      const total = await prisma.session.count({ where });

      return { sessions, total };
    } catch (error) {
      logger.error('Failed to get chat history', { error, userId, filters });
      throw error;
    }
  }

  /**
   * Search messages by content
   */
  async searchMessages(
    userId: string,
    searchTerm: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ messages: Message[]; total: number }> {
    const { limit = 50, offset = 0 } = options;

    try {
      const [messages, total] = await Promise.all([
        prisma.message.findMany({
          where: {
            userId,
            content: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.message.count({
          where: {
            userId,
            content: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
        }),
      ]);

      return { messages, total };
    } catch (error) {
      logger.error('Failed to search messages', { error, userId, searchTerm });
      throw error;
    }
  }

  /**
   * Get message statistics
   */
  async getMessageStats(userId: string): Promise<{
    totalMessages: number;
    userMessages: number;
    botMessages: number;
    avgProcessingTime: number;
  }> {
    try {
      const [totalMessages, userMessages, botMessages, avgProcessingTime] = await Promise.all([
        prisma.message.count({ where: { userId } }),
        prisma.message.count({ where: { userId, isUserMessage: true } }),
        prisma.message.count({ where: { userId, isUserMessage: false } }),
        prisma.message.aggregate({
          where: { userId, isUserMessage: false, processingTimeMs: { not: null } },
          _avg: { processingTimeMs: true },
        }),
      ]);

      return {
        totalMessages,
        userMessages,
        botMessages,
        avgProcessingTime: avgProcessingTime._avg.processingTimeMs || 0,
      };
    } catch (error) {
      logger.error('Failed to get message stats', { error, userId });
      throw error;
    }
  }

  /**
   * Delete old messages (for cleanup)
   */
  async deleteOldMessages(daysOld: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await prisma.message.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      logger.info('Deleted old messages', {
        count: result.count,
        daysOld,
      });

      return result.count;
    } catch (error) {
      logger.error('Failed to delete old messages', { error });
      throw error;
    }
  }
}

export const messageService = new MessageService();
