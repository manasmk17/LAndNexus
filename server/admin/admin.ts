import { Express } from 'express';
import adminRoutes from './routes/admin.routes';

/**
 * Register admin routes with the main Express application
 * @param app Express application instance
 */
export function registerAdminRoutes(app: Express): void {
  // Mount all admin routes under /api/admin
  app.use('/api/admin', adminRoutes);
  
  console.log('Admin routes registered successfully');
}