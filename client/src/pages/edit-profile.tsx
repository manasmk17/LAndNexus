import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import EditProfileForm from "@/components/profile/edit-profile-form";

export default function EditProfile() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login?redirect=/edit-profile");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return <EditProfileForm />;
}
