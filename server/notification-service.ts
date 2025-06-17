import { MailService } from '@sendgrid/mail';
import { storage } from './storage';
import type { User, CompanyProfile, ProfessionalProfile, JobPosting, JobApplication } from '@shared/schema';

interface NotificationData {
  userId: number;
  type: 'job_application' | 'application_status_update' | 'new_job_match';
  title: string;
  message: string;
  data?: any;
}

interface EmailData {
  to: string;
  subject: string;
  html: string;
}

class NotificationService {
  private mailService: MailService | null = null;

  constructor() {
    if (process.env.SENDGRID_API_KEY) {
      this.mailService = new MailService();
      this.mailService.setApiKey(process.env.SENDGRID_API_KEY);
    }
  }

  async sendJobApplicationNotification(
    application: JobApplication,
    job: JobPosting,
    professional: ProfessionalProfile,
    companyProfile: CompanyProfile,
    companyUser: User
  ) {
    // Create in-app notification
    await this.createInAppNotification({
      userId: companyUser.id,
      type: 'job_application',
      title: 'New Job Application',
      message: `${professional.firstName} ${professional.lastName} applied for ${job.title}`,
      data: {
        jobId: job.id,
        applicationId: application.id,
        professionalId: professional.id
      }
    });

    // Send email notification if enabled
    const preferences = await storage.getNotificationPreferences(companyUser.id);
    if (preferences?.emailNotifications && preferences.jobApplicationEmails) {
      await this.sendJobApplicationEmail(
        companyUser.email,
        job,
        professional,
        companyProfile,
        application
      );
    }
  }

  async sendApplicationStatusUpdateNotification(
    application: JobApplication,
    job: JobPosting,
    professional: ProfessionalProfile,
    professionalUser: User,
    newStatus: string
  ) {
    const statusMessages = {
      'reviewed': 'Your application is being reviewed',
      'accepted': 'Congratulations! Your application has been accepted',
      'rejected': 'Your application was not selected this time'
    };

    // Create in-app notification
    await this.createInAppNotification({
      userId: professionalUser.id,
      type: 'application_status_update',
      title: 'Application Status Update',
      message: `${job.title}: ${statusMessages[newStatus as keyof typeof statusMessages] || 'Status updated'}`,
      data: {
        jobId: job.id,
        applicationId: application.id,
        status: newStatus
      }
    });

    // Send email notification if enabled
    const preferences = await storage.getNotificationPreferences(professionalUser.id);
    if (preferences?.emailNotifications && preferences.statusUpdateEmails) {
      await this.sendStatusUpdateEmail(
        professionalUser.email,
        job,
        professional,
        newStatus
      );
    }
  }

  private async createInAppNotification(data: NotificationData) {
    try {
      // Get or create notification type
      let notificationType = await storage.getNotificationTypeByName(data.type);
      if (!notificationType) {
        notificationType = await storage.createNotificationType({
          name: data.type,
          description: `Notification for ${data.type.replace('_', ' ')}`
        });
      }

      await storage.createNotification({
        userId: data.userId,
        typeId: notificationType.id,
        title: data.title,
        message: data.message,
        link: data.data?.link || null
      });
    } catch (error) {
      console.error('Failed to create in-app notification:', error);
    }
  }

  private async sendJobApplicationEmail(
    to: string,
    job: JobPosting,
    professional: ProfessionalProfile,
    company: CompanyProfile,
    application: JobApplication
  ) {
    if (!this.mailService) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Job Application</h1>
          </div>
          <div class="content">
            <h2>Hello ${company.companyName},</h2>
            <p>You have received a new application for your job posting:</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>${job.title}</h3>
              <p><strong>Applicant:</strong> ${professional.firstName} ${professional.lastName}</p>
              <p><strong>Title:</strong> ${professional.title}</p>
              <p><strong>Location:</strong> ${professional.location}</p>
              ${application.coverLetter ? `<p><strong>Cover Letter:</strong></p><p style="font-style: italic;">${application.coverLetter}</p>` : ''}
            </div>
            
            <p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/job-applications/${job.id}" class="button">
                View Application
              </a>
            </p>
          </div>
          <div class="footer">
            <p>L&D Nexus - Professional Development Platform</p>
            <p>You received this email because you have email notifications enabled for job applications.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.mailService.send({
        to,
        from: process.env.FROM_EMAIL || 'noreply@ldnexus.com',
        subject: `New Application: ${job.title}`,
        html
      });
    } catch (error) {
      console.error('Failed to send job application email:', error);
    }
  }

  private async sendStatusUpdateEmail(
    to: string,
    job: JobPosting,
    professional: ProfessionalProfile,
    status: string
  ) {
    if (!this.mailService) return;

    const statusMessages = {
      'reviewed': { subject: 'Application Under Review', message: 'Your application is being reviewed by our team.' },
      'accepted': { subject: 'Application Accepted!', message: 'Congratulations! Your application has been accepted.' },
      'rejected': { subject: 'Application Update', message: 'Thank you for your interest. We have decided to move forward with other candidates.' }
    };

    const statusInfo = statusMessages[status as keyof typeof statusMessages] || 
      { subject: 'Application Status Update', message: 'Your application status has been updated.' };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${status === 'accepted' ? '#10b981' : status === 'rejected' ? '#ef4444' : '#2563eb'}; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${statusInfo.subject}</h1>
          </div>
          <div class="content">
            <h2>Hello ${professional.firstName},</h2>
            <p>${statusInfo.message}</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>${job.title}</h3>
              <p><strong>Status:</strong> ${status.charAt(0).toUpperCase() + status.slice(1)}</p>
              <p><strong>Location:</strong> ${job.location}</p>
            </div>
            
            <p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/dashboard" class="button">
                View Dashboard
              </a>
            </p>
          </div>
          <div class="footer">
            <p>L&D Nexus - Professional Development Platform</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.mailService.send({
        to,
        from: process.env.FROM_EMAIL || 'noreply@ldnexus.com',
        subject: statusInfo.subject,
        html
      });
    } catch (error) {
      console.error('Failed to send status update email:', error);
    }
  }

  async getUnreadNotifications(userId: number) {
    return await storage.getUnreadNotifications(userId);
  }

  async markNotificationAsRead(notificationId: number) {
    return await storage.markNotificationAsRead(notificationId);
  }

  async markAllNotificationsAsRead(userId: number) {
    return await storage.markAllNotificationsAsRead(userId);
  }
}

export const notificationService = new NotificationService();