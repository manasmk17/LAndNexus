import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Check, 
  CreditCard, 
  Shield, 
  Lock,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/lib/i18n";

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

interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  features: string[];
  priceMonthlyUSD: number;
  priceYearlyUSD: number;
  priceMonthlyAED: number;
  priceYearlyAED: number;
}

const CheckoutForm = ({ 
  plan, 
  billingCycle, 
  currency,
  onSuccess,
  onError 
}: { 
  plan: SubscriptionPlan;
  billingCycle: 'monthly' | 'yearly';
  currency: 'USD' | 'AED';
  onSuccess: () => void;
  onError: (error: string) => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
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
      });

      if (error) {
        onError(error.message || 'Payment failed');
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        onSuccess();
        toast({
          title: "Payment Successful",
          description: "Your subscription has been activated!",
        });
      }
    } catch (error: any) {
      onError(error.message || 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const getPrice = () => {
    if (currency === 'USD') {
      return billingCycle === 'monthly' ? plan.priceMonthlyUSD : plan.priceYearlyUSD;
    } else {
      return billingCycle === 'monthly' ? plan.priceMonthlyAED : plan.priceYearlyAED;
    }
  };

  const formatPrice = (priceInCents: number) => {
    if (currency === 'USD') {
      return `$${(priceInCents / 100).toFixed(2)}`;
    } else {
      return `${(priceInCents / 100).toFixed(2)} AED`;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Order Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span>{plan.name} Plan ({billingCycle})</span>
            <span className="font-semibold">{formatPrice(getPrice())}</span>
          </div>
          {billingCycle === 'yearly' && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Annual discount</span>
              <span>Save 17%</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>{formatPrice(getPrice())}</span>
          </div>
        </div>
      </div>

      {/* Payment Form */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <Lock className="h-4 w-4" />
          <span>Your payment information is encrypted and secure</span>
        </div>

        <PaymentElement
          options={{
            layout: "tabs"
          }}
        />
      </div>

      {/* Submit Button */}
      <Button 
        type="submit" 
        className="w-full bg-blue-600 hover:bg-blue-700"
        disabled={!stripe || !elements || isProcessing}
      >
        {isProcessing ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing Payment...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Subscribe Now - {formatPrice(getPrice())}
          </div>
        )}
      </Button>

      {/* Security Notice */}
      <div className="text-xs text-gray-500 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield className="h-4 w-4" />
          <span>Secured by Stripe</span>
        </div>
        <p>
          Your payment is processed securely. We never store your credit card information.
        </p>
      </div>
    </form>
  );
};

export default function Subscribe() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [clientSecret, setClientSecret] = useState("");
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [currency, setCurrency] = useState<'USD' | 'AED'>('USD');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const planId = urlParams.get('planId');
    const billing = urlParams.get('billing') as 'monthly' | 'yearly' || 'monthly';
    const curr = urlParams.get('currency') as 'USD' | 'AED' || 'USD';

    if (!planId) {
      setLocation('/subscription-plans');
      return;
    }

    setBillingCycle(billing);
    setCurrency(curr);

    // Redirect to login if not authenticated
    if (!user) {
      setLocation(`/login?redirect=/subscribe?planId=${planId}&billing=${billing}&currency=${curr}`);
      return;
    }

    initializeSubscription(parseInt(planId), billing, curr);
  }, [user, setLocation]);

  const initializeSubscription = async (planId: number, billing: 'monthly' | 'yearly', curr: 'USD' | 'AED') => {
    try {
      setIsLoading(true);
      
      // Get plan details
      const plansResponse = await apiRequest("GET", "/api/subscription-plans");
      const plans = await plansResponse.json();
      const selectedPlan = plans.find((p: SubscriptionPlan) => p.id === planId);
      
      if (!selectedPlan) {
        throw new Error('Plan not found');
      }
      
      setPlan(selectedPlan);

      // Create subscription
      const subscriptionResponse = await apiRequest("POST", "/api/create-subscription", {
        planId,
        billingCycle: billing,
        currency: curr
      });

      if (!subscriptionResponse.ok) {
        const errorData = await subscriptionResponse.json();
        throw new Error(errorData.message || 'Failed to create subscription');
      }

      const data = await subscriptionResponse.json();
      setClientSecret(data.clientSecret);
    } catch (error: any) {
      console.error('Error initializing subscription:', error);
      setError(error.message);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setLocation('/subscription-success');
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Setting up your subscription...</p>
        </div>
      </div>
    );
  }

  if (error || !plan || !clientSecret) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>
              {error || 'Unable to load subscription details. Please try again.'}
            </AlertDescription>
          </Alert>
          
          <div className="text-center">
            <Button onClick={() => setLocation('/subscription-plans')} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Plans
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Button 
            variant="outline" 
            onClick={() => setLocation('/subscription-plans')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Plans
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your Subscription
          </h1>
          <p className="text-gray-600">
            You're one step away from unlocking your professional potential
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Plan Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{plan.name} Plan</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">What's included:</h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Billing Cycle:</span>
                    <Badge variant="secondary">{billingCycle}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Currency:</span>
                    <Badge variant="secondary">{currency}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Payment Details</CardTitle>
              <CardDescription>
                Enter your payment information to complete your subscription
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Elements 
                stripe={stripePromise} 
                options={{ 
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#2563eb',
                    }
                  }
                }}
              >
                <CheckoutForm
                  plan={plan}
                  billingCycle={billingCycle}
                  currency={currency}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </Elements>
            </CardContent>
          </Card>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 text-center">
          <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>SSL Encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span>PCI Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span>Secure Payments</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Your subscription will renew automatically. Cancel anytime from your dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}