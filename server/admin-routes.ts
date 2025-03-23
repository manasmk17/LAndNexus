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

// Register all admin-specific routes
export function registerAdminRoutes(app: Express) {
  // Dashboard stats endpoint
  app.get("/api/admin/dashboard-stats", isAuthenticated, isAdmin, async (req, res) => {
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
        recentActivity.push({
          id: index + 1,
          type: 'professional',
          description: `New professional profile: ${profile.firstName} ${profile.lastName}`,
          timestamp: new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000).toISOString() // Simulating dates
        });
      });
      
      // Add job postings (limited to 3)
      jobPostings.slice(0, 3).forEach((job, index) => {
        recentActivity.push({
          id: recentActivity.length + index + 1,
          type: 'job',
          description: `New job posted: ${job.title}`,
          timestamp: new Date(Date.now() - (index + 2) * 12 * 60 * 60 * 1000).toISOString()
        });
      });
      
      // Add resources (limited to 3)
      resources.slice(0, 3).forEach((resource, index) => {
        recentActivity.push({
          id: recentActivity.length + index + 1,
          type: 'resource',
          description: `New resource published: '${resource.title}'`,
          timestamp: new Date(Date.now() - (index + 1) * 36 * 60 * 60 * 1000).toISOString()
        });
      });
      
      // Sort by timestamp (most recent first)
      recentActivity.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      // Calculate simple "revenue" based on user count
      const baseRevenue = 100; // Base revenue per user
      const revenue = allUsers.length * baseRevenue;
      
      const stats = {
        totalUsers: allUsers.length,
        professionals: professionals.length,
        companies: companies.length,
        jobPostings: jobPostings.length,
        resources: resources.length,
        revenue,
        recentActivity: recentActivity.slice(0, 5) // Limit to most recent 5
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error generating dashboard stats:", error);
      res.status(500).json({ message: "Failed to generate dashboard statistics" });
    }
  });
}