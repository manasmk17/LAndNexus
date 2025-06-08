import { storage } from "./storage";
import { WebSocket } from "ws";
import type { Request, Response } from "express";

// Enhanced notification system with real-time delivery
export class NotificationManager {
  private connectedClients = new Map<number, WebSocket>();

  addClient(userId: number, ws: WebSocket) {
    this.connectedClients.set(userId, ws);
  }

  removeClient(userId: number) {
    this.connectedClients.delete(userId);
  }

  async sendRealTimeNotification(userId: number, notification: any): Promise<boolean> {
    const ws = this.connectedClients.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({
          type: 'notification',
          data: {
            id: notification.id,
            title: notification.title,
            message: notification.message,
            createdAt: notification.createdAt,
            link: notification.link,
            read: false
          }
        }));
        return true;
      } catch (error) {
        console.error('Error sending real-time notification:', error);
        this.removeClient(userId);
        return false;
      }
    }
    return false;
  }

  async createAndSendNotification(userId: number, typeId: number, title: string, message: string, link?: string) {
    try {
      // Create notification in database
      const notification = await storage.createNotification({
        userId,
        typeId,
        title,
        message,
        link: link || null
      });

      // Send real-time notification
      const sent = await this.sendRealTimeNotification(userId, notification);
      
      return { notification, realTimeSent: sent };
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }
}

// Enhanced rating calculation system
export class RatingManager {
  static async updateProfessionalRating(professionalId: number): Promise<void> {
    try {
      const reviews = await storage.getProfessionalReviews(professionalId);
      
      if (reviews.length === 0) {
        console.log(`No reviews found for professional ${professionalId}`);
        return;
      }

      // Calculate weighted average (recent reviews have slightly more weight)
      const now = Date.now();
      let totalWeightedScore = 0;
      let totalWeight = 0;

      reviews.forEach(review => {
        const daysSinceReview = (now - review.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        const weight = Math.max(0.5, 1 - (daysSinceReview / 365)); // Reduce weight over time
        totalWeightedScore += review.rating * weight;
        totalWeight += weight;
      });

      const averageRating = totalWeightedScore / totalWeight;
      const roundedRating = Math.round(averageRating * 10) / 10;

      // Update professional profile
      await storage.updateProfessionalProfile(professionalId, {
        rating: roundedRating,
        reviewCount: reviews.length
      });

      console.log(`Updated rating for professional ${professionalId}: ${roundedRating} (${reviews.length} reviews)`);
    } catch (error) {
      console.error(`Error updating professional rating for ID ${professionalId}:`, error);
    }
  }

  static async recalculateAllRatings(): Promise<void> {
    try {
      const professionals = await storage.getAllProfessionalProfiles();
      
      for (const professional of professionals) {
        await this.updateProfessionalRating(professional.id);
      }
      
      console.log(`Recalculated ratings for ${professionals.length} professionals`);
    } catch (error) {
      console.error('Error recalculating all ratings:', error);
    }
  }
}

// File upload validation and processing
export class FileUploadManager {
  static validateFile(file: Express.Multer.File): { valid: boolean; error?: string } {
    const allowedMimes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'video/mp4', 'video/webm', 'video/quicktime'
    ];

    const maxSizes = {
      image: 5 * 1024 * 1024,  // 5MB for images
      video: 50 * 1024 * 1024, // 50MB for videos
      pdf: 10 * 1024 * 1024    // 10MB for PDFs
    };

    // Check file type
    if (!allowedMimes.includes(file.mimetype)) {
      return {
        valid: false,
        error: `File type ${file.mimetype} not allowed. Supported: ${allowedMimes.join(', ')}`
      };
    }

    // Check file size based on type
    let maxSize = maxSizes.image; // default
    if (file.mimetype.startsWith('video/')) {
      maxSize = maxSizes.video;
    } else if (file.mimetype === 'application/pdf') {
      maxSize = maxSizes.pdf;
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds limit of ${(maxSize / 1024 / 1024).toFixed(1)}MB`
      };
    }

    return { valid: true };
  }

  static generateSecureFilename(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const extension = originalName.split('.').pop()?.toLowerCase() || '';
    return `${timestamp}_${random}.${extension}`;
  }

  static getFileUrl(filename: string, req: Request): string {
    const protocol = req.get('X-Forwarded-Proto') || req.protocol;
    const host = req.get('Host');
    return `${protocol}://${host}/uploads/${filename}`;
  }
}

// Enhanced AI matching diagnostics
export class AIMatchingDiagnostics {
  static async testOpenAIConnection(): Promise<{ connected: boolean; error?: string }> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return { connected: false, error: 'OpenAI API key not configured' };
      }

      if (!process.env.OPENAI_API_KEY.startsWith('sk-')) {
        return { 
          connected: false, 
          error: `Invalid OpenAI API key format. Expected format: sk-... but got: ${process.env.OPENAI_API_KEY.substring(0, 10)}...` 
        };
      }

      // Test with a simple embedding request
      const { generateEmbedding } = await import('./ai-services');
      const result = await generateEmbedding('test connection');
      
      if (result && Array.isArray(result) && result.length > 0) {
        return { connected: true };
      } else {
        return { connected: false, error: 'OpenAI API returned invalid response' };
      }
    } catch (error: any) {
      return { 
        connected: false, 
        error: `OpenAI connection failed: ${error.message}` 
      };
    }
  }

  static async getMatchingQuality(): Promise<{ 
    fallbackMode: boolean; 
    totalMatches: number; 
    averageScore: number;
    qualityRating: string;
  }> {
    try {
      const { connected } = await this.testOpenAIConnection();
      const professionals = await storage.getAllProfessionalProfiles();
      const jobs = await storage.getAllJobPostings();
      
      let totalScore = 0;
      let matchCount = 0;

      // Sample a few matches to assess quality
      for (let i = 0; i < Math.min(professionals.length, 3); i++) {
        for (let j = 0; j < Math.min(jobs.length, 2); j++) {
          const matches = await storage.getMatchingJobsForProfessional(professionals[i].id, 1);
          if (matches.length > 0) {
            totalScore += matches[0].score;
            matchCount++;
          }
        }
      }

      const averageScore = matchCount > 0 ? totalScore / matchCount : 0;
      let qualityRating = 'poor';
      
      if (averageScore >= 0.8) qualityRating = 'excellent';
      else if (averageScore >= 0.6) qualityRating = 'good';
      else if (averageScore >= 0.4) qualityRating = 'fair';

      return {
        fallbackMode: !connected,
        totalMatches: matchCount,
        averageScore: Math.round(averageScore * 100) / 100,
        qualityRating
      };
    } catch (error) {
      console.error('Error assessing matching quality:', error);
      return {
        fallbackMode: true,
        totalMatches: 0,
        averageScore: 0,
        qualityRating: 'unknown'
      };
    }
  }
}