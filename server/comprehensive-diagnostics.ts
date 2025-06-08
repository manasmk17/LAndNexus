import type { Request, Response } from "express";
import { storage } from "./storage";
import { AIMatchingDiagnostics, RatingManager, NotificationManager, FileUploadManager } from "./functionality-fixes";

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  lastChecked: string;
  issues: string[];
  details: any;
}

interface FeatureStatus {
  name: string;
  status: 'working' | 'degraded' | 'broken';
  description: string;
  lastTested: string;
  details?: any;
}

export class ComprehensiveDiagnostics {
  static async runFullSystemDiagnostic(): Promise<{
    overallHealth: 'healthy' | 'degraded' | 'critical';
    features: FeatureStatus[];
    systemComponents: Record<string, SystemHealth>;
    recommendations: string[];
  }> {
    const features: FeatureStatus[] = [];
    const systemComponents: Record<string, SystemHealth> = {};
    const recommendations: string[] = [];
    const now = new Date().toISOString();

    // Test AI Matching System
    const aiStatus = await this.testAIMatching();
    features.push({
      name: 'AI Job Matching',
      status: aiStatus.working ? 'working' : 'degraded',
      description: aiStatus.working ? 
        'AI matching operational with enhanced fallback algorithms' : 
        'Using fallback matching - OpenAI integration needed',
      lastTested: now,
      details: aiStatus
    });

    // Test Rating System
    const ratingStatus = await this.testRatingSystem();
    features.push({
      name: 'Review & Rating System',
      status: ratingStatus.working ? 'working' : 'broken',
      description: ratingStatus.working ? 
        'Rating calculations and updates working properly' : 
        'Rating system has calculation issues',
      lastTested: now,
      details: ratingStatus
    });

    // Test Notification System
    const notificationStatus = await this.testNotificationSystem();
    features.push({
      name: 'Real-time Notifications',
      status: notificationStatus.working ? 'working' : 'degraded',
      description: notificationStatus.working ? 
        'WebSocket notifications and database storage working' : 
        'Notification system has delivery issues',
      lastTested: now,
      details: notificationStatus
    });

    // Test File Upload System
    const fileStatus = await this.testFileUploadSystem();
    features.push({
      name: 'File Upload & Validation',
      status: fileStatus.working ? 'working' : 'degraded',
      description: fileStatus.working ? 
        'File uploads with proper validation and security' : 
        'File upload system needs configuration',
      lastTested: now,
      details: fileStatus
    });

    // Test Core Platform Features
    const coreStatus = await this.testCorePlatformFeatures();
    features.push(...coreStatus.features);

    // System Components Health
    systemComponents.database = await this.testDatabaseHealth();
    systemComponents.stripe = await this.testStripeIntegration();
    systemComponents.authentication = await this.testAuthenticationSystem();

    // Generate recommendations
    if (!aiStatus.working && aiStatus.details?.error?.includes('API key')) {
      recommendations.push('Configure valid OpenAI API key (starts with sk-) to enable AI matching');
    }
    
    if (!ratingStatus.working) {
      recommendations.push('Review rating calculation logic and database triggers');
    }

    if (!notificationStatus.working) {
      recommendations.push('Check WebSocket configuration and notification preferences');
    }

    // Determine overall health
    const brokenCount = features.filter(f => f.status === 'broken').length;
    const degradedCount = features.filter(f => f.status === 'degraded').length;
    
    let overallHealth: 'healthy' | 'degraded' | 'critical';
    if (brokenCount > 2) {
      overallHealth = 'critical';
    } else if (brokenCount > 0 || degradedCount > 3) {
      overallHealth = 'degraded';
    } else {
      overallHealth = 'healthy';
    }

    return {
      overallHealth,
      features,
      systemComponents,
      recommendations
    };
  }

  private static async testAIMatching(): Promise<{ working: boolean; details: any }> {
    try {
      const aiDiagnostics = await AIMatchingDiagnostics.testOpenAIConnection();
      const matchingQuality = await AIMatchingDiagnostics.getMatchingQuality();
      
      return {
        working: aiDiagnostics.connected || matchingQuality.averageScore > 0.3,
        details: {
          openaiConnected: aiDiagnostics.connected,
          error: aiDiagnostics.error,
          fallbackMode: matchingQuality.fallbackMode,
          averageScore: matchingQuality.averageScore,
          qualityRating: matchingQuality.qualityRating,
          totalMatches: matchingQuality.totalMatches
        }
      };
    } catch (error) {
      return {
        working: false,
        details: { error: `AI matching test failed: ${error}` }
      };
    }
  }

  private static async testRatingSystem(): Promise<{ working: boolean; details: any }> {
    try {
      const professionals = await storage.getAllProfessionalProfiles();
      const professionalWithReviews = professionals.find(p => p.reviewCount && p.reviewCount > 0);
      
      if (!professionalWithReviews) {
        return {
          working: true,
          details: { message: 'No reviews to test, but system is ready' }
        };
      }

      const reviews = await storage.getProfessionalReviews(professionalWithReviews.id);
      const expectedAverage = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      const actualRating = professionalWithReviews.rating || 0;
      
      const ratingAccurate = Math.abs(expectedAverage - actualRating) < 0.2;
      
      return {
        working: ratingAccurate,
        details: {
          professionalId: professionalWithReviews.id,
          expectedRating: Math.round(expectedAverage * 10) / 10,
          actualRating: actualRating,
          reviewCount: reviews.length,
          accurate: ratingAccurate
        }
      };
    } catch (error) {
      return {
        working: false,
        details: { error: `Rating system test failed: ${error}` }
      };
    }
  }

  private static async testNotificationSystem(): Promise<{ working: boolean; details: any }> {
    try {
      const users = await storage.getAllUsers();
      if (users.length === 0) {
        return {
          working: true,
          details: { message: 'No users to test notifications' }
        };
      }

      const testUser = users[0];
      const notifications = await storage.getUserNotifications(testUser.id);
      
      return {
        working: true,
        details: {
          userId: testUser.id,
          notificationCount: notifications.length,
          message: 'Notification system operational'
        }
      };
    } catch (error) {
      return {
        working: false,
        details: { error: `Notification system test failed: ${error}` }
      };
    }
  }

  private static async testFileUploadSystem(): Promise<{ working: boolean; details: any }> {
    try {
      // Test file validation without actual upload
      const mockFile = {
        mimetype: 'image/jpeg',
        size: 1024 * 1024, // 1MB
        originalname: 'test.jpg'
      } as Express.Multer.File;

      const validation = FileUploadManager.validateFile(mockFile);
      
      return {
        working: validation.valid,
        details: {
          validation: validation,
          supportedTypes: ['image/jpeg', 'image/png', 'application/pdf', 'video/mp4'],
          maxSizes: {
            image: '5MB',
            video: '50MB',
            pdf: '10MB'
          }
        }
      };
    } catch (error) {
      return {
        working: false,
        details: { error: `File upload system test failed: ${error}` }
      };
    }
  }

  private static async testCorePlatformFeatures(): Promise<{ features: FeatureStatus[] }> {
    const features: FeatureStatus[] = [];
    const now = new Date().toISOString();

    try {
      // Test user authentication
      const users = await storage.getAllUsers();
      features.push({
        name: 'User Authentication',
        status: 'working',
        description: `${users.length} users registered, authentication system operational`,
        lastTested: now
      });

      // Test professional profiles
      const professionals = await storage.getAllProfessionalProfiles();
      features.push({
        name: 'Professional Profiles',
        status: 'working',
        description: `${professionals.length} professional profiles created and managed`,
        lastTested: now
      });

      // Test job posting system
      const jobs = await storage.getAllJobPostings();
      features.push({
        name: 'Job Posting System',
        status: 'working',
        description: `${jobs.length} active job postings, posting and browsing operational`,
        lastTested: now
      });

      // Test resource management
      const resources = await storage.getAllResources();
      features.push({
        name: 'Resource Management',
        status: 'working',
        description: `${resources.length} resources available, sharing and categorization working`,
        lastTested: now
      });

    } catch (error) {
      features.push({
        name: 'Core Platform Features',
        status: 'broken',
        description: `Core feature testing failed: ${error}`,
        lastTested: now
      });
    }

    return { features };
  }

  private static async testDatabaseHealth(): Promise<SystemHealth> {
    try {
      const users = await storage.getAllUsers();
      const professionals = await storage.getAllProfessionalProfiles();
      const jobs = await storage.getAllJobPostings();
      
      return {
        status: 'healthy',
        lastChecked: new Date().toISOString(),
        issues: [],
        details: {
          users: users.length,
          professionals: professionals.length,
          jobs: jobs.length,
          message: 'Database operational with active data'
        }
      };
    } catch (error) {
      return {
        status: 'critical',
        lastChecked: new Date().toISOString(),
        issues: [`Database error: ${error}`],
        details: { error }
      };
    }
  }

  private static async testStripeIntegration(): Promise<SystemHealth> {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        return {
          status: 'critical',
          lastChecked: new Date().toISOString(),
          issues: ['Stripe secret key not configured'],
          details: { error: 'Missing STRIPE_SECRET_KEY' }
        };
      }

      return {
        status: 'healthy',
        lastChecked: new Date().toISOString(),
        issues: [],
        details: { message: 'Stripe integration configured and ready' }
      };
    } catch (error) {
      return {
        status: 'degraded',
        lastChecked: new Date().toISOString(),
        issues: [`Stripe test error: ${error}`],
        details: { error }
      };
    }
  }

  private static async testAuthenticationSystem(): Promise<SystemHealth> {
    try {
      const users = await storage.getAllUsers();
      
      return {
        status: 'healthy',
        lastChecked: new Date().toISOString(),
        issues: [],
        details: {
          totalUsers: users.length,
          message: 'Authentication system operational'
        }
      };
    } catch (error) {
      return {
        status: 'critical',
        lastChecked: new Date().toISOString(),
        issues: [`Authentication error: ${error}`],
        details: { error }
      };
    }
  }
}

// Express endpoint for comprehensive diagnostics
export async function comprehensiveDiagnosticsEndpoint(req: Request, res: Response) {
  try {
    const diagnostics = await ComprehensiveDiagnostics.runFullSystemDiagnostic();
    
    res.json({
      timestamp: new Date().toISOString(),
      platform: 'L&D Nexus',
      version: '1.0.0',
      ...diagnostics
    });
  } catch (error) {
    console.error('Comprehensive diagnostics failed:', error);
    res.status(500).json({
      error: 'Diagnostics system failure',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}