import type { Express } from "express";
import { storage } from "./storage";
import { eq, desc, sql, and, or, like, gte } from "drizzle-orm";
import { users, jobPostings, resources, reviews, professionalProfiles, companyProfiles } from "@shared/schema";

export function setupAdminRoutes(app: Express) {
  // Middleware to check admin permissions
  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  };

  // Dashboard Stats
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const totalUsers = await storage.getTotalUsers();
      const activeSubscriptions = await storage.getActiveSubscriptionsCount();
      const monthlyRevenue = await storage.getMonthlyRevenue();
      const pendingContent = await storage.getPendingContentCount();
      
      // Calculate growth metrics
      const lastMonthUsers = await storage.getUsersFromLastMonth();
      const userGrowth = lastMonthUsers > 0 ? 
        ((totalUsers - lastMonthUsers) / lastMonthUsers * 100).toFixed(1) : 0;

      const conversionRate = totalUsers > 0 ? 
        (activeSubscriptions / totalUsers * 100).toFixed(1) : 0;

      res.json({
        totalUsers,
        activeSubscriptions,
        monthlyRevenue,
        pendingContent,
        userGrowth: parseFloat(userGrowth as string),
        conversionRate: parseFloat(conversionRate as string)
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Recent Activity
  app.get("/api/admin/recent-activity", requireAdmin, async (req, res) => {
    try {
      const activities = await storage.getRecentActivity();
      res.json(activities);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      res.status(500).json({ message: "Failed to fetch activity" });
    }
  });

  // User Management
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const { search, type, status } = req.query;
      const users = await storage.getAdminUsers({
        search: search as string,
        type: type as string,
        status: status as string
      });
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users/:id/suspend", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      await storage.suspendUser(userId);
      res.json({ message: "User suspended successfully" });
    } catch (error) {
      console.error("Error suspending user:", error);
      res.status(500).json({ message: "Failed to suspend user" });
    }
  });

  app.post("/api/admin/users/:id/activate", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      await storage.activateUser(userId);
      res.json({ message: "User activated successfully" });
    } catch (error) {
      console.error("Error activating user:", error);
      res.status(500).json({ message: "Failed to activate user" });
    }
  });

  app.post("/api/admin/users/:id/make-admin", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      await storage.makeUserAdmin(userId);
      res.json({ message: "Admin privileges granted successfully" });
    } catch (error) {
      console.error("Error granting admin privileges:", error);
      res.status(500).json({ message: "Failed to grant admin privileges" });
    }
  });

  // Subscription Management
  app.get("/api/admin/subscriptions", requireAdmin, async (req, res) => {
    try {
      const { search, status, plan } = req.query;
      const subscriptions = await storage.getAdminSubscriptions({
        search: search as string,
        status: status as string,
        plan: plan as string
      });
      res.json(subscriptions);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });

  app.get("/api/admin/revenue-metrics", requireAdmin, async (req, res) => {
    try {
      const metrics = await storage.getRevenueMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching revenue metrics:", error);
      res.status(500).json({ message: "Failed to fetch revenue metrics" });
    }
  });

  app.post("/api/admin/subscriptions/:id/cancel", requireAdmin, async (req, res) => {
    try {
      const subscriptionId = parseInt(req.params.id);
      await storage.cancelSubscription(subscriptionId);
      res.json({ message: "Subscription cancelled successfully" });
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ message: "Failed to cancel subscription" });
    }
  });

  app.post("/api/admin/subscriptions/:id/refund", requireAdmin, async (req, res) => {
    try {
      const subscriptionId = parseInt(req.params.id);
      const { amount } = req.body;
      await storage.processRefund(subscriptionId, amount);
      res.json({ message: "Refund processed successfully" });
    } catch (error) {
      console.error("Error processing refund:", error);
      res.status(500).json({ message: "Failed to process refund" });
    }
  });

  // Content Moderation
  app.get("/api/admin/content", requireAdmin, async (req, res) => {
    try {
      const { type, status, search } = req.query;
      const content = await storage.getContentForModeration({
        type: type as string,
        status: status as string,
        search: search as string
      });
      res.json(content);
    } catch (error) {
      console.error("Error fetching content:", error);
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  app.get("/api/admin/moderation-stats", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getModerationStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching moderation stats:", error);
      res.status(500).json({ message: "Failed to fetch moderation stats" });
    }
  });

  app.post("/api/admin/content/:id/approve", requireAdmin, async (req, res) => {
    try {
      const contentId = parseInt(req.params.id);
      const { reason } = req.body;
      await storage.approveContent(contentId, req.user.id, reason);
      res.json({ message: "Content approved successfully" });
    } catch (error) {
      console.error("Error approving content:", error);
      res.status(500).json({ message: "Failed to approve content" });
    }
  });

  app.post("/api/admin/content/:id/reject", requireAdmin, async (req, res) => {
    try {
      const contentId = parseInt(req.params.id);
      const { reason } = req.body;
      await storage.rejectContent(contentId, req.user.id, reason);
      res.json({ message: "Content rejected successfully" });
    } catch (error) {
      console.error("Error rejecting content:", error);
      res.status(500).json({ message: "Failed to reject content" });
    }
  });

  // Analytics
  app.get("/api/admin/analytics/users", requireAdmin, async (req, res) => {
    try {
      const { period = "30d" } = req.query;
      const analytics = await storage.getUserAnalytics(period as string);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching user analytics:", error);
      res.status(500).json({ message: "Failed to fetch user analytics" });
    }
  });

  app.get("/api/admin/analytics/revenue", requireAdmin, async (req, res) => {
    try {
      const { period = "30d" } = req.query;
      const analytics = await storage.getRevenueAnalytics(period as string);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching revenue analytics:", error);
      res.status(500).json({ message: "Failed to fetch revenue analytics" });
    }
  });

  app.get("/api/admin/analytics/content", requireAdmin, async (req, res) => {
    try {
      const { period = "30d" } = req.query;
      const analytics = await storage.getContentAnalytics(period as string);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching content analytics:", error);
      res.status(500).json({ message: "Failed to fetch content analytics" });
    }
  });

  // System Settings
  app.get("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getSystemSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching system settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const settings = req.body;
      await storage.updateSystemSettings(settings);
      res.json({ message: "Settings updated successfully" });
    } catch (error) {
      console.error("Error updating system settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Audit Logs
  app.get("/api/admin/audit-logs", requireAdmin, async (req, res) => {
    try {
      const { page = 1, limit = 50, action, userId } = req.query;
      const logs = await storage.getAuditLogs({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        action: action as string,
        userId: userId ? parseInt(userId as string) : undefined
      });
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // Export Data
  app.get("/api/admin/export/users", requireAdmin, async (req, res) => {
    try {
      const { format = "csv" } = req.query;
      const data = await storage.exportUserData(format as string);
      
      res.setHeader('Content-Disposition', `attachment; filename=users.${format}`);
      res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
      res.send(data);
    } catch (error) {
      console.error("Error exporting user data:", error);
      res.status(500).json({ message: "Failed to export user data" });
    }
  });

  app.get("/api/admin/export/revenue", requireAdmin, async (req, res) => {
    try {
      const { format = "csv", startDate, endDate } = req.query;
      const data = await storage.exportRevenueData(
        format as string,
        startDate as string,
        endDate as string
      );
      
      res.setHeader('Content-Disposition', `attachment; filename=revenue.${format}`);
      res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
      res.send(data);
    } catch (error) {
      console.error("Error exporting revenue data:", error);
      res.status(500).json({ message: "Failed to export revenue data" });
    }
  });
}