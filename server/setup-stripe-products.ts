import Stripe from "stripe";
import { db } from "./db";
import { subscriptionPlans } from "@shared/schema";
import { eq } from "drizzle-orm";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
});

export async function setupStripeProducts() {
  const database = await db;
  if (!database) {
    throw new Error('Database not initialized');
  }

  const plans = await database.select().from(subscriptionPlans);

  for (const plan of plans) {
    try {
      // Create Stripe product
      const product = await stripe.products.create({
        name: `L&D Nexus ${plan.name}`,
        description: plan.description,
        metadata: {
          planId: plan.id.toString(),
          planName: plan.name
        }
      });

      // Create monthly price
      const monthlyPriceUSD = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.priceMonthlyUSD,
        currency: 'usd',
        recurring: {
          interval: 'month'
        },
        metadata: {
          planId: plan.id.toString(),
          billing: 'monthly',
          currency: 'USD'
        }
      });

      // Create yearly price
      const yearlyPriceUSD = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.priceYearlyUSD,
        currency: 'usd',
        recurring: {
          interval: 'year'
        },
        metadata: {
          planId: plan.id.toString(),
          billing: 'yearly',
          currency: 'USD'
        }
      });

      // Create monthly price in AED
      const monthlyPriceAED = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.priceMonthlyAED,
        currency: 'aed',
        recurring: {
          interval: 'month'
        },
        metadata: {
          planId: plan.id.toString(),
          billing: 'monthly',
          currency: 'AED'
        }
      });

      // Create yearly price in AED
      const yearlyPriceAED = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.priceYearlyAED,
        currency: 'aed',
        recurring: {
          interval: 'year'
        },
        metadata: {
          planId: plan.id.toString(),
          billing: 'yearly',
          currency: 'AED'
        }
      });

      // Update database with Stripe price IDs
      await database.update(subscriptionPlans)
        .set({
          stripePriceIdMonthlyUSD: monthlyPriceUSD.id,
          stripePriceIdYearlyUSD: yearlyPriceUSD.id,
          stripePriceIdMonthlyAED: monthlyPriceAED.id,
          stripePriceIdYearlyAED: yearlyPriceAED.id
        })
        .where(eq(subscriptionPlans.id, plan.id));

      console.log(`✅ Created Stripe products and prices for plan: ${plan.name}`);
      console.log(`   Product ID: ${product.id}`);
      console.log(`   Monthly USD: ${monthlyPriceUSD.id}`);
      console.log(`   Yearly USD: ${yearlyPriceUSD.id}`);
      console.log(`   Monthly AED: ${monthlyPriceAED.id}`);
      console.log(`   Yearly AED: ${yearlyPriceAED.id}`);

    } catch (error) {
      console.error(`❌ Failed to create Stripe products for plan ${plan.name}:`, error);
    }
  }
}

// Export for manual execution
export default setupStripeProducts;