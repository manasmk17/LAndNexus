
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function LoginSuccessPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Auto-redirect after countdown
          if (user?.isAdmin) {
            setLocation("/admin-dashboard");
          } else if (user?.userType === "professional") {
            setLocation("/professional-dashboard");
          } else {
            setLocation("/company-dashboard");
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [user, setLocation]);

  const handleRedirect = () => {
    if (user?.isAdmin) {
      setLocation("/admin-dashboard");
    } else if (user?.userType === "professional") {
      setLocation("/professional-dashboard");
    } else {
      setLocation("/company-dashboard");
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-700">Login Successful!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Welcome back, <span className="font-semibold">{user?.firstName || user?.username}</span>!
            </p>
            <p className="text-sm text-gray-500">
              You will be redirected to your dashboard in {countdown} seconds...
            </p>
            <Button onClick={handleRedirect} className="w-full">
              Go to Dashboard Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
