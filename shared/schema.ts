import { pgTable, text, serial, integer, timestamp, boolean, unique } from "drizzle-orm/pg-core";
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
  userType: text("user_type").notNull(), // "professional" or "company"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Professional Profiles
export const professionalProfiles = pgTable("professional_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  bio: text("bio").notNull(),
  location: text("location").notNull(),
  videoIntroUrl: text("video_intro_url"),
  ratePerHour: integer("rate_per_hour"),
  profileImageUrl: text("profile_image_url"),
  featured: boolean("featured").default(false),
  rating: integer("rating").default(0),
  reviewCount: integer("review_count").default(0),
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
  size: text("size").notNull(), // "small", "medium", "large", "enterprise"
  location: text("location").notNull(),
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

// Resources
export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  content: text("content").notNull(),
  resourceType: text("resource_type").notNull(), // "article", "template", "video", "webinar"
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
