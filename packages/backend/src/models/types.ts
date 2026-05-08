// TypeScript interfaces and types for the AI Chatbot System

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: 'USER' | 'ADMIN';
  isActive: boolean;
  createdAt: Date;
  lastActivityAt: Date | null;
}

export interface Session {
  id: string;
  userId: string;
  startedAt: Date;
  lastMessageAt: Date;
  isActive: boolean;
  contextSummary: string | null;
}

export interface Message {
  id: string;
  sessionId: string;
  userId: string;
  content: string;
  isUserMessage: boolean;
  aiSource: 'KEYWORD' | 'AI_API' | 'FALLBACK' | null;
  confidenceScore: number | null;
  processingTimeMs: number | null;
  createdAt: Date;
}

export interface KnowledgeEntry {
  id: string;
  category: string;
  keywords: string[];
  response: string;
  priority: number;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface AuditLog {
  id: string;
  adminId: string;
  actionType: string;
  resourceType: string;
  resourceId: string | null;
  details: Record<string, any> | null;
  ipAddress: string | null;
  createdAt: Date;
}

export interface SystemMetric {
  id: string;
  metricType: string;
  metricValue: number;
  metadata: Record<string, any> | null;
  recordedAt: Date;
}

export interface UnansweredQuestion {
  id: string;
  userId: string;
  sessionId: string;
  question: string;
  attemptedSource: string;
  createdAt: Date;
  resolved: boolean;
}

// DTOs (Data Transfer Objects)

export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  role?: 'USER' | 'ADMIN';
}

export interface UpdateUserDto {
  username?: string;
  email?: string;
  password?: string;
  isActive?: boolean;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface LoginResponseDto {
  token: string;
  expiresIn: number;
  user: {
    id: string;
    username: string;
    role: string;
  };
}

export interface CreateSessionDto {
  userId: string;
}

export interface SessionResponseDto {
  sessionId: string;
  startedAt: string;
}

export interface SendMessageDto {
  sessionId: string;
  userId: string;
  content: string;
}

export interface MessageResponseDto {
  userMessage: {
    id: string;
    content: string;
    createdAt: string;
  };
  botResponse: {
    id: string;
    content: string;
    source: 'KEYWORD' | 'AI_API' | 'FALLBACK';
    confidence: number;
    processingTime: number;
    createdAt: string;
  };
}

export interface GetMessagesResponseDto {
  messages: Message[];
  total: number;
  hasMore: boolean;
}

export interface CreateKnowledgeEntryDto {
  category: string;
  keywords: string[];
  response: string;
  priority?: number;
}

export interface UpdateKnowledgeEntryDto {
  category?: string;
  keywords?: string[];
  response?: string;
  priority?: number;
  isActive?: boolean;
}

export interface HealthCheckResponseDto {
  status: 'healthy' | 'degraded' | 'unhealthy';
  components: {
    database: {
      status: 'up' | 'down';
      responseTime: number;
    };
    redis: {
      status: 'up' | 'down';
      responseTime: number;
    };
    aiApi: {
      status: 'up' | 'down';
      responseTime: number;
    };
  };
  metrics: {
    activeUsers: number;
    avgResponseTime: number;
    errorRate: number;
  };
  timestamp: string;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface HistoryFilters {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  keyword?: string;
}

// AI Response Engine types

export interface AIConfig {
  mode: 'keyword' | 'ai-api' | 'hybrid';
  keywordMatcherEnabled: boolean;
  aiApiEnabled: boolean;
  fallbackToKeyword: boolean;
  maxContextMessages: number;
  maxContextLength: number;
}

export interface ConversationContext {
  sessionId: string;
  previousMessages: Message[];
  userId: string;
}

export interface AIResponse {
  content: string;
  confidence: number;
  source: 'KEYWORD' | 'AI_API' | 'FALLBACK';
  processingTime: number;
  matchedKnowledge?: KnowledgeEntry[];
}

export interface MatchResult {
  entry: KnowledgeEntry;
  matchedKeywords: string[];
  matchScore: number;
}

// Groq API types

export interface GroqConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
}

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqPrompt {
  model: string;
  messages: GroqMessage[];
  max_tokens?: number;
  temperature?: number;
}

// Error types

export class ValidationError extends Error {
  constructor(
    message: string,
    public code: string,
    public field?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class DatabaseError extends Error {
  constructor(
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class AIProcessingError extends Error {
  constructor(
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'AIProcessingError';
  }
}

export class ServiceUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServiceUnavailableError';
  }
}

export class AccountLockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AccountLockedError';
  }
}
