import { pgTable, text, serial, integer, timestamp, boolean, unique, jsonb } from "drizzle-orm/pg-core";
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
  stripeConnectAccountId: text("stripe_connect_account_id"),
  payoutAccountSetup: boolean("payout_account_setup").default(false),
  subscriptionTier: text("subscription_tier"), // "free", "basic", "premium"
  subscriptionStatus: text("subscription_status"), // "active", "trialing", "past_due", "canceled"
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
});

// Authentication tokens for "Remember Me" functionality
export const authTokens = pgTable("auth_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  type: text("type").notNull().default("remember_me"), // "remember_me", "api_token", etc.
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUsedAt: timestamp("last_used_at"),
  userAgent: text("user_agent"), // For security tracking
  ipAddress: text("ip_address"), // For security tracking
  isRevoked: boolean("is_revoked").default(false).notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertAuthTokenSchema = createInsertSchema(authTokens).omit({
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
  externalPortfolioUrl: text("external_portfolio_url"), // Link to external portfolio website
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

// Enhanced Certifications with Portfolio Features
export const certifications = pgTable("certifications", {
  id: serial("id").primaryKey(),
  professionalId: integer("professional_id").notNull().references(() => professionalProfiles.id),
  name: text("name").notNull(),
  issuer: text("issuer").notNull(),
  year: integer("year").notNull(),
  imageUrl: text("image_url"), // Certificate image
  description: text("description"), // Additional details
  verificationUrl: text("verification_url"), // Link to verify certificate
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCertificationSchema = createInsertSchema(certifications).omit({
  id: true,
  createdAt: true,
});

// Awards & Recognition Gallery
export const awards = pgTable("awards", {
  id: serial("id").primaryKey(),
  professionalId: integer("professional_id").notNull().references(() => professionalProfiles.id),
  title: text("title").notNull(),
  organization: text("organization").notNull(),
  year: integer("year").notNull(),
  description: text("description"),
  imageUrl: text("image_url"), // Award image/certificate
  category: text("category"), // e.g., "Training Excellence", "Leadership", etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAwardSchema = createInsertSchema(awards).omit({
  id: true,
  createdAt: true,
});

// Training Materials Library
export const trainingMaterials = pgTable("training_materials", {
  id: serial("id").primaryKey(),
  professionalId: integer("professional_id").notNull().references(() => professionalProfiles.id),
  title: text("title").notNull(),
  type: text("type").notNull(), // "document", "video", "presentation", "course"
  description: text("description"),
  url: text("url"), // External link
  fileUrl: text("file_url"), // Uploaded file path
  tags: text("tags"), // Comma-separated tags
  isPublic: boolean("is_public").default(true), // Whether visible to others
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTrainingMaterialSchema = createInsertSchema(trainingMaterials).omit({
  id: true,
  createdAt: true,
});

// External Portfolio Links
export const portfolioLinks = pgTable("portfolio_links", {
  id: serial("id").primaryKey(),
  professionalId: integer("professional_id").notNull().references(() => professionalProfiles.id),
  title: text("title").notNull(), // e.g., "Personal Website", "LinkedIn"
  url: text("url").notNull(),
  type: text("type").notNull(), // "website", "linkedin", "portfolio", "blog", "other"
  description: text("description"),
  isPrimary: boolean("is_primary").default(false), // Primary portfolio link
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPortfolioLinkSchema = createInsertSchema(portfolioLinks).omit({
  id: true,
  createdAt: true,
});

export type SelectCertification = typeof certifications.$inferSelect;
export type InsertCertification = z.infer<typeof insertCertificationSchema>;
export type SelectAward = typeof awards.$inferSelect;
export type InsertAward = z.infer<typeof insertAwardSchema>;
export type SelectTrainingMaterial = typeof trainingMaterials.$inferSelect;
export type InsertTrainingMaterial = z.infer<typeof insertTrainingMaterialSchema>;
export type SelectPortfolioLink = typeof portfolioLinks.$inferSelect;
export type InsertPortfolioLink = z.infer<typeof insertPortfolioLinkSchema>;

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
  modifiedAt: timestamp("modified_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  archived: boolean("archived").default(false),
  status: text("status").notNull().default("open"), // "open", "closed", "filled"
});

export const insertJobPostingSchema = createInsertSchema(jobPostings).omit({
  id: true,
  createdAt: true,
  modifiedAt: true,
}).extend({
  expiresAt: z.preprocess((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }, z.date().optional())
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

// User Notification Preferences
export const notificationPreferences = pgTable("notification_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  typeId: integer("type_id").notNull().references(() => notificationTypes.id),
  email: boolean("email").default(true),
  inApp: boolean("in_app").default(true),
}, (table) => {
  return {
    unq: unique().on(table.userId, table.typeId),
  }
});

export const insertNotificationPreferenceSchema = createInsertSchema(notificationPreferences).omit({
  id: true,
});

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = z.infer<typeof insertNotificationPreferenceSchema>;

// Escrow Payment System Tables
export const escrowTransactions = pgTable("escrow_transactions", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => users.id),
  trainerId: integer("trainer_id").notNull().references(() => users.id),
  jobPostingId: integer("job_posting_id").references(() => jobPostings.id),
  bookingId: integer("booking_id").references(() => consultations.id),

  // Payment details
  amount: integer("amount").notNull(), // Amount in cents
  currency: text("currency").notNull().default("USD"), // USD or AED
  platformCommissionRate: integer("platform_commission_rate").default(800), // 8% in basis points (800 = 8%)
  platformCommissionAmount: integer("platform_commission_amount").notNull(),
  trainerPayoutAmount: integer("trainer_payout_amount").notNull(),

  // Stripe payment details
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeTransferGroupId: text("stripe_transfer_group_id"),
  stripeApplicationFeeId: text("stripe_application_fee_id"),

  // Transaction status
  status: text("status", { 
    enum: ["pending", "payment_failed", "funds_captured", "in_escrow", "released", "refunded", "disputed", "cancelled"] 
  }).notNull().default("pending"),

  // Escrow details
  escrowReleaseDate: timestamp("escrow_release_date"),
  autoReleaseAfterDays: integer("auto_release_after_days").default(7),
  serviceCompletionConfirmed: boolean("service_completion_confirmed").default(false),
  serviceCompletionDate: timestamp("service_completion_date"),

  // Dispute management
  disputeReason: text("dispute_reason"),
  disputeDetails: text("dispute_details"),
  disputeResolution: text("dispute_resolution"),
  disputeResolutionDate: timestamp("dispute_resolution_date"),

  // Metadata
  description: text("description"),
  metadata: jsonb("metadata"), // Additional transaction data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertEscrowTransactionSchema = createInsertSchema(escrowTransactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type EscrowTransaction = typeof escrowTransactions.$inferSelect;
export type InsertEscrowTransaction = z.infer<typeof insertEscrowTransactionSchema>;

// Payment Methods table for storing customer payment methods
export const paymentMethods = pgTable("payment_methods", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  stripePaymentMethodId: text("stripe_payment_method_id").notNull(),
  type: text("type").notNull(), // "card", "bank_account", etc.
  brand: text("brand"), // "visa", "mastercard", etc.
  last4: text("last4"), // Last 4 digits
  expiryMonth: integer("expiry_month"),
  expiryYear: integer("expiry_year"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).omit({
  id: true,
  createdAt: true,
});

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;

// Transaction History for audit trail
export const transactionHistory = pgTable("transaction_history", {
  id: serial("id").primaryKey(),
  escrowTransactionId: integer("escrow_transaction_id").notNull().references(() => escrowTransactions.id),
  action: text("action").notNull(), // "created", "funded", "captured", "released", "refunded", etc.
  previousStatus: text("previous_status"),
  newStatus: text("new_status"),
  actionBy: integer("action_by").references(() => users.id), // User who performed the action
  actionReason: text("action_reason"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTransactionHistorySchema = createInsertSchema(transactionHistory).omit({
  id: true,
  createdAt: true,
});

export type TransactionHistory = typeof transactionHistory.$inferSelect;
export type InsertTransactionHistory = z.infer<typeof insertTransactionHistorySchema>;

// Subscription Plans table
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // "Professional", "Expert", "Elite", "Startup", "Growth", "Enterprise"
  description: text("description"),
  features: jsonb("features"), // Array of feature descriptions
  planType: text("plan_type", { enum: ["professional", "company", "free"] }).notNull(), // Target user type
  priceMonthlyUSD: integer("price_monthly_usd").notNull(), // Price in cents
  priceYearlyUSD: integer("price_yearly_usd").notNull(), // Price in cents (with discount)
  priceMonthlyAED: integer("price_monthly_aed").notNull(), // Price in fils
  priceYearlyAED: integer("price_yearly_aed").notNull(), // Price in fils (with discount)
  stripePriceIdMonthlyUSD: text("stripe_price_id_monthly_usd"),
  stripePriceIdYearlyUSD: text("stripe_price_id_yearly_usd"),
  stripePriceIdMonthlyAED: text("stripe_price_id_monthly_aed"),
  stripePriceIdYearlyAED: text("stripe_price_id_yearly_aed"),

  // Feature limits
  maxJobApplications: integer("max_job_applications"), // null = unlimited (for professionals)
  maxJobPostings: integer("max_job_postings"), // null = unlimited (for companies)
  maxResourceDownloads: integer("max_resource_downloads"), // null = unlimited
  maxTeamMembers: integer("max_team_members"), // null = unlimited
  maxContacts: integer("max_contacts"), // professional contacts for companies

  // Feature flags
  aiMatchingEnabled: boolean("ai_matching_enabled").default(true),
  priorityMatching: boolean("priority_matching").default(false),
  featuredPlacement: boolean("featured_placement").default(false),
  customBranding: boolean("custom_branding").default(false),
  videoConsultations: boolean("video_consultations").default(false),
  directMessaging: boolean("direct_messaging").default(false),
  analyticsAccess: boolean("analytics_access").default(false),
  apiAccess: boolean("api_access").default(false),
  whiteLabel: boolean("white_label").default(false),
  dedicatedManager: boolean("dedicated_manager").default(false),

  // Support level
  supportLevel: text("support_level", { enum: ["email", "priority_email", "phone", "dedicated", "24_7"] }).default("email"),

  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
});

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;

// User Subscriptions table
export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  planId: integer("plan_id").notNull().references(() => subscriptionPlans.id),
  stripeSubscriptionId: text("stripe_subscription_id").notNull().unique(),
  stripeCustomerId: text("stripe_customer_id").notNull(),
  status: text("status", { 
    enum: ["trialing", "active", "incomplete", "incomplete_expired", "past_due", "canceled", "unpaid", "paused"] 
  }).notNull(),
  billingCycle: text("billing_cycle", { enum: ["monthly", "yearly"] }).notNull(),
  currency: text("currency", { enum: ["USD", "AED"] }).notNull().default("USD"),
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  trialStart: timestamp("trial_start"),
  trialEnd: timestamp("trial_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  canceledAt: timestamp("canceled_at"),
  endedAt: timestamp("ended_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;

// Subscription Invoices table
export const subscriptionInvoices = pgTable("subscription_invoices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  subscriptionId: integer("subscription_id").notNull().references(() => userSubscriptions.id),
  stripeInvoiceId: text("stripe_invoice_id").notNull().unique(),
  status: text("status", { 
    enum: ["draft", "open", "paid", "uncollectible", "void"] 
  }).notNull(),
  amount: integer("amount").notNull(), // Amount in cents/fils
  currency: text("currency", { enum: ["USD", "AED"] }).notNull(),
  billingReason: text("billing_reason"), // "subscription_create", "subscription_cycle", etc.
  invoiceUrl: text("invoice_url"),
  invoicePdf: text("invoice_pdf"),
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSubscriptionInvoiceSchema = createInsertSchema(subscriptionInvoices).omit({
  id: true,
  createdAt: true,
});

export type SubscriptionInvoice = typeof subscriptionInvoices.$inferSelect;
export type InsertSubscriptionInvoice = z.infer<typeof insertSubscriptionInvoiceSchema>;

// Auth token types
export type AuthToken = typeof authTokens.$inferSelect;
export type InsertAuthToken = z.infer<typeof insertAuthTokenSchema>;