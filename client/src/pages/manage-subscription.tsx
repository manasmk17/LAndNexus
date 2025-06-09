import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  Settings, 
  AlertTriangle,
  Download,
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/lib/i18n";

interface UserSubscription {
  id: number;
  userId: number;
  planId: number;
  stripeSubscriptionId: string;
  status: string;
  billingCycle: 'monthly' | 'yearly';
  currency: 'USD' | 'AED';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
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

interface PaymentMethod {
  id: string;
  type: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
}

interface Invoice {
  id: number;
  stripeInvoiceId: string;
  status: string;
  amount: number;
  currency: string;
  invoiceUrl: string;
  paidAt: string | null;
  createdAt: string;
}

export default function ManageSubscription() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const { data: subscriptionData } = useQuery({
    queryKey: ["/api/my-subscription"],
    enabled: !!user
  });

  const { data: plans = [] } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription-plans"],
    enabled: !!user
  });

  const { data: paymentMethods = [] } = useQuery<PaymentMethod[]>({
    queryKey: ["/api/payment-methods"],
    enabled: !!user
  });

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["/api/my-invoices"],
    enabled: !!user
  });

  const cancelMutation = useMutation({
    mutationFn: async (cancelAtPeriodEnd: boolean) => {
      const response = await apiRequest("POST", "/api/cancel-subscription", {
        cancelAtPeriodEnd
      });
      if (!response.ok) throw new Error("Failed to cancel subscription");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-subscription"] });
      toast({
        title: "Subscription Updated",
        description: "Your subscription has been updated successfully.",
      });
      setShowCancelDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const reactivateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/reactivate-subscription");
      if (!response.ok) throw new Error("Failed to reactivate subscription");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-subscription"] });
      toast({
        title: "Subscription Reactivated",
        description: "Your subscription has been reactivated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const deletePaymentMethodMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      const response = await apiRequest("DELETE", `/api/payment-methods/${paymentMethodId}`);
      if (!response.ok) throw new Error("Failed to delete payment method");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
      toast({
        title: "Payment Method Removed",
        description: "Your payment method has been removed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Alert>
            <AlertDescription>
              Please log in to manage your subscription.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const subscription = subscriptionData?.subscription as UserSubscription | null;
  const currentPlan = subscriptionData?.plan as SubscriptionPlan | null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600 text-white">Active</Badge>;
      case 'trialing':
        return <Badge className="bg-blue-600 text-white">Trial</Badge>;
      case 'past_due':
        return <Badge variant="destructive">Past Due</Badge>;
      case 'canceled':
        return <Badge variant="secondary">Canceled</Badge>;
      case 'incomplete':
        return <Badge className="bg-yellow-600 text-white">Incomplete</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCurrentPrice = () => {
    if (!currentPlan || !subscription) return 0;
    
    if (subscription.currency === 'USD') {
      return subscription.billingCycle === 'monthly' 
        ? currentPlan.priceMonthlyUSD 
        : currentPlan.priceYearlyUSD;
    } else {
      return subscription.billingCycle === 'monthly' 
        ? currentPlan.priceMonthlyAED 
        : currentPlan.priceYearlyAED;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Manage Subscription
          </h1>
          <p className="text-gray-600">
            View and manage your subscription, billing, and payment methods
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Subscription */}
          <div className="lg:col-span-2 space-y-6">
            {subscription && currentPlan ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Current Plan
                    </CardTitle>
                    {getStatusBadge(subscription.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{currentPlan.name}</h3>
                      <p className="text-gray-600 text-sm mb-4">{currentPlan.description}</p>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Price:</span>
                          <span className="font-semibold">
                            {formatCurrency(getCurrentPrice() / 100, subscription.currency)}
                            /{subscription.billingCycle === 'monthly' ? 'month' : 'year'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Billing Cycle:</span>
                          <span className="capitalize">{subscription.billingCycle}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Currency:</span>
                          <span>{subscription.currency}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Billing Information</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Current Period:</span>
                          <span className="text-sm">
                            {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Next Billing:</span>
                          <span className="text-sm">
                            {subscription.cancelAtPeriodEnd 
                              ? 'Canceled' 
                              : formatDate(subscription.currentPeriodEnd)
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {subscription.cancelAtPeriodEnd && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Your subscription is scheduled to cancel on {formatDate(subscription.currentPeriodEnd)}.
                        You can reactivate it before this date.
                      </AlertDescription>
                    </Alert>
                  )}

                  <Separator />

                  <div className="flex flex-wrap gap-3">
                    {subscription.cancelAtPeriodEnd ? (
                      <Button 
                        onClick={() => reactivateMutation.mutate()}
                        disabled={reactivateMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {reactivateMutation.isPending ? (
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="mr-2 h-4 w-4" />
                        )}
                        Reactivate Subscription
                      </Button>
                    ) : (
                      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                        <DialogTrigger asChild>
                          <Button variant="destructive">
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancel Subscription
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Cancel Subscription</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to cancel your subscription?
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Button
                              onClick={() => cancelMutation.mutate(true)}
                              disabled={cancelMutation.isPending}
                              variant="outline"
                              className="w-full"
                            >
                              Cancel at Period End ({formatDate(subscription.currentPeriodEnd)})
                            </Button>
                            <Button
                              onClick={() => cancelMutation.mutate(false)}
                              disabled={cancelMutation.isPending}
                              variant="destructive"
                              className="w-full"
                            >
                              Cancel Immediately
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                    
                    <Button variant="outline">
                      <Settings className="mr-2 h-4 w-4" />
                      Change Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <h3 className="text-lg font-semibold mb-2">No Active Subscription</h3>
                  <p className="text-gray-600 mb-6">
                    Subscribe to a plan to unlock premium features
                  </p>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    View Plans
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Methods
                </CardTitle>
              </CardHeader>
              <CardContent>
                {paymentMethods.length > 0 ? (
                  <div className="space-y-4">
                    {paymentMethods.map((method) => (
                      <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium">
                              **** **** **** {method.last4}
                            </p>
                            <p className="text-sm text-gray-600">
                              {method.brand.toUpperCase()} • Expires {method.exp_month}/{method.exp_year}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deletePaymentMethodMutation.mutate(method.id)}
                          disabled={deletePaymentMethodMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No payment methods found</p>
                    <Button variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Payment Method
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Billing History */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Billing History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {invoices.length > 0 ? (
                  <div className="space-y-4">
                    {invoices.slice(0, 5).map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {formatCurrency(invoice.amount / 100, invoice.currency as 'USD' | 'AED')}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatDate(invoice.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {invoice.status === 'paid' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-yellow-600" />
                          )}
                          {invoice.invoiceUrl && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={invoice.invoiceUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {invoices.length > 5 && (
                      <Button variant="outline" size="sm" className="w-full">
                        View All Invoices
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No billing history</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}