import { Request, Response } from 'express';
import { db } from '../../db';
import { users } from '../../../shared/schema';
import bcrypt from 'bcrypt';
import { AdminRole, AdminAuthResponse, adminLoginSchema } from '../types/admin.types';
import { generateAdminToken, generateAdminRefreshToken } from '../middlewares/admin-auth.middleware';
import { eq } from 'drizzle-orm';
import { ZodError } from 'zod';

/**
 * Authenticate admin user
 */
export const login = async (req: Request, res: Response) => {
  try {
    // Validate the request body
    const validatedData = adminLoginSchema.parse(req.body);
    
    // Find the user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email));
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check if user is an admin
    if (!user.is_admin) {
      return res.status(403).json({ message: 'Access denied: Not an admin account' });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(validatedData.password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate tokens
    const accessToken = generateAdminToken(user.id);
    const refreshToken = generateAdminRefreshToken(user.id);
    
    // TODO: Store refresh token or hash in database for validation
    
    // Update last login
    await db
      .update(users)
      .set({ last_login: new Date() })
      .where(eq(users.id, user.id));
    
    // Return user info and tokens
    const response: AdminAuthResponse = {
      accessToken,
      refreshToken,
      expiresIn: 3600, // 1 hour in seconds
      adminUser: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.user_type as AdminRole, 
        lastLogin: user.last_login,
        createdAt: user.created_at,
        updatedAt: user.updated_at || user.created_at,
        isActive: !user.blocked,
        twoFactorEnabled: Boolean(user.two_factor_enabled),
        twoFactorSecret: user.two_factor_secret || null,
        // Additional founder privileges
        bypassRestrictions: user.user_type === AdminRole.FOUNDER,
        accessLevel: user.user_type === AdminRole.FOUNDER ? 100 : 
                    user.user_type === AdminRole.SUPER_ADMIN ? 80 : 
                    user.user_type === AdminRole.ADMIN ? 60 : 
                    user.user_type === AdminRole.MODERATOR ? 40 : 20,
        canImpersonateUsers: user.user_type === AdminRole.FOUNDER || user.user_type === AdminRole.SUPER_ADMIN
      }
    };
    
    res.status(200).json(response);
    
  } catch (error) {
    console.error('Admin login error:', error);
    
    if (error instanceof ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Refresh admin access token
 */
export const refreshToken = async (req: Request, res: Response) => {
  // This would validate the refresh token and generate a new access token
  res.status(501).json({ message: 'Not implemented yet' });
};

/**
 * Log out admin user
 */
export const logout = async (req: Request, res: Response) => {
  // This would invalidate the refresh token
  res.status(200).json({ message: 'Logged out successfully' });
};

/**
 * Get admin profile
 */
export const getProfile = async (req: Request, res: Response) => {
  if (!req.adminUser) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  res.status(200).json({
    id: req.adminUser.id,
    username: req.adminUser.username,
    email: req.adminUser.email,
    firstName: req.adminUser.firstName,
    lastName: req.adminUser.lastName,
    role: req.adminUser.role
  });
};

/**
 * Update admin password
 */
export const updatePassword = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented yet' });
};

/**
 * Toggle two-factor authentication
 */
export const toggleTwoFactor = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented yet' });
};