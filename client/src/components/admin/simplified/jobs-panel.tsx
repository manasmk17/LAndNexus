import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
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
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { JobPosting, CompanyProfile } from "@shared/schema";
import { Edit, Trash, Eye, Clock, Calendar, Briefcase, Building, CreditCard, Search } from "lucide-react";

export default function JobsPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Fetch all jobs and companies (for company names)
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['/api/admin/job-postings'],
    queryFn: getQueryFn<JobPosting[]>({ on401: "throw" }),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['/api/admin/company-profiles'],
    queryFn: getQueryFn<CompanyProfile[]>({ on401: "throw" }),
  });

  // Map company IDs to names for display
  const companyNames = companies.reduce((acc, company) => {
    acc[company.id] = company.companyName;
    return acc;
  }, {} as Record<number, string>);

  // Apply filters
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = searchQuery === "" || 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      job.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      companyNames[job.companyId]?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "open" && job.status === "open") ||
      (statusFilter === "closed" && job.status === "closed") ||
      (statusFilter === "draft" && job.status === "draft") ||
      (statusFilter === "expired" && job.status === "expired");
    
    const matchesType = typeFilter === "all" || job.jobType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleViewDetails = (job: JobPosting) => {
    setSelectedJob(job);
    setShowDetailsDialog(true);
  };

  const handleEdit = (job: JobPosting) => {
    setSelectedJob({...job});
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!selectedJob) return;
    
    try {
      await apiRequest("PATCH", `/api/admin/job-postings/${selectedJob.id}`, selectedJob);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/job-postings'] });
      toast({
        title: "Job Updated",
        description: `Job "${selectedJob.title}" has been updated.`,
      });
      setShowDialog(false);
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update job posting",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this job posting? This action cannot be undone.")) return;
    
    try {
      await apiRequest("DELETE", `/api/admin/job-postings/${id}`);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/job-postings'] });
      toast({
        title: "Job Deleted",
        description: "The job posting has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete job posting",
        variant: "destructive",
      });
    }
  };

  const updateJobStatus = async (job: JobPosting, status: string) => {
    try {
      await apiRequest("PATCH", `/api/admin/job-postings/${job.id}`, {
        ...job,
        status
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/job-postings'] });
      toast({
        title: "Status Updated",
        description: `Job "${job.title}" status changed to ${status}.`,
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update job status",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Function to get badge variant based on job status
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'open':
        return "outline" as const;
      case 'closed':
        return "secondary" as const;
      case 'draft':
        return "default" as const;
      case 'expired':
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold">Job Postings Management</CardTitle>
        <CardDescription>
          View and manage job postings on the platform
        </CardDescription>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search job postings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Job Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="full-time">Full-time</SelectItem>
                <SelectItem value="part-time">Part-time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="freelance">Freelance</SelectItem>
                <SelectItem value="temporary">Temporary</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
              setTypeFilter("all");
            }}>
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableCaption>List of {filteredJobs.length} job postings</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Posted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.title}</TableCell>
                    <TableCell>{companyNames[job.companyId] || "Unknown Company"}</TableCell>
                    <TableCell>{job.location || "Remote"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{job.jobType}</Badge>
                    </TableCell>
                    <TableCell>
                      {job.budget ? formatCurrency(job.budget) : "Not specified"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(job.status)}>
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(job.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleViewDetails(job)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(job)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(job.id)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredJobs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No job postings found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Edit Job Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Job Posting</DialogTitle>
            <DialogDescription>
              Update job posting details
            </DialogDescription>
          </DialogHeader>
          
          {selectedJob && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Job Title
                </Label>
                <Input
                  id="title"
                  value={selectedJob.title}
                  onChange={(e) => setSelectedJob({...selectedJob, title: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="companyId" className="text-right">
                  Company
                </Label>
                <Select 
                  value={selectedJob.companyId.toString()} 
                  onValueChange={(value) => setSelectedJob({...selectedJob, companyId: Number(value)})}
                >
                  <SelectTrigger id="companyId" className="col-span-3">
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map(company => (
                      <SelectItem key={company.id} value={company.id.toString()}>
                        {company.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location" className="text-right">
                  Location
                </Label>
                <Input
                  id="location"
                  value={selectedJob.location || ""}
                  onChange={(e) => setSelectedJob({...selectedJob, location: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="jobType" className="text-right">
                  Job Type
                </Label>
                <Select 
                  value={selectedJob.jobType} 
                  onValueChange={(value) => setSelectedJob({...selectedJob, jobType: value})}
                >
                  <SelectTrigger id="jobType" className="col-span-3">
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                    <SelectItem value="temporary">Temporary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="budget" className="text-right">
                  Budget
                </Label>
                <Input
                  id="budget"
                  type="number"
                  value={selectedJob.budget || ""}
                  onChange={(e) => setSelectedJob({
                    ...selectedJob, 
                    budget: e.target.value ? Number(e.target.value) : null
                  })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="description" className="text-right pt-2">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={selectedJob.description || ""}
                  onChange={(e) => setSelectedJob({...selectedJob, description: e.target.value})}
                  className="col-span-3"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select 
                  value={selectedJob.status} 
                  onValueChange={(value) => setSelectedJob({...selectedJob, status: value})}
                >
                  <SelectTrigger id="status" className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Job Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Job Posting Details</DialogTitle>
            <DialogDescription>
              Complete information about the job posting
            </DialogDescription>
          </DialogHeader>
          
          {selectedJob && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3 space-y-4">
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={getStatusBadgeVariant(selectedJob.status)}>
                        {selectedJob.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        ID: {selectedJob.id}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold">{selectedJob.title}</h2>
                    <div className="flex items-center text-muted-foreground mt-1">
                      <Building className="h-4 w-4 mr-1" />
                      {companyNames[selectedJob.companyId] || "Unknown Company"}
                    </div>
                    <div className="flex items-center text-muted-foreground mt-1">
                      <Briefcase className="h-4 w-4 mr-1" />
                      {selectedJob.jobType}
                    </div>
                    {selectedJob.location && (
                      <div className="flex items-center text-muted-foreground mt-1">
                        <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        {selectedJob.location}
                      </div>
                    )}
                    {selectedJob.budget && (
                      <div className="flex items-center text-muted-foreground mt-1">
                        <CreditCard className="h-4 w-4 mr-1" />
                        {formatCurrency(selectedJob.budget)}
                      </div>
                    )}
                  </div>
                
                  <div className="border rounded-md p-3">
                    <h4 className="font-medium mb-2">Timeline</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span>Posted:</span>
                        </div>
                        <span>{formatDate(selectedJob.createdAt)}</span>
                      </div>
                      {selectedJob.expiresAt && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                            <span>Expires:</span>
                          </div>
                          <span>{formatDate(selectedJob.expiresAt)}</span>
                        </div>
                      )}
                      {selectedJob.expectedDuration && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                            <span>Duration:</span>
                          </div>
                          <span>{selectedJob.expectedDuration}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="md:w-2/3 space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Job Description</h3>
                    <div className="prose max-w-none">
                      <p className="text-muted-foreground whitespace-pre-line">
                        {selectedJob.description || "No description provided."}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Skills and Requirements</h3>
                    {selectedJob.requirements ? (
                      <div className="prose max-w-none">
                        <p className="text-muted-foreground whitespace-pre-line">
                          {selectedJob.requirements}
                        </p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No specific requirements listed.</p>
                    )}
                  </div>
                  
                  {selectedJob.deliverables && (
                    <div>
                      <h3 className="font-semibold mb-2">Deliverables</h3>
                      <div className="prose max-w-none">
                        <p className="text-muted-foreground whitespace-pre-line">
                          {selectedJob.deliverables}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="border-t pt-4 flex justify-between">
                <Button variant="outline" onClick={() => handleEdit(selectedJob)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Job
                </Button>
                <div className="flex gap-2">
                  {selectedJob.status !== "open" && (
                    <Button 
                      variant="default" 
                      onClick={() => {
                        updateJobStatus(selectedJob, "open");
                        setShowDetailsDialog(false);
                      }}
                    >
                      Open Job
                    </Button>
                  )}
                  {selectedJob.status !== "closed" && (
                    <Button 
                      variant={selectedJob.status === "open" ? "secondary" : "outline"} 
                      onClick={() => {
                        updateJobStatus(selectedJob, "closed");
                        setShowDetailsDialog(false);
                      }}
                    >
                      Close Job
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}