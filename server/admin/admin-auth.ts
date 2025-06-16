import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { storage } from '../storage';

export interface AdminSession {
  userId: number;
  sessionId: string;
  createdAt: Date;
  lastActivity: Date;
  ipAddress: string;
  userAgent: string;
}

const adminSessions = new Map<string, AdminSession>();

// Admin session timeout (15 minutes)
const ADMIN_SESSION_TIMEOUT = 15 * 60 * 1000;

export function generateAdminSession(userId: number, ipAddress: string, userAgent: string): string {
  const sessionId = crypto.randomBytes(32).toString('hex');
  
  adminSessions.set(sessionId, {
    userId,
    sessionId,
    createdAt: new Date(),
    lastActivity: new Date(),
    ipAddress,
    userAgent
  });

  return sessionId;
}

export function validateAdminSession(sessionId: string): AdminSession | null {
  const session = adminSessions.get(sessionId);
  
  if (!session) {
    return null;
  }

  // Check if session has expired
  const now = new Date();
  if (now.getTime() - session.lastActivity.getTime() > ADMIN_SESSION_TIMEOUT) {
    adminSessions.delete(sessionId);
    return null;
  }

  // Update last activity
  session.lastActivity = now;
  return session;
}

export function revokeAdminSession(sessionId: string): void {
  adminSessions.delete(sessionId);
}

export function clearExpiredAdminSessions(): void {
  const now = new Date();
  for (const [sessionId, session] of adminSessions) {
    if (now.getTime() - session.lastActivity.getTime() > ADMIN_SESSION_TIMEOUT) {
      adminSessions.delete(sessionId);
    }
  }
}

// Middleware to verify admin authentication
export const requireAdminAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionToken = req.headers['x-admin-session'] as string;
    
    if (!sessionToken) {
      return res.status(401).json({ error: 'Admin session required' });
    }

    const session = validateAdminSession(sessionToken);
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired admin session' });
    }

    // Verify user is still admin
    const user = await storage.getUserById(session.userId);
    if (!user || !user.isAdmin) {
      revokeAdminSession(sessionToken);
      return res.status(403).json({ error: 'Admin privileges revoked' });
    }

    // Add admin user to request
    (req as any).adminUser = user;
    (req as any).adminSession = session;

    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

// Admin login with enhanced security
export async function adminLogin(req: Request, res: Response) {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Get client IP and user agent
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Find user by username or email
    const user = await storage.getUserByUsername(username) || await storage.getUserByEmail(username);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify user is admin
    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Verify password
    const isValidPassword = await storage.verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate admin session
    const sessionToken = generateAdminSession(user.id, ipAddress, userAgent);

    res.json({
      success: true,
      sessionToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
}

// Admin logout
export async function adminLogout(req: Request, res: Response) {
  try {
    const sessionToken = req.headers['x-admin-session'] as string;
    
    if (sessionToken) {
      revokeAdminSession(sessionToken);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Admin logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
}

// Clean up expired sessions periodically
setInterval(clearExpiredAdminSessions, 5 * 60 * 1000); // Every 5 minutes