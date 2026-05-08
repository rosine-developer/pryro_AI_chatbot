import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { sessionService } from '../services/session.service';
import { messageService } from '../services/message.service';
import { aiResponseEngineService } from '../services/ai-response-engine.service';
import { trainingService } from '../services/training.service';
import { logger } from '../utils/logger';
import { validateMessageOrThrow } from '../utils/validation.utils';

// Cached guest user id so we don't query on every request
let guestUserId: string | null = null;

async function getGuestUserId(): Promise<string> {
  if (guestUserId) return guestUserId;
  const guest = await prisma.user.findUnique({ where: { username: 'guest' } });
  if (guest) {
    guestUserId = guest.id;
    return guestUserId;
  }
  // Create guest user if it doesn't exist
  const created = await prisma.user.create({
    data: {
      username: 'guest',
      email: 'guest@pryro.com',
      passwordHash: 'no-login',
      role: 'USER',
      isActive: true,
    },
  });
  guestUserId = created.id;
  return guestUserId;
}

export class ChatController {
  /**
   * POST /api/chat/guest/sessions
   * Create a guest session (no auth required)
   */
  async createGuestSession(req: Request, res: Response) {
    try {
      const userId = await getGuestUserId();
      const session = await sessionService.createSession(userId);
      res.status(201).json({
        sessionId: session.id,
        startedAt: session.startedAt.toISOString(),
      });
    } catch (error: any) {
      logger.error('Failed to create guest session', { error });
      res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create chat session' });
    }
  }

  /**
   * POST /api/chat/guest/messages
   * Send a message as guest (no auth required)
   */
  async sendGuestMessage(req: Request, res: Response) {
    try {
      const { sessionId, content } = req.body;
      const userId = await getGuestUserId();

      validateMessageOrThrow(content);

      const session = await sessionService.getSessionById(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Not Found', message: 'Session not found' });
      }

      const userMessage = await messageService.createMessage({
        sessionId,
        userId,
        content,
        isUserMessage: true,
      });

      await sessionService.updateLastMessageTime(sessionId);

      const startTime = Date.now();
      const aiResponse = await aiResponseEngineService.processMessage(content, sessionId, userId);
      const processingTime = Date.now() - startTime;

      const botMessage = await messageService.createMessage({
        sessionId,
        userId,
        content: aiResponse.content,
        isUserMessage: false,
        aiSource: aiResponse.source.toUpperCase() as 'KEYWORD' | 'AI_API' | 'FALLBACK',
        confidenceScore: aiResponse.confidence,
        processingTimeMs: processingTime,
      });

      trainingService
        .logResponse(botMessage.id, sessionId, content, aiResponse.content, aiResponse.source, aiResponse.confidence)
        .catch((err) => logger.error('Failed to log response for training', { err }));

      res.status(200).json({
        userMessage: {
          id: userMessage.id,
          content: userMessage.content,
          createdAt: userMessage.createdAt.toISOString(),
        },
        botResponse: {
          id: botMessage.id,
          content: botMessage.content,
          source: aiResponse.source,
          confidence: aiResponse.confidence,
          processingTime,
          createdAt: botMessage.createdAt.toISOString(),
        },
      });
    } catch (error: any) {
      logger.error('Failed to send guest message', { error, sessionId: req.body.sessionId });
      res.status(500).json({ error: 'Internal Server Error', message: error.message || 'Failed to process message' });
    }
  }

  /**
   * POST /api/chat/sessions
   * Create a new chat session
   */
  async createSession(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;

      const session = await sessionService.createSession(userId);

      res.status(201).json({
        sessionId: session.id,
        startedAt: session.startedAt.toISOString(),
      });
    } catch (error: any) {
      logger.error('Failed to create session', { error, userId: req.user?.userId });
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create chat session',
      });
    }
  }

  /**
   * POST /api/chat/messages
   * Send a message and get AI response
   */
  async sendMessage(req: Request, res: Response) {
    try {
      const { sessionId, content } = req.body;
      const userId = req.user!.userId;

      // Validate message
      validateMessageOrThrow(content);

      // Verify session exists and belongs to user
      const session = await sessionService.getSessionById(sessionId);
      if (!session) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Session not found',
        });
      }

      if (session.userId !== userId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Cannot access this session',
        });
      }

      // Store user message
      const userMessage = await messageService.createMessage({
        sessionId,
        userId,
        content,
        isUserMessage: true,
      });

      // Update session last message time
      await sessionService.updateLastMessageTime(sessionId);

      // Generate AI response
      const startTime = Date.now();
      const aiResponse = await aiResponseEngineService.processMessage(content, sessionId, userId);
      const processingTime = Date.now() - startTime;

      // Store bot response
      const botMessage = await messageService.createMessage({
        sessionId,
        userId,
        content: aiResponse.content,
        isUserMessage: false,
        aiSource: aiResponse.source.toUpperCase() as 'KEYWORD' | 'AI_API' | 'FALLBACK',
        confidenceScore: aiResponse.confidence,
        processingTimeMs: processingTime,
      });

      // Log response for training/learning
      trainingService
        .logResponse(
          botMessage.id,
          sessionId,
          content,
          aiResponse.content,
          aiResponse.source,
          aiResponse.confidence
        )
        .catch((err) => logger.error('Failed to log response for training', { err }));

      // Return both messages
      res.status(200).json({
        userMessage: {
          id: userMessage.id,
          content: userMessage.content,
          createdAt: userMessage.createdAt.toISOString(),
        },
        botResponse: {
          id: botMessage.id,
          content: botMessage.content,
          source: aiResponse.source,
          confidence: aiResponse.confidence,
          processingTime,
          createdAt: botMessage.createdAt.toISOString(),
        },
      });
    } catch (error: any) {
      logger.error('Failed to send message', {
        error,
        userId: req.user?.userId,
        sessionId: req.body.sessionId,
      });

      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to process message',
      });
    }
  }

  /**
   * GET /api/chat/sessions/:id/messages
   * Get messages for a session
   */
  async getSessionMessages(req: Request, res: Response) {
    try {
      const { id: sessionId } = req.params;
      const userId = req.user!.userId;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      // Verify session exists and belongs to user (or user is admin)
      const session = await sessionService.getSessionById(sessionId);
      if (!session) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Session not found',
        });
      }

      if (session.userId !== userId && req.user!.role !== 'ADMIN') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Cannot access this session',
        });
      }

      const result = await messageService.getMessagesBySession(sessionId, { limit, offset });

      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Failed to get session messages', {
        error,
        sessionId: req.params.id,
      });

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve messages',
      });
    }
  }

  /**
   * GET /api/chat/history
   * Get user's chat history
   */
  async getChatHistory(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const filters: any = {};

      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }

      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }

      if (req.query.keyword) {
        filters.keyword = req.query.keyword as string;
      }

      const result = await messageService.getChatHistory(userId, filters, { limit, offset });

      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Failed to get chat history', {
        error,
        userId: req.user?.userId,
      });

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve chat history',
      });
    }
  }

  /**
   * GET /api/chat/sessions/:id
   * Get session details
   */
  async getSession(req: Request, res: Response) {
    try {
      const { id: sessionId } = req.params;
      const userId = req.user!.userId;

      const session = await sessionService.getSessionById(sessionId);

      if (!session) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Session not found',
        });
      }

      if (session.userId !== userId && req.user!.role !== 'ADMIN') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Cannot access this session',
        });
      }

      res.status(200).json(session);
    } catch (error: any) {
      logger.error('Failed to get session', {
        error,
        sessionId: req.params.id,
      });

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve session',
      });
    }
  }
}

export const chatController = new ChatController();
