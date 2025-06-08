import { Request, Response, NextFunction } from 'express';
import { storage } from '../../storage';

/**
 * Middleware to log all admin activity for audit purposes
 */
export const adminActivityLogger = (req: Request, res: Response, next: NextFunction) => {
  // Skip logging for certain paths
  const excludePaths = [
    '/api/admin/auth/login',
    '/api/admin/auth/refresh-token',
    '/api/admin/auth/logout'
  ];
  
  if (excludePaths.includes(req.path)) {
    return next();
  }
  
  // Capture request details
  const requestDetails = {
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
    ip: req.ip,
    userAgent: req.headers['user-agent'] || 'unknown',
    timestamp: new Date(),
    adminId: req.adminUser?.id || null,
    adminUsername: req.adminUser?.username || null
  };
  
  // Log request start
  console.log(`[ADMIN ACTIVITY] ${requestDetails.method} ${requestDetails.path} by ${requestDetails.adminUsername || 'unauthenticated'}`);
  
  // Track response time
  const startTime = Date.now();
  
  // Capture and log response details
  const originalSend = res.send;
  const originalJson = res.json;
  const originalEnd = res.end;
  
  res.send = function(body) {
    logResponse(body);
    return originalSend.apply(this, [body]);
  };
  
  res.json = function(body) {
    logResponse(body);
    return originalJson.apply(this, [body]);
  };
  
  res.end = function(chunk, encoding?, callback?) {
    if (chunk) {
      logResponse(chunk);
    }
    // TypeScript doesn't like using arguments directly with apply
    // So we'll bypass the type check here
    return originalEnd.apply(this, arguments as unknown as [any, BufferEncoding, (() => void) | undefined]);
  };
  
  function logResponse(body: any) {
    const responseTime = Date.now() - startTime;
    
    const logEntry = {
      ...requestDetails,
      statusCode: res.statusCode,
      responseTime,
      responseBody: process.env.NODE_ENV === 'development' ? body : 'Response logging disabled in production'
    };
    
    // Log to console
    console.log(`[ADMIN ACTIVITY] Completed ${logEntry.method} ${logEntry.path} with status ${logEntry.statusCode} in ${responseTime}ms`);
    
    // For significant actions (modifying data), also log to database
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && req.adminUser) {
      try {
        storage.createAdminActivityLog({
          adminId: req.adminUser.id,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          executionTime: responseTime,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || 'unknown',
          timestamp: new Date()
        }).catch(err => {
          console.error('Error saving admin activity log to database:', err);
        });
      } catch (error) {
        console.error('Error creating admin activity log:', error);
      }
    }
  }
  
  next();
};