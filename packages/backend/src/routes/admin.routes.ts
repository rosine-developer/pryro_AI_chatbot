import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { trainingService } from '../services/training.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/authorization.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { LoginSchema } from '../models/schemas';
import { Request, Response } from 'express';

export const adminRouter = Router();

// Public routes
adminRouter.post('/login', validateBody(LoginSchema), adminController.login.bind(adminController));

// Protected admin routes
adminRouter.use(authenticateToken);
adminRouter.use(requireAdmin);

// Health and monitoring
adminRouter.get('/health', adminController.getHealth.bind(adminController));
adminRouter.get(
  '/unanswered',
  adminController.getUnansweredQuestions.bind(adminController)
);

// Training and ML endpoints
adminRouter.get('/training/analytics', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const analytics = await trainingService.getTrainingAnalytics(days);
    res.json(analytics);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get training analytics', message: error.message });
  }
});

adminRouter.get('/training/review', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const responses = await trainingService.getResponsesForReview(limit);
    res.json({ responses, total: responses.length });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get responses for review', message: error.message });
  }
});

adminRouter.post('/training/feedback', async (req: Request, res: Response) => {
  try {
    const { messageId, sessionId, userQuestion, aiResponse, rating, feedback } = req.body;
    
    await trainingService.submitFeedback({
      messageId,
      sessionId,
      userQuestion,
      aiResponse,
      rating,
      feedback,
      adminId: req.user!.userId,
    });

    res.json({ success: true, message: 'Feedback submitted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to submit feedback', message: error.message });
  }
});

adminRouter.get('/training/suggestions', async (req: Request, res: Response) => {
  try {
    const minRating = (req.query.minRating as 'good' | 'excellent') || 'excellent';
    const suggestions = await trainingService.suggestKnowledgeEntries(minRating);
    res.json({ suggestions, total: suggestions.length });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get suggestions', message: error.message });
  }
});

adminRouter.get('/training/export', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    
    const data = await trainingService.exportTrainingData(startDate, endDate);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=training-data.json');
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to export training data', message: error.message });
  }
});
