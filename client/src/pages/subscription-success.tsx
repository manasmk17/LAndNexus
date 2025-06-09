import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, CreditCard, Calendar, Receipt } from "lucide-react";

export default function SubscriptionSuccess() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Clear any checkout state
    const urlParams = new URLSearchParams(window.location.search);
    const paymentIntent = urlParams.get('payment_intent');
    const paymentIntentClientSecret = urlParams.get('payment_intent_client_secret');
    
    if (paymentIntent) {
      // Payment was successful, clean up URL
      window.history.replaceState({}, document.title, "/subscription-success");
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-green-100 p-6">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Your New Plan!
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Your subscription has been successfully activated. You now have access to all premium features.
          </p>
          
          <Badge className="bg-green-600 text-white px-6 py-2 text-sm">
            Subscription Active
          </Badge>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              What happens next?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-blue-100 p-2 mt-1">
                <CheckCircle className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold">Instant Access</h4>
                <p className="text-sm text-gray-600">
                  All premium features are now available in your dashboard
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-purple-100 p-2 mt-1">
                <CreditCard className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold">Payment Confirmation</h4>
                <p className="text-sm text-gray-600">
                  A receipt has been sent to your email address
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-green-100 p-2 mt-1">
                <Calendar className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold">Automatic Renewal</h4>
                <p className="text-sm text-gray-600">
                  Your subscription will renew automatically. Manage it anytime from your dashboard.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/professional-dashboard">
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          
          <Link href="/manage-subscription">
            <Button variant="outline" className="w-full">
              Manage Subscription
            </Button>
          </Link>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Need help? Contact our support team anytime.
          </p>
        </div>
      </div>
    </div>
  );
}