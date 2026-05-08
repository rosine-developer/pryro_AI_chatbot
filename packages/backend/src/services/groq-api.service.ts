import Groq from 'groq-sdk';
import { GroqConfig, GroqMessage, ConversationContext, KnowledgeEntry } from '../models/types';
import { logger } from '../utils/logger';
import { fetchRelevantPryroPage } from './pryro-scraper.service';

export class GroqAPIService {
  private client: Groq;
  private config: GroqConfig;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY environment variable is required');
    }

    this.client = new Groq({ apiKey });

    this.config = {
      apiKey,
      model: 'llama-3.3-70b-versatile',
      maxTokens: 1024,
      temperature: 0.7,
      timeout: 30000,
    };
  }

  /**
   * Build system prompt — live pryro.com data takes priority over knowledge base
   */
  private buildSystemPrompt(knowledgeBase: KnowledgeEntry[], liveContent: string): string {
    const knowledgeContext = knowledgeBase
      .map((entry) => `Topic: ${entry.category}\nInfo: ${entry.response}`)
      .join('\n\n');

    const liveSection = liveContent
      ? `\nCURRENT PRYRO INFORMATION (use this to answer — do not mention this section or its source):\n${liveContent}\n`
      : '';

    return `You are the official AI assistant for Pryro — an ERP platform company based in Kigali, Rwanda.
${liveSection}
KNOWLEDGE BASE (backup if live data doesn't cover the question):
${knowledgeContext}

YOUR ROLE:
Answer ONLY questions about Pryro. You are not a general assistant.

PRYRO VERIFIED FACTS (always use these — never say you don't have this info):
- Phone: +250 788 715 075
- Sales email: sales@pryro.com
- Support email: support@pryro.com
- Office address: 1 KN 78 Nyarugenge Street, Kigali, Rwanda
- Hours: 24/7 am - 0:00pm EST
- Website: https://pryro.com
- Founded: 2020
- Customers: 64,000+ businesses across 5 continents
- Pricing: Free plan ($0), Pro plan ($29/mo), Enterprise (flexible)

RULES:
1. Greetings / thanks / pleasantries → respond warmly, then offer to help with Pryro
2. Pryro questions → use LIVE DATA first, then knowledge base. Never make up information.
3. Contact / phone questions → always give real info from live data
4. Non-Pryro questions → politely decline: "I'm Pryro's AI assistant and can only answer questions about Pryro. Visit https://pryro.com or email support@pryro.com"

STYLE: Professional, warm, concise (under 200 words). Always use real data from pryro.com.
IMPORTANT: Never mention "live data", "pryro.com data", "according to", "based on", or any reference to where you got the information. Just answer naturally as Pryro's assistant.`;
  }

  /**
   * Build conversation messages for API request
   */
  private buildMessages(
    userMessage: string,
    context: ConversationContext,
    knowledgeBase: KnowledgeEntry[],
    liveContent: string
  ): GroqMessage[] {
    const messages: GroqMessage[] = [];

    messages.push({
      role: 'system',
      content: this.buildSystemPrompt(knowledgeBase, liveContent),
    });

    // Last 10 messages of conversation history
    const recentMessages = context.previousMessages.slice(-10);
    for (const msg of recentMessages) {
      messages.push({
        role: msg.isUserMessage ? 'user' : 'assistant',
        content: msg.content,
      });
    }

    messages.push({ role: 'user', content: userMessage });

    return messages;
  }

  /**
   * Generate AI response — fetches live pryro.com data before answering
   */
  async generateResponse(
    userMessage: string,
    context: ConversationContext,
    knowledgeBase: KnowledgeEntry[]
  ): Promise<string> {
    const startTime = Date.now();

    try {
      // Fetch live content from the most relevant pryro.com page
      const liveContent = await fetchRelevantPryroPage(userMessage);

      logger.info('Live pryro.com content fetched', {
        sessionId: context.sessionId,
        hasLiveContent: !!liveContent,
      });

      const messages = this.buildMessages(userMessage, context, knowledgeBase, liveContent);

      logger.info('Calling Groq API', {
        sessionId: context.sessionId,
        messageCount: messages.length,
      });

      const completion = await this.client.chat.completions.create({
        model: this.config.model,
        messages,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
      });

      const response = completion.choices[0]?.message?.content || '';
      const duration = Date.now() - startTime;

      logger.info('Groq API response received', {
        sessionId: context.sessionId,
        duration: `${duration}ms`,
        tokensUsed: completion.usage?.total_tokens,
      });

      return response;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error('Groq API error', {
        error: error.message,
        sessionId: context.sessionId,
        duration: `${duration}ms`,
      });
      throw new Error(`AI API error: ${error.message}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10,
      });
      return !!completion.choices[0]?.message?.content;
    } catch (error) {
      logger.error('Groq API connection test failed', { error });
      return false;
    }
  }

  async getStatus(): Promise<{ available: boolean; responseTime: number }> {
    const startTime = Date.now();
    try {
      await this.testConnection();
      return { available: true, responseTime: Date.now() - startTime };
    } catch {
      return { available: false, responseTime: Date.now() - startTime };
    }
  }
}

export const groqAPIService = new GroqAPIService();
