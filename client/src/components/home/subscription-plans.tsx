import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckIcon } from "lucide-react";
import { Link } from "wouter";

type PricingPlan = {
  name: string;
  price: string;
  description: string;
  features: string[];
  buttonText: string;
  mostPopular: boolean;
};

const plans: PricingPlan[] = [
  {
    name: "Free",
    price: "0",
    description: "Essential tools for L&D professionals",
    features: [
      "Create a professional profile",
      "Browse job listings",
      "Access basic resources",
      "Join community forum"
    ],
    buttonText: "Get Started",
    mostPopular: false
  },
  {
    name: "Professional",
    price: "99.99",
    description: "Advanced features for serious L&D experts",
    features: [
      "Featured profile placement",
      "Early access to job listings",
      "Premium resource access",
      "Priority support",
      "Access to exclusive webinars",
      "Client messaging system"
    ],
    buttonText: "Upgrade Now",
    mostPopular: true
  },
  {
    name: "Enterprise",
    price: "299.99",
    description: "Comprehensive solution for teams",
    features: [
      "Multiple user accounts",
      "Custom branding",
      "Advanced analytics",
      "Dedicated account manager",
      "Custom training solutions",
      "Priority matching with companies"
    ],
    buttonText: "Contact Sales",
    mostPopular: false
  }
];

export default function SubscriptionPlans() {
  return (
    <section className="py-24 bg-gradient-to-b from-background to-muted">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Pricing Plans
          </h2>
          <p className="text-muted-foreground text-lg">
            Choose the perfect plan for your L&D professional journey
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`flex flex-col h-full ${
                plan.mostPopular ? "border-primary shadow-lg scale-105" : ""
              }`}
            >
              <CardHeader>
                {plan.mostPopular && (
                  <div className="py-1 px-3 bg-primary text-primary-foreground text-xs font-semibold rounded-full w-fit mb-2">
                    MOST POPULAR
                  </div>
                )}
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="flex items-baseline mt-2">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  {plan.price !== "0" && <span className="ml-1 text-muted-foreground">/month</span>}
                </div>
                <CardDescription className="mt-2">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex">
                      <CheckIcon className="h-5 w-5 text-primary shrink-0 mr-2" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {plan.name === "Professional" ? (
                  <Button asChild className="w-full" size="lg">
                    <Link href="/checkout">{plan.buttonText}</Link>
                  </Button>
                ) : (
                  <Button 
                    variant={plan.name === "Free" ? "outline" : "default"} 
                    className="w-full" 
                    size="lg"
                  >
                    {plan.buttonText}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}