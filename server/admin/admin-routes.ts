import { Express } from 'express';
import { requireAdminAuth, adminLogin, adminLogout } from './admin-auth';
import {
  getDashboardStats,
  getAllUsers,
  getUserDetails,
  updateUserStatus,
  verifyUser,
  getAllJobPostings,
  moderateJobPosting,
  getAllResources,
  moderateResource,
  getFinancialOverview,
  getSubscriptionManagement,
  getSystemSettings,
  updateSystemSettings,
  getAdminLogs
} from './admin-api';

export function registerAdminRoutes(app: Express) {
  // Create authentication middleware that checks for admin users
  const requireAuth = async (req: any, res: any, next: any) => {
    try {
      // Check for session token in cookies or headers
      const sessionToken = req.cookies.session_token || req.headers['x-session-token'];
      
      if (!sessionToken) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Import storage
      const { storage } = require('../storage');
      
      // Get session from token store (using the same logic as main routes)
      const sessionTokenStore = (global as any).sessionTokenStore || new Map();
      const tokenData = sessionTokenStore.get(sessionToken);
      
      if (!tokenData) {
        return res.status(401).json({ message: "Invalid session" });
      }

      // Check if token is still valid (24 hours)
      const tokenAge = Date.now() - tokenData.timestamp;
      if (tokenAge >= 24 * 60 * 60 * 1000) {
        sessionTokenStore.delete(sessionToken);
        return res.status(401).json({ message: "Session expired" });
      }

      // Get user and verify admin status
      const user = await storage.getUser(tokenData.userId);
      if (!user || !user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error("Admin auth error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  // Admin authentication routes
  app.post('/api/admin/login', adminLogin);
  app.post('/api/admin/logout', requireAdminAuth, adminLogout);

  // Dashboard routes
  app.get('/api/admin/dashboard/stats', requireAuth, getDashboardStats);

  // User management routes
  app.get('/api/admin/users', requireAuth, getAllUsers);
  app.get('/api/admin/users/:userId', requireAuth, getUserDetails);
  app.patch('/api/admin/users/:userId/status', requireAuth, updateUserStatus);
  app.patch('/api/admin/users/:userId/verify', requireAuth, verifyUser);

  // Content management routes
  app.get('/api/admin/jobs', requireAuth, getAllJobPostings);
  app.patch('/api/admin/jobs/:jobId/moderate', requireAuth, moderateJobPosting);
  app.get('/api/admin/resources', requireAuth, getAllResources);
  app.patch('/api/admin/resources/:resourceId/moderate', requireAuth, moderateResource);

  // Financial management routes
  app.get('/api/admin/financial/overview', requireAuth, getFinancialOverview);
  app.get('/api/admin/subscriptions', requireAuth, getSubscriptionManagement);

  // System management routes
  app.get('/api/admin/settings', requireAuth, getSystemSettings);
  app.patch('/api/admin/settings', requireAuth, updateSystemSettings);

  // Admin activity logs
  app.get('/api/admin/logs', requireAuth, getAdminLogs);
}