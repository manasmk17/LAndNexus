import { IStorage } from './storage';
import * as schema from '../shared/schema';

// This file documents the storage interface methods that need to be added
// to resolve the TypeScript compilation errors in routes.ts

export interface ExtendedIStorage extends IStorage {
  // User management methods
  getUser(id: number): Promise<schema.User | undefined>;
  getUserByEmail(email: string): Promise<schema.User | undefined>;
  getUserByResetToken(token: string): Promise<schema.User | undefined>;
  getUserByStripeCustomerId(customerId: string): Promise<schema.User | undefined>;
  updateStripeCustomerId(userId: number, customerId: string): Promise<void>;
  updateStripeSubscriptionId(userId: number, subscriptionId: string): Promise<void>;
  
  // Auth token methods
  validateAuthToken(token: string): Promise<schema.AuthToken | undefined>;
  createResetToken(userId: number, token: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<boolean>;
  
  // Professional expertise methods
  getProfessionalExpertise(professionalId: number): Promise<schema.Expertise[]>;
  addProfessionalExpertise(professionalId: number, expertiseId: number): Promise<void>;
  deleteProfessionalExpertise(professionalId: number, expertiseId: number): Promise<void>;
  
  // Professional certifications methods
  getProfessionalCertifications(professionalId: number): Promise<schema.Certification[]>;
  getCertification(id: number): Promise<schema.Certification | undefined>;
  deleteCertification(id: number): Promise<boolean>;
  
  // Company methods
  getCompanyJobPostings(companyId: number): Promise<schema.JobPosting[]>;
  
  // Job application methods
  getJobApplicationsByProfessional(professionalId: number): Promise<schema.JobApplication[]>;
  getJobApplicationsByJob(jobId: number): Promise<schema.JobApplication[]>;
  updateJobApplicationStatus(id: number, status: string): Promise<boolean>;
  
  // Resource methods
  getResourcesByAuthor(authorId: number): Promise<schema.Resource[]>;
  getResourcesByCategory(categoryId: number): Promise<schema.Resource[]>;
  getResourceCategory(id: number): Promise<schema.ResourceCategory | undefined>;
  setResourceFeatured(id: number, featured: boolean): Promise<boolean>;
  
  // Consultation methods
  getConsultation(id: number): Promise<any>;
  updateConsultationStatus(id: number, status: string): Promise<boolean>;
  createConsultation(consultation: any): Promise<any>;
  getProfessionalConsultations(professionalId: number): Promise<any[]>;
  getCompanyConsultations(companyId: number): Promise<any[]>;
  
  // Message methods
  getUserMessages(userId: number): Promise<schema.Message[]>;
  markMessageAsRead(id: number): Promise<boolean>;
  getConversation(id: number): Promise<any>;
  
  // Forum methods
  createForumPost(post: any): Promise<any>;
  getAllForumPosts(): Promise<any[]>;
  getForumPost(id: number): Promise<any>;
  getPostComments(postId: number): Promise<any[]>;
  createForumComment(comment: any): Promise<any>;
  
  // Page content methods
  getAllPageContents(): Promise<any[]>;
  getPageContent(id: number): Promise<any>;
  getPageContentBySlug(slug: string): Promise<any>;
  createPageContent(content: any): Promise<any>;
  updatePageContent(id: number, content: any): Promise<boolean>;
  deletePageContent(id: number): Promise<boolean>;
  
  // Review methods
  getProfessionalReviews(professionalId: number): Promise<any[]>;
  
  // Skill recommendation methods
  getSkillRecommendationsByProfessional(professionalId: number): Promise<any[]>;
  createSkillRecommendation(recommendation: any): Promise<any>;
  updateSkillRecommendation(id: number, recommendation: any): Promise<boolean>;
}