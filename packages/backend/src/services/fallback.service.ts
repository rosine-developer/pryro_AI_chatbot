import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export class FallbackService {
  private defaultFallbackMessage = `I'm Pryro's AI assistant and I can only answer questions about Pryro's ERP platform, features, pricing, and services.

Here are some things you can ask me:
- "What is Pryro?" or "Tell me about Pryro"
- "What products does Pryro offer?"
- "How much does Pryro cost?"
- "How do I contact Pryro support?"

For anything else, reach us at support@pryro.com or visit https://pryro.com`;

  /**
   * Get fallback response
   */
  getFallbackResponse(customMessage?: string): string {
    return customMessage || this.defaultFallbackMessage;
  }

  /**
   * Log unanswered question
   */
  async logUnansweredQuestion(
    userId: string,
    sessionId: string,
    question: string,
    attemptedSource: string
  ): Promise<void> {
    try {
      await prisma.unansweredQuestion.create({
        data: {
          userId,
          sessionId,
          question,
          attemptedSource,
          resolved: false,
        },
      });

      logger.info('Unanswered question logged', {
        userId,
        sessionId,
        attemptedSource,
      });
    } catch (error) {
      logger.error('Failed to log unanswered question', {
        error,
        userId,
        sessionId,
      });
    }
  }

  /**
   * Get unanswered questions report
   */
  async getUnansweredQuestionsReport(options: {
    limit?: number;
    offset?: number;
    resolved?: boolean;
  } = {}): Promise<{
    questions: any[];
    total: number;
    frequentQuestions: { question: string; count: number }[];
  }> {
    const { limit = 50, offset = 0, resolved } = options;

    try {
      const where = resolved !== undefined ? { resolved } : {};

      const [questions, total] = await Promise.all([
        prisma.unansweredQuestion.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.unansweredQuestion.count({ where }),
      ]);

      // Get frequent questions (group by similar questions)
      const allQuestions = await prisma.unansweredQuestion.findMany({
        where: { resolved: false },
        select: { question: true },
      });

      const questionCounts = new Map<string, number>();
      for (const q of allQuestions) {
        const normalized = q.question.toLowerCase().trim();
        questionCounts.set(normalized, (questionCounts.get(normalized) || 0) + 1);
      }

      const frequentQuestions = Array.from(questionCounts.entries())
        .map(([question, count]) => ({ question, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        questions,
        total,
        frequentQuestions,
      };
    } catch (error) {
      logger.error('Failed to get unanswered questions report', { error });
      throw error;
    }
  }

  /**
   * Mark question as resolved
   */
  async markQuestionResolved(questionId: string): Promise<void> {
    try {
      await prisma.unansweredQuestion.update({
        where: { id: questionId },
        data: { resolved: true },
      });

      logger.info('Question marked as resolved', { questionId });
    } catch (error) {
      logger.error('Failed to mark question as resolved', { error, questionId });
      throw error;
    }
  }

  /**
   * Get fallback message suggestions based on question
   */
  getSuggestions(question: string): string[] {
    const suggestions: string[] = [];

    // Add context-specific suggestions
    if (question.toLowerCase().includes('password')) {
      suggestions.push('Try asking about password reset procedures');
    }

    if (question.toLowerCase().includes('account')) {
      suggestions.push('Try asking about account management');
    }

    if (question.toLowerCase().includes('support') || question.toLowerCase().includes('help')) {
      suggestions.push('Contact our support team at support@pryro.com');
    }

    // Default suggestions
    if (suggestions.length === 0) {
      suggestions.push('Try rephrasing your question');
      suggestions.push('Be more specific about what you need');
      suggestions.push('Contact support for personalized help');
    }

    return suggestions;
  }
}

export const fallbackService = new FallbackService();
