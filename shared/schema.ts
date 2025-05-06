import { pgTable, text, serial, integer, timestamp, boolean, unique, jsonb, date, real, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table (for both L&D pros and companies)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  userType: text("user_type").notNull(), // "professional", "company", or "admin"
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionTier: text("subscription_tier"), // "free", "basic", "premium"
  subscriptionStatus: text("subscription_status"), // "active", "trialing", "past_due", "canceled"
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  emailVerified: boolean("email_verified").default(false),
  emailVerificationToken: text("email_verification_token"),
  emailVerificationExpiry: timestamp("email_verification_expiry"),
  profilePhotoUrl: text("profile_photo_url"),
  googleId: text("google_id"),
  linkedinId: text("linkedin_id"),
  // New fields for admin user management
  blocked: boolean("blocked").default(false),
  blockReason: text("block_reason"),
  lastActiveAt: timestamp("last_active_at"),
  deleted: boolean("deleted").default(false),
  deletedAt: timestamp("deleted_at"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Professional Profiles
export const professionalProfiles = pgTable("professional_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  firstName: text("first_name"), // Added first name field
  lastName: text("last_name"), // Added last name field
  title: text("title"),
  bio: text("bio"),
  location: text("location"),
  videoIntroUrl: text("video_intro_url"),
  ratePerHour: integer("rate_per_hour"),
  profileImageUrl: text("profile_image_url"),
  profileImagePath: text("profile_image_path"), // For uploaded files
  galleryImages: jsonb("gallery_images"), // Array of image paths for portfolio/gallery
  featured: boolean("featured").default(false),
  rating: integer("rating").default(0),
  reviewCount: integer("review_count").default(0),
  yearsExperience: integer("years_experience").default(0),
  interests: text("interests"),
  industryFocus: text("industry_focus"),
  services: text("services"), // Services offered 
  availability: text("availability"), // Contact availability information
  email: text("contact_email"), // Professional contact email
  phone: text("contact_phone"), // Professional contact phone
  workExperience: jsonb("work_experience"), // Work experience as JSON array
  testimonials: jsonb("testimonials"), // Client testimonials as JSON array
  verified: boolean("verified").default(false), // Whether profile has been verified by admin
});

export const insertProfessionalProfileSchema = createInsertSchema(professionalProfiles).omit({
  id: true,
});

// Professional Expertise
export const expertise = pgTable("expertise", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const insertExpertiseSchema = createInsertSchema(expertise).omit({
  id: true,
});

// Professional-Expertise Relationship
export const professionalExpertise = pgTable("professional_expertise", {
  id: serial("id").primaryKey(),
  professionalId: integer("professional_id").notNull().references(() => professionalProfiles.id),
  expertiseId: integer("expertise_id").notNull().references(() => expertise.id),
}, (table) => {
  return {
    unq: unique().on(table.professionalId, table.expertiseId),
  }
});

export const insertProfessionalExpertiseSchema = createInsertSchema(professionalExpertise).omit({
  id: true,
});

// Certifications
export const certifications = pgTable("certifications", {
  id: serial("id").primaryKey(),
  professionalId: integer("professional_id").notNull().references(() => professionalProfiles.id),
  name: text("name").notNull(),
  issuer: text("issuer").notNull(),
  year: integer("year").notNull(),
});

export const insertCertificationSchema = createInsertSchema(certifications).omit({
  id: true,
});

// Company Profiles
export const companyProfiles = pgTable("company_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  companyName: text("company_name").notNull(),
  industry: text("industry").notNull(),
  description: text("description").notNull(),
  website: text("website"),
  logoUrl: text("logo_url"),
  logoImagePath: text("logo_image_path"), // For uploaded files
  size: text("size").notNull(), // "small", "medium", "large", "enterprise"
  location: text("location").notNull(),
  featured: boolean("featured").default(false),
  verified: boolean("verified").default(false),
});

export const insertCompanyProfileSchema = createInsertSchema(companyProfiles).omit({
  id: true,
});

// Job Postings
export const jobPostings = pgTable("job_postings", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companyProfiles.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  jobType: text("job_type").notNull(), // "full-time", "part-time", "contract", "freelance"
  minCompensation: integer("min_compensation"),
  maxCompensation: integer("max_compensation"),
  compensationUnit: text("compensation_unit"), // "hourly", "project", "yearly"
  duration: text("duration"), // For contracts
  requirements: text("requirements").notNull(),
  remote: boolean("remote").default(false),
  featured: boolean("featured").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  status: text("status").notNull().default("open"), // "open", "closed", "filled"
});

export const insertJobPostingSchema = createInsertSchema(jobPostings).omit({
  id: true,
  createdAt: true,
});

// Job Applications
export const jobApplications = pgTable("job_applications", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobPostings.id),
  professionalId: integer("professional_id").notNull().references(() => professionalProfiles.id),
  coverLetter: text("cover_letter").notNull(),
  status: text("status").notNull().default("pending"), // "pending", "reviewed", "accepted", "rejected"
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    unq: unique().on(table.jobId, table.professionalId),
  }
});

export const insertJobApplicationSchema = createInsertSchema(jobApplications).omit({
  id: true,
  createdAt: true,
});

// Resource Categories
export const resourceCategories = pgTable("resource_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const insertResourceCategorySchema = createInsertSchema(resourceCategories).omit({
  id: true,
});

// Resources
export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  content: text("content").notNull(),  // This field will store the URL for now
  contentUrl: text("content_url"),     // URL for external content
  filePath: text("file_path"),         // Path to the uploaded file
  resourceType: text("resource_type").notNull(), // "article", "template", "video", "webinar"
  categoryId: integer("category_id").references(() => resourceCategories.id),
  imageUrl: text("image_url"),
  featured: boolean("featured").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertResourceSchema = createInsertSchema(resources).omit({
  id: true,
  createdAt: true,
});

// Forum Posts
export const forumPosts = pgTable("forum_posts", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertForumPostSchema = createInsertSchema(forumPosts).omit({
  id: true,
  createdAt: true,
});

// Forum Comments
export const forumComments = pgTable("forum_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => forumPosts.id),
  authorId: integer("author_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertForumCommentSchema = createInsertSchema(forumComments).omit({
  id: true,
  createdAt: true,
});

// Messages
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  read: true,
});

// Consultations
export const consultations = pgTable("consultations", {
  id: serial("id").primaryKey(),
  professionalId: integer("professional_id").notNull().references(() => professionalProfiles.id),
  companyId: integer("company_id").notNull().references(() => companyProfiles.id),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: text("status").notNull().default("scheduled"), // "scheduled", "completed", "cancelled"
  notes: text("notes"),
  rate: integer("rate").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertConsultationSchema = createInsertSchema(consultations).omit({
  id: true,
  createdAt: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type ProfessionalProfile = typeof professionalProfiles.$inferSelect;
export type InsertProfessionalProfile = z.infer<typeof insertProfessionalProfileSchema>;

export type Expertise = typeof expertise.$inferSelect;
export type InsertExpertise = z.infer<typeof insertExpertiseSchema>;

export type ProfessionalExpertise = typeof professionalExpertise.$inferSelect;
export type InsertProfessionalExpertise = z.infer<typeof insertProfessionalExpertiseSchema>;

export type Certification = typeof certifications.$inferSelect;
export type InsertCertification = z.infer<typeof insertCertificationSchema>;

export type CompanyProfile = typeof companyProfiles.$inferSelect;
export type InsertCompanyProfile = z.infer<typeof insertCompanyProfileSchema>;

export type JobPosting = typeof jobPostings.$inferSelect;
export type InsertJobPosting = z.infer<typeof insertJobPostingSchema>;

export type JobApplication = typeof jobApplications.$inferSelect;
export type InsertJobApplication = z.infer<typeof insertJobApplicationSchema>;

export type ResourceCategory = typeof resourceCategories.$inferSelect;
export type InsertResourceCategory = z.infer<typeof insertResourceCategorySchema>;

export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;

export type ForumPost = typeof forumPosts.$inferSelect;
export type InsertForumPost = z.infer<typeof insertForumPostSchema>;

export type ForumComment = typeof forumComments.$inferSelect;
export type InsertForumComment = z.infer<typeof insertForumCommentSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Consultation = typeof consultations.$inferSelect;
export type InsertConsultation = z.infer<typeof insertConsultationSchema>;

// Skill Recommendations
export const skillRecommendations = pgTable("skill_recommendations", {
  id: serial("id").primaryKey(),
  professionalId: integer("professional_id").notNull().references(() => professionalProfiles.id),
  recommendations: jsonb("recommendations").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSkillRecommendationSchema = createInsertSchema(skillRecommendations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type SkillRecommendation = typeof skillRecommendations.$inferSelect;
export type InsertSkillRecommendation = z.infer<typeof insertSkillRecommendationSchema>;

// Page Content Management
export const pageContents = pgTable("page_contents", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(), // Identifies the page or content section
  title: text("title").notNull(),
  content: text("content").notNull(),
  lastEditedBy: integer("last_edited_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPageContentSchema = createInsertSchema(pageContents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type PageContent = typeof pageContents.$inferSelect;
export type InsertPageContent = z.infer<typeof insertPageContentSchema>;

// Reviews
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  professionalId: integer("professional_id").notNull().references(() => professionalProfiles.id),
  companyId: integer("company_id").notNull().references(() => companyProfiles.id),
  consultationId: integer("consultation_id").references(() => consultations.id),
  rating: integer("rating").notNull(), // 1-5 star rating
  comment: text("comment"),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

// Notifications
export const notificationTypes = pgTable("notification_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const insertNotificationTypeSchema = createInsertSchema(notificationTypes).omit({
  id: true,
});

export type NotificationType = typeof notificationTypes.$inferSelect;
export type InsertNotificationType = z.infer<typeof insertNotificationTypeSchema>;

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  typeId: integer("type_id").notNull().references(() => notificationTypes.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  link: text("link"),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  read: true,
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Import the AdminRole enum from our admin types
import { AdminRole } from "../server/admin/types/admin.types";

// Admin Users
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull().$type<AdminRole>(), // Using the AdminRole enum
  customPermissions: jsonb("custom_permissions"), // Array of permission strings
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
  twoFactorSecret: text("two_factor_secret"),
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
});

// Admin Refresh Tokens
export const adminRefreshTokens = pgTable("admin_refresh_tokens", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").notNull().references(() => adminUsers.id),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  revokedAt: timestamp("revoked_at"),
});

export const insertAdminRefreshTokenSchema = createInsertSchema(adminRefreshTokens).omit({
  id: true,
  createdAt: true,
});

// Admin Action Logs
export const adminActionLogs = pgTable("admin_action_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").notNull().references(() => adminUsers.id),
  adminUsername: text("admin_username").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: integer("entity_id"),
  details: text("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertAdminActionLogSchema = createInsertSchema(adminActionLogs).omit({
  id: true,
});

// Admin Activity Logs
export const adminActivityLogs = pgTable("admin_activity_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").notNull().references(() => adminUsers.id),
  method: text("method").notNull(),
  path: text("path").notNull(),
  statusCode: integer("status_code"),
  executionTime: integer("execution_time"), // in milliseconds
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertAdminActivityLogSchema = createInsertSchema(adminActivityLogs).omit({
  id: true,
});

// Admin Login Attempts
export const adminLoginAttempts = pgTable("admin_login_attempts", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").notNull().references(() => adminUsers.id),
  success: boolean("success").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  details: text("details"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertAdminLoginAttemptSchema = createInsertSchema(adminLoginAttempts).omit({
  id: true,
});

// Export admin types
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;

export type AdminRefreshToken = typeof adminRefreshTokens.$inferSelect;
export type InsertAdminRefreshToken = z.infer<typeof insertAdminRefreshTokenSchema>;

export type AdminActionLog = typeof adminActionLogs.$inferSelect;
export type InsertAdminActionLog = z.infer<typeof insertAdminActionLogSchema>;

export type AdminActivityLog = typeof adminActivityLogs.$inferSelect;
export type InsertAdminActivityLog = z.infer<typeof insertAdminActivityLogSchema>;

export type AdminLoginAttempt = typeof adminLoginAttempts.$inferSelect;
export type InsertAdminLoginAttempt = z.infer<typeof insertAdminLoginAttemptSchema>;

// User Notification Preferences
export const notificationPreferences = pgTable("notification_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  typeId: integer("type_id").notNull().references(() => notificationTypes.id),
  email: boolean("email").default(true).notNull(),
  inApp: boolean("in_app").default(true).notNull(),
}, (table) => {
  return {
    unq: unique().on(table.userId, table.typeId),
  }
});

export const insertNotificationPreferenceSchema = createInsertSchema(notificationPreferences).omit({
  id: true,
});

export type NotificationPreference = typeof notificationPreferences.$inferSelect;

// ============================================================================
// NEW SCHEMA TABLES FOR ENHANCED FEATURES
// ============================================================================

// Portfolio Projects for Professionals
export const portfolioProjects = pgTable("portfolio_projects", {
  id: serial("id").primaryKey(),
  professionalId: integer("professional_id").notNull().references(() => professionalProfiles.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  clientName: text("client_name"),
  industry: text("industry").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  outcomes: text("outcomes").notNull(),
  challenges: text("challenges"),
  solutions: text("solutions"),
  imageUrls: jsonb("image_urls"), // Array of image URLs for the project
  videoUrls: jsonb("video_urls"), // Array of video URLs (YouTube, Vimeo, etc)
  videoEmbedCodes: jsonb("video_embed_codes"), // Array of embed codes for videos
  mediaType: text("media_type").default("image"), // "image", "video", "mixed"
  featured: boolean("featured").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPortfolioProjectSchema = createInsertSchema(portfolioProjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type PortfolioProject = typeof portfolioProjects.$inferSelect;
export type InsertPortfolioProject = z.infer<typeof insertPortfolioProjectSchema>;

// Professional Availability Calendar
export const availabilitySlots = pgTable("availability_slots", {
  id: serial("id").primaryKey(),
  professionalId: integer("professional_id").notNull().references(() => professionalProfiles.id),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: text("status").notNull().default("available"), // "available", "booked", "unavailable"
  recurrence: text("recurrence"), // Optional recurrence pattern (weekly, daily, etc.)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAvailabilitySlotSchema = createInsertSchema(availabilitySlots).omit({
  id: true,
  createdAt: true,
});

export type AvailabilitySlot = typeof availabilitySlots.$inferSelect;
export type InsertAvailabilitySlot = z.infer<typeof insertAvailabilitySlotSchema>;

// Resource Marketplace (Sellable Resources)
export const sellableResources = pgTable("sellable_resources", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  previewUrl: text("preview_url"), // URL for preview content
  previewImageUrl: text("preview_image_url"),
  resourceType: text("resource_type").notNull(), // "course", "template", "ebook", "workshop"
  categoryId: integer("category_id").references(() => resourceCategories.id),
  tags: jsonb("tags"), // Array of tags
  featured: boolean("featured").default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  fileUrl: text("file_url"), // URL to actual digital product
  filePath: text("file_path"), // Path to the uploaded file
  downloadCount: integer("download_count").default(0),
  rating: real("rating").default(0),
  reviewCount: integer("review_count").default(0),
  status: text("status").notNull().default("draft"), // "draft", "published", "archived"
});

export const insertSellableResourceSchema = createInsertSchema(sellableResources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  downloadCount: true,
  rating: true,
  reviewCount: true,
});

export type SellableResource = typeof sellableResources.$inferSelect;
export type InsertSellableResource = z.infer<typeof insertSellableResourceSchema>;

// Resource Purchases
export const resourcePurchases = pgTable("resource_purchases", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id").notNull().references(() => sellableResources.id),
  buyerId: integer("buyer_id").notNull().references(() => users.id),
  transactionId: text("transaction_id").notNull(), // Reference to Stripe payment
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("completed"), // "pending", "completed", "refunded"
  downloadLink: text("download_link"), // Generated download link
  downloadCount: integer("download_count").default(0),
  expiresAt: timestamp("expires_at"), // Optional expiration date
  purchasedAt: timestamp("purchased_at").defaultNow().notNull(),
});

export const insertResourcePurchaseSchema = createInsertSchema(resourcePurchases).omit({
  id: true,
  purchasedAt: true,
  downloadCount: true,
});

export type ResourcePurchase = typeof resourcePurchases.$inferSelect;
export type InsertResourcePurchase = z.infer<typeof insertResourcePurchaseSchema>;

// Resource Reviews
export const resourceReviews = pgTable("resource_reviews", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id").notNull().references(() => sellableResources.id),
  reviewerId: integer("reviewer_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(), // 1-5 star rating
  comment: text("comment"),
  verified: boolean("verified").default(false), // Whether this is a verified purchase
  helpful: integer("helpful").default(0), // Number of users who found this review helpful
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertResourceReviewSchema = createInsertSchema(resourceReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  helpful: true,
});

export type ResourceReview = typeof resourceReviews.$inferSelect;
export type InsertResourceReview = z.infer<typeof insertResourceReviewSchema>;

// Project Management Boards
export const projectBoards = pgTable("project_boards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  consultationId: integer("consultation_id").references(() => consultations.id),
  status: text("status").notNull().default("active"), // "active", "archived", "completed"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProjectBoardSchema = createInsertSchema(projectBoards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ProjectBoard = typeof projectBoards.$inferSelect;
export type InsertProjectBoard = z.infer<typeof insertProjectBoardSchema>;

// Project Board Lists
export const boardLists = pgTable("board_lists", {
  id: serial("id").primaryKey(),
  boardId: integer("board_id").notNull().references(() => projectBoards.id),
  name: text("name").notNull(),
  position: integer("position").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBoardListSchema = createInsertSchema(boardLists).omit({
  id: true,
  createdAt: true,
});

export type BoardList = typeof boardLists.$inferSelect;
export type InsertBoardList = z.infer<typeof insertBoardListSchema>;

// Project Board Cards
export const boardCards = pgTable("board_cards", {
  id: serial("id").primaryKey(),
  listId: integer("list_id").notNull().references(() => boardLists.id),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  position: integer("position").notNull(),
  assignedTo: integer("assigned_to").references(() => users.id),
  completed: boolean("completed").default(false),
  labels: jsonb("labels"), // Array of label objects with colors and names
  attachments: jsonb("attachments"), // Array of attachment URLs or references
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBoardCardSchema = createInsertSchema(boardCards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type BoardCard = typeof boardCards.$inferSelect;
export type InsertBoardCard = z.infer<typeof insertBoardCardSchema>;

// Escrow Payments
export const escrowPayments = pgTable("escrow_payments", {
  id: serial("id").primaryKey(),
  consultationId: integer("consultation_id").references(() => consultations.id),
  jobApplicationId: integer("job_application_id").references(() => jobApplications.id),
  payerId: integer("payer_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  fee: decimal("fee", { precision: 10, scale: 2 }).notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id").notNull(),
  status: text("status").notNull().default("pending"), // "pending", "funded", "released", "refunded", "disputed"
  releaseCondition: text("release_condition"), // Condition for auto-release
  dueDate: timestamp("due_date"), // When the payment is due to be released
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertEscrowPaymentSchema = createInsertSchema(escrowPayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type EscrowPayment = typeof escrowPayments.$inferSelect;
export type InsertEscrowPayment = z.infer<typeof insertEscrowPaymentSchema>;

// Payment Milestones
export const paymentMilestones = pgTable("payment_milestones", {
  id: serial("id").primaryKey(),
  escrowId: integer("escrow_id").notNull().references(() => escrowPayments.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: timestamp("due_date"),
  status: text("status").notNull().default("pending"), // "pending", "completed", "released"
  completedAt: timestamp("completed_at"),
  releasedAt: timestamp("released_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPaymentMilestoneSchema = createInsertSchema(paymentMilestones).omit({
  id: true,
  createdAt: true,
  completedAt: true,
  releasedAt: true,
});

export type PaymentMilestone = typeof paymentMilestones.$inferSelect;
export type InsertPaymentMilestone = z.infer<typeof insertPaymentMilestoneSchema>;

// Verification Documents
export const verificationDocuments = pgTable("verification_documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  documentType: text("document_type").notNull(), // "id", "certificate", "degree", "background_check"
  filePath: text("file_path").notNull(),
  status: text("status").notNull().default("pending"), // "pending", "verified", "rejected"
  verificationNotes: text("verification_notes"),
  verifiedBy: integer("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertVerificationDocumentSchema = createInsertSchema(verificationDocuments).omit({
  id: true,
  createdAt: true,
  verifiedAt: true,
});

export type VerificationDocument = typeof verificationDocuments.$inferSelect;
export type InsertVerificationDocument = z.infer<typeof insertVerificationDocumentSchema>;

// Social Community Groups
export const communityGroups = pgTable("community_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  isPrivate: boolean("is_private").default(false),
  memberCount: integer("member_count").default(1),
  status: text("status").notNull().default("active"), // "active", "archived", "moderated"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCommunityGroupSchema = createInsertSchema(communityGroups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  memberCount: true,
});

export type CommunityGroup = typeof communityGroups.$inferSelect;
export type InsertCommunityGroup = z.infer<typeof insertCommunityGroupSchema>;

// Community Group Members
export const communityGroupMembers = pgTable("community_group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => communityGroups.id),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role").notNull().default("member"), // "admin", "moderator", "member"
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
}, (table) => {
  return {
    unq: unique().on(table.groupId, table.userId),
  }
});

export const insertCommunityGroupMemberSchema = createInsertSchema(communityGroupMembers).omit({
  id: true,
  joinedAt: true,
});

export type CommunityGroupMember = typeof communityGroupMembers.$inferSelect;
export type InsertCommunityGroupMember = z.infer<typeof insertCommunityGroupMemberSchema>;

// Video Conference Sessions
export const videoSessions = pgTable("video_sessions", {
  id: serial("id").primaryKey(),
  consultationId: integer("consultation_id").references(() => consultations.id),
  hostId: integer("host_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  scheduledStart: timestamp("scheduled_start").notNull(),
  scheduledEnd: timestamp("scheduled_end"),
  actualStart: timestamp("actual_start"),
  actualEnd: timestamp("actual_end"),
  status: text("status").notNull().default("scheduled"), // "scheduled", "in_progress", "completed", "cancelled"
  recordingUrl: text("recording_url"),
  sessionData: jsonb("session_data"), // Provider-specific session data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertVideoSessionSchema = createInsertSchema(videoSessions).omit({
  id: true,
  createdAt: true,
  actualStart: true,
  actualEnd: true,
  recordingUrl: true,
});

export type VideoSession = typeof videoSessions.$inferSelect;
export type InsertVideoSession = z.infer<typeof insertVideoSessionSchema>;

// Video Session Participants
export const videoSessionParticipants = pgTable("video_session_participants", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => videoSessions.id),
  userId: integer("user_id").notNull().references(() => users.id),
  joinTime: timestamp("join_time"),
  leaveTime: timestamp("leave_time"),
  status: text("status").notNull().default("invited"), // "invited", "joined", "left", "declined"
  invitedAt: timestamp("invited_at").defaultNow().notNull(),
}, (table) => {
  return {
    unq: unique().on(table.sessionId, table.userId),
  }
});

export const insertVideoSessionParticipantSchema = createInsertSchema(videoSessionParticipants).omit({
  id: true,
  invitedAt: true,
  joinTime: true,
  leaveTime: true,
});

export type VideoSessionParticipant = typeof videoSessionParticipants.$inferSelect;
export type InsertVideoSessionParticipant = z.infer<typeof insertVideoSessionParticipantSchema>;

// Training Impact Reports
export const trainingReports = pgTable("training_reports", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companyProfiles.id),
  professionalId: integer("professional_id").references(() => professionalProfiles.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  metrics: jsonb("metrics").notNull(), // Array of training metrics and results
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  roi: real("roi"), // Return on investment calculation
  keyFindings: text("key_findings"),
  recommendations: text("recommendations"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTrainingReportSchema = createInsertSchema(trainingReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type TrainingReport = typeof trainingReports.$inferSelect;
export type InsertTrainingReport = z.infer<typeof insertTrainingReportSchema>;

// Request for Proposals (RFP)
export const requestForProposals = pgTable("request_for_proposals", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companyProfiles.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  requirements: text("requirements").notNull(),
  budget: integer("budget"),
  deadline: timestamp("deadline").notNull(),
  status: text("status").notNull().default("open"), // "open", "in_review", "awarded", "cancelled"
  attachments: jsonb("attachments"), // Array of file references
  visibility: text("visibility").notNull().default("public"), // "public", "private", "invited"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertRequestForProposalSchema = createInsertSchema(requestForProposals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type RequestForProposal = typeof requestForProposals.$inferSelect;
export type InsertRequestForProposal = z.infer<typeof insertRequestForProposalSchema>;

// RFP Proposals
export const proposals = pgTable("proposals", {
  id: serial("id").primaryKey(),
  rfpId: integer("rfp_id").notNull().references(() => requestForProposals.id),
  professionalId: integer("professional_id").notNull().references(() => professionalProfiles.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  approach: text("approach").notNull(),
  timeline: text("timeline").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("submitted"), // "submitted", "shortlisted", "selected", "rejected"
  attachments: jsonb("attachments"), // Array of file references
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProposalSchema = createInsertSchema(proposals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Proposal = typeof proposals.$inferSelect;
export type InsertProposal = z.infer<typeof insertProposalSchema>;
export type InsertNotificationPreference = z.infer<typeof insertNotificationPreferenceSchema>;