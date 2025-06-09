import Stripe from "stripe";
import { db } from "./db";
import { 
  subscriptionPlans, 
  userSubscriptions, 
  subscriptionInvoices, 
  users,
  type SubscriptionPlan,
  type UserSubscription,
  type InsertUserSubscription,
  type InsertSubscriptionInvoice
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
});

export class SubscriptionService {
  private async getDb() {
    if (!db) {
      throw new Error('Database not initialized');
    }
    return db;
  }

  // Initialize default subscription plans
  async initializeSubscriptionPlans() {
    const database = await this.getDb();
    
    const existingPlans = await database.select().from(subscriptionPlans);
    if (existingPlans.length > 0) {
      // Check if Stripe price IDs are missing and create them
      const plansNeedingStripeSetup = existingPlans.filter(plan => 
        !plan.stripePriceIdMonthlyUSD || !plan.stripePriceIdYearlyUSD
      );
      
      if (plansNeedingStripeSetup.length > 0) {
        await this.setupStripePrices(plansNeedingStripeSetup);
      }
      return;
    }

    const defaultPlans = [
      // Free Plan for both
      {
        name: "Starter",
        description: "Free access to explore the platform",
        planType: "free" as const,
        features: [
          "Basic profile creation",
          "Browse job listings (view only)",
          "Access to public forum discussions",
          "2 resource downloads per month",
          "Standard email support"
        ],
        priceMonthlyUSD: 0,
        priceYearlyUSD: 0,
        priceMonthlyAED: 0,
        priceYearlyAED: 0,
        maxJobApplications: 0,
        maxJobPostings: 0,
        maxResourceDownloads: 2,
        maxTeamMembers: 1,
        maxContacts: 0,
        aiMatchingEnabled: false,
        supportLevel: "email" as const,
        sortOrder: 0
      },
      // Professional Plans
      {
        name: "Professional",
        description: "Perfect for individual L&D professionals getting started",
        planType: "professional",
        features: [
          "Enhanced profile with portfolio showcase",
          "Apply to up to 10 jobs per month",
          "AI-powered job matching",
          "Full resource library access (25 downloads/month)",
          "Direct messaging with companies",
          "Basic consultation booking",
          "Priority email support",
          "Basic analytics dashboard"
        ],
        priceMonthlyUSD: 3900, // $39.00
        priceYearlyUSD: 39000, // $390.00 (17% savings)
        priceMonthlyAED: 14313, // 143.13 AED
        priceYearlyAED: 143130, // 1431.30 AED
        maxJobApplications: 10,
        maxJobPostings: null,
        maxResourceDownloads: 25,
        maxTeamMembers: 1,
        maxContacts: null,
        aiMatchingEnabled: true,
        directMessaging: true,
        videoConsultations: false,
        analyticsAccess: true,
        supportLevel: "priority_email" as const,
        sortOrder: 1
      },
      {
        name: "Expert",
        description: "Advanced features for experienced professionals",
        planType: "professional",
        features: [
          "Everything in Professional",
          "Unlimited job applications",
          "Featured profile placement",
          "Unlimited resource downloads",
          "Video consultation booking",
          "Advanced portfolio tools",
          "Priority matching algorithm",
          "Advanced analytics and insights",
          "Phone support",
          "Custom profile branding"
        ],
        priceMonthlyUSD: 8900, // $89.00
        priceYearlyUSD: 89000, // $890.00 (17% savings)
        priceMonthlyAED: 32663, // 326.63 AED
        priceYearlyAED: 326630, // 3266.30 AED
        maxJobApplications: null,
        maxJobPostings: null,
        maxResourceDownloads: null,
        maxTeamMembers: 1,
        maxContacts: null,
        aiMatchingEnabled: true,
        priorityMatching: true,
        featuredPlacement: true,
        customBranding: true,
        videoConsultations: true,
        directMessaging: true,
        analyticsAccess: true,
        supportLevel: "phone",
        sortOrder: 2
      },
      {
        name: "Elite",
        description: "Premium features for top-tier professionals",
        planType: "professional",
        features: [
          "Everything in Expert",
          "Personal account manager",
          "White-label consultation platform",
          "API access for integrations",
          "Advanced reporting suite",
          "Custom training content uploads",
          "Mentor program access",
          "24/7 priority support"
        ],
        priceMonthlyUSD: 19900, // $199.00
        priceYearlyUSD: 199000, // $1990.00 (17% savings)
        priceMonthlyAED: 73063, // 730.63 AED
        priceYearlyAED: 730630, // 7306.30 AED
        maxJobApplications: null,
        maxJobPostings: null,
        maxResourceDownloads: null,
        maxTeamMembers: 1,
        maxContacts: null,
        aiMatchingEnabled: true,
        priorityMatching: true,
        featuredPlacement: true,
        customBranding: true,
        videoConsultations: true,
        directMessaging: true,
        analyticsAccess: true,
        apiAccess: true,
        whiteLabel: true,
        dedicatedManager: true,
        supportLevel: "24_7",
        sortOrder: 3
      },
      // Company Plans
      {
        name: "Startup",
        description: "Perfect for growing companies and startups",
        planType: "company",
        features: [
          "Post up to 5 active job listings",
          "Search professional database",
          "Basic company profile",
          "Standard messaging",
          "Basic applicant tracking",
          "Email support",
          "Access to 50 professional contacts/month"
        ],
        priceMonthlyUSD: 9900, // $99.00
        priceYearlyUSD: 99000, // $990.00 (17% savings)
        priceMonthlyAED: 36333, // 363.33 AED
        priceYearlyAED: 363330, // 3633.30 AED
        maxJobApplications: null,
        maxJobPostings: 5,
        maxResourceDownloads: 50,
        maxTeamMembers: 3,
        maxContacts: 50,
        aiMatchingEnabled: true,
        directMessaging: true,
        analyticsAccess: false,
        supportLevel: "email",
        sortOrder: 4
      },
      {
        name: "Growth",
        description: "Advanced features for expanding businesses",
        planType: "company",
        features: [
          "Post up to 25 active job listings",
          "AI-powered candidate matching",
          "Enhanced company profile with branding",
          "Priority job listing placement",
          "Advanced search filters",
          "Team collaboration tools (up to 5 users)",
          "Basic analytics dashboard",
          "Phone support",
          "Access to 200 professional contacts/month"
        ],
        priceMonthlyUSD: 29900, // $299.00
        priceYearlyUSD: 299000, // $2990.00 (17% savings)
        priceMonthlyAED: 109833, // 1098.33 AED
        priceYearlyAED: 1098330, // 10983.30 AED
        maxJobApplications: null,
        maxJobPostings: 25,
        maxResourceDownloads: 200,
        maxTeamMembers: 5,
        maxContacts: 200,
        aiMatchingEnabled: true,
        priorityMatching: true,
        featuredPlacement: true,
        customBranding: true,
        directMessaging: true,
        analyticsAccess: true,
        supportLevel: "phone",
        sortOrder: 5
      },
      {
        name: "Enterprise",
        description: "Complete solution for large organizations",
        planType: "company",
        features: [
          "Unlimited job postings",
          "Advanced AI matching algorithms",
          "Custom company branding",
          "Dedicated account manager",
          "Advanced team management (unlimited users)",
          "Custom integrations via API",
          "Advanced analytics and reporting",
          "Escrow payment management",
          "White-label solutions",
          "24/7 priority support",
          "Unlimited professional contacts"
        ],
        priceMonthlyUSD: 59900, // $599.00
        priceYearlyUSD: 599000, // $5990.00 (17% savings)
        priceMonthlyAED: 219833, // 2198.33 AED
        priceYearlyAED: 2198330, // 21983.30 AED
        maxJobApplications: null,
        maxJobPostings: null,
        maxResourceDownloads: null,
        maxTeamMembers: null,
        maxContacts: null,
        aiMatchingEnabled: true,
        priorityMatching: true,
        featuredPlacement: true,
        customBranding: true,
        videoConsultations: true,
        directMessaging: true,
        analyticsAccess: true,
        apiAccess: true,
        whiteLabel: true,
        dedicatedManager: true,
        supportLevel: "24_7",
        sortOrder: 6
      }
    ];

    const insertedPlans = await database.insert(subscriptionPlans).values(defaultPlans as any).returning();
    console.log('✅ Default subscription plans initialized');
    
    // Setup Stripe prices for new plans
    await this.setupStripePrices(insertedPlans);
  }

  async setupStripePrices(plans: any[]) {
    const database = await this.getDb();
    
    for (const plan of plans) {
      try {
        // Create Stripe product
        const product = await stripe.products.create({
          name: `L&D Nexus ${plan.name}`,
          description: plan.description || `${plan.name} subscription plan`,
          metadata: {
            planId: plan.id.toString(),
            planName: plan.name
          }
        });

        // Create monthly price USD
        const monthlyPriceUSD = await stripe.prices.create({
          product: product.id,
          unit_amount: plan.priceMonthlyUSD,
          currency: 'usd',
          recurring: { interval: 'month' },
          metadata: {
            planId: plan.id.toString(),
            billing: 'monthly',
            currency: 'USD'
          }
        });

        // Create yearly price USD
        const yearlyPriceUSD = await stripe.prices.create({
          product: product.id,
          unit_amount: plan.priceYearlyUSD,
          currency: 'usd',
          recurring: { interval: 'year' },
          metadata: {
            planId: plan.id.toString(),
            billing: 'yearly',
            currency: 'USD'
          }
        });

        // Create monthly price AED
        const monthlyPriceAED = await stripe.prices.create({
          product: product.id,
          unit_amount: plan.priceMonthlyAED,
          currency: 'aed',
          recurring: { interval: 'month' },
          metadata: {
            planId: plan.id.toString(),
            billing: 'monthly',
            currency: 'AED'
          }
        });

        // Create yearly price AED
        const yearlyPriceAED = await stripe.prices.create({
          product: product.id,
          unit_amount: plan.priceYearlyAED,
          currency: 'aed',
          recurring: { interval: 'year' },
          metadata: {
            planId: plan.id.toString(),
            billing: 'yearly',
            currency: 'AED'
          }
        });

        // Update plan with Stripe price IDs
        await database.update(subscriptionPlans)
          .set({
            stripePriceIdMonthlyUSD: monthlyPriceUSD.id,
            stripePriceIdYearlyUSD: yearlyPriceUSD.id,
            stripePriceIdMonthlyAED: monthlyPriceAED.id,
            stripePriceIdYearlyAED: yearlyPriceAED.id
          })
          .where(eq(subscriptionPlans.id, plan.id));

        console.log(`✅ Stripe prices created for ${plan.name} plan`);
      } catch (error) {
        console.error(`❌ Failed to create Stripe prices for ${plan.name}:`, error);
      }
    }
  }

  // Get all active subscription plans
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const database = await this.getDb();
    return await database
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true))
      .orderBy(subscriptionPlans.sortOrder);
  }

  // Create or retrieve Stripe customer
  async createOrGetStripeCustomer(userId: number, email: string, name: string): Promise<string> {
    const database = await this.getDb();
    
    // Check if user already has a Stripe customer ID
    const [user] = await database
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (user.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId: userId.toString()
      }
    });

    // Update user with Stripe customer ID
    await database
      .update(users)
      .set({ stripeCustomerId: customer.id })
      .where(eq(users.id, userId));

    return customer.id;
  }

  // Create subscription setup intent (for payment collection)
  async createSubscriptionSetupIntent(data: {
    userId: number;
    planId: number;
    billingCycle: 'monthly' | 'yearly';
    currency: 'USD' | 'AED';
  }): Promise<{ clientSecret: string; planDetails: any }> {
    const database = await this.getDb();

    // Get plan details
    const [plan] = await database
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, data.planId));

    if (!plan) {
      throw new Error('Subscription plan not found');
    }

    // Get user details
    const [user] = await database
      .select()
      .from(users)
      .where(eq(users.id, data.userId));

    if (!user) {
      throw new Error('User not found');
    }

    // Create or get Stripe customer
    const customerId = await this.createOrGetStripeCustomer(
      data.userId, 
      user.email, 
      `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username
    );

    // Get appropriate price ID
    let priceId: string;
    if (data.currency === 'USD') {
      priceId = data.billingCycle === 'monthly' 
        ? plan.stripePriceIdMonthlyUSD! 
        : plan.stripePriceIdYearlyUSD!;
    } else {
      priceId = data.billingCycle === 'monthly' 
        ? plan.stripePriceIdMonthlyAED! 
        : plan.stripePriceIdYearlyAED!;
    }

    // Create subscription with incomplete status
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        userId: data.userId.toString(),
        planId: data.planId.toString(),
        billingCycle: data.billingCycle,
        currency: data.currency
      }
    });

    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice?.payment_intent as Stripe.PaymentIntent;

    if (!paymentIntent || !paymentIntent.client_secret) {
      throw new Error('Failed to create payment intent for subscription');
    }

    return {
      clientSecret: paymentIntent.client_secret,
      planDetails: {
        name: plan.name,
        description: plan.description,
        price: data.currency === 'USD' 
          ? (data.billingCycle === 'monthly' ? plan.priceMonthlyUSD : plan.priceYearlyUSD)
          : (data.billingCycle === 'monthly' ? plan.priceMonthlyAED : plan.priceYearlyAED),
        currency: data.currency,
        billingCycle: data.billingCycle
      }
    };
  }

  // Create subscription
  async createSubscription(data: {
    userId: number;
    planId: number;
    billingCycle: 'monthly' | 'yearly';
    currency: 'USD' | 'AED';
    paymentMethodId?: string;
  }): Promise<{ clientSecret: string; subscriptionId: string }> {
    const database = await this.getDb();

    // Get plan details
    const [plan] = await database
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, data.planId));

    if (!plan) {
      throw new Error('Subscription plan not found');
    }

    // Get user details
    const [user] = await database
      .select()
      .from(users)
      .where(eq(users.id, data.userId));

    if (!user) {
      throw new Error('User not found');
    }

    // Create or get Stripe customer
    const customerId = await this.createOrGetStripeCustomer(
      data.userId,
      user.email,
      `${user.firstName} ${user.lastName}`
    );

    // Determine the correct Stripe price ID based on billing cycle and currency
    let stripePriceId: string;
    if (data.currency === 'USD') {
      stripePriceId = data.billingCycle === 'monthly' 
        ? plan.stripePriceIdMonthlyUSD! 
        : plan.stripePriceIdYearlyUSD!;
    } else {
      stripePriceId = data.billingCycle === 'monthly' 
        ? plan.stripePriceIdMonthlyAED! 
        : plan.stripePriceIdYearlyAED!;
    }

    // Create Stripe subscription
    const subscriptionParams: Stripe.SubscriptionCreateParams = {
      customer: customerId,
      items: [{ price: stripePriceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        userId: data.userId.toString(),
        planId: data.planId.toString()
      }
    };

    if (data.paymentMethodId) {
      subscriptionParams.default_payment_method = data.paymentMethodId;
    }

    const subscription = await stripe.subscriptions.create(subscriptionParams);

    // Store subscription in database
    const subscriptionData: InsertUserSubscription = {
      userId: data.userId,
      planId: data.planId,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customerId,
      status: subscription.status as any,
      billingCycle: data.billingCycle,
      currency: data.currency,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      metadata: {
        stripeSubscriptionData: subscription
      }
    };

    await database.insert(userSubscriptions).values(subscriptionData);

    // Update user subscription status
    await database
      .update(users)
      .set({
        subscriptionTier: plan.name.toLowerCase(),
        subscriptionStatus: subscription.status,
        stripeSubscriptionId: subscription.id
      })
      .where(eq(users.id, data.userId));

    const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = latestInvoice.payment_intent as Stripe.PaymentIntent;

    return {
      clientSecret: paymentIntent.client_secret!,
      subscriptionId: subscription.id
    };
  }

  // Get user's current subscription
  async getUserSubscription(userId: number): Promise<UserSubscription | null> {
    const database = await this.getDb();
    
    const [subscription] = await database
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId))
      .orderBy(userSubscriptions.createdAt);

    return subscription || null;
  }

  // Update subscription (upgrade/downgrade)
  async updateSubscription(userId: number, newPlanId: number): Promise<void> {
    const database = await this.getDb();
    
    const currentSubscription = await this.getUserSubscription(userId);
    if (!currentSubscription) {
      throw new Error('No active subscription found');
    }

    const [newPlan] = await database
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, newPlanId));

    if (!newPlan) {
      throw new Error('New subscription plan not found');
    }

    // Determine new price based on current billing cycle and currency
    let newPriceId: string;
    if (currentSubscription.currency === 'USD') {
      newPriceId = currentSubscription.billingCycle === 'monthly' 
        ? newPlan.stripePriceIdMonthlyUSD! 
        : newPlan.stripePriceIdYearlyUSD!;
    } else {
      newPriceId = currentSubscription.billingCycle === 'monthly' 
        ? newPlan.stripePriceIdMonthlyAED! 
        : newPlan.stripePriceIdYearlyAED!;
    }

    // Update Stripe subscription
    const stripeSubscription = await stripe.subscriptions.retrieve(currentSubscription.stripeSubscriptionId);
    
    await stripe.subscriptions.update(currentSubscription.stripeSubscriptionId, {
      items: [{
        id: stripeSubscription.items.data[0].id,
        price: newPriceId,
      }],
      proration_behavior: 'create_prorations',
    });

    // Update database
    await database
      .update(userSubscriptions)
      .set({ 
        planId: newPlanId,
        updatedAt: new Date()
      })
      .where(eq(userSubscriptions.id, currentSubscription.id));

    // Update user subscription tier
    await database
      .update(users)
      .set({ subscriptionTier: newPlan.name.toLowerCase() })
      .where(eq(users.id, userId));
  }

  // Cancel subscription
  async cancelSubscription(userId: number, cancelAtPeriodEnd: boolean = true): Promise<void> {
    const database = await this.getDb();
    
    const currentSubscription = await this.getUserSubscription(userId);
    if (!currentSubscription) {
      throw new Error('No active subscription found');
    }

    // Update Stripe subscription
    if (cancelAtPeriodEnd) {
      await stripe.subscriptions.update(currentSubscription.stripeSubscriptionId, {
        cancel_at_period_end: true
      });
    } else {
      await stripe.subscriptions.cancel(currentSubscription.stripeSubscriptionId);
    }

    // Update database
    await database
      .update(userSubscriptions)
      .set({ 
        cancelAtPeriodEnd,
        canceledAt: cancelAtPeriodEnd ? null : new Date(),
        updatedAt: new Date()
      })
      .where(eq(userSubscriptions.id, currentSubscription.id));

    if (!cancelAtPeriodEnd) {
      await database
        .update(users)
        .set({ 
          subscriptionStatus: 'canceled',
          subscriptionTier: 'free'
        })
        .where(eq(users.id, userId));
    }
  }

  // Handle Stripe webhooks
  async handleWebhook(event: Stripe.Event): Promise<void> {
    const database = await this.getDb();

    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object as Stripe.Subscription;
        await this.syncSubscriptionFromStripe(subscription);
        break;

      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed':
        const invoice = event.data.object as Stripe.Invoice;
        await this.syncInvoiceFromStripe(invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  // Sync subscription data from Stripe
  private async syncSubscriptionFromStripe(stripeSubscription: Stripe.Subscription): Promise<void> {
    const database = await this.getDb();

    const [existingSubscription] = await database
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.stripeSubscriptionId, stripeSubscription.id));

    if (existingSubscription) {
      await database
        .update(userSubscriptions)
        .set({
          status: stripeSubscription.status as any,
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
          canceledAt: stripeSubscription.canceled_at ? new Date(stripeSubscription.canceled_at * 1000) : null,
          endedAt: stripeSubscription.ended_at ? new Date(stripeSubscription.ended_at * 1000) : null,
          updatedAt: new Date()
        })
        .where(eq(userSubscriptions.id, existingSubscription.id));

      // Update user status
      await database
        .update(users)
        .set({ subscriptionStatus: stripeSubscription.status })
        .where(eq(users.id, existingSubscription.userId));
    }
  }

  // Sync invoice data from Stripe
  private async syncInvoiceFromStripe(stripeInvoice: Stripe.Invoice): Promise<void> {
    const database = await this.getDb();

    if (!stripeInvoice.subscription) return;

    const [subscription] = await database
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.stripeSubscriptionId, stripeInvoice.subscription as string));

    if (!subscription) return;

    const invoiceData: InsertSubscriptionInvoice = {
      userId: subscription.userId,
      subscriptionId: subscription.id,
      stripeInvoiceId: stripeInvoice.id,
      status: stripeInvoice.status as any,
      amount: stripeInvoice.amount_paid || stripeInvoice.amount_due,
      currency: stripeInvoice.currency.toUpperCase() as 'USD' | 'AED',
      billingReason: stripeInvoice.billing_reason || 'subscription_cycle',
      invoiceUrl: stripeInvoice.hosted_invoice_url,
      invoicePdf: stripeInvoice.invoice_pdf,
      dueDate: stripeInvoice.due_date ? new Date(stripeInvoice.due_date * 1000) : null,
      paidAt: stripeInvoice.status_transitions?.paid_at ? new Date(stripeInvoice.status_transitions.paid_at * 1000) : null,
    };

    // Check if invoice already exists
    const [existingInvoice] = await database
      .select()
      .from(subscriptionInvoices)
      .where(eq(subscriptionInvoices.stripeInvoiceId, stripeInvoice.id));

    if (existingInvoice) {
      await database
        .update(subscriptionInvoices)
        .set({
          status: invoiceData.status,
          amount: invoiceData.amount,
          paidAt: invoiceData.paidAt
        })
        .where(eq(subscriptionInvoices.id, existingInvoice.id));
    } else {
      await database.insert(subscriptionInvoices).values(invoiceData);
    }
  }

  // Get user's subscription invoices
  async getUserInvoices(userId: number): Promise<any[]> {
    const database = await this.getDb();
    
    return await database
      .select()
      .from(subscriptionInvoices)
      .where(eq(subscriptionInvoices.userId, userId))
      .orderBy(subscriptionInvoices.createdAt);
  }
}

export const subscriptionService = new SubscriptionService();