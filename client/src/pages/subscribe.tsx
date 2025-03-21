import { useEffect, useState } from 'react';
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useLocation, useRoute } from 'wouter';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const tiers = [
  {
    id: 'basic',
    name: 'Basic',
    price: 29,
    description: 'Essential tools for L&D professionals and companies',
    features: [
      'Create basic profile',
      'Browse job postings',
      'Access resource library',
      'Apply to up to 5 jobs monthly'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 79,
    description: 'Advanced features for serious L&D professionals and growing organizations',
    features: [
      'Featured profile placement',
      'Unlimited job applications',
      'Direct messaging',
      'Access to premium resources',
      'Priority support'
    ]
  }
];

const SubscriptionForm = ({ selectedTier }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/subscription-success',
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Subscription Successful",
          description: "You are now subscribed to the plan!",
        });
        navigate('/');
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="py-4">
        <PaymentElement />
      </div>
      <Button 
        disabled={!stripe || loading} 
        type="submit" 
        className="w-full" 
        size="lg"
      >
        {loading ? "Processing..." : `Subscribe - $${selectedTier.price}/month`}
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState("");
  const [selectedTierId, setSelectedTierId] = useState("basic");
  const [loading, setLoading] = useState(false);
  const [match, params] = useRoute('/subscribe/:tierId');
  
  useEffect(() => {
    if (match && params.tierId && (params.tierId === 'basic' || params.tierId === 'premium')) {
      setSelectedTierId(params.tierId);
    }
  }, [match, params]);

  const selectedTier = tiers.find(tier => tier.id === selectedTierId) || tiers[0];

  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to subscribe to a plan",
        variant: "destructive",
      });
      return;
    }

    // Create PaymentIntent as soon as the page loads
    const createIntent = async () => {
      setLoading(true);
      try {
        const response = await apiRequest("POST", "/api/create-subscription", { 
          tierId: selectedTierId,
          priceId: `price_${selectedTierId}`  // This would be replaced with actual Stripe price IDs
        });
        
        const data = await response.json();
        if (response.status === 200 && data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          toast({
            title: "Error",
            description: data.message || "Could not initialize subscription",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    createIntent();
  }, [user, selectedTierId, toast]);

  if (!user) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Authentication Required</CardTitle>
            <CardDescription className="text-center">
              Please log in to subscribe to a plan
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Choose Your Subscription Plan</h1>
      
      <div className="mb-8">
        <RadioGroup 
          value={selectedTierId} 
          onValueChange={setSelectedTierId}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {tiers.map((tier) => (
            <Label
              key={tier.id}
              htmlFor={tier.id}
              className="cursor-pointer"
            >
              <Card className={`h-full transition-all ${selectedTierId === tier.id ? 'border-primary ring-2 ring-primary' : ''}`}>
                <CardHeader>
                  <CardTitle>{tier.name}</CardTitle>
                  <div className="text-3xl font-bold">${tier.price}<span className="text-sm font-normal text-gray-500">/month</span></div>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <RadioGroupItem 
                    value={tier.id} 
                    id={tier.id} 
                    className="sr-only" 
                  />
                </CardFooter>
              </Card>
            </Label>
          ))}
        </RadioGroup>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
          <CardDescription>
            Enter your payment information to subscribe to the {selectedTier.name} plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && !clientSecret ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <SubscriptionForm selectedTier={selectedTier} />
            </Elements>
          ) : (
            <div className="py-8 text-center text-red-500">
              Failed to initialize payment. Please try again.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}