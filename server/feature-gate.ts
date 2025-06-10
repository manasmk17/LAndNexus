import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

// Feature definitions mapped to plan types
export const PLAN_FEATURES = {
  free: {
    maxJobApplications: 5,  // Allow 5 job applications for free users
    maxJobPostings: 1,      // Allow 1 job posting for companies
    maxResourceDownloads: 3,
    maxTeamMembers: 1,
    maxContacts: 10,        // Allow basic networking
    aiMatchingEnabled: true, // Enable basic AI matching for all users
    directMessaging: false,
    videoConsultations: false,
    analyticsAccess: false,
    apiAccess: false,
    featuredPlacement: false,
    customBranding: false,
    whiteLabel: false,
    dedicatedManager: false,
    supportLevel: 'email'
  },
  professional: {
    starter: {
      maxJobApplications: 15,
      maxResourceDownloads: 50,
      maxTeamMembers: 1,
      aiMatchingEnabled: true,
      directMessaging: true,
      supportLevel: 'priority_email'
    },
    expert: {
      maxJobApplications: null, // unlimited
      maxResourceDownloads: null,
      maxTeamMembers: 1,
      aiMatchingEnabled: true,
      directMessaging: true,
      videoConsultations: true,
      analyticsAccess: true,
      featuredPlacement: true,
      supportLevel: 'phone'
    },
    elite: {
      maxJobApplications: null,
      maxResourceDownloads: null,
      maxTeamMembers: 1,
      aiMatchingEnabled: true,
      directMessaging: true,
      videoConsultations: true,
      analyticsAccess: true,
      featuredPlacement: true,
      customBranding: true,
      apiAccess: true,
      whiteLabel: true,
      dedicatedManager: true,
      supportLevel: '24_7'
    }
  },
  company: {
    startup: {
      maxJobPostings: 3,
      maxTeamMembers: 3,
      maxContacts: 100,
      maxResourceDownloads: 100,
      aiMatchingEnabled: true,
      directMessaging: true,
      supportLevel: 'email'
    },
    growth: {
      maxJobPostings: 15,
      maxTeamMembers: 8,
      maxContacts: 500,
      maxResourceDownloads: 500,
      aiMatchingEnabled: true,
      directMessaging: true,
      analyticsAccess: true,
      featuredPlacement: true,
      customBranding: true,
      supportLevel: 'phone'
    },
    enterprise: {
      maxJobPostings: null,
      maxTeamMembers: null,
      maxContacts: null,
      maxResourceDownloads: null,
      aiMatchingEnabled: true,
      directMessaging: true,
      analyticsAccess: true,
      featuredPlacement: true,
      customBranding: true,
      apiAccess: true,
      whiteLabel: true,
      dedicatedManager: true,
      supportLevel: '24_7'
    }
  }
};

// Usage tracking for monthly limits
export class UsageTracker {
  private static instance: UsageTracker;
  private monthlyUsage: Map<string, any> = new Map();

  static getInstance(): UsageTracker {
    if (!UsageTracker.instance) {
      UsageTracker.instance = new UsageTracker();
    }
    return UsageTracker.instance;
  }

  async getMonthlyUsage(userId: number, metric: string): Promise<number> {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const key = `${userId}-${metric}-${currentMonth}`;
    
    if (!this.monthlyUsage.has(key)) {
      // Load from database or initialize to 0
      const usage = await this.loadUsageFromDB(userId, metric, currentMonth);
      this.monthlyUsage.set(key, usage);
    }
    
    return this.monthlyUsage.get(key) || 0;
  }

  async incrementUsage(userId: number, metric: string, amount: number = 1): Promise<number> {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const key = `${userId}-${metric}-${currentMonth}`;
    
    const currentUsage = await this.getMonthlyUsage(userId, metric);
    const newUsage = currentUsage + amount;
    
    this.monthlyUsage.set(key, newUsage);
    await this.saveUsageToDB(userId, metric, currentMonth, newUsage);
    
    return newUsage;
  }

  private async loadUsageFromDB(userId: number, metric: string, month: string): Promise<number> {
    // Implementation would load from a usage_tracking table
    return 0; // Placeholder
  }

  private async saveUsageToDB(userId: number, metric: string, month: string, usage: number): Promise<void> {
    // Implementation would save to a usage_tracking table
  }
}

// Feature gate middleware
export function requireFeature(feature: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const userPlan = await getUserPlanFeatures(req.user.id);
      
      if (!userPlan[feature]) {
        return res.status(403).json({
          error: 'Feature not available',
          feature: feature,
          message: 'Upgrade your plan to access this feature',
          upgradeUrl: '/subscription-plans'
        });
      }

      next();
    } catch (error) {
      console.error('Feature gate error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

// Usage limit middleware
export function requireUsageLimit(metric: string, action: string = 'perform this action') {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const userPlan = await getUserPlanFeatures(req.user.id);
      const usageTracker = UsageTracker.getInstance();
      
      const limit = userPlan[`max${metric.charAt(0).toUpperCase() + metric.slice(1)}`];
      
      if (limit !== null) {
        const currentUsage = await usageTracker.getMonthlyUsage(req.user.id, metric);
        
        if (currentUsage >= limit) {
          return res.status(403).json({
            error: 'Usage limit exceeded',
            metric: metric,
            limit: limit,
            currentUsage: currentUsage,
            message: `You've reached your monthly limit of ${limit} ${metric}. Upgrade to increase your limits.`,
            upgradeUrl: '/subscription-plans'
          });
        }

        // Add usage info to request for potential increment after successful action
        req.usageInfo = { metric, currentUsage, limit };
      }

      next();
    } catch (error) {
      console.error('Usage limit check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

// Helper function to get user's plan features
async function getUserPlanFeatures(userId: number): Promise<any> {
  const user = await storage.getUser(userId);
  if (!user) throw new Error('User not found');

  // Get user's current subscription
  const subscription = await storage.getUserSubscription(userId);
  
  if (!subscription || subscription.status !== 'active') {
    return PLAN_FEATURES.free;
  }

  const planName = subscription.planName.toLowerCase();
  
  // Map plan names to feature sets
  if (planName === 'starter') return PLAN_FEATURES.free;
  if (planName === 'professional') return PLAN_FEATURES.professional.starter;
  if (planName === 'expert') return PLAN_FEATURES.professional.expert;
  if (planName === 'elite') return PLAN_FEATURES.professional.elite;
  if (planName === 'startup') return PLAN_FEATURES.company.startup;
  if (planName === 'growth') return PLAN_FEATURES.company.growth;
  if (planName === 'enterprise') return PLAN_FEATURES.company.enterprise;
  
  return PLAN_FEATURES.free;
}

// Helper function to increment usage after successful action
export async function incrementUserUsage(userId: number, metric: string, amount: number = 1): Promise<void> {
  const usageTracker = UsageTracker.getInstance();
  await usageTracker.incrementUsage(userId, metric, amount);
}

// Helper function to check if user can perform action
export async function canUserPerformAction(userId: number, feature: string, metric?: string): Promise<{
  allowed: boolean;
  reason?: string;
  currentUsage?: number;
  limit?: number;
}> {
  try {
    const userPlan = await getUserPlanFeatures(userId);
    
    // Check feature access
    if (!userPlan[feature]) {
      return {
        allowed: false,
        reason: `Feature '${feature}' not available in your current plan`
      };
    }

    // Check usage limits if metric provided
    if (metric) {
      const limit = userPlan[`max${metric.charAt(0).toUpperCase() + metric.slice(1)}`];
      
      if (limit !== null) {
        const usageTracker = UsageTracker.getInstance();
        const currentUsage = await usageTracker.getMonthlyUsage(userId, metric);
        
        if (currentUsage >= limit) {
          return {
            allowed: false,
            reason: `Monthly limit of ${limit} ${metric} exceeded`,
            currentUsage,
            limit
          };
        }

        return {
          allowed: true,
          currentUsage,
          limit
        };
      }
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error checking user permissions:', error);
    return {
      allowed: false,
      reason: 'Error checking permissions'
    };
  }
}

// Declare global types for Express
declare global {
  namespace Express {
    interface Request {
      usageInfo?: {
        metric: string;
        currentUsage: number;
        limit: number | null;
      };
    }
  }
}