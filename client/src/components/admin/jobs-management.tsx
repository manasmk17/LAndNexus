import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  MoreHorizontal, 
  Loader2, 
  Star, 
  Eye, 
  Check, 
  X, 
  Search,
  AlertCircle,
  Briefcase,
  Building
} from "lucide-react";
import { format } from "date-fns";
import { JobPosting } from "@shared/schema";

export default function JobsManagement() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmApprove, setConfirmApprove] = useState<JobPosting | null>(null);
  const [confirmReject, setConfirmReject] = useState<JobPosting | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [showJobDetailDialog, setShowJobDetailDialog] = useState(false);

  // Fetch all job postings
  const { data: jobs, isLoading, error } = useQuery<JobPosting[]>({
    queryKey: ["/api/admin/job-postings"],
    retry: 1,
  });

  // Filter jobs based on search query
  const filteredJobs = jobs?.filter(
    (job) =>
      job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.employmentType?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle featured status
  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({
      jobId,
      featured,
    }: {
      jobId: number;
      featured: boolean;
    }) => {
      const response = await apiRequest(
        "PUT",
        `/api/admin/job-postings/${jobId}/featured`,
        { featured }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/job-postings"] });
      toast({
        title: "Job Updated",
        description: "Featured status has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update featured status",
        variant: "destructive",
      });
    },
  });

  // Update job status (approve/reject)
  const updateJobStatusMutation = useMutation({
    mutationFn: async ({
      jobId,
      status,
    }: {
      jobId: number;
      status: string;
    }) => {
      const response = await apiRequest(
        "PUT",
        `/api/admin/job-postings/${jobId}/status`,
        { status }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/job-postings"] });
      setConfirmApprove(null);
      setConfirmReject(null);
      toast({
        title: "Job Status Updated",
        description: "Job posting status has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update job status",
        variant: "destructive",
      });
    },
  });

  // Helper function to format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (error) {
      return "Invalid date";
    }
  };

  // Helper function to get status badge variant
  const getStatusBadge = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "pending":
        return <Badge variant="outline" className="text-amber-500 border-amber-300">Pending</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "closed":
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-xl font-semibold text-red-700">Error Loading Jobs</h3>
        <p className="text-muted-foreground mt-2">
          {error instanceof Error ? error.message : "Failed to load job postings"}
        </p>
        <Button
          className="mt-4"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/job-postings"] })}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Job Postings Management</h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search jobs..."
            className="w-[250px] pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-9 w-9"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Posted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No job postings found
                  </TableCell>
                </TableRow>
              ) : (
                filteredJobs?.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>{job.id}</TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate" title={job.title || ""}>
                      {job.title}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate" title={`Company ID: ${job.companyId}`}>
                      ID: {job.companyId}
                    </TableCell>
                    <TableCell>{formatDate(job.createdAt)}</TableCell>
                    <TableCell>{getStatusBadge(job.status)}</TableCell>
                    <TableCell>
                      <Switch
                        checked={!!job.featured}
                        onCheckedChange={() =>
                          toggleFeaturedMutation.mutate({
                            jobId: job.id,
                            featured: !job.featured,
                          })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => navigate(`/job-detail/${job.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Job
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedJob(job);
                            setShowJobDetailDialog(true);
                          }}>
                            <Briefcase className="mr-2 h-4 w-4" />
                            Quick View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/company-profile/${job.companyId}`)}>
                            <Building className="mr-2 h-4 w-4" />
                            View Company
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              toggleFeaturedMutation.mutate({
                                jobId: job.id,
                                featured: !job.featured,
                              })
                            }
                          >
                            <Star className="mr-2 h-4 w-4" />
                            {job.featured ? "Unfeature Job" : "Feature Job"}
                          </DropdownMenuItem>
                          {job.status === "pending" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setConfirmApprove(job)}>
                                <Check className="mr-2 h-4 w-4 text-green-500" />
                                Approve Job
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => setConfirmReject(job)}
                                className="text-red-600"
                              >
                                <X className="mr-2 h-4 w-4" />
                                Reject Job
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Job Detail Dialog */}
          {selectedJob && (
            <Dialog open={showJobDetailDialog} onOpenChange={setShowJobDetailDialog}>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>{selectedJob.title}</DialogTitle>
                  <DialogDescription>
                    Posted {formatDate(selectedJob.createdAt)} • {selectedJob.location}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <div className="mt-1">{getStatusBadge(selectedJob.status)}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Type</Label>
                      <div className="mt-1 capitalize">{selectedJob.employmentType || "Not specified"}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Featured</Label>
                      <div className="mt-1">{selectedJob.featured ? "Yes" : "No"}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Applications</Label>
                      <div className="mt-1">{selectedJob.numberOfApplications || 0}</div>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Salary Range</Label>
                    <div className="mt-1">
                      {selectedJob.salaryMin && selectedJob.salaryMax
                        ? `$${selectedJob.salaryMin.toLocaleString()} - $${selectedJob.salaryMax.toLocaleString()}`
                        : "Not specified"}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <div className="mt-1 text-sm border rounded-md p-3 bg-muted/30 max-h-[200px] overflow-y-auto">
                      {selectedJob.description || "No description provided."}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Required Skills</Label>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {selectedJob.requirements
                        ? selectedJob.requirements.split(',').map((skill, index) => (
                            <Badge key={index} variant="outline" className="mr-1 my-1">
                              {skill.trim()}
                            </Badge>
                          ))
                        : "No specific skills listed"}
                    </div>
                  </div>
                </div>
                <DialogFooter className="sm:justify-between">
                  <div className="flex gap-2">
                    {selectedJob.status === "pending" && (
                      <>
                        <Button
                          onClick={() => {
                            setConfirmApprove(selectedJob);
                            setShowJobDetailDialog(false);
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            setConfirmReject(selectedJob);
                            setShowJobDetailDialog(false);
                          }}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowJobDetailDialog(false)}
                  >
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Approve Confirmation Dialog */}
          {confirmApprove && (
            <Dialog
              open={!!confirmApprove}
              onOpenChange={(open) => !open && setConfirmApprove(null)}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Approve Job Posting</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to approve this job posting?
                    It will be marked as active and visible to all users.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setConfirmApprove(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() =>
                      updateJobStatusMutation.mutate({
                        jobId: confirmApprove.id,
                        status: "active",
                      })
                    }
                    disabled={updateJobStatusMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {updateJobStatusMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Approve Job
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Reject Confirmation Dialog */}
          {confirmReject && (
            <Dialog
              open={!!confirmReject}
              onOpenChange={(open) => !open && setConfirmReject(null)}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reject Job Posting</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to reject this job posting?
                    It will be marked as rejected and hidden from regular users.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setConfirmReject(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() =>
                      updateJobStatusMutation.mutate({
                        jobId: confirmReject.id,
                        status: "rejected",
                      })
                    }
                    disabled={updateJobStatusMutation.isPending}
                  >
                    {updateJobStatusMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Reject Job
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </>
      )}
    </div>
  );
}