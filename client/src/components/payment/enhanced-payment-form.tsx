import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Shield, Lock, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface EnhancedPaymentFormProps {
  planId: string;
  billingCycle: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  onSuccess: (result: any) => void;
  onError: (error: string) => void;
}

interface PaymentMethodInfo {
  type: string;
  label: string;
  description: string;
  icon: string;
  popular?: boolean;
}

const paymentMethods: PaymentMethodInfo[] = [
  {
    type: 'card',
    label: 'Credit/Debit Card',
    description: 'Visa, Mastercard, American Express',
    icon: '💳',
    popular: true
  },
  {
    type: 'bancontact',
    label: 'Bancontact',
    description: 'Popular in Belgium',
    icon: '🇧🇪'
  },
  {
    type: 'eps',
    label: 'EPS',
    description: 'Popular in Austria',
    icon: '🇦🇹'
  },
  {
    type: 'giropay',
    label: 'Giropay',
    description: 'Popular in Germany',
    icon: '🇩🇪'
  },
  {
    type: 'ideal',
    label: 'iDEAL',
    description: 'Popular in Netherlands',
    icon: '🇳🇱'
  },
  {
    type: 'p24',
    label: 'Przelewy24',
    description: 'Popular in Poland',
    icon: '🇵🇱'
  },
  {
    type: 'sepa_debit',
    label: 'SEPA Direct Debit',
    description: 'Bank transfer in EU',
    icon: '🏦'
  },
  {
    type: 'sofort',
    label: 'Sofort',
    description: 'Instant bank transfer',
    icon: '⚡'
  }
];

export function EnhancedPaymentForm({
  planId,
  billingCycle,
  amount,
  currency,
  onSuccess,
  onError
}: EnhancedPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'form' | 'processing' | 'success'>('form');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentStep('processing');

    try {
      // Confirm the payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Confirm subscription activation on the backend
        const response = await apiRequest('POST', '/api/confirm-subscription-payment', {
          paymentIntentId: paymentIntent.id
        });

        if (response.ok) {
          const result = await response.json();
          setPaymentStep('success');
          
          toast({
            title: "Payment Successful! 🎉",
            description: "Your subscription has been activated successfully.",
          });

          // Send confirmation email notification
          try {
            await apiRequest('POST', '/api/send-payment-confirmation', {
              paymentIntentId: paymentIntent.id,
              planId,
              billingCycle,
              amount
            });
          } catch (emailError) {
            // Email sending is non-critical, don't fail the payment flow
            console.warn('Failed to send confirmation email:', emailError);
          }

          setTimeout(() => {
            onSuccess(result);
          }, 2000);
        } else {
          throw new Error('Failed to activate subscription');
        }
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setPaymentStep('form');
      
      toast({
        title: "Payment Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      
      onError(error.message || "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  if (paymentStep === 'success') {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6 text-center">
          <div className="mb-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-green-700 mb-2">
            Payment Successful!
          </h3>
          <p className="text-gray-600 mb-4">
            Your {planId} subscription has been activated. You'll receive a confirmation email shortly.
          </p>
          <div className="text-sm text-gray-500">
            Redirecting to dashboard...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Payment Method Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Accepted Payment Methods
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {paymentMethods.map((method) => (
              <div
                key={method.type}
                className="flex items-center gap-2 p-3 border rounded-lg relative"
              >
                {method.popular && (
                  <Badge className="absolute -top-2 -right-2 text-xs bg-blue-500">
                    Popular
                  </Badge>
                )}
                <span className="text-lg">{method.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{method.label}</div>
                  <div className="text-xs text-gray-500 truncate">{method.description}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Payment Details</CardTitle>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Lock className="h-4 w-4" />
            <span>Your payment information is encrypted and secure</span>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Order Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Order Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="capitalize">{planId} Plan ({billingCycle})</span>
                  <span className="font-medium">
                    {currency.toUpperCase()} {amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between font-medium border-t pt-2">
                  <span>Total</span>
                  <span>{currency.toUpperCase()} {amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Element */}
            <div className="space-y-4">
              <PaymentElement
                options={{
                  layout: "tabs",
                  paymentMethodOrder: ['card', 'bancontact', 'eps', 'giropay', 'ideal']
                }}
              />
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 h-12"
              disabled={!stripe || !elements || isProcessing}
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {paymentStep === 'processing' ? 'Processing Payment...' : 'Preparing...'}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Pay {currency.toUpperCase()} {amount.toFixed(2)}
                </div>
              )}
            </Button>

            {/* Security Notice */}
            <div className="text-xs text-gray-500 text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Secured by Stripe</span>
              </div>
              <div className="space-y-1">
                <p>Your payment is processed securely. We never store your credit card information.</p>
                <p>All transactions are encrypted with industry-standard SSL technology.</p>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}