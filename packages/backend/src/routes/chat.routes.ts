import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requirePermission, Permission } from '../middleware/authorization.middleware';
import { validateBody, validateQuery } from '../middleware/validation.middleware';
import { SendMessageSchema, PaginationSchema } from '../models/schemas';

export const chatRouter = Router();

// ─── Public guest chat (no login required) ───────────────────────────────────

// Create guest session
chatRouter.post('/guest/sessions', chatController.createGuestSession.bind(chatController));

// Send message as guest
chatRouter.post(
  '/guest/messages',
  validateBody(SendMessageSchema),
  chatController.sendGuestMessage.bind(chatController)
);

// ─── Authenticated chat routes ────────────────────────────────────────────────

chatRouter.use(authenticateToken);

// Create new session
chatRouter.post(
  '/sessions',
  requirePermission(Permission.CHAT_SEND_MESSAGE),
  chatController.createSession.bind(chatController)
);

// Send message and get response
chatRouter.post(
  '/messages',
  requirePermission(Permission.CHAT_SEND_MESSAGE),
  validateBody(SendMessageSchema),
  chatController.sendMessage.bind(chatController)
);

// Get session messages
chatRouter.get(
  '/sessions/:id/messages',
  requirePermission(Permission.CHAT_VIEW_HISTORY),
  validateQuery(PaginationSchema),
  chatController.getSessionMessages.bind(chatController)
);

// Get session details
chatRouter.get(
  '/sessions/:id',
  requirePermission(Permission.CHAT_VIEW_HISTORY),
  chatController.getSession.bind(chatController)
);

// Get chat history
chatRouter.get(
  '/history',
  requirePermission(Permission.CHAT_VIEW_HISTORY),
  validateQuery(PaginationSchema),
  chatController.getChatHistory.bind(chatController)
);
