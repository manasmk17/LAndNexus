import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import JobCard from "./job-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { JobPosting } from "@shared/schema";

export default function FeaturedJobs() {
  const { data: jobs, isLoading, error } = useQuery<JobPosting[]>({
    queryKey: ["/api/job-postings/latest?limit=3"],
  });

  return (
    <section className="py-12 sm:py-16 bg-white">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 sm:mb-10 gap-4">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-center sm:text-left">Latest L&D Opportunities</h2>
          <Link href="/jobs" className="text-primary hover:text-primary-dark flex items-center justify-center sm:justify-start text-sm sm:text-base">
            View all jobs
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200">
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <div className="flex items-start flex-1 min-w-0">
                    <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex-shrink-0" />
                    <div className="ml-3 sm:ml-4 space-y-2 flex-1 min-w-0">
                      <Skeleton className="h-5 sm:h-6 w-full max-w-[200px]" />
                      <Skeleton className="h-4 w-full max-w-[150px]" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-16 sm:w-20 ml-2 flex-shrink-0" />
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                  <Skeleton className="h-16 w-full" />
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                  <div className="flex gap-2 sm:gap-3">
                    <Skeleton className="h-9 sm:h-10 flex-1" />
                    <Skeleton className="h-9 sm:h-10 w-9 sm:w-10" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500 text-sm sm:text-base">Failed to load job postings. Please try again later.</p>
          </div>
        ) : jobs && jobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm sm:text-base">No job postings available yet. Check back soon!</p>
          </div>
        )}
      </div>
    </section>
  );
}
