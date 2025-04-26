import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import { User } from "@shared/schema";

// Middleware to check if user is authenticated
export const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

// Middleware to check if user is an admin
export const isAdmin = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated() && req.user && (req.user as User).isAdmin) {
    return next();
  }
  res.status(403).json({ message: "Forbidden: Admin access required" });
};

// Interface for admin action logs
export interface AdminActionLog {
  id: number;
  adminId: number;
  adminUsername: string;
  action: string;
  details: string;
  entityType: string;
  entityId?: number;
  timestamp: string;
}

// In-memory storage for admin action logs (temporary until database implementation)
const adminActionLogs: AdminActionLog[] = [];
let nextLogId = 1;

// Helper function to record admin actions
export const recordAdminAction = (
  adminId: number,
  adminUsername: string,
  action: string,
  details: string,
  entityType: string,
  entityId?: number
): AdminActionLog => {
  const log: AdminActionLog = {
    id: nextLogId++,
    adminId,
    adminUsername,
    action,
    details,
    entityType,
    entityId,
    timestamp: new Date().toISOString()
  };
  
  adminActionLogs.unshift(log); // Add to the beginning of the array
  
  // Keep only the last 100 actions for memory efficiency
  if (adminActionLogs.length > 100) {
    adminActionLogs.pop();
  }
  
  return log;
};

// Register all admin-specific routes
export function registerAdminRoutes(app: Express) {
  // Apply admin middleware to all admin routes
  app.use('/api/admin', isAuthenticated, isAdmin);
  
  // Dashboard stats endpoint with enhanced metrics
  app.get("/api/admin/dashboard-stats", async (req, res) => {
    try {
      // Get counts from storage methods
      const allUsers = await storage.getAllUsers();
      const professionals = await storage.getAllProfessionalProfiles();
      const companies = await storage.getAllCompanyProfiles();
      const jobPostings = await storage.getAllJobPostings();
      const resources = await storage.getAllResources();
      
      // Generate activity items from recent events
      interface ActivityItem {
        id: number;
        type: string;
        description: string;
        timestamp: string;
      }
      const recentActivity: ActivityItem[] = [];
      
      // Add professionals (limited to 3)
      professionals.slice(0, 3).forEach((profile, index) => {
        // Use a multiplier of 10 for professionals to ensure unique IDs
        const uniqueId = 10 + index;
        recentActivity.push({
          id: uniqueId,
          type: 'professional',
          description: `New professional profile: ${profile.firstName || ''} ${profile.lastName || ''}`,
          timestamp: new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000).toISOString() // Simulating dates
        });
      });
      
      // Add job postings (limited to 3)
      jobPostings.slice(0, 3).forEach((job, index) => {
        // Use a multiplier of 50 for job postings to ensure unique IDs
        const uniqueId = 50 + index;
        recentActivity.push({
          id: uniqueId,
          type: 'job',
          description: `New job posted: ${job.title}`,
          timestamp: new Date(Date.now() - (index + 2) * 12 * 60 * 60 * 1000).toISOString()
        });
      });
      
      // Add resources (limited to 3)
      resources.slice(0, 3).forEach((resource, index) => {
        // Calculate a guaranteed unique ID by using a base offset
        const uniqueId = 100 + recentActivity.length + index;
        recentActivity.push({
          id: uniqueId,
          type: 'resource',
          description: `New resource published: '${resource.title}'`,
          timestamp: new Date(Date.now() - (index + 1) * 36 * 60 * 60 * 1000).toISOString()
        });
      });
      
      // Add recent admin actions to activity feed
      adminActionLogs.slice(0, 3).forEach((log, index) => {
        const uniqueId = 200 + index;
        recentActivity.push({
          id: uniqueId,
          type: 'admin',
          description: `Admin action: ${log.adminUsername} ${log.action} ${log.entityType}`,
          timestamp: log.timestamp
        });
      });
      
      // Sort by timestamp (most recent first)
      recentActivity.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      // Calculate simple "revenue" based on user count and transactions
      const baseRevenue = 100; // Base revenue per user
      const revenue = allUsers.length * baseRevenue;
      
      // Calculate response, hiring, and transaction statistics
      const activeJobPostings = jobPostings.filter(job => job.status === 'open').length;
      const completedJobPostings = jobPostings.filter(job => job.status === 'closed').length;
      
      // Calculate application statistics
      // Since applicationCount might not exist in the JobPosting type, we need to handle it safely
      const totalApplications = jobPostings.reduce((sum, job) => {
        // Cast job to any to avoid TypeScript errors with the applicationCount property
        const applications = (job as any).applicationCount || 0;
        return sum + applications;
      }, 0);
      
      const successfulHires = Math.min(completedJobPostings, Math.floor(totalApplications * 0.3));
      
      // Calculate platform commissions (estimated as 15% of revenue)
      const commissionRate = 0.15;
      const commissions = revenue * commissionRate;
      
      const stats = {
        // User statistics
        totalUsers: allUsers.length,
        professionals: professionals.length,
        companies: companies.length,
        
        // Job statistics
        jobPostings: jobPostings.length,
        activeJobPostings,
        completedJobPostings,
        
        // Resource statistics
        resources: resources.length,
        
        // Financial statistics
        revenue,
        commissions,
        transactionCount: successfulHires,
        
        // Performance statistics
        applications: totalApplications,
        hires: successfulHires,
        responseRate: totalApplications > 0 ? Math.round((totalApplications / jobPostings.length) * 100) : 0,
        hireRate: totalApplications > 0 ? Math.round((successfulHires / totalApplications) * 100) : 0,
        
        // Activity feed
        recentActivity: recentActivity.slice(0, 8) // Limit to most recent 8
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error generating dashboard stats:", error);
      res.status(500).json({ message: "Failed to generate dashboard statistics" });
    }
  });
  
  // Get admin action logs
  app.get("/api/admin/action-logs", (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const start = (page - 1) * limit;
      const end = start + limit;
      
      const logs = adminActionLogs.slice(start, end);
      const total = adminActionLogs.length;
      
      res.json({
        logs,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error("Error retrieving admin action logs:", error);
      res.status(500).json({ message: "Failed to retrieve admin action logs" });
    }
  });
  
  // Record an admin action
  app.post("/api/admin/record-action", (req, res) => {
    try {
      const { action, details, entityType, entityId } = req.body;
      const adminId = (req.user as User).id;
      const adminUsername = (req.user as User).username;
      
      if (!action || !details || !entityType) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const log = recordAdminAction(adminId, adminUsername, action, details, entityType, entityId);
      res.status(201).json(log);
    } catch (error) {
      console.error("Error recording admin action:", error);
      res.status(500).json({ message: "Failed to record admin action" });
    }
  });
  
  // Pending moderation items (complaints, reports, etc.)
  app.get("/api/admin/moderation-queue", (req, res) => {
    try {
      // Placeholder for moderation queue data
      // In a full implementation, this would fetch from the database
      const moderationItems = [
        { id: 1, type: 'report', status: 'pending', description: 'Inappropriate content in job posting', timestamp: new Date().toISOString() },
        { id: 2, type: 'complaint', status: 'pending', description: 'Unprofessional behavior from service provider', timestamp: new Date().toISOString() },
        { id: 3, type: 'verification', status: 'pending', description: 'New professional needs profile verification', timestamp: new Date().toISOString() }
      ];
      
      res.json(moderationItems);
    } catch (error) {
      console.error("Error retrieving moderation queue:", error);
      res.status(500).json({ message: "Failed to retrieve moderation queue" });
    }
  });
  
  // Recent financial transactions
  app.get("/api/admin/financial-transactions", (req, res) => {
    try {
      // Placeholder for transaction data
      // In a full implementation, this would fetch from the database or payment provider
      const transactions = [
        { id: 1, type: 'payment', amount: 500, status: 'completed', description: 'Premium job posting fee', timestamp: new Date().toISOString() },
        { id: 2, type: 'commission', amount: 150, status: 'completed', description: 'Platform commission on completed project', timestamp: new Date().toISOString() },
        { id: 3, type: 'subscription', amount: 99, status: 'completed', description: 'Monthly subscription fee', timestamp: new Date().toISOString() }
      ];
      
      res.json(transactions);
    } catch (error) {
      console.error("Error retrieving financial transactions:", error);
      res.status(500).json({ message: "Failed to retrieve financial transactions" });
    }
  });
  
  // Support tickets
  app.get("/api/admin/support-tickets", (req, res) => {
    try {
      // Placeholder for support ticket data
      // In a full implementation, this would fetch from the database
      const tickets = [
        { id: 1, status: 'open', priority: 'high', title: 'Cannot access payment system', userId: 5, timestamp: new Date().toISOString() },
        { id: 2, status: 'open', priority: 'medium', title: 'Problem with profile visibility', userId: 8, timestamp: new Date().toISOString() },
        { id: 3, status: 'open', priority: 'low', title: 'Question about subscription tiers', userId: 12, timestamp: new Date().toISOString() }
      ];
      
      res.json(tickets);
    } catch (error) {
      console.error("Error retrieving support tickets:", error);
      res.status(500).json({ message: "Failed to retrieve support tickets" });
    }
  });
  
  // Add admin routes for users, professionals, companies, jobs, etc.
  app.get("/api/admin/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error retrieving users:", error);
      res.status(500).json({ message: "Failed to retrieve users" });
    }
  });
  
  app.get("/api/admin/professional-profiles", async (req, res) => {
    try {
      const profiles = await storage.getAllProfessionalProfiles();
      res.json(profiles);
    } catch (error) {
      console.error("Error retrieving professional profiles:", error);
      res.status(500).json({ message: "Failed to retrieve professional profiles" });
    }
  });
  
  app.get("/api/admin/company-profiles", async (req, res) => {
    try {
      const companies = await storage.getAllCompanyProfiles();
      res.json(companies);
    } catch (error) {
      console.error("Error retrieving company profiles:", error);
      res.status(500).json({ message: "Failed to retrieve company profiles" });
    }
  });
  
  app.get("/api/admin/job-postings", async (req, res) => {
    try {
      const jobs = await storage.getAllJobPostings();
      res.json(jobs);
    } catch (error) {
      console.error("Error retrieving job postings:", error);
      res.status(500).json({ message: "Failed to retrieve job postings" });
    }
  });
  
  app.get("/api/admin/resources", async (req, res) => {
    try {
      const resources = await storage.getAllResources();
      res.json(resources);
    } catch (error) {
      console.error("Error retrieving resources:", error);
      res.status(500).json({ message: "Failed to retrieve resources" });
    }
  });
}