import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

interface AuthTokenPayload {
  userId: number;
  username: string;
  userType: string;
  sessionId: string;
  iat?: number;
  exp?: number;
}

export class AuthManager {
  private static instance: AuthManager;
  private readonly jwtSecret: string;
  private readonly refreshSecret: string;
  private activeSessions: Map<string, AuthTokenPayload> = new Map();

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'ldnexus-jwt-secret-production-key';
    this.refreshSecret = process.env.REFRESH_SECRET || 'ldnexus-refresh-secret-production-key';
  }

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  // Generate access token (15 minutes)
  generateAccessToken(user: any, sessionId: string): string {
    const payload: AuthTokenPayload = {
      userId: user.id,
      username: user.username,
      userType: user.userType,
      sessionId
    };

    return jwt.sign(payload, this.jwtSecret, { 
      expiresIn: '15m',
      issuer: 'ldnexus',
      audience: 'ldnexus-users'
    });
  }

  // Generate refresh token (7 days)
  generateRefreshToken(user: any, sessionId: string): string {
    const payload: AuthTokenPayload = {
      userId: user.id,
      username: user.username,
      userType: user.userType,
      sessionId
    };

    const refreshToken = jwt.sign(payload, this.refreshSecret, { 
      expiresIn: '7d',
      issuer: 'ldnexus',
      audience: 'ldnexus-users'
    });

    // Store active session
    this.activeSessions.set(sessionId, payload);
    
    return refreshToken;
  }

  // Verify access token
  verifyAccessToken(token: string): AuthTokenPayload | null {
    try {
      return jwt.verify(token, this.jwtSecret, {
        issuer: 'ldnexus',
        audience: 'ldnexus-users'
      }) as AuthTokenPayload;
    } catch (error) {
      return null;
    }
  }

  // Verify refresh token
  verifyRefreshToken(token: string): AuthTokenPayload | null {
    try {
      const payload = jwt.verify(token, this.refreshSecret, {
        issuer: 'ldnexus',
        audience: 'ldnexus-users'
      }) as AuthTokenPayload;

      // Check if session is still active
      if (this.activeSessions.has(payload.sessionId)) {
        return payload;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  // Refresh access token using refresh token
  refreshAccessToken(refreshToken: string): { accessToken: string; user: AuthTokenPayload } | null {
    const payload = this.verifyRefreshToken(refreshToken);
    if (!payload) return null;

    const newAccessToken = this.generateAccessToken(payload, payload.sessionId);
    return {
      accessToken: newAccessToken,
      user: payload
    };
  }

  // Invalidate session
  invalidateSession(sessionId: string): void {
    this.activeSessions.delete(sessionId);
  }

  // Check if session is active
  isSessionActive(sessionId: string): boolean {
    return this.activeSessions.has(sessionId);
  }

  // Middleware for token authentication
  authenticateToken() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Check for access token in Authorization header
      const authHeader = req.headers.authorization;
      const accessToken = authHeader && authHeader.split(' ')[1];

      if (accessToken) {
        const payload = this.verifyAccessToken(accessToken);
        if (payload && this.isSessionActive(payload.sessionId)) {
          // Attach user info to request
          (req as any).tokenUser = payload;
          next();
          return;
        }
      }

      // Check for refresh token in cookies and attempt refresh
      const refreshToken = req.cookies?.refreshToken;
      if (refreshToken) {
        const refreshResult = this.refreshAccessToken(refreshToken);
        if (refreshResult) {
          // Set new access token in response header
          res.setHeader('X-New-Access-Token', refreshResult.accessToken);
          (req as any).tokenUser = refreshResult.user;
          next();
          return;
        }
      }

      // Fall back to session authentication
      if (req.isAuthenticated && req.isAuthenticated()) {
        next();
        return;
      }

      res.status(401).json({ message: 'Authentication required' });
    };
  }

  // Set authentication cookies
  setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
    // Set access token in secure httpOnly cookie
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/'
    });

    // Set refresh token in secure httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });
  }

  // Clear authentication cookies
  clearAuthCookies(res: Response): void {
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
  }

  // Clean up expired sessions
  cleanupExpiredSessions(): void {
    const now = Date.now();
    const sessionsToDelete: string[] = [];
    
    this.activeSessions.forEach((payload, sessionId) => {
      if (payload.exp && payload.exp * 1000 < now) {
        sessionsToDelete.push(sessionId);
      }
    });
    
    sessionsToDelete.forEach(sessionId => {
      this.activeSessions.delete(sessionId);
    });
  }
}

export const authManager = AuthManager.getInstance();

// Periodic cleanup of expired sessions
setInterval(() => {
  authManager.cleanupExpiredSessions();
}, 60 * 60 * 1000); // Every hour