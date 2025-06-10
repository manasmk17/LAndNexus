/**
 * Performance Middleware Integration
 * Centralized performance optimization middleware for all API endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { responseCache } from './response-cache';
import { requestDeduplicator } from './request-deduplicator';

interface CachedRouteConfig {
  ttl: number; // Time to live in milliseconds
  cacheKey: (req: Request) => string;
  shouldCache: (req: Request, res: Response) => boolean;
}

// Configuration for cacheable routes
const cacheableRoutes: { [pattern: string]: CachedRouteConfig } = {
  '/api/professional-profiles/featured': {
    ttl: 5 * 60 * 1000, // 5 minutes
    cacheKey: (req) => `featured-profiles:${req.query.limit || 10}`,
    shouldCache: (req, res) => res.statusCode === 200
  },
  '/api/job-postings/latest': {
    ttl: 3 * 60 * 1000, // 3 minutes
    cacheKey: (req) => `latest-jobs:${req.query.limit || 10}:${req.query.category || 'all'}`,
    shouldCache: (req, res) => res.statusCode === 200
  },
  '/api/resources/featured': {
    ttl: 10 * 60 * 1000, // 10 minutes
    cacheKey: (req) => `featured-resources:${req.query.limit || 10}`,
    shouldCache: (req, res) => res.statusCode === 200
  },
  '/api/subscription-plans': {
    ttl: 30 * 60 * 1000, // 30 minutes
    cacheKey: () => 'subscription-plans',
    shouldCache: (req, res) => res.statusCode === 200
  },
  '/api/professional-profiles/:id/expertise': {
    ttl: 15 * 60 * 1000, // 15 minutes
    cacheKey: (req) => `profile-expertise:${req.params.id}`,
    shouldCache: (req, res) => res.statusCode === 200
  },
  '/api/professional-profiles/:id/certifications': {
    ttl: 15 * 60 * 1000, // 15 minutes
    cacheKey: (req) => `profile-certifications:${req.params.id}`,
    shouldCache: (req, res) => res.statusCode === 200
  }
};

/**
 * Middleware to handle response caching for GET requests
 */
export function cacheMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Find matching route configuration
    const routeConfig = findRouteConfig(req.path);
    if (!routeConfig) {
      return next();
    }

    const cacheKey = routeConfig.cacheKey(req);
    
    // Check if response is cached
    const cached = responseCache.get('api', { key: cacheKey });
    if (cached) {
      res.set('ETag', cached.etag);
      res.set('X-Cache', 'HIT');
      return res.json(cached.data);
    }

    // Store original json method
    const originalJson = res.json;
    
    // Override json method to cache response
    res.json = function(data: any) {
      if (routeConfig.shouldCache(req, res)) {
        const etag = responseCache.set('api', data, { 
          key: cacheKey,
          ttl: routeConfig.ttl 
        });
        res.set('ETag', etag);
        res.set('X-Cache', 'MISS');
      }
      
      return originalJson.call(this, data);
    };

    next();
  };
}

/**
 * Middleware to deduplicate identical requests
 */
export function deduplicationMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only deduplicate GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const dedupeKey = `${req.method}:${req.path}:${JSON.stringify(req.query)}`;
    
    // Check if request is already being processed
    const existingRequest = requestDeduplicator.deduplicate(dedupeKey, async () => {
      return new Promise((resolve) => {
        // Store original methods
        const originalJson = res.json;
        const originalSend = res.send;
        
        // Override response methods to capture data
        let responseData: any = null;
        let isResolved = false;
        
        res.json = function(data: any) {
          if (!isResolved) {
            responseData = data;
            isResolved = true;
            resolve(data);
          }
          return originalJson.call(this, data);
        };
        
        res.send = function(data: any) {
          if (!isResolved) {
            responseData = data;
            isResolved = true;
            resolve(data);
          }
          return originalSend.call(this, data);
        };
        
        // Continue with next middleware
        next();
      });
    });

    // If this is a duplicate request, wait for the original
    if (existingRequest !== requestDeduplicator.deduplicate(dedupeKey, () => Promise.resolve({}))) {
      existingRequest.then((data) => {
        res.set('X-Deduplicated', 'true');
        res.json(data);
      }).catch((error) => {
        res.status(500).json({ error: 'Request failed' });
      });
      return;
    }

    next();
  };
}

/**
 * Performance monitoring middleware
 */
export function performanceMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    // Monitor response time
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      // Log slow requests
      if (duration > 1000) {
        console.warn(`🐌 Slow API call: ${req.method} ${req.path} took ${duration}ms`);
      }
      
      // Add performance headers
      res.set('X-Response-Time', `${duration}ms`);
    });

    next();
  };
}

/**
 * Find route configuration for a given path
 */
function findRouteConfig(path: string): CachedRouteConfig | null {
  // Check for exact match first
  if (cacheableRoutes[path]) {
    return cacheableRoutes[path];
  }
  
  // Check for pattern matches (e.g., :id parameters)
  for (const [pattern, config] of Object.entries(cacheableRoutes)) {
    if (matchesPattern(path, pattern)) {
      return config;
    }
  }
  
  return null;
}

/**
 * Check if a path matches a route pattern
 */
function matchesPattern(path: string, pattern: string): boolean {
  const pathParts = path.split('/');
  const patternParts = pattern.split('/');
  
  if (pathParts.length !== patternParts.length) {
    return false;
  }
  
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      // This is a parameter, skip validation
      continue;
    }
    if (patternParts[i] !== pathParts[i]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Invalidate cache for specific patterns
 */
export function invalidateCache(pattern: string): void {
  responseCache.invalidate(pattern);
}

/**
 * Get performance statistics
 */
export function getPerformanceStats() {
  return {
    cache: responseCache.getStats(),
    deduplication: requestDeduplicator.getStats()
  };
}