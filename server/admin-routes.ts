
import type { Request, Response } from "express";
import { storage } from "./storage";
import { User, JobPosting, ProfessionalProfile, CompanyProfile, Resource } from "@shared/schema";

// Admin authentication middleware
export function isServerAdmin(req: Request, res: Response, next: Function) {
  // Check for admin token in environment or headers
  const adminToken = process.env.ADMIN_TOKEN || "admin-secret-key-2024";
  const providedToken = req.headers['x-admin-token'] || req.query.adminToken;
  
  if (providedToken !== adminToken) {
    return res.status(403).json({ message: "Admin access denied" });
  }
  
  next();
}

// Admin Dashboard Data
export async function getAdminDashboard(req: Request, res: Response) {
  try {
    // Get system statistics
    const stats = {
      totalUsers: Array.from((storage as any).users.values()).length,
      totalJobs: Array.from((storage as any).jobPostings.values()).length,
      totalProfessionals: Array.from((storage as any).professionalProfiles.values()).length,
      totalCompanies: Array.from((storage as any).companyProfiles.values()).length,
      totalResources: Array.from((storage as any).resources.values()).length,
      pendingApprovals: 0, // Placeholder for approval system
    };
    
    res.json(stats);
  } catch (error) {
    console.error("Error fetching admin dashboard:", error);
    res.status(500).json({ message: "Failed to fetch dashboard data" });
  }
}

// User Management
export async function getAllUsers(req: Request, res: Response) {
  try {
    const users = Array.from((storage as any).users.values()).map((user: User) => ({
      ...user,
      // Remove sensitive data
      password: undefined
    }));
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
}

export async function updateUserStatus(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.id);
    const { isActive, userType } = req.body;
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const updatedUser = await storage.updateUser(userId, { 
      isActive: isActive !== undefined ? isActive : user.isActive,
      userType: userType || user.userType
    });
    
    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Failed to update user" });
  }
}

export async function deleteUserAdmin(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.id);
    const success = await storage.deleteUser(userId);
    
    if (success) {
      res.json({ success: true, message: "User deleted successfully" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
}

// Job Management
export async function getAllJobsAdmin(req: Request, res: Response) {
  try {
    const jobs = Array.from((storage as any).jobPostings.values());
    res.json(jobs);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
}

export async function updateJobStatus(req: Request, res: Response) {
  try {
    const jobId = parseInt(req.params.id);
    const { featured, status } = req.body;
    
    const job = await storage.getJobPosting(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    
    const updatedJob = await storage.updateJobPosting(jobId, {
      featured: featured !== undefined ? featured : job.featured,
      status: status || job.status
    });
    
    res.json(updatedJob);
  } catch (error) {
    console.error("Error updating job:", error);
    res.status(500).json({ message: "Failed to update job" });
  }
}

// Professional Profile Management
export async function getAllProfessionalsAdmin(req: Request, res: Response) {
  try {
    const professionals = Array.from((storage as any).professionalProfiles.values());
    res.json(professionals);
  } catch (error) {
    console.error("Error fetching professionals:", error);
    res.status(500).json({ message: "Failed to fetch professionals" });
  }
}

export async function updateProfessionalStatus(req: Request, res: Response) {
  try {
    const professionalId = parseInt(req.params.id);
    const { featured, verified } = req.body;
    
    const professional = await storage.getProfessionalProfile(professionalId);
    if (!professional) {
      return res.status(404).json({ message: "Professional not found" });
    }
    
    const updatedProfessional = await storage.updateProfessionalProfile(professionalId, {
      featured: featured !== undefined ? featured : professional.featured,
      verified: verified !== undefined ? verified : professional.verified
    });
    
    res.json(updatedProfessional);
  } catch (error) {
    console.error("Error updating professional:", error);
    res.status(500).json({ message: "Failed to update professional" });
  }
}

// Company Profile Management
export async function getAllCompaniesAdmin(req: Request, res: Response) {
  try {
    const companies = Array.from((storage as any).companyProfiles.values());
    res.json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ message: "Failed to fetch companies" });
  }
}

export async function updateCompanyStatus(req: Request, res: Response) {
  try {
    const companyId = parseInt(req.params.id);
    const { featured, verified } = req.body;
    
    const company = await storage.getCompanyProfile(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    
    const updatedCompany = await storage.updateCompanyProfile(companyId, {
      featured: featured !== undefined ? featured : company.featured,
      verified: verified !== undefined ? verified : company.verified
    });
    
    res.json(updatedCompany);
  } catch (error) {
    console.error("Error updating company:", error);
    res.status(500).json({ message: "Failed to update company" });
  }
}

// Resource Management
export async function getAllResourcesAdmin(req: Request, res: Response) {
  try {
    const resources = await storage.getAllResources();
    res.json(resources);
  } catch (error) {
    console.error("Error fetching resources:", error);
    res.status(500).json({ message: "Failed to fetch resources" });
  }
}

export async function updateResourceStatus(req: Request, res: Response) {
  try {
    const resourceId = parseInt(req.params.id);
    const { featured, approved } = req.body;
    
    const resource = await storage.getResource(resourceId);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }
    
    const updatedResource = await storage.updateResource(resourceId, {
      featured: featured !== undefined ? featured : resource.featured,
      approved: approved !== undefined ? approved : resource.approved
    });
    
    res.json(updatedResource);
  } catch (error) {
    console.error("Error updating resource:", error);
    res.status(500).json({ message: "Failed to update resource" });
  }
}

// System Operations
export async function getSystemHealth(req: Request, res: Response) {
  try {
    const health = {
      status: "healthy",
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
      database: "connected" // Placeholder
    };
    
    res.json(health);
  } catch (error) {
    console.error("Error checking system health:", error);
    res.status(500).json({ message: "Failed to check system health" });
  }
}

export async function getAuditLogs(req: Request, res: Response) {
  try {
    // Placeholder for audit logging system
    const logs = [
      {
        id: 1,
        action: "user_created",
        adminId: "system",
        timestamp: new Date(),
        details: "New user registered"
      }
    ];
    
    res.json(logs);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ message: "Failed to fetch audit logs" });
  }
}
