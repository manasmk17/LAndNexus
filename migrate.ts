import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import * as schema from "./shared/schema";
import ws from "ws";

// Important: configure websocket constructor
neonConfig.webSocketConstructor = ws;

async function runMigration() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  console.log('Starting database migration...');
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  // First, add the subscription_type column
  try {
    console.log('Adding subscription_type column to users table...');
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS subscription_type TEXT
    `);
    console.log('Successfully added subscription_type column');
  } catch (error) {
    console.error('Error adding subscription_type column:', error);
    throw error;
  }

  // Create subscription_plans table
  try {
    console.log('Creating subscription_plans table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        user_type TEXT NOT NULL,
        billing_type TEXT NOT NULL,
        price INTEGER NOT NULL,
        features JSONB NOT NULL,
        max_job_postings INTEGER,
        max_applications INTEGER,
        max_resources INTEGER,
        featured_profile BOOLEAN DEFAULT FALSE,
        ai_matchmaking BOOLEAN DEFAULT FALSE,
        priority_support BOOLEAN DEFAULT FALSE,
        advanced_analytics BOOLEAN DEFAULT FALSE,
        unlimited_messaging BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);
    console.log('Successfully created subscription_plans table');

    // Seed the subscription plans
    console.log('Seeding subscription plans...');
    await seedSubscriptionPlans(pool);
    console.log('Successfully seeded subscription plans');
  } catch (error) {
    console.error('Error creating subscription_plans table:', error);
    throw error;
  }

  console.log('Migration completed successfully!');
  await pool.end();
}

async function seedSubscriptionPlans(pool: Pool) {
  // Professional plans
  const professionalPlans = [
    // Free tier (monthly)
    {
      name: 'Free',
      user_type: 'professional',
      billing_type: 'monthly',
      price: 0,
      features: JSON.stringify([
        'Create basic profile',
        'Apply to up to 5 jobs per month',
        'Access to basic resources',
        'Join community forum'
      ]),
      max_applications: 5,
      max_resources: 5,
      featured_profile: false,
      ai_matchmaking: false,
      priority_support: false,
      advanced_analytics: false,
      unlimited_messaging: false
    },
    // Free tier (annual) - same as monthly but with annual billing cycle
    {
      name: 'Free',
      user_type: 'professional',
      billing_type: 'annually',
      price: 0,
      features: JSON.stringify([
        'Create basic profile',
        'Apply to up to 5 jobs per month',
        'Access to basic resources',
        'Join community forum'
      ]),
      max_applications: 5,
      max_resources: 5,
      featured_profile: false,
      ai_matchmaking: false,
      priority_support: false,
      advanced_analytics: false,
      unlimited_messaging: false
    },
    // Basic tier (monthly)
    {
      name: 'Basic',
      user_type: 'professional',
      billing_type: 'monthly',
      price: 1999, // $19.99
      features: JSON.stringify([
        'All Free features',
        'Enhanced profile customization',
        'Apply to up to 20 jobs per month',
        'Access to premium resources',
        'AI-powered job matching',
        'Profile statistics'
      ]),
      max_applications: 20,
      max_resources: 20,
      featured_profile: false,
      ai_matchmaking: true,
      priority_support: false,
      advanced_analytics: false,
      unlimited_messaging: true
    },
    // Basic tier (annual)
    {
      name: 'Basic',
      user_type: 'professional',
      billing_type: 'annually',
      price: 19990, // $199.90 (equivalent to $16.66/month)
      features: JSON.stringify([
        'All Free features',
        'Enhanced profile customization',
        'Apply to up to 20 jobs per month',
        'Access to premium resources',
        'AI-powered job matching',
        'Profile statistics'
      ]),
      max_applications: 20,
      max_resources: 20,
      featured_profile: false,
      ai_matchmaking: true,
      priority_support: false,
      advanced_analytics: false,
      unlimited_messaging: true
    },
    // Premium tier (monthly)
    {
      name: 'Premium',
      user_type: 'professional',
      billing_type: 'monthly',
      price: 3999, // $39.99
      features: JSON.stringify([
        'All Basic features',
        'Featured profile placement',
        'Unlimited job applications',
        'Priority AI job matching',
        'Advanced analytics dashboard',
        'Priority support',
        'Early access to new features'
      ]),
      max_applications: 999, // Effectively unlimited
      max_resources: 999, // Effectively unlimited
      featured_profile: true,
      ai_matchmaking: true,
      priority_support: true,
      advanced_analytics: true,
      unlimited_messaging: true
    },
    // Premium tier (annual)
    {
      name: 'Premium',
      user_type: 'professional',
      billing_type: 'annually',
      price: 39990, // $399.90 (equivalent to $33.33/month)
      features: JSON.stringify([
        'All Basic features',
        'Featured profile placement',
        'Unlimited job applications',
        'Priority AI job matching',
        'Advanced analytics dashboard',
        'Priority support',
        'Early access to new features'
      ]),
      max_applications: 999, // Effectively unlimited
      max_resources: 999, // Effectively unlimited
      featured_profile: true,
      ai_matchmaking: true,
      priority_support: true,
      advanced_analytics: true,
      unlimited_messaging: true
    }
  ];

  // Company plans
  const companyPlans = [
    // Free tier (monthly)
    {
      name: 'Free',
      user_type: 'company',
      billing_type: 'monthly',
      price: 0,
      features: JSON.stringify([
        'Create company profile',
        'Post up to 1 job at a time',
        'Basic candidate search',
        'Access to community forum'
      ]),
      max_job_postings: 1,
      max_resources: 5,
      featured_profile: false,
      ai_matchmaking: false,
      priority_support: false,
      advanced_analytics: false,
      unlimited_messaging: false
    },
    // Free tier (annual) - same as monthly but with annual billing cycle
    {
      name: 'Free',
      user_type: 'company',
      billing_type: 'annually',
      price: 0,
      features: JSON.stringify([
        'Create company profile',
        'Post up to 1 job at a time',
        'Basic candidate search',
        'Access to community forum'
      ]),
      max_job_postings: 1,
      max_resources: 5,
      featured_profile: false,
      ai_matchmaking: false,
      priority_support: false,
      advanced_analytics: false,
      unlimited_messaging: false
    },
    // Basic tier (monthly)
    {
      name: 'Basic',
      user_type: 'company',
      billing_type: 'monthly',
      price: 4999, // $49.99
      features: JSON.stringify([
        'All Free features',
        'Enhanced company profile',
        'Post up to 5 jobs at a time',
        'Featured job postings',
        'AI-powered professional matching',
        'Hiring analytics'
      ]),
      max_job_postings: 5,
      max_resources: 20,
      featured_profile: false,
      ai_matchmaking: true,
      priority_support: false,
      advanced_analytics: false,
      unlimited_messaging: true
    },
    // Basic tier (annual)
    {
      name: 'Basic',
      user_type: 'company',
      billing_type: 'annually',
      price: 49990, // $499.90 (equivalent to $41.66/month)
      features: JSON.stringify([
        'All Free features',
        'Enhanced company profile',
        'Post up to 5 jobs at a time',
        'Featured job postings',
        'AI-powered professional matching',
        'Hiring analytics'
      ]),
      max_job_postings: 5,
      max_resources: 20,
      featured_profile: false,
      ai_matchmaking: true,
      priority_support: false,
      advanced_analytics: false,
      unlimited_messaging: true
    },
    // Premium tier (monthly)
    {
      name: 'Premium',
      user_type: 'company',
      billing_type: 'monthly',
      price: 9999, // $99.99
      features: JSON.stringify([
        'All Basic features',
        'Featured company profile',
        'Post up to 20 jobs at a time',
        'Priority AI professional matching',
        'Advanced hiring analytics',
        'Priority support',
        'Bulk outreach to professionals',
        'Early access to new features'
      ]),
      max_job_postings: 20,
      max_resources: 999, // Effectively unlimited
      featured_profile: true,
      ai_matchmaking: true,
      priority_support: true,
      advanced_analytics: true,
      unlimited_messaging: true
    },
    // Premium tier (annual)
    {
      name: 'Premium',
      user_type: 'company',
      billing_type: 'annually',
      price: 99990, // $999.90 (equivalent to $83.33/month)
      features: JSON.stringify([
        'All Basic features',
        'Featured company profile',
        'Post up to 20 jobs at a time',
        'Priority AI professional matching',
        'Advanced hiring analytics',
        'Priority support',
        'Bulk outreach to professionals',
        'Early access to new features'
      ]),
      max_job_postings: 20,
      max_resources: 999, // Effectively unlimited
      featured_profile: true,
      ai_matchmaking: true,
      priority_support: true,
      advanced_analytics: true,
      unlimited_messaging: true
    }
  ];

  // Combine all plans
  const allPlans = [...professionalPlans, ...companyPlans];

  // Insert all plans
  for (const plan of allPlans) {
    await pool.query(`
      INSERT INTO subscription_plans (
        name, user_type, billing_type, price, features, 
        max_job_postings, max_applications, max_resources,
        featured_profile, ai_matchmaking, priority_support, 
        advanced_analytics, unlimited_messaging
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      )
      ON CONFLICT DO NOTHING
    `, [
      plan.name, 
      plan.user_type, 
      plan.billing_type, 
      plan.price, 
      plan.features,
      plan.max_job_postings || null,
      plan.max_applications || null,
      plan.max_resources,
      plan.featured_profile,
      plan.ai_matchmaking,
      plan.priority_support,
      plan.advanced_analytics,
      plan.unlimited_messaging
    ]);
  }
}

runMigration().catch(console.error);