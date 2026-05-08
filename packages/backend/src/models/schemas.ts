// Zod validation schemas for request/response validation

import { z } from 'zod';

// User schemas
export const CreateUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['USER', 'ADMIN']).optional(),
});

export const UpdateUserSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  isActive: z.boolean().optional(),
});

export const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// Session schemas
export const CreateSessionSchema = z.object({
  userId: z.string().uuid(),
});

// Message schemas
export const SendMessageSchema = z.object({
  sessionId: z.string().uuid(),
  content: z.string().min(1).max(2000).trim(),
});

// Knowledge entry schemas
export const CreateKnowledgeEntrySchema = z.object({
  category: z.string().min(1).max(255),
  keywords: z.array(z.string().min(1)).min(1),
  response: z.string().min(1),
  priority: z.number().int().min(1).max(10).optional().default(1),
});

export const UpdateKnowledgeEntrySchema = z.object({
  category: z.string().min(1).max(255).optional(),
  keywords: z.array(z.string().min(1)).min(1).optional(),
  response: z.string().min(1).optional(),
  priority: z.number().int().min(1).max(10).optional(),
  isActive: z.boolean().optional(),
});

export const TestKeywordPatternSchema = z.object({
  message: z.string().min(1).max(2000),
  entryId: z.string().uuid().optional(),
});

// Pagination schemas
export const PaginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

// History filter schemas
export const HistoryFiltersSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  userId: z.string().uuid().optional(),
  keyword: z.string().optional(),
});

// Audit log filter schemas
export const AuditLogFiltersSchema = z.object({
  adminId: z.string().uuid().optional(),
  actionType: z.string().optional(),
  resourceType: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

// Environment variable schema
export const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().length(64), // 32 bytes in hex
  GROQ_API_KEY: z.string().min(1),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  ALLOWED_ORIGINS: z.string(),
  PORT: z.coerce.number().int().min(1).max(65535).optional().default(3000),
  USER_SESSION_TIMEOUT: z.coerce.number().int().optional().default(86400000), // 24 hours
  ADMIN_SESSION_TIMEOUT: z.coerce.number().int().optional().default(1800000), // 30 minutes
});

// Type exports
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;
export type SendMessageInput = z.infer<typeof SendMessageSchema>;
export type CreateKnowledgeEntryInput = z.infer<typeof CreateKnowledgeEntrySchema>;
export type UpdateKnowledgeEntryInput = z.infer<typeof UpdateKnowledgeEntrySchema>;
export type TestKeywordPatternInput = z.infer<typeof TestKeywordPatternSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
export type HistoryFiltersInput = z.infer<typeof HistoryFiltersSchema>;
export type AuditLogFiltersInput = z.infer<typeof AuditLogFiltersSchema>;
export type EnvInput = z.infer<typeof EnvSchema>;
