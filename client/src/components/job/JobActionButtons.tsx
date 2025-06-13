import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MoreHorizontal, Edit, Pause, Play, Eye, EyeOff, Trash2, Copy, CheckCircle } from "lucide-react";
import { EditJobForm } from "./EditJobForm";

interface JobActionButtonsProps {
  job: any;
  compact?: boolean;
}

export function JobActionButtons({ job, compact = false }: JobActionButtonsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return apiRequest(`/api/job-postings/${job.id}/status`, "PATCH", { status });
    },
    onSuccess: (_, status) => {
      toast({
        title: "Success",
        description: `Job posting ${status === 'paused' ? 'paused' : status === 'open' ? 'resumed' : 'updated'} successfully`
      });
      queryClient.invalidateQueries({ queryKey: ["/api/companies/me/job-postings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies/me/jobs"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update job status",
        variant: "destructive"
      });
    }
  });

  const deleteJobMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/job-postings/${job.id}`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Job Deleted",
        description: data.hadApplications 
          ? `Job deleted with ${data.applicationsCount} applications. Data has been archived.`
          : "Job posting deleted successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/companies/me/job-postings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies/me/jobs"] });
      setShowDeleteDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete job posting",
        variant: "destructive"
      });
    }
  });

  const duplicateJobMutation = useMutation({
    mutationFn: async () => {
      const duplicateData = {
        ...job,
        title: `${job.title} (Copy)`,
        status: 'open',
        featured: false
      };
      
      // Remove fields that shouldn't be duplicated
      delete duplicateData.id;
      delete duplicateData.createdAt;
      delete duplicateData.modifiedAt;
      delete duplicateData.companyId;

      return apiRequest("POST", "/api/job-postings", duplicateData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Job posting duplicated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/companies/me/job-postings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies/me/jobs"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to duplicate job posting",
        variant: "destructive"
      });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      case 'filled': return 'bg-blue-100 text-blue-800';
      case 'deleted': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Play className="h-3 w-3" />;
      case 'paused': return <Pause className="h-3 w-3" />;
      case 'closed': return <EyeOff className="h-3 w-3" />;
      case 'filled': return <CheckCircle className="h-3 w-3" />;
      default: return null;
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Badge className={getStatusColor(job.status)}>
          {getStatusIcon(job.status)}
          <span className="ml-1 capitalize">{job.status}</span>
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setShowEditForm(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Job
            </DropdownMenuItem>
            
            {job.status === 'open' && (
              <DropdownMenuItem onClick={() => updateStatusMutation.mutate('paused')}>
                <Pause className="h-4 w-4 mr-2" />
                Pause Job
              </DropdownMenuItem>
            )}
            
            {job.status === 'paused' && (
              <DropdownMenuItem onClick={() => updateStatusMutation.mutate('open')}>
                <Play className="h-4 w-4 mr-2" />
                Resume Job
              </DropdownMenuItem>
            )}
            
            {(job.status === 'open' || job.status === 'paused') && (
              <DropdownMenuItem onClick={() => updateStatusMutation.mutate('closed')}>
                <EyeOff className="h-4 w-4 mr-2" />
                Close Job
              </DropdownMenuItem>
            )}
            
            {job.status === 'closed' && (
              <DropdownMenuItem onClick={() => updateStatusMutation.mutate('open')}>
                <Eye className="h-4 w-4 mr-2" />
                Reopen Job
              </DropdownMenuItem>
            )}
            
            <DropdownMenuItem onClick={() => duplicateJobMutation.mutate()}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate Job
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Job
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <EditJobForm
          job={job}
          isOpen={showEditForm}
          onClose={() => setShowEditForm(false)}
        />

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Job Posting</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{job.title}"? This action will archive the job posting and hide it from public view. 
                {job.applicationCount > 0 && (
                  <span className="block mt-2 font-medium text-orange-600">
                    Warning: This job has {job.applicationCount} applications. All application data will be preserved but the job will no longer be visible to applicants.
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteJobMutation.mutate()}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteJobMutation.isPending}
              >
                {deleteJobMutation.isPending ? "Deleting..." : "Delete Job"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Full button layout for larger displays
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge className={getStatusColor(job.status)}>
        {getStatusIcon(job.status)}
        <span className="ml-1 capitalize">{job.status}</span>
      </Badge>

      <Button size="sm" onClick={() => setShowEditForm(true)}>
        <Edit className="h-4 w-4 mr-2" />
        Edit
      </Button>

      {job.status === 'open' && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => updateStatusMutation.mutate('paused')}
          disabled={updateStatusMutation.isPending}
        >
          <Pause className="h-4 w-4 mr-2" />
          Pause
        </Button>
      )}

      {job.status === 'paused' && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => updateStatusMutation.mutate('open')}
          disabled={updateStatusMutation.isPending}
        >
          <Play className="h-4 w-4 mr-2" />
          Resume
        </Button>
      )}

      {(job.status === 'open' || job.status === 'paused') && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => updateStatusMutation.mutate('closed')}
          disabled={updateStatusMutation.isPending}
        >
          <EyeOff className="h-4 w-4 mr-2" />
          Close
        </Button>
      )}

      {job.status === 'closed' && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => updateStatusMutation.mutate('open')}
          disabled={updateStatusMutation.isPending}
        >
          <Eye className="h-4 w-4 mr-2" />
          Reopen
        </Button>
      )}

      <Button
        size="sm"
        variant="outline"
        onClick={() => duplicateJobMutation.mutate()}
        disabled={duplicateJobMutation.isPending}
      >
        <Copy className="h-4 w-4 mr-2" />
        Duplicate
      </Button>

      <Button
        size="sm"
        variant="destructive"
        onClick={() => setShowDeleteDialog(true)}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete
      </Button>

      <EditJobForm
        job={job}
        isOpen={showEditForm}
        onClose={() => setShowEditForm(false)}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job Posting</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{job.title}"? This action will archive the job posting and hide it from public view.
              {job.applicationCount > 0 && (
                <span className="block mt-2 font-medium text-orange-600">
                  Warning: This job has {job.applicationCount} applications. All application data will be preserved but the job will no longer be visible to applicants.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteJobMutation.mutate()}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteJobMutation.isPending}
            >
              {deleteJobMutation.isPending ? "Deleting..." : "Delete Job"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}