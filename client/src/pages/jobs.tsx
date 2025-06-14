import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  PlusCircle, 
  Filter, 
  CalendarDays,
  MapPin
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import JobCard from "@/components/home/job-card";
import type { JobPosting } from "@shared/schema";

export default function Jobs() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [jobType, setJobType] = useState<string>("all");
  const [remoteOnly, setRemoteOnly] = useState(false);
  
  // Fetch all job postings
  const { 
    data: jobs, 
    isLoading: isLoadingJobs,
    error: jobsError
  } = useQuery<JobPosting[]>({
    queryKey: ["/api/job-postings"],
  });
  
  // Filter jobs based on search and filters
  const filteredJobs = (jobs || []).filter(job => {
    // Filter by search term
    const matchesSearch = !searchTerm || 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.requirements.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by job type
    const matchesType = jobType === "all" || job.jobType === jobType;
    
    // Filter by remote option
    const matchesRemote = !remoteOnly || job.remote;
    
    // Only show open jobs
    const isOpen = job.status === "open";
    
    return matchesSearch && matchesType && matchesRemote && isOpen;
  });
  
  // Sort jobs by created date (newest first)
  const sortedJobs = [...filteredJobs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  return (
    <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Top L&D Opportunities in MENA</h1>
          <p className="text-gray-500 text-sm sm:text-base">Connect instantly with elite learning and development projects across UAE and beyond</p>
        </div>
        
        {user?.userType === "company" && (
          <Link href="/post-job" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Post a Job
            </Button>
          </Link>
        )}
      </div>
      
      {/* Search and filter section */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm mb-6 sm:mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Search box */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search jobs by title, skills, or location..."
              className="pl-10 h-10 sm:h-11"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Filters container */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 sm:gap-4 lg:gap-3">
            {/* Job type filter */}
            <div className="flex-1 lg:w-full">
              <Select value={jobType} onValueChange={setJobType}>
                <SelectTrigger className="w-full h-10 sm:h-11">
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4 flex-shrink-0" />
                    <SelectValue placeholder="Job type" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Job Types</SelectItem>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="freelance">Freelance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Remote checkbox */}
            <div className="flex items-center justify-center sm:justify-start lg:justify-start min-h-[40px] sm:min-h-[44px]">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remote" 
                  checked={remoteOnly}
                  onCheckedChange={(checked) => setRemoteOnly(checked === true)}
                />
                <label
                  htmlFor="remote"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Remote only
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Results count */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-2">
        <p className="text-gray-500 text-sm sm:text-base">
          {sortedJobs.length} jobs found
        </p>
        {sortedJobs.length > 0 && (
          <p className="text-xs sm:text-sm text-gray-400">
            Updated {new Date().toLocaleDateString()}
          </p>
        )}
      </div>
      
      {/* Job listings */}
      <div className="space-y-4 sm:space-y-6">
        {isLoadingJobs ? (
          // Loading skeletons
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(6)].map((_, index) => (
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
                    <Skeleton className="h-6 w-14 rounded-full" />
                  </div>
                  <div className="flex gap-2 sm:gap-3">
                    <Skeleton className="h-9 sm:h-10 flex-1" />
                    <Skeleton className="h-9 sm:h-10 w-9 sm:w-10" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : jobsError ? (
          // Error state
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-red-500 mb-4">Failed to load job listings. Please try again later.</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </CardContent>
          </Card>
        ) : sortedJobs.length > 0 ? (
          // Job cards
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {sortedJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          // Empty state
          <Card className="mx-auto max-w-md">
            <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
              <p className="text-gray-500 mb-4 text-sm sm:text-base">
                No job listings found matching your criteria. Try adjusting your filters.
              </p>
              <Button 
                onClick={() => {
                  setSearchTerm("");
                  setJobType("all");
                  setRemoteOnly(false);
                }}
                className="w-full sm:w-auto"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Pagination (simplified for now) */}
      {sortedJobs.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mt-6 sm:mt-8">
          <Button variant="outline" size="sm" className="px-3 sm:px-4">1</Button>
          <Button variant="outline" size="sm" className="px-3 sm:px-4">2</Button>
          <Button variant="outline" size="sm" className="px-3 sm:px-4">3</Button>
          <Button variant="outline" size="sm" className="px-3 sm:px-4">Next</Button>
        </div>
      )}
    </div>
  );
}
