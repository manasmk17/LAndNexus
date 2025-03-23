import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueryFn, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { JobPosting } from '@shared/schema';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Loader2, Eye, Check, X, Search, MoreHorizontal, AlertCircle, Star } from 'lucide-react';

export function JobsPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);

  // Fetch jobs
  const {
    data: jobs = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['/api/admin/job-postings'],
    queryFn: getQueryFn<JobPosting[]>({ on401: 'throw' }),
  });

  // Filter jobs based on search query
  const filteredJobs = searchQuery
    ? jobs.filter(
        (job) =>
          job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : jobs;

  // Toggle featured status mutation
  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, featured }: { id: number; featured: boolean }) => {
      const response = await apiRequest('PATCH', `/api/admin/job-postings/${id}`, {
        featured,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/job-postings'] });
      toast({
        title: 'Featured Status Updated',
        description: 'Job featured status has been updated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update featured status',
        variant: 'destructive',
      });
    },
  });

  // Update job status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest('PATCH', `/api/admin/job-postings/${id}`, {
        status,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/job-postings'] });
      toast({
        title: 'Job Status Updated',
        description: 'Job status has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update job status',
        variant: 'destructive',
      });
    },
  });

  function getStatusBadge(status: string | null) {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'filled':
        return <Badge variant="success">Filled</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center text-center p-6">
            <AlertCircle className="h-10 w-10 text-destructive mb-2" />
            <h3 className="text-lg font-semibold">Error Loading Jobs</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {error instanceof Error ? error.message : 'Could not load job data'}
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/job-postings'] })}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Postings</CardTitle>
        <CardDescription>View and manage job postings</CardDescription>
        <div className="flex items-center mt-4 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-9 w-9"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No jobs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.title}</TableCell>
                      <TableCell>{job.company}</TableCell>
                      <TableCell>{job.location || 'Remote'}</TableCell>
                      <TableCell>{getStatusBadge(job.status)}</TableCell>
                      <TableCell>
                        <Switch
                          checked={!!job.featured}
                          onCheckedChange={(checked) => 
                            toggleFeaturedMutation.mutate({ id: job.id, featured: checked })
                          }
                          aria-label="Toggle featured status"
                        />
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
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedJob(job);
                                setShowDetailsDialog(true);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => window.open(`/jobs/${job.id}`, '_blank')}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Public Listing
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => updateStatusMutation.mutate({ id: job.id, status: 'active' })}
                              disabled={job.status === 'active'}
                            >
                              <Check className="mr-2 h-4 w-4 text-green-500" />
                              Mark as Active
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updateStatusMutation.mutate({ id: job.id, status: 'filled' })}
                              disabled={job.status === 'filled'}
                            >
                              <Star className="mr-2 h-4 w-4 text-amber-500" />
                              Mark as Filled
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updateStatusMutation.mutate({ id: job.id, status: 'expired' })}
                              disabled={job.status === 'expired'}
                            >
                              <X className="mr-2 h-4 w-4 text-red-500" />
                              Mark as Expired
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
        )}

        {/* Job Details Dialog */}
        {selectedJob && (
          <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{selectedJob.title}</DialogTitle>
                <DialogDescription>
                  {selectedJob.company} • {selectedJob.location || 'Remote'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-3">
                  <div className="font-semibold">Type:</div>
                  <div className="col-span-2">{selectedJob.jobType || 'N/A'}</div>
                </div>
                <div className="grid grid-cols-3">
                  <div className="font-semibold">Salary:</div>
                  <div className="col-span-2">
                    {selectedJob.salaryMin && selectedJob.salaryMax
                      ? `$${selectedJob.salaryMin.toLocaleString()} - $${selectedJob.salaryMax.toLocaleString()}`
                      : 'Not specified'}
                  </div>
                </div>
                <div className="grid grid-cols-3">
                  <div className="font-semibold">Status:</div>
                  <div className="col-span-2">{getStatusBadge(selectedJob.status)}</div>
                </div>
                <div className="grid grid-cols-3">
                  <div className="font-semibold">Featured:</div>
                  <div className="col-span-2">
                    <Badge variant={selectedJob.featured ? 'default' : 'outline'}>
                      {selectedJob.featured ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
                {selectedJob.description && (
                  <div>
                    <div className="font-semibold mb-2">Description:</div>
                    <div className="text-sm text-muted-foreground max-h-60 overflow-y-auto">
                      {selectedJob.description}
                    </div>
                  </div>
                )}
                {selectedJob.requirements && (
                  <div>
                    <div className="font-semibold mb-2">Requirements:</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedJob.requirements}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}