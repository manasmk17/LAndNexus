import { useState, useEffect } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, CreditCard, DollarSign, Loader2, RefreshCw, Heart } from 'lucide-react';
import { Link } from "wouter";
import { isStripeAvailable, formatCurrency } from '@/lib/stripe-helpers';

export default function PaymentTesting() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);
  
  const checkStripeIntegration = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    setLoading(true);
    setStripeError(null);
    
    try {
      const response = await apiRequest("GET", "/api/test-stripe");
      
      if (response.ok) {
        const data = await response.json();
        setTestResults(data);
        
        if (data.success) {
          toast({
            title: "Stripe Integration Test Successful",
            description: "All test cases passed successfully.",
            variant: "default",
          });
        } else {
          setStripeError(data.message || "Test failed with unknown error");
          toast({
            title: "Stripe Integration Test Failed",
            description: data.message || "Unknown error occurred",
            variant: "destructive",
          });
        }
      } else {
        const errorText = await response.text();
        setStripeError(`API Error (${response.status}): ${errorText}`);
        toast({
          title: "API Error",
          description: `Status ${response.status}: Could not connect to test endpoint`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setStripeError(`Request Error: ${error.message}`);
      toast({
        title: "Connection Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    // Check Stripe client availability
    if (!isStripeAvailable()) {
      setStripeError("Stripe.js is not available - VITE_STRIPE_PUBLIC_KEY may be missing");
      setLoading(false);
      return;
    }
    
    // Run the test on initial load
    checkStripeIntegration();
  }, []);
  
  return (
    <div className="container max-w-5xl py-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <CreditCard className="h-6 w-6 text-primary" />
                Stripe Integration Tester
              </CardTitle>
              <CardDescription>
                Test and verify the payment infrastructure for L&D Nexus
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              onClick={checkStripeIntegration}
              disabled={loading || refreshing}
            >
              {refreshing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading && !refreshing ? (
            <div className="py-16 flex flex-col items-center justify-center text-muted-foreground">
              <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
              <p>Testing Stripe integration...</p>
            </div>
          ) : stripeError ? (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Stripe Integration Error</AlertTitle>
              <AlertDescription>
                {stripeError}
              </AlertDescription>
            </Alert>
          ) : testResults?.success ? (
            <div className="space-y-8">
              {/* Account Information */}
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <h3 className="text-lg font-medium">Account Verification</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Account ID</p>
                    <p className="font-mono text-sm mt-1">{testResults.stripeAccountId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Account Name</p>
                    <p className="font-medium mt-1">{testResults.stripeAccountName}</p>
                  </div>
                </div>
              </div>
            
              {/* Products & Prices */}
              <div className="rounded-lg border p-4">
                <h3 className="text-lg font-medium mb-4">Products & Prices</h3>
                
                {testResults.products.length === 0 ? (
                  <p className="text-muted-foreground py-2">No products found in your Stripe account</p>
                ) : (
                  <div className="space-y-3">
                    {testResults.products.slice(0, 3).map((product: any) => (
                      <div key={product.id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground font-mono">{product.id}</p>
                        </div>
                      </div>
                    ))}
                    {testResults.products.length > 3 && (
                      <p className="text-sm text-muted-foreground">{testResults.products.length - 3} more products...</p>
                    )}
                  </div>
                )}
                
                <Separator className="my-4" />
                
                <h3 className="text-lg font-medium mb-4">Pricing</h3>
                {testResults.prices.length === 0 ? (
                  <p className="text-muted-foreground py-2">No prices found in your Stripe account</p>
                ) : (
                  <div className="space-y-3">
                    {testResults.prices.slice(0, 3).map((price: any) => (
                      <div key={price.id} className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{formatCurrency(price.amount)}</p>
                            <Badge variant={price.recurring ? "outline" : "default"}>
                              {price.recurring ? "Recurring" : "One-time"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">Product: {price.productId}</p>
                        </div>
                      </div>
                    ))}
                    {testResults.prices.length > 3 && (
                      <p className="text-sm text-muted-foreground">{testResults.prices.length - 3} more prices...</p>
                    )}
                  </div>
                )}
              </div>
  
              {/* Test Cards */}
              <div className="rounded-lg border p-4">
                <h3 className="text-lg font-medium mb-4">Test Cards for Development</h3>
                
                <div className="space-y-4">
                  {testResults.testCards && testResults.testCards.map((card: any, index: number) => (
                    <div key={index} className="border rounded-lg p-3">
                      <p className="font-medium">{card.type}</p>
                      <p className="font-mono text-sm mt-1">Card: {card.number}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Test Payment */}
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <h3 className="text-lg font-medium">Test Payment Success</h3>
                </div>
                
                {testResults.testPaymentIntent && (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      Created and successfully canceled a test payment intent
                    </p>
                    
                    <div className="grid grid-cols-1 gap-2">
                      <p className="text-sm mt-1">
                        <span className="text-muted-foreground">Payment Intent ID: </span>
                        <span className="font-mono">{testResults.testPaymentIntent.id}</span>
                      </p>
                      <p className="text-sm mt-1">
                        <span className="text-muted-foreground">Status: </span>
                        <span className="font-medium">{testResults.testPaymentIntent.status}</span>
                      </p>
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex gap-4 mt-6">
                <Button asChild variant="default">
                  <Link to="/checkout">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Test One-time Payment
                  </Link>
                </Button>
                
                <Button asChild variant="outline">
                  <Link to="/subscribe">
                    <Heart className="h-4 w-4 mr-2" />
                    Test Subscription
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Test Failed</AlertTitle>
              <AlertDescription>
                {testResults?.message || "Unknown error occurred during Stripe testing"}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col items-start">
          <div className="w-full">
            <div className="border-t pt-4 mt-2">
              <div className="flex justify-between items-center cursor-pointer" 
                   onClick={() => {
                     const element = document.getElementById('troubleshooting-content');
                     if (element) {
                       element.style.display = element.style.display === 'none' ? 'block' : 'none';
                     }
                   }}>
                <h3 className="text-sm font-medium">Troubleshooting Tips</h3>
                <div className="h-4 w-4 shrink-0 transition-transform text-muted-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>
              <div id="troubleshooting-content" className="overflow-hidden text-sm pt-2" style={{ display: 'none' }}>
                <div className="space-y-2 text-sm">
                  <p><strong>Missing Stripe Keys:</strong> Ensure VITE_STRIPE_PUBLIC_KEY (client) and STRIPE_SECRET_KEY (server) are set.</p>
                  <p><strong>Connection Issues:</strong> Verify network connectivity and that the server is running.</p>
                  <p><strong>Stripe Account:</strong> Check that your Stripe account is active and properly configured.</p>
                  <p><strong>Development Mode:</strong> Remember that test cards only work in test mode with test API keys.</p>
                </div>
              </div>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}