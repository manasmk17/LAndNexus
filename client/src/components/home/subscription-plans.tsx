
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckIcon } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

type PricingPlan = {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  buttonText: string;
  mostPopular: boolean;
};

const plans: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    description: "Essential tools for L&D professionals",
    features: [
      "Basic profile",
      "5 job applications per month",
      "Access to community forum",
    ],
    buttonText: "Current Plan", 
    mostPopular: false
  },
  {
    id: "pro",
    name: "Pro",
    price: 29,
    description: "Everything you need to succeed",
    features: [
      "Enhanced profile with portfolio",
      "Unlimited job applications",
      "Video introduction",
      "Early access to job opportunities",
      "Profile analytics"
    ],
    buttonText: "Subscribe Now",
    mostPopular: true
  },
  {
    id: "premium",
    name: "Premium", 
    price: 79,
    description: "For established professionals",
    features: [
      "All Pro features",
      "Featured profile placement",
      "Direct consultation bookings", 
      "Publish resources & articles",
      "Priority customer support"
    ],
    buttonText: "Subscribe Now",
    mostPopular: false
  }
];

export default function SubscriptionPlans() {
  const { user } = useAuth();
  
  return (
    <section id="pricing" className="py-24 bg-gradient-to-b from-background to-muted">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Plans & Pricing
          </h2>
          <p className="text-muted-foreground text-lg">
            Choose the perfect plan for your L&D professional journey
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
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
                  {plan.price !== 0 && <span className="ml-1 text-muted-foreground">/month</span>}
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
                {plan.id === "free" ? (
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    size="lg"
                    disabled
                  >
                    {plan.buttonText}
                  </Button>
                ) : (
                  <Button 
                    asChild={!!user}
                    className="w-full" 
                    size="lg"
                    onClick={!user ? () => window.location.href = "/login" : undefined}
                  >
                    {user ? (
                      <Link href={`/subscribe/${plan.id}`}>{plan.buttonText}</Link>
                    ) : (
                      plan.buttonText
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
        
        {!user && (
          <div className="text-center mt-8 text-muted-foreground">
            <p>Please <Link href="/login" className="underline text-primary">log in</Link> to subscribe to a plan.</p>
          </div>
        )}
      </div>
    </section>
  );
}
