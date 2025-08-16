import { z } from 'zod';
import { randomBytes } from 'crypto';
import { scrypt as scryptAsync } from 'crypto';
import { promisify } from 'util';
import {storage} from './storage'; 
import { db } from './db';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const scrypt = promisify(scryptAsync);
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});
class EmailService {
  constructor() {
    // Email transporter setup - Fixed: createTransport instead of createTransporter
    this.transporter = nodemailer.createTransport({
      service: 'gmail', // Gmail, Outlook, SendGrid, və s.
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD // Gmail üçün App Password
      }
    });
  }

  // Email verification token generator
  generateEmailVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  async updateUserVerificationToken(userId, token) {
    try {
      const query = 'UPDATE users SET emailVerificationToken = ? WHERE id = ?';
      await db.execute(query, [token, userId]); // Fixed: use imported db instead of this.db
    } catch (error) {
      console.error("Error updating verification token:", error);
      throw error;
    }
  }

  // Email verification göndər
  async sendVerificationEmail(email, firstName, token) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    const mailOptions = {
      from: {
        name: 'L&D Nexus',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: 'Welcome to L&D Nexus',
      html: this.getVerificationEmailTemplate(firstName, verificationUrl)
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('Verification email sent successfully:', result.messageId);
      return result;
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }
async verifyUserEmail(userId) {
  try {
    const query = `
      UPDATE users 
      SET isEmailVerified = true, 
          emailVerificationToken = NULL, 
          status = 'active'
      WHERE id = ?
    `;
    await this.db.execute(query, [userId]);
  } catch (error) {
    console.error("Error verifying user email:", error);
    throw error;
  }
}
async getUserByVerificationToken(token) {
  try {
    const query = 'SELECT * FROM users WHERE emailVerificationToken = ? AND isEmailVerified = false';
    const [rows] = await this.db.execute(query, [token]);
    return rows[0] || null;
  } catch (error) {
    console.error("Error getting user by verification token:", error);
    throw error;
  }
}
  // Email template
  getVerificationEmailTemplate(firstName, verificationUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          .container { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; line-height: 1.6; }
          .button { display: inline-block; background: #667eea; color: white !important; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; transition: background-color 0.3s; }
          .button:hover { background: #5a67d8; }
          .footer { text-align: center; color: #666; font-size: 14px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px; }
          .link-text { word-break: break-all; color: #667eea; background: #f0f0f0; padding: 10px; border-radius: 5px; font-size: 12px; }
          @media (max-width: 600px) {
            .container { padding: 10px; }
            .header, .content { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to L&D Nexus!</h1>
          </div>
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>Thank you for joining L&D Nexus! We're excited to have you on board.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} L&D Nexus. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendPasswordResetEmail(email, firstName, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: {
        name: 'L&D Nexus',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: 'Reset your L&D Nexus password',
      html: this.getPasswordResetEmailTemplate(firstName, resetUrl)
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('Password reset email sent successfully:', result.messageId);
      return result;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  getPasswordResetEmailTemplate(firstName, resetUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          .container { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 14px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>You requested to reset your password for L&D Nexus. Click the button below to reset your password:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <p>Or copy and paste this link:</p>
            <p style="word-break: break-all; color: #dc3545;">${resetUrl}</p>
            
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} L&D Nexus. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Email connection test
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('Email service is ready');
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }
}

export default EmailService;