import { Router } from 'express';
import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { passwordService } from '../services/password.service';
import { authService } from '../services/auth.service';
import { validateBody } from '../middleware/validation.middleware';
import { LoginSchema } from '../models/schemas';
import { logger } from '../utils/logger';

export const authRouter = Router();

/**
 * POST /api/auth/login
 * User login (both admin and regular users)
 */
authRouter.post('/login', validateBody(LoginSchema), async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const ipAddress = req.ip;

    // Find user
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      logger.warn('Failed login - user not found', { username, ipAddress });
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid credentials',
      });
    }

    // Verify password
    const isValid = await passwordService.verifyPassword(password, user.passwordHash);

    if (!isValid) {
      logger.warn('Failed login - invalid password', { username, ipAddress });
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

    // Generate token (30 min for admin, 24 hours for users)
    const tokenExpiry = user.role === 'ADMIN' ? '30m' : '24h';
    const token = authService.generateToken(user.id, user.username, user.role, tokenExpiry);
    const expiresIn = authService.getTokenExpirationTime(tokenExpiry);

    // Update last activity
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActivityAt: new Date() },
    });

    logger.info('User login successful', { username, role: user.role, ipAddress });

    res.status(200).json({
      token,
      expiresIn,
      user: {
        id: user.id,
        username: user.username,
        role: user.role.toLowerCase(),
      },
    });
  } catch (error: any) {
    logger.error('Login error', { error });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Login failed',
    });
  }
});
