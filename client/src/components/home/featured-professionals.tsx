import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import ProfessionalCard from "./professional-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProfessionalProfile } from "@shared/schema";

export default function FeaturedProfessionals() {
  const { data: professionals, isLoading, error } = useQuery<ProfessionalProfile[]>({
    queryKey: ["/api/professional-profiles/featured?limit=3"],
  });

  return (
    <section className="py-8 sm:py-12 lg:py-16 bg-gray-50">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-6 sm:mb-8 lg:mb-10 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold text-center sm:text-left">
              Featured Verified L&D Experts & International Certified Professionals
            </h2>
          </div>
          <Link 
            href="/professionals" 
            className="text-primary hover:text-primary-dark flex items-center justify-center sm:justify-start text-sm sm:text-base font-medium transition-colors"
          >
            View all
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="flex items-center p-4 sm:p-6 border-b border-gray-200">
                  <Skeleton className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex-shrink-0" />
                  <div className="ml-3 sm:ml-4 space-y-2 flex-1">
                    <Skeleton className="h-5 sm:h-6 w-3/4" />
                    <Skeleton className="h-3 sm:h-4 w-full" />
                    <Skeleton className="h-3 sm:h-4 w-1/2" />
                  </div>
                </div>
                <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                  <Skeleton className="h-3 sm:h-4 w-full" />
                  <Skeleton className="h-3 sm:h-4 w-full" />
                  <Skeleton className="h-3 sm:h-4 w-3/4" />
                  <Skeleton className="h-9 sm:h-10 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-6 sm:py-8">
            <p className="text-red-500 text-sm sm:text-base">Failed to load professionals. Please try again later.</p>
          </div>
        ) : professionals && professionals.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {professionals.map((professional) => (
              <ProfessionalCard key={professional.id} professional={professional} />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8">
            <p className="text-gray-500 text-sm sm:text-base">No featured professionals yet. Check back soon!</p>
          </div>
        )}
      </div>
    </section>
  );
}
