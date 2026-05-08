import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { passwordService } from '../services/password.service';
import { authService } from '../services/auth.service';
import { cacheService } from '../services/cache.service';
import { fallbackService } from '../services/fallback.service';
import { groqAPIService } from '../services/groq-api.service';
import { logger } from '../utils/logger';

export class AdminController {
  private failedAttempts = new Map<string, number>();
  private lockouts = new Map<string, number>();

  /**
   * POST /api/admin/login
   * Admin login with enhanced security
   */
  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;
      const ipAddress = req.ip;

      // Check if account is locked
      if (this.isLocked(username)) {
        logger.warn('Login attempt on locked account', { username, ipAddress });
        return res.status(429).json({
          error: 'Account Locked',
          message: 'Account is locked due to failed login attempts. Try again in 15 minutes.',
        });
      }

      // Find admin user
      const user = await prisma.user.findUnique({
        where: { username },
      });

      if (!user || user.role !== 'ADMIN') {
        this.recordFailedAttempt(username);
        logger.warn('Failed admin login - user not found or not admin', { username, ipAddress });
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid credentials',
        });
      }

      // Verify password
      const isValid = await passwordService.verifyPassword(password, user.passwordHash);

      if (!isValid) {
        this.recordFailedAttempt(username);
        logger.warn('Failed admin login - invalid password', { username, ipAddress });
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid credentials',
        });
      }

      // Check if account is active
      if (!user.isActive) {
        logger.warn('Login attempt on inactive account', { username, ipAddress });
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Account is deactivated',
        });
      }

      // Success - clear failed attempts
      this.clearFailedAttempts(username);

      // Generate token with shorter expiration for admins (30 minutes)
      const token = authService.generateToken(user.id, user.username, user.role, '30m');
      const expiresIn = authService.getTokenExpirationTime('30m');

      // Update last activity
      await prisma.user.update({
        where: { id: user.id },
        data: { lastActivityAt: new Date() },
      });

      // Log successful login
      await prisma.auditLog.create({
        data: {
          adminId: user.id,
          actionType: 'login',
          resourceType: 'auth',
          ipAddress,
          details: { success: true },
        },
      });

      logger.info('Admin login successful', { username, ipAddress });

      res.status(200).json({
        token,
        expiresIn,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      });
    } catch (error: any) {
      logger.error('Admin login error', { error });
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Login failed',
      });
    }
  }

  /**
   * GET /api/admin/health
   * System health check
   */
  async getHealth(req: Request, res: Response) {
    try {
      const startTime = Date.now();

      // Check database
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const dbResponseTime = Date.now() - dbStart;
      const dbStatus = dbResponseTime < 1000 ? 'up' : 'down';

      // Check Redis
      const redisStart = Date.now();
      const cacheStats = await cacheService.getStats();
      const redisResponseTime = Date.now() - redisStart;
      const redisStatus = cacheStats.connected ? 'up' : 'down';

      // Check Groq API
      const aiStart = Date.now();
      const aiStatus = await groqAPIService.getStatus();
      const aiResponseTime = Date.now() - aiStart;

      // Get metrics
      const activeUsers = await prisma.session.count({
        where: { isActive: true },
      });

      const recentMessages = await prisma.message.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 3600000), // Last hour
          },
          isUserMessage: false,
        },
        select: { processingTimeMs: true },
      });

      const avgResponseTime =
        recentMessages.length > 0
          ? recentMessages.reduce((sum, m) => sum + (m.processingTimeMs || 0), 0) /
            recentMessages.length
          : 0;

      const totalMessages = recentMessages.length;
      const errorMessages = recentMessages.filter((m) => !m.processingTimeMs).length;
      const errorRate = totalMessages > 0 ? errorMessages / totalMessages : 0;

      // Determine overall status
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (dbStatus === 'down' || redisStatus === 'down') {
        status = 'unhealthy';
      } else if (!aiStatus.available) {
        status = 'degraded';
      }

      res.status(200).json({
        status,
        components: {
          database: {
            status: dbStatus,
            responseTime: dbResponseTime,
          },
          redis: {
            status: redisStatus,
            responseTime: redisResponseTime,
          },
          aiApi: {
            status: aiStatus.available ? 'up' : 'down',
            responseTime: aiStatus.responseTime,
          },
        },
        metrics: {
          activeUsers,
          avgResponseTime: Math.round(avgResponseTime),
          errorRate: Math.round(errorRate * 100) / 100,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('Health check error', { error });
      res.status(500).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/admin/unanswered
   * Get unanswered questions report
   */
  async getUnansweredQuestions(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const resolved = req.query.resolved === 'true';

      const report = await fallbackService.getUnansweredQuestionsReport({
        limit,
        offset,
        resolved,
      });

      res.status(200).json(report);
    } catch (error: any) {
      logger.error('Failed to get unanswered questions', { error });
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve unanswered questions',
      });
    }
  }

  // Helper methods for login security
  private recordFailedAttempt(username: string): void {
    const attempts = (this.failedAttempts.get(username) || 0) + 1;
    this.failedAttempts.set(username, attempts);

    if (attempts >= 5) {
      this.lockouts.set(username, Date.now() + 15 * 60 * 1000); // 15 min lockout
      logger.warn('Account locked due to failed attempts', { username, attempts });
    }
  }

  private isLocked(username: string): boolean {
    const lockoutUntil = this.lockouts.get(username);
    if (!lockoutUntil) return false;

    if (Date.now() > lockoutUntil) {
      this.lockouts.delete(username);
      this.clearFailedAttempts(username);
      return false;
    }

    return true;
  }

  private clearFailedAttempts(username: string): void {
    this.failedAttempts.delete(username);
    this.lockouts.delete(username);
  }
}

export const adminController = new AdminController();
