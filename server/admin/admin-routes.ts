import { Express } from 'express';
import { requireAdminAuth, adminLogin, adminLogout } from './admin-auth';
import {
  getDashboardStats,
  getAllUsers,
  getUserDetails,
  updateUserStatus,
  verifyUser,
  getAllJobPostings,
  moderateJobPosting,
  getAllResources,
  moderateResource,
  getFinancialOverview,
  getSubscriptionManagement,
  getSystemSettings,
  updateSystemSettings,
  getAdminLogs
} from './admin-api';

export function registerAdminRoutes(app: Express) {
  // Admin authentication routes
  app.post('/api/admin/login', adminLogin);
  app.post('/api/admin/logout', requireAdminAuth, adminLogout);

  // Dashboard routes
  app.get('/api/admin/dashboard/stats', requireAdminAuth, getDashboardStats);

  // User management routes
  app.get('/api/admin/users', requireAdminAuth, getAllUsers);
  app.get('/api/admin/users/:userId', requireAdminAuth, getUserDetails);
  app.patch('/api/admin/users/:userId/status', requireAdminAuth, updateUserStatus);
  app.patch('/api/admin/users/:userId/verify', requireAdminAuth, verifyUser);

  // Content management routes
  app.get('/api/admin/jobs', requireAdminAuth, getAllJobPostings);
  app.patch('/api/admin/jobs/:jobId/moderate', requireAdminAuth, moderateJobPosting);
  app.get('/api/admin/resources', requireAdminAuth, getAllResources);
  app.patch('/api/admin/resources/:resourceId/moderate', requireAdminAuth, moderateResource);

  // Financial management routes
  app.get('/api/admin/financial/overview', requireAdminAuth, getFinancialOverview);
  app.get('/api/admin/subscriptions', requireAdminAuth, getSubscriptionManagement);

  // System management routes
  app.get('/api/admin/settings', requireAdminAuth, getSystemSettings);
  app.patch('/api/admin/settings', requireAdminAuth, updateSystemSettings);

  // Admin activity logs
  app.get('/api/admin/logs', requireAdminAuth, getAdminLogs);
}