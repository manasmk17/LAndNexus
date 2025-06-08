import { Express } from "express";
import { storage } from "./storage";

interface SystemCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

export async function runSystemDiagnostics(): Promise<SystemCheck[]> {
  const checks: SystemCheck[] = [];

  // Database connectivity check
  try {
    await storage.getAllUsers();
    checks.push({
      name: "Database Connection",
      status: "pass",
      message: "Database is accessible and responding"
    });
  } catch (error: any) {
    checks.push({
      name: "Database Connection",
      status: "fail",
      message: `Database connection failed: ${error.message}`
    });
  }

  // OpenAI API key validation
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    checks.push({
      name: "OpenAI API Key",
      status: "fail",
      message: "OPENAI_API_KEY environment variable not set"
    });
  } else if (!openaiKey.startsWith('sk-')) {
    checks.push({
      name: "OpenAI API Key",
      status: "fail",
      message: "Invalid OpenAI API key format - must start with 'sk-'"
    });
  } else {
    checks.push({
      name: "OpenAI API Key",
      status: "pass",
      message: "OpenAI API key is properly configured"
    });
  }

  // Stripe API key validation
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    checks.push({
      name: "Stripe API Key",
      status: "warning",
      message: "STRIPE_SECRET_KEY not configured - payment features disabled"
    });
  } else if (!stripeKey.startsWith('sk_')) {
    checks.push({
      name: "Stripe API Key",
      status: "fail",
      message: "Invalid Stripe API key format"
    });
  } else {
    checks.push({
      name: "Stripe API Key",
      status: "pass",
      message: "Stripe API key is properly configured"
    });
  }

  // Data integrity checks
  try {
    const users = await storage.getAllUsers();
    const professionals = await storage.getFeaturedProfessionalProfiles();
    const jobs = await storage.getLatestJobPostings(10);
    
    checks.push({
      name: "Data Integrity",
      status: "pass",
      message: `System has ${users.length} users, ${professionals.length} professionals, ${jobs.length} jobs`
    });
  } catch (error: any) {
    checks.push({
      name: "Data Integrity",
      status: "fail",
      message: `Data integrity check failed: ${error.message}`
    });
  }

  // Schema validation
  try {
    // Test that critical tables are accessible
    await storage.getAllResourceCategories();
    checks.push({
      name: "Schema Validation",
      status: "pass",
      message: "Database schema is properly configured"
    });
  } catch (error: any) {
    checks.push({
      name: "Schema Validation",
      status: "fail",
      message: `Schema validation failed: ${error.message}`
    });
  }

  return checks;
}

export function setupDiagnosticsRoute(app: Express) {
  app.get('/api/system/diagnostics', async (req, res) => {
    try {
      const checks = await runSystemDiagnostics();
      const summary = {
        total: checks.length,
        passed: checks.filter(c => c.status === 'pass').length,
        failed: checks.filter(c => c.status === 'fail').length,
        warnings: checks.filter(c => c.status === 'warning').length,
        checks
      };
      
      res.json(summary);
    } catch (error) {
      res.status(500).json({
        error: 'Diagnostics failed',
        message: error.message
      });
    }
  });
}