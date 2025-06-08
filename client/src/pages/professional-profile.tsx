import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import ProfessionalProfileComponent from "@/components/profile/professional-profile";

export default function ProfessionalProfile() {
  // Get the professional ID from URL parameters
  const params = useParams<{ id: string }>();
  const professionalId = params?.id ? parseInt(params.id) : 0;

  if (!professionalId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-2">Invalid Profile ID</h1>
          <p className="text-gray-600">The requested profile could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <ProfessionalProfileComponent professionalId={professionalId} />
    </div>
  );
}
