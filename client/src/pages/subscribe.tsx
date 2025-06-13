import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { EnhancedPaymentForm } from "@/components/payment/enhanced-payment-form";

let stripePromise: Promise<any> | null = null;

try {
  if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
    console.error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
    stripePromise = null;
  } else {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
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
        {plans.map((plan) => (
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

export default function Subscribe() {
  const [currentStep, setCurrentStep] = useState<'selection' | 'payment'>('selection');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [currency, setCurrency] = useState<'USD' | 'AED'>('USD');
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Check if user is authenticated
  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access subscription plans.",
        variant: "destructive",
      });
      setLocation('/login');
    }
  }, [user, setLocation, toast]);

  if (!user) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!stripePromise) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>
            Payment system is currently unavailable. Please contact support.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handlePlanSelect = (plan: SubscriptionPlan, billing: 'monthly' | 'yearly', selectedCurrency: 'USD' | 'AED') => {
    setSelectedPlan(plan);
    setBillingCycle(billing);
    setCurrency(selectedCurrency);
    setCurrentStep('payment');
  };

  const handlePaymentSuccess = () => {
    toast({
      title: "Welcome to your new plan!",
      description: "Your subscription has been activated successfully.",
    });
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: "Payment Failed",
      description: error,
      variant: "destructive",
    });
  };

  const handleBackToPlans = () => {
    setCurrentStep('selection');
    setSelectedPlan(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {currentStep === 'selection' ? (
          <PlanSelectionStep onPlanSelect={handlePlanSelect} />
        ) : (
          selectedPlan && (
            <PaymentStep
              selectedPlan={selectedPlan}
              billingCycle={billingCycle}
              currency={currency}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              onBack={handleBackToPlans}
            />
          )
        )}
      </div>
    </div>
  );
}