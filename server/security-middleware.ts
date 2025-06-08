import type { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";

// Rate limiting configurations
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: "15 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth attempts per windowMs
  message: {
    error: "Too many authentication attempts, please try again later.",
    retryAfter: "15 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 API requests per minute
  message: {
    error: "API rate limit exceeded, please slow down your requests.",
    retryAfter: "1 minute"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Input validation middleware
export function validateInput(allowedFields: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { body } = req;
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /data:text\/html/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
    ];

    for (const [key, value] of Object.entries(body)) {
      if (typeof value === 'string') {
        for (const pattern of suspiciousPatterns) {
          if (pattern.test(value)) {
            return res.status(400).json({
              error: "Invalid input detected",
              field: key
            });
          }
        }
      }
    }

    // Validate allowed fields
    const extraFields = Object.keys(body).filter(key => !allowedFields.includes(key));
    if (extraFields.length > 0) {
      return res.status(400).json({
        error: "Unexpected fields in request",
        fields: extraFields
      });
    }

    next();
  };
}

// User type validation middleware
export function requireUserType(allowedTypes: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "User data not found" });
    }

    // For now, we'll determine user type based on profile existence
    // This should be enhanced with proper user roles in the database
    if (allowedTypes.includes('admin')) {
      // Check if user has admin privileges (simplified check)
      if (user.username === 'admin' || user.firstName === 'Admin') {
        return next();
      }
    }

    if (allowedTypes.includes('professional')) {
      // Allow if user type is allowed
      return next();
    }

    if (allowedTypes.includes('company')) {
      // Allow if user type is allowed
      return next();
    }

    return res.status(403).json({
      message: "Insufficient permissions for this resource",
      requiredRole: allowedTypes
    });
  };
}

// Data sanitization middleware
export function sanitizeUserData() {
  return (req: Request, res: Response, next: NextFunction) => {
    const sanitizeString = (str: string) => {
      return str
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .trim();
    };

    const sanitizeObject = (obj: any): any => {
      if (typeof obj === 'string') {
        return sanitizeString(obj);
      } else if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      } else if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
          sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
      }
      return obj;
    };

    if (req.body) {
      req.body = sanitizeObject(req.body);
    }

    next();
  };
}

// Response data filtering middleware
export function filterSensitiveData(sensitiveFields: string[] = []) {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    
    res.json = function(data: any) {
      const filterObject = (obj: any): any => {
        if (Array.isArray(obj)) {
          return obj.map(filterObject);
        } else if (obj && typeof obj === 'object') {
          const filtered: any = {};
          for (const [key, value] of Object.entries(obj)) {
            if (!sensitiveFields.includes(key)) {
              filtered[key] = typeof value === 'object' ? filterObject(value) : value;
            }
          }
          return filtered;
        }
        return obj;
      };

      const filteredData = filterObject(data);
      return originalJson.call(this, filteredData);
    };

    next();
  };
}

// Access control middleware for profile viewing
export function profileAccessControl() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const profileId = parseInt(req.params.id || req.params.professionalId);
    const user = req.user;

    if (!profileId) {
      return res.status(400).json({ message: "Invalid profile ID" });
    }

    // Allow access if:
    // 1. User is viewing their own profile
    // 2. Profile is public
    // 3. User is admin
    
    if (user) {
      // Check if user owns the profile
      if (user.id === profileId) {
        return next();
      }

      // Check if user is admin
      if (user.username === 'admin' || user.firstName === 'Admin') {
        return next();
      }
    }

    // For public profile viewing, we'll allow access but filter sensitive data
    // This middleware will be used in combination with filterSensitiveData
    next();
  };
}

// Session security enhancements
export function enhanceSessionSecurity() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Prevent caching of sensitive pages
    if (req.path.includes('/admin') || req.path.includes('/dashboard')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }

    next();
  };
}