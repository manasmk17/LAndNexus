import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/i18n";
import { Shield, Clock, DollarSign } from "lucide-react";

let stripePromise: Promise<any> | null = null;

try {
  if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
    console.error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
    stripePromise = null;
  } else {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY).catch(error => {
      console.error('Failed to load Stripe.js:', error);
      return null;
    });
  }
} catch (error) {
  console.error('Error initializing Stripe:', error);
  stripePromise = null;
}

interface EscrowPaymentProps {
  trainerId: number;
  amount: number;
  currency?: string;
  jobPostingId?: number;
  bookingId?: number;
  description?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EscrowPayment({
  trainerId,
  amount,
  currency = 'USD',
  jobPostingId,
  bookingId,
  description,
  onSuccess,
  onCancel
}: EscrowPaymentProps) {
  const { t, i18n } = useTranslation();
  const [clientSecret, setClientSecret] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const platformCommissionRate = 800; // 8%
  const platformCommission = Math.round((amount * platformCommissionRate) / 10000);
  const trainerPayout = amount - platformCommission;

  const createEscrowPayment = async () => {
    setIsCreating(true);
    try {
      const response = await apiRequest("POST", "/api/payments/create-escrow", {
        trainerId,
        amount,
        currency,
        jobPostingId,
        bookingId,
        description
      });

      if (response.ok) {
        const data = await response.json();
        setClientSecret(data.clientSecret);
        setShowPaymentForm(true);
      } else {
        throw new Error('Failed to create payment');
      }
    } catch (error) {
      console.error('Error creating escrow payment:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            {t("payment.escrowPayment")}
          </CardTitle>
          <CardDescription>
            {t("payment.escrowDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium">{t("payment.totalAmount")}:</span>
            <span className="text-2xl font-bold">
              {formatCurrency(amount / 100, i18n.language)}
            </span>
          </div>

          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>{t("payment.serviceAmount")}:</span>
              <span>{formatCurrency(amount / 100, i18n.language)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>{t("payment.platformFee")} (8%):</span>
              <span>-{formatCurrency(platformCommission / 100, i18n.language)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-medium">
              <span>{t("payment.trainerReceives")}:</span>
              <span>{formatCurrency(trainerPayout / 100, i18n.language)}</span>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-blue-800">
              <Clock className="h-4 w-4" />
              <span className="font-medium">{t("payment.escrowProtection")}</span>
            </div>
            <p className="text-sm text-blue-700">
              {t("payment.escrowExplanation")}
            </p>
            <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
              <li>{t("payment.escrowBenefit1")}</li>
              <li>{t("payment.escrowBenefit2")}</li>
              <li>{t("payment.escrowBenefit3")}</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={createEscrowPayment}
              disabled={isCreating}
              className="flex-1"
            >
              {isCreating ? t("common.loading") : t("payment.proceedToPayment")}
            </Button>
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                {t("common.cancel")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Form Modal */}
      <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("payment.completePayment")}</DialogTitle>
            <DialogDescription>
              {t("payment.securePaymentForm")}
            </DialogDescription>
          </DialogHeader>
          
          {clientSecret && (
            <Elements 
              stripe={stripePromise} 
              options={{ 
                clientSecret,
                appearance: { theme: 'stripe' }
              }}
            >
              <EscrowPaymentForm 
                onSuccess={() => {
                  setShowPaymentForm(false);
                  onSuccess?.();
                }}
                onCancel={() => setShowPaymentForm(false)}
              />
            </Elements>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EscrowPaymentForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: 'if_required'
      });

      if (error) {
        toast({
          title: t("payment.error"),
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: t("payment.success"),
          description: t("payment.paymentSuccessful"),
        });
        onSuccess();
      }
    } catch (error) {
      toast({
        title: t("payment.error"),
        description: t("payment.paymentFailed"),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1"
        >
          {isProcessing ? t("payment.processing") : t("payment.payNow")}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}

interface EscrowStatusProps {
  status: string;
  amount: number;
  currency: string;
  escrowReleaseDate?: string;
  onReleaseFunds?: () => void;
  onRequestRefund?: () => void;
}

export function EscrowStatus({
  status,
  amount,
  currency,
  escrowReleaseDate,
  onReleaseFunds,
  onRequestRefund
}: EscrowStatusProps) {
  const { t, i18n } = useTranslation();

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          color: 'bg-yellow-100 text-yellow-800',
          icon: Clock,
          message: t("payment.statusMessage.pending")
        };
      case 'in_escrow':
        return {
          color: 'bg-blue-100 text-blue-800',
          icon: Shield,
          message: t("payment.statusMessage.inEscrow")
        };
      case 'released':
        return {
          color: 'bg-green-100 text-green-800',
          icon: DollarSign,
          message: t("payment.statusMessage.released")
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          icon: Clock,
          message: t("payment.statusMessage.unknown")
        };
    }
  };

  const statusInfo = getStatusInfo(status);
  const StatusIcon = statusInfo.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <StatusIcon className="h-5 w-5" />
          {t("payment.escrowStatus")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span>{t("payment.amount")}:</span>
          <span className="text-lg font-bold">
            {formatCurrency(amount / 100, i18n.language)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span>{t("payment.status")}:</span>
          <Badge className={statusInfo.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {t(`payment.status.${status}`)}
          </Badge>
        </div>

        <p className="text-sm text-gray-600">{statusInfo.message}</p>

        {escrowReleaseDate && status === 'in_escrow' && (
          <p className="text-sm text-gray-600">
            {t("payment.autoReleaseDate")}: {new Date(escrowReleaseDate).toLocaleDateString(i18n.language)}
          </p>
        )}

        {status === 'in_escrow' && (
          <div className="flex gap-3">
            {onReleaseFunds && (
              <Button onClick={onReleaseFunds} size="sm">
                {t("payment.releaseFunds")}
              </Button>
            )}
            {onRequestRefund && (
              <Button variant="destructive" size="sm" onClick={onRequestRefund}>
                {t("payment.requestRefund")}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}