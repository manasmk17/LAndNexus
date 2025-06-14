import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import { insertUserSettingsSchema, insertPasswordResetRequestSchema, insertUserActivityLogSchema } from "@shared/schema";
import { z } from "zod";
import crypto from "crypto";

export function registerSettingsRoutes(app: Express) {
  const isAuthenticated = async (req: Request, res: Response, next: Function) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No authorization header" });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    try {
      const user = await storage.validateAuthToken(token);
      if (!user) {
        return res.status(401).json({ error: "Invalid token" });
      }
      (req as any).user = user;
      next();
    } catch (error) {
      return res.status(401).json({ error: "Token validation failed" });
    }
  };

  // Get user settings
  app.get("/api/settings", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      let settings = await storage.getUserSettings(userId);
      
      // Create default settings if none exist
      if (!settings) {
        settings = await storage.createUserSettings({
          userId,
          emailNotifications: true,
          jobAlerts: true,
          applicationAlerts: true,
          messageNotifications: true,
          emailUpdates: false,
          profileVisible: true,
          contactInfoVisible: false,
          theme: "system",
          language: "en",
          timezone: "UTC",
          twoFactorEnabled: false
        });
      }

      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  // Update user settings
  app.patch("/api/settings", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const updateData = req.body;
      
      // Validate the data
      const validatedData = insertUserSettingsSchema.partial().parse(updateData);
      
      const settings = await storage.updateUserSettings(userId, validatedData);
      if (!settings) {
        return res.status(404).json({ error: "Settings not found" });
      }

      // Log the activity
      await storage.logUserActivity({
        userId,
        action: "settings_update",
        description: "User updated their settings",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent") || null
      });

      res.json(settings);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Change password
  app.post("/api/settings/change-password", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current password and new password are required" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verify current password
      const salt = user.password.substring(0, 16);
      const keyLen = 32;
      const hashedCurrent = await new Promise<string>((resolve, reject) => {
        crypto.scrypt(currentPassword, salt, keyLen, (err: any, derivedKey: Buffer) => {
          if (err) reject(err);
          else resolve(salt + derivedKey.toString('hex'));
        });
      });

      if (hashedCurrent !== user.password) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      // Hash new password
      const newSalt = crypto.randomBytes(16).toString('hex');
      const hashedNew = await new Promise<string>((resolve, reject) => {
        crypto.scrypt(newPassword, newSalt, keyLen, (err: any, derivedKey: Buffer) => {
          if (err) reject(err);
          else resolve(newSalt + derivedKey.toString('hex'));
        });
      });

      // Update password
      await storage.updateUser(userId, { password: hashedNew });

      // Log the activity
      await storage.logUserActivity({
        userId,
        action: "password_change",
        description: "User changed their password",
        ipAddress: req.ip,
        userAgent: req.get("User-Agent") || null
      });

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  // Get user activity log
  app.get("/api/settings/activity", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const activities = await storage.getUserActivityLog(userId, limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activity log:", error);
      res.status(500).json({ error: "Failed to fetch activity log" });
    }
  });

  // Delete account
  app.delete("/api/settings/account", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ error: "Password is required to delete account" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verify password
      const salt = user.password.substring(0, 16);
      const keyLen = 32;
      const hashedPassword = await new Promise<string>((resolve, reject) => {
        crypto.scrypt(password, salt, keyLen, (err: any, derivedKey: Buffer) => {
          if (err) reject(err);
          else resolve(salt + derivedKey.toString('hex'));
        });
      });

      if (hashedPassword !== user.password) {
        return res.status(400).json({ error: "Password is incorrect" });
      }

      // Delete user account
      await storage.deleteUser(userId);

      res.json({ message: "Account deleted successfully" });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ error: "Failed to delete account" });
    }
  });

  // Export user data
  app.get("/api/settings/export", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      
      const user = await storage.getUser(userId);
      const settings = await storage.getUserSettings(userId);
      const activities = await storage.getUserActivityLog(userId);
      
      let profile = null;
      if (user?.userType === "professional") {
        profile = await storage.getProfessionalProfileByUserId(userId);
      } else if (user?.userType === "company") {
        profile = await storage.getCompanyProfileByUserId(userId);
      }

      const exportData = {
        user: {
          id: user?.id,
          username: user?.username,
          email: user?.email,
          firstName: user?.firstName,
          lastName: user?.lastName,
          userType: user?.userType,
          createdAt: user?.createdAt,
          subscriptionTier: user?.subscriptionTier,
          subscriptionStatus: user?.subscriptionStatus
        },
        settings,
        profile,
        activityLog: activities
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="user_data_${userId}.json"`);
      res.json(exportData);
    } catch (error) {
      console.error("Error exporting user data:", error);
      res.status(500).json({ error: "Failed to export user data" });
    }
  });
}