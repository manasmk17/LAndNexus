import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import csurf from "csurf";
import cookieParser from "cookie-parser";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Configure CSRF protection
const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
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
    '/api/job-postings/latest',
    '/api/professional-profiles/featured',
    '/api/professionals/me',
    '/api/professionals/me/expertise',
    '/api/professionals/me/certifications',
    '/api/company-profiles',
    '/api/company-profiles/by-user',
    '/api/resources/featured'
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
    '/api/resources/:id'
  ];
  
  // Check if the current request path is in the exempt list or matches an ID-based pattern
  if (
    csrfExemptRoutes.some(path => req.path === path) ||
    idBasedPatterns.some(pattern => matchesPattern(req.path, pattern))
  ) {
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
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
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

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
    keepAliveTimeout: 65000, // Increase keep-alive timeout
    headersTimeout: 66000, // Increase headers timeout
  }, () => {
    log(`serving on port ${port}`);
  });
})();
