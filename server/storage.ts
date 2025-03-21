import { db } from "./db";
import { and, asc, desc, eq, or, isNull, not, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import {
  users, User, InsertUser,
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
  consultations, Consultation, InsertConsultation
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  
  // Stripe operations
  updateStripeCustomerId(userId: number, customerId: string): Promise<User | undefined>;
  updateStripeSubscriptionId(userId: number, subscriptionId: string): Promise<User | undefined>;
  updateUserSubscription(userId: number, tier: string, status: string): Promise<User | undefined>;
  getUserByStripeCustomerId(customerId: string): Promise<User | undefined>;
  
  // Professional Profile operations
  getProfessionalProfile(id: number): Promise<ProfessionalProfile | undefined>;
  getProfessionalProfileByUserId(userId: number): Promise<ProfessionalProfile | undefined>;
  getAllProfessionalProfiles(): Promise<ProfessionalProfile[]>;
  getFeaturedProfessionalProfiles(limit: number): Promise<ProfessionalProfile[]>;
  createProfessionalProfile(profile: InsertProfessionalProfile): Promise<ProfessionalProfile>;
  updateProfessionalProfile(id: number, profile: Partial<InsertProfessionalProfile>): Promise<ProfessionalProfile | undefined>;
  
  // Expertise operations
  getAllExpertise(): Promise<Expertise[]>;
  getExpertiseById(id: number): Promise<Expertise | undefined>;
  createExpertise(expertise: InsertExpertise): Promise<Expertise>;
  getProfessionalExpertise(professionalId: number): Promise<Expertise[]>;
  addProfessionalExpertise(professionalExpertise: InsertProfessionalExpertise): Promise<ProfessionalExpertise>;
  
  // Certification operations
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
  searchResources(query?: string, type?: string, categoryId?: number): Promise<Resource[]>;
  getFeaturedResources(limit: number): Promise<Resource[]>;
  createResource(resource: InsertResource): Promise<Resource>;
  updateResource(id: number, resource: Partial<Resource>): Promise<Resource | undefined>;
  setResourceFeatured(id: number, featured: boolean): Promise<Resource | undefined>;
  
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
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

  constructor() {
    this.users = new Map();
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
    
    // Initialize with some expertise areas
    this.initExpertise();
    
    // Initialize with some resource categories
    this.initResourceCategories();
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
  
  // Additional Resource operations
  async getResourcesByCategory(categoryId: number): Promise<Resource[]> {
    return Array.from(this.resources.values())
      .filter(resource => resource.categoryId === categoryId)
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
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { 
      ...insertUser, 
      id, 
      isAdmin: insertUser.isAdmin || false,
      createdAt: new Date(),
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionTier: null,
      subscriptionStatus: null
    };
    this.users.set(id, user);
    return user;
  }
  
  // Professional Profile operations
  async getProfessionalProfile(id: number): Promise<ProfessionalProfile | undefined> {
    return this.professionalProfiles.get(id);
  }
  
  async getProfessionalProfileByUserId(userId: number): Promise<ProfessionalProfile | undefined> {
    return Array.from(this.professionalProfiles.values()).find(
      (profile) => profile.userId === userId
    );
  }
  
  async getAllProfessionalProfiles(): Promise<ProfessionalProfile[]> {
    return Array.from(this.professionalProfiles.values());
  }
  
  async getFeaturedProfessionalProfiles(limit: number): Promise<ProfessionalProfile[]> {
    return Array.from(this.professionalProfiles.values())
      .filter(profile => profile.featured)
      .slice(0, limit);
  }
  
  async createProfessionalProfile(profile: InsertProfessionalProfile): Promise<ProfessionalProfile> {
    const id = this.profProfileId++;
    const newProfile: ProfessionalProfile = { 
      ...profile, 
      id,
      videoIntroUrl: profile.videoIntroUrl || null,
      ratePerHour: profile.ratePerHour || null,
      profileImageUrl: profile.profileImageUrl || null,
      featured: profile.featured || false,
      rating: profile.rating || 0,
      reviewCount: profile.reviewCount || 0
    };
    this.professionalProfiles.set(id, newProfile);
    return newProfile;
  }
  
  async updateProfessionalProfile(id: number, profile: Partial<InsertProfessionalProfile>): Promise<ProfessionalProfile | undefined> {
    const existing = this.professionalProfiles.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...profile };
    this.professionalProfiles.set(id, updated);
    return updated;
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
  
  // Certification operations
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
      ...profile, 
      id,
      website: profile.website || null,
      logoUrl: profile.logoUrl || null
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
  
  // Job Posting operations
  async getJobPosting(id: number): Promise<JobPosting | undefined> {
    return this.jobPostings.get(id);
  }
  
  async getAllJobPostings(): Promise<JobPosting[]> {
    return Array.from(this.jobPostings.values());
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
      ...job, 
      id, 
      createdAt: new Date(),
      status: job.status || "open",
      featured: job.featured || false,
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
  
  // Resource operations
  async getResource(id: number): Promise<Resource | undefined> {
    return this.resources.get(id);
  }
  
  async getAllResources(): Promise<Resource[]> {
    return Array.from(this.resources.values());
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
      categoryId: resource.categoryId || null
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
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
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

  // Stripe operations
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
    return db.select().from(professionalProfiles);
  }

  async getFeaturedProfessionalProfiles(limit: number): Promise<ProfessionalProfile[]> {
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

  // Expertise operations
  async getAllExpertise(): Promise<Expertise[]> {
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
    return db
      .select()
      .from(jobPostings)
      .where(eq(jobPostings.status, "open"))
      .orderBy(desc(jobPostings.createdAt));
  }

  async getLatestJobPostings(limit: number): Promise<JobPosting[]> {
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
    return db.select().from(resources).orderBy(desc(resources.createdAt));
  }

  async getFeaturedResources(limit: number): Promise<Resource[]> {
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

  // Forum operations
  async getForumPost(id: number): Promise<ForumPost | undefined> {
    const [post] = await db
      .select()
      .from(forumPosts)
      .where(eq(forumPosts.id, id));
    return post;
  }

  async getAllForumPosts(): Promise<ForumPost[]> {
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
}

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
