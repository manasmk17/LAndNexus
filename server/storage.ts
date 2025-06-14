import { db, useRealDatabase } from "./db";
import { and, asc, desc, eq, or, isNull, not, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import {
  users, User, InsertUser,
  authTokens, AuthToken, InsertAuthToken,
  professionalProfiles, ProfessionalProfile, InsertProfessionalProfile,
  expertise, Expertise, InsertExpertise,
  professionalExpertise, ProfessionalExpertise, InsertProfessionalExpertise,
  certifications, Certification, InsertCertification,
  companyProfiles, CompanyProfile, InsertCompanyProfile,
  jobPostings, JobPosting, InsertJobPosting,
  jobApplications, JobApplication, InsertJobApplication,
  resources, Resource, InsertResource,
  resourceCategories, ResourceCategory, InsertResourceCategory,
  forumPosts, ForumPost, InsertForumPost,
  forumComments, ForumComment, InsertForumComment,
  messages, Message, InsertMessage,
  consultations, Consultation, InsertConsultation,
  skillRecommendations, SkillRecommendation, InsertSkillRecommendation,
  pageContents, PageContent, InsertPageContent,
  reviews, Review, InsertReview,
  notifications, Notification, InsertNotification,
  notificationTypes, NotificationType, InsertNotificationType,
  notificationPreferences, NotificationPreference, InsertNotificationPreference,
  subscriptionPlans, SubscriptionPlan,
  professionalAwards, ProfessionalAward, InsertProfessionalAward,
  trainingMaterials, TrainingMaterial, InsertTrainingMaterial,
  professionalCertificationPortfolio, ProfessionalCertificationPortfolio, InsertProfessionalCertificationPortfolio,
  externalPortfolioLinks, ExternalPortfolioLink, InsertExternalPortfolioLink
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Password and account recovery operations
  createResetToken(email: string): Promise<string | null>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  resetPassword(token: string, newPassword: string): Promise<boolean>;

  // Authentication token operations for "Remember Me"
  createAuthToken(userId: number, type: string, expiresAt: Date, userAgent?: string, ipAddress?: string): Promise<AuthToken>;
  getAuthToken(token: string): Promise<AuthToken | undefined>;
  validateAuthToken(token: string): Promise<User | undefined>;
  revokeAuthToken(token: string): Promise<boolean>;
  revokeAllUserTokens(userId: number): Promise<boolean>;
  cleanupExpiredTokens(): Promise<number>;

  // Stripe operations
  updateStripeCustomerId(userId: number, customerId: string): Promise<User | undefined>;
  updateStripeSubscriptionId(userId: number, subscriptionId: string): Promise<User | undefined>;
  updateUserSubscription(userId: number, tier: string, status: string): Promise<User | undefined>;
  getUserByStripeCustomerId(customerId: string): Promise<User | undefined>;

  // Subscription plans operations
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;

  // AI Matching operations
  getMatchingJobsForProfessional(professionalId: number, limit?: number): Promise<Array<{job: JobPosting, score: number}>>;
  getMatchingProfessionalsForJob(jobId: number, limit?: number): Promise<Array<{professional: ProfessionalProfile, score: number}>>;
  saveJobMatch(jobId: number, professionalId: number, score: number): Promise<boolean>;

  // Professional Profile operations
  getProfessionalProfile(id: number): Promise<ProfessionalProfile | undefined>;
  getProfessionalProfileByUserId(userId: number): Promise<ProfessionalProfile | undefined>;
  getAllProfessionalProfiles(): Promise<ProfessionalProfile[]>;
  getFeaturedProfessionalProfiles(limit: number): Promise<ProfessionalProfile[]>;
  createProfessionalProfile(profile: InsertProfessionalProfile): Promise<ProfessionalProfile>;
  updateProfessionalProfile(id: number, profile: Partial<InsertProfessionalProfile>): Promise<ProfessionalProfile | undefined>;
  deleteProfessionalProfile(id: number): Promise<boolean>;

  // Expertise operations
  getAllExpertise(): Promise<Expertise[]>;
  getExpertiseById(id: number): Promise<Expertise | undefined>;
  createExpertise(expertise: InsertExpertise): Promise<Expertise>;
  getProfessionalExpertise(professionalId: number): Promise<Expertise[]>;
  addProfessionalExpertise(professionalExpertise: InsertProfessionalExpertise): Promise<ProfessionalExpertise>;
  deleteProfessionalExpertise(id: number): Promise<boolean>;

  // Certification operations
  getCertification(id: number): Promise<Certification | undefined>;
  getProfessionalCertifications(professionalId: number): Promise<Certification[]>;
  createCertification(certification: InsertCertification): Promise<Certification>;
  deleteCertification(id: number): Promise<boolean>;

  // Company Profile operations
  getCompanyProfile(id: number): Promise<CompanyProfile | undefined>;
  getCompanyProfileByUserId(userId: number): Promise<CompanyProfile | undefined>;
  getAllCompanyProfiles(): Promise<CompanyProfile[]>;
  createCompanyProfile(profile: InsertCompanyProfile): Promise<CompanyProfile>;
  updateCompanyProfile(id: number, profile: Partial<InsertCompanyProfile>): Promise<CompanyProfile | undefined>;

  // Job Posting operations
  getJobPosting(id: number): Promise<JobPosting | undefined>;
  getAllJobPostings(): Promise<JobPosting[]>;
  getLatestJobPostings(limit: number): Promise<JobPosting[]>;
  getCompanyJobPostings(companyId: number): Promise<JobPosting[]>;
  createJobPosting(job: InsertJobPosting): Promise<JobPosting>;
  updateJobPosting(id: number, job: Partial<InsertJobPosting>): Promise<JobPosting | undefined>;
  deleteJobPosting(id: number): Promise<boolean>;

  // Job Application operations
  getJobApplication(id: number): Promise<JobApplication | undefined>;
  getJobApplicationsByJob(jobId: number): Promise<JobApplication[]>;
  getJobApplicationsByProfessional(professionalId: number): Promise<JobApplication[]>;
  createJobApplication(application: InsertJobApplication): Promise<JobApplication>;
  updateJobApplicationStatus(id: number, status: string): Promise<JobApplication | undefined>;

  // Resource Category operations
  getResourceCategory(id: number): Promise<ResourceCategory | undefined>;
  getAllResourceCategories(): Promise<ResourceCategory[]>;
  createResourceCategory(category: InsertResourceCategory): Promise<ResourceCategory>;

  // Resource operations
  getResource(id: number): Promise<Resource | undefined>;
  getAllResources(): Promise<Resource[]>;
  getResourcesByCategory(categoryId: number): Promise<Resource[]>;
  getResourcesByAuthor(authorId: number): Promise<Resource[]>;
  searchResources(query?: string, type?: string, categoryId?: number): Promise<Resource[]>;
  getFeaturedResources(limit: number): Promise<Resource[]>;
  createResource(resource: InsertResource): Promise<Resource>;
  updateResource(id: number, resource: Partial<Resource>): Promise<Resource | undefined>;
  setResourceFeatured(id: number, featured: boolean): Promise<Resource | undefined>;
  deleteResource(id: number): Promise<boolean>;

  // Forum operations
  getForumPost(id: number): Promise<ForumPost | undefined>;
  getAllForumPosts(): Promise<ForumPost[]>;
  createForumPost(post: InsertForumPost): Promise<ForumPost>;
  getPostComments(postId: number): Promise<ForumComment[]>;
  createForumComment(comment: InsertForumComment): Promise<ForumComment>;

  // Message operations
  getUserMessages(userId: number): Promise<Message[]>;
  getConversation(user1Id: number, user2Id: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<boolean>;

  // Consultation operations
  getConsultation(id: number): Promise<Consultation | undefined>;
  getProfessionalConsultations(professionalId: number): Promise<Consultation[]>;
  getCompanyConsultations(companyId: number): Promise<Consultation[]>;
  createConsultation(consultation: InsertConsultation): Promise<Consultation>;
  updateConsultationStatus(id: number, status: string): Promise<Consultation | undefined>;

  // Skill Recommendation operations
  getSkillRecommendation(id: number): Promise<SkillRecommendation | undefined>;
  getSkillRecommendationsByProfessional(professionalId: number): Promise<SkillRecommendation | undefined>;
  createSkillRecommendation(recommendation: InsertSkillRecommendation): Promise<SkillRecommendation>;
  updateSkillRecommendation(id: number, recommendation: Partial<InsertSkillRecommendation>): Promise<SkillRecommendation | undefined>;

  // Page Content operations
  getPageContent(id: number): Promise<PageContent | undefined>;
  getPageContentBySlug(slug: string): Promise<PageContent | undefined>;
  getAllPageContents(): Promise<PageContent[]>;
  createPageContent(content: InsertPageContent): Promise<PageContent>;
  updatePageContent(id: number, content: Partial<InsertPageContent>): Promise<PageContent | undefined>;
  deletePageContent(id: number): Promise<boolean>;

  // Review operations
  getReview(id: number): Promise<Review | undefined>;
  getProfessionalReviews(professionalId: number): Promise<Review[]>;
  getCompanyReviews(companyId: number): Promise<Review[]>;
  getConsultationReview(consultationId: number): Promise<Review | undefined>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: number, review: Partial<Review>): Promise<Review | undefined>;
  deleteReview(id: number): Promise<boolean>;
  updateProfessionalRating(professionalId: number): Promise<boolean>;

  // Notification operations
  getNotificationType(id: number): Promise<NotificationType | undefined>;
  getNotificationTypeByName(name: string): Promise<NotificationType | undefined>;
  getAllNotificationTypes(): Promise<NotificationType[]>;
  createNotificationType(type: InsertNotificationType): Promise<NotificationType>;

  getNotification(id: number): Promise<Notification | undefined>;
  getUserNotifications(userId: number): Promise<Notification[]>;
  getUserUnreadNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<boolean>;
  markAllUserNotificationsAsRead(userId: number): Promise<boolean>;
  deleteNotification(id: number): Promise<boolean>;

  // Notification Preferences operations
  getUserNotificationPreferences(userId: number): Promise<NotificationPreference[]>;
  getUserNotificationPreference(userId: number, typeId: number): Promise<NotificationPreference | undefined>;
  createOrUpdateNotificationPreference(preference: InsertNotificationPreference): Promise<NotificationPreference>;

  // Subscription operations
  getUserSubscription(userId: number): Promise<any>;
  updateUserSubscription(userId: number, subscriptionData: any): Promise<any>;

  // Portfolio Showcase operations
  getProfessionalAwards(professionalId: number): Promise<ProfessionalAward[]>;
  createProfessionalAward(award: InsertProfessionalAward): Promise<ProfessionalAward>;
  updateProfessionalAward(id: number, award: Partial<InsertProfessionalAward>): Promise<ProfessionalAward | undefined>;
  deleteProfessionalAward(id: number): Promise<boolean>;

  getTrainingMaterials(professionalId: number): Promise<TrainingMaterial[]>;
  createTrainingMaterial(material: InsertTrainingMaterial): Promise<TrainingMaterial>;
  updateTrainingMaterial(id: number, material: Partial<InsertTrainingMaterial>): Promise<TrainingMaterial | undefined>;
  deleteTrainingMaterial(id: number): Promise<boolean>;

  getProfessionalCertificationPortfolio(professionalId: number): Promise<ProfessionalCertificationPortfolio[]>;
  createProfessionalCertificationPortfolio(cert: InsertProfessionalCertificationPortfolio): Promise<ProfessionalCertificationPortfolio>;
  updateProfessionalCertificationPortfolio(id: number, cert: Partial<InsertProfessionalCertificationPortfolio>): Promise<ProfessionalCertificationPortfolio | undefined>;
  deleteProfessionalCertificationPortfolio(id: number): Promise<boolean>;

  getExternalPortfolioLinks(professionalId: number): Promise<ExternalPortfolioLink[]>;
  createExternalPortfolioLink(link: InsertExternalPortfolioLink): Promise<ExternalPortfolioLink>;
  updateExternalPortfolioLink(id: number, link: Partial<InsertExternalPortfolioLink>): Promise<ExternalPortfolioLink | undefined>;
  deleteExternalPortfolioLink(id: number): Promise<boolean>;

  // Simple auth token operations (simplified)
  createSimpleAuthToken?(userId: number): Promise<string>;
  validateSimpleAuthToken?(token: string): Promise<number | null>;

  // Professional Portfolio Showcase operations
  // Awards & Recognition
  getProfessionalAwards(professionalId: number): Promise<ProfessionalAward[]>;
  createProfessionalAward(award: InsertProfessionalAward): Promise<ProfessionalAward>;
  updateProfessionalAward(id: number, award: Partial<InsertProfessionalAward>): Promise<ProfessionalAward | undefined>;
  deleteProfessionalAward(id: number): Promise<boolean>;

  // Training Materials Library
  getTrainingMaterials(professionalId: number): Promise<TrainingMaterial[]>;
  createTrainingMaterial(material: InsertTrainingMaterial): Promise<TrainingMaterial>;
  updateTrainingMaterial(id: number, material: Partial<InsertTrainingMaterial>): Promise<TrainingMaterial | undefined>;
  deleteTrainingMaterial(id: number): Promise<boolean>;

  // Certification Portfolio
  getProfessionalCertificationPortfolio(professionalId: number): Promise<ProfessionalCertificationPortfolio[]>;
  createProfessionalCertificationPortfolio(cert: InsertProfessionalCertificationPortfolio): Promise<ProfessionalCertificationPortfolio>;
  updateProfessionalCertificationPortfolio(id: number, cert: Partial<InsertProfessionalCertificationPortfolio>): Promise<ProfessionalCertificationPortfolio | undefined>;
  deleteProfessionalCertificationPortfolio(id: number): Promise<boolean>;

  // External Portfolio Links
  getExternalPortfolioLinks(professionalId: number): Promise<ExternalPortfolioLink[]>;
  createExternalPortfolioLink(link: InsertExternalPortfolioLink): Promise<ExternalPortfolioLink>;
  updateExternalPortfolioLink(id: number, link: Partial<InsertExternalPortfolioLink>): Promise<ExternalPortfolioLink | undefined>;
  deleteExternalPortfolioLink(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private authTokens: Map<string, AuthToken>;
  private professionalProfiles: Map<number, ProfessionalProfile>;
  private expertises: Map<number, Expertise>;
  private professionalExpertises: Map<number, ProfessionalExpertise>;
  private certifications: Map<number, Certification>;
  private companyProfiles: Map<number, CompanyProfile>;
  private jobPostings: Map<number, JobPosting>;
  private jobApplications: Map<number, JobApplication>;
  private resources: Map<number, Resource>;
  private resourceCategories: Map<number, ResourceCategory>;
  private forumPosts: Map<number, ForumPost>;
  private forumComments: Map<number, ForumComment>;
  private messages: Map<number, Message>;
  private consultations: Map<number, Consultation>;
  private skillRecommendations: Map<number, SkillRecommendation>;
  private pageContents: Map<number, PageContent>;
  private jobMatches: Map<string, number>; // Format: "jobId-professionalId" -> score
  private reviews: Map<number, Review>;
  private notificationTypes: Map<number, NotificationType>;
  private notifications: Map<number, Notification>;
  private notificationPreferences: Map<number, NotificationPreference>;

  // Performance optimization: Add caching for expensive operations
  private matchCache: Map<string, any> = new Map();
  private queryCache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private userId: number;
  private profProfileId: number;
  private expertiseId: number;
  private profExpertiseId: number;
  private certificationId: number;
  private companyProfileId: number;
  private jobPostingId: number;
  private jobApplicationId: number;
  private resourceId: number;
  private resourceCategoryId: number;
  private forumPostId: number;
  private forumCommentId: number;
  private messageId: number;
  private consultationId: number;
  private skillRecommendationId: number;
  private pageContentId: number;
  private reviewId: number;
  private notificationTypeId: number;
  private notificationId: number;
  private notificationPreferenceId: number;

  constructor() {
    this.users = new Map();
    this.authTokens = new Map();
    this.professionalProfiles = new Map();
    this.expertises = new Map();
    this.professionalExpertises = new Map();
    this.certifications = new Map();
    this.companyProfiles = new Map();
    this.jobPostings = new Map();
    this.jobApplications = new Map();
    this.resources = new Map();
    this.resourceCategories = new Map();
    this.forumPosts = new Map();
    this.forumComments = new Map();
    this.messages = new Map();
    this.consultations = new Map();
    this.skillRecommendations = new Map();
    this.pageContents = new Map();
    this.jobMatches = new Map();
    this.reviews = new Map();
    this.notificationTypes = new Map();
    this.notifications = new Map();
    this.notificationPreferences = new Map();

    // Initialize cache maps
    this.matchCache = new Map();
    this.queryCache = new Map();

    this.userId = 1;
    this.profProfileId = 1;
    this.expertiseId = 1;
    this.profExpertiseId = 1;
    this.certificationId = 1;
    this.companyProfileId = 1;
    this.jobPostingId = 1;
    this.jobApplicationId = 1;
    this.resourceId = 1;
    this.resourceCategoryId = 1;
    this.forumPostId = 1;
    this.forumCommentId = 1;
    this.messageId = 1;
    this.consultationId = 1;
    this.skillRecommendationId = 1;
    this.pageContentId = 1;
    this.reviewId = 1;
    this.notificationTypeId = 1;
    this.notificationId = 1;
    this.notificationPreferenceId = 1;

    // Initialize with some expertise areas
    this.initExpertise();

    // Initialize with some resource categories
    this.initResourceCategories();

    // Initialize demo data with professional images
    this.initDemoData();
  }

  private initExpertise() {
    const expertiseAreas = [
      "Leadership Development", 
      "Executive Coaching", 
      "Team Building", 
      "Instructional Design", 
      "eLearning", 
      "LMS Implementation",
      "Change Management",
      "Culture Development",
      "DEI Training",
      "Technical Training",
      "Sales Training",
      "Onboarding"
    ];

    expertiseAreas.forEach(name => {
      const id = this.expertiseId++;
      this.expertises.set(id, { id, name });
    });
  }

  private initResourceCategories() {
    const categories = [
      { name: "Leadership", description: "Resources focused on leadership development and skills" },
      { name: "Technical Skills", description: "Resources for technical skill development" },
      { name: "Soft Skills", description: "Resources for communication and interpersonal skills" },
      { name: "Compliance", description: "Resources related to compliance and regulatory training" },
      { name: "Best Practices", description: "Best practices in Learning & Development" }
    ];

    categories.forEach(cat => {
      const id = this.resourceCategoryId++;
      const category: ResourceCategory = {
        id,
        name: cat.name,
        description: cat.description
      };
      this.resourceCategories.set(id, category);
    });
  }

  private initDemoData() {
    // Create demo users
    this.createDemoUsers();

    // Create demo professional profiles with images
    this.createDemoProfessionalProfiles();

    // Create demo company profiles with logos
    this.createDemoCompanyProfiles();

    // Create demo resources with images
    this.createDemoResources();

    // Create demo job postings
    this.createDemoJobPostings();
  }

  private createDemoUsers() {
    const demoUsers = [
      {
        username: "sarah.johnson",
        email: "sarah.johnson@example.com",
        password: "demo123",
        firstName: "Sarah",
        lastName: "Johnson",
        userType: "professional" as const,
        isAdmin: false
      },
      {
        username: "michael.chen",
        email: "michael.chen@example.com", 
        password: "demo123",
        firstName: "Michael",
        lastName: "Chen",
        userType: "professional" as const,
        isAdmin: false
      },
      {
        username: "alexandra.martinez",
        email: "alexandra.martinez@example.com",
        password: "demo123", 
        firstName: "Alexandra",
        lastName: "Martinez",
        userType: "professional" as const,
        isAdmin: false
      },
      {
        username: "david.wilson",
        email: "david.wilson@example.com",
        password: "demo123",
        firstName: "David", 
        lastName: "Wilson",
        userType: "professional" as const,
        isAdmin: false
      },
      {
        username: "techcorp.admin",
        email: "admin@techcorp.com",
        password: "demo123",
        firstName: "Tech",
        lastName: "Corp",
        userType: "company" as const,
        isAdmin: false
      },
      {
        username: "innovate.solutions",
        email: "hr@innovatesolutions.com", 
        password: "demo123",
        firstName: "Innovate",
        lastName: "Solutions", 
        userType: "company" as const,
        isAdmin: false
      }
    ];

    demoUsers.forEach(userData => {
      const id = this.userId++;
      const user: User = { 
        id, 
        username: userData.username,
        password: userData.password,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        userType: userData.userType,
        isAdmin: userData.isAdmin || false,
        createdAt: new Date(),
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionTier: null,
        subscriptionStatus: null,
        resetToken: null,
        resetTokenExpiry: null,
        stripeConnectAccountId: null,
        payoutAccountSetup: false
      };
      this.users.set(id, user);
    });
  }

  private createDemoProfessionalProfiles() {
    const professionalProfiles = [
      {
        userId: 1,
        firstName: "Sarah",
        lastName: "Johnson", 
        email: "sarah.johnson@example.com",
        phone: "+1 (555) 123-4567",
        title: "Senior Learning & Development Strategist",
        bio: "Experienced L&D professional with over 12 years in corporate training and development. Specialized in creating comprehensive learning ecosystems that drive organizational growth and employee engagement.",
        location: "San Francisco, CA",
        profileImageUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
        ratePerHour: 150,
        featured: true,
        verified: true,
        rating: 4.9,
        reviewCount: 47,
        yearsExperience: 12,
        interests: "Leadership Development, Digital Learning, Change Management",
        industryFocus: "Technology, Healthcare, Finance",
        services: "Strategic Planning, Program Development, Executive Coaching",
        availability: "Available for new projects",
        workExperience: "Former Head of L&D at Fortune 500 companies",
        testimonials: "Sarah transformed our learning culture completely"
      },
      {
        userId: 2,
        firstName: "Michael",
        lastName: "Chen",
        email: "michael.chen@example.com", 
        phone: "+1 (555) 234-5678",
        title: "Executive Leadership Coach",
        bio: "Certified executive coach and former C-suite executive with deep expertise in leadership development, organizational psychology, and high-performance team building.",
        location: "New York, NY",
        profileImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
        ratePerHour: 200,
        featured: true,
        verified: true,
        rating: 4.8,
        reviewCount: 34,
        yearsExperience: 15,
        interests: "Executive Coaching, Leadership Assessment, Strategic Thinking",
        industryFocus: "Technology, Consulting, Manufacturing", 
        services: "Executive Coaching, Leadership Assessments, Board Advisory",
        availability: "Limited availability - premium clients only",
        workExperience: "Former VP at McKinsey & Company, Harvard MBA",
        testimonials: "Michael's coaching elevated our entire leadership team"
      },
      {
        userId: 3,
        firstName: "Alexandra", 
        lastName: "Martinez",
        email: "alexandra.martinez@example.com",
        phone: "+1 (555) 345-6789",
        title: "Corporate Training & Development Specialist",
        bio: "Dynamic training professional specializing in adult learning methodologies, instructional design, and digital learning solutions. Expert in creating engaging, results-driven training programs.",
        location: "Austin, TX",
        profileImageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
        ratePerHour: 120,
        featured: true,
        verified: true,
        rating: 4.7,
        reviewCount: 28,
        yearsExperience: 8,
        interests: "Instructional Design, eLearning, Performance Management",
        industryFocus: "Retail, Hospitality, Education",
        services: "Training Design, LMS Implementation, Skills Assessment",
        availability: "Available for new projects",
        workExperience: "Lead Instructional Designer at major retailers",
        testimonials: "Alexandra's programs boosted our team performance by 40%"
      },
      {
        userId: 4,
        firstName: "David",
        lastName: "Wilson", 
        email: "david.wilson@example.com",
        phone: "+1 (555) 456-7890",
        title: "Change Management & Organizational Development Expert",
        bio: "Strategic change management consultant with proven track record in guiding organizations through complex transformations. Specialized in culture change, process improvement, and stakeholder engagement.",
        location: "Chicago, IL", 
        profileImageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
        ratePerHour: 175,
        featured: false,
        verified: true,
        rating: 4.6,
        reviewCount: 22,
        yearsExperience: 10,
        interests: "Change Management, Culture Transformation, Process Optimization",
        industryFocus: "Financial Services, Healthcare, Government",
        services: "Change Strategy, Culture Assessment, Process Design",
        availability: "Available for new projects",
        workExperience: "Senior Manager at Deloitte Consulting",
        testimonials: "David guided us through our most successful transformation"
      }
    ];

    professionalProfiles.forEach(profile => {
      const id = this.profProfileId++;
      const newProfile: ProfessionalProfile = { 
        id,
        userId: profile.userId,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        title: profile.title,
        bio: profile.bio,
        location: profile.location,
        videoIntroUrl: null,
        ratePerHour: profile.ratePerHour,
        profileImageUrl: profile.profileImageUrl,
        profileImagePath: null,
        galleryImages: [],
        featured: profile.featured,
        verified: profile.verified,
        rating: profile.rating,
        reviewCount: profile.reviewCount,
        yearsExperience: profile.yearsExperience,
        interests: profile.interests,
        industryFocus: profile.industryFocus,
        services: profile.services,
        availability: profile.availability,
        workExperience: profile.workExperience,
        testimonials: profile.testimonials
      };
      this.professionalProfiles.set(id, newProfile);
    });
  }

  private createDemoCompanyProfiles() {
    const companyProfiles = [
      {
        userId: 5,
        companyName: "TechCorp Innovations",
        industry: "Technology",
        description: "Leading technology company focused on AI and machine learning solutions. We're committed to continuous learning and development for our 2,500+ employees across 15 global offices.",
        size: "Large Enterprise (1000+ employees)",
        location: "San Francisco, CA",
        website: "https://techcorp-innovations.com",
        logoUrl: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=200&h=200&fit=crop",
        featured: true,
        verified: true
      },
      {
        userId: 6,
        companyName: "Innovate Solutions",
        industry: "Consulting", 
        description: "Strategic consulting firm specializing in digital transformation and organizational development. We help Fortune 500 companies build learning organizations that thrive in the digital age.",
        size: "Medium Business (100-999 employees)",
        location: "New York, NY",
        website: "https://innovate-solutions.com",
        logoUrl: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop",
        featured: true,
        verified: true
      }
    ];

    companyProfiles.forEach(profile => {
      const id = this.companyProfileId++;
      const newProfile: CompanyProfile = { 
        id,
        userId: profile.userId,
        companyName: profile.companyName,
        industry: profile.industry,
        description: profile.description,
        size: profile.size,
        location: profile.location,
        website: profile.website || null,
        logoUrl: profile.logoUrl || null,
        logoImagePath: null,
        featured: profile.featured,
        verified: profile.verified
      };
      this.companyProfiles.set(id, newProfile);
    });
  }

  private createDemoResources() {
    const demoResources = [
      {
        title: "The Complete Guide to Learning & Development Strategy",
        description: "Comprehensive guide covering modern L&D strategies, from needs analysis to impact measurement. Includes frameworks, templates, and case studies from industry leaders.",
        content: "This comprehensive guide explores the fundamental principles of effective learning and development strategy...",
        resourceType: "guide",
        categoryId: 1,
        authorId: 1,
        featured: true,
        imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=400&fit=crop",
        contentUrl: null
      },
      {
        title: "Executive Leadership Development Program Template",
        description: "Ready-to-implement program template for developing senior leadership capabilities. Includes curriculum outlines, assessment tools, and coaching frameworks.",
        content: "A complete program template designed for organizations looking to develop their senior leadership...",
        resourceType: "template",
        categoryId: 1,
        authorId: 2,
        featured: true,
        imageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop",
        contentUrl: null
      },
      {
        title: "Digital Learning Best Practices Masterclass",
        description: "Video masterclass covering the latest trends in digital learning, including microlearning, adaptive learning platforms, and virtual reality training applications.",
        content: "Digital learning masterclass content covering comprehensive strategies for modern workplace learning...",
        resourceType: "video",
        categoryId: 2,
        authorId: 3,
        featured: true,
        imageUrl: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=600&h=400&fit=crop",
        contentUrl: "https://example.com/masterclass/digital-learning"
      },
      {
        title: "Change Management Workshop Series",
        description: "Interactive workshop series designed to build change management capabilities across your organization. Includes facilitator guides and participant materials.",
        content: "Workshop series content with facilitator guides and comprehensive change management strategies...",
        resourceType: "workshop",
        categoryId: 1,
        authorId: 4,
        featured: false,
        imageUrl: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=600&h=400&fit=crop",
        contentUrl: null
      },
      {
        title: "Performance Management Framework",
        description: "Modern performance management approach that focuses on continuous development rather than annual reviews. Includes implementation roadmap and tools.",
        content: "This framework represents a shift from traditional performance management to a more agile...",
        resourceType: "framework",
        categoryId: 3,
        authorId: 1,
        featured: false,
        imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop",
        contentUrl: null
      },
      {
        title: "Diversity & Inclusion Training Certification",
        description: "Comprehensive certification program for D&I training professionals. Covers unconscious bias, inclusive leadership, and creating psychologically safe environments.",
        content: "Certification program content covering diversity, inclusion, unconscious bias training and implementation...",
        resourceType: "certification",
        categoryId: 4,
        authorId: 2,
        featured: true,
        imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=400&fit=crop",
        contentUrl: null
      }
    ];

    demoResources.forEach(resource => {
      const id = this.resourceId++;
      const newResource: Resource = { 
        ...resource, 
        id, 
        createdAt: new Date(),
        categoryId: resource.categoryId,
        contentUrl: resource.contentUrl,
        filePath: null
      };
      this.resources.set(id, newResource);
    });
  }

  private createDemoJobPostings() {
    const jobPostings = [
      {
        companyId: 1,
        title: "Senior Learning & Development Manager",
        description: "Lead our global L&D initiatives for a fast-growing tech company. Drive strategic learning programs that support our mission to democratize AI technology.",
        requirements: "Master's degree in HR, Psychology, or related field. 7+ years L&D experience. Experience with digital learning platforms and data analytics.",
        location: "San Francisco, CA (Hybrid)",
        jobType: "full-time",
        salaryRange: "$120,000 - $150,000",
        experienceLevel: "senior-level",
        status: "open"
      },
      {
        companyId: 2, 
        title: "Organizational Development Consultant",
        description: "Help our clients build high-performing organizations through strategic OD initiatives. Work with Fortune 500 companies on culture transformation projects.",
        requirements: "PhD or Master's in Organizational Psychology. 5+ years consulting experience. Strong facilitation and change management skills.",
        location: "New York, NY (On-site)",
        jobType: "contract",
        salaryRange: "$180 - $250 per hour",
        experienceLevel: "senior-level", 
        status: "open"
      }
    ];

    jobPostings.forEach(job => {
      const id = this.jobPostingId++;
      const newJob: JobPosting = { 
        ...job,
        id,
        createdAt: new Date(),
        modifiedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        featured: false,
        archived: false,
        remote: null,
        minCompensation: null,
        maxCompensation: null,
        compensationUnit: null,
        duration: null
      };
      this.jobPostings.set(id, newJob);
    });
  }

  // Resource Category operations
  async getResourceCategory(id: number): Promise<ResourceCategory | undefined> {
    return this.resourceCategories.get(id);
  }

  async getAllResourceCategories(): Promise<ResourceCategory[]> {
    return Array.from(this.resourceCategories.values());
  }

  async createResourceCategory(category: InsertResourceCategory): Promise<ResourceCategory> {
    const id = this.resourceCategoryId++;
    const newCategory: ResourceCategory = { 
      id, 
      name: category.name,
      description: category.description || null
    };
    this.resourceCategories.set(id, newCategory);
    return newCategory;
  }

  // AI Matching operations
  async getMatchingJobsForProfessional(professionalId: number, limit: number = 5): Promise<Array<{job: JobPosting, score: number}>> {
    const professional = await this.getProfessionalProfile(professionalId);
    if (!professional) {
      return [];
    }

    // Get all jobs and calculate match scores
    const jobs = await this.getAllJobPostings();
    const matches = jobs
      .filter(job => job.status === "open") // Only consider open jobs
      .map(job => {
        // Get stored match score if available
        const key = `${job.id}-${professionalId}`;
        let score = this.jobMatches.get(key);

        // If no stored score, calculate a basic match score
        if (score === undefined) {
          const profTitle = professional.title?.toLowerCase() || '';
          const profBio = professional.bio?.toLowerCase() || '';
          const profIndustry = professional.industryFocus?.toLowerCase() || '';

          const jobTitle = job.title.toLowerCase();
          const jobDescription = job.description.toLowerCase();
          const jobRequirements = job.requirements.toLowerCase();

          // Calculate text-based match score
          const titleMatch = profTitle && jobTitle.includes(profTitle) ? 0.3 : 0;
          const bioMatch = profBio && (jobDescription.includes(profBio) || jobRequirements.includes(profBio)) ? 0.2 : 0;
          const industryMatch = profIndustry && jobDescription.includes(profIndustry) ? 0.2 : 0;

          // Assign a moderate score for location match
          const locationMatch = professional.location && 
            professional.location === job.location ? 0.3 : 0;

          score = titleMatch + bioMatch + industryMatch + locationMatch;

          // Save the calculated score
          this.jobMatches.set(key, score);
        }

        return { job, score };
      });

    // Sort by score (descending) and apply limit
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async getMatchingProfessionalsForJob(jobId: number, limit: number = 5): Promise<Array<{professional: ProfessionalProfile, score: number}>> {
    const job = await this.getJobPosting(jobId);
    if (!job) {
      return [];
    }

    // Get all professionals and calculate match scores
    const professionals = await this.getAllProfessionalProfiles();
    const matches = professionals.map(professional => {
      // Get stored match score if available
      const key = `${jobId}-${professional.id}`;
      let score = this.jobMatches.get(key);

      // If no stored score, calculate a basic match score
      if (score === undefined) {
        const profTitle = professional.title?.toLowerCase() || '';
        const profBio = professional.bio?.toLowerCase() || '';
        const profIndustry = professional.industryFocus?.toLowerCase() || '';

        const jobTitle = job.title.toLowerCase();
        const jobDescription = job.description.toLowerCase();
        const jobRequirements = job.requirements.toLowerCase();

        // Calculate text-based match score
        const titleMatch = profTitle && jobTitle.includes(profTitle) ? 0.3 : 0;
        const bioMatch = profBio && (jobDescription.includes(profBio) || jobRequirements.includes(profBio)) ? 0.2 : 0;
        const industryMatch = profIndustry && jobDescription.includes(profIndustry) ? 0.2 : 0;

        // Assign a moderate score for location match
        const locationMatch = professional.location && 
          professional.location === job.location ? 0.3 : 0;

        score = titleMatch + bioMatch + industryMatch + locationMatch;

        // Save the calculated score
        this.jobMatches.set(key, score);
      }

      return { professional, score };
    });

    // Sort by score (descending) and apply limit
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async saveJobMatch(jobId: number, professionalId: number, score: number): Promise<boolean> {
    const key = `${jobId}-${professionalId}`;
    this.jobMatches.set(key, score);
    return true;
  }

  // Additional Resource operations
  async getResourcesByCategory(categoryId: number): Promise<Resource[]> {
    return Array.from(this.resources.values())
      .filter(resource => resource.categoryId === categoryId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getResourcesByAuthor(authorId: number): Promise<Resource[]> {
    return Array.from(this.resources.values())
      .filter(resource => resource.authorId === authorId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async searchResources(query?: string, type?: string, categoryId?: number): Promise<Resource[]> {
    return Array.from(this.resources.values())
      .filter(resource => {
        const matchesQuery = !query || 
          resource.title.toLowerCase().includes(query.toLowerCase()) ||
          resource.description.toLowerCase().includes(query.toLowerCase());

        const matchesType = !type || resource.resourceType === type;

        const matchesCategory = !categoryId || resource.categoryId === categoryId;

        return matchesQuery && matchesType && matchesCategory;
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async setResourceFeatured(id: number, featured: boolean): Promise<Resource | undefined> {
    const resource = this.resources.get(id);
    if (!resource) return undefined;

    const updated = { ...resource, featured };
    this.resources.set(id, updated);
    return updated;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async getAllUsers(): Promise<User[]> {
    const cacheKey = 'all-users';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const users = Array.from(this.users.values());
    this.setCache(cacheKey, users);
    return users;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { 
      id, 
      username: insertUser.username,
      password: insertUser.password,
      email: insertUser.email,
      firstName: insertUser.firstName,
      lastName: insertUser.lastName,
      userType: insertUser.userType,
      isAdmin: insertUser.isAdmin || false,
      createdAt: new Date(),
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionTier: null,
      subscriptionStatus: null,
      resetToken: null,
      resetTokenExpiry: null,
      stripeConnectAccountId: null,
      payoutAccountSetup: false
    };
    this.users.set(id, user);
    return user;
  }

  // Password and account recovery operations
  async createResetToken(email: string): Promise<string | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;

    // Generate a random token
    const token = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15);

    // Set expiry to 1 hour from now
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 1);

    // Update user with token
    const updated = { 
      ...user, 
      resetToken: token,
      resetTokenExpiry: expiryDate 
    };

    this.users.set(user.id, updated);
    return token;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const now = new Date();

    return Array.from(this.users.values()).find(
      (user) => user.resetToken === token && 
                user.resetTokenExpiry && 
                user.resetTokenExpiry > now
    );
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const user = await this.getUserByResetToken(token);
    if (!user) return false;

    // Update user with new password and clear token
    const updated = { 
      ...user, 
      password: newPassword,
      resetToken: null,
      resetTokenExpiry: null
    };

    this.users.set(user.id, updated);
    return true;
  }

  // Professional Profile operations
  getProfessionalProfile(id: number): ProfessionalProfile | undefined {
    const profile = this.professionalProfiles.get(id);
    if (!profile) return undefined;

    // Parse JSON fields if they're strings
    if (typeof profile.galleryImages === 'string') {
      try {
        profile.galleryImages = JSON.parse(profile.galleryImages);
      } catch (e) {
        profile.galleryImages = [];
      }
    }

    if (typeof profile.workExperience === 'string') {
      try {
        profile.workExperience = JSON.parse(profile.workExperience);
      } catch (e) {
        profile.workExperience = [];
      }
    }

    if (typeof profile.testimonials === 'string') {
      try {
        profile.testimonials = JSON.parse(profile.testimonials);
      } catch (e) {
        profile.testimonials = [];
      }
    }

    return profile;
  }

  async getProfessionalProfileByUserId(userId: number): Promise<ProfessionalProfile | undefined> {
    return Array.from(this.professionalProfiles.values()).find(
      (profile) => profile.userId === userId
    );
  }

  async getAllProfessionalProfiles(): Promise<ProfessionalProfile[]> {
    const cacheKey = 'all-professional-profiles';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const profiles = Array.from(this.professionalProfiles.values());
    this.setCache(cacheKey, profiles);
    return profiles;
  }

  async getFeaturedProfessionalProfiles(limit: number): Promise<ProfessionalProfile[]> {
    return Array.from(this.professionalProfiles.values())
      .filter(profile => profile.featured)
      .slice(0, limit);
  }

  async createProfessionalProfile(profile: InsertProfessionalProfile): Promise<ProfessionalProfile> {
    const id = this.profProfileId++;

    // Explicitly construct the profile to match the schema exactly
    const newProfile: ProfessionalProfile = { 
      id,
      userId: profile.userId,
      firstName: profile.firstName || null,
      lastName: profile.lastName || null,
      email: profile.email || null,
      phone: profile.phone || null,
      title: profile.title || null,
      bio: profile.bio || null,
      location: profile.location || null,
      videoIntroUrl: profile.videoIntroUrl || null,
      ratePerHour: profile.ratePerHour || null,
      profileImageUrl: profile.profileImageUrl || null,
      profileImagePath: null,
      galleryImages: [],
      featured: profile.featured || false,
      verified: profile.verified || false,
      rating: profile.rating || 0,
      reviewCount: profile.reviewCount || 0,
      yearsExperience: profile.yearsExperience || 0,
      interests: profile.interests || null,
      industryFocus: profile.industryFocus || null,
      services: profile.services || null,
      availability: profile.availability || null,
      workExperience: profile.workExperience || null,
      testimonials: profile.testimonials || null
    };

    this.professionalProfiles.set(id, newProfile);

    // Invalidate related cache
    this.invalidateCache('professional');

    return newProfile;
  }

  updateProfessionalProfile(id: number, updates: Partial<ProfessionalProfile>): ProfessionalProfile {
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
    return this.getProfessionalProfile(id)!;
  }

  async deleteProfessionalProfile(id: number): Promise<boolean> {
    return this.professionalProfiles.delete(id);
  }

  // Expertise operations
  async getAllExpertise(): Promise<Expertise[]> {
    return Array.from(this.expertises.values());
  }

  async getExpertiseById(id: number): Promise<Expertise | undefined> {
    return this.expertises.get(id);
  }

  async createExpertise(insertExpertise: InsertExpertise): Promise<Expertise> {
    const id = this.expertiseId++;
    const expertise: Expertise = { ...insertExpertise, id };
    this.expertises.set(id, expertise);
    return expertise;
  }

  async getProfessionalExpertise(professionalId: number): Promise<Expertise[]> {
    const profExpertiseEntries = Array.from(this.professionalExpertises.values())
      .filter(pe => pe.professionalId === professionalId);

    return profExpertiseEntries.map(pe => this.expertises.get(pe.expertiseId)!)
      .filter(Boolean);
  }

  async addProfessionalExpertise(insertProfExpertise: InsertProfessionalExpertise): Promise<ProfessionalExpertise> {
    // Check if it already exists
    const exists = Array.from(this.professionalExpertises.values()).some(
      pe => pe.professionalId === insertProfExpertise.professionalId && 
            pe.expertiseId === insertProfExpertise.expertiseId
    );

    if (exists) {
      throw new Error("Professional already has this expertise");
    }

    const id = this.profExpertiseId++;
    const profExpertise: ProfessionalExpertise = { ...insertProfExpertise, id };
    this.professionalExpertises.set(id, profExpertise);
    return profExpertise;
  }

  // Delete professional expertise
  async deleteProfessionalExpertise(id: number): Promise<boolean> {
    if (!this.professionalExpertises.has(id)) {
      return false;
    }

    this.professionalExpertises.delete(id);
    return true;
  }

  // Certification operations
  async getCertification(id: number): Promise<Certification | undefined> {
    return this.certifications.get(id);
  }

  async getProfessionalCertifications(professionalId: number): Promise<Certification[]> {
    return Array.from(this.certifications.values())
      .filter(cert => cert.professionalId === professionalId);
  }

  async createCertification(insertCertification: InsertCertification): Promise<Certification> {
    const id = this.certificationId++;
    const certification: Certification = { ...insertCertification, id };
    this.certifications.set(id, certification);
    return certification;
  }

  async deleteCertification(id: number): Promise<boolean> {
    return this.certifications.delete(id);
  }

  // Company Profile operations
  async getCompanyProfile(id: number): Promise<CompanyProfile | undefined> {
    return this.companyProfiles.get(id);
  }

  async getCompanyProfileByUserId(userId: number): Promise<CompanyProfile | undefined> {
    return Array.from(this.companyProfiles.values()).find(
      (profile) => profile.userId === userId
    );
  }

  async getAllCompanyProfiles(): Promise<CompanyProfile[]> {
    return Array.from(this.companyProfiles.values());
  }

  async createCompanyProfile(profile: InsertCompanyProfile): Promise<CompanyProfile> {
    const id = this.companyProfileId++;
    const newProfile: CompanyProfile = { 
      id,
      userId: profile.userId,
      companyName: profile.companyName,
      industry: profile.industry,
      description: profile.description,
      size: profile.size,
      location: profile.location,
      website: profile.website || null,
      logoUrl: profile.logoUrl || null,
      logoImagePath: profile.logoImagePath || null,
      featured: profile.featured || false,
      verified: profile.verified || false
    };
    this.companyProfiles.set(id, newProfile);
    return newProfile;
  }

  async updateCompanyProfile(id: number, profile: Partial<InsertCompanyProfile>): Promise<CompanyProfile | undefined> {
    const existing = this.companyProfiles.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...profile };
    this.companyProfiles.set(id, updated);
    return updated;
  }

  // Delete company profile
  async deleteCompanyProfile(id: number): Promise<boolean> {
    if (!this.companyProfiles.has(id)) {
      return false;
    }

    this.companyProfiles.delete(id);
    return true;
  }

  // Job Posting operations
  async getJobPosting(id: number): Promise<JobPosting | undefined> {
    return this.jobPostings.get(id);
  }

  async getAllJobPostings(): Promise<JobPosting[]> {
    const cacheKey = 'all-job-postings';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const jobPostings = Array.from(this.jobPostings.values());
    this.setCache(cacheKey, jobPostings);
    return jobPostings;
  }

  async getLatestJobPostings(limit: number): Promise<JobPosting[]> {
    return Array.from(this.jobPostings.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getCompanyJobPostings(companyId: number): Promise<JobPosting[]> {
    return Array.from(this.jobPostings.values())
      .filter(job => job.companyId === companyId);
  }

  async createJobPosting(job: InsertJobPosting): Promise<JobPosting> {
    const id = this.jobPostingId++;
    const newJob: JobPosting = { 
      id, 
      companyId: job.companyId,
      title: job.title,
      description: job.description,
      location: job.location,
      jobType: job.jobType,
      requirements: job.requirements,
      createdAt: new Date(),
      modifiedAt: new Date(),
      status: job.status || "open",
      featured: job.featured || false,
      archived: job.archived || false,
      minCompensation: job.minCompensation || null,
      maxCompensation: job.maxCompensation || null,
      duration: job.duration || null,
      expiresAt: job.expiresAt || null,
      compensationUnit: job.compensationUnit || null,
      remote: job.remote || false
    };
    this.jobPostings.set(id, newJob);
    return newJob;
  }

  async updateJobPosting(id: number, job: Partial<InsertJobPosting>): Promise<JobPosting | undefined> {
    const existing = this.jobPostings.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...job };
    this.jobPostings.set(id, updated);
    return updated;
  }

  async deleteJobPosting(id: number): Promise<boolean> {
    return this.jobPostings.delete(id);
  }

  // Job Application operations
  async getJobApplication(id: number): Promise<JobApplication | undefined> {
    return this.jobApplications.get(id);
  }

  async getJobApplicationsByJob(jobId: number): Promise<JobApplication[]> {
    return Array.from(this.jobApplications.values())
      .filter(app => app.jobId === jobId);
  }

  async getJobApplicationsByProfessional(professionalId: number): Promise<JobApplication[]> {
    return Array.from(this.jobApplications.values())
      .filter(app => app.professionalId === professionalId);
  }

  async createJobApplication(application: InsertJobApplication): Promise<JobApplication> {
    // Check if application already exists
    const exists = Array.from(this.jobApplications.values()).some(
      app => app.jobId === application.jobId && app.professionalId === application.professionalId
    );

    if (exists) {
      throw new Error("Professional has already applied to this job");
    }

    const id = this.jobApplicationId++;
    const newApplication: JobApplication = { 
      ...application, 
      id, 
      createdAt: new Date(),
      status: application.status || "pending"
    };
    this.jobApplications.set(id, newApplication);
    return newApplication;
  }

  async updateJobApplicationStatus(id: number, status: string): Promise<JobApplication | undefined> {
    const existing = this.jobApplications.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, status };
    this.jobApplications.set(id, updated);
    return updated;
  }

  // Delete job application
  async deleteJobApplication(id: number): Promise<boolean> {
    if (!this.jobApplications.has(id)) {
      return false;
    }

    this.jobApplications.delete(id);
    return true;
  }

  // Resource operations
  async getResource(id: number): Promise<Resource | undefined> {
    return this.resources.get(id);
  }

  async getAllResources(): Promise<Resource[]> {
    const cacheKey = 'all-resources';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const resources = Array.from(this.resources.values());
    this.setCache(cacheKey, resources);
    return resources;
  }

  // Cache management methods
  private getFromCache(key: string): any {
    const cached = this.queryCache.get(key);
    if (!cached) return null;

    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.queryCache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: any): void {
    this.queryCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private invalidateCache(pattern?: string): void {
    if (pattern) {
      // Invalidate specific cache entries
      for (const key of this.queryCache.keys()) {
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

  async getFeaturedResources(limit: number): Promise<Resource[]> {
    return Array.from(this.resources.values())
      .filter(resource => resource.featured)
      .slice(0, limit);
  }

  async createResource(resource: InsertResource): Promise<Resource> {
    const id = this.resourceId++;
    const newResource: Resource = { 
      ...resource, 
      id, 
      createdAt: new Date(),
      featured: resource.featured || false,
      imageUrl: resource.imageUrl || null,
      categoryId: resource.categoryId || null,
      contentUrl: resource.contentUrl || null,
      filePath: resource.filePath || null
    };
    this.resources.set(id, newResource);
    return newResource;
  }

  async updateResource(id: number, resource: Partial<Resource>): Promise<Resource | undefined> {
    const existing = this.resources.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...resource };
    this.resources.set(id, updated);
    return updated;
  }

  async deleteResource(id: number): Promise<boolean> {
    return this.resources.delete(id);
  }

  // Forum operations
  async getForumPost(id: number): Promise<ForumPost | undefined> {
    return this.forumPosts.get(id);
  }

  async getAllForumPosts(): Promise<ForumPost[]> {
    return Array.from(this.forumPosts.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createForumPost(post: InsertForumPost): Promise<ForumPost> {
    const id = this.forumPostId++;
    const newPost: ForumPost = { 
      ...post, 
      id, 
      createdAt: new Date() 
    };
    this.forumPosts.set(id, newPost);
    return newPost;
  }

  async getPostComments(postId: number): Promise<ForumComment[]> {
    return Array.from(this.forumComments.values())
      .filter(comment => comment.postId === postId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createForumComment(comment: InsertForumComment): Promise<ForumComment> {
    const id = this.forumCommentId++;
    const newComment: ForumComment = { 
      ...comment, 
      id, 
      createdAt: new Date() 
    };
    this.forumComments.set(id, newComment);
    return newComment;
  }

  // Message operations
  async getUserMessages(userId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => msg.senderId === userId || msg.receiverId === userId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async getConversation(user1Id: number, user2Id: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => 
        (msg.senderId === user1Id && msg.receiverId === user2Id) ||
        (msg.senderId === user2Id && msg.receiverId === user1Id)
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.messageId++;
    const newMessage: Message = { 
      ...message, 
      id, 
      read: false,
      createdAt: new Date() 
    };
    this.messages.set(id, newMessage);
    return newMessage;
  }

  async markMessageAsRead(id: number): Promise<boolean> {
    const message = this.messages.get(id);
    if (!message) return false;

    message.read = true;
    this.messages.set(id, message);
    return true;
  }

  // Consultation operations
  async getConsultation(id: number): Promise<Consultation | undefined> {
    return this.consultations.get(id);
  }

  async getProfessionalConsultations(professionalId: number): Promise<Consultation[]> {
    return Array.from(this.consultations.values())
      .filter(consult => consult.professionalId === professionalId)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  async getCompanyConsultations(companyId: number): Promise<Consultation[]> {
    return Array.from(this.consultations.values())
      .filter(consult => consult.companyId === companyId)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  async createConsultation(consultation: InsertConsultation): Promise<Consultation> {
    const id = this.consultationId++;
    const newConsultation: Consultation = { 
      ...consultation, 
      id, 
      createdAt: new Date(),
      status: consultation.status || "scheduled",
      notes: consultation.notes || null
    };
    this.consultations.set(id, newConsultation);
    return newConsultation;
  }

  async updateConsultationStatus(id: number, status: string): Promise<Consultation | undefined> {
    const existing = this.consultations.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, status };
    this.consultations.set(id, updated);
    return updated;
  }

  // Added user update method
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const existing = this.users.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...userData };
    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  // Stripe methods
  async updateStripeCustomerId(userId: number, customerId: string): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const updated = { ...user, stripeCustomerId: customerId };
    this.users.set(userId, updated);
    return updated;
  }

  async updateStripeSubscriptionId(userId: number, subscriptionId: string): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const updated = { ...user, stripeSubscriptionId: subscriptionId };
    this.users.set(userId, updated);
    return updated;
  }

  async updateUserSubscription(userId: number, tier: string, status: string): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const updated = { 
      ...user, 
      subscriptionTier: tier, 
      subscriptionStatus: status 
    };
    this.users.set(userId, updated);
    return updated;
  }

  async getUserByStripeCustomerId(customerId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.stripeCustomerId === customerId
    );
  }

  // Skill Recommendation operations
  async getSkillRecommendation(id: number): Promise<SkillRecommendation | undefined> {
    return this.skillRecommendations.get(id);
  }

  async getSkillRecommendationsByProfessional(professionalId: number): Promise<SkillRecommendation | undefined> {
    return Array.from(this.skillRecommendations.values()).find(
      (rec) => rec.professionalId === professionalId
    );
  }

  async createSkillRecommendation(recommendation: InsertSkillRecommendation): Promise<SkillRecommendation> {
    const id = this.skillRecommendationId++;
    const newRecommendation: SkillRecommendation = { 
      ...recommendation, 
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.skillRecommendations.set(id, newRecommendation);
    return newRecommendation;
  }

  async updateSkillRecommendation(id: number, recommendation: Partial<InsertSkillRecommendation>): Promise<SkillRecommendation | undefined> {
    const existing = this.skillRecommendations.get(id);
    if (!existing) return undefined;

    const updated = { 
      ...existing, 
      ...recommendation,
      updatedAt: new Date()
    };
    this.skillRecommendations.set(id, updated);
    return updated;
  }

  // Page Content operations
  async getPageContent(id: number): Promise<PageContent | undefined> {
    return this.pageContents.get(id);
  }

  async getPageContentBySlug(slug: string): Promise<PageContent | undefined> {
    return Array.from(this.pageContents.values()).find(
      (content) => content.slug === slug
    );
  }

  async getAllPageContents(): Promise<PageContent[]> {
    return Array.from(this.pageContents.values());
  }

  async createPageContent(content: InsertPageContent): Promise<PageContent> {
    const id = this.pageContentId++;
    const newContent: PageContent = {
      ...content,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastEditedBy: content.lastEditedBy || null
    };
    this.pageContents.set(id, newContent);
    return newContent;
  }

  async updatePageContent(id: number, content: Partial<InsertPageContent>): Promise<PageContent | undefined> {
    const existing = this.pageContents.get(id);
    if (!existing) return undefined;

    const updated = { 
      ...existing, 
      ...content,
      updatedAt: new Date(),
      lastEditedBy: content.lastEditedBy !== undefined ? content.lastEditedBy : existing.lastEditedBy 
    };
    this.pageContents.set(id, updated);
    return updated;
  }

  async deletePageContent(id: number): Promise<boolean> {
    return this.pageContents.delete(id);
  }

  // Review operations
  async getReview(id: number): Promise<Review | undefined> {
    return this.reviews.get(id);
  }

  async getProfessionalReviews(professionalId: number): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .filter(review => review.professionalId === professionalId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getCompanyReviews(companyId: number): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .filter(review => review.companyId === companyId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getConsultationReview(consultationId: number): Promise<Review | undefined> {
    return Array.from(this.reviews.values())
      .find(review => review.consultationId === consultationId);
  }

  async createReview(review: InsertReview): Promise<Review> {
    const id = this.reviewId++;
    const newReview: Review = {
      ...review,
      id,
      createdAt: new Date()
    };
    this.reviews.set(id, newReview);

    // Update the professional's rating
    await this.updateProfessionalRating(review.professionalId);

    return newReview;
  }

  async updateReview(id: number, review: Partial<Review>): Promise<Review | undefined> {
    const existing = this.reviews.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...review };
    this.reviews.set(id, updated);

    // Update the professional's rating if the rating was changed
    if (review.rating) {
      await this.updateProfessionalRating(existing.professionalId);
    }

    return updated;
  }

  async deleteReview(id: number): Promise<boolean> {
    const review = this.reviews.get(id);
    if (!review) return false;

    const result = this.reviews.delete(id);

    // Update the professional's rating
    if (result) {
      await this.updateProfessionalRating(review.professionalId);
    }

    return result;
  }

  async updateProfessionalRating(professionalId: number): Promise<boolean> {
    const professional = await this.getProfessionalProfile(professionalId);
    if (!professional) return false;

    const reviews = await this.getProfessionalReviews(professionalId);

    if (reviews.length === 0) {
      // Reset rating if no reviews
      const updated = {
        ...professional,
        rating: 0,
        reviewCount: 0
      };
      this.professionalProfiles.set(professionalId, updated);
      return true;
    }

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = Math.round(totalRating / reviews.length);

    const updated = {
      ...professional,
      rating: averageRating,
      reviewCount: reviews.length
    };

    this.professionalProfiles.set(professionalId, updated);
    return true;
  }

  // Notification Type operations
  async getNotificationType(id: number): Promise<NotificationType | undefined> {
    return this.notificationTypes.get(id);
  }

  async getNotificationTypeByName(name: string): Promise<NotificationType | undefined> {
    return Array.from(this.notificationTypes.values())
      .find(type => type.name === name);
  }

  async getAllNotificationTypes(): Promise<NotificationType[]> {
    return Array.from(this.notificationTypes.values());
  }

  async createNotificationType(type: InsertNotificationType): Promise<NotificationType> {
    const id = this.notificationTypeId++;
    const newType: NotificationType = {
      ...type,
      id
    };
    this.notificationTypes.set(id, newType);
    return newType;
  }

  // Notification operations
  async getNotification(id: number): Promise<Notification | undefined> {
    return this.notifications.get(id);
  }

  async getUserNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getUserUnreadNotifications(userId: number): Promise<Notification[]> {
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
      createdAt: new Date()
    };
    this.notifications.set(id, newNotification);
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const notification = this.notifications.get(id);
    if (!notification) return false;

    const updated = { ...notification, read: true };
    this.notifications.set(id, updated);
    return true;
  }

  async markAllUserNotificationsAsRead(userId: number): Promise<boolean> {
    const userNotifications = await this.getUserNotifications(userId);

    userNotifications.forEach(notification => {
      const updated = { ...notification, read: true };
      this.notifications.set(notification.id, updated);
    });

    return true;
  }

  async deleteNotification(id: number): Promise<boolean> {
    return this.notifications.delete(id);
  }

  // Notification Preferences operations
  async getUserNotificationPreferences(userId: number): Promise<NotificationPreference[]> {
    return Array.from(this.notificationPreferences.values())
      .filter(pref => pref.userId === userId);
  }

  async getUserNotificationPreference(userId: number, typeId: number): Promise<NotificationPreference | undefined> {
    return Array.from(this.notificationPreferences.values())
      .find(pref => pref.userId === userId && pref.typeId === typeId);
  }

  async createOrUpdateNotificationPreference(preference: InsertNotificationPreference): Promise<NotificationPreference> {
    // Check if preference already exists
    const existing = await this.getUserNotificationPreference(preference.userId, preference.typeId);

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
        id
      };
      this.notificationPreferences.set(id, newPreference);
      return newPreference;
    }
  }

  // Authentication token operations for "Remember Me"
  async createAuthToken(userId: number, type: string, expiresAt: Date, userAgent?: string, ipAddress?: string): Promise<AuthToken> {
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');

    const authToken: AuthToken = {
      id: Date.now(), // Simple ID generation for in-memory storage
      userId,
      token,
      type,
      expiresAt,
      createdAt: new Date(),
      lastUsedAt: null,
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
      isRevoked: false
    };

    this.authTokens.set(token, authToken);
    return authToken;
  }

  async getAuthToken(token: string): Promise<AuthToken | undefined> {
    return this.authTokens.get(token);
  }

  async validateAuthToken(token: string): Promise<User | undefined> {
    const authToken = this.authTokens.get(token);

    if (!authToken || authToken.isRevoked || authToken.expiresAt < new Date()) {
      return undefined;
    }

    // Update last used timestamp
    authToken.lastUsedAt = new Date();
    this.authTokens.set(token, authToken);

    return this.users.get(authToken.userId);
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
    for (const [token, authToken] of this.authTokens.entries()) {
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

    for (const [token, authToken] of this.authTokens.entries()) {
      if (authToken.expiresAt < now || authToken.isRevoked) {
        this.authTokens.delete(token);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  // Subscription plans operations
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    // Return hardcoded subscription plans for in-memory storage
    return [
      {
        id: 21,
        name: "Starter",
        description: null,
        userType: "professional",
        monthlyPriceUsd: 0,
        yearlyPriceUsd: 0,
        monthlyPriceAed: 0,
        yearlyPriceAed: 0,
        jobApplicationLimit: 0,
        teamMemberLimit: null,
        resourceDownloadLimit: 3,
        isActive: true
      },
      {
        id: 22,
        name: "Professional",
        description: null,
        userType: "professional",
        monthlyPriceUsd: 1900,
        yearlyPriceUsd: 19000,
        monthlyPriceAed: 7000,
        yearlyPriceAed: 70000,
        jobApplicationLimit: 15,
        teamMemberLimit: null,
        resourceDownloadLimit: 50,
        isActive: true
      },
      {
        id: 23,
        name: "Expert",
        description: null,
        userType: "professional",
        monthlyPriceUsd: 4900,
        yearlyPriceUsd: 49000,
        monthlyPriceAed: 18000,
        yearlyPriceAed: 180000,
        jobApplicationLimit: null,
        teamMemberLimit: null,
        resourceDownloadLimit: null,
        isActive: true
      },
      {
        id: 24,
        name: "Elite",
        description: null,
        userType: "professional",
        monthlyPriceUsd: 9900,
        yearlyPriceUsd: 99000,
        monthlyPriceAed: 36400,
        yearlyPriceAed: 364000,
        jobApplicationLimit: null,
        teamMemberLimit: null,
        resourceDownloadLimit: null,
        isActive: true
      }
    ];
  }

  // Portfolio Showcase operations - Professional Awards
  async getProfessionalAwards(professionalId: number): Promise<ProfessionalAward[]> {
    return [];
  }

  async createProfessionalAward(award: InsertProfessionalAward): Promise<ProfessionalAward> {
    const id = Math.floor(Math.random() * 1000000);
    const newAward: ProfessionalAward = {
      ...award,
      id,
      createdAt: new Date()
    };
    return newAward;
  }

  async updateProfessionalAward(id: number, award: Partial<InsertProfessionalAward>): Promise<ProfessionalAward | undefined> {
    return undefined;
  }

  async deleteProfessionalAward(id: number): Promise<boolean> {
    return false;
  }

  // Training Materials Library
  async getTrainingMaterials(professionalId: number): Promise<TrainingMaterial[]> {
    return [];
  }

  async createTrainingMaterial(material: InsertTrainingMaterial): Promise<TrainingMaterial> {
    const id = Math.floor(Math.random() * 1000000);
    const newMaterial: TrainingMaterial = {
      ...material,
      id,
      createdAt: new Date()
    };
    return newMaterial;
  }

  async updateTrainingMaterial(id: number, material: Partial<InsertTrainingMaterial>): Promise<TrainingMaterial | undefined> {
    return undefined;
  }

  async deleteTrainingMaterial(id: number): Promise<boolean> {
    return false;
  }

  // Certification Portfolio
  async getProfessionalCertificationPortfolio(professionalId: number): Promise<ProfessionalCertificationPortfolio[]> {
    return [];
  }

  async createProfessionalCertificationPortfolio(cert: InsertProfessionalCertificationPortfolio): Promise<ProfessionalCertificationPortfolio> {
    const id = Math.floor(Math.random() * 1000000);
    const newCert: ProfessionalCertificationPortfolio = {
      ...cert,
      id,
      createdAt: new Date()
    };
    return newCert;
  }

  async updateProfessionalCertificationPortfolio(id: number, cert: Partial<InsertProfessionalCertificationPortfolio>): Promise<ProfessionalCertificationPortfolio | undefined> {
    return undefined;
  }

  async deleteProfessionalCertificationPortfolio(id: number): Promise<boolean> {
    return false;
  }

  // External Portfolio Links
  async getExternalPortfolioLinks(professionalId: number): Promise<ExternalPortfolioLink[]> {
    return [];
  }

  async createExternalPortfolioLink(link: InsertExternalPortfolioLink): Promise<ExternalPortfolioLink> {
    const id = Math.floor(Math.random() * 1000000);
    const newLink: ExternalPortfolioLink = {
      ...link,
      id,
      createdAt: new Date()
    };
    return newLink;
  }

  async updateExternalPortfolioLink(id: number, link: Partial<InsertExternalPortfolioLink>): Promise<ExternalPortfolioLink | undefined> {
    return undefined;
  }

  async deleteExternalPortfolioLink(id: number): Promise<boolean> {
    return false;
  }
}

export class DatabaseStorage implements IStorage {
  // Portfolio Showcase operations - Professional Awards
  async getProfessionalAwards(professionalId: number): Promise<ProfessionalAward[]> {
    if (!db) return [];
    try {
      const awards = await db
        .select()
        .from(professionalAwards)
        .where(eq(professionalAwards.professionalId, professionalId))
        .orderBy(desc(professionalAwards.dateReceived));
      return awards;
    } catch (error) {
      console.error("Error fetching professional awards:", error);
      return [];
    }
  }

  async createProfessionalAward(award: InsertProfessionalAward): Promise<ProfessionalAward> {
    if (!db) throw new Error('Database not initialized');
    try {
      const [newAward] = await db
        .insert(professionalAwards)
        .values(award)
        .returning();
      return newAward;
    } catch (error) {
      console.error("Error creating professional award:", error);
      throw error;
    }
  }

  async updateProfessionalAward(id: number, award: Partial<InsertProfessionalAward>): Promise<ProfessionalAward | undefined> {
    if (!db) return undefined;
    try {
      const [updated] = await db
        .update(professionalAwards)
        .set(award)
        .where(eq(professionalAwards.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating professional award:", error);
      return undefined;
    }
  }

  async deleteProfessionalAward(id: number): Promise<boolean> {
    if (!db) return false;
    try {
      await db
        .delete(professionalAwards)
        .where(eq(professionalAwards.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting professional award:", error);
      return false;
    }
  }

  // Training Materials Library
  async getTrainingMaterials(professionalId: number): Promise<TrainingMaterial[]> {
    if (!db) return [];
    try {
      const materials = await db
        .select()
        .from(trainingMaterials)
        .where(eq(trainingMaterials.professionalId, professionalId))
        .orderBy(desc(trainingMaterials.createdAt));
      return materials;
    } catch (error) {
      console.error("Error fetching training materials:", error);
      return [];
    }
  }

  async createTrainingMaterial(material: InsertTrainingMaterial): Promise<TrainingMaterial> {
    if (!db) throw new Error('Database not initialized');
    try {
      const [newMaterial] = await db
        .insert(trainingMaterials)
        .values(material)
        .returning();
      return newMaterial;
    } catch (error) {
      console.error("Error creating training material:", error);
      throw error;
    }
  }

  async updateTrainingMaterial(id: number, material: Partial<InsertTrainingMaterial>): Promise<TrainingMaterial | undefined> {
    if (!db) return undefined;
    try {
      const [updated] = await db
        .update(trainingMaterials)
        .set(material)
        .where(eq(trainingMaterials.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating training material:", error);
      return undefined;
    }
  }

  async deleteTrainingMaterial(id: number): Promise<boolean> {
    if (!db) return false;
    try {
      await db
        .delete(trainingMaterials)
        .where(eq(trainingMaterials.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting training material:", error);
      return false;
    }
  }

  // Certification Portfolio
  async getProfessionalCertificationPortfolio(professionalId: number): Promise<ProfessionalCertificationPortfolio[]> {
    if (!db) return [];
    try {
      const certifications = await db
        .select()
        .from(professionalCertificationPortfolio)
        .where(eq(professionalCertificationPortfolio.professionalId, professionalId))
        .orderBy(desc(professionalCertificationPortfolio.completionDate));
      return certifications;
    } catch (error) {
      console.error("Error fetching certification portfolio:", error);
      return [];
    }
  }

  async createProfessionalCertificationPortfolio(cert: InsertProfessionalCertificationPortfolio): Promise<ProfessionalCertificationPortfolio> {
    if (!db) throw new Error('Database not initialized');
    try {
      const [newCert] = await db
        .insert(professionalCertificationPortfolio)
        .values(cert)
        .returning();
      return newCert;
    } catch (error) {
      console.error("Error creating certification portfolio entry:", error);
      throw error;
    }
  }

  async updateProfessionalCertificationPortfolio(id: number, cert: Partial<InsertProfessionalCertificationPortfolio>): Promise<ProfessionalCertificationPortfolio | undefined> {
    if (!db) return undefined;
    try {
      const [updated] = await db
        .update(professionalCertificationPortfolio)
        .set(cert)
        .where(eq(professionalCertificationPortfolio.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating certification portfolio:", error);
      return undefined;
    }
  }

  async deleteProfessionalCertificationPortfolio(id: number): Promise<boolean> {
    if (!db) return false;
    try {
      await db
        .delete(professionalCertificationPortfolio)
        .where(eq(professionalCertificationPortfolio.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting certification portfolio entry:", error);
      return false;
    }
  }

  // External Portfolio Links
  async getExternalPortfolioLinks(professionalId: number): Promise<ExternalPortfolioLink[]> {
    if (!db) return [];
    try {
      const links = await db
        .select()
        .from(externalPortfolioLinks)
        .where(eq(externalPortfolioLinks.professionalId, professionalId))
        .orderBy(desc(externalPortfolioLinks.createdAt));
      return links;
    } catch (error) {
      console.error("Error fetching portfolio links:", error);
      return [];
    }
  }

  async createExternalPortfolioLink(link: InsertExternalPortfolioLink): Promise<ExternalPortfolioLink> {
    if (!db) throw new Error('Database not initialized');
    try {
      const [newLink] = await db
        .insert(externalPortfolioLinks)
        .values(link)
        .returning();
      return newLink;
    } catch (error) {
      console.error("Error creating portfolio link:", error);
      throw error;
    }
  }

  async updateExternalPortfolioLink(id: number, link: Partial<InsertExternalPortfolioLink>): Promise<ExternalPortfolioLink | undefined> {
    if (!db) return undefined;
    try {
      const [updated] = await db
        .update(externalPortfolioLinks)
        .set(link)
        .where(eq(externalPortfolioLinks.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error("Error updating portfolio link:", error);
      return undefined;
    }
  }

  async deleteExternalPortfolioLink(id: number): Promise<boolean> {
    if (!db) return false;
    try {
      await db
        .delete(externalPortfolioLinks)
        .where(eq(externalPortfolioLinks.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting portfolio link:", error);
      return false;
    }
  }

  // Review operations
  async getReview(id: number): Promise<Review | undefined> {
    const [review] = await db?.select().from(reviews).where(eq(reviews.id, id)) || [];
    return review;
  }

  async getProfessionalReviews(professionalId: number): Promise<Review[]> {
    const results = await db?.select()
      .from(reviews)
      .where(eq(reviews.professionalId, professionalId))
      .orderBy(desc(reviews.createdAt)) || [];
    return results;
  }

  async getCompanyReviews(companyId: number): Promise<Review[]> {
    const results = await db?.select()
      .from(reviews)
      .where(eq(reviews.companyId, companyId))
      .orderBy(desc(reviews.createdAt)) || [];
    return results;
  }

  async getConsultationReview(consultationId: number): Promise<Review | undefined> {
    const [review] = await db?.select()
      .from(reviews)
      .where(eq(reviews.consultationId, consultationId)) || [];
    return review;
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db?.insert(reviews)
      .values(review)
      .returning() || [];

    // Update the professional's rating
    await this.updateProfessionalRating(review.professionalId);

    return newReview;
  }

  async updateReview(id: number, reviewData: Partial<Review>): Promise<Review | undefined> {
    const [updatedReview] = await db?.update(reviews)
      .set(reviewData)
      .where(eq(reviews.id, id))
      .returning() || [];

    if (updatedReview && reviewData.rating !== undefined) {
      await this.updateProfessionalRating(updatedReview.professionalId);
    }

    return updatedReview;
  }

  async deleteReview(id: number): Promise<boolean> {
    const [deletedReview] = await db?.delete(reviews)
      .where(eq(reviews.id, id))
      .returning() || [];

    if (deletedReview) {
      await this.updateProfessionalRating(deletedReview.professionalId);
      return true;
    }

    return false;
  }

  async updateProfessionalRating(professionalId: number): Promise<boolean> {
    // Get all reviews for this professional
    const professionalReviews = await this.getProfessionalReviews(professionalId);

    if (professionalReviews.length === 0) {
      // Reset rating if no reviews
      await db?.update(professionalProfiles)
        .set({
          rating: 0,
          reviewCount: 0
        })
        .where(eq(professionalProfiles.id, professionalId));
      return true;
    }

    // Calculate average rating
    const totalRating = professionalReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = Math.round(totalRating / professionalReviews.length);

    // Update the professional profile
    await db?.update(professionalProfiles)
      .set({
        rating: averageRating,
        reviewCount: professionalReviews.length
      })
      .where(eq(professionalProfiles.id, professionalId));

    return true;
  }

  // Notification operations
  async getNotificationType(id: number): Promise<NotificationType | undefined> {
    const [notificationType] = await db?.select()
      .from(notificationTypes)
      .where(eq(notificationTypes.id, id)) || [];
    return notificationType;
  }

  async getNotificationTypeByName(name: string): Promise<NotificationType | undefined> {
    const [notificationType] = await db?.select()
      .from(notificationTypes)
      .where(eq(notificationTypes.name, name)) || [];
    return notificationType;
  }

  async getAllNotificationTypes(): Promise<NotificationType[]> {
    const results = await db?.select().from(notificationTypes) || [];
    return results;
  }

  async createNotificationType(type: InsertNotificationType): Promise<NotificationType> {
    const [newType] = await db?.insert(notificationTypes)
      .values(type)
      .returning() || [];
    return newType;
  }

  async getNotification(id: number): Promise<Notification | undefined> {
    const [notification] = await db?.select()
      .from(notifications)
      .where(eq(notifications.id, id)) || [];
    return notification;
  }

  async getUserNotifications(userId: number): Promise<Notification[]> {
    const results = await db?.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt)) || [];
    return results;
  }

  async getUserUnreadNotifications(userId: number): Promise<Notification[]> {
    if (!db) return [];
    try {
      const results = await db.select()
        .from(notifications)
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.read, false)
        ))
        .orderBy(desc(notifications.createdAt)) || [];
      return results;
    } catch (err) {
      console.error("Error getting unread notifications:", err);
      return [];
    }
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db?.insert(notifications)
      .values({
        ...notification,
        read: false
      })
      .returning() || [];
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const [updated] = await db?.update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id))
      .returning() || [];
    return !!updated;
  }

  async markAllUserNotificationsAsRead(userId: number): Promise<boolean> {
    await db?.update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));
    return true;
  }

  async deleteNotification(id: number): Promise<boolean> {
    const [deleted] = await db?.delete(notifications)
      .where(eq(notifications.id, id))
      .returning() || [];
    return !!deleted;
  }

  async getUserNotificationPreference(userId: number, typeId: number): Promise<NotificationPreference | undefined> {
    const [preference] = await db?.select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .where(eq(notificationPreferences.typeId, typeId)) || [];
    return preference;
  }

  async getUserNotificationPreferences(userId: number): Promise<NotificationPreference[]> {
    const preferences = await db?.select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId)) || [];
    return preferences;
  }

  async createOrUpdateNotificationPreference(preference: InsertNotificationPreference): Promise<NotificationPreference> {
    // Check if preference already exists
    const existingPreference = await this.getUserNotificationPreference(
      preference.userId, 
      preference.typeId
    );

    if (existingPreference) {
      // Update existing preference
      const [updated] = await db?.update(notificationPreferences)
        .set({
          email: preference.email,
          inApp: preference.inApp
        })
        .where(eq(notificationPreferences.id, existingPreference.id))
        .returning() || [];
      return updated;
    } else {
      // Create new preference
      const [newPreference] = await db?.insert(notificationPreferences)
        .values(preference)
        .returning() || [];
      return newPreference;
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  // Password and account recovery operations
  async createResetToken(email: string): Promise<string | null> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      if (!user) return null;

      // Generate a random token
      const token = Math.random().toString(36).substring(2, 15) + 
                    Math.random().toString(36).substring(2, 15);

      // Set expiry to 1 hour from now
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 1);

      // Update user with token
      await db.update(users)
        .set({
          resetToken: token,
          resetTokenExpiry: expiryDate
        })
        .where(eq(users.id, user.id));

      return token;
    } catch (error) {
      console.error("Error creating reset token:", error);
      return null;
    }
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    try {
      const now = new Date();
      const [user] = await db.select()
        .from(users)
        .where(
          and(
            eq(users.resetToken, token),
            sql`${users.resetTokenExpiry} > ${now}`
          )
        );

      return user;
    } catch (error) {
      console.error("Error getting user by reset token:", error);
      return undefined;
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    try {
      const user = await this.getUserByResetToken(token);
      if (!user) return false;

      // Update user with new password and clear token
      await db.update(users)
        .set({
          password: newPassword,
          resetToken: null,
          resetTokenExpiry: null
        })
        .where(eq(users.id, user.id));

      return true;
    } catch (error) {
      console.error("Error resetting password:", error);
      return false;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(user: InsertUser): Promise<User> {
    // Make sure isAdmin is set to false if not provided
    const userData = { 
      ...user,
      isAdmin: user.isAdmin || false
    };
    const [createdUser] = await db.insert(users).values(userData).returning();
    return createdUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      console.log(`Storage: Attempting to delete user with ID: ${id}`);

      // Start a transaction to handle related records
      return await db.transaction(async (tx) => {
        // Check for company profiles associated with this user
        const companyProfileResults = await tx
          .select({ id: companyProfiles.id })
          .from(companyProfiles)
          .where(eq(companyProfiles.userId, id));

        if (companyProfileResults.length > 0) {
          console.log(`Cannot delete user ${id}: Found ${companyProfileResults.length} associated company profiles`);
          throw new Error(`User is associated with company profiles. Please delete those first.`);
        }

        // Check for professional profiles associated with this user
        const professionalProfileResults = await tx
          .select({ id: professionalProfiles.id })
          .from(professionalProfiles)
          .where(eq(professionalProfiles.userId, id));

        if (professionalProfileResults.length > 0) {
          console.log(`Cannot delete user ${id}: Found ${professionalProfileResults.length} associated professional profiles`);
          throw new Error(`User is associated with professional profiles. Please delete those first.`);
        }

        // Check for job postings, resources, etc. associated with this user
        // Check for other dependencies as needed...

        // If no dependencies found, proceed with deletion
        const result = await tx
          .delete(users)
          .where(eq(users.id, id))
          .returning({ id: users.id });

        const success = result.length > 0;
        console.log(`User deletion ${success ? 'successful' : 'failed'} for ID: ${id}`);
        return success;
      });
    } catch (error) {
      console.error(`Error deleting user with ID ${id}:`, error);
      throw error; // Re-throw to handle in the route
    }
  }

  // Stripe methods
  async updateStripeCustomerId(userId: number, customerId: string): Promise<User | undefined> {
    return this.updateUser(userId, { stripeCustomerId: customerId });
  }

  async updateStripeSubscriptionId(userId: number, subscriptionId: string): Promise<User | undefined> {
    return this.updateUser(userId, { stripeSubscriptionId: subscriptionId });
  }

  async updateUserSubscription(userId: number, tier: string, status: string): Promise<User | undefined> {
    return this.updateUser(userId, { subscriptionTier: tier, subscriptionStatus: status });
  }

  async getUserByStripeCustomerId(customerId: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.stripeCustomerId, customerId));
    return user;
  }

  // Professional Profile operations
  async getProfessionalProfile(id: number): Promise<ProfessionalProfile | undefined> {
    const [profile] = await db
      .select()
      .from(professionalProfiles)
      .where(eq(professionalProfiles.id, id));

    // Parse JSON fields if they're strings
    if (profile) {
        if (typeof profile.galleryImages === 'string') {
            try {
                profile.galleryImages = JSON.parse(profile.galleryImages);
            } catch (e) {
                profile.galleryImages = [];
            }
        }
        if (typeof profile.workExperience === 'string') {
            try {
                profile.workExperience = JSON.parse(profile.workExperience);
            } catch (e) {
                profile.workExperience = [];
            }
        }
        if (typeof profile.testimonials === 'string') {
            try {
                profile.testimonials = JSON.parse(profile.testimonials);
            } catch (e) {
                profile.testimonials = [];
            }
        }
    }

    return profile;
  }

  async getProfessionalProfileByUserId(userId: number): Promise<ProfessionalProfile | undefined> {
    const [profile] = await db
      .select()
      .from(professionalProfiles)
      .where(eq(professionalProfiles.userId, userId));
    return profile;
  }

  async getAllProfessionalProfiles(): Promise<ProfessionalProfile[]> {
    if (!db) {
      console.warn("Database not available, using empty result for getAllProfessionalProfiles");
      return [];
    }
    return db.select().from(professionalProfiles);
  }

  async getFeaturedProfessionalProfiles(limit: number): Promise<ProfessionalProfile[]> {
    if (!db) {
      console.warn("Database not available, using empty result for getFeaturedProfessionalProfiles");
      return [];
    }
    return db
      .select()
      .from(professionalProfiles)
      .where(eq(professionalProfiles.featured, true))
      .limit(limit);
  }

  async createProfessionalProfile(profile: InsertProfessionalProfile): Promise<ProfessionalProfile> {
    const [createdProfile] = await db
      .insert(professionalProfiles)
      .values(profile)
      .returning();
    return createdProfile;
  }

  async updateProfessionalProfile(
    id: number,
    profile: Partial<InsertProfessionalProfile>
  ): Promise<ProfessionalProfile | undefined> {
    const [updatedProfile] = await db
      .update(professionalProfiles)
      .set(profile)
      .where(eq(professionalProfiles.id, id))
      .returning();
    return updatedProfile;
  }

  async deleteProfessionalProfile(id: number): Promise<boolean> {
    const result = await db
      .delete(professionalProfiles)
      .where(eq(professionalProfiles.id, id))
      .returning({ id: professionalProfiles.id });
    return result.length > 0;
  }

  // Expertise operations
  async getAllExpertise(): Promise<Expertise[]> {
    if (!db) {
      console.warn("Database not available, using empty result for getAllExpertise");
      return [];
    }
    return db.select().from(expertise);
  }

  async getExpertiseById(id: number): Promise<Expertise | undefined> {
    const [exp] = await db.select().from(expertise).where(eq(expertise.id, id));
    return exp;
  }

  async createExpertise(exp: InsertExpertise): Promise<Expertise> {
    const [createdExpertise] = await db.insert(expertise).values(exp).returning();
    return createdExpertise;
  }

  async getProfessionalExpertise(professionalId: number): Promise<Expertise[]> {
    const professionalExps = await db
      .select()
      .from(professionalExpertise)
      .where(eq(professionalExpertise.professionalId, professionalId));

    const expertiseIds = professionalExps.map((pe) => pe.expertiseId);
    if (expertiseIds.length === 0) return [];

    return db
      .select()
      .from(expertise)
      .where(
        or(...expertiseIds.map((id) => eq(expertise.id, id)))
      );
  }

  async addProfessionalExpertise(
    professionalExpertiseData: InsertProfessionalExpertise
  ): Promise<ProfessionalExpertise> {
    const [createdProfExpertise] = await db
      .insert(professionalExpertise)
      .values(professionalExpertiseData)
      .returning();
    return createdProfExpertise;
  }

  // Certification operations
  async getCertification(id: number): Promise<Certification | undefined> {
    const [certification] = await db
      .select()
      .from(certifications)
      .where(eq(certifications.id, id));
    return certification;
  }

  async getProfessionalCertifications(professionalId: number): Promise<Certification[]> {
    return db
      .select()
      .from(certifications)
      .where(eq(certifications.professionalId, professionalId));
  }

  async createCertification(certification: InsertCertification): Promise<Certification> {
    const [createdCertification] = await db
      .insert(certifications)
      .values(certification)
      .returning();
    return createdCertification;
  }

  async deleteCertification(id: number): Promise<boolean> {
    const result = await db
      .delete(certifications)
      .where(eq(certifications.id, id))
      .returning({ id: certifications.id });
    return result.length > 0;
  }

  // Company Profile operations
  async getCompanyProfile(id: number): Promise<CompanyProfile | undefined> {
    const [profile] = await db
      .select()
      .from(companyProfiles)
      .where(eq(companyProfiles.id, id));
    return profile;
  }

  async getCompanyProfileByUserId(userId: number): Promise<CompanyProfile | undefined> {
    const [profile] = await db
      .select()
      .from(companyProfiles)
      .where(eq(companyProfiles.userId, userId));
    return profile;
  }

  async getAllCompanyProfiles(): Promise<CompanyProfile[]> {
    if (!db) {
      console.warn("Database not available, using empty result for getAllCompanyProfiles");
      return [];
    }
    return db.select().from(companyProfiles);
  }

  async createCompanyProfile(profile: InsertCompanyProfile): Promise<CompanyProfile> {
    const [createdProfile] = await db
      .insert(companyProfiles)
      .values(profile)
      .returning();
    return createdProfile;
  }

  async updateCompanyProfile(
    id: number,
    profile: Partial<InsertCompanyProfile>
  ): Promise<CompanyProfile | undefined> {
    const [updatedProfile] = await db
      .update(companyProfiles)
      .set(profile)
      .where(eq(companyProfiles.id, id))
      .returning();
    return updatedProfile;
  }

  // Job Posting operations
  async getJobPosting(id: number): Promise<JobPosting | undefined> {
    const [jobPosting] = await db
      .select()
      .from(jobPostings)
      .where(eq(jobPostings.id, id));
    return jobPosting;
  }

  async getAllJobPostings(): Promise<JobPosting[]> {
    if (!db) {
      console.warn("Database not available, using empty result for getAllJobPostings");
      return [];
    }
    return db
      .select()
      .from(jobPostings)
      .where(eq(jobPostings.status, "open"))
      .orderBy(desc(jobPostings.createdAt));
  }

  async getLatestJobPostings(limit: number): Promise<JobPosting[]> {
    if (!db) {
      console.warn("Database not available, using empty result for getLatestJobPostings");
      return [];
    }
    return db
      .select()
      .from(jobPostings)
      .where(eq(jobPostings.status, "open"))
      .orderBy(desc(jobPostings.createdAt))
      .limit(limit);
  }

  async getCompanyJobPostings(companyId: number): Promise<JobPosting[]> {
    return db
      .select()
      .from(jobPostings)
      .where(eq(jobPostings.companyId, companyId))
      .orderBy(desc(jobPostings.createdAt));
  }

  async createJobPosting(job: InsertJobPosting): Promise<JobPosting> {
    const [createdJob] = await db.insert(jobPostings).values(job).returning();
    return createdJob;
  }

  async updateJobPosting(
    id: number,
    job: Partial<InsertJobPosting>
  ): Promise<JobPosting | undefined> {
    const [updatedJob] = await db
      .update(jobPostings)
      .set(job)
      .where(eq(jobPostings.id, id))
      .returning();
    return updatedJob;
  }

  async deleteJobPosting(id: number): Promise<boolean> {
    const result = await db
      .delete(jobPostings)
      .where(eq(jobPostings.id, id))
      .returning({ id: jobPostings.id });
    return result.length > 0;
  }

  // Job Application operations
  async getJobApplication(id: number): Promise<JobApplication | undefined> {
    const [jobApplication] = await db
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.id, id));
    return jobApplication;
  }

  async getJobApplicationsByJob(jobId: number): Promise<JobApplication[]> {
    return db
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.jobId, jobId))
      .orderBy(desc(jobApplications.createdAt));
  }

  async getJobApplicationsByProfessional(professionalId: number): Promise<JobApplication[]> {
    return db
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.professionalId, professionalId))
      .orderBy(desc(jobApplications.createdAt));
  }

  async createJobApplication(application: InsertJobApplication): Promise<JobApplication> {
    const [createdApplication] = await db
      .insert(jobApplications)
      .values(application)
      .returning();
    return createdApplication;
  }

  async updateJobApplicationStatus(
    id: number,
    status: string
  ): Promise<JobApplication | undefined> {
    const [updatedApplication] = await db
      .update(jobApplications)
      .set({ status })
      .where(eq(jobApplications.id, id))
      .returning();
    return updatedApplication;
  }

  // Resource operations
  async getResource(id: number): Promise<Resource | undefined> {
    const [resource] = await db
      .select()
      .from(resources)
      .where(eq(resources.id, id));
    return resource;
  }

  async getAllResources(): Promise<Resource[]> {
    if (!db) {
      console.warn("Database not available, using empty result for getAllResources");
      return [];
    }
    return db.select().from(resources).orderBy(desc(resources.createdAt));
  }

  async getFeaturedResources(limit: number): Promise<Resource[]> {
    if (!db) {
      console.warn("Database not available, using empty result for getFeaturedResources");
      return [];
    }
    return db
      .select()
      .from(resources)
      .where(eq(resources.featured, true))
      .orderBy(desc(resources.createdAt))
      .limit(limit);
  }

  async getResourcesByCategory(categoryId: number): Promise<Resource[]> {
    return db
      .select()
      .from(resources)
      .where(eq(resources.categoryId, categoryId))
      .orderBy(desc(resources.createdAt));
  }

  async getResourcesByAuthor(authorId: number): Promise<Resource[]> {
    return db
      .select()
      .from(resources)
      .where(eq(resources.authorId, authorId))
      .orderBy(desc(resources.createdAt));
  }

  async searchResources(query?: string, type?: string, categoryId?: number): Promise<Resource[]> {
    // Start with base query conditions
    const conditions: SQL<unknown>[] = [];

    // Add search conditions if query provided
    if (query) {
      const searchTerm = `%${query.toLowerCase()}%`;
      // Create a single SQL condition for text search
      conditions.push(
        sql`(LOWER(${resources.title}) LIKE ${searchTerm} OR LOWER(${resources.description}) LIKE ${searchTerm})`
      );
    }

    // Add type filter if provided
    if (type) {
      conditions.push(eq(resources.resourceType, type));
    }

    // Add category filter if provided
    if (categoryId) {
      conditions.push(eq(resources.categoryId, categoryId));
    }

    // Execute query with all conditions
    let query_result;
    if (conditions.length > 0) {
      query_result = await db
        .select()
        .from(resources)
        .where(and(...conditions))
        .orderBy(desc(resources.createdAt));
    } else {
      // No conditions, get all resources
      query_result = await db
        .select()
        .from(resources)
        .orderBy(desc(resources.createdAt));
    }

    return query_result;
  }

  async getResourceCategory(id: number): Promise<ResourceCategory | undefined> {
    const [category] = await db
      .select()
      .from(resourceCategories)
      .where(eq(resourceCategories.id, id));
    return category;
  }

  async getAllResourceCategories(): Promise<ResourceCategory[]> {
    if (!db) {
      console.warn("Database not available, using empty result for getAllResourceCategories");
      return [];
    }
    return db.select().from(resourceCategories);
  }

  async createResourceCategory(category: InsertResourceCategory): Promise<ResourceCategory> {
    const [newCategory] = await db
      .insert(resourceCategories)
      .values(category)
      .returning();
    return newCategory;
  }

  async setResourceFeatured(id: number, featured: boolean): Promise<Resource | undefined> {
    const [updatedResource] = await db
      .update(resources)
      .set({ featured })
      .where(eq(resources.id, id))
      .returning();
    return updatedResource;
  }

  async createResource(resource: InsertResource): Promise<Resource> {
    const [createdResource] = await db
      .insert(resources)
      .values(resource)
      .returning();
    return createdResource;
  }

  async updateResource(id: number, resource: Partial<Resource>): Promise<Resource | undefined> {
    const [updatedResource] = await db
      .update(resources)
      .set(resource)
      .where(eq(resources.id, id))
      .returning();
    return updatedResource;
  }

  async deleteResource(id: number): Promise<boolean> {
    const result = await db
      .delete(resources)
      .where(eq(resources.id, id))
      .returning({ id: resources.id });
    return result.length > 0;
  }

  // Forum operations
  async getForumPost(id: number): Promise<ForumPost | undefined> {
    const [post] = await db
      .select()
      .from(forumPosts)
      .where(eq(forumPosts.id, id));
    return post;
  }

  async getAllForumPosts(): Promise<ForumPost[]> {
    if (!db) {
      console.warn("Database not available, using empty result for getAllForumPosts");
      return [];
    }
    return db
      .select()
      .from(forumPosts)
      .orderBy(desc(forumPosts.createdAt));
  }

  async createForumPost(post: InsertForumPost): Promise<ForumPost> {
    const [createdPost] = await db.insert(forumPosts).values(post).returning();
    return createdPost;
  }

  async getPostComments(postId: number): Promise<ForumComment[]> {
    return db
      .select()
      .from(forumComments)
      .where(eq(forumComments.postId, postId))
      .orderBy(asc(forumComments.createdAt));
  }

  async createForumComment(comment: InsertForumComment): Promise<ForumComment> {
    const [createdComment] = await db
      .insert(forumComments)
      .values(comment)
      .returning();
    return createdComment;
  }

  // Message operations
  async getUserMessages(userId: number): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(
        or(
          eq(messages.senderId, userId),
          eq(messages.receiverId, userId)
        )
      )
      .orderBy(desc(messages.createdAt));
  }

  async getConversation(user1Id: number, user2Id: number): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(
        or(
          and(
            eq(messages.senderId, user1Id),
            eq(messages.receiverId, user2Id)
          ),
          and(
            eq(messages.senderId, user2Id),
            eq(messages.receiverId, user1Id)
          )
        )
      )
      .orderBy(asc(messages.createdAt));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [createdMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    return createdMessage;
  }

  async markMessageAsRead(id: number): Promise<boolean> {
    const result = await db
      .update(messages)
      .set({ read: true })
      .where(eq(messages.id, id))
      .returning({ id: messages.id });
    return result.length > 0;
  }

  // Consultation operations
  async getConsultation(id: number): Promise<Consultation | undefined> {
    const [consultation] = await db
      .select()
      .from(consultations)
      .where(eq(consultations.id, id));
    return consultation;
  }

  async getProfessionalConsultations(professionalId: number): Promise<Consultation[]> {
    return db
      .select()
      .from(consultations)
      .where(eq(consultations.professionalId, professionalId))
      .orderBy(desc(consultations.createdAt));
  }

  async getCompanyConsultations(companyId: number): Promise<Consultation[]> {
    return db
      .select()
      .from(consultations)
      .where(eq(consultations.companyId, companyId))
      .orderBy(desc(consultations.createdAt));
  }

  async createConsultation(consultation: InsertConsultation): Promise<Consultation> {
    const [createdConsultation] = await db
      .insert(consultations)
      .values(consultation)
      .returning();
    return createdConsultation;
  }

  async updateConsultationStatus(
    id: number,
    status: string
  ): Promise<Consultation | undefined> {
    const [updatedConsultation] = await db
      .update(consultations)
      .set({ status })
      .where(eq(consultations.id, id))
      .returning();
    return updatedConsultation;
  }

  // Skill Recommendation operations
  async getSkillRecommendation(id: number): Promise<SkillRecommendation | undefined> {
    const [recommendation] = await db
      .select()
      .from(skillRecommendations)
      .where(eq(skillRecommendations.id, id));
    return recommendation;
  }

  async getSkillRecommendationsByProfessional(professionalId: number): Promise<SkillRecommendation | undefined> {
    const [recommendation] = await db
      .select()
      .from(skillRecommendations)
      .where(eq(skillRecommendations.professionalId, professionalId));
    return recommendation;
  }

  async createSkillRecommendation(recommendation: InsertSkillRecommendation): Promise<SkillRecommendation> {
    const [createdRecommendation] = await db
      .insert(skillRecommendations)
      .values(recommendation)
      .returning();
    return createdRecommendation;
  }

  async updateSkillRecommendation(id: number, recommendation: Partial<InsertSkillRecommendation>): Promise<SkillRecommendation | undefined> {
    const [updatedRecommendation] = await db
      .update(skillRecommendations)
      .set({ ...recommendation, updatedAt: new Date() })
      .where(eq(skillRecommendations.id, id))
      .returning();
    return updatedRecommendation;
  }

  // Professional Expertise operations
  async deleteProfessionalExpertise(id: number): Promise<boolean> {
    try {
      console.log(`Storage: Attempting to delete professional expertise with ID: ${id}`);

      const result = await db
        .delete(professionalExpertise)
        .where(eq(professionalExpertise.id, id))
        .returning({ id: professionalExpertise.id });

      const success = result.length > 0;
      console.log(`Professional expertise deletion ${success ? 'successful' : 'failed'} for ID: ${id}`);
      return success;
    } catch (error) {
      console.error(`Error deleting professional expertise with ID ${id}:`, error);
      throw error;
    }
  }

  // Job Application operations
  async deleteJobApplication(id: number): Promise<boolean> {
    try {
      console.log(`Storage: Attempting to delete job application with ID: ${id}`);

      const result = await db
        .delete(jobApplications)
        .where(eq(jobApplications.id, id))
        .returning({ id: jobApplications.id });

      const success = result.length > 0;
      console.log(`Job application deletion ${success ? 'successful' : 'failed'} for ID: ${id}`);
      return success;
    } catch (error) {
      console.error(`Error deleting job application with ID ${id}:`, error);
      throw error;
    }
  }

  // Company Profile operations
  async deleteCompanyProfile(id: number): Promise<boolean> {
    try {
      console.log(`Storage: Attempting to delete company profile with ID: ${id}`);

      const result = await db
        .delete(companyProfiles)
        .where(eq(companyProfiles.id, id))
        .returning({ id: companyProfiles.id });

      const success = result.length > 0;
      console.log(`Company profile deletion ${success ? 'successful' : 'failed'} for ID: ${id}`);
      return success;
    } catch (error) {
      console.error(`Error deleting company profile with ID ${id}:`, error);
      throw error;
    }
  }

  // Page Content operations
  async getPageContent(id: number): Promise<PageContent | undefined> {
    const [content] = await db
      .select()
      .from(pageContents)
      .where(eq(pageContents.id, id));
    return content;
  }

  async getPageContentBySlug(slug: string): Promise<PageContent | undefined> {
    const [content] = await db
      .select()
      .from(pageContents)
      .where(eq(pageContents.slug, slug));
    return content;
  }

  async getAllPageContents(): Promise<PageContent[]> {
    if (!db) {
      console.warn("Database not available, using empty result for getAllPageContents");
      return [];
    }
    return db.select().from(pageContents).orderBy(desc(pageContents.updatedAt));
  }

  async createPageContent(content: InsertPageContent): Promise<PageContent> {
    const [created] = await db
      .insert(pageContents)
      .values({
        ...content,
        lastEditedBy: content.lastEditedBy || null
      })
      .returning();
    return created;
  }

  async updatePageContent(id: number, content: Partial<InsertPageContent>): Promise<PageContent | undefined> {
    const [updated] = await db
      .update(pageContents)
      .set({
        ...content,
        updatedAt: new Date(),
        lastEditedBy: content.lastEditedBy !== undefined ? content.lastEditedBy : null
      })
      .where(eq(pageContents.id, id))
      .returning();
    return updated;
  }

  async deletePageContent(id: number): Promise<boolean> {
    try {
      console.log(`Storage: Attempting to delete page content with ID: ${id}`);

      // First verify the record exists to avoid unnecessary delete operations
      const existing = await db
        .select({ id: pageContents.id })
        .from(pageContents)
        .where(eq(pageContents.id, id));

      if (existing.length === 0) {
        console.log(`Storage: Page content with ID ${id} not found, nothing to delete`);
        return false;
      }

      // If it exists, proceed with deletion
      const result = await db
        .delete(pageContents)
        .where(eq(pageContents.id, id))
        .returning({ id: pageContents.id });

      const success = result.length > 0;
      console.log(`Storage: Delete operation for page content ID ${id} result:`, success ? 'Success' : 'Failed');

      return success;
    } catch (error) {
      console.error(`Storage: Error deleting page content with ID ${id}:`, error);
      throw error; // Re-throw to allow proper error handling
    }
  }

  // AI Matching operations
  async getMatchingJobsForProfessional(professionalId: number, limit: number = 5): Promise<Array<{job: JobPosting, score: number}>> {
    try {
      // Get the professional profile
      const [professional] = await db.select().from(professionalProfiles)
        .where(eq(professionalProfiles.id, professionalId));

      if (!professional) {
        return [];
      }

      // Get all open job postings
      const jobs = await db.select().from(jobPostings)
        .where(eq(jobPostings.status, "open"));

      // Import AI services locally to avoid circular dependencies
      const { calculateProfileJobMatchScore } = await import('./ai-services');

      // Generate match scores using AI services
      const matchPromises = jobs.map(async (job) => {
        try {
          // Calculate match score using AI embeddings with fallback
          const score = await calculateProfileJobMatchScore(professional, job);
          return { job, score };
        } catch (error) {
          console.error(`Error matching job ${job.id} with professional ${professionalId}:`, error);
          // Return a very low score if there was an error
          return { job, score: 0.01 };
        }
      });

      // Resolve all match promises
      const matches = await Promise.all(matchPromises);

      // Sort by score (descending) and apply limit
      return matches
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error("Error getting matching jobs:", error);
      return [];
    }
  }

  async getMatchingProfessionalsForJob(jobId: number, limit: number = 5): Promise<Array<{professional: ProfessionalProfile, score: number}>> {
    try {
      // Get the job posting
      const [job] = await db.select().from(jobPostings)
        .where(eq(jobPostings.id, jobId));

      if (!job) {
        return [];
      }

      // Get all professional profiles
      const profiles = await db.select().from(professionalProfiles);
      console.log(`Found ${profiles.length} professionals to evaluate for job: ${job.title}`);

      if (profiles.length === 0) {
        return [];
      }

      // Calculate match scores for each professional
      const matches: Array<{professional: ProfessionalProfile, score: number}> = [];

      for (const profile of profiles) {
        try {
          const score = await calculateProfileJobMatchScore(profile, job);
          console.log(`Match score for professional "${profile.title || profile.firstName}": ${(score * 100).toFixed(1)}%`);

          matches.push({
            professional: profile,
            score
          });
        } catch (error) {
          console.error(`Error calculating match score for professional ${profile.id}:`, error);
          // Add with minimum score if calculation fails
          matches.push({
            professional: profile,
            score: 0.2
          });
        }
      }

      // Sort by score (highest first) and return top matches
      const topMatches = matches
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      console.log(`Returning top ${topMatches.length} matches for job ${jobId}`);
      return topMatches;
    } catch (error) {
      console.error("Error getting matching professionals:", error);
      return [];
    }
  }

  async saveJobMatch(jobId: number, professionalId: number, score: number): Promise<boolean> {
    try {
      // In a real implementation, we would add a job_matches table
      // For now, this is a placeholder function since we're calculating scores on the fly
      return true;
    } catch (error) {
      console.error("Error saving job match:", error);
      return false;
    }
  }

  // Authentication token operations for "Remember Me"
  async createAuthToken(userId: number, type: string, expiresAt: Date, userAgent?: string, ipAddress?: string): Promise<AuthToken> {
    if (!db) {
      throw new Error('Database not initialized');
    }

    // Generate a secure random token
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');

    const [authToken] = await db.insert(authTokens).values({
      userId,
      token,
      type,
      expiresAt,
      userAgent,
      ipAddress,
      isRevoked: false
    }).returning();

    return authToken;
  }

  async getAuthToken(token: string): Promise<AuthToken | undefined> {
    if (!db) {
      throw new Error('Database not initialized');
    }

    const [authToken] = await db
      .select()
      .from(authTokens)
      .where(eq(authTokens.token, token));

    return authToken;
  }

  async validateAuthToken(token: string): Promise<User | undefined> {
    if (!db) {
      throw new Error('Database not initialized');
    }

    try {
      // Get the auth token with user information
      const result = await db
        .select({
          authToken: authTokens,
          user: users
        })
        .from(authTokens)
        .innerJoin(users, eq(authTokens.userId, users.id))
        .where(
          and(
            eq(authTokens.token, token),
            eq(authTokens.isRevoked, false),
            sql`${authTokens.expiresAt} > NOW()`
          )
        );

      if (result.length === 0) {
        return undefined;
      }

      const { authToken, user } = result[0];

      // Update last used timestamp
      await db
        .update(authTokens)
        .set({ lastUsedAt: new Date() })
        .where(eq(authTokens.id, authToken.id));

      return user;
    } catch (error) {
      console.error("Error validating auth token:", error);
      return undefined;
    }
  }

  async revokeAuthToken(token: string): Promise<boolean> {
    if (!db) {
      throw new Error('Database not initialized');
    }

    try {
      await db
        .update(authTokens)
        .set({ isRevoked: true })
        .where(eq(authTokens.token, token));

      return true;
    } catch (error) {
      console.error("Error revoking auth token:", error);
      return false;
    }
  }

  async revokeAllUserTokens(userId: number): Promise<boolean> {
    if (!db) {
      throw new Error('Database not initialized');
    }

    try {
      await db
        .update(authTokens)
        .set({ isRevoked: true })
        .where(eq(authTokens.userId, userId));

      return true;
    } catch (error) {
      console.error("Error revoking all user tokens:", error);
      return false;
    }
  }

  async cleanupExpiredTokens(): Promise<number> {
    if (!db) {
      throw new Error('Database not initialized');
    }

    try {
      await db
        .delete(authTokens)
        .where(sql`${authTokens.expiresAt} <= NOW() OR ${authTokens.isRevoked} = true`);

      return 0;
    } catch (error) {
      console.error("Error cleaning up expired tokens:", error);
      return 0;
    }
  }

  async getUserSubscription(userId: number): Promise<any> {
    if (!db) {
      throw new Error('Database not initialized');
    }

    try {
      // Return mock active subscription for testing
      return {
        id: 1,
        userId: userId,
        planName: 'Professional',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error("Error getting user subscription:", error);
      return null;
    }
  }

  async updateUserSubscription(userId: number, subscriptionData: any): Promise<any> {
    if (!db) {
      throw new Error('Database not initialized');
    }

    try {
      return {
        ...subscriptionData,
        userId: userId,
        updatedAt: new Date()
      };
    } catch (error) {
      console.error("Error updating user subscription:", error);
      return null;
    }
  }

  // Subscription plans operations
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    if (!db) {
      throw new Error('Database not initialized');
    }

    try {
      const plans = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true));
      return plans;
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      return [];
    }
  }

  // Simple auth token methods (simplified implementation)
  async createSimpleAuthToken(userId: number): Promise<string> {
    const token = `auth_${userId}_${Date.now()}_${Math.random().toString(36)}`;
    this.authTokens.set(token, {
      id: this.authTokenId++,
      userId,
      token,
      type: 'session',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      createdAt: new Date(),
      lastUsedAt: new Date(),
      userAgent: null,
      ipAddress: null,
      isRevoked: false
    });
    return token;
  }

  async validateSimpleAuthToken(token: string): Promise<number | null> {
    const authToken = this.authTokens.get(token);
    if (!authToken || authToken.isRevoked || authToken.expiresAt < new Date()) {
      return null;
    }
    authToken.lastUsedAt = new Date();
    return authToken.userId;
  }
}

// Add subscription methods to MemStorage before the closing brace
class MemStorageWithSubscriptions extends MemStorage {
  async getUserSubscription(userId: number): Promise<any> {
    return {
      id: 1,
      userId: userId,
      planName: 'Professional',
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async updateUserSubscription(userId: number, subscriptionData: any): Promise<any> {
    return {
      ...subscriptionData,
      userId: userId,
      updatedAt: new Date()
    };
  }
}

// Dynamically use MemStorage or DatabaseStorage based on database connection status
export const storage = useRealDatabase ? new DatabaseStorage() : new MemStorageWithSubscriptions();