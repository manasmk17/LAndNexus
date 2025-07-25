import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase, useRealDatabase } from "./db";
import csurf from "csurf";
import cookieParser from "cookie-parser";
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import { getStorage, setStorage } from "./storage";
dotenv.config()

const app = express();

// Configure CORS for proper session cookie handling
app.use(cors({
  origin: function (origin, callback) {
    // Allow same-origin requests and development
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-CSRF-Token'],
  exposedHeaders: ['Set-Cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Apply Helmet middleware for secure HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.stripe.com", "https://js.stripe.com", "wss:", "ws:"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// Rate limiting would be added here in production

app.use(express.json({ limit: '2mb' })); // Limit JSON body size
app.use(express.urlencoded({ extended: false, limit: '2mb' })); // Limit URL-encoded body size
app.use(cookieParser());

// Configure CSRF protection with proper initialization
const csrfProtection = csurf({
  cookie: {
    httpOnly: false, // Allow client-side access to CSRF token
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    key: '_csrf'
  },
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
  value: function (req) {
    return (req.body && req.body._csrf) ||
      (req.query && req.query._csrf) ||
      (req.headers['x-csrf-token']) ||
      (req.headers['x-xsrf-token']) ||
      (req.headers['csrf-token']);
  }
});

// Apply CSRF protection to all routes except specific API endpoints that need to be exempt
app.use((req, res, next) => {
  // These endpoints are specifically exempt from CSRF protection
  const csrfExemptRoutes = [
    '/api/login',
    '/api/register',
    '/api/logout',
    '/api/me',
    '/api/csrf-token',
    '/api/job-postings',
    '/api/job-postings/latest',
    '/api/companies/me/job-postings',
    '/api/companies/me/jobs',
    '/api/companies/me/consultations',
    '/api/job-applications/company',
    '/api/professional-profiles/featured',
    '/api/professionals/me',
    '/api/professionals/me/expertise',
    '/api/professionals/me/certifications',
    '/api/professionals/me/applications',
    '/api/professionals/me/matches',
    '/api/professionals/me/consultations',
    '/api/company-profiles',
    '/api/company-profiles/by-user',
    '/api/resources/featured',
    '/api/subscription-status',
    '/api/subscription-plans',
    '/api/messages',
    '/api/create-test-admin',
    '/api/create-admin',
    //'/api/admin/make-admin',
    //'/api/admin/company-profiles',
    //'/api/admin/professional-profiles',
    //'/api/admin/job-postings',
    //'/api/admin/resources',
    '/api/reviews',
    '/api/notifications',
    '/api/notifications/unread',
    '/api/notifications/read-all',
    '/api/notification-preferences',
    '/api/create-payment-intent',
    '/api/create-subscription',
    '/api/setup-subscription',
    '/api/update-subscription',
    '/api/cancel-subscription',
    '/api/create-setup-intent',
    '/api/webhook',
    '/api/newsletter/subscribe',
    '/api/job-postings'
  ];

  // Special handling for GET requests to /api/me/ routes
  if (req.method === 'GET' && req.path.startsWith('/api/me/')) {
    console.log(`CSRF protection bypassed for ${req.method} ${req.path}`);
    return next();
  }

  // Special exempt routes handling for specific HTTP methods
  const methodSpecificExemptions = [
    { path: '/api/professionals/me', method: 'PUT' },
    { path: '/api/professionals/me/expertise', method: 'POST' },
    { path: '/api/professionals/me/certifications', method: 'POST' },
    { path: '/api/company-profiles', method: 'POST' },
    { path: '/api/company-profiles/:id', method: 'PUT' }
  ];

  // Function to check if a path matches a route pattern
  const matchesPattern = (path: string, pattern: string): boolean => {
    // Exact match
    if (path === pattern) return true;

    // Check for pattern with ID params like '/api/company-profiles/:id'
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    if (patternParts.length !== pathParts.length) return false;

    for (let i = 0; i < patternParts.length; i++) {
      // Skip parameter parts (starting with ':')
      if (patternParts[i].startsWith(':')) continue;
      if (patternParts[i] !== pathParts[i]) return false;
    }

    return true;
  };

  // Add ID-based patterns for exempt routes
  const idBasedPatterns = [
    '/api/company-profiles/:id',
    '/api/professionals/:id',
    '/api/job-postings/:id',
    '/api/resources/:id',
    //'/api/admin/company-profiles/:id/verify',
    //'/api/admin/company-profiles/:id/featured',
    //'/api/admin/professional-profiles/:id/featured',
    //'/api/admin/job-postings/:id/featured',
    //'/api/admin/job-postings/:id/status',
    //'/api/admin/resources/:id/featured',
    //'/api/admin/resources/:id',
    '/api/reviews/:id',
    '/api/professionals/:id/reviews',
    '/api/companies/:id/reviews',
    '/api/consultations/:id/review',
    '/api/notifications/:id',
    '/api/notifications/:id/read'
  ];

  // Check if the current request path is in the exempt list, matches an ID-based pattern,
  // or matches a specific method+path combination
  if (
    csrfExemptRoutes.some(path => req.path === path) ||
    idBasedPatterns.some(pattern => matchesPattern(req.path, pattern)) ||
    methodSpecificExemptions.some(item => req.path === item.path && req.method === item.method)
  ) {
    console.log(`CSRF protection bypassed for ${req.method} ${req.path}`);
    next();
    return;
  }

  // For all other requests, apply CSRF protection
  csrfProtection(req, res, next);
});

// Add CSRF token to response for client-side use
app.use((req: any, res: any, next) => {
  if (req.csrfToken) {
    res.cookie('XSRF-TOKEN', req.csrfToken(), {
      httpOnly: false, // Client-side JavaScript needs to access it
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
  }
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Initialize database connection with retry capability
    await initializeDatabase(); // useRealDatabase burada true olacaq
    setStorage(useRealDatabase); // buradan sonra storageInstance düzgün olur
    const storage = getStorage(); // hazır storage obyekti

    app.locals.storage = storage;

    console.log("initialized", useRealDatabase);
    // Monitoring systems removed for performance optimization

    // Add static file serving for uploaded files - must come before routes
    app.use('/uploads', express.static('uploads', {
      maxAge: '1d', // Cache static files for 1 day
      etag: true
    }));

    const server = await registerRoutes(app);

    app.use(async (err: any, req: Request, res: Response, _next: NextFunction) => {
      // Special handling for CSRF errors
      if (err.code === 'EBADCSRFTOKEN') {
        console.error('CSRF error details:', {
          path: req.path,
          method: req.method,
          headers: req.headers,
          cookies: req.cookies,
          body: req.body
        });
        return res.status(403).json({
          message: "CSRF token validation failed",
          details: "The form submission security token is invalid or expired. Please refresh the page and try again."
        });
      }

      // Check for database connection errors and try to reconnect
      if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' ||
        err.message?.includes('database') || err.message?.includes('pool') ||
        err.message?.includes('connection')) {
        console.error('Database connection error detected, attempting to reconnect:', err);

        try {
          // Try to re-initialize the database connection
          await initializeDatabase();
          // If the request was a database query, we can't retry it automatically
          // Just let the client know to retry
          return res.status(503).json({
            message: "Database connection reestablished. Please retry your request.",
            retry: true
          });
        } catch (reconnectErr) {
          console.error('Failed to reconnect to database:', reconnectErr);
        }
      }

      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      console.error('Server error:', err);
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Serve the app on port 5000 as expected by workflow
    // this serves both the API and the client.
    const port = 5000;

    // Add error handling for port binding
    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use. Server will exit and retry...`);
        process.exit(1);
      } else {
        console.error('Server error:', err);
        process.exit(1);
      }
    });

    server.listen({
      port,
      host: "0.0.0.0",
      keepAliveTimeout: 65000,
      headersTimeout: 66000,
    }, () => {
      log(`serving on port ${port}`);
    });

  } catch (startupError) {
    console.error('Critical startup error:', startupError);

    // Attempt graceful degradation - monitoring disabled

    // Exit with error code
    process.exit(1);
  }
})();
