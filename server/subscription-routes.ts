import type { Express } from "express";
import Stripe from "stripe";
import { subscriptionService } from "./subscription-service";
import { db } from "./db";
import { subscriptionPlans, userSubscriptions, users } from "@shared/schema";
import { eq, and } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export function registerSubscriptionRoutes(app: Express) {
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  const isAdmin = (req: any, res: any, next: any) => {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  };

  // Get all subscription plans
  app.get("/api/subscription-plans", async (req, res) => {
    try {
      const plans = await subscriptionService.getSubscriptionPlans();
      res.json(plans);
    } catch (error: any) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });

  // Get user's current subscription
  app.get("/api/my-subscription", isAuthenticated, async (req, res) => {
    try {
      const subscription = await subscriptionService.getUserSubscription(req.user.id);
      
      if (!subscription) {
        return res.json({ subscription: null, plan: null });
      }

      // Get plan details
      const database = await db;
      if (!database) {
        throw new Error('Database not initialized');
      }

      const [plan] = await database
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, subscription.planId));

      res.json({ subscription, plan });
    } catch (error: any) {
      console.error("Error fetching user subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  // Create new subscription
  app.post("/api/create-subscription", isAuthenticated, async (req, res) => {
    try {
      const { planId, billingCycle, currency, paymentMethodId } = req.body;

      if (!planId || !billingCycle || !currency) {
        return res.status(400).json({ 
          message: "Missing required fields: planId, billingCycle, currency" 
        });
      }

      if (!['monthly', 'yearly'].includes(billingCycle)) {
        return res.status(400).json({ 
          message: "Invalid billing cycle. Must be 'monthly' or 'yearly'" 
        });
      }

      if (!['USD', 'AED'].includes(currency)) {
        return res.status(400).json({ 
          message: "Invalid currency. Must be 'USD' or 'AED'" 
        });
      }

      // Check if user already has an active subscription
      const existingSubscription = await subscriptionService.getUserSubscription(req.user.id);
      if (existingSubscription && ['active', 'trialing'].includes(existingSubscription.status)) {
        return res.status(400).json({ 
          message: "User already has an active subscription" 
        });
      }

      const result = await subscriptionService.createSubscription({
        userId: req.user.id,
        planId: parseInt(planId),
        billingCycle,
        currency,
        paymentMethodId
      });

      res.json(result);
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: error.message || "Failed to create subscription" });
    }
  });

  // Update subscription (upgrade/downgrade)
  app.post("/api/update-subscription", isAuthenticated, async (req, res) => {
    try {
      const { newPlanId } = req.body;

      if (!newPlanId) {
        return res.status(400).json({ message: "Missing required field: newPlanId" });
      }

      await subscriptionService.updateSubscription(req.user.id, parseInt(newPlanId));
      res.json({ message: "Subscription updated successfully" });
    } catch (error: any) {
      console.error("Error updating subscription:", error);
      res.status(500).json({ message: error.message || "Failed to update subscription" });
    }
  });

  // Cancel subscription
  app.post("/api/cancel-subscription", isAuthenticated, async (req, res) => {
    try {
      const { cancelAtPeriodEnd = true } = req.body;

      await subscriptionService.cancelSubscription(req.user.id, cancelAtPeriodEnd);
      
      const message = cancelAtPeriodEnd 
        ? "Subscription will be canceled at the end of the current billing period"
        : "Subscription canceled immediately";

      res.json({ message });
    } catch (error: any) {
      console.error("Error canceling subscription:", error);
      res.status(500).json({ message: error.message || "Failed to cancel subscription" });
    }
  });

  // Reactivate canceled subscription
  app.post("/api/reactivate-subscription", isAuthenticated, async (req, res) => {
    try {
      const subscription = await subscriptionService.getUserSubscription(req.user.id);
      
      if (!subscription) {
        return res.status(404).json({ message: "No subscription found" });
      }

      if (!subscription.cancelAtPeriodEnd) {
        return res.status(400).json({ message: "Subscription is not scheduled for cancellation" });
      }

      // Reactivate in Stripe

      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: false
      });

      // Update database
      const database = await db;
      if (!database) {
        throw new Error('Database not initialized');
      }

      await database
        .update(userSubscriptions)
        .set({ 
          cancelAtPeriodEnd: false,
          updatedAt: new Date()
        })
        .where(eq(userSubscriptions.id, subscription.id));

      res.json({ message: "Subscription reactivated successfully" });
    } catch (error: any) {
      console.error("Error reactivating subscription:", error);
      res.status(500).json({ message: error.message || "Failed to reactivate subscription" });
    }
  });

  // Get user's invoices
  app.get("/api/my-invoices", isAuthenticated, async (req, res) => {
    try {
      const invoices = await subscriptionService.getUserInvoices(req.user.id);
      res.json(invoices);
    } catch (error: any) {
      console.error("Error fetching user invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  // Create setup intent for payment method
  app.post("/api/create-setup-intent", isAuthenticated, async (req, res) => {
    try {
      const database = await db;
      if (!database) {
        throw new Error('Database not initialized');
      }

      const [user] = await database
        .select()
        .from(users)
        .where(eq(users.id, req.user!.id));

      // Get or create Stripe customer
      const customerId = await subscriptionService.createOrGetStripeCustomer(
        req.user!.id,
        user.email,
        `${user.firstName} ${user.lastName}`
      );

      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        usage: 'off_session',
        payment_method_types: ['card'],
      });

      res.json({ clientSecret: setupIntent.client_secret });
    } catch (error: any) {
      console.error("Error creating setup intent:", error);
      res.status(500).json({ message: "Failed to create setup intent" });
    }
  });

  // Get user's payment methods
  app.get("/api/payment-methods", isAuthenticated, async (req, res) => {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2024-12-18.acacia",
      });

      const database = await db;
      if (!database) {
        throw new Error('Database not initialized');
      }

      const [user] = await database
        .select()
        .from(users)
        .where(eq(users.id, req.user.id));

      if (!user.stripeCustomerId) {
        return res.json([]);
      }

      const paymentMethods = await stripe.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: 'card',
      });

      res.json(paymentMethods.data);
    } catch (error: any) {
      console.error("Error fetching payment methods:", error);
      res.status(500).json({ message: "Failed to fetch payment methods" });
    }
  });

  // Delete payment method
  app.delete("/api/payment-methods/:paymentMethodId", isAuthenticated, async (req, res) => {
    try {
      const { paymentMethodId } = req.params;
      
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2024-12-18.acacia",
      });

      await stripe.paymentMethods.detach(paymentMethodId);
      res.json({ message: "Payment method removed successfully" });
    } catch (error: any) {
      console.error("Error removing payment method:", error);
      res.status(500).json({ message: "Failed to remove payment method" });
    }
  });

  // Stripe webhook endpoint
  app.post("/api/stripe-webhook", async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("Missing STRIPE_WEBHOOK_SECRET environment variable");
      return res.status(500).send("Webhook secret not configured");
    }

    let event: Stripe.Event;

    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2024-12-18.acacia",
      });

      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      await subscriptionService.handleWebhook(event);
      res.json({ received: true });
    } catch (error: any) {
      console.error("Error handling webhook:", error);
      res.status(500).json({ message: "Webhook handling failed" });
    }
  });

  // Admin: Get all subscriptions
  app.get("/api/admin/subscriptions", isAdmin, async (req, res) => {
    try {
      const database = await db;
      if (!database) {
        throw new Error('Database not initialized');
      }

      const subscriptions = await database
        .select({
          subscription: userSubscriptions,
          user: {
            id: users.id,
            username: users.username,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName
          },
          plan: subscriptionPlans
        })
        .from(userSubscriptions)
        .leftJoin(users, eq(userSubscriptions.userId, users.id))
        .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
        .orderBy(userSubscriptions.createdAt);

      res.json(subscriptions);
    } catch (error: any) {
      console.error("Error fetching admin subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });

  // Admin: Get subscription analytics
  app.get("/api/admin/subscription-analytics", isAdmin, async (req, res) => {
    try {
      const database = await db;
      if (!database) {
        throw new Error('Database not initialized');
      }

      // Get subscription counts by status
      const statusCounts = await database
        .select({
          status: userSubscriptions.status,
          count: userSubscriptions.id
        })
        .from(userSubscriptions);

      // Get revenue by plan
      const planRevenue = await database
        .select({
          planName: subscriptionPlans.name,
          count: userSubscriptions.id,
          monthlyRevenueUSD: subscriptionPlans.priceMonthlyUSD,
          yearlyRevenueUSD: subscriptionPlans.priceYearlyUSD
        })
        .from(userSubscriptions)
        .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
        .where(eq(userSubscriptions.status, 'active'));

      res.json({
        statusCounts,
        planRevenue,
        totalActiveSubscriptions: statusCounts.filter(s => s.status === 'active').length
      });
    } catch (error: any) {
      console.error("Error fetching subscription analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });
}