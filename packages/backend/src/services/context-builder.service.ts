import { Message, ConversationContext, KnowledgeEntry } from '../models/types';
import { messageService } from './message.service';
import { logger } from '../utils/logger';

export class ContextBuilderService {
  private readonly MAX_CONTEXT_MESSAGES = 10;
  private readonly MAX_CONTEXT_LENGTH = 5000;

  /**
   * Build conversation context for AI processing
   */
  async buildContext(sessionId: string, userId: string): Promise<ConversationContext> {
    try {
      // Get recent messages from the session
      const previousMessages = await messageService.getRecentMessages(
        sessionId,
        this.MAX_CONTEXT_MESSAGES
      );

      return {
        sessionId,
        userId,
        previousMessages,
      };
    } catch (error) {
      logger.error('Failed to build conversation context', {
        error,
        sessionId,
        userId,
      });

      // Return empty context on error
      return {
        sessionId,
        userId,
        previousMessages: [],
      };
    }
  }

  /**
   * Select last N messages for context window
   */
  selectContextWindow(messages: Message[], count: number = 10): Message[] {
    if (messages.length <= count) {
      return messages;
    }

    // Return the last N messages
    return messages.slice(-count);
  }

  /**
   * Truncate context to maximum length
   */
  truncateContext(messages: Message[], maxLength: number = 5000): Message[] {
    let totalLength = 0;
    const truncated: Message[] = [];

    // Add messages from newest to oldest until we hit the limit
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      const messageLength = message.content.length;

      if (totalLength + messageLength > maxLength) {
        break;
      }

      truncated.unshift(message);
      totalLength += messageLength;
    }

    return truncated;
  }

  /**
   * Build context with length constraints
   */
  buildConstrainedContext(
    messages: Message[],
    maxMessages: number = 10,
    maxLength: number = 5000
  ): Message[] {
    // First, select the context window
    let context = this.selectContextWindow(messages, maxMessages);

    // Then, truncate if needed
    context = this.truncateContext(context, maxLength);

    return context;
  }

  /**
   * Calculate total context length
   */
  calculateContextLength(messages: Message[]): number {
    return messages.reduce((total, msg) => total + msg.content.length, 0);
  }

  /**
   * Filter relevant knowledge base entries based on message
   */
  filterRelevantKnowledge(
    message: string,
    knowledgeBase: KnowledgeEntry[],
    maxEntries: number = 10
  ): KnowledgeEntry[] {
    const messageLower = message.toLowerCase();
    const scored: { entry: KnowledgeEntry; score: number }[] = [];

    for (const entry of knowledgeBase) {
      if (!entry.isActive) continue;

      let score = 0;

      // Check if any keywords appear in the message
      for (const keyword of entry.keywords) {
        if (messageLower.includes(keyword.toLowerCase())) {
          score += entry.priority;
        }
      }

      // Check if category is mentioned
      if (messageLower.includes(entry.category.toLowerCase())) {
        score += 1;
      }

      if (score > 0) {
        scored.push({ entry, score });
      }
    }

    // Sort by score and return top N
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, maxEntries)
      .map((item) => item.entry);
  }

  /**
   * Summarize long context (for future use)
   */
  summarizeContext(messages: Message[]): string {
    if (messages.length === 0) {
      return 'No previous conversation';
    }

    const userMessages = messages.filter((m) => m.isUserMessage).length;
    const botMessages = messages.filter((m) => !m.isUserMessage).length;

    return `Conversation with ${userMessages} user messages and ${botMessages} bot responses`;
  }

  /**
   * Check if context needs refresh
   */
  needsRefresh(context: ConversationContext, currentMessageCount: number): boolean {
    // Refresh if we have significantly more messages than in context
    return currentMessageCount > context.previousMessages.length + 5;
  }
}

export const contextBuilderService = new ContextBuilderService();
