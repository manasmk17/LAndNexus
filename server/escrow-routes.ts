import { Express } from 'express';
import Stripe from 'stripe';
import { db } from './db';
import { users, escrowTransactions, transactionHistory } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

const isAuthenticated = (req: any, res: any, next: any) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
};

export function registerEscrowRoutes(app: Express) {
  
  // Create Stripe Connect account for trainers
  app.post('/api/payments/connect-account', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await db!.select().from(users).where(eq(users.id, userId)).limit(1);
      
      if (!user[0]) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user[0].stripeConnectAccountId) {
        return res.status(400).json({ message: 'Connect account already exists' });
      }

      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: user[0].email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
      });

      // Update user with Stripe Connect account ID
      await db!.update(users)
        .set({ stripeConnectAccountId: account.id })
        .where(eq(users.id, userId));

      // Create account link for onboarding
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/professional-dashboard?setup=refresh`,
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/professional-dashboard?setup=complete`,
        type: 'account_onboarding',
      });

      res.json({ 
        accountId: account.id,
        accountLink: accountLink.url 
      });
    } catch (error) {
      console.error('Error creating connect account:', error);
      res.status(500).json({ message: 'Failed to create connect account' });
    }
  });

  // Get Connect account status
  app.get('/api/payments/connect-status', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await db!.select().from(users).where(eq(users.id, userId)).limit(1);
      
      if (!user[0] || !user[0].stripeConnectAccountId) {
        return res.json({ hasAccount: false, isComplete: false });
      }

      const account = await stripe.accounts.retrieve(user[0].stripeConnectAccountId);
      
      res.json({
        hasAccount: true,
        isComplete: account.details_submitted && account.charges_enabled,
        accountId: account.id,
        payoutsEnabled: account.payouts_enabled
      });
    } catch (error) {
      console.error('Error checking connect status:', error);
      res.status(500).json({ message: 'Failed to check account status' });
    }
  });

  // Create escrow payment for a booking/job
  app.post('/api/payments/create-escrow', isAuthenticated, async (req, res) => {
    try {
      const { trainerId, amount, currency = 'USD', jobPostingId, bookingId, description } = req.body;
      const companyId = req.user.id;

      if (!trainerId || !amount) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Get trainer's connect account
      const trainer = await db!.select().from(users).where(eq(users.id, trainerId)).limit(1);
      
      if (!trainer[0] || !trainer[0].stripeConnectAccountId) {
        return res.status(400).json({ message: 'Trainer must set up payout account first' });
      }

      // Calculate commission (8% platform fee)
      const platformCommissionRate = 800; // 8% in basis points
      const platformCommissionAmount = Math.round((amount * platformCommissionRate) / 10000);
      const trainerPayoutAmount = amount - platformCommissionAmount;

      // Create transfer group for this transaction
      const transferGroupId = `escrow_${Date.now()}_${companyId}_${trainerId}`;

      // Create payment intent with application fee
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: currency.toLowerCase(),
        application_fee_amount: platformCommissionAmount,
        transfer_data: {
          destination: trainer[0].stripeConnectAccountId,
        },
        transfer_group: transferGroupId,
        metadata: {
          companyId: companyId.toString(),
          trainerId: trainerId.toString(),
          jobPostingId: jobPostingId?.toString() || '',
          bookingId: bookingId?.toString() || '',
          type: 'escrow_transaction'
        }
      });

      // Create escrow transaction record
      const escrowTransaction = await db!.insert(escrowTransactions)
        .values({
          companyId,
          trainerId,
          jobPostingId,
          bookingId,
          amount,
          currency,
          platformCommissionAmount,
          trainerPayoutAmount,
          stripePaymentIntentId: paymentIntent.id,
          stripeTransferGroupId: transferGroupId,
          status: 'pending',
          description,
          escrowReleaseDate: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)), // 7 days from now
        })
        .returning();

      // Record transaction history
      await db!.insert(transactionHistory)
        .values({
          escrowTransactionId: escrowTransaction[0].id,
          action: 'created',
          previousStatus: null,
          newStatus: 'pending',
          actionBy: companyId,
        });

      res.json({
        escrowTransactionId: escrowTransaction[0].id,
        clientSecret: paymentIntent.client_secret,
        amount,
        platformCommission: platformCommissionAmount,
        trainerPayout: trainerPayoutAmount
      });
    } catch (error) {
      console.error('Error creating escrow transaction:', error);
      res.status(500).json({ message: 'Failed to create escrow transaction' });
    }
  });

  // Confirm payment and move to escrow
  app.post('/api/payments/confirm-escrow/:transactionId', isAuthenticated, async (req, res) => {
    try {
      const transactionId = parseInt(req.params.transactionId);
      
      const transaction = await db!.select()
        .from(escrowTransactions)
        .where(eq(escrowTransactions.id, transactionId))
        .limit(1);

      if (!transaction[0]) {
        return res.status(404).json({ message: 'Transaction not found' });
      }

      // Check payment intent status
      const paymentIntent = await stripe.paymentIntents.retrieve(transaction[0].stripePaymentIntentId!);

      if (paymentIntent.status === 'succeeded') {
        // Update transaction status to in escrow
        await db!.update(escrowTransactions)
          .set({ 
            status: 'in_escrow',
            updatedAt: new Date()
          })
          .where(eq(escrowTransactions.id, transactionId));

        // Record history
        await db!.insert(transactionHistory)
          .values({
            escrowTransactionId: transactionId,
            action: 'funds_captured',
            previousStatus: 'pending',
            newStatus: 'in_escrow',
            actionBy: transaction[0].companyId,
          });

        res.json({ success: true, status: 'in_escrow' });
      } else {
        // Update to payment failed
        await db!.update(escrowTransactions)
          .set({ 
            status: 'payment_failed',
            updatedAt: new Date()
          })
          .where(eq(escrowTransactions.id, transactionId));

        res.json({ success: false, status: 'payment_failed' });
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      res.status(500).json({ message: 'Failed to confirm payment' });
    }
  });

  // Release funds from escrow
  app.post('/api/payments/release-funds/:transactionId', isAuthenticated, async (req, res) => {
    try {
      const transactionId = parseInt(req.params.transactionId);
      const { reason } = req.body;
      
      const transaction = await db!.select()
        .from(escrowTransactions)
        .where(eq(escrowTransactions.id, transactionId))
        .limit(1);

      if (!transaction[0]) {
        return res.status(404).json({ message: 'Transaction not found' });
      }

      if (transaction[0].status !== 'in_escrow') {
        return res.status(400).json({ message: 'Transaction is not in escrow status' });
      }

      // Check if user is authorized (company who paid or admin)
      if (transaction[0].companyId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: 'Not authorized to release funds' });
      }

      // Update transaction status to released
      await db!.update(escrowTransactions)
        .set({ 
          status: 'released',
          serviceCompletionConfirmed: true,
          serviceCompletionDate: new Date(),
          updatedAt: new Date()
        })
        .where(eq(escrowTransactions.id, transactionId));

      // Record history
      await db!.insert(transactionHistory)
        .values({
          escrowTransactionId: transactionId,
          action: 'released',
          previousStatus: 'in_escrow',
          newStatus: 'released',
          actionBy: req.user.id,
          actionReason: reason,
        });

      res.json({ success: true, status: 'released' });
    } catch (error) {
      console.error('Error releasing funds:', error);
      res.status(500).json({ message: 'Failed to release funds' });
    }
  });

  // Request refund
  app.post('/api/payments/request-refund/:transactionId', isAuthenticated, async (req, res) => {
    try {
      const transactionId = parseInt(req.params.transactionId);
      const { reason } = req.body;
      
      const transaction = await db!.select()
        .from(escrowTransactions)
        .where(eq(escrowTransactions.id, transactionId))
        .limit(1);

      if (!transaction[0]) {
        return res.status(404).json({ message: 'Transaction not found' });
      }

      if (!['in_escrow', 'released'].includes(transaction[0].status)) {
        return res.status(400).json({ message: 'Cannot refund transaction in current status' });
      }

      // Create refund in Stripe
      const refund = await stripe.refunds.create({
        payment_intent: transaction[0].stripePaymentIntentId!,
        reason: 'requested_by_customer',
        metadata: {
          escrowTransactionId: transactionId.toString(),
          requestedBy: req.user.id.toString(),
          reason: reason
        }
      });

      // Update transaction status
      await db!.update(escrowTransactions)
        .set({ 
          status: 'refunded',
          disputeReason: reason,
          updatedAt: new Date()
        })
        .where(eq(escrowTransactions.id, transactionId));

      // Record history
      await db!.insert(transactionHistory)
        .values({
          escrowTransactionId: transactionId,
          action: 'refunded',
          previousStatus: transaction[0].status,
          newStatus: 'refunded',
          actionBy: req.user.id,
          actionReason: reason,
        });

      res.json({ success: true, refundId: refund.id });
    } catch (error) {
      console.error('Error processing refund:', error);
      res.status(500).json({ message: 'Failed to process refund' });
    }
  });

  // Get user's transactions
  app.get('/api/payments/transactions', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Get transactions where user is either company or trainer
      const transactions = await db!.select()
        .from(escrowTransactions)
        .where(
          and(
            // User is either the company or trainer
            // Note: This is a simplified query - in production you'd use OR
          )
        )
        .orderBy(desc(escrowTransactions.createdAt));

      // Filter transactions in JavaScript since OR is complex in this setup
      const userTransactions = transactions.filter(tx => 
        tx.companyId === userId || tx.trainerId === userId
      );

      res.json(userTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ message: 'Failed to fetch transactions' });
    }
  });

  // Get transaction details with history
  app.get('/api/payments/transactions/:transactionId', isAuthenticated, async (req, res) => {
    try {
      const transactionId = parseInt(req.params.transactionId);
      
      const transaction = await db!.select()
        .from(escrowTransactions)
        .where(eq(escrowTransactions.id, transactionId))
        .limit(1);

      if (!transaction[0]) {
        return res.status(404).json({ message: 'Transaction not found' });
      }

      // Check if user has access to this transaction
      if (transaction[0].companyId !== req.user.id && 
          transaction[0].trainerId !== req.user.id && 
          !req.user.isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Get transaction history
      const history = await db!.select()
        .from(transactionHistory)
        .where(eq(transactionHistory.escrowTransactionId, transactionId))
        .orderBy(desc(transactionHistory.createdAt));

      res.json({
        transaction: transaction[0],
        history
      });
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      res.status(500).json({ message: 'Failed to fetch transaction details' });
    }
  });
}