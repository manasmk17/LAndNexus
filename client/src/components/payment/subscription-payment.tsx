
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
import { CreditCard, Shield, Star, CheckCircle } from "lucide-react";

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

interface SubscriptionPaymentProps {
  planId: number;
  planName: string;
  planPrice: number;
  planFeatures: string[];
  billingCycle: 'monthly' | 'yearly';
  currency: 'USD' | 'AED';
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SubscriptionPayment({
  planId,
  planName,
  planPrice,
  planFeatures,
  billingCycle,
  currency,
  onSuccess,
  onCancel
}: SubscriptionPaymentProps) {
  const { t, i18n } = useTranslation();
  const [clientSecret, setClientSecret] = useState<string>("");
  const [subscriptionId, setSubscriptionId] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const createSubscription = async () => {
    setIsCreating(true);
    try {
      const response = await apiRequest("POST", "/api/setup-subscription", {
        planId,
        billingCycle,
        currency
      });

      if (response.ok) {
        const data = await response.json();
        setClientSecret(data.clientSecret);
        setSubscriptionId(data.subscriptionId);
        setShowPaymentForm(true);
      } else {
        throw new Error('Failed to create subscription');
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const formatPrice = (priceInCents: number, currency: 'USD' | 'AED') => {
    if (currency === 'USD') {
      return `$${(priceInCents / 100).toFixed(0)}`;
    } else {
      return `${(priceInCents / 100).toFixed(0)} AED`;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-blue-200 shadow-lg">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <CreditCard className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">{planName} Subscription</CardTitle>
          <CardDescription>
            Secure payment with Stripe - Industry standard encryption
          </CardDescription>
          
          <div className="mt-6">
            <div className="flex items-baseline justify-center">
              <span className="text-4xl font-bold text-gray-900">
                {formatPrice(planPrice, currency)}
              </span>
              <span className="text-gray-500 ml-1">
                /{billingCycle === 'yearly' ? 'year' : 'month'}
              </span>
            </div>
            
            {billingCycle === 'yearly' && (
              <Badge variant="secondary" className="mt-2 bg-green-100 text-green-800">
                Save 17% annually
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Plan Features */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">What's included:</h4>
            <ul className="space-y-2">
              {planFeatures.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <Separator />

          {/* Security Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800">Secure Payment</span>
            </div>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• SSL encrypted payment processing</li>
              <li>• Cancel anytime from your dashboard</li>
              <li>• 14-day money-back guarantee</li>
              <li>• Automatic billing renewal</li>
            </ul>
          </div>

          {/* Payment Button */}
          <div className="flex gap-3">
            <Button
              onClick={createSubscription}
              disabled={isCreating}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Setting up...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Subscribe with Card
                </>
              )}
            </Button>
            {onCancel && (
              <Button variant="outline" onClick={onCancel} size="lg">
                Cancel
              </Button>
            )}
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              <span>256-bit SSL</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              <span>PCI Compliant</span>
            </div>
            <div className="flex items-center gap-1">
              <CreditCard className="h-3 w-3" />
              <span>Stripe Secure</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Form Modal */}
      <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Your Subscription</DialogTitle>
            <DialogDescription>
              Enter your payment details to activate your {planName} subscription
            </DialogDescription>
          </DialogHeader>
          
          {clientSecret && (
            <Elements 
              stripe={stripePromise} 
              options={{ 
                clientSecret,
                appearance: { 
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#2563eb',
                    colorBackground: '#ffffff',
                    colorText: '#1f2937',
                    fontFamily: 'ui-sans-serif, system-ui, sans-serif'
                  }
                }
              }}
            >
              <SubscriptionPaymentForm 
                subscriptionId={subscriptionId}
                planName={planName}
                price={formatPrice(planPrice, currency)}
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

function SubscriptionPaymentForm({ 
  subscriptionId, 
  planName, 
  price, 
  onSuccess, 
  onCancel 
}: { 
  subscriptionId: string;
  planName: string;
  price: string;
  onSuccess: () => void; 
  onCancel: () => void;
}) {
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
          return_url: `${window.location.origin}/subscription-success`,
        },
        redirect: 'if_required'
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Subscription Activated!",
          description: `Welcome to ${planName}! Your subscription is now active.`,
        });
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Payment Error",
        description: "There was an issue processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Order Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Order Summary</h4>
        <div className="flex justify-between">
          <span className="text-gray-600">{planName} Subscription</span>
          <span className="font-medium">{price}</span>
        </div>
      </div>

      {/* Payment Element */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Payment Details
        </label>
        <PaymentElement />
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Subscribe {price}
            </>
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      {/* Security Notice */}
      <p className="text-xs text-gray-500 text-center">
        Your payment information is secure and encrypted. We never store your card details.
      </p>
    </form>
  );
}
