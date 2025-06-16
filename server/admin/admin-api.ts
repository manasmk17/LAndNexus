import { Request, Response } from 'express';
import { storage } from '../storage';

// Dashboard Analytics
export async function getDashboardStats(req: Request, res: Response) {
  try {
    const [
      totalUsers,
      totalJobs,
      totalResources,
      recentActivity
    ] = await Promise.all([
      storage.getUserCount(),
      storage.getJobPostingCount(),
      storage.getResourceCount(),
      storage.getRecentActivity(10)
    ]);

    const usersByType = await storage.getUsersByType();
    const jobsByStatus = await storage.getJobsByStatus();
    const resourcesByCategory = await storage.getResourcesByCategory();

    res.json({
      overview: {
        totalUsers,
        totalJobs,
        totalResources,
        usersByType,
        jobsByStatus,
        resourcesByCategory
      },
      recentActivity
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
}

// User Management
export async function getAllUsers(req: Request, res: Response) {
  try {
    const { page = 1, limit = 20, search = '', userType = '', status = '' } = req.query;
    
    const users = await storage.getUsersWithFilters({
      page: Number(page),
      limit: Number(limit),
      search: search as string,
      userType: userType as string,
      status: status as string
    });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

export async function getUserDetails(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    
    const [user, profile, activity] = await Promise.all([
      storage.getUserById(Number(userId)),
      storage.getUserProfile(Number(userId)),
      storage.getUserActivity(Number(userId))
    ]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: { ...user, password: undefined }, // Remove password from response
      profile,
      activity
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
}

export async function updateUserStatus(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { status, reason } = req.body;
    
    const user = await storage.updateUserStatus(Number(userId), status, reason);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log admin action
    await storage.logAdminAction({
      adminId: (req as any).adminUser.id,
      action: 'UPDATE_USER_STATUS',
      targetId: Number(userId),
      details: { status, reason }
    });

    res.json({ success: true, user: { ...user, password: undefined } });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
}

export async function verifyUser(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { verified, notes } = req.body;
    
    const user = await storage.updateUserVerification(Number(userId), verified, notes);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log admin action
    await storage.logAdminAction({
      adminId: (req as any).adminUser.id,
      action: 'VERIFY_USER',
      targetId: Number(userId),
      details: { verified, notes }
    });

    res.json({ success: true, user: { ...user, password: undefined } });
  } catch (error) {
    console.error('Verify user error:', error);
    res.status(500).json({ error: 'Failed to verify user' });
  }
}

// Content Management
export async function getAllJobPostings(req: Request, res: Response) {
  try {
    const { page = 1, limit = 20, status = '', search = '' } = req.query;
    
    const jobs = await storage.getJobPostingsWithFilters({
      page: Number(page),
      limit: Number(limit),
      status: status as string,
      search: search as string
    });

    res.json(jobs);
  } catch (error) {
    console.error('Get job postings error:', error);
    res.status(500).json({ error: 'Failed to fetch job postings' });
  }
}

export async function moderateJobPosting(req: Request, res: Response) {
  try {
    const { jobId } = req.params;
    const { status, moderationNotes } = req.body;
    
    const job = await storage.moderateJobPosting(Number(jobId), status, moderationNotes);
    
    if (!job) {
      return res.status(404).json({ error: 'Job posting not found' });
    }

    // Log admin action
    await storage.logAdminAction({
      adminId: (req as any).adminUser.id,
      action: 'MODERATE_JOB',
      targetId: Number(jobId),
      details: { status, moderationNotes }
    });

    res.json({ success: true, job });
  } catch (error) {
    console.error('Moderate job posting error:', error);
    res.status(500).json({ error: 'Failed to moderate job posting' });
  }
}

export async function getAllResources(req: Request, res: Response) {
  try {
    const { page = 1, limit = 20, status = '', categoryId = '' } = req.query;
    
    const resources = await storage.getResourcesWithFilters({
      page: Number(page),
      limit: Number(limit),
      status: status as string,
      categoryId: categoryId ? Number(categoryId) : undefined
    });

    res.json(resources);
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
}

export async function moderateResource(req: Request, res: Response) {
  try {
    const { resourceId } = req.params;
    const { status, moderationNotes, featured } = req.body;
    
    const resource = await storage.moderateResource(
      Number(resourceId), 
      status, 
      moderationNotes, 
      featured
    );
    
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    // Log admin action
    await storage.logAdminAction({
      adminId: (req as any).adminUser.id,
      action: 'MODERATE_RESOURCE',
      targetId: Number(resourceId),
      details: { status, moderationNotes, featured }
    });

    res.json({ success: true, resource });
  } catch (error) {
    console.error('Moderate resource error:', error);
    res.status(500).json({ error: 'Failed to moderate resource' });
  }
}

// Financial Management
export async function getFinancialOverview(req: Request, res: Response) {
  try {
    const { period = '30' } = req.query;
    
    const [revenue, subscriptions, transactions] = await Promise.all([
      storage.getRevenueData(Number(period)),
      storage.getSubscriptionStats(),
      storage.getRecentTransactions(20)
    ]);

    res.json({
      revenue,
      subscriptions,
      transactions
    });
  } catch (error) {
    console.error('Financial overview error:', error);
    res.status(500).json({ error: 'Failed to fetch financial data' });
  }
}

export async function getSubscriptionManagement(req: Request, res: Response) {
  try {
    const { page = 1, limit = 20, status = '' } = req.query;
    
    const subscriptions = await storage.getSubscriptionsWithFilters({
      page: Number(page),
      limit: Number(limit),
      status: status as string
    });

    res.json(subscriptions);
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
}

// System Settings
export async function getSystemSettings(req: Request, res: Response) {
  try {
    const settings = await storage.getSystemSettings();
    res.json(settings);
  } catch (error) {
    console.error('Get system settings error:', error);
    res.status(500).json({ error: 'Failed to fetch system settings' });
  }
}

export async function updateSystemSettings(req: Request, res: Response) {
  try {
    const settings = req.body;
    
    const updatedSettings = await storage.updateSystemSettings(settings);
    
    // Log admin action
    await storage.logAdminAction({
      adminId: (req as any).adminUser.id,
      action: 'UPDATE_SYSTEM_SETTINGS',
      targetId: null,
      details: settings
    });

    res.json({ success: true, settings: updatedSettings });
  } catch (error) {
    console.error('Update system settings error:', error);
    res.status(500).json({ error: 'Failed to update system settings' });
  }
}

// Admin Activity Logs
export async function getAdminLogs(req: Request, res: Response) {
  try {
    const { page = 1, limit = 50, action = '', adminId = '' } = req.query;
    
    const logs = await storage.getAdminLogs({
      page: Number(page),
      limit: Number(limit),
      action: action as string,
      adminId: adminId ? Number(adminId) : undefined
    });

    res.json(logs);
  } catch (error) {
    console.error('Get admin logs error:', error);
    res.status(500).json({ error: 'Failed to fetch admin logs' });
  }
}