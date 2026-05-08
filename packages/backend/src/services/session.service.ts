import { prisma } from '../config/database';
import { Session } from '../models/types';
import { logger } from '../utils/logger';

export class SessionService {
  /**
   * Create a new chat session
   */
  async createSession(userId: string): Promise<Session> {
    try {
      const session = await prisma.session.create({
        data: {
          userId,
          startedAt: new Date(),
          lastMessageAt: new Date(),
          isActive: true,
        },
      });

      logger.info('Session created', {
        sessionId: session.id,
        userId,
      });

      return session;
    } catch (error) {
      logger.error('Failed to create session', { error, userId });
      throw error;
    }
  }

  /**
   * Get session by ID
   */
  async getSessionById(sessionId: string): Promise<Session | null> {
    try {
      return await prisma.session.findUnique({
        where: { id: sessionId },
      });
    } catch (error) {
      logger.error('Failed to get session', { error, sessionId });
      throw error;
    }
  }

  /**
   * Get active session for user (most recent)
   */
  async getActiveSession(userId: string): Promise<Session | null> {
    try {
      return await prisma.session.findFirst({
        where: {
          userId,
          isActive: true,
        },
        orderBy: {
          lastMessageAt: 'desc',
        },
      });
    } catch (error) {
      logger.error('Failed to get active session', { error, userId });
      throw error;
    }
  }

  /**
   * Get all sessions for a user
   */
  async getUserSessions(
    userId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ sessions: Session[]; total: number }> {
    const { limit = 50, offset = 0 } = options;

    try {
      const [sessions, total] = await Promise.all([
        prisma.session.findMany({
          where: { userId },
          orderBy: { startedAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.session.count({
          where: { userId },
        }),
      ]);

      return { sessions, total };
    } catch (error) {
      logger.error('Failed to get user sessions', { error, userId });
      throw error;
    }
  }

  /**
   * Update session last message time
   */
  async updateLastMessageTime(sessionId: string): Promise<void> {
    try {
      await prisma.session.update({
        where: { id: sessionId },
        data: { lastMessageAt: new Date() },
      });
    } catch (error) {
      logger.error('Failed to update session last message time', { error, sessionId });
      throw error;
    }
  }

  /**
   * Close session (mark as inactive)
   */
  async closeSession(sessionId: string): Promise<void> {
    try {
      await prisma.session.update({
        where: { id: sessionId },
        data: { isActive: false },
      });

      logger.info('Session closed', { sessionId });
    } catch (error) {
      logger.error('Failed to close session', { error, sessionId });
      throw error;
    }
  }

  /**
   * Check if session has timed out (24 hours)
   */
  isSessionTimedOut(session: Session): boolean {
    const timeout = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const now = new Date().getTime();
    const lastMessage = new Date(session.lastMessageAt).getTime();
    return now - lastMessage > timeout;
  }

  /**
   * Clean up old inactive sessions
   */
  async cleanupOldSessions(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await prisma.session.deleteMany({
        where: {
          isActive: false,
          lastMessageAt: {
            lt: cutoffDate,
          },
        },
      });

      logger.info('Cleaned up old sessions', {
        count: result.count,
        daysOld,
      });

      return result.count;
    } catch (error) {
      logger.error('Failed to cleanup old sessions', { error });
      throw error;
    }
  }
}

export const sessionService = new SessionService();
