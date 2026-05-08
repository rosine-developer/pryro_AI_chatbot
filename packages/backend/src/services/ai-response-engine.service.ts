import { AIConfig, AIResponse, ConversationContext } from '../models/types';
import { keywordMatcherService } from './keyword-matcher.service';
import { groqAPIService } from './groq-api.service';
import { contextBuilderService } from './context-builder.service';
import { fallbackService } from './fallback.service';
import { cacheService } from './cache.service';
import { logger } from '../utils/logger';

export class AIResponseEngineService {
  private config: AIConfig;

  constructor() {
    this.config = {
      mode: (process.env.AI_MODE as 'keyword' | 'ai-api' | 'hybrid') || 'hybrid',
      keywordMatcherEnabled: true,
      aiApiEnabled: true,
      fallbackToKeyword: true,
      maxContextMessages: 10,
      maxContextLength: 5000,
    };
  }

  /**
   * Check if message is a social/greeting message that should go straight to AI
   */
  private isSocialMessage(message: string): boolean {
    const normalized = message.toLowerCase().trim();
    const socialPatterns = [
      /^(hi|hello|hey|hiya|howdy|greetings|salut|bonjour|hola|ciao|ola|salam|مرحبا|你好|こんにちは)\b/,
      /^(good\s*(morning|afternoon|evening|night|day))/,
      /^(thanks|thank you|thank u|thx|ty|cheers|merci|gracias|danke|grazie)\b/,
      /^(ok|okay|great|awesome|nice|cool|perfect|wonderful|excellent|amazing|fantastic)\b/,
      /^(oooh|ooh|oh|wow|ah|ahh)\b/,
      /^(bye|goodbye|see you|cya|later|farewell|au revoir|adios)\b/,
      /^(yes|no|sure|yep|nope|absolutely|definitely|of course)\b/,
      /^(how are you|how r u|how do you do|what's up|wassup|sup)\b/,
    ];
    return socialPatterns.some((pattern) => pattern.test(normalized));
  }

  /**
   * Process user message and generate AI response
   */
  async processMessage(
    message: string,
    sessionId: string,
    userId: string
  ): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      // Build conversation context
      const context = await contextBuilderService.buildContext(sessionId, userId);

      // Get knowledge base from cache
      const knowledgeBase = await cacheService.getKnowledgeBase();

      logger.info('Processing message', {
        sessionId,
        mode: this.config.mode,
        knowledgeBaseSize: knowledgeBase.length,
      });

      let response: AIResponse | null = null;

      // Route social/greeting messages directly to AI API (skip keyword matcher)
      const isSocial = this.isSocialMessage(message);

      // Try keyword matching first (if enabled and not a social message)
      if (
        !isSocial &&
        (this.config.mode === 'keyword' ||
          (this.config.mode === 'hybrid' && this.config.keywordMatcherEnabled))
      ) {
        response = await this.tryKeywordMatch(message, knowledgeBase, startTime);

        if (response && this.config.mode === 'keyword') {
          return response;
        }

        if (response && this.config.mode === 'hybrid') {
          // In hybrid mode, return keyword match if found
          return response;
        }
      }

      // Try AI API (if enabled and keyword didn't match, or it's a social message)
      if (
        !response &&
        (this.config.mode === 'ai-api' ||
          isSocial ||
          (this.config.mode === 'hybrid' && this.config.aiApiEnabled))
      ) {
        try {
          response = await this.tryAIAPI(message, context, knowledgeBase, startTime);

          if (response) {
            return response;
          }
        } catch (error) {
          logger.error('AI API failed', { error, sessionId });

          // Fallback to keyword if configured
          if (this.config.fallbackToKeyword && this.config.mode === 'ai-api') {
            response = await this.tryKeywordMatch(message, knowledgeBase, startTime);

            if (response) {
              logger.info('Fell back to keyword matcher', { sessionId });
              return response;
            }
          }
        }
      }

      // No match found - return fallback response
      return this.generateFallbackResponse(message, sessionId, userId, startTime);
    } catch (error) {
      logger.error('AI Response Engine error', { error, sessionId });
      return this.generateFallbackResponse(message, sessionId, userId, startTime);
    }
  }

  /**
   * Try keyword matching
   */
  private async tryKeywordMatch(
    message: string,
    knowledgeBase: any[],
    startTime: number
  ): Promise<AIResponse | null> {
    const match = keywordMatcherService.match(message, knowledgeBase);

    if (match) {
      const processingTime = Date.now() - startTime;

      return {
        content: match.entry.response,
        confidence: match.matchScore,
        source: 'KEYWORD',
        processingTime,
        matchedKnowledge: [match.entry],
      };
    }

    return null;
  }

  /**
   * Try AI API
   */
  private async tryAIAPI(
    message: string,
    context: ConversationContext,
    knowledgeBase: any[],
    startTime: number
  ): Promise<AIResponse | null> {
    // Filter relevant knowledge for the AI
    const relevantKnowledge = contextBuilderService.filterRelevantKnowledge(
      message,
      knowledgeBase,
      10
    );

    const response = await groqAPIService.generateResponse(message, context, relevantKnowledge);

    if (response) {
      const processingTime = Date.now() - startTime;

      return {
        content: response,
        confidence: 0.8, // AI API responses get high confidence
        source: 'AI_API',
        processingTime,
        matchedKnowledge: relevantKnowledge,
      };
    }

    return null;
  }

  /**
   * Generate fallback response
   */
  private generateFallbackResponse(
    message: string,
    sessionId: string,
    userId: string,
    startTime: number
  ): AIResponse {
    const processingTime = Date.now() - startTime;

    // Log unanswered question
    fallbackService
      .logUnansweredQuestion(userId, sessionId, message, this.config.mode)
      .catch((err) => logger.error('Failed to log unanswered question', { err }));

    return {
      content: fallbackService.getFallbackResponse(),
      confidence: 0,
      source: 'FALLBACK',
      processingTime,
    };
  }

  /**
   * Update AI configuration
   */
  updateConfig(config: Partial<AIConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('AI config updated', { config: this.config });
  }

  /**
   * Get current configuration
   */
  getConfig(): AIConfig {
    return { ...this.config };
  }

  /**
   * Test AI engine
   */
  async test(): Promise<{
    keywordMatcher: boolean;
    aiApi: boolean;
    cache: boolean;
  }> {
    try {
      const [knowledgeBase, aiApiStatus] = await Promise.all([
        cacheService.getKnowledgeBase(),
        groqAPIService.getStatus(),
      ]);

      return {
        keywordMatcher: knowledgeBase.length > 0,
        aiApi: aiApiStatus.available,
        cache: knowledgeBase.length > 0,
      };
    } catch (error) {
      logger.error('AI engine test failed', { error });
      return {
        keywordMatcher: false,
        aiApi: false,
        cache: false,
      };
    }
  }
}

export const aiResponseEngineService = new AIResponseEngineService();
