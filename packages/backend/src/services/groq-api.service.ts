import Groq from 'groq-sdk';
import { GroqConfig, GroqMessage, ConversationContext, KnowledgeEntry } from '../models/types';
import { logger } from '../utils/logger';

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
      timeout: 30000, // 30 seconds
    };
  }

  /**
   * Build system prompt with knowledge base context
   */
  private buildSystemPrompt(knowledgeBase: KnowledgeEntry[]): string {
    const knowledgeContext = knowledgeBase
      .map((entry) => `Topic: ${entry.category}\nInfo: ${entry.response}`)
      .join('\n\n');

    return `You are the official AI assistant for Pryro - an ERP (Enterprise Resource Planning) platform company.

COMPANY KNOWLEDGE BASE:
${knowledgeContext}

ABOUT PRYRO:
Pryro is a complete ERP solution with AI-powered insights founded in 2020. We serve 64,000+ businesses across 5 continents, helping them manage finance, inventory, HR, CRM, and operations in one unified platform.

YOUR ROLE:
You ONLY answer questions about Pryro company, products, services, features, team, pricing, and how to contact us. You are NOT a general assistant.

WHAT YOU CAN ANSWER (Be Comprehensive):
✅ Greetings, thanks, and social pleasantries — respond warmly and naturally
✅ Pryro company history, founding, and team
✅ All Pryro products: ERP, Financial Management, Inventory, HR & Payroll, Project Management, CRM
✅ Pryro features, technology, and AI capabilities
✅ Pryro pricing plans and how to get started
✅ How to contact Pryro for different services (support, sales, technical help)
✅ Customer success stories and testimonials
✅ Security, compliance, and data protection
✅ Integration capabilities and supported platforms
✅ Who to approach for specific services or questions

CONTACT INFORMATION TO SHARE:
- General Support & Questions: support@pryro.com
- Website: https://pryro.com
- Sign up/Free Trial: Visit pryro.com
- Sales & Enterprise Plans: Contact via pryro.com or support@pryro.com
- Technical Issues: support@pryro.com
- CRM Questions: Part of main support team
- Onboarding & Training: Provided after signup

WHAT YOU CANNOT ANSWER:
❌ General business advice not related to Pryro
❌ Questions about competitors or other ERP systems
❌ Technical help for non-Pryro products
❌ General knowledge questions (weather, news, etc.)
❌ Any topic not directly related to Pryro company

RESPONSE RULES:
1. If the message is a greeting (hi, hello, bonjour, hey, good morning, etc.) → Respond warmly: greet back and offer to help with Pryro questions
2. If the message is appreciation or thanks (thanks, thank you, great, awesome, oooh thanks, etc.) → Acknowledge warmly and invite further questions
3. If the question is about Pryro (company, products, team, contact, pricing, features) → Answer comprehensively using the knowledge base
4. If asked "who to contact" or "how to reach" → Provide specific contact information (support@pryro.com, pryro.com)
5. If asked about team/founders → Share what we know and direct to support@pryro.com for more details
6. If the question is NOT about Pryro and is not a greeting/pleasantry → Politely decline with:
   "I'm Pryro's AI assistant and I can only answer questions about Pryro's ERP platform, features, pricing, and services. For questions about Pryro, please ask away! For other topics, please contact our support team at support@pryro.com"

RESPONSE STYLE:
- Professional, helpful, and comprehensive
- Concise but complete (under 200 words)
- Always provide contact information when relevant
- Mention specific features, pricing, or team details when applicable
- Direct users to support@pryro.com or pryro.com for complex issues
- Never make up information - only use the knowledge base
- When asked about team/contact, be helpful and provide available information

REMEMBER: You represent Pryro company. Be helpful with ALL Pryro-related questions including team, contact, and service-specific inquiries.`;
  }

  /**
   * Build conversation messages for API request
   */
  private buildMessages(
    userMessage: string,
    context: ConversationContext,
    knowledgeBase: KnowledgeEntry[]
  ): GroqMessage[] {
    const messages: GroqMessage[] = [];

    // Add system prompt
    messages.push({
      role: 'system',
      content: this.buildSystemPrompt(knowledgeBase),
    });

    // Add conversation history (last 10 messages)
    const recentMessages = context.previousMessages.slice(-10);
    for (const msg of recentMessages) {
      messages.push({
        role: msg.isUserMessage ? 'user' : 'assistant',
        content: msg.content,
      });
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: userMessage,
    });

    return messages;
  }

  /**
   * Generate AI response using Groq API
   */
  async generateResponse(
    userMessage: string,
    context: ConversationContext,
    knowledgeBase: KnowledgeEntry[]
  ): Promise<string> {
    const startTime = Date.now();

    try {
      const messages = this.buildMessages(userMessage, context, knowledgeBase);

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

  /**
   * Test API connection
   */
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

  /**
   * Get API status
   */
  async getStatus(): Promise<{
    available: boolean;
    responseTime: number;
  }> {
    const startTime = Date.now();

    try {
      await this.testConnection();
      const responseTime = Date.now() - startTime;

      return {
        available: true,
        responseTime,
      };
    } catch (error) {
      return {
        available: false,
        responseTime: Date.now() - startTime,
      };
    }
  }
}

export const groqAPIService = new GroqAPIService();
