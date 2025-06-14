import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import { eq, and, desc, asc, like, ilike, inArray, sql, count } from "drizzle-orm";
import * as schema from "../shared/schema";
import {
  User, InsertUser,
  ProfessionalProfile, InsertProfessionalProfile,
  CompanyProfile, InsertCompanyProfile,
  JobPosting, InsertJobPosting,
  JobApplication, InsertJobApplication,
  Expertise, InsertExpertise,
  Certification, InsertCertification,
  Resource, InsertResource,
  Review, InsertReview,
  Notification, InsertNotification,
  NotificationType, InsertNotificationType,
  NotificationPreference, InsertNotificationPreference,
  SubscriptionPlan,
  Message, InsertMessage,
  Conversation, InsertConversation,
  AuthToken, InsertAuthToken,
  Match, InsertMatch,
  ResourceCategory, InsertResourceCategory
} from "../shared/schema";

export interface IStorage {
  // User operations
  createUser(user: InsertUser): Promise<User>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  searchUsers(query: string): Promise<User[]>;

  // Professional Profile operations
  getProfessionalProfile(id: number): Promise<ProfessionalProfile | undefined>;
  getProfessionalProfileByUserId(userId: number): Promise<ProfessionalProfile | undefined>;
  createProfessionalProfile(profile: InsertProfessionalProfile): Promise<ProfessionalProfile>;
  updateProfessionalProfile(id: number, updates: Partial<ProfessionalProfile>): Promise<ProfessionalProfile | undefined>;
  deleteProfessionalProfile(id: number): Promise<boolean>;
  getAllProfessionalProfiles(): Promise<ProfessionalProfile[]>;
  getFeaturedProfessionalProfiles(): Promise<ProfessionalProfile[]>;
  searchProfessionalProfiles(query: string): Promise<ProfessionalProfile[]>;

  // Company Profile operations
  getCompanyProfile(id: number): Promise<CompanyProfile | undefined>;
  getCompanyProfileByUserId(userId: number): Promise<CompanyProfile | undefined>;
  createCompanyProfile(profile: InsertCompanyProfile): Promise<CompanyProfile>;
  updateCompanyProfile(id: number, updates: Partial<CompanyProfile>): Promise<CompanyProfile | undefined>;
  deleteCompanyProfile(id: number): Promise<boolean>;
  getAllCompanyProfiles(): Promise<CompanyProfile[]>;
  searchCompanyProfiles(query: string): Promise<CompanyProfile[]>;

  // Job Posting operations
  getJobPosting(id: number): Promise<JobPosting | undefined>;
  createJobPosting(jobPosting: InsertJobPosting): Promise<JobPosting>;
  updateJobPosting(id: number, updates: Partial<JobPosting>): Promise<JobPosting | undefined>;
  deleteJobPosting(id: number): Promise<boolean>;
  getAllJobPostings(): Promise<JobPosting[]>;
  getJobPostingsByCompanyId(companyId: number): Promise<JobPosting[]>;
  searchJobPostings(query: string): Promise<JobPosting[]>;
  getLatestJobPostings(limit?: number): Promise<JobPosting[]>;

  // Job Application operations
  getJobApplication(id: number): Promise<JobApplication | undefined>;
  createJobApplication(application: InsertJobApplication): Promise<JobApplication>;
  updateJobApplication(id: number, updates: Partial<JobApplication>): Promise<JobApplication | undefined>;
  deleteJobApplication(id: number): Promise<boolean>;
  getJobApplicationsByJobId(jobId: number): Promise<JobApplication[]>;
  getJobApplicationsByUserId(userId: number): Promise<JobApplication[]>;

  // Expertise operations
  getAllExpertise(): Promise<Expertise[]>;
  createExpertise(expertise: InsertExpertise): Promise<Expertise>;
  getExpertiseByProfessionalId(professionalId: number): Promise<Expertise[]>;
  addExpertiseToProfessional(professionalId: number, expertiseId: number): Promise<void>;
  removeExpertiseFromProfessional(professionalId: number, expertiseId: number): Promise<void>;

  // Certification operations
  getAllCertifications(): Promise<Certification[]>;
  createCertification(certification: InsertCertification): Promise<Certification>;
  getCertificationsByProfessionalId(professionalId: number): Promise<Certification[]>;

  // Resource operations
  getResource(id: number): Promise<Resource | undefined>;
  createResource(resource: InsertResource): Promise<Resource>;
  updateResource(id: number, updates: Partial<Resource>): Promise<Resource | undefined>;
  deleteResource(id: number): Promise<boolean>;
  getAllResources(): Promise<Resource[]>;
  getResourcesByAuthorId(authorId: number): Promise<Resource[]>;
  searchResources(query?: string, type?: string, categoryId?: number): Promise<Resource[]>;
  getFeaturedResources(): Promise<Resource[]>;

  // Review operations
  getReview(id: number): Promise<Review | undefined>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: number, updates: Partial<Review>): Promise<Review | undefined>;
  deleteReview(id: number): Promise<boolean>;
  getReviewsByProfessionalId(professionalId: number): Promise<Review[]>;
  getReviewsByCompanyId(companyId: number): Promise<Review[]>;
  getReviewByConsultationId(consultationId: number): Promise<Review | undefined>;

  // Notification operations
  getNotification(id: number): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  updateNotification(id: number, updates: Partial<Notification>): Promise<Notification | undefined>;
  deleteNotification(id: number): Promise<boolean>;
  getNotificationsByUserId(userId: number): Promise<Notification[]>;
  getUnreadNotificationsByUserId(userId: number): Promise<Notification[]>;

  // Notification Type operations
  getAllNotificationTypes(): Promise<NotificationType[]>;
  createNotificationType(type: InsertNotificationType): Promise<NotificationType>;

  // Notification Preference operations
  getNotificationPreferences(userId: number): Promise<NotificationPreference[]>;
  upsertNotificationPreference(preference: InsertNotificationPreference): Promise<NotificationPreference>;

  // Subscription operations
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getUserSubscription(userId: number): Promise<any>;
  updateUserSubscription(userId: number, tier: string, status: string): Promise<User | undefined>;
  updateUserSubscription(userId: number, subscriptionData: any): Promise<User | undefined>;

  // Message operations
  getMessage(id: number): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByConversationId(conversationId: number): Promise<Message[]>;

  // Conversation operations
  getConversation(id: number): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversationsByUserId(userId: number): Promise<Conversation[]>;

  // Auth Token operations
  createAuthToken(token: InsertAuthToken): Promise<AuthToken>;
  getAuthToken(token: string): Promise<AuthToken | undefined>;
  revokeAuthToken(token: string): Promise<boolean>;
  revokeAllUserTokens(userId: number): Promise<boolean>;
  cleanupExpiredTokens(): Promise<number>;

  // Match operations
  createMatch(match: InsertMatch): Promise<Match>;
  getMatchesByUserId(userId: number): Promise<Match[]>;

  // Resource Category operations
  getAllResourceCategories(): Promise<ResourceCategory[]>;
  createResourceCategory(category: InsertResourceCategory): Promise<ResourceCategory>;

  // AI and Matching operations
  findMatchingJobsForProfessional(professionalId: number): Promise<JobPosting[]>;
  findMatchingProfessionalsForJob(jobId: number): Promise<ProfessionalProfile[]>;
  updateProfessionalRating(professionalId: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users = new Map<number, User>();
  private professionalProfiles = new Map<number, ProfessionalProfile>();
  private companyProfiles = new Map<number, CompanyProfile>();
  private jobPostings = new Map<number, JobPosting>();
  private jobApplications = new Map<number, JobApplication>();
  private expertise = new Map<number, Expertise>();
  private certifications = new Map<number, Certification>();
  private resources = new Map<number, Resource>();
  private reviews = new Map<number, Review>();
  private notifications = new Map<number, Notification>();
  private notificationTypes = new Map<number, NotificationType>();
  private notificationPreferences = new Map<number, NotificationPreference>();
  private messages = new Map<number, Message>();
  private conversations = new Map<number, Conversation>();
  private authTokens = new Map<string, AuthToken>();
  private matches = new Map<number, Match>();
  private resourceCategories = new Map<number, ResourceCategory>();

  // Professional-Expertise junction
  private professionalExpertise = new Map<number, Set<number>>();

  // Auto-incrementing IDs
  private userId = 1;
  private professionalProfileId = 1;
  private companyProfileId = 1;
  private jobPostingId = 1;
  private jobApplicationId = 1;
  private expertiseId = 1;
  private certificationId = 1;
  private resourceId = 1;
  private reviewId = 1;
  private notificationId = 1;
  private notificationTypeId = 1;
  private notificationPreferenceId = 1;
  private messageId = 1;
  private conversationId = 1;
  private matchId = 1;
  private resourceCategoryId = 1;

  // Cache for expensive operations
  private queryCache = new Map<string, { data: any; timestamp: number }>();
  private matchCache = new Map<string, { matches: any[]; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.initializeData();
    // Clean up cache periodically
    setInterval(() => this.cleanupExpiredCache(), 60000); // Every minute
  }

  private initializeData(): void {
    // Initialize with sample data
    this.createSampleData();
  }

  private cacheResult(key: string, data: any): void {
    this.queryCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private getCachedResult(key: string): any {
    const cached = this.queryCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  private cleanupExpiredCache(): void {
    const now = Date.now();
    const entries = Array.from(this.queryCache.entries());
    for (const [key, cached] of entries) {
      if (now - cached.timestamp > this.CACHE_TTL) {
        this.queryCache.delete(key);
      }
    }
  }

  private invalidateCache(pattern?: string): void {
    if (pattern) {
      // Invalidate specific cache entries
      const keys = Array.from(this.queryCache.keys());
      for (const key of keys) {
        if (key.includes(pattern)) {
          this.queryCache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.queryCache.clear();
    }

    // Also clear match cache
    this.matchCache.clear();
  }

  // User operations
  async createUser(user: InsertUser): Promise<User> {
    const id = this.userId++;
    const newUser: User = {
      ...user,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null,
      emailVerified: false,
      phoneVerified: false,
      profilePictureUrl: null,
      bio: null,
      website: null,
      linkedinUrl: null,
      subscriptionTier: 'free',
      subscriptionStatus: 'active',
      resetToken: null,
      resetTokenExpiry: null
    };
    this.users.set(id, newUser);
    this.invalidateCache('user');
    return newUser;
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const existing = this.users.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...userData, updatedAt: new Date() };
    this.users.set(id, updated);
    this.invalidateCache('user');
    return updated;
  }

  async deleteUser(id: number): Promise<boolean> {
    const deleted = this.users.delete(id);
    if (deleted) {
      this.invalidateCache('user');
    }
    return deleted;
  }

  async getAllUsers(): Promise<User[]> {
    const cacheKey = 'all_users';
    const cached = this.getCachedResult(cacheKey);
    if (cached) return cached;

    const users = Array.from(this.users.values());
    this.cacheResult(cacheKey, users);
    return users;
  }

  async searchUsers(query: string): Promise<User[]> {
    const cacheKey = `search_users_${query}`;
    const cached = this.getCachedResult(cacheKey);
    if (cached) return cached;

    const users = Array.from(this.users.values()).filter(user =>
      user.username.toLowerCase().includes(query.toLowerCase()) ||
      user.email.toLowerCase().includes(query.toLowerCase()) ||
      user.firstName.toLowerCase().includes(query.toLowerCase()) ||
      user.lastName.toLowerCase().includes(query.toLowerCase())
    );

    this.cacheResult(cacheKey, users);
    return users;
  }

  // Professional Profile operations
  async getProfessionalProfile(id: number): Promise<ProfessionalProfile | undefined> {
    const profile = this.professionalProfiles.get(id);
    if (!profile) return undefined;

    // Parse JSON fields if they're strings
    const parsedProfile = { ...profile };
    if (typeof parsedProfile.galleryImages === 'string') {
      try {
        parsedProfile.galleryImages = JSON.parse(parsedProfile.galleryImages as string);
      } catch (e) {
        parsedProfile.galleryImages = [];
      }
    }

    if (typeof parsedProfile.workExperience === 'string') {
      try {
        parsedProfile.workExperience = JSON.parse(parsedProfile.workExperience as string);
      } catch (e) {
        parsedProfile.workExperience = [];
      }
    }

    if (typeof parsedProfile.testimonials === 'string') {
      try {
        parsedProfile.testimonials = JSON.parse(parsedProfile.testimonials as string);
      } catch (e) {
        parsedProfile.testimonials = [];
      }
    }

    return parsedProfile;
  }

  async getProfessionalProfileByUserId(userId: number): Promise<ProfessionalProfile | undefined> {
    return Array.from(this.professionalProfiles.values())
      .find(profile => profile.userId === userId);
  }

  async createProfessionalProfile(profile: InsertProfessionalProfile): Promise<ProfessionalProfile> {
    const id = this.professionalProfileId++;

    // Serialize JSON fields if they're arrays
    const processedProfile = { ...profile };
    if (Array.isArray(processedProfile.galleryImages)) {
      processedProfile.galleryImages = JSON.stringify(processedProfile.galleryImages) as any;
    }

    if (Array.isArray(processedProfile.workExperience)) {
      processedProfile.workExperience = JSON.stringify(processedProfile.workExperience) as any;
    }

    if (Array.isArray(processedProfile.testimonials)) {
      processedProfile.testimonials = JSON.stringify(processedProfile.testimonials) as any;
    }

    const newProfile: ProfessionalProfile = {
      ...processedProfile,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as ProfessionalProfile;

    this.professionalProfiles.set(id, newProfile);
    this.invalidateCache('professional');

    return newProfile;
  }

  async updateProfessionalProfile(id: number, updates: Partial<ProfessionalProfile>): Promise<ProfessionalProfile | undefined> {
    const profile = this.professionalProfiles.get(id);
    if (!profile) {
      throw new Error("Professional profile not found");
    }

    // Serialize JSON fields if they're arrays
    if (updates.galleryImages && Array.isArray(updates.galleryImages)) {
      updates.galleryImages = JSON.stringify(updates.galleryImages) as any;
    }

    if (updates.workExperience && Array.isArray(updates.workExperience)) {
      updates.workExperience = JSON.stringify(updates.workExperience) as any;
    }

    if (updates.testimonials && Array.isArray(updates.testimonials)) {
      updates.testimonials = JSON.stringify(updates.testimonials) as any;
    }

    const updatedProfile = { ...profile, ...updates, updatedAt: new Date().toISOString() };
    this.professionalProfiles.set(id, updatedProfile);
    return updatedProfile;
  }

  async deleteProfessionalProfile(id: number): Promise<boolean> {
    return this.professionalProfiles.delete(id);
  }

  // Expertise operations
  async getAllExpertise(): Promise<Expertise[]> {
    return Array.from(this.expertise.values());
  }

  async createExpertise(expertise: InsertExpertise): Promise<Expertise> {
    const id = this.expertiseId++;
    const newExpertise: Expertise = { ...expertise, id };
    this.expertise.set(id, newExpertise);
    return newExpertise;
  }

  async getExpertiseByProfessionalId(professionalId: number): Promise<Expertise[]> {
    const expertiseIds = this.professionalExpertise.get(professionalId) || new Set();
    return Array.from(expertiseIds).map(id => this.expertise.get(id)!).filter(Boolean);
  }

  async addExpertiseToProfessional(professionalId: number, expertiseId: number): Promise<void> {
    if (!this.professionalExpertise.has(professionalId)) {
      this.professionalExpertise.set(professionalId, new Set());
    }
    this.professionalExpertise.get(professionalId)!.add(expertiseId);
  }

  async removeExpertiseFromProfessional(professionalId: number, expertiseId: number): Promise<void> {
    const expertiseIds = this.professionalExpertise.get(professionalId);
    if (expertiseIds) {
      expertiseIds.delete(expertiseId);
    }
  }

  // Continue with remaining method implementations...
  async getAllProfessionalProfiles(): Promise<ProfessionalProfile[]> {
    return Array.from(this.professionalProfiles.values());
  }

  async getFeaturedProfessionalProfiles(): Promise<ProfessionalProfile[]> {
    return Array.from(this.professionalProfiles.values())
      .filter(profile => profile.featured)
      .slice(0, 6);
  }

  async searchProfessionalProfiles(query: string): Promise<ProfessionalProfile[]> {
    return Array.from(this.professionalProfiles.values()).filter(profile =>
      profile.title?.toLowerCase().includes(query.toLowerCase()) ||
      profile.bio?.toLowerCase().includes(query.toLowerCase()) ||
      profile.location?.toLowerCase().includes(query.toLowerCase())
    );
  }

  // Subscription operations
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    // Return hardcoded subscription plans for in-memory storage
    return [
      {
        id: 21,
        name: "Starter",
        description: null,
        priceMonthlyUSD: 0,
        priceYearlyUSD: 0,
        features: {},
        planType: "free" as const,
        createdAt: new Date(),
        isActive: true,
        featuredJobsLimit: null,
        prioritySupportAccess: false,
        customBrandingAccess: false,
        advancedAnalyticsAccess: false,
        bulkJobPostingAccess: false,
        resumeDatabaseAccess: false,
        professionalNetworkingAccess: false,
        exclusiveContentAccess: false,
        earlyAccessToFeatures: false,
        dedicatedAccountManager: false,
        videoInterviewingAccess: false,
        aiRecommendationsAccess: false,
        customIntegrationsAccess: false,
        priorityCustomerSupport: false,
        advancedReportingAccess: false,
        teamCollaborationAccess: false,
        premiumResourceAccess: false,
        mentorshipProgramAccess: false,
        certificationProgramAccess: false,
        exclusiveEventsAccess: false,
        sortOrder: 1
      }
    ];
  }

  async getUserSubscription(userId: number): Promise<any> {
    const user = this.users.get(userId);
    return user ? {
      tier: user.subscriptionTier,
      status: user.subscriptionStatus
    } : null;
  }

  async updateUserSubscription(userId: number, tier: string, status: string): Promise<User | undefined>;
  async updateUserSubscription(userId: number, subscriptionData: any): Promise<User | undefined>;
  async updateUserSubscription(userId: number, tierOrData: string | any, status?: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;

    if (typeof tierOrData === 'string' && status) {
      // Legacy signature
      const updated = { ...user, subscriptionTier: tierOrData, subscriptionStatus: status };
      this.users.set(userId, updated);
      return updated;
    } else {
      // New signature with subscription data object
      const updated = { ...user, ...tierOrData };
      this.users.set(userId, updated);
      return updated;
    }
  }

  // Stub implementations for remaining methods
  async getCompanyProfile(id: number): Promise<CompanyProfile | undefined> {
    return this.companyProfiles.get(id);
  }

  async getCompanyProfileByUserId(userId: number): Promise<CompanyProfile | undefined> {
    return Array.from(this.companyProfiles.values())
      .find(profile => profile.userId === userId);
  }

  async createCompanyProfile(profile: InsertCompanyProfile): Promise<CompanyProfile> {
    const id = this.companyProfileId++;
    const newProfile: CompanyProfile = {
      ...profile,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as CompanyProfile;
    this.companyProfiles.set(id, newProfile);
    return newProfile;
  }

  async updateCompanyProfile(id: number, updates: Partial<CompanyProfile>): Promise<CompanyProfile | undefined> {
    const profile = this.companyProfiles.get(id);
    if (!profile) return undefined;
    const updated = { ...profile, ...updates, updatedAt: new Date().toISOString() };
    this.companyProfiles.set(id, updated);
    return updated;
  }

  async deleteCompanyProfile(id: number): Promise<boolean> {
    return this.companyProfiles.delete(id);
  }

  async getAllCompanyProfiles(): Promise<CompanyProfile[]> {
    return Array.from(this.companyProfiles.values());
  }

  async searchCompanyProfiles(query: string): Promise<CompanyProfile[]> {
    return Array.from(this.companyProfiles.values()).filter(profile =>
      profile.companyName.toLowerCase().includes(query.toLowerCase()) ||
      (profile.description && profile.description.toLowerCase().includes(query.toLowerCase()))
    );
  }

  async getJobPosting(id: number): Promise<JobPosting | undefined> {
    return this.jobPostings.get(id);
  }

  async createJobPosting(jobPosting: InsertJobPosting): Promise<JobPosting> {
    const id = this.jobPostingId++;
    const newJobPosting: JobPosting = {
      ...jobPosting,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    } as JobPosting;
    this.jobPostings.set(id, newJobPosting);
    return newJobPosting;
  }

  async updateJobPosting(id: number, updates: Partial<JobPosting>): Promise<JobPosting | undefined> {
    const jobPosting = this.jobPostings.get(id);
    if (!jobPosting) return undefined;
    const updated = { ...jobPosting, ...updates, updatedAt: new Date() };
    this.jobPostings.set(id, updated);
    return updated;
  }

  async deleteJobPosting(id: number): Promise<boolean> {
    return this.jobPostings.delete(id);
  }

  async getAllJobPostings(): Promise<JobPosting[]> {
    return Array.from(this.jobPostings.values());
  }

  async getJobPostingsByCompanyId(companyId: number): Promise<JobPosting[]> {
    return Array.from(this.jobPostings.values())
      .filter(job => job.companyId === companyId);
  }

  async searchJobPostings(query: string): Promise<JobPosting[]> {
    return Array.from(this.jobPostings.values()).filter(job =>
      job.title.toLowerCase().includes(query.toLowerCase()) ||
      job.description.toLowerCase().includes(query.toLowerCase())
    );
  }

  async getLatestJobPostings(limit = 10): Promise<JobPosting[]> {
    return Array.from(this.jobPostings.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  // Implement remaining stub methods...
  async getJobApplication(id: number): Promise<JobApplication | undefined> {
    return this.jobApplications.get(id);
  }

  async createJobApplication(application: InsertJobApplication): Promise<JobApplication> {
    const id = this.jobApplicationId++;
    const newApplication: JobApplication = {
      ...application,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    } as JobApplication;
    this.jobApplications.set(id, newApplication);
    return newApplication;
  }

  async updateJobApplication(id: number, updates: Partial<JobApplication>): Promise<JobApplication | undefined> {
    const application = this.jobApplications.get(id);
    if (!application) return undefined;
    const updated = { ...application, ...updates, updatedAt: new Date() };
    this.jobApplications.set(id, updated);
    return updated;
  }

  async deleteJobApplication(id: number): Promise<boolean> {
    return this.jobApplications.delete(id);
  }

  async getJobApplicationsByJobId(jobId: number): Promise<JobApplication[]> {
    return Array.from(this.jobApplications.values())
      .filter(app => app.jobId === jobId);
  }

  async getJobApplicationsByUserId(userId: number): Promise<JobApplication[]> {
    return Array.from(this.jobApplications.values())
      .filter(app => app.userId === userId);
  }

  async getAllCertifications(): Promise<Certification[]> {
    return Array.from(this.certifications.values());
  }

  async createCertification(certification: InsertCertification): Promise<Certification> {
    const id = this.certificationId++;
    const newCertification: Certification = { ...certification, id };
    this.certifications.set(id, newCertification);
    return newCertification;
  }

  async getCertificationsByProfessionalId(professionalId: number): Promise<Certification[]> {
    return Array.from(this.certifications.values())
      .filter(cert => cert.professionalId === professionalId);
  }

  async getResource(id: number): Promise<Resource | undefined> {
    return this.resources.get(id);
  }

  async createResource(resource: InsertResource): Promise<Resource> {
    const id = this.resourceId++;
    const newResource: Resource = {
      ...resource,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    } as Resource;
    this.resources.set(id, newResource);
    return newResource;
  }

  async updateResource(id: number, updates: Partial<Resource>): Promise<Resource | undefined> {
    const resource = this.resources.get(id);
    if (!resource) return undefined;
    const updated = { ...resource, ...updates, updatedAt: new Date() };
    this.resources.set(id, updated);
    return updated;
  }

  async deleteResource(id: number): Promise<boolean> {
    return this.resources.delete(id);
  }

  async getAllResources(): Promise<Resource[]> {
    return Array.from(this.resources.values());
  }

  async getResourcesByAuthorId(authorId: number): Promise<Resource[]> {
    return Array.from(this.resources.values())
      .filter(resource => resource.authorId === authorId);
  }

  async searchResources(query?: string, type?: string, categoryId?: number): Promise<Resource[]> {
    let results = Array.from(this.resources.values());

    if (query) {
      results = results.filter(resource =>
        resource.title.toLowerCase().includes(query.toLowerCase()) ||
        resource.description?.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (type) {
      results = results.filter(resource => resource.type === type);
    }

    if (categoryId) {
      results = results.filter(resource => resource.categoryId === categoryId);
    }

    return results;
  }

  async getFeaturedResources(): Promise<Resource[]> {
    return Array.from(this.resources.values())
      .filter(resource => resource.featured)
      .slice(0, 6);
  }

  async getReview(id: number): Promise<Review | undefined> {
    return this.reviews.get(id);
  }

  async createReview(review: InsertReview): Promise<Review> {
    const id = this.reviewId++;
    const newReview: Review = {
      ...review,
      id,
      createdAt: new Date(),
      consultationId: review.consultationId ?? null,
      comment: review.comment ?? null,
      isPublic: review.isPublic ?? null
    };
    this.reviews.set(id, newReview);

    // Update the professional's rating
    await this.updateProfessionalRating(review.professionalId);

    return newReview;
  }

  async updateReview(id: number, updates: Partial<Review>): Promise<Review | undefined> {
    const review = this.reviews.get(id);
    if (!review) return undefined;
    const updated = { ...review, ...updates };
    this.reviews.set(id, updated);
    return updated;
  }

  async deleteReview(id: number): Promise<boolean> {
    return this.reviews.delete(id);
  }

  async getReviewsByProfessionalId(professionalId: number): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .filter(review => review.professionalId === professionalId);
  }

  async getReviewsByCompanyId(companyId: number): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .filter(review => review.companyId === companyId);
  }

  async getReviewByConsultationId(consultationId: number): Promise<Review | undefined> {
    return Array.from(this.reviews.values())
      .find(review => review.consultationId === consultationId);
  }

  async getAllNotificationTypes(): Promise<NotificationType[]> {
    return Array.from(this.notificationTypes.values());
  }

  async createNotificationType(type: InsertNotificationType): Promise<NotificationType> {
    const id = this.notificationTypeId++;
    const newType: NotificationType = {
      ...type,
      id,
      description: type.description ?? null
    };
    this.notificationTypes.set(id, newType);
    return newType;
  }

  async getNotification(id: number): Promise<Notification | undefined> {
    return this.notifications.get(id);
  }

  async updateNotification(id: number, updates: Partial<Notification>): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    const updated = { ...notification, ...updates };
    this.notifications.set(id, updated);
    return updated;
  }

  async deleteNotification(id: number): Promise<boolean> {
    return this.notifications.delete(id);
  }

  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getUnreadNotificationsByUserId(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId && !notification.read)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = this.notificationId++;
    const newNotification: Notification = {
      ...notification,
      id,
      read: false,
      createdAt: new Date(),
      link: notification.link ?? null
    };
    this.notifications.set(id, newNotification);
    return newNotification;
  }

  async getNotificationPreferences(userId: number): Promise<NotificationPreference[]> {
    return Array.from(this.notificationPreferences.values())
      .filter(pref => pref.userId === userId);
  }

  async upsertNotificationPreference(preference: InsertNotificationPreference): Promise<NotificationPreference> {
    // Check if preference already exists
    const existing = Array.from(this.notificationPreferences.values())
      .find(pref => pref.userId === preference.userId && pref.typeId === preference.typeId);

    if (existing) {
      // Update existing preference
      const updated = { ...existing, ...preference };
      this.notificationPreferences.set(existing.id, updated);
      return updated;
    } else {
      // Create new preference
      const id = this.notificationPreferenceId++;
      const newPreference: NotificationPreference = {
        ...preference,
        id,
        email: preference.email ?? null,
        inApp: preference.inApp ?? null
      };
      this.notificationPreferences.set(id, newPreference);
      return newPreference;
    }
  }

  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.messageId++;
    const newMessage: Message = {
      ...message,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    } as Message;
    this.messages.set(id, newMessage);
    return newMessage;
  }

  async getMessagesByConversationId(conversationId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.conversationId === conversationId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const id = this.conversationId++;
    const newConversation: Conversation = {
      ...conversation,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    } as Conversation;
    this.conversations.set(id, newConversation);
    return newConversation;
  }

  async getConversationsByUserId(userId: number): Promise<Conversation[]> {
    return Array.from(this.conversations.values())
      .filter(conversation => 
        conversation.participant1Id === userId || conversation.participant2Id === userId
      );
  }

  async createAuthToken(token: InsertAuthToken): Promise<AuthToken> {
    const newToken: AuthToken = {
      ...token,
      id: Date.now(), // Simple ID generation
      createdAt: new Date(),
      lastUsedAt: null,
      isRevoked: false
    };
    this.authTokens.set(token.token, newToken);
    return newToken;
  }

  async getAuthToken(token: string): Promise<AuthToken | undefined> {
    return this.authTokens.get(token);
  }

  async revokeAuthToken(token: string): Promise<boolean> {
    const authToken = this.authTokens.get(token);
    if (authToken) {
      authToken.isRevoked = true;
      this.authTokens.set(token, authToken);
      return true;
    }
    return false;
  }

  async revokeAllUserTokens(userId: number): Promise<boolean> {
    const entries = Array.from(this.authTokens.entries());
    for (const [token, authToken] of entries) {
      if (authToken.userId === userId) {
        authToken.isRevoked = true;
        this.authTokens.set(token, authToken);
      }
    }
    return true;
  }

  async cleanupExpiredTokens(): Promise<number> {
    const now = new Date();
    let cleanedCount = 0;

    const entries = Array.from(this.authTokens.entries());
    for (const [token, authToken] of entries) {
      if (authToken.expiresAt < now || authToken.isRevoked) {
        this.authTokens.delete(token);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  async createMatch(match: InsertMatch): Promise<Match> {
    const id = this.matchId++;
    const newMatch: Match = {
      ...match,
      id,
      createdAt: new Date()
    } as Match;
    this.matches.set(id, newMatch);
    return newMatch;
  }

  async getMatchesByUserId(userId: number): Promise<Match[]> {
    return Array.from(this.matches.values())
      .filter(match => match.userId === userId);
  }

  async getAllResourceCategories(): Promise<ResourceCategory[]> {
    return Array.from(this.resourceCategories.values());
  }

  async createResourceCategory(category: InsertResourceCategory): Promise<ResourceCategory> {
    const id = this.resourceCategoryId++;
    const newCategory: ResourceCategory = { ...category, id };
    this.resourceCategories.set(id, newCategory);
    return newCategory;
  }

  async findMatchingJobsForProfessional(professionalId: number): Promise<JobPosting[]> {
    // Simple matching algorithm based on expertise
    const professional = await this.getProfessionalProfile(professionalId);
    if (!professional) return [];

    const expertise = await this.getExpertiseByProfessionalId(professionalId);
    const expertiseNames = expertise.map(e => e.name.toLowerCase());

    return Array.from(this.jobPostings.values())
      .filter(job => 
        expertiseNames.some(name => 
          job.title.toLowerCase().includes(name) ||
          job.description.toLowerCase().includes(name)
        )
      )
      .slice(0, 10);
  }

  async findMatchingProfessionalsForJob(jobId: number): Promise<ProfessionalProfile[]> {
    const job = await this.getJobPosting(jobId);
    if (!job) return [];

    const allProfessionals = await this.getAllProfessionalProfiles();
    
    return allProfessionals.filter(professional => {
      return professional.title?.toLowerCase().includes(job.title.toLowerCase()) ||
             professional.bio?.toLowerCase().includes(job.title.toLowerCase());
    }).slice(0, 10);
  }

  async updateProfessionalRating(professionalId: number): Promise<void> {
    const reviews = await this.getReviewsByProfessionalId(professionalId);
    if (reviews.length === 0) return;

    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    
    const professional = this.professionalProfiles.get(professionalId);
    if (professional) {
      professional.rating = Math.round(averageRating * 10) / 10; // Round to 1 decimal place
      this.professionalProfiles.set(professionalId, professional);
    }
  }

  private createSampleData(): void {
    // Create sample data for testing
    // This would be populated with actual sample data in a real implementation
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  private db: any = null;

  constructor() {
    this.initializeDatabase();
  }

  private async initializeDatabase() {
    try {
      if (!process.env.DATABASE_URL) {
        console.warn("DATABASE_URL not found, falling back to in-memory storage");
        return;
      }

      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      this.db = drizzle(pool, { schema });
      console.log("Database connection established");
    } catch (error) {
      console.error("Failed to initialize database:", error);
    }
  }

  // Implement all interface methods for database operations
  // For brevity, showing key method signatures only

  async createUser(user: InsertUser): Promise<User> {
    if (!this.db) throw new Error("Database not initialized");
    const [newUser] = await this.db.insert(schema.users).values(user).returning();
    return newUser;
  }

  async getUserById(id: number): Promise<User | undefined> {
    if (!this.db) throw new Error("Database not initialized");
    const [user] = await this.db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!this.db) throw new Error("Database not initialized");
    const [user] = await this.db.select().from(schema.users).where(eq(schema.users.email, email));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!this.db) throw new Error("Database not initialized");
    const [user] = await this.db.select().from(schema.users).where(eq(schema.users.username, username));
    return user;
  }

  // Continue implementing all other interface methods...
  // For brevity, these are stub implementations

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    if (!this.db) throw new Error("Database not initialized");
    const [updated] = await this.db.update(schema.users).set(userData).where(eq(schema.users.id, id)).returning();
    return updated;
  }

  async deleteUser(id: number): Promise<boolean> {
    if (!this.db) throw new Error("Database not initialized");
    const result = await this.db.delete(schema.users).where(eq(schema.users.id, id));
    return result.rowCount > 0;
  }

  async getAllUsers(): Promise<User[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.select().from(schema.users);
  }

  async searchUsers(query: string): Promise<User[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.select().from(schema.users)
      .where(
        sql`${schema.users.username} ILIKE ${`%${query}%`} OR 
            ${schema.users.email} ILIKE ${`%${query}%`} OR 
            ${schema.users.firstName} ILIKE ${`%${query}%`} OR 
            ${schema.users.lastName} ILIKE ${`%${query}%`}`
      );
  }

  // Professional Profile operations
  async getProfessionalProfile(id: number): Promise<ProfessionalProfile | undefined> {
    if (!this.db) throw new Error("Database not initialized");
    const [profile] = await this.db.select().from(schema.professionalProfiles).where(eq(schema.professionalProfiles.id, id));
    return profile;
  }

  async getProfessionalProfileByUserId(userId: number): Promise<ProfessionalProfile | undefined> {
    if (!this.db) throw new Error("Database not initialized");
    const [profile] = await this.db.select().from(schema.professionalProfiles).where(eq(schema.professionalProfiles.userId, userId));
    return profile;
  }

  async createProfessionalProfile(profile: InsertProfessionalProfile): Promise<ProfessionalProfile> {
    if (!this.db) throw new Error("Database not initialized");
    const [newProfile] = await this.db.insert(schema.professionalProfiles).values(profile).returning();
    return newProfile;
  }

  async updateProfessionalProfile(id: number, updates: Partial<ProfessionalProfile>): Promise<ProfessionalProfile | undefined> {
    if (!this.db) throw new Error("Database not initialized");
    const [updated] = await this.db.update(schema.professionalProfiles).set(updates).where(eq(schema.professionalProfiles.id, id)).returning();
    return updated;
  }

  async deleteProfessionalProfile(id: number): Promise<boolean> {
    if (!this.db) throw new Error("Database not initialized");
    const result = await this.db.delete(schema.professionalProfiles).where(eq(schema.professionalProfiles.id, id));
    return result.rowCount > 0;
  }

  async getAllProfessionalProfiles(): Promise<ProfessionalProfile[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.select().from(schema.professionalProfiles);
  }

  async getFeaturedProfessionalProfiles(): Promise<ProfessionalProfile[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.select().from(schema.professionalProfiles).where(eq(schema.professionalProfiles.featured, true)).limit(6);
  }

  async searchProfessionalProfiles(query: string): Promise<ProfessionalProfile[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.select().from(schema.professionalProfiles)
      .where(
        sql`${schema.professionalProfiles.title} ILIKE ${`%${query}%`} OR 
            ${schema.professionalProfiles.bio} ILIKE ${`%${query}%`} OR 
            ${schema.professionalProfiles.location} ILIKE ${`%${query}%`}`
      );
  }

  // Continue with stub implementations for remaining methods...
  // Each method should check if this.db exists and throw if not

  // Stub implementations - implement as needed
  async getCompanyProfile(id: number): Promise<CompanyProfile | undefined> {
    if (!this.db) throw new Error("Database not initialized");
    const [profile] = await this.db.select().from(schema.companyProfiles).where(eq(schema.companyProfiles.id, id));
    return profile;
  }

  async getCompanyProfileByUserId(userId: number): Promise<CompanyProfile | undefined> {
    if (!this.db) throw new Error("Database not initialized");
    const [profile] = await this.db.select().from(schema.companyProfiles).where(eq(schema.companyProfiles.userId, userId));
    return profile;
  }

  async createCompanyProfile(profile: InsertCompanyProfile): Promise<CompanyProfile> {
    if (!this.db) throw new Error("Database not initialized");
    const [newProfile] = await this.db.insert(schema.companyProfiles).values(profile).returning();
    return newProfile;
  }

  async updateCompanyProfile(id: number, updates: Partial<CompanyProfile>): Promise<CompanyProfile | undefined> {
    if (!this.db) throw new Error("Database not initialized");
    const [updated] = await this.db.update(schema.companyProfiles).set(updates).where(eq(schema.companyProfiles.id, id)).returning();
    return updated;
  }

  async deleteCompanyProfile(id: number): Promise<boolean> {
    if (!this.db) throw new Error("Database not initialized");
    const result = await this.db.delete(schema.companyProfiles).where(eq(schema.companyProfiles.id, id));
    return result.rowCount > 0;
  }

  async getAllCompanyProfiles(): Promise<CompanyProfile[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.select().from(schema.companyProfiles);
  }

  async searchCompanyProfiles(query: string): Promise<CompanyProfile[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.select().from(schema.companyProfiles)
      .where(
        sql`${schema.companyProfiles.companyName} ILIKE ${`%${query}%`} OR 
            ${schema.companyProfiles.description} ILIKE ${`%${query}%`}`
      );
  }

  // Additional stub implementations would continue here...
  // For brevity, implementing key methods only

  async getJobPosting(id: number): Promise<JobPosting | undefined> {
    if (!this.db) throw new Error("Database not initialized");
    const [job] = await this.db.select().from(schema.jobPostings).where(eq(schema.jobPostings.id, id));
    return job;
  }

  async createJobPosting(jobPosting: InsertJobPosting): Promise<JobPosting> {
    if (!this.db) throw new Error("Database not initialized");
    const [newJob] = await this.db.insert(schema.jobPostings).values(jobPosting).returning();
    return newJob;
  }

  async updateJobPosting(id: number, updates: Partial<JobPosting>): Promise<JobPosting | undefined> {
    if (!this.db) throw new Error("Database not initialized");
    const [updated] = await this.db.update(schema.jobPostings).set(updates).where(eq(schema.jobPostings.id, id)).returning();
    return updated;
  }

  async deleteJobPosting(id: number): Promise<boolean> {
    if (!this.db) throw new Error("Database not initialized");
    const result = await this.db.delete(schema.jobPostings).where(eq(schema.jobPostings.id, id));
    return result.rowCount > 0;
  }

  async getAllJobPostings(): Promise<JobPosting[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.select().from(schema.jobPostings);
  }

  async getJobPostingsByCompanyId(companyId: number): Promise<JobPosting[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.select().from(schema.jobPostings).where(eq(schema.jobPostings.companyId, companyId));
  }

  async searchJobPostings(query: string): Promise<JobPosting[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.select().from(schema.jobPostings)
      .where(
        sql`${schema.jobPostings.title} ILIKE ${`%${query}%`} OR 
            ${schema.jobPostings.description} ILIKE ${`%${query}%`}`
      );
  }

  async getLatestJobPostings(limit = 10): Promise<JobPosting[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.select().from(schema.jobPostings)
      .orderBy(desc(schema.jobPostings.createdAt))
      .limit(limit);
  }

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.select().from(schema.subscriptionPlans);
  }

  async getUserSubscription(userId: number): Promise<any> {
    if (!this.db) throw new Error("Database not initialized");
    const user = await this.getUserById(userId);
    return user ? {
      tier: user.subscriptionTier,
      status: user.subscriptionStatus
    } : null;
  }

  async updateUserSubscription(userId: number, tier: string, status: string): Promise<User | undefined>;
  async updateUserSubscription(userId: number, subscriptionData: any): Promise<User | undefined>;
  async updateUserSubscription(userId: number, tierOrData: string | any, status?: string): Promise<User | undefined> {
    if (!this.db) throw new Error("Database not initialized");
    
    if (typeof tierOrData === 'string' && status) {
      // Legacy signature
      const [updated] = await this.db.update(schema.users)
        .set({ subscriptionTier: tierOrData, subscriptionStatus: status })
        .where(eq(schema.users.id, userId))
        .returning();
      return updated;
    } else {
      // New signature with subscription data object
      const [updated] = await this.db.update(schema.users)
        .set(tierOrData)
        .where(eq(schema.users.id, userId))
        .returning();
      return updated;
    }
  }

  // Continue with remaining stub implementations...
  // Each should follow the same pattern of checking this.db and implementing the database query

  // For brevity, providing minimal stub implementations for remaining methods
  async getJobApplication(id: number): Promise<JobApplication | undefined> {
    if (!this.db) throw new Error("Database not initialized");
    const [app] = await this.db.select().from(schema.jobApplications).where(eq(schema.jobApplications.id, id));
    return app;
  }

  async createJobApplication(application: InsertJobApplication): Promise<JobApplication> {
    if (!this.db) throw new Error("Database not initialized");
    const [newApp] = await this.db.insert(schema.jobApplications).values(application).returning();
    return newApp;
  }

  async updateJobApplication(id: number, updates: Partial<JobApplication>): Promise<JobApplication | undefined> {
    if (!this.db) throw new Error("Database not initialized");
    const [updated] = await this.db.update(schema.jobApplications).set(updates).where(eq(schema.jobApplications.id, id)).returning();
    return updated;
  }

  async deleteJobApplication(id: number): Promise<boolean> {
    if (!this.db) throw new Error("Database not initialized");
    const result = await this.db.delete(schema.jobApplications).where(eq(schema.jobApplications.id, id));
    return result.rowCount > 0;
  }

  async getJobApplicationsByJobId(jobId: number): Promise<JobApplication[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.select().from(schema.jobApplications).where(eq(schema.jobApplications.jobId, jobId));
  }

  async getJobApplicationsByUserId(userId: number): Promise<JobApplication[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.select().from(schema.jobApplications).where(eq(schema.jobApplications.userId, userId));
  }

  async getAllExpertise(): Promise<Expertise[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.select().from(schema.expertise);
  }

  async createExpertise(expertise: InsertExpertise): Promise<Expertise> {
    if (!this.db) throw new Error("Database not initialized");
    const [newExpertise] = await this.db.insert(schema.expertise).values(expertise).returning();
    return newExpertise;
  }

  async getExpertiseByProfessionalId(professionalId: number): Promise<Expertise[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.select()
      .from(schema.expertise)
      .innerJoin(schema.professionalExpertise, eq(schema.expertise.id, schema.professionalExpertise.expertiseId))
      .where(eq(schema.professionalExpertise.professionalId, professionalId));
  }

  async addExpertiseToProfessional(professionalId: number, expertiseId: number): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    await this.db.insert(schema.professionalExpertise).values({ professionalId, expertiseId });
  }

  async removeExpertiseFromProfessional(professionalId: number, expertiseId: number): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    await this.db.delete(schema.professionalExpertise)
      .where(and(
        eq(schema.professionalExpertise.professionalId, professionalId),
        eq(schema.professionalExpertise.expertiseId, expertiseId)
      ));
  }

  async getAllCertifications(): Promise<Certification[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.select().from(schema.certifications);
  }

  async createCertification(certification: InsertCertification): Promise<Certification> {
    if (!this.db) throw new Error("Database not initialized");
    const [newCert] = await this.db.insert(schema.certifications).values(certification).returning();
    return newCert;
  }

  async getCertificationsByProfessionalId(professionalId: number): Promise<Certification[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.select().from(schema.certifications).where(eq(schema.certifications.professionalId, professionalId));
  }

  async getResource(id: number): Promise<Resource | undefined> {
    if (!this.db) throw new Error("Database not initialized");
    const [resource] = await this.db.select().from(schema.resources).where(eq(schema.resources.id, id));
    return resource;
  }

  async createResource(resource: InsertResource): Promise<Resource> {
    if (!this.db) throw new Error("Database not initialized");
    const [newResource] = await this.db.insert(schema.resources).values(resource).returning();
    return newResource;
  }

  async updateResource(id: number, updates: Partial<Resource>): Promise<Resource | undefined> {
    if (!this.db) throw new Error("Database not initialized");
    const [updated] = await this.db.update(schema.resources).set(updates).where(eq(schema.resources.id, id)).returning();
    return updated;
  }

  async deleteResource(id: number): Promise<boolean> {
    if (!this.db) throw new Error("Database not initialized");
    const result = await this.db.delete(schema.resources).where(eq(schema.resources.id, id));
    return result.rowCount > 0;
  }

  async getAllResources(): Promise<Resource[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.select().from(schema.resources);
  }

  async getResourcesByAuthorId(authorId: number): Promise<Resource[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.select().from(schema.resources).where(eq(schema.resources.authorId, authorId));
  }

  async searchResources(query?: string, type?: string, categoryId?: number): Promise<Resource[]> {
    if (!this.db) throw new Error("Database not initialized");
    let queryBuilder = this.db.select().from(schema.resources);
    
    const conditions = [];
    if (query) {
      conditions.push(sql`${schema.resources.title} ILIKE ${`%${query}%`} OR ${schema.resources.description} ILIKE ${`%${query}%`}`);
    }
    if (type) {
      conditions.push(eq(schema.resources.type, type));
    }
    if (categoryId) {
      conditions.push(eq(schema.resources.categoryId, categoryId));
    }
    
    if (conditions.length > 0) {
      queryBuilder = queryBuilder.where(and(...conditions));
    }
    
    return await queryBuilder;
  }

  async getFeaturedResources(): Promise<Resource[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.select().from(schema.resources).where(eq(schema.resources.featured, true)).limit(6);
  }

  async getReview(id: number): Promise<Review | undefined> {
    if (!this.db) throw new Error("Database not initialized");
    const [review] = await this.db.select().from(schema.reviews).where(eq(schema.reviews.id, id));
    return review;
  }

  async createReview(review: InsertReview): Promise<Review> {
    if (!this.db) throw new Error("Database not initialized");
    const [newReview] = await this.db.insert(schema.reviews).values(review).returning();
    await this.updateProfessionalRating(review.professionalId);
    return newReview;
  }

  async updateReview(id: number, updates: Partial<Review>): Promise<Review | undefined> {
    if (!this.db) throw new Error("Database not initialized");
    const [updated] = await this.db.update(schema.reviews).set(updates).where(eq(schema.reviews.id, id)).returning();
    return updated;
  }

  async deleteReview(id: number): Promise<boolean> {
    if (!this.db) throw new Error("Database not initialized");
    const result = await this.db.delete(schema.reviews).where(eq(schema.reviews.id, id));
    return result.rowCount > 0;
  }

  async getReviewsByProfessionalId(professionalId: number): Promise<Review[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.select().from(schema.reviews).where(eq(schema.reviews.professionalId, professionalId));
  }

  async getReviewsByCompanyId(companyId: number): Promise<Review[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.select().from(schema.reviews).where(eq(schema.reviews.companyId, companyId));
  }

  async getReviewByConsultationId(consultationId: number): Promise<Review | undefined> {
    if (!this.db) throw new Error("Database not initialized");
    const [review] = await this.db.select().from(schema.reviews).where(eq(schema.reviews.consultationId, consultationId));
    return review;
  }

  async getAllNotificationTypes(): Promise<NotificationType[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.select().from(schema.notificationTypes);
  }

  async createNotificationType(type: InsertNotificationType): Promise<NotificationType> {
    if (!this.db) throw new Error("Database not initialized");
    const [newType] = await this.db.insert(schema.notificationTypes).values(type).returning();
    return newType;
  }

  async getNotification(id: number): Promise<Notification | undefined> {
    if (!this.db) throw new Error("Database not initialized");
    const [notification] = await this.db.select().from(schema.notifications).where(eq(schema.notifications.id, id));
    return notification;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    if (!this.db) throw new Error("Database not initialized");
    const [newNotification] = await this.db.insert(schema.notifications).values(notification).returning();
    return newNotification;
  }

  async updateNotification(id: number, updates: Partial<Notification>): Promise<Notification | undefined> {
    if (!this.db) throw new Error("Database not initialized");
    const [updated] = await this.db.update(schema.notifications).set(updates).where(eq(schema.notifications.id, id)).returning();
    return updated;
  }

  async deleteNotification(id: number): Promise<boolean> {
    if (!this.db) throw new Error("Database not initialized");
    const result = await this.db.delete(schema.notifications).where(eq(schema.notifications.id, id));
    return result.rowCount > 0;
  }

  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.select().from(schema.notifications)
      .where(eq(schema.notifications.userId, userId))
      .orderBy(desc(schema.notifications.createdAt));
  }

  async getUnreadNotificationsByUserId(userId: number): Promise<Notification[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.select().from(schema.notifications)
      .where(and(
        eq(schema.notifications.userId, userId),
        eq(schema.notifications.read, false)
      ))
      .orderBy(desc(schema.notifications.createdAt));
  }

  async getNotificationPreferences(userId: number): Promise<NotificationPreference[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.select().from(schema.notificationPreferences)
      .where(eq(schema.notificationPreferences.userId, userId));
  }

  async upsertNotificationPreference(preference: InsertNotificationPreference): Promise<NotificationPreference> {
    if (!this.db) throw new Error("Database not initialized");
    
    // Try to find existing preference
    const [existing] = await this.db.select().from(schema.notificationPreferences)
      .where(and(
        eq(schema.notificationPreferences.userId, preference.userId),
        eq(schema.notificationPreferences.typeId, preference.typeId)
      ));

    if (existing) {
      // Update existing
      const [updated] = await this.db.update(schema.notificationPreferences)
        .set(preference)
        .where(eq(schema.notificationPreferences.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create new
      const [newPreference] = await this.db.insert(schema.notificationPreferences)
        .values(preference)
        .returning();
      return newPreference;
    }
  }

  async getMessage(id: number): Promise<Message | undefined> {
    if (!this.db) throw new Error("Database not initialized");
    const [message] = await this.db.select().from(schema.messages).where(eq(schema.messages.id, id));
    return message;
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    if (!this.db) throw new Error("Database not initialized");
    const [newMessage] = await this.db.insert(schema.messages).values(message).returning();
    return newMessage;
  }

  async getMessagesByConversationId(conversationId: number): Promise<Message[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.select().from(schema.messages)
      .where(eq(schema.messages.conversationId, conversationId))
      .orderBy(asc(schema.messages.createdAt));
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    if (!this.db) throw new Error("Database not initialized");
    const [conversation] = await this.db.select().from(schema.conversations).where(eq(schema.conversations.id, id));
    return conversation;
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    if (!this.db) throw new Error("Database not initialized");
    const [newConversation] = await this.db.insert(schema.conversations).values(conversation).returning();
    return newConversation;
  }

  async getConversationsByUserId(userId: number): Promise<Conversation[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.select().from(schema.conversations)
      .where(sql`${schema.conversations.participant1Id} = ${userId} OR ${schema.conversations.participant2Id} = ${userId}`);
  }

  async createAuthToken(token: InsertAuthToken): Promise<AuthToken> {
    if (!this.db) throw new Error("Database not initialized");
    const [newToken] = await this.db.insert(schema.authTokens).values(token).returning();
    return newToken;
  }

  async getAuthToken(token: string): Promise<AuthToken | undefined> {
    if (!this.db) throw new Error("Database not initialized");
    const [authToken] = await this.db.select().from(schema.authTokens).where(eq(schema.authTokens.token, token));
    return authToken;
  }

  async revokeAuthToken(token: string): Promise<boolean> {
    if (!this.db) throw new Error("Database not initialized");
    const result = await this.db.update(schema.authTokens)
      .set({ isRevoked: true })
      .where(eq(schema.authTokens.token, token));
    return result.rowCount > 0;
  }

  async revokeAllUserTokens(userId: number): Promise<boolean> {
    if (!this.db) throw new Error("Database not initialized");
    const result = await this.db.update(schema.authTokens)
      .set({ isRevoked: true })
      .where(eq(schema.authTokens.userId, userId));
    return result.rowCount > 0;
  }

  async cleanupExpiredTokens(): Promise<number> {
    if (!this.db) throw new Error("Database not initialized");
    const result = await this.db.delete(schema.authTokens)
      .where(sql`${schema.authTokens.expiresAt} < NOW() OR ${schema.authTokens.isRevoked} = true`);
    return result.rowCount;
  }

  async createMatch(match: InsertMatch): Promise<Match> {
    if (!this.db) throw new Error("Database not initialized");
    const [newMatch] = await this.db.insert(schema.matches).values(match).returning();
    return newMatch;
  }

  async getMatchesByUserId(userId: number): Promise<Match[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.select().from(schema.matches).where(eq(schema.matches.userId, userId));
  }

  async getAllResourceCategories(): Promise<ResourceCategory[]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.select().from(schema.resourceCategories);
  }

  async createResourceCategory(category: InsertResourceCategory): Promise<ResourceCategory> {
    if (!this.db) throw new Error("Database not initialized");
    const [newCategory] = await this.db.insert(schema.resourceCategories).values(category).returning();
    return newCategory;
  }

  async findMatchingJobsForProfessional(professionalId: number): Promise<JobPosting[]> {
    if (!this.db) throw new Error("Database not initialized");
    
    // Get professional's expertise
    const expertise = await this.getExpertiseByProfessionalId(professionalId);
    const expertiseNames = expertise.map(e => e.name);
    
    if (expertiseNames.length === 0) return [];
    
    // Find jobs that match the expertise
    return await this.db.select().from(schema.jobPostings)
      .where(sql`${schema.jobPostings.title} ILIKE ANY(${expertiseNames.map(name => `%${name}%`)}) OR 
                 ${schema.jobPostings.description} ILIKE ANY(${expertiseNames.map(name => `%${name}%`)})`)
      .limit(10);
  }

  async findMatchingProfessionalsForJob(jobId: number): Promise<ProfessionalProfile[]> {
    if (!this.db) throw new Error("Database not initialized");
    
    const job = await this.getJobPosting(jobId);
    if (!job) return [];
    
    return await this.db.select().from(schema.professionalProfiles)
      .where(sql`${schema.professionalProfiles.title} ILIKE ${`%${job.title}%`} OR 
                 ${schema.professionalProfiles.bio} ILIKE ${`%${job.title}%`}`)
      .limit(10);
  }

  async updateProfessionalRating(professionalId: number): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    
    const reviews = await this.getReviewsByProfessionalId(professionalId);
    if (reviews.length === 0) return;
    
    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    
    await this.db.update(schema.professionalProfiles)
      .set({ rating: Math.round(averageRating * 10) / 10 })
      .where(eq(schema.professionalProfiles.id, professionalId));
  }
}

// Export storage instance
let storage: IStorage;

if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
  storage = new DatabaseStorage();
} else {
  storage = new MemStorage();
}

export { storage };