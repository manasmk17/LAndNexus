import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import ProfessionalDashboardContent from "@/components/dashboard/professional-dashboard";

export default function ProfessionalDashboard() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();

  // Redirect if not logged in or not a professional
  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login?redirect=/professional-dashboard");
    } else if (!isLoading && user && user.userType !== "professional") {
      setLocation("/company-dashboard");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Loading your dashboard..." />
      </div>
    );
  }

  if (!user || user.userType !== "professional") {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <ProfessionalDashboardContent />
    </div>
  );
}
