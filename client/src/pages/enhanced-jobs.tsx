import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Building, 
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Star,
  X,
  Briefcase,
  ArrowUpDown
} from "lucide-react";
import { JobPosting } from "@shared/schema";
import { Link } from "wouter";

interface JobsResponse {
  jobs: JobPosting[];
  total: number;
  page: number;
  totalPages: number;
}

export default function EnhancedJobs() {
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [minCompensation, setMinCompensation] = useState("");
  const [maxCompensation, setMaxCompensation] = useState("");
  const [compensationUnit, setCompensationUnit] = useState("yearly");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Build query parameters for API
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.append("search", searchTerm.trim());
    if (locationFilter.trim()) params.append("location", locationFilter.trim());
    if (jobTypeFilter && jobTypeFilter !== "all") params.append("jobType", jobTypeFilter);
    if (remoteOnly) params.append("remote", "true");
    if (featuredOnly) params.append("featured", "true");
    if (minCompensation) params.append("minCompensation", minCompensation);
    if (maxCompensation) params.append("maxCompensation", maxCompensation);
    if (compensationUnit) params.append("compensationUnit", compensationUnit);
    params.append("sortBy", sortBy);
    params.append("sortOrder", sortOrder);
    params.append("page", currentPage.toString());
    params.append("limit", "10");
    return params.toString();
  };

  // Fetch jobs with advanced filtering
  const { data: jobsData, isLoading, error } = useQuery<JobsResponse>({
    queryKey: ["/api/job-postings", buildQueryParams()],
    queryFn: async () => {
      const response = await fetch(`/api/job-postings?${buildQueryParams()}`);
      if (!response.ok) throw new Error('Failed to fetch jobs');
      const data = await response.json();
      
      // Handle both old array format and new paginated format
      if (Array.isArray(data)) {
        return {
          jobs: data,
          total: data.length,
          page: 1,
          totalPages: 1
        };
      }
      return data;
    },
  });

  const jobs = jobsData?.jobs || [];
  const totalJobs = jobsData?.total || 0;
  const totalPages = jobsData?.totalPages || 1;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, locationFilter, jobTypeFilter, remoteOnly, featuredOnly, minCompensation, maxCompensation, sortBy, sortOrder]);

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm("");
    setLocationFilter("");
    setJobTypeFilter("");
    setRemoteOnly(false);
    setFeaturedOnly(false);
    setMinCompensation("");
    setMaxCompensation("");
    setCompensationUnit("yearly");
    setSortBy("createdAt");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (searchTerm.trim()) count++;
    if (locationFilter.trim()) count++;
    if (jobTypeFilter && jobTypeFilter !== "all") count++;
    if (remoteOnly) count++;
    if (featuredOnly) count++;
    if (minCompensation) count++;
    if (maxCompensation) count++;
    return count;
  };

  const formatSalary = (min: number | null, max: number | null, unit: string | null) => {
    if (!min && !max) return "Salary not specified";
    
    const formatNumber = (num: number) => {
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
      if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
      return num.toString();
    };

    const unitLabel = unit === "yearly" ? "/year" : unit === "monthly" ? "/month" : unit === "hourly" ? "/hour" : "";
    
    if (min && max) {
      return `$${formatNumber(min)} - $${formatNumber(max)}${unitLabel}`;
    }
    if (min) return `$${formatNumber(min)}+${unitLabel}`;
    if (max) return `Up to $${formatNumber(max)}${unitLabel}`;
    return "Competitive salary";
  };

  const jobTypeOptions = [
    { value: "", label: "All Types" },
    { value: "full-time", label: "Full Time" },
    { value: "part-time", label: "Part Time" },
    { value: "contract", label: "Contract" },
    { value: "freelance", label: "Freelance" },
    { value: "internship", label: "Internship" }
  ];

  const sortOptions = [
    { value: "createdAt", label: "Date Posted" },
    { value: "title", label: "Job Title" },
    { value: "location", label: "Location" },
    { value: "compensation", label: "Compensation" }
  ];

  const compensationUnits = [
    { value: "hourly", label: "Per Hour" },
    { value: "monthly", label: "Per Month" },
    { value: "yearly", label: "Per Year" }
  ];

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-600">Error loading jobs: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Find Your Next L&D Opportunity</h1>
        <p className="text-muted-foreground">
          Discover {totalJobs} learning and development positions from top companies
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Search & Filters
              {getActiveFilterCount() > 0 && (
                <Badge variant="secondary">
                  {getActiveFilterCount()} active
                </Badge>
              )}
            </CardTitle>
            <Collapsible open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  Advanced
                  {showAdvancedFilters ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Basic Search */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Jobs</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Search by title, description, requirements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="location"
                  placeholder="Enter city, state, or remote..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <Collapsible open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
            <CollapsibleContent className="space-y-4">
              <Separator />
              
              {/* Job Type and Remote */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Job Type</Label>
                  <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
                    <SelectTrigger>
                      <Briefcase className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Work Preferences</Label>
                  <div className="flex items-center space-x-4 pt-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={remoteOnly}
                        onCheckedChange={setRemoteOnly}
                      />
                      <Label>Remote Only</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={featuredOnly}
                        onCheckedChange={setFeaturedOnly}
                      />
                      <Label className="flex items-center gap-1">
                        <Star className="h-4 w-4" />
                        Featured
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compensation Range */}
              <div className="space-y-4">
                <Label>Compensation Range</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Minimum</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        type="number"
                        placeholder="Min compensation"
                        value={minCompensation}
                        onChange={(e) => setMinCompensation(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Maximum</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        type="number"
                        placeholder="Max compensation"
                        value={maxCompensation}
                        onChange={(e) => setMaxCompensation(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Select value={compensationUnit} onValueChange={setCompensationUnit}>
                      <SelectTrigger>
                        <SelectValue placeholder="Per..." />
                      </SelectTrigger>
                      <SelectContent>
                        {compensationUnits.map((unit) => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Sorting */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sort By</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Sort Order</Label>
                  <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as "asc" | "desc")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Order..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Newest First</SelectItem>
                      <SelectItem value="asc">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Clear Filters */}
          {getActiveFilterCount() > 0 && (
            <div className="flex justify-end pt-4 border-t">
              <Button variant="outline" onClick={clearAllFilters} className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Clear All Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {jobs.length} of {totalJobs} jobs
          {currentPage > 1 && ` (Page ${currentPage} of ${totalPages})`}
        </p>
        {isLoading && <span className="text-sm text-muted-foreground">Loading...</span>}
      </div>

      {/* Job Listings */}
      <div className="space-y-4">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : jobs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="space-y-2">
                <Briefcase className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="text-lg font-semibold">No jobs found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search criteria or filters to find more opportunities.
                </p>
                {getActiveFilterCount() > 0 && (
                  <Button variant="outline" onClick={clearAllFilters} className="mt-4">
                    Clear All Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          jobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-semibold">
                          <Link href={`/job/${job.id}`} className="hover:text-primary">
                            {job.title}
                          </Link>
                        </h3>
                        {job.featured && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            Featured
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          Company ID: {job.companyId}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {job.location}
                        </div>
                        {job.remote && (
                          <Badge variant="outline">Remote</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-semibold text-green-600">
                        {formatSalary(job.minCompensation, job.maxCompensation, job.compensationUnit)}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {new Date(job.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-muted-foreground line-clamp-2">
                    {job.description}
                  </p>

                  {/* Tags */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {job.jobType && (
                      <Badge variant="outline">{job.jobType}</Badge>
                    )}
                    <Badge variant="outline" className="capitalize">
                      {job.status}
                    </Badge>
                  </div>

                  {/* Action */}
                  <div className="flex justify-end">
                    <Button asChild>
                      <Link href={`/job/${job.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
          >
            Previous
          </Button>
          <span className="px-4 py-2 text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}