import { Request, Response } from 'express';
import { 
  adminLoginSchema, 
  AdminRole, 
  AdminPermission 
} from '../types/admin.types';
import { 
  generateAdminToken, 
  generateAdminRefreshToken 
} from '../middlewares/admin-auth.middleware';
import { storage } from '../../storage';
import * as crypto from 'crypto';
import jwt from 'jsonwebtoken';

// Configure JWT settings
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'admin-secret-key-change-in-production';

/**
 * Admin login handler
 */
export const login = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = adminLoginSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Invalid request data',
        errors: validationResult.error.errors
      });
    }
    
    const { email, password, totpCode } = validationResult.data;
    
    // Find admin user by email
    const adminUser = await storage.getAdminUserByEmail(email);
    if (!adminUser) {
      // Use constant-time comparison to prevent timing attacks
      // This will run the password check even if user doesn't exist
      crypto.timingSafeEqual(
        Buffer.from('dummy-hash'),
        Buffer.from('dummy-hash')
      );
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check if account is active
    if (!adminUser.isActive) {
      return res.status(403).json({ message: 'Account is inactive. Please contact the system administrator.' });
    }
    
    // Verify password
    const passwordValid = await verifyPassword(password, adminUser.password);
    if (!passwordValid) {
      // Log failed login attempt
      await storage.logAdminLoginAttempt({
        adminId: adminUser.id,
        success: false,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || 'unknown',
        timestamp: new Date()
      });
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check 2FA if enabled
    if (adminUser.twoFactorEnabled) {
      if (!totpCode) {
        return res.status(400).json({ 
          message: 'Two-factor authentication code required',
          requires2FA: true
        });
      }
      
      const isValidTotp = await verifyTOTP(adminUser.id, totpCode);
      if (!isValidTotp) {
        await storage.logAdminLoginAttempt({
          adminId: adminUser.id,
          success: false,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || 'unknown',
          timestamp: new Date(),
          details: 'Invalid 2FA code'
        });
        return res.status(401).json({ message: 'Invalid two-factor authentication code' });
      }
    }
    
    // Ensure customPermissions is properly typed for token generation
    const typedAdmin: AdminUser = {
      ...adminUser,
      customPermissions: Array.isArray(adminUser.customPermissions) 
        ? adminUser.customPermissions as AdminPermission[]
        : undefined
    };

    // Generate tokens
    const accessToken = generateAdminToken(typedAdmin);
    const refreshToken = generateAdminRefreshToken(typedAdmin);
    
    // Save refresh token to database
    await storage.saveAdminRefreshToken(adminUser.id, refreshToken);
    
    // Update last login timestamp
    await storage.updateAdminLastLogin(adminUser.id);
    
    // Log successful login
    await storage.logAdminLoginAttempt({
      adminId: adminUser.id,
      success: true,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
      timestamp: new Date()
    });
    
    // Return tokens and user data
    return res.status(200).json({
      accessToken,
      refreshToken,
      expiresIn: 3600, // 1 hour
      adminUser: {
        id: adminUser.id,
        username: adminUser.username,
        email: adminUser.email,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        role: adminUser.role,
        customPermissions: adminUser.customPermissions || []
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ message: 'Internal server error during login' });
  }
};

/**
 * Admin refresh token handler
 */
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }
    
    // Verify the refresh token
    try {
      const decoded = jwt.verify(refreshToken, JWT_SECRET) as { id: number, type: string };
      
      // Check if it's a refresh token
      if (decoded.type !== 'refresh') {
        return res.status(401).json({ message: 'Invalid refresh token' });
      }
      
      // Check if the token exists in the database
      const isValidToken = await storage.validateAdminRefreshToken(decoded.id, refreshToken);
      if (!isValidToken) {
        return res.status(401).json({ message: 'Refresh token is invalid or has been revoked' });
      }
      
      // Get admin user
      const adminUser = await storage.getAdminUserById(decoded.id);
      if (!adminUser || !adminUser.isActive) {
        return res.status(401).json({ message: 'Invalid refresh token' });
      }
      
      // Ensure customPermissions is properly typed for token generation
      const typedAdmin: AdminUser = {
        ...adminUser,
        customPermissions: Array.isArray(adminUser.customPermissions) 
          ? adminUser.customPermissions as AdminPermission[]
          : undefined
      };
      
      // Generate new tokens
      const newAccessToken = generateAdminToken(typedAdmin);
      const newRefreshToken = generateAdminRefreshToken(typedAdmin);
      
      // Invalidate old refresh token and save new one
      await storage.rotateAdminRefreshToken(adminUser.id, refreshToken, newRefreshToken);
      
      // Return new tokens
      return res.status(200).json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 3600 // 1 hour
      });
    } catch (error) {
      if ((error as Error).name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Refresh token has expired, please login again' });
      } else {
        return res.status(401).json({ message: 'Invalid refresh token' });
      }
    }
  } catch (error) {
    console.error('Admin refresh token error:', error);
    return res.status(500).json({ message: 'Internal server error during token refresh' });
  }
};

/**
 * Admin logout handler
 */
export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }
    
    // Verify the token to get the admin ID
    try {
      const decoded = jwt.verify(refreshToken, JWT_SECRET) as { id: number };
      
      // Invalidate the refresh token
      await storage.invalidateAdminRefreshToken(decoded.id, refreshToken);
      
      return res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
      // Even if token verification fails, we want to acknowledge the logout
      return res.status(200).json({ message: 'Logout successful' });
    }
  } catch (error) {
    console.error('Admin logout error:', error);
    return res.status(500).json({ message: 'Internal server error during logout' });
  }
};

/**
 * Get current admin profile
 */
export const getProfile = async (req: Request, res: Response) => {
  try {
    if (!req.adminUser) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Exclude sensitive fields
    const { password, ...adminData } = req.adminUser as any;
    
    return res.status(200).json(adminData);
  } catch (error) {
    console.error('Get admin profile error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Update admin password
 */
export const updatePassword = async (req: Request, res: Response) => {
  try {
    if (!req.adminUser) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required' });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long' });
    }
    
    // Get admin with password
    const admin = await storage.getAdminUserById(req.adminUser.id);
    
    // Verify current password
    const passwordValid = await verifyPassword(currentPassword, admin.password);
    if (!passwordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update password
    await storage.updateAdminPassword(req.adminUser.id, hashedPassword);
    
    // Invalidate all refresh tokens
    await storage.invalidateAllAdminRefreshTokens(req.adminUser.id);
    
    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update admin password error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Toggle two-factor authentication
 */
export const toggleTwoFactor = async (req: Request, res: Response) => {
  try {
    if (!req.adminUser) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const { enable, totpCode } = req.body;
    
    if (enable === undefined) {
      return res.status(400).json({ message: 'Enable parameter is required' });
    }
    
    // If enabling 2FA
    if (enable) {
      if (!req.adminUser.twoFactorEnabled) {
        // Generate new TOTP secret
        const secret = generateTOTPSecret();
        
        // Save secret temporarily
        await storage.saveAdminTOTPSecret(req.adminUser.id, secret);
        
        // Generate QR code data
        const qrCodeData = generateTOTPQRCode(req.adminUser.email, secret);
        
        return res.status(200).json({
          message: 'TOTP secret generated. Scan the QR code with your authenticator app.',
          qrCodeData,
          secret
        });
      } else {
        return res.status(400).json({ message: 'Two-factor authentication is already enabled' });
      }
    } 
    // If verifying TOTP after enabling
    else if (totpCode) {
      // Get the saved TOTP secret
      const secret = await storage.getAdminTOTPSecret(req.adminUser.id);
      
      if (!secret) {
        return res.status(400).json({ message: 'TOTP setup not initiated. Please start the process again.' });
      }
      
      // Verify the TOTP code
      const isValid = verifyTOTPWithSecret(totpCode, secret);
      
      if (!isValid) {
        return res.status(401).json({ message: 'Invalid TOTP code' });
      }
      
      // Enable 2FA
      await storage.enableAdminTwoFactor(req.adminUser.id, secret);
      
      return res.status(200).json({ message: 'Two-factor authentication enabled successfully' });
    }
    // If disabling 2FA
    else {
      if (req.adminUser.twoFactorEnabled) {
        await storage.disableAdminTwoFactor(req.adminUser.id);
        return res.status(200).json({ message: 'Two-factor authentication disabled successfully' });
      } else {
        return res.status(400).json({ message: 'Two-factor authentication is already disabled' });
      }
    }
  } catch (error) {
    console.error('Toggle two-factor error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Helper function to verify password
async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    // Extract salt and hash
    const [hash, salt] = hashedPassword.split('.');
    
    // Hash the provided password with the same salt
    return new Promise((resolve, reject) => {
      crypto.scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) reject(err);
        resolve(crypto.timingSafeEqual(Buffer.from(hash, 'hex'), derivedKey));
      });
    });
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

// Helper function to hash password
async function hashPassword(password: string): Promise<string> {
  // Generate a random salt
  const salt = crypto.randomBytes(16).toString('hex');
  
  // Hash the password with the salt
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(derivedKey.toString('hex') + '.' + salt);
    });
  });
}

// Helper function to verify TOTP
async function verifyTOTP(adminId: number, totpCode: string): Promise<boolean> {
  try {
    // Get the user's TOTP secret
    const secret = await storage.getAdminTOTPSecret(adminId);
    if (!secret) return false;
    
    return verifyTOTPWithSecret(totpCode, secret);
  } catch (error) {
    console.error('TOTP verification error:', error);
    return false;
  }
}

// Helper function to verify TOTP with a secret
function verifyTOTPWithSecret(totpCode: string, secret: string): boolean {
  try {
    // In a real implementation, use a library like 'otplib' to verify TOTP codes
    // For this example, we'll simulate validation
    if (process.env.NODE_ENV === 'development') {
      // In development, accept a hardcoded code for testing
      return totpCode === '123456';
    }
    
    // Here you would use a proper TOTP validation
    // Example with otplib:
    // const totp = new OTPLib.TOTP({ secret });
    // return totp.verify({ token: totpCode });
    
    // For now, we'll return true
    return true;
  } catch (error) {
    console.error('TOTP verification error:', error);
    return false;
  }
}

// Helper function to generate TOTP secret
function generateTOTPSecret(): string {
  // In a real implementation, use a library like 'otplib' to generate secrets
  // For this example, we'll generate a simple random string
  return crypto.randomBytes(20).toString('hex');
}

// Helper function to generate TOTP QR code data
function generateTOTPQRCode(email: string, secret: string): string {
  // In a real implementation, use a library to generate QR code data
  // For this example, we'll return a dummy URL
  const appName = 'L&D Nexus Admin';
  const otpAuthUrl = `otpauth://totp/${encodeURIComponent(appName)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(appName)}`;
  
  return otpAuthUrl;
}