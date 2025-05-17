import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowRight, Star, CheckCircle } from "lucide-react";
import ProfessionalCard from "./professional-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { ProfessionalProfile } from "@shared/schema";

export default function FeaturedProfessionals() {
  const { data: professionals, isLoading, error } = useQuery<ProfessionalProfile[]>({
    queryKey: ["/api/professional-profiles/featured?limit=3"],
  });

  return (
    <section className="ld-section bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="ld-section-heading">Meet Our Featured Experts</h2>
          <p className="ld-section-subheading">Connect with top-rated Learning & Development professionals who can transform your organization</p>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div className="flex flex-col items-center p-6">
                  <Skeleton className="w-24 h-24 rounded-full" />
                  <div className="mt-4 space-y-2 text-center">
                    <Skeleton className="h-6 w-36 mx-auto" />
                    <Skeleton className="h-4 w-48 mx-auto" />
                    <Skeleton className="h-4 w-24 mx-auto" />
                  </div>
                </div>
                <div className="p-6 space-y-4 border-t border-gray-100">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">Failed to load professionals. Please try again later.</p>
          </div>
        ) : professionals && professionals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {professionals.map((professional) => (
              <div key={professional.id} className="ld-profile-card relative">
                {professional.featured && (
                  <div className="absolute -top-3 -right-3 bg-primary text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg flex items-center">
                    <Star className="h-3 w-3 mr-1 fill-white" />
                    Featured
                  </div>
                )}
                
                <div className="w-24 h-24 rounded-full bg-blue-50 border-4 border-white shadow-md overflow-hidden mb-4">
                  {professional.profileImageUrl ? (
                    <img
                      src={professional.profileImageUrl}
                      alt={`${professional.firstName} ${professional.lastName}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-xl">
                      {professional.firstName?.charAt(0) || ''}{professional.lastName?.charAt(0) || ''}
                    </div>
                  )}
                </div>
                
                <h3 className="text-xl font-semibold text-gray-800">
                  {professional.firstName} {professional.lastName}
                </h3>
                
                <p className="text-primary font-medium">{professional.title || "L&D Professional"}</p>
                
                {professional.verified && (
                  <div className="ld-verified-badge mt-1 mb-3 flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified Expert
                  </div>
                )}
                
                <p className="text-gray-600 text-sm mt-4 mb-6 line-clamp-2">
                  {professional.bio || "Experienced Learning & Development professional with expertise in corporate training and professional development."}
                </p>
                
                <div className="flex flex-wrap gap-2 justify-center mb-6">
                  {/* Expertise tags */}
                  <span className="ld-badge-blue">Leadership</span>
                  <span className="ld-badge-purple">Corporate Training</span>
                  <span className="ld-badge-amber">Workshop Facilitation</span>
                </div>
                
                <Button className="ld-button-secondary w-full" asChild>
                  <Link href={`/professional-profile/${professional.id}`}>
                    View Profile
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No featured professionals yet. Check back soon!</p>
          </div>
        )}
        
        <div className="text-center mt-12">
          <Button className="ld-button-primary" asChild>
            <Link href="/professionals">
              Browse All Professionals
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
