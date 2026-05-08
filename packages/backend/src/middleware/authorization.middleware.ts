import { Request, Response, NextFunction } from 'express';
import { AuthorizationError } from '../models/types';

export enum Permission {
  // User permissions
  CHAT_SEND_MESSAGE = 'chat:send_message',
  CHAT_VIEW_HISTORY = 'chat:view_history',

  // Admin permissions
  ADMIN_VIEW_DASHBOARD = 'admin:view_dashboard',
  ADMIN_MANAGE_KNOWLEDGE = 'admin:manage_knowledge',
  ADMIN_MANAGE_USERS = 'admin:manage_users',
  ADMIN_VIEW_AUDIT_LOGS = 'admin:view_audit_logs',
  ADMIN_VIEW_CHAT_HISTORY = 'admin:view_chat_history',
}

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  USER: [Permission.CHAT_SEND_MESSAGE, Permission.CHAT_VIEW_HISTORY],
  ADMIN: [
    Permission.CHAT_SEND_MESSAGE,
    Permission.CHAT_VIEW_HISTORY,
    Permission.ADMIN_VIEW_DASHBOARD,
    Permission.ADMIN_MANAGE_KNOWLEDGE,
    Permission.ADMIN_MANAGE_USERS,
    Permission.ADMIN_VIEW_AUDIT_LOGS,
    Permission.ADMIN_VIEW_CHAT_HISTORY,
  ],
};

/**
 * Middleware to require specific permission
 */
export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const userPermissions = ROLE_PERMISSIONS[user.role] || [];

    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
    }

    next();
  };
}

/**
 * Middleware to require admin role
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  if (user.role !== 'ADMIN') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required',
    });
  }

  next();
}

/**
 * Middleware to check resource ownership
 * Allows access if user owns the resource OR is an admin
 */
export function requireOwnershipOrAdmin(resourceUserIdGetter: (req: Request) => string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // Admins can access any resource
    if (user.role === 'ADMIN') {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = resourceUserIdGetter(req);
    if (user.userId !== resourceUserId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Cannot access resources belonging to other users',
      });
    }

    next();
  };
}

/**
 * Check if user has permission (utility function)
 */
export function hasPermission(role: string, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Check if user is admin (utility function)
 */
export function isAdmin(role: string): boolean {
  return role === 'ADMIN';
}
