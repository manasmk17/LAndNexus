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
    id: "professional",
    name: "Professional",
    price: 19,
    description: "Perfect for individual L&D professionals getting started",
    features: [
      "Apply to 15 jobs per month",
      "AI job matching",
      "50 resource downloads per month",
      "Direct messaging",
      "Priority email support"
    ],
    buttonText: "Get Started",
    mostPopular: false
  },
  {
    id: "expert",
    name: "Expert",
    price: 49,
    description: "Advanced features for experienced professionals",
    features: [
      "Unlimited job applications",
      "Featured profile placement",
      "Unlimited resource downloads",
      "Video consultations",
      "Advanced analytics",
      "Phone support"
    ],
    buttonText: "Get Expert",
    mostPopular: true
  },
  {
    id: "elite",
    name: "Elite",
    price: 99,
    description: "Premium features for top-tier professionals",
    features: [
      "Everything in Expert",
      "Personal account manager",
      "API access",
      "White-label platform",
      "Custom branding",
      "24/7 support"
    ],
    buttonText: "Get Elite",
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
            Pricing Plans
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
                {plan.id === "enterprise" ? (
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    size="lg"
                    onClick={() => window.location.href = "/contact"}
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
                      <Link href="/subscription-plans">{plan.buttonText}</Link>
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