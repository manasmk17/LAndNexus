import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { JobPosting, CompanyProfile, JobApplication, ProfessionalProfile } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  Trash2,
  MoreHorizontal,
  Star,
  RefreshCw,
  Search,
  X,
  Building2,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle2,
  XCircle,
  Tag,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function JobManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch job postings
  const { data: jobs = [], isLoading: isLoadingJobs } = useQuery({
    queryKey: ['/api/admin/job-postings'],
    queryFn: getQueryFn<JobPosting[]>({ on401: "throw" }),
  });

  // Fetch companies for company info
  const { data: companies = [] } = useQuery({
    queryKey: ['/api/admin/company-profiles'],
    queryFn: getQueryFn<CompanyProfile[]>({ on401: "throw" }),
  });

  // Fetch job applications for the selected job
  const { data: jobApplications = [] } = useQuery({
    queryKey: ['/api/job-postings', selectedJob?.id, 'applications'],
    queryFn: getQueryFn<JobApplication[]>({ on401: "throw" }),
    enabled: !!selectedJob,
  });

  // Filter jobs based on search and tabs
  const filteredJobs = jobs
    .filter(job => 
      (selectedTab === "all") ||
      (selectedTab === "featured" && job.featured) ||
      (selectedTab === "open" && job.status === "open") ||
      (selectedTab === "closed" && job.status === "closed") ||
      (selectedTab === "filled" && job.status === "filled")
    )
    .filter(job => 
      !searchQuery || 
      job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.requirements?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getCompanyName(job.companyId)?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Toggle featured status mutation
  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, featured }: { id: number; featured: boolean }) => {
      const response = await apiRequest("PUT", `/api/admin/job-postings/${id}/featured`, {
        featured,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/job-postings'] });
      toast({
        title: "Job Updated",
        description: "Featured status has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update featured status",
        variant: "destructive",
      });
    },
  });

  // Update job status mutation
  const updateJobStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PUT", `/api/admin/job-postings/${id}/status`, {
        status,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/job-postings'] });
      toast({
        title: "Job Updated",
        description: "Job status has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update job status",
        variant: "destructive",
      });
    },
  });

  // Delete job mutation
  const deleteJobMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/job-postings/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/job-postings'] });
      setIsDeleteDialogOpen(false);
      setSelectedJob(null);
      toast({
        title: "Job Deleted",
        description: "The job posting has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete job",
        variant: "destructive",
      });
    },
  });

  // View job details
  const handleViewJob = (job: JobPosting) => {
    setSelectedJob(job);
    setIsViewDialogOpen(true);
  };

  // Handle delete job
  const handleDeleteJob = (job: JobPosting) => {
    setSelectedJob(job);
    setIsDeleteDialogOpen(true);
  };

  // Get company name by ID
  const getCompanyName = (companyId: number) => {
    const company = companies.find(c => c.id === companyId);
    return company ? company.companyName : 'Unknown Company';
  };

  // Format compensation for display
  const formatCompensation = (job: JobPosting) => {
    if (!job.minCompensation && !job.maxCompensation) return 'Not specified';
    
    const unit = job.compensationUnit 
      ? job.compensationUnit === 'hourly' 
        ? '/hour' 
        : job.compensationUnit === 'yearly' 
          ? '/year' 
          : ' ' + job.compensationUnit
      : '';
    
    if (job.minCompensation && job.maxCompensation) {
      return `$${job.minCompensation} - $${job.maxCompensation}${unit}`;
    } else if (job.minCompensation) {
      return `From $${job.minCompensation}${unit}`;
    } else if (job.maxCompensation) {
      return `Up to $${job.maxCompensation}${unit}`;
    }
    
    return 'Not specified';
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Job Management</CardTitle>
          <CardDescription>
            Manage all job postings on the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search jobs..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/job-postings'] })}
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid grid-cols-5">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="open">Open</TabsTrigger>
                <TabsTrigger value="filled">Filled</TabsTrigger>
                <TabsTrigger value="closed">Closed</TabsTrigger>
                <TabsTrigger value="featured">Featured</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Posted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingJobs ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        <div className="flex justify-center">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredJobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No job postings found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>
                          <div className="font-medium">{job.title}</div>
                          {job.featured && (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200 ml-1">
                              <Star className="mr-1 h-3 w-3" /> Featured
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{getCompanyName(job.companyId)}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
                            {job.remote ? 'Remote' : job.location}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{job.jobType}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              job.status === 'open' 
                                ? 'default' 
                                : job.status === 'filled' 
                                  ? 'secondary' 
                                  : 'outline'
                            }
                          >
                            {job.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {job.createdAt ? format(new Date(job.createdAt), 'MMM d, yyyy') : 'Unknown'}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleViewJob(job)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  toggleFeaturedMutation.mutate({
                                    id: job.id,
                                    featured: !job.featured,
                                  })
                                }
                              >
                                <Star className="mr-2 h-4 w-4" />
                                {job.featured ? "Remove Featured" : "Make Featured"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>Set Status</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() =>
                                  updateJobStatusMutation.mutate({
                                    id: job.id,
                                    status: "open",
                                  })
                                }
                                disabled={job.status === "open"}
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Mark as Open
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  updateJobStatusMutation.mutate({
                                    id: job.id,
                                    status: "filled",
                                  })
                                }
                                disabled={job.status === "filled"}
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Mark as Filled
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  updateJobStatusMutation.mutate({
                                    id: job.id,
                                    status: "closed",
                                  })
                                }
                                disabled={job.status === "closed"}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Mark as Closed
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDeleteJob(job)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Job
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Job Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
            <DialogDescription>
              Complete information about the selected job posting
            </DialogDescription>
          </DialogHeader>
          
          {selectedJob && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{selectedJob.title}</h2>
                <Badge 
                  variant={
                    selectedJob.status === 'open' 
                      ? 'default' 
                      : selectedJob.status === 'filled' 
                        ? 'secondary' 
                        : 'outline'
                  }
                  className="ml-2"
                >
                  {selectedJob.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">{getCompanyName(selectedJob.companyId)}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">{selectedJob.remote ? 'Remote' : selectedJob.location}</span>
                </div>
                <div className="flex items-center">
                  <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">{selectedJob.jobType}</span>
                </div>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">{formatCompensation(selectedJob)}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">Posted: {selectedJob.createdAt ? format(new Date(selectedJob.createdAt), 'MMM d, yyyy') : 'Unknown'}</span>
                </div>
                {selectedJob.duration && (
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">Duration: {selectedJob.duration}</span>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-base font-medium mb-1">Description</h3>
                <div className="text-sm text-muted-foreground border rounded-md p-3 bg-muted/30">
                  {selectedJob.description}
                </div>
              </div>

              <div>
                <h3 className="text-base font-medium mb-1">Requirements</h3>
                <div className="text-sm text-muted-foreground border rounded-md p-3 bg-muted/30">
                  {selectedJob.requirements}
                </div>
              </div>

              <div>
                <h3 className="text-base font-medium mb-2">Job Applications ({jobApplications.length})</h3>
                {jobApplications.length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Applicant</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Applied</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {jobApplications.map((application) => (
                          <TableRow key={application.id}>
                            <TableCell>
                              <div className="font-medium">Professional ID: {application.professionalId}</div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  application.status === 'accepted' 
                                    ? 'default' 
                                    : application.status === 'rejected' 
                                      ? 'destructive' 
                                      : application.status === 'reviewed'
                                        ? 'secondary'
                                        : 'outline'
                                }
                              >
                                {application.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {application.createdAt ? format(new Date(application.createdAt), 'MMM d, yyyy') : 'Unknown'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No applications received yet.</p>
                )}
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between">
                  <div>
                    <h3 className="text-base font-medium mb-2">Update Status</h3>
                    <Select 
                      value={selectedJob.status}
                      onValueChange={(value) => {
                        updateJobStatusMutation.mutate({
                          id: selectedJob.id,
                          status: value,
                        });
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="filled">Filled</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button
                    variant={selectedJob.featured ? "outline" : "default"}
                    onClick={() =>
                      toggleFeaturedMutation.mutate({
                        id: selectedJob.id,
                        featured: !selectedJob.featured,
                      })
                    }
                  >
                    <Star className="mr-2 h-4 w-4" />
                    {selectedJob.featured ? "Remove Featured" : "Make Featured"}
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            {selectedJob && (
              <Button
                variant="destructive"
                onClick={() => {
                  setIsViewDialogOpen(false);
                  handleDeleteJob(selectedJob);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Job
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => setIsViewDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Job Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the job posting and all associated applications. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedJob) {
                  deleteJobMutation.mutate(selectedJob.id);
                }
              }}
              className="bg-red-600 focus:ring-red-600"
            >
              {deleteJobMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>Delete</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}