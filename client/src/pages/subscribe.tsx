import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Elements } from '@stripe/react-stripe-js';
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
  ArrowLeft,
  Star,
  Zap
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/lib/i18n";
import { EnhancedPaymentForm } from "@/components/payment/enhanced-payment-form";

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

// Updated plan mapping to match backend service
const PLAN_MAPPING = {
  'Starter': 'basic',
  'Professional': 'professional', 
  'Enterprise': 'enterprise'
};

interface PaymentStepProps {
  selectedPlan: SubscriptionPlan;
  billingCycle: 'monthly' | 'yearly';
  currency: 'USD' | 'AED';
  onSuccess: () => void;
  onError: (error: string) => void;
  onBack: () => void;
}

const PaymentStep = ({ selectedPlan, billingCycle, currency, onSuccess, onError, onBack }: PaymentStepProps) => {
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const initializePayment = async () => {
      try {
        setIsLoading(true);
        const planId = PLAN_MAPPING[selectedPlan.name as keyof typeof PLAN_MAPPING] || 'basic';
        
        const response = await apiRequest("POST", "/api/create-subscription", {
          planId,
          billingCycle,
          currency: currency.toLowerCase()
        });
        
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to initialize payment. Please try again.",
          variant: "destructive",
        });
        onError(error.message || "Failed to initialize payment");
      } finally {
        setIsLoading(false);
      }
    };

    initializePayment();
  }, [selectedPlan, billingCycle, currency, toast, onError]);

  const handlePaymentSuccess = (result: any) => {
    toast({
      title: "Subscription Activated!",
      description: "Welcome to your new plan. Redirecting to dashboard...",
    });
    
    setTimeout(() => {
      setLocation('/professional-dashboard');
    }, 2000);
    
    onSuccess();
  };

  const getPrice = () => {
    if (currency === 'USD') {
      return billingCycle === 'monthly' ? selectedPlan.priceMonthlyUSD : selectedPlan.priceYearlyUSD;
    } else {
      return billingCycle === 'monthly' ? selectedPlan.priceMonthlyAED : selectedPlan.priceYearlyAED;
    }
  };

  const amount = getPrice() / 100; // Convert from cents to dollars

  if (isLoading || !clientSecret) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p>Initializing secure payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Plans
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Complete Your Subscription</h2>
          <p className="text-gray-600">Secure payment powered by Stripe</p>
        </div>
      </div>

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
        <EnhancedPaymentForm
          planId={PLAN_MAPPING[selectedPlan.name as keyof typeof PLAN_MAPPING] || 'basic'}
          billingCycle={billingCycle}
          amount={amount}
          currency={currency.toLowerCase()}
          onSuccess={handlePaymentSuccess}
          onError={onError}
        />
      </Elements>
    </div>
  );
};

const PlanSelectionStep = ({ onPlanSelect }: { onPlanSelect: (plan: SubscriptionPlan, billing: 'monthly' | 'yearly', currency: 'USD' | 'AED') => void }) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'AED'>('USD');
  const { toast } = useToast();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await apiRequest("GET", "/api/subscription-plans");
        const data = await response.json();
        setPlans(data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load subscription plans",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, [toast]);

  const getPrice = (plan: SubscriptionPlan, billing: 'monthly' | 'yearly', currency: 'USD' | 'AED') => {
    if (currency === 'USD') {
      return billing === 'monthly' ? plan.priceMonthlyUSD : plan.priceYearlyUSD;
    } else {
      return billing === 'monthly' ? plan.priceMonthlyAED : plan.priceYearlyAED;
    }
  };

  const formatPrice = (priceInCents: number, currency: 'USD' | 'AED') => {
    if (currency === 'USD') {
      return `$${(priceInCents / 100).toFixed(2)}`;
    } else {
      return `${(priceInCents / 100).toFixed(2)} AED`;
    }
  };

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
        <p className="text-xl text-gray-600 mb-8">
          Unlock your potential with our professional development platform
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 p-1 rounded-lg flex">
          <button
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              selectedBilling === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setSelectedBilling('monthly')}
          >
            Monthly
          </button>
          <button
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              selectedBilling === 'yearly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setSelectedBilling('yearly')}
          >
            Yearly
            <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-100">
              Save 17%
            </Badge>
          </button>
        </div>
      </div>

      {/* Currency Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 p-1 rounded-lg flex">
          <button
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              selectedCurrency === 'USD'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setSelectedCurrency('USD')}
          >
            USD ($)
          </button>
          <button
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              selectedCurrency === 'AED'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setSelectedCurrency('AED')}
          >
            AED (د.إ)
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan, index) => (
          <Card 
            key={plan.id} 
            className={`relative ${
              plan.name === 'Professional' 
                ? 'border-blue-500 shadow-lg scale-105' 
                : 'border-gray-200'
            }`}
          >
            {plan.name === 'Professional' && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-500 text-white px-4 py-1">
                  <Star className="h-4 w-4 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription className="text-gray-600 min-h-[3rem]">
                {plan.description}
              </CardDescription>
              <div className="pt-4">
                <div className="text-4xl font-bold text-gray-900">
                  {formatPrice(getPrice(plan, selectedBilling, selectedCurrency), selectedCurrency)}
                </div>
                <div className="text-gray-600">
                  per {selectedBilling === 'monthly' ? 'month' : 'year'}
                </div>
                {selectedBilling === 'yearly' && (
                  <div className="text-sm text-green-600 font-medium">
                    Save {formatPrice(
                      (getPrice(plan, 'monthly', selectedCurrency) * 12) - getPrice(plan, 'yearly', selectedCurrency), 
                      selectedCurrency
                    )} annually
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-3">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
              
              <Button
                className={`w-full h-12 ${
                  plan.name === 'Professional'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-900 hover:bg-gray-800'
                }`}
                onClick={() => onPlanSelect(plan, selectedBilling, selectedCurrency)}
              >
                {plan.name === 'Professional' && <Zap className="h-4 w-4 mr-2" />}
                Get Started
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trust Signals */}
      <div className="text-center pt-8">
        <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Secure Payment</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span>Multiple Payment Methods</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span>Cancel Anytime</span>
          </div>
        </div>
      </div>
    </div>
  );
};
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