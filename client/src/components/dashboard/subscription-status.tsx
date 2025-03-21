import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { format } from "date-fns";
import { CreditCard, Clock, AlertCircle, CheckCircle2 } from "lucide-react";

type SubscriptionStatus = {
  tier: string;
  status: string;
  nextBillingDate: string;
};

export default function SubscriptionStatus() {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        setLoading(true);
        const response = await apiRequest("GET", "/api/subscription-status");
        
        if (response.ok) {
          const data = await response.json();
          setSubscription(data);
          setError(null);
        } else {
          if (response.status === 404) {
            // No subscription found
            setSubscription(null);
          } else {
            // Other error
            const errorData = await response.json();
            setError(errorData.message || "Failed to fetch subscription status");
            toast({
              title: "Error",
              description: errorData.message || "Failed to fetch subscription status",
              variant: "destructive",
            });
          }
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred");
        toast({
          title: "Error",
          description: err.message || "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionStatus();
  }, [toast]);

  // Function to get color based on subscription status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-500';
      case 'trialing':
        return 'text-blue-500';
      case 'past_due':
      case 'unpaid':
        return 'text-amber-500';
      case 'canceled':
      case 'incomplete_expired':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  // Function to get icon based on subscription status
  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'trialing':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'past_due':
      case 'unpaid':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case 'canceled':
      case 'incomplete_expired':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <CreditCard className="h-5 w-5 text-gray-500" />;
    }
  };

  // Function to format the status label for display
  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Function to format tier name
  const formatTier = (tier: string) => {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>You don't have an active subscription.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Upgrade to a paid plan to access premium features and get more from our platform.
          </p>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href="/subscribe">View Subscription Plans</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
        <CardDescription>Manage your subscription plan</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">{formatTier(subscription.tier)} Plan</h3>
            <div className="flex items-center mt-1 space-x-1">
              <StatusIcon status={subscription.status} />
              <span className={`text-sm ${getStatusColor(subscription.status)}`}>
                {formatStatus(subscription.status)}
              </span>
            </div>
          </div>
          <CreditCard className="h-10 w-10 text-muted-foreground" />
        </div>

        {subscription.nextBillingDate && (
          <div className="text-sm text-muted-foreground">
            <p>Next billing date: {format(new Date(subscription.nextBillingDate), 'MMMM d, yyyy')}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" asChild>
          <Link href="/subscribe">Change Plan</Link>
        </Button>
        <Button variant="secondary">
          Manage Payment
        </Button>
      </CardFooter>
    </Card>
  );
}