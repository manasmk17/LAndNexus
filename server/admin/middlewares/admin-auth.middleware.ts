import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AdminUser, AdminRole, AdminPermission, RolePermissions } from '../types/admin.types';
import { storage } from '../../storage';

// Configure JWT settings
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'admin-secret-key-change-in-production';
const JWT_EXPIRES_IN = '1h'; // Short expiration for security

// Extended Request interface to include admin user
declare global {
  namespace Express {
    interface Request {
      adminUser?: AdminUser;
    }
  }
}

/**
 * Middleware to verify admin JWT token
 */
export const verifyAdminToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify the token
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
      
      // Get admin user from storage
      const adminUser = await storage.getAdminUserById(decoded.id);
      
      if (!adminUser) {
        return res.status(401).json({ message: 'Invalid admin token' });
      }
      
      if (!adminUser.isActive) {
        return res.status(403).json({ message: 'Admin account is inactive' });
      }
      
      // Attach admin user to request object
      req.adminUser = adminUser;
      next();
    } catch (error) {
      if ((error as Error).name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      } else {
        return res.status(401).json({ message: 'Invalid token' });
      }
    }
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({ message: 'Internal server error during authentication' });
  }
};

/**
 * Middleware to check if admin has required role
 */
export const requireRole = (role: AdminRole) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.adminUser) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const adminRole = req.adminUser.role;
      
      // Check role hierarchy
      // e.g., SUPER_ADMIN can access everything, ADMIN can access MODERATOR and ANALYST routes
      const roleHierarchy = {
        [AdminRole.SUPER_ADMIN]: [AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.MODERATOR, AdminRole.ANALYST],
        [AdminRole.ADMIN]: [AdminRole.ADMIN, AdminRole.MODERATOR, AdminRole.ANALYST],
        [AdminRole.MODERATOR]: [AdminRole.MODERATOR, AdminRole.ANALYST],
        [AdminRole.ANALYST]: [AdminRole.ANALYST]
      };
      
      if (roleHierarchy[adminRole].includes(role)) {
        return next();
      }
      
      return res.status(403).json({ message: 'Insufficient role privileges' });
    } catch (error) {
      console.error('Role check middleware error:', error);
      res.status(500).json({ message: 'Internal server error during role verification' });
    }
  };
};

/**
 * Middleware to check if admin has required permission
 */
export const requirePermission = (permission: AdminPermission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.adminUser) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const adminRole = req.adminUser.role;
      const customPermissions = req.adminUser.customPermissions || [];
      
      // Check if user has the permission through their role or custom permissions
      const hasPermissionViaRole = RolePermissions[adminRole].includes(permission);
      const hasCustomPermission = customPermissions.includes(permission);
      
      if (hasPermissionViaRole || hasCustomPermission) {
        return next();
      }
      
      return res.status(403).json({ message: 'Insufficient permissions' });
    } catch (error) {
      console.error('Permission check middleware error:', error);
      res.status(500).json({ message: 'Internal server error during permission verification' });
    }
  };
};

/**
 * Middleware to log admin actions
 */
export const logAdminAction = (action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Original response methods
    const originalSend = res.send;
    const originalJson = res.json;
    const originalStatus = res.status;
    
    let statusCode = 200;
    
    // Override res.status
    res.status = function(code) {
      statusCode = code;
      return originalStatus.apply(this, [code]);
    };
    
    // Function to log the action
    const logAction = async () => {
      try {
        if (!req.adminUser) return;
        
        const entityType = req.path.split('/')[1]; // e.g., 'users', 'jobs'
        const entityId = req.params.id ? parseInt(req.params.id) : null;
        
        // Create log entry
        await storage.createAdminActionLog({
          adminId: req.adminUser.id,
          adminUsername: req.adminUser.username,
          action,
          entityType,
          entityId,
          details: JSON.stringify({
            method: req.method,
            path: req.path,
            query: req.query,
            body: req.body,
            statusCode
          }),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || 'unknown',
          timestamp: new Date()
        });
      } catch (err) {
        console.error('Error logging admin action:', err);
      }
    };
    
    // Override res.send
    res.send = function(body) {
      logAction();
      return originalSend.apply(this, [body]);
    };
    
    // Override res.json
    res.json = function(body) {
      logAction();
      return originalJson.apply(this, [body]);
    };
    
    next();
  };
};

/**
 * Utility function to generate JWT token for admin
 */
export const generateAdminToken = (adminUser: AdminUser): string => {
  return jwt.sign({ id: adminUser.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Utility function to generate refresh token for admin
 */
export const generateAdminRefreshToken = (adminUser: AdminUser): string => {
  return jwt.sign({ id: adminUser.id, type: 'refresh' }, JWT_SECRET, { expiresIn: '7d' });
};

/**
 * Rate limiting middleware for admin authentication
 */
export const adminAuthRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  // This would normally use Redis or a similar store to track rate limits
  // For simplicity, we'll use a basic implementation - note that this is memory-based
  // and will be reset when the server restarts.
  
  // Create a static Map to persist between requests
  const rateLimitMap: Map<string, { count: number, resetTime: number }> = 
    (global as any).adminRateLimitMap || ((global as any).adminRateLimitMap = new Map());
  
  const ip = req.ip;
  const now = Date.now();
  const limit = 5; // 5 attempts
  const windowMs = 15 * 60 * 1000; // 15 minutes
  
  // Get existing entry or create new one
  let entry = rateLimitMap.get(ip);
  if (!entry) {
    entry = { count: 0, resetTime: now + windowMs };
  }
  
  // Reset if window has expired
  if (entry.resetTime < now) {
    entry.count = 0;
    entry.resetTime = now + windowMs;
  }
  
  // Increment count
  entry.count += 1;
  rateLimitMap.set(ip, entry);
  
  // Check if over limit
  if (entry.count > limit) {
    const resetTime = new Date(entry.resetTime);
    return res.status(429).json({
      message: 'Too many login attempts, please try again later',
      resetTime: resetTime.toISOString()
    });
  }
  
  next();
};