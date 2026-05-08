import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export interface TrainingFeedback {
  messageId: string;
  sessionId: string;
  userQuestion: string;
  aiResponse: string;
  rating: 'good' | 'bad' | 'excellent';
  feedback?: string;
  adminId: string;
}

export interface TrainingData {
  id: string;
  question: string;
  response: string;
  rating: string;
  usageCount: number;
  successRate: number;
  createdAt: Date;
  updatedAt: Date;
}

export class TrainingService {
  /**
   * Log AI response for training purposes
   */
  async logResponse(
    messageId: string,
    sessionId: string,
    question: string,
    response: string,
    source: string,
    confidence: number
  ): Promise<void> {
    try {
      // Store in system metrics for analysis
      await prisma.systemMetric.create({
        data: {
          metricType: 'ai_response',
          metricValue: confidence,
          metadata: {
            messageId,
            sessionId,
            question: question.substring(0, 500), // Limit length
            response: response.substring(0, 1000),
            source,
            timestamp: new Date().toISOString(),
          },
        },
      });

      logger.info('AI response logged for training', {
        messageId,
        sessionId,
        source,
        confidence,
      });
    } catch (error) {
      logger.error('Failed to log AI response', { error, messageId });
    }
  }

  /**
   * Submit feedback on AI response (admin only)
   */
  async submitFeedback(feedback: TrainingFeedback): Promise<void> {
    try {
      // Log the feedback
      await prisma.auditLog.create({
        data: {
          adminId: feedback.adminId,
          actionType: 'ai_feedback',
          resourceType: 'message',
          resourceId: feedback.messageId,
          details: {
            rating: feedback.rating,
            feedback: feedback.feedback,
            question: feedback.userQuestion,
            response: feedback.aiResponse,
          },
        },
      });

      // If rated as excellent, consider adding to knowledge base
      if (feedback.rating === 'excellent') {
        logger.info('Excellent response flagged for knowledge base', {
          messageId: feedback.messageId,
        });
      }

      logger.info('Training feedback submitted', {
        messageId: feedback.messageId,
        rating: feedback.rating,
      });
    } catch (error) {
      logger.error('Failed to submit training feedback', { error });
      throw error;
    }
  }

  /**
   * Get training analytics
   */
  async getTrainingAnalytics(days: number = 30): Promise<{
    totalResponses: number;
    averageConfidence: number;
    sourceBreakdown: Record<string, number>;
    topQuestions: Array<{ question: string; count: number }>;
    feedbackSummary: {
      excellent: number;
      good: number;
      bad: number;
    };
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get AI responses
      const responses = await prisma.systemMetric.findMany({
        where: {
          metricType: 'ai_response',
          recordedAt: { gte: startDate },
        },
      });

      // Get feedback
      const feedbackLogs = await prisma.auditLog.findMany({
        where: {
          actionType: 'ai_feedback',
          createdAt: { gte: startDate },
        },
      });

      // Calculate metrics
      const totalResponses = responses.length;
      const averageConfidence =
        responses.reduce((sum, r) => sum + r.metricValue, 0) / totalResponses || 0;

      // Source breakdown
      const sourceBreakdown: Record<string, number> = {};
      responses.forEach((r) => {
        const source = (r.metadata as any)?.source || 'unknown';
        sourceBreakdown[source] = (sourceBreakdown[source] || 0) + 1;
      });

      // Top questions (simplified - group by first 50 chars)
      const questionCounts: Record<string, number> = {};
      responses.forEach((r) => {
        const question = ((r.metadata as any)?.question || '').substring(0, 50);
        if (question) {
          questionCounts[question] = (questionCounts[question] || 0) + 1;
        }
      });

      const topQuestions = Object.entries(questionCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([question, count]) => ({ question, count }));

      // Feedback summary
      const feedbackSummary = {
        excellent: 0,
        good: 0,
        bad: 0,
      };

      feedbackLogs.forEach((log) => {
        const rating = (log.details as any)?.rating;
        if (rating && rating in feedbackSummary) {
          feedbackSummary[rating as keyof typeof feedbackSummary]++;
        }
      });

      return {
        totalResponses,
        averageConfidence: Math.round(averageConfidence * 100) / 100,
        sourceBreakdown,
        topQuestions,
        feedbackSummary,
      };
    } catch (error) {
      logger.error('Failed to get training analytics', { error });
      throw error;
    }
  }

  /**
   * Get responses that need review (low confidence or flagged)
   */
  async getResponsesForReview(limit: number = 50): Promise<
    Array<{
      messageId: string;
      question: string;
      response: string;
      confidence: number;
      source: string;
      timestamp: string;
    }>
  > {
    try {
      const responses = await prisma.systemMetric.findMany({
        where: {
          metricType: 'ai_response',
          metricValue: { lt: 0.6 }, // Low confidence responses
        },
        orderBy: { recordedAt: 'desc' },
        take: limit,
      });

      return responses.map((r) => {
        const metadata = r.metadata as any;
        return {
          messageId: metadata?.messageId || '',
          question: metadata?.question || '',
          response: metadata?.response || '',
          confidence: r.metricValue,
          source: metadata?.source || '',
          timestamp: r.recordedAt.toISOString(),
        };
      });
    } catch (error) {
      logger.error('Failed to get responses for review', { error });
      throw error;
    }
  }

  /**
   * Export training data for external ML training
   */
  async exportTrainingData(startDate?: Date, endDate?: Date): Promise<TrainingData[]> {
    try {
      const where: any = {
        metricType: 'ai_response',
      };

      if (startDate || endDate) {
        where.recordedAt = {};
        if (startDate) where.recordedAt.gte = startDate;
        if (endDate) where.recordedAt.lte = endDate;
      }

      const responses = await prisma.systemMetric.findMany({
        where,
        orderBy: { recordedAt: 'desc' },
      });

      // Get feedback for these responses
      const messageIds = responses
        .map((r) => (r.metadata as any)?.messageId)
        .filter(Boolean);

      const feedbackLogs = await prisma.auditLog.findMany({
        where: {
          actionType: 'ai_feedback',
          resourceId: { in: messageIds },
        },
      });

      const feedbackMap = new Map(
        feedbackLogs.map((log) => [log.resourceId, log.details as any])
      );

      return responses.map((r) => {
        const metadata = r.metadata as any;
        const feedback = feedbackMap.get(metadata?.messageId);

        return {
          id: r.id,
          question: metadata?.question || '',
          response: metadata?.response || '',
          rating: feedback?.rating || 'unrated',
          usageCount: 1,
          successRate: r.metricValue,
          createdAt: r.recordedAt,
          updatedAt: r.recordedAt,
        };
      });
    } catch (error) {
      logger.error('Failed to export training data', { error });
      throw error;
    }
  }

  /**
   * Suggest knowledge base entries from successful responses
   */
  async suggestKnowledgeEntries(minRating: 'good' | 'excellent' = 'excellent'): Promise<
    Array<{
      question: string;
      response: string;
      frequency: number;
      avgConfidence: number;
    }>
  > {
    try {
      // Get highly rated responses
      const feedbackLogs = await prisma.auditLog.findMany({
        where: {
          actionType: 'ai_feedback',
        },
      });

      const goodResponses = feedbackLogs.filter((log) => {
        const rating = (log.details as any)?.rating;
        return rating === minRating || (minRating === 'good' && rating === 'excellent');
      });

      // Group similar questions
      const suggestions: Record<
        string,
        { response: string; count: number; totalConfidence: number }
      > = {};

      for (const log of goodResponses) {
        const details = log.details as any;
        const question = details?.question?.substring(0, 100) || '';
        const response = details?.response || '';

        if (question && response) {
          if (!suggestions[question]) {
            suggestions[question] = { response, count: 0, totalConfidence: 0 };
          }
          suggestions[question].count++;
          suggestions[question].totalConfidence += 0.8; // Default confidence
        }
      }

      return Object.entries(suggestions)
        .map(([question, data]) => ({
          question,
          response: data.response,
          frequency: data.count,
          avgConfidence: data.totalConfidence / data.count,
        }))
        .filter((s) => s.frequency >= 3) // At least 3 occurrences
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 20);
    } catch (error) {
      logger.error('Failed to suggest knowledge entries', { error });
      throw error;
    }
  }
}

export const trainingService = new TrainingService();
