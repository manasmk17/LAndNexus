import { useEffect, useState } from 'react';
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useLocation, useRoute } from 'wouter';
import { getStripe, isStripeAvailable, formatCurrency, TEST_CARDS, SUBSCRIPTION_TIERS } from '@/lib/stripe-helpers';
import { Stripe } from '@stripe/stripe-js';
import { Loader2, LockIcon, CheckCircle, AlertCircle, CreditCard, CheckIcon, StarIcon, BadgeCheck } from 'lucide-react';

type Tier = {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
};

// Payment form component for subscription
const SubscribeForm = ({ 
  selectedTier, 
  onSubscriptionSuccess 
}: { 
  selectedTier: Tier,
  onSubscriptionSuccess: (paymentIntentId: string) => void
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast({
        title: "Payment System Error",
        description: "The payment system is not fully loaded. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      console.log("Processing payment for tier:", selectedTier.id);
      // Confirm the payment with Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // Add return URL for redirection after payment
          return_url: window.location.origin + '/subscription-success',
        },
        // Use if_required to handle 3D Secure without page reload if possible
        redirect: 'if_required'
      });

      if (error) {
        console.error("Payment confirmation error:", error);
        setPaymentStatus('error');
        toast({
          title: "Payment Failed",
          description: error.message || "Your payment could not be processed. Please try again.",
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded!
        console.log("Payment succeeded:", paymentIntent.id);
        setPaymentStatus('success');
        
        // Call the callback to update subscription in the parent component
        onSubscriptionSuccess(paymentIntent.id);
        
        toast({
          title: "Subscription Successful",
          description: `You are now subscribed to the ${selectedTier.name} plan!`,
        });
      } else {
        // Payment status is pending or requires further action
        console.log("Payment intent status:", paymentIntent?.status);
        toast({
          title: "Payment Status",
          description: `Payment status: ${paymentIntent?.status || 'unknown'}. Please check your payment method.`,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Payment submission error:", err);
      setPaymentStatus('error');
      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred during payment processing",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <PaymentElement />
        
        <div className="text-sm text-muted-foreground mt-4">
          <p className="flex items-center gap-1">
            <LockIcon className="h-3 w-3" />
            Your payment information is encrypted and secure
          </p>
        </div>
        
        {/* Test card info in development environment */}
        {import.meta.env.DEV && (
          <div className="text-sm p-3 bg-muted/50 rounded-md border">
            <p className="font-medium mb-1">Test Cards:</p>
            <ul className="space-y-1 text-xs">
              <li>Success: {TEST_CARDS.success}</li>
              <li>Requires Auth: {TEST_CARDS.requiresAuth}</li>
              <li>Declined: {TEST_CARDS.declined}</li>
              <li>Use any future date and any 3 digits for CVC</li>
            </ul>
          </div>
        )}
      </div>
      
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing || paymentStatus === 'success'}
        className="w-full"
        size="lg"
      >
        {isProcessing ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </span>
        ) : paymentStatus === 'success' ? (
          <span className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Subscription Successful
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Subscribe - {formatCurrency(selectedTier.price)}/month
          </span>
        )}
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState("");
  const [selectedTierId, setSelectedTierId] = useState("basic");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [match, params] = useRoute('/subscribe/:tierId');
  const [, navigate] = useLocation();
  
  // Stripe loading state
  const [stripeInstance, setStripeInstance] = useState<Stripe | null>(null);
  const [loadingStripe, setLoadingStripe] = useState(true);
  const [stripeError, setStripeError] = useState(false);
  
  // Get selected tier object
  const selectedTier = SUBSCRIPTION_TIERS.find(tier => tier.id === selectedTierId) || SUBSCRIPTION_TIERS[0];
  
  // Handle route parameters for preselected tier
  useEffect(() => {
    if (match && params.tierId && (params.tierId === 'basic' || params.tierId === 'premium')) {
      setSelectedTierId(params.tierId);
      // Store selected tier for cross-page reference
      localStorage.setItem('selectedSubscriptionTier', params.tierId);
    }
  }, [match, params]);

  // Load Stripe safely
  useEffect(() => {
    const loadStripeInstance = async () => {
      try {
        setLoadingStripe(true);
        setStripeError(false);
        
        // Debug: Log Stripe key availability
        const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
        console.log("Stripe key available:", !!stripeKey);
        if (stripeKey) {
          console.log("Stripe key format:", stripeKey.substring(0, 7) + "...");
        }
        
        // Check if Stripe is available
        if (!isStripeAvailable(true)) {
          console.log("Stripe public key not available - subscription functions disabled");
          setStripeError(true);
          toast({
            title: "Subscription System Unavailable",
            description: "The subscription system configuration is missing. Please try again later.",
            variant: "destructive",
          });
          return;
        }
        
        // Add the script to the page
        console.log("Attempting to load Stripe for subscription...");
        
        // Create script element for Stripe.js
        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        script.async = true;
        
        // When script loads, initialize Stripe instance
        script.onload = async () => {
          try {
            console.log("Stripe.js script loaded for subscription");
            if (window.Stripe) {
              const instance = window.Stripe(stripeKey);
              console.log("Stripe initialized successfully for subscription");
              setStripeInstance(instance);
            } else {
              console.error("Stripe.js loaded but Stripe constructor not available");
              setStripeError(true);
            }
          } catch (err) {
            console.error("Error initializing Stripe after script load:", err);
            setStripeError(true);
          } finally {
            setLoadingStripe(false);
          }
        };
        
        // Handle script loading errors
        script.onerror = () => {
          console.error("Failed to load Stripe.js script");
          setStripeError(true);
          setLoadingStripe(false);
          toast({
            title: "Subscription System Unavailable",
            description: "Failed to load payment system. Please check your internet connection and try again.",
            variant: "destructive",
          });
        };
        
        // Add script to document
        document.head.appendChild(script);
        
        // Cleanup for script if component unmounts before loading
        return () => {
          if (!script.onload) {
            document.head.removeChild(script);
          }
        };
      } catch (error) {
        console.error("Error during Stripe setup for subscription:", error);
        setStripeError(true);
        setLoadingStripe(false);
        toast({
          title: "Subscription System Error",
          description: "An unexpected error occurred. Please try again later.",
          variant: "destructive",
        });
      }
    };
    
    loadStripeInstance();
  }, [toast]);

  // Create payment intent when component mounts or tier changes
  useEffect(() => {
    if (!user) {
      // Skip payment intent creation if user is not logged in
      setIsLoading(false);
      return;
    }

    // Create PaymentIntent as soon as the tier is selected
    const createIntent = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Create payment intent for the subscription
        const response = await apiRequest("POST", "/api/create-payment-intent", { 
          amount: selectedTier.price,
          tier: selectedTierId
        });
        
        const data = await response.json();
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setError(data.message || "Could not initialize payment");
          toast({
            title: "Error",
            description: data.message || "Could not initialize subscription payment",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error("Subscription initialization error:", error);
        setError(error.message || "An unexpected error occurred");
        toast({
          title: "Error",
          description: error.message || "Failed to set up subscription payment",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    createIntent();
  }, [user, selectedTierId, selectedTier.price, toast]);

  // Handle subscription success
  const handleSubscriptionSuccess = async (paymentIntentId: string) => {
    try {
      // Update subscription status in our database
      const response = await apiRequest("POST", "/api/update-subscription", {
        tierId: selectedTier.id,
        status: 'active',
        paymentIntentId
      });
      
      if (response.ok) {
        console.log("Subscription updated successfully");
        toast({
          title: "Subscription Activated",
          description: `Your ${selectedTier.name} subscription is now active!`,
        });
        
        // Redirect to success page
        setTimeout(() => {
          navigate('/subscription-success');
        }, 1500);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Subscription update failed:", errorData);
        toast({
          title: "Warning",
          description: errorData.message || "Payment processed but subscription update failed. Please contact support.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Error updating subscription:", err);
      toast({
        title: "Warning",
        description: "Payment processed but subscription update failed. Please contact support.",
        variant: "destructive",
      });
    }
  };

  // Show loading state when loading Stripe or payment intent
  if (loadingStripe || (isLoading && user)) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
        <p className="text-muted-foreground">Setting up subscription options...</p>
      </div>
    );
  }

  // Show authentication required message
  if (!user) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Authentication Required
            </CardTitle>
            <CardDescription className="text-center">
              Please log in to subscribe to a plan
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/login')}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error message if there is a Stripe error
  if (stripeError) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Payment System Unavailable
            </CardTitle>
            <CardDescription className="text-center">
              We're unable to process subscription payments at this time.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-6">Please try again later or contact support if the issue persists.</p>
            <Button onClick={() => navigate('/')}>Return to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto py-12 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Choose Your Subscription Plan</h1>
        <p className="text-muted-foreground mt-2">Select the best plan for your needs and unlock premium features</p>
      </div>
      
      <div className="mb-10">
        <RadioGroup 
          value={selectedTierId} 
          onValueChange={(value) => {
            setSelectedTierId(value);
            localStorage.setItem('selectedSubscriptionTier', value);
          }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {SUBSCRIPTION_TIERS.map((tier) => (
            <Label
              key={tier.id}
              htmlFor={tier.id}
              className="cursor-pointer"
            >
              <Card className={`h-full transition-all hover:border-primary/50 ${selectedTierId === tier.id ? 'border-primary ring-2 ring-primary/50 shadow-lg' : 'shadow'}`}>
                <CardHeader className={selectedTierId === tier.id ? 'bg-primary/5' : ''}>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl">{tier.name}</CardTitle>
                    {tier.id === 'premium' && (
                      <span className="bg-primary text-white text-xs px-2 py-1 rounded-full flex items-center">
                        <StarIcon className="w-3 h-3 mr-1" />
                        Popular
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">${tier.price}</span>
                    <span className="text-sm font-normal text-muted-foreground">/month</span>
                  </div>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="pt-2 pb-4">
                  <RadioGroupItem 
                    value={tier.id} 
                    id={tier.id} 
                    className="sr-only" 
                  />
                  {selectedTierId === tier.id && (
                    <div className="w-full px-3 py-2 bg-primary/10 rounded-md text-center text-sm font-medium text-primary">
                      Selected Plan
                    </div>
                  )}
                </CardFooter>
              </Card>
            </Label>
          ))}
        </RadioGroup>
      </div>

      <Card className="border-primary/10 shadow-lg">
        <CardHeader className="border-b bg-muted/50">
          <CardTitle className="flex items-center justify-between">
            <span>Complete your subscription</span>
            <BadgeCheck className="h-5 w-5 text-primary" />
          </CardTitle>
          <CardDescription>
            Enter your payment details to subscribe to the {selectedTier.name} plan
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {error ? (
            <div className="py-8 text-center">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          ) : clientSecret && stripeInstance ? (
            <Elements stripe={stripeInstance} options={{ 
              clientSecret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: '#4a6cf7',
                  colorBackground: '#ffffff',
                  colorText: '#1e293b',
                  colorDanger: '#ef4444',
                  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                  borderRadius: '0.5rem',
                }
              }
            }}>
              <SubscribeForm 
                selectedTier={selectedTier} 
                onSubscriptionSuccess={handleSubscriptionSuccess} 
              />
            </Elements>
          ) : (
            <div className="py-8 text-center text-destructive">
              <AlertCircle className="h-8 w-8 mx-auto mb-4" />
              <p className="mb-4">Failed to initialize payment. Please try again.</p>
              <Button onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}