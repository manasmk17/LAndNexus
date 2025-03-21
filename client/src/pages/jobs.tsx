import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
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
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  PlusCircle, 
  Filter, 
  MapPin,
  Building,
  DollarSign,
  Clock
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import JobCard from "@/components/home/job-card";
import type { JobPosting, Expertise } from "@shared/schema";

export default function Jobs() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [jobType, setJobType] = useState<string>("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [expertiseFilter, setExpertiseFilter] = useState<string>("");

  // Fetch jobs and expertise areas
  const { data: jobs, isLoading: isLoadingJobs } = useQuery<JobPosting[]>({
    queryKey: ["/api/job-postings"],
  });

  const { data: expertiseAreas } = useQuery<Expertise[]>({
    queryKey: ["/api/expertise"],
  });

  // Filter jobs based on search and filters
  const filteredJobs = jobs?.filter(job => {
    const matchesSearch = !searchTerm || 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = !jobType || job.jobType === jobType;
    const matchesRemote = !remoteOnly || job.remote;
    const matchesExpertise = !expertiseFilter || job.requirements.toLowerCase().includes(expertiseFilter.toLowerCase());
    const isOpen = job.status === "open";

    return matchesSearch && matchesType && matchesRemote && matchesExpertise && isOpen;
  }) || [];

  const sortedJobs = [...filteredJobs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">L&D Job Opportunities</h1>
          <p className="text-gray-500">Find your next learning & development role</p>
        </div>

        {user?.userType === "company" && (
          <Link href="/post-job">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Post a Job
            </Button>
          </Link>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search jobs..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select value={jobType} onValueChange={setJobType}>
            <SelectTrigger>
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Job Type" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              <SelectItem value="full-time">Full-time</SelectItem>
              <SelectItem value="part-time">Part-time</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="freelance">Freelance</SelectItem>
            </SelectContent>
          </Select>

          <Select value={expertiseFilter} onValueChange={setExpertiseFilter}>
            <SelectTrigger>
              <div className="flex items-center">
                <Building className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Expertise Area" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Areas</SelectItem>
              {expertiseAreas?.map(area => (
                <SelectItem key={area.id} value={area.name}>
                  {area.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="remote"
              checked={remoteOnly}
              onCheckedChange={(checked) => setRemoteOnly(checked as boolean)}
            />
            <Label htmlFor="remote">Remote Only</Label>
          </div>
        </div>
      </div>

      {isLoadingJobs ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : sortedJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sortedJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No jobs found matching your criteria</p>
        </div>
      )}
    </div>
  );
}