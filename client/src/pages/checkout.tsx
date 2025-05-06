import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation, useRoute } from 'wouter';
import { getStripe, isStripeAvailable, formatCurrency, TEST_CARDS } from '@/lib/stripe-helpers';
import { Stripe } from '@stripe/stripe-js';
import { Loader2, LockIcon, CheckCircle, AlertCircle, CreditCard } from 'lucide-react';

// Types for checkout items
interface CheckoutItem {
  id: string;
  name: string;
  description?: string;
  amount: number;
  quantity?: number;
}

// Payment form component
const CheckoutForm = ({ 
  amount, 
  itemName 
}: { 
  amount: number;
  itemName: string;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [, setLocation] = useLocation();

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
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // Add return URL for redirection after payment
          return_url: window.location.origin + '/payment-success',
        },
        // Use if_required to handle 3D Secure without page reload if possible
        redirect: 'if_required',
      });

      if (error) {
        console.error("Payment confirmation error:", error);
        setPaymentStatus('error');
        toast({
          title: "Payment Failed",
          description: error.message || "Your payment could not be processed.",
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded!
        setPaymentStatus('success');
        toast({
          title: "Payment Successful",
          description: `Your payment for ${itemName} was successful!`,
        });
        
        // Redirect to success page after a short delay
        setTimeout(() => {
          setLocation('/payment-success');
        }, 1500);
      } else {
        // Payment status is pending or requires further action
        console.log("Payment intent status:", paymentIntent?.status);
        toast({
          title: "Payment Processing",
          description: `Your payment is being processed. Status: ${paymentIntent?.status || 'unknown'}.`,
        });
      }
    } catch (error: any) {
      console.error("Payment submission error:", error);
      setPaymentStatus('error');
      toast({
        title: "Payment System Error",
        description: error.message || "An unexpected error occurred during payment.",
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
            Payment Successful
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Pay {formatCurrency(amount)}
          </span>
        )}
      </Button>
    </form>
  );
};

export default function Checkout() {
  // State for payment processing
  const [clientSecret, setClientSecret] = useState("");
  const [amount, setAmount] = useState(99.99); // Default amount
  const [itemName, setItemName] = useState("L&D Nexus Premium Service");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/checkout/:itemId');
  
  // Stripe loading state
  const [stripeInstance, setStripeInstance] = useState<Stripe | null>(null);
  const [loadingStripe, setLoadingStripe] = useState(true);
  const [stripeError, setStripeError] = useState(false);

  // Handle URL parameters for different checkout items
  useEffect(() => {
    // Process URL parameters if they exist
    if (match && params.itemId) {
      // Look up item details from database or use predefined options
      switch (params.itemId) {
        case 'basic-subscription':
          setAmount(29.99);
          setItemName('Basic Subscription');
          break;
        case 'premium-subscription':
          setAmount(79.99);
          setItemName('Premium Subscription');
          break;
        case 'consultation':
          setAmount(149.99);
          setItemName('Consultation Booking');
          break;
        default:
          // Keep defaults if itemId is not recognized
          break;
      }
    }
  }, [match, params]);

  // Create payment intent when component mounts or amount changes
  useEffect(() => {
    const fetchPaymentIntent = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Create PaymentIntent through our API
        const response = await apiRequest("POST", "/api/create-payment-intent", { 
          amount,
          itemName
        });
        
        const data = await response.json();
        
        if (!data.clientSecret) {
          throw new Error("No client secret returned from the server");
        }
        
        setClientSecret(data.clientSecret);
      } catch (error: any) {
        console.error("Payment intent creation error:", error);
        setError(error.message || "Failed to initialize payment.");
        
        toast({
          title: "Payment Setup Failed",
          description: "We couldn't set up your payment. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (amount > 0) {
      fetchPaymentIntent();
    }
  }, [toast, amount, itemName]);

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
          console.log("Stripe public key not available - payment functions disabled");
          setStripeError(true);
          toast({
            title: "Payment System Unavailable",
            description: "The payment system configuration is missing. Please try again later.",
            variant: "destructive",
          });
          return;
        }
        
        // Add the script to the page
        console.log("Attempting to load Stripe...");
        
        // Create script element for Stripe.js
        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        script.async = true;
        
        // When script loads, initialize Stripe instance
        script.onload = async () => {
          try {
            console.log("Stripe.js script loaded");
            if (window.Stripe) {
              const instance = window.Stripe(stripeKey);
              console.log("Stripe initialized successfully");
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
            title: "Payment System Unavailable",
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
        console.error("Error during Stripe setup:", error);
        setStripeError(true);
        setLoadingStripe(false);
        toast({
          title: "Payment System Error",
          description: "An unexpected error occurred. Please try again later.",
          variant: "destructive",
        });
      }
    };
    
    loadStripeInstance();
  }, [toast]);

  // Show loading spinner when loading payment intent or Stripe
  if (isLoading || loadingStripe) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
        <p className="text-muted-foreground">Setting up secure payment...</p>
      </div>
    );
  }

  // Show error message if there is a Stripe loading error
  if (stripeError) {
    return (
      <div className="container max-w-md mx-auto py-12">
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Payment System Unavailable
            </CardTitle>
            <CardDescription>
              We're unable to process payments at this time.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-6">Please try again later or contact support if the issue persists.</p>
            <Button onClick={() => setLocation('/')}>Return to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error message if there was an error creating the payment intent
  if (error || !clientSecret) {
    return (
      <div className="container max-w-md mx-auto py-12">
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Payment Setup Failed
            </CardTitle>
            <CardDescription>
              We encountered an error setting up your payment.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-6">{error || "Could not initialize payment process. Please try again."}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setLocation('/')}>
                Return to Home
              </Button>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show the checkout form
  return (
    <div className="container max-w-md mx-auto py-12">
      <Card className="border-primary/10 shadow-lg">
        <CardHeader className="border-b bg-muted/50">
          <CardTitle className="flex items-center justify-between">
            <span>Complete your payment</span>
            <LockIcon className="h-5 w-5 text-primary" />
          </CardTitle>
          <CardDescription>
            Secure payment processed by Stripe
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="mb-6 space-y-3">
            <h3 className="text-lg font-medium">Order Summary</h3>
            <div className="flex justify-between border-b pb-2">
              <span>{itemName}</span>
              <span className="font-medium">{formatCurrency(amount)}</span>
            </div>
            <div className="flex justify-between font-semibold text-lg pt-1">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(amount)}</span>
            </div>
          </div>
          
          {/* Safely wrap the form in <Elements> using our loaded Stripe instance */}
          {stripeInstance && (
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
              <CheckoutForm amount={amount} itemName={itemName} />
            </Elements>
          )}
        </CardContent>
      </Card>
    </div>
  );
}