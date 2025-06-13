import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from 'wouter';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
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

const CheckoutForm = ({ amount }: { amount: number }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [, setLocation] = useLocation();

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
          return_url: window.location.origin,
        },
        redirect: 'if_required',
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Successful",
          description: "Thank you for your purchase!",
        });
        // Redirect to a success page or dashboard
        setTimeout(() => {
          setLocation('/professional-dashboard');
        }, 2000);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full"
      >
        {isProcessing ? "Processing..." : `Pay $${amount.toFixed(2)}`}
      </Button>
    </form>
  );
};

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState("");
  const [amount, setAmount] = useState(99.99); // Default amount, customize as needed
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const fetchPaymentIntent = async () => {
      try {
        setIsLoading(true);
        // Create PaymentIntent as soon as the page loads
        const response = await apiRequest("POST", "/api/create-payment-intent", { 
          amount 
        });
        
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to initialize payment. Please try again later.",
          variant: "destructive",
        });
        // Redirect back on error
        setTimeout(() => {
          setLocation('/');
        }, 2000);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentIntent();
  }, [toast, amount, setLocation]);

  if (isLoading || !clientSecret) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle>Complete your payment</CardTitle>
          <CardDescription>
            Secure payment processed by Stripe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Order Summary</h3>
            <div className="flex justify-between border-b pb-2 mb-2">
              <span>Premium Membership</span>
              <span>${amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>${amount.toFixed(2)}</span>
            </div>
          </div>
          
          {/* Make SURE to wrap the form in <Elements> which provides the stripe context. */}
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm amount={amount} />
          </Elements>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          <p>Your payment information is encrypted and secure.</p>
        </CardFooter>
      </Card>
    </div>
  );
}