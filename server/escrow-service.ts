import Stripe from 'stripe';
import { db, initializeDatabase } from './db';
import { users, escrowTransactions, transactionHistory, paymentMethods } from '@shared/schema';
import { eq, and, lt } from 'drizzle-orm';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
});

export class EscrowService {
  
  private async getDb() {
    if (!db) {
      await initializeDatabase();
    }
    if (!db) {
      throw new Error('Database connection not available');
    }
    return db;
  }
  
  // Create Stripe Connect account for trainers to receive payouts
  async createConnectAccount(userId: number, email: string, country: string = 'US') {
    try {
      const account = await stripe.accounts.create({
        type: 'express',
        country: country,
        email: email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        settings: {
          payouts: {
            schedule: {
              interval: 'weekly',
              weekly_anchor: 'friday'
            }
          }
        }
      });

      // Update user with Stripe Connect account ID
      await db.update(users)
        .set({ stripeConnectAccountId: account.id })
        .where(eq(users.id, userId));

      return account;
    } catch (error) {
      console.error('Error creating Stripe Connect account:', error);
      throw new Error('Failed to create payout account');
    }
  }

  // Create account link for Connect account setup
  async createAccountLink(accountId: string, userId: number) {
    try {
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${process.env.FRONTEND_URL}/professional-dashboard?setup=refresh`,
        return_url: `${process.env.FRONTEND_URL}/professional-dashboard?setup=complete`,
        type: 'account_onboarding',
      });

      return accountLink;
    } catch (error) {
      console.error('Error creating account link:', error);
      throw new Error('Failed to create account setup link');
    }
  }

  // Calculate platform commission and trainer payout
  calculatePayoutAmounts(amount: number, commissionRate: number = 800) {
    const platformCommissionAmount = Math.round((amount * commissionRate) / 10000);
    const trainerPayoutAmount = amount - platformCommissionAmount;
    
    return {
      platformCommissionAmount,
      trainerPayoutAmount
    };
  }

  // Create escrow transaction with payment intent
  async createEscrowTransaction(data: {
    companyId: number;
    trainerId: number;
    amount: number;
    currency: string;
    jobPostingId?: number;
    bookingId?: number;
    description?: string;
    metadata?: any;
  }) {
    try {
      const { platformCommissionAmount, trainerPayoutAmount } = this.calculatePayoutAmounts(data.amount);

      // Get trainer's connect account
      const [trainer] = await db.select()
        .from(users)
        .where(eq(users.id, data.trainerId));

      if (!trainer.stripeConnectAccountId) {
        throw new Error('Trainer must set up payout account before receiving payments');
      }

      // Create transfer group for this transaction
      const transferGroupId = `escrow_${Date.now()}_${data.companyId}_${data.trainerId}`;

      // Create payment intent with application fee
      const paymentIntent = await stripe.paymentIntents.create({
        amount: data.amount,
        currency: data.currency.toLowerCase(),
        application_fee_amount: platformCommissionAmount,
        transfer_data: {
          destination: trainer.stripeConnectAccountId,
        },
        transfer_group: transferGroupId,
        metadata: {
          companyId: data.companyId.toString(),
          trainerId: data.trainerId.toString(),
          jobPostingId: data.jobPostingId?.toString() || '',
          bookingId: data.bookingId?.toString() || '',
          type: 'escrow_transaction'
        }
      });

      // Create escrow transaction record
      const [escrowTransaction] = await db.insert(escrowTransactions)
        .values({
          companyId: data.companyId,
          trainerId: data.trainerId,
          jobPostingId: data.jobPostingId,
          bookingId: data.bookingId,
          amount: data.amount,
          currency: data.currency,
          platformCommissionAmount,
          trainerPayoutAmount,
          stripePaymentIntentId: paymentIntent.id,
          stripeTransferGroupId: transferGroupId,
          status: 'pending',
          description: data.description,
          metadata: data.metadata,
          escrowReleaseDate: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)), // 7 days from now
        })
        .returning();

      // Record transaction history
      await this.recordTransactionHistory(escrowTransaction.id, 'created', null, 'pending', data.companyId);

      return {
        escrowTransaction,
        clientSecret: paymentIntent.client_secret
      };
    } catch (error) {
      console.error('Error creating escrow transaction:', error);
      throw new Error('Failed to create escrow transaction');
    }
  }

  // Confirm payment and capture funds into escrow
  async confirmPayment(escrowTransactionId: number) {
    try {
      const [transaction] = await db.select()
        .from(escrowTransactions)
        .where(eq(escrowTransactions.id, escrowTransactionId));

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Retrieve payment intent to check status
      const paymentIntent = await stripe.paymentIntents.retrieve(transaction.stripePaymentIntentId!);

      if (paymentIntent.status === 'succeeded') {
        // Update transaction status to funds captured
        await db.update(escrowTransactions)
          .set({ 
            status: 'in_escrow',
            updatedAt: new Date()
          })
          .where(eq(escrowTransactions.id, escrowTransactionId));

        await this.recordTransactionHistory(
          escrowTransactionId, 
          'funds_captured', 
          'pending', 
          'in_escrow',
          transaction.companyId
        );

        return { success: true, status: 'in_escrow' };
      } else {
        // Update status to payment failed
        await db.update(escrowTransactions)
          .set({ 
            status: 'payment_failed',
            updatedAt: new Date()
          })
          .where(eq(escrowTransactions.id, escrowTransactionId));

        await this.recordTransactionHistory(
          escrowTransactionId, 
          'payment_failed', 
          'pending', 
          'payment_failed',
          transaction.companyId
        );

        return { success: false, status: 'payment_failed' };
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw new Error('Failed to confirm payment');
    }
  }

  // Release funds from escrow to trainer
  async releaseFunds(escrowTransactionId: number, releasedBy: number, reason?: string) {
    try {
      const [transaction] = await db.select()
        .from(escrowTransactions)
        .where(eq(escrowTransactions.id, escrowTransactionId));

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.status !== 'in_escrow') {
        throw new Error('Transaction is not in escrow status');
      }

      // The funds are automatically transferred to the trainer's account
      // when the payment intent succeeds due to transfer_data configuration
      // We just need to update our records
      
      await db.update(escrowTransactions)
        .set({ 
          status: 'released',
          serviceCompletionConfirmed: true,
          serviceCompletionDate: new Date(),
          updatedAt: new Date()
        })
        .where(eq(escrowTransactions.id, escrowTransactionId));

      await this.recordTransactionHistory(
        escrowTransactionId, 
        'released', 
        'in_escrow', 
        'released',
        releasedBy,
        reason
      );

      return { success: true, status: 'released' };
    } catch (error) {
      console.error('Error releasing funds:', error);
      throw new Error('Failed to release funds');
    }
  }

  // Request refund from escrow
  async requestRefund(escrowTransactionId: number, requestedBy: number, reason: string) {
    try {
      const [transaction] = await db.select()
        .from(escrowTransactions)
        .where(eq(escrowTransactions.id, escrowTransactionId));

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (!['in_escrow', 'released'].includes(transaction.status)) {
        throw new Error('Cannot refund transaction in current status');
      }

      // Create refund in Stripe
      const refund = await stripe.refunds.create({
        payment_intent: transaction.stripePaymentIntentId!,
        reason: 'requested_by_customer',
        metadata: {
          escrowTransactionId: escrowTransactionId.toString(),
          requestedBy: requestedBy.toString(),
          reason: reason
        }
      });

      // Update transaction status
      await db.update(escrowTransactions)
        .set({ 
          status: 'refunded',
          disputeReason: reason,
          updatedAt: new Date()
        })
        .where(eq(escrowTransactions.id, escrowTransactionId));

      await this.recordTransactionHistory(
        escrowTransactionId, 
        'refunded', 
        transaction.status, 
        'refunded',
        requestedBy,
        reason
      );

      return { success: true, refundId: refund.id };
    } catch (error) {
      console.error('Error processing refund:', error);
      throw new Error('Failed to process refund');
    }
  }

  // Auto-release funds after specified period
  async autoReleaseFunds() {
    try {
      const overdueTransactions = await db.select()
        .from(escrowTransactions)
        .where(
          and(
            eq(escrowTransactions.status, 'in_escrow'),
            // SQL to check if escrowReleaseDate has passed would go here
          )
        );

      for (const transaction of overdueTransactions) {
        await this.releaseFunds(transaction.id, 0, 'Auto-released after escrow period');
      }

      return overdueTransactions.length;
    } catch (error) {
      console.error('Error in auto-release:', error);
      return 0;
    }
  }

  // Record transaction history for audit trail
  private async recordTransactionHistory(
    escrowTransactionId: number,
    action: string,
    previousStatus: string | null,
    newStatus: string,
    actionBy?: number,
    reason?: string
  ) {
    await db.insert(transactionHistory)
      .values({
        escrowTransactionId,
        action,
        previousStatus,
        newStatus,
        actionBy,
        actionReason: reason,
        metadata: { timestamp: new Date().toISOString() }
      });
  }

  // Get transaction details with history
  async getTransactionDetails(escrowTransactionId: number) {
    try {
      const [transaction] = await db.select()
        .from(escrowTransactions)
        .where(eq(escrowTransactions.id, escrowTransactionId));

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      const history = await db.select()
        .from(transactionHistory)
        .where(eq(transactionHistory.escrowTransactionId, escrowTransactionId));

      return {
        transaction,
        history
      };
    } catch (error) {
      console.error('Error getting transaction details:', error);
      throw new Error('Failed to get transaction details');
    }
  }

  // Get user's payment methods
  async getUserPaymentMethods(userId: number) {
    try {
      return await db.select()
        .from(paymentMethods)
        .where(eq(paymentMethods.userId, userId));
    } catch (error) {
      console.error('Error getting payment methods:', error);
      throw new Error('Failed to get payment methods');
    }
  }

  // Save payment method
  async savePaymentMethod(userId: number, paymentMethodId: string) {
    try {
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      
      await db.insert(paymentMethods)
        .values({
          userId,
          stripePaymentMethodId: paymentMethodId,
          type: paymentMethod.type,
          brand: paymentMethod.card?.brand,
          last4: paymentMethod.card?.last4,
          expiryMonth: paymentMethod.card?.exp_month,
          expiryYear: paymentMethod.card?.exp_year,
        });

      return { success: true };
    } catch (error) {
      console.error('Error saving payment method:', error);
      throw new Error('Failed to save payment method');
    }
  }
}

export const escrowService = new EscrowService();