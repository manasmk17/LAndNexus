import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import LoginForm from "@/components/auth/login-form";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, Info } from "lucide-react";

export default function Login() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [urlMessage, setUrlMessage] = useState<string | null>(null);
  
  // Get redirect from query parameters
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get("redirect");

  // Handle URL messages on component mount
  useEffect(() => {
    const message = params.get('message');
    
    if (message) {
      setUrlMessage(message);
      
      // Show appropriate toast based on message
      switch (message) {
        case 'email_verified':
          toast({
            title: "Email Verified Successfully",
            description: "Your email has been verified. You can now log in to your account.",
          });
          break;
        case 'already_verified':
          toast({
            title: "Email Already Verified", 
            description: "Your email is already verified. You can log in normally.",
          });
          break;
        case 'verification_failed':
          toast({
            variant: "destructive",
            title: "Email Verification Failed",
            description: "The verification link is invalid or has expired. Please request a new one.",
          });
          break;
      }
      
      // Clear the URL parameter after showing message
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('message');
      window.history.replaceState({}, document.title, newUrl.toString());
    }
  }, [toast]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (redirect) {
        setLocation(redirect);
      } else if (user.isAdmin) {
        setLocation("/admin");
      } else if (user.userType === "professional") {
        setLocation("/professional-dashboard");
      } else {
        setLocation("/company-dashboard");
      }
    }
  }, [user, redirect, setLocation]);

  // Render message alert based on URL parameter
  const renderMessageAlert = () => {
    if (!urlMessage) return null;

    switch (urlMessage) {
      case 'email_verified':
        return (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Email Verified!</strong> Your account has been activated. You can now log in.
            </AlertDescription>
          </Alert>
        );
      case 'already_verified':
        return (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Your email is already verified. Please log in with your credentials.
            </AlertDescription>
          </Alert>
        );
      case 'verification_failed':
        return (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Verification Failed.</strong> The link is invalid or expired. Please request a new verification email.
            </AlertDescription>
          </Alert>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome Back to the Marketplace</h1>
          <p className="text-gray-600">
            Continue connecting with top L&D experts across UAE and MENA region
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          {renderMessageAlert()}
          
          <LoginForm />
          
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Create Account
              </Link>
            </p>
            <div className="mt-2 text-sm">
              <Link href="/forgot-password" className="text-primary hover:underline">
                Forgot password?
              </Link>
              {" • "}
              <Link href="/recover-username" className="text-primary hover:underline">
                Forgot username?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}