import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/lib/i18n";
import { SEOMeta } from "@/components/seo/seo-meta";
import { SubscriptionPayment } from "@/components/payment/subscription-payment";
import { CheckCircle, ArrowLeft } from "lucide-react";

export default function Subscribe() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/subscribe");

  // Parse URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const planId = urlParams.get('planId');
  const billing = urlParams.get('billing') as 'monthly' | 'yearly';
  const currency = urlParams.get('currency') as 'USD' | 'AED';

  const { data: plans = [] } = useQuery({
    queryKey: ["/api/subscription-plans"],
    enabled: true
  });

  const selectedPlan = plans.find(plan => plan.id === parseInt(planId || '0'));

  useEffect(() => {
    if (!user) {
      setLocation('/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search));
      return;
    }

    if (!planId || !selectedPlan) {
      setLocation('/subscription-plans');
      return;
    }
  }, [user, planId, selectedPlan, setLocation]);

  if (!user || !selectedPlan) {
    return null;
  }

  const formatPrice = (priceInCents: number, currency: 'USD' | 'AED') => {
    if (currency === 'USD') {
      return `$${(priceInCents / 100).toFixed(0)}`;
    } else {
      return `${(priceInCents / 100).toFixed(0)} AED`;
    }
  };

  const getPrice = () => {
    if (currency === 'USD') {
      return billing === 'yearly' ? selectedPlan.priceYearlyUSD : selectedPlan.priceMonthlyUSD;
    } else {
      return billing === 'yearly' ? selectedPlan.priceYearlyAED : selectedPlan.priceMonthlyAED;
    }
  };

  const handleSubscriptionSuccess = () => {
    setLocation('/subscription-success');
  };

  const handleCancel = () => {
    setLocation('/subscription-plans');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <SEOMeta
        title={`Subscribe to ${selectedPlan.name} Plan | L&D Nexus`}
        description={`Activate your ${selectedPlan.name} subscription for ${formatPrice(getPrice(), currency)}/${billing}. ${selectedPlan.description}`}
        canonicalUrl={`https://www.ldnexus.com/subscribe?planId=${planId}&billing=${billing}&currency=${currency}`}
      />

      <div className="container mx-auto px-4 max-w-2xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => setLocation('/subscription-plans')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Plans
        </Button>

        {/* Payment Component */}
        <SubscriptionPayment
          planId={parseInt(planId)}
          planName={selectedPlan.name}
          planPrice={getPrice()}
          planFeatures={selectedPlan.features}
          billingCycle={billing}
          currency={currency}
          onSuccess={handleSubscriptionSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}