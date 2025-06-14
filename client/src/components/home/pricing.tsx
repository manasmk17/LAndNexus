import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Link } from "wouter";

type PricingPlan = {
  name: string;
  description: string;
  price: string;
  features: string[];
  disabledFeatures: string[];
  ctaText: string;
  ctaLink: string;
  popular?: boolean;
  borderColor: string;
};

export default function Pricing() {
  const [pricingType, setPricingType] = useState<"professional" | "company">("professional");

  // Fetch subscription plans from API
  const { data: allPlans = [], isLoading, error } = useQuery<any[]>({
    queryKey: ["/api/subscription-plans"],
    enabled: true
  });

  // Transform database plans to component format
  const professionalPlans: PricingPlan[] = allPlans
    .filter(plan => plan.planType === "professional" && plan.name !== "Starter")
    .map(plan => ({
      name: plan.name,
      description: plan.description || `Perfect for ${plan.name.toLowerCase()} professionals`,
      price: `$${(plan.priceMonthlyUSD / 100).toFixed(0)}`,
      features: [
        plan.maxJobApplications ? `Apply to ${plan.maxJobApplications} jobs per month` : "Unlimited job applications",
        plan.aiMatchingEnabled !== false ? "AI job matching" : "",
        plan.maxResourceDownloads ? `${plan.maxResourceDownloads} resource downloads per month` : "Unlimited resource downloads",
        plan.directMessaging !== false ? "Direct messaging" : "",
        plan.supportLevel || "Priority email support"
      ].filter(Boolean),
      disabledFeatures: [
        !plan.videoConsultations ? "Video consultations" : "",
        !plan.featuredPlacement ? "Featured placement" : "",
      ].filter(Boolean),
      ctaText: `Get ${plan.name}`,
      ctaLink: "/subscription-plans",
      popular: plan.name === "Expert",
      borderColor: plan.name === "Expert" ? "border-primary" : "border-gray-300",
    }));

  const companyPlans: PricingPlan[] = allPlans
    .filter(plan => plan.planType === "company")
    .map(plan => ({
      name: plan.name,
      description: plan.description || `Perfect for ${plan.name.toLowerCase()} companies`,
      price: `$${(plan.priceMonthlyUSD / 100).toFixed(0)}`,
      features: [
        plan.maxJobPostings ? `${plan.maxJobPostings} active job postings` : "Unlimited job postings",
        plan.maxContacts ? `Search ${plan.maxContacts} professionals per month` : "Unlimited professional contacts",
        plan.customBranding ? "Enhanced branding" : "Basic company profile",
        plan.maxTeamMembers ? `${plan.maxTeamMembers} team members` : "Unlimited team members",
        plan.supportLevel || "Email support"
      ].filter(Boolean),
      disabledFeatures: [
        !plan.analyticsAccess ? "Analytics dashboard" : "",
        !plan.customBranding ? "Enhanced branding" : "",
      ].filter(Boolean),
      ctaText: plan.name === "Enterprise" ? "Contact Sales" : `Get ${plan.name}`,
      ctaLink: "/subscription-plans",
      popular: plan.name === "Growth",
      borderColor: plan.name === "Growth" ? "border-primary" : "border-gray-300",
    }));

  const plans = pricingType === "professional" ? professionalPlans : companyPlans;

  // Show loading state while fetching plans
  if (isLoading) {
    return (
      <section className="py-20 bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-lg">Loading pricing plans...</span>
          </div>
        </div>
      </section>
    );
  }

  // Show error state if API fails
  if (error) {
    return (
      <section className="py-20 bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-destructive mb-4">Unable to Load Pricing</h2>
            <p className="text-muted-foreground">Please refresh the page or try again later.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="pricing" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-heading font-bold text-center mb-4">Plans & Pricing</h2>
        <p className="text-gray-600 text-center max-w-2xl mx-auto mb-10">
          Choose the right plan for your L&D needs.
        </p>
        
        {/* Tabs */}
        <div className="flex justify-center mb-10">
          <Tabs 
            defaultValue="professional" 
            className="w-full max-w-md"
            onValueChange={(value) => setPricingType(value as "professional" | "company")}
          >
            <TabsList className="grid w-full grid-cols-2 h-auto gap-1 p-1">
              <TabsTrigger value="professional" className="text-xs sm:text-sm px-2 py-2">
                <span className="hidden sm:inline">L&D Professionals</span>
                <span className="sm:hidden">Professionals</span>
              </TabsTrigger>
              <TabsTrigger value="company" className="text-xs sm:text-sm px-2 py-2">
                <span className="hidden sm:inline">Companies</span>
                <span className="sm:hidden">Company</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <Card key={index} className={`relative hover:shadow-lg transition-shadow border-t-4 ${plan.borderColor}`}>
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-primary text-white text-xs px-3 py-1 font-bold">
                  POPULAR
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl font-heading font-bold mb-2">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4 mb-2">
                  <span className="text-3xl font-heading font-bold">{plan.price}</span>
                  <span className="text-gray-500">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle className="text-green-500 mr-2 text-sm mt-1 h-5 w-5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {plan.disabledFeatures.map((feature, i) => (
                    <li key={i} className="flex items-start text-gray-400">
                      <XCircle className="text-gray-300 mr-2 text-sm mt-1 h-5 w-5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Link href={plan.ctaLink}>
                  <Button
                    variant={plan.popular ? "default" : "outline"}
                    className="w-full font-medium"
                  >
                    {plan.ctaText}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
