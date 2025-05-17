import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowRight, Briefcase, MapPin, Clock, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { JobPosting } from "@shared/schema";

export default function LatestJobs() {
  const { data: jobs, isLoading, error } = useQuery<JobPosting[]>({
    queryKey: ["/api/job-postings/latest?limit=2"],
  });

  return (
    <section className="ld-section bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="ld-section-heading">Latest Opportunities</h2>
          <p className="ld-section-subheading">
            Explore the newest L&D positions from top companies
          </p>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[...Array(2)].map((_, index) => (
              <div key={index} className="ld-card">
                <div className="flex items-start mb-4">
                  <Skeleton className="w-14 h-14 rounded-lg mr-4" />
                  <div className="flex-1">
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <div className="flex flex-wrap gap-2 mb-4">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">Failed to load jobs. Please try again later.</p>
          </div>
        ) : jobs && jobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {jobs.map((job) => (
              <div key={job.id} className="ld-card group">
                <div className="flex items-start mb-4">
                  <div className="w-14 h-14 rounded-lg bg-blue-100 flex items-center justify-center mr-4 text-primary">
                    <Briefcase className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-primary transition-colors">
                      {job.title}
                    </h3>
                    <p className="text-gray-600">{job.companyName || "Company Name"}</p>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4 line-clamp-2">
                  {job.description || "No description provided."}
                </p>
                
                <div className="flex flex-wrap gap-3 mb-6">
                  {job.location && (
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700">
                      <MapPin className="h-3.5 w-3.5 mr-1" />
                      {job.location}
                    </div>
                  )}
                  
                  {job.jobType && (
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      {job.jobType}
                    </div>
                  )}
                  
                  {job.salary && (
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-700">
                      <DollarSign className="h-3.5 w-3.5 mr-1" />
                      {job.salary}
                    </div>
                  )}
                </div>
                
                <Button className="ld-button-primary w-full" asChild>
                  <Link href={`/job-detail/${job.id}`}>
                    View Details
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No job postings available yet. Check back soon!</p>
          </div>
        )}
        
        <div className="text-center mt-12">
          <Button className="ld-button-secondary" asChild>
            <Link href="/jobs">
              Browse All Jobs
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}