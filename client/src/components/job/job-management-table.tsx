import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Edit, Trash2, Eye, MapPin, Clock, DollarSign } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { JobPosting } from "@shared/schema";

interface JobManagementTableProps {
  companyId: number;
}

export function JobManagementTable({ companyId }: JobManagementTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['/api/companies/me/job-postings'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/companies/me/job-postings");
      return response as JobPosting[];
    }
  });

  const statusMutation = useMutation({
    mutationFn: async ({ jobId, status }: { jobId: number; status: string }) => {
      return apiRequest("PATCH", `/api/job-postings/${jobId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/companies/me/job-postings'] });
      toast({
        title: "Status Updated",
        description: "Job posting status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update job status",
        variant: "destructive",
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (jobId: number) => {
      return apiRequest("DELETE", `/api/job-postings/${jobId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/companies/me/job-postings'] });
      toast({
        title: "Job Deleted",
        description: "Job posting has been deleted successfully.",
      });
      setSelectedJob(null);
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete job posting",
        variant: "destructive",
      });
    }
  });

  const handleStatusChange = (jobId: number, status: string) => {
    statusMutation.mutate({ jobId, status });
  };

  const handleDelete = (job: JobPosting) => {
    setSelectedJob(job);
  };

  const confirmDelete = () => {
    if (selectedJob) {
      deleteMutation.mutate(selectedJob.id);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      open: "default",
      closed: "secondary",
      filled: "outline"
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || "default"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatCompensation = (job: JobPosting) => {
    if (!job.minCompensation && !job.maxCompensation) return "Not specified";
    
    const formatAmount = (amount: number | null) => {
      if (!amount) return "";
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    };

    const min = job.minCompensation ? formatAmount(job.minCompensation) : "";
    const max = job.maxCompensation ? formatAmount(job.maxCompensation) : "";
    const unit = job.compensationUnit ? `/${job.compensationUnit}` : "";

    if (min && max) {
      return `${min} - ${max}${unit}`;
    } else if (min) {
      return `${min}+${unit}`;
    } else if (max) {
      return `Up to ${max}${unit}`;
    }
    return "Not specified";
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "No expiration";
    return new Date(date).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading job postings...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!Array.isArray(jobs) || jobs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Manage Job Postings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No job postings found.</p>
            <Link href="/post-job">
              <Button>Create Your First Job Posting</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Job Postings</h2>
        <Link href="/post-job">
          <Button>Post New Job</Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {Array.isArray(jobs) && jobs.map((job: JobPosting) => (
          <Card key={job.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold">{job.title}</h3>
                    {getStatusBadge(job.status)}
                    {job.featured && (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                        Featured
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {job.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {formatCompensation(job)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Expires: {formatDate(job.expiresAt)}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {job.description}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Created: {formatDate(job.createdAt)}</span>
                    {job.modifiedAt && job.modifiedAt !== job.createdAt && (
                      <span>• Modified: {formatDate(job.modifiedAt)}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-6">
                  <Select 
                    value={job.status} 
                    onValueChange={(status) => handleStatusChange(job.id, status)}
                    disabled={statusMutation.isPending}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="filled">Filled</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex gap-1">
                    <Link href={`/job-postings/${job.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/edit-job/${job.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDelete(job)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job Posting</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedJob?.title}"? This action cannot be undone and all applications will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}