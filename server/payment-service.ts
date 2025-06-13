import Stripe from "stripe";
import { storage } from "./storage";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia" as any,
});

export interface PaymentMethodOptions {
  card: boolean;
  netbanking: boolean;
  upi: boolean;
  wallet: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
}

export const SUBSCRIPTION_PLANS: { [key: string]: SubscriptionPlan } = {
  'basic': {
    id: 'basic',
    name: 'Basic Plan',
    monthlyPrice: 9.99,
    yearlyPrice: 99.99,
    features: ['Basic job matching', 'Profile creation', 'Limited applications']
  },
  'professional': {
    id: 'professional',
    name: 'Professional Plan',
    monthlyPrice: 29.99,
    yearlyPrice: 299.99,
    features: ['Advanced matching', 'Priority support', 'Unlimited applications', 'Analytics']
  },
  'enterprise': {
    id: 'enterprise',
    name: 'Enterprise Plan',
    monthlyPrice: 99.99,
    yearlyPrice: 999.99,
    features: ['All features', 'Custom integrations', 'Dedicated support', 'Advanced analytics']
  }
};

export class PaymentService {
  
  /**
   * Create a payment intent for subscription with support for multiple payment methods
   */
  async createSubscriptionPaymentIntent(
    userId: number,
    planId: string,
    billingCycle: 'monthly' | 'yearly',
    currency: string = 'usd'
  ) {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan) {
      throw new Error('Invalid plan ID');
    }

    const amount = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
        metadata: {
          userId: user.id.toString(),
          userType: user.userType
        }
      });
      
      customerId = customer.id;
      await storage.updateStripeCustomerId(user.id, customerId);
    }

    // Create payment intent with support for multiple payment methods
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      customer: customerId,
      payment_method_types: [
        'card',
        'bancontact',
        'eps',
        'giropay',
        'ideal',
        'p24',
        'sepa_debit',
        'sofort'
      ],
      metadata: {
        userId: user.id.toString(),
        planId,
        billingCycle,
        type: 'subscription'
      },
      description: `${plan.name} - ${billingCycle} subscription`
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      customerId,
      amount,
      currency,
      planDetails: {
        ...plan,
        billingCycle,
        amount
      }
    };
  }

  /**
   * Create a setup intent for future payments (for subscription renewals)
   */
  async createSetupIntent(userId: number, paymentMethodTypes: string[] = ['card']) {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
        metadata: {
          userId: user.id.toString()
        }
      });
      
      customerId = customer.id;
      await storage.updateStripeCustomerId(user.id, customerId);
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: paymentMethodTypes,
      usage: 'off_session',
      metadata: {
        userId: user.id.toString(),
        type: 'setup_for_future_payments'
      }
    });

    return {
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
      customerId
    };
  }

  /**
   * Confirm payment and activate subscription
   */
  async confirmSubscriptionPayment(paymentIntentId: string) {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      throw new Error('Payment not completed successfully');
    }

    const userId = parseInt(paymentIntent.metadata.userId);
    const planId = paymentIntent.metadata.planId;
    const billingCycle = paymentIntent.metadata.billingCycle;

    // Update user subscription status
    await storage.updateUserSubscription(userId, planId, 'active');
    
    // Set subscription end date
    const endDate = new Date();
    if (billingCycle === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    return {
      success: true,
      subscriptionTier: planId,
      billingCycle,
      status: 'active',
      nextBillingDate: endDate
    };
  }

  /**
   * Get user's payment methods
   */
  async getUserPaymentMethods(userId: number) {
    const user = await storage.getUser(userId);
    if (!user?.stripeCustomerId) {
      return [];
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: 'card'
    });

    return paymentMethods.data.map(pm => ({
      id: pm.id,
      type: pm.type,
      card: pm.card ? {
        brand: pm.card.brand,
        last4: pm.card.last4,
        exp_month: pm.card.exp_month,
        exp_year: pm.card.exp_year
      } : null
    }));
  }

  /**
   * Delete a payment method
   */
  async deletePaymentMethod(paymentMethodId: string) {
    await stripe.paymentMethods.detach(paymentMethodId);
    return { success: true };
  }

  /**
   * Handle webhook events from Stripe
   */
  async handleWebhookEvent(event: Stripe.Event) {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        if (paymentIntent.metadata.type === 'subscription') {
          await this.confirmSubscriptionPayment(paymentIntent.id);
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        console.error('Payment failed:', failedPayment.id, failedPayment.last_payment_error);
        break;

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        // Handle subscription updates if using Stripe subscriptions
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  /**
   * Create a one-time payment intent for consultations or services
   */
  async createOneTimePaymentIntent(
    userId: number,
    amount: number,
    description: string,
    currency: string = 'usd'
  ) {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
      });
      
      customerId = customer.id;
      await storage.updateStripeCustomerId(user.id, customerId);
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      customer: customerId,
      payment_method_types: [
        'card',
        'bancontact',
        'eps',
        'giropay',
        'ideal',
        'p24',
        'sepa_debit',
        'sofort'
      ],
      metadata: {
        userId: user.id.toString(),
        type: 'one_time'
      },
      description
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount,
      currency
    };
  }
}

export const paymentService = new PaymentService();