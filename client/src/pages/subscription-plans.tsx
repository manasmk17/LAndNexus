import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Check, 
  Star, 
  Zap, 
  Shield, 
  BarChart3, 
  Users, 
  MessageCircle,
  Crown,
  Building,
  ArrowRight,
  User
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/lib/i18n";
import { SEOMeta, createPricingSchema } from "@/components/seo/seo-meta";

interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  features: string[];
  planType: "professional" | "company" | "free";
  priceMonthlyUSD: number;
  priceYearlyUSD: number;
  priceMonthlyAED: number;
  priceYearlyAED: number;
  maxJobApplications: number | null;
  maxJobPostings: number | null;
  maxResourceDownloads: number | null;
  maxTeamMembers: number | null;
  maxContacts: number | null;
  aiMatchingEnabled: boolean;
  priorityMatching: boolean;
  featuredPlacement: boolean;
  customBranding: boolean;
  videoConsultations: boolean;
  directMessaging: boolean;
  analyticsAccess: boolean;
  apiAccess: boolean;
  whiteLabel: boolean;
  dedicatedManager: boolean;
  supportLevel: string;
  isActive: boolean;
  sortOrder: number;
}

export default function SubscriptionPlans() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isYearly, setIsYearly] = useState(false);
  const [currency, setCurrency] = useState<'USD' | 'AED'>('USD');

  const [planType, setPlanType] = useState<'professional' | 'company'>('professional');

  const { data: allPlans = [], isLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription-plans"],
    enabled: true
  });

  // Filter plans based on selected type (excluding free plan from main display)
  const plans = allPlans.filter(plan => 
    plan.planType === planType && plan.name !== 'Starter'
  );

  // Get the free plan separately
  const freePlan = allPlans.find(plan => plan.name === 'Starter');

  const formatPrice = (priceInCents: number, currency: 'USD' | 'AED') => {
    if (currency === 'USD') {
      return `$${(priceInCents / 100).toFixed(0)}`;
    } else {
      return `${(priceInCents / 100).toFixed(0)} AED`;
    }
  };

  const getPrice = (plan: SubscriptionPlan) => {
    if (currency === 'USD') {
      return isYearly ? plan.priceYearlyUSD : plan.priceMonthlyUSD;
    } else {
      return isYearly ? plan.priceYearlyAED : plan.priceMonthlyAED;
    }
  };

  const getDiscountPercentage = (plan: SubscriptionPlan) => {
    if (currency === 'USD') {
      const monthlyTotal = plan.priceMonthlyUSD * 12;
      return Math.round((1 - plan.priceYearlyUSD / monthlyTotal) * 100);
    } else {
      const monthlyTotal = plan.priceMonthlyAED * 12;
      return Math.round((1 - plan.priceYearlyAED / monthlyTotal) * 100);
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'basic':
        return <Star className="h-8 w-8 text-blue-600" />;
      case 'pro':
        return <Zap className="h-8 w-8 text-purple-600" />;
      case 'enterprise':
        return <Crown className="h-8 w-8 text-amber-600" />;
      default:
        return <Star className="h-8 w-8 text-gray-600" />;
    }
  };

  const getFeatureIcon = (feature: string) => {
    if (feature.toLowerCase().includes('unlimited') || feature.toLowerCase().includes('priority')) {
      return <Zap className="h-4 w-4 text-purple-600" />;
    } else if (feature.toLowerCase().includes('support')) {
      return <MessageCircle className="h-4 w-4 text-blue-600" />;
    } else if (feature.toLowerCase().includes('analytics')) {
      return <BarChart3 className="h-4 w-4 text-green-600" />;
    } else if (feature.toLowerCase().includes('team') || feature.toLowerCase().includes('multi-user')) {
      return <Users className="h-4 w-4 text-indigo-600" />;
    } else if (feature.toLowerCase().includes('custom') || feature.toLowerCase().includes('white-label')) {
      return <Building className="h-4 w-4 text-amber-600" />;
    } else {
      return <Check className="h-4 w-4 text-green-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <SEOMeta
        title="Subscription Plans | L&D Nexus | International Certified Professionals"
        description="Choose the perfect subscription plan for your L&D career. Basic at $29/month, Pro at $79/month, Enterprise at $199/month. AI-powered matching, unlimited access, priority support."
        keywords="L&D subscription plans, professional development pricing, International Certified Trainers subscription, Global Learning Development platform pricing"
        canonicalUrl="https://www.ldnexus.com/subscription-plans"
        structuredData={createPricingSchema()}
      />
      <div className="container mx-auto px-4">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Perfect Plan
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Unlock your professional potential with our comprehensive L&D platform. 
            Choose the plan that fits your career goals and business needs.
          </p>

          {/* Plan Type Toggle */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <Button
              variant={planType === 'professional' ? 'default' : 'outline'}
              size="lg"
              onClick={() => setPlanType('professional')}
              className="px-8"
            >
              <User className="mr-2 h-4 w-4" />
              For Professionals
            </Button>
            <Button
              variant={planType === 'company' ? 'default' : 'outline'}
              size="lg"
              onClick={() => setPlanType('company')}
              className="px-8"
            >
              <Building className="mr-2 h-4 w-4" />
              For Companies
            </Button>
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm font-medium ${!isYearly ? 'text-gray-900' : 'text-gray-500'}`}>
              Monthly
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-green-600"
            />
            <span className={`text-sm font-medium ${isYearly ? 'text-gray-900' : 'text-gray-500'}`}>
              Yearly
            </span>
            {isYearly && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 ml-2">
                Save up to 17%
              </Badge>
            )}
          </div>

          {/* Currency Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <Button
              variant={currency === 'USD' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrency('USD')}
            >
              USD ($)
            </Button>
            <Button
              variant={currency === 'AED' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrency('AED')}
            >
              AED (د.إ)
            </Button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl ${
                plan.name.toLowerCase() === 'pro'
                  ? 'border-2 border-purple-500 shadow-xl scale-105'
                  : 'border border-gray-200 hover:border-purple-300'
              }`}
            >
              {/* Popular Badge */}
              {plan.name.toLowerCase() === 'pro' && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <Badge className="bg-purple-600 text-white px-6 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center mb-4">
                  {getPlanIcon(plan.name)}
                </div>
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-gray-600">
                  {plan.description}
                </CardDescription>
                
                {/* Pricing */}
                <div className="mt-6">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900">
                      {formatPrice(getPrice(plan), currency)}
                    </span>
                    <span className="text-gray-500 ml-1">
                      /{isYearly ? 'year' : 'month'}
                    </span>
                  </div>
                  
                  {isYearly && (
                    <div className="mt-2">
                      <span className="text-sm text-gray-500 line-through">
                        {formatPrice(
                          currency === 'USD' 
                            ? plan.priceMonthlyUSD * 12 
                            : plan.priceMonthlyAED * 12, 
                          currency
                        )} /year
                      </span>
                      <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                        Save {getDiscountPercentage(plan)}%
                      </Badge>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Features List */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      {getFeatureIcon(feature)}
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Limits Info */}
                <div className="border-t pt-4 mb-6">
                  <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Job Applications:</span>
                      <span className="font-medium">
                        {plan.maxJobPostings ? `${plan.maxJobPostings}/month` : 'Unlimited'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Team Members:</span>
                      <span className="font-medium">
                        {plan.maxTeamMembers ? `${plan.maxTeamMembers} users` : 'Unlimited'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Resource Downloads:</span>
                      <span className="font-medium">
                        {plan.maxResourceDownloads ? `${plan.maxResourceDownloads}/month` : 'Unlimited'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                {user ? (
                  <Link href={`/subscribe?planId=${plan.id}&billing=${isYearly ? 'yearly' : 'monthly'}&currency=${currency}`}>
                    <Button 
                      className={`w-full group ${
                        plan.name.toLowerCase() === 'pro'
                          ? 'bg-purple-600 hover:bg-purple-700'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                ) : (
                  <Link href={`/login?redirect=/subscribe?planId=${plan.id}&billing=${isYearly ? 'yearly' : 'monthly'}&currency=${currency}`}>
                    <Button 
                      className={`w-full group ${
                        plan.name.toLowerCase() === 'pro'
                          ? 'bg-purple-600 hover:bg-purple-700'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      Sign Up & Subscribe
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <div className="flex items-center justify-center gap-8 mb-8">
            <div className="flex items-center gap-2 text-gray-600">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="text-sm">Secure Payments</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              <span className="text-sm">24/7 Support</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Star className="h-5 w-5 text-amber-600" />
              <span className="text-sm">Cancel Anytime</span>
            </div>
          </div>
          
          <p className="text-sm text-gray-500 max-w-2xl mx-auto">
            All plans include a 14-day free trial. No credit card required to start. 
            Upgrade, downgrade, or cancel your subscription at any time from your dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}