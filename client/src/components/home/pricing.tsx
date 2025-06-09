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

  const professionalPlans: PricingPlan[] = [
    {
      name: "Professional",
      description: "Perfect for individual L&D professionals getting started",
      price: "$19",
      features: [
        "Apply to 15 jobs per month",
        "AI job matching",
        "50 resource downloads per month",
        "Direct messaging",
        "Priority email support"
      ],
      disabledFeatures: [
        "Video consultations",
        "Featured placement",
      ],
      ctaText: "Get Started",
      ctaLink: "/subscription-plans",
      borderColor: "border-gray-300",
    },
    {
      name: "Expert",
      description: "Advanced features for experienced professionals",
      price: "$49",
      features: [
        "Unlimited job applications",
        "Featured profile placement",
        "Unlimited resource downloads",
        "Video consultations",
        "Advanced analytics",
        "Phone support"
      ],
      disabledFeatures: [],
      ctaText: "Get Expert",
      ctaLink: "/subscription-plans",
      popular: true,
      borderColor: "border-primary",
    },
    {
      name: "Elite",
      description: "Premium features for top-tier professionals",
      price: "$99",
      features: [
        "Everything in Expert",
        "Personal account manager",
        "API access",
        "White-label platform",
        "Custom branding",
        "24/7 support"
      ],
      disabledFeatures: [],
      ctaText: "Get Elite",
      ctaLink: "/subscription-plans",
      borderColor: "border-teal-500",
    },
  ];

  const companyPlans: PricingPlan[] = [
    {
      name: "Startup",
      description: "Perfect for growing companies and startups",
      price: "$39",
      features: [
        "3 active job postings",
        "Search 100 professionals per month",
        "Basic company profile",
        "3 team members",
        "Email support"
      ],
      disabledFeatures: [
        "Analytics dashboard",
        "Enhanced branding",
      ],
      ctaText: "Get Started",
      ctaLink: "/subscription-plans",
      borderColor: "border-gray-300",
    },
    {
      name: "Growth",
      description: "Advanced features for expanding businesses",
      price: "$99",
      features: [
        "15 active job postings",
        "Search 500 professionals per month",
        "Enhanced branding",
        "8 team members",
        "Analytics dashboard",
        "Phone support"
      ],
      disabledFeatures: [],
      ctaText: "Get Growth",
      ctaLink: "/subscription-plans",
      popular: true,
      borderColor: "border-primary",
    },
    {
      name: "Enterprise",
      description: "Complete solution for large organizations",
      price: "$199",
      features: [
        "Unlimited job postings",
        "Unlimited professional contacts",
        "Advanced team management",
        "Custom integrations",
        "Dedicated account manager",
        "White-label solutions"
      ],
      disabledFeatures: [],
      ctaText: "Contact Sales",
      ctaLink: "/subscription-plans",
      borderColor: "border-teal-500",
    },
  ];

  const plans = pricingType === "professional" ? professionalPlans : companyPlans;

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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="professional">L&D Professionals</TabsTrigger>
              <TabsTrigger value="company">Companies</TabsTrigger>
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
