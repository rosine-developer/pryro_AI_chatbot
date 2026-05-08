import { ValidationError } from '../models/types';

/**
 * Validate message content
 */
export function validateMessage(content: string): { isValid: boolean; error?: string } {
  // Check if empty
  if (!content || content.trim().length === 0) {
    return {
      isValid: false,
      error: 'Message cannot be empty',
    };
  }

  // Check length
  if (content.length > 2000) {
    return {
      isValid: false,
      error: 'Message exceeds maximum length of 2000 characters',
    };
  }

  return { isValid: true };
}

/**
 * Validate message or throw error
 */
export function validateMessageOrThrow(content: string): void {
  const result = validateMessage(content);
  if (!result.isValid) {
    throw new ValidationError(result.error!, 'INVALID_MESSAGE', 'content');
  }
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize string for safe display
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim();
}

/**
 * Validate and sanitize username
 */
export function validateUsername(username: string): { isValid: boolean; error?: string } {
  if (!username || username.trim().length === 0) {
    return { isValid: false, error: 'Username cannot be empty' };
  }

  if (username.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters' };
  }

  if (username.length > 50) {
    return { isValid: false, error: 'Username cannot exceed 50 characters' };
  }

  // Only allow alphanumeric, underscore, and hyphen
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return {
      isValid: false,
      error: 'Username can only contain letters, numbers, underscores, and hyphens',
    };
  }

  return { isValid: true };
}
