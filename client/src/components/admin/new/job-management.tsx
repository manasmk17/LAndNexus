import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Filter,
  FileText,
  Star, 
  StarOff, 
  Clock, 
  CheckCircle, 
  XCircle, 
  MoreHorizontal,
  Download,
  Eye,
  Briefcase,
  Edit,
  Trash2,
  AlertTriangle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
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

// Sample jobs data
const sampleJobs = [
  {
    id: 1,
    companyId: 1,
    title: "Leadership Development Specialist",
    description: "Design and implement executive leadership programs for our corporate clients",
    status: "active",
    featured: true,
    salary: "$80,000 - $100,000",
    location: "New York, USA",
    jobType: "Full-time",
    postedDate: new Date("2023-02-15"),
    deadline: new Date("2023-03-15"),
    applicationsCount: 18,
    requirements: "5+ years leadership training experience, Master's degree preferred",
    companyName: "TechCorp Innovations",
  },
  {
    id: 2,
    companyId: 2,
    title: "Training Coordinator",
    description: "Organize and coordinate staff training programs for healthcare professionals",
    status: "active",
    featured: false,
    salary: "$60,000 - $75,000",
    location: "Boston, USA",
    jobType: "Full-time",
    postedDate: new Date("2023-02-18"),
    deadline: new Date("2023-03-18"),
    applicationsCount: 12,
    requirements: "3+ years experience in healthcare training, Bachelor's degree required",
    companyName: "HealthPlus",
  },
  {
    id: 3,
    companyId: 3,
    title: "E-Learning Designer",
    description: "Create engaging digital learning content for corporate training platforms",
    status: "active",
    featured: true,
    salary: "$70,000 - $85,000",
    location: "Remote",
    jobType: "Contract",
    postedDate: new Date("2023-02-20"),
    deadline: new Date("2023-03-20"),
    applicationsCount: 24,
    requirements: "Experience with instructional design and e-learning tools (Articulate, Captivate)",
    companyName: "EduLearn Solutions",
  },
  {
    id: 4,
    companyId: 4,
    title: "Learning & Development Manager",
    description: "Lead the L&D team for a global financial services corporation",
    status: "active",
    featured: false,
    salary: "$100,000 - $120,000",
    location: "New York, USA",
    jobType: "Full-time",
    postedDate: new Date("2023-02-22"),
    deadline: new Date("2023-03-22"),
    applicationsCount: 15,
    requirements: "7+ years L&D leadership experience, finance industry experience preferred",
    companyName: "Global Finance Group",
  },
  {
    id: 5,
    companyId: 5,
    title: "Employee Onboarding Specialist",
    description: "Develop and implement onboarding programs for new retail employees",
    status: "active",
    featured: false,
    salary: "$55,000 - $65,000",
    location: "Chicago, USA",
    jobType: "Part-time",
    postedDate: new Date("2023-02-25"),
    deadline: new Date("2023-03-25"),
    applicationsCount: 9,
    requirements: "2+ years experience in employee training or onboarding, retail experience a plus",
    companyName: "Retail Ventures",
  },
  {
    id: 6,
    companyId: 6,
    title: "Technical Training Developer",
    description: "Create technical training programs for manufacturing equipment operators",
    status: "closed",
    featured: false,
    salary: "$75,000 - $90,000",
    location: "Detroit, USA",
    jobType: "Full-time",
    postedDate: new Date("2023-01-15"),
    deadline: new Date("2023-02-15"),
    applicationsCount: 22,
    requirements: "Experience with technical writing and manufacturing processes",
    companyName: "Manufacturing Excellence",
  },
];

export default function JobManagement() {
  const [jobs, setJobs] = useState(sampleJobs);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<number | null>(null);
  const { toast } = useToast();

  // Filter jobs based on search term
  const filteredJobs = jobs.filter(job => {
    const searchFields = [
      job.title,
      job.description,
      job.location,
      job.jobType,
      job.companyName,
    ];
    
    return searchFields.some(field => 
      field.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleToggleFeatured = (id: number) => {
    setJobs(jobs.map(job => 
      job.id === id 
        ? { ...job, featured: !job.featured } 
        : job
    ));

    const job = jobs.find(j => j.id === id);
    const action = job?.featured ? "removed from" : "added to";
    
    toast({
      title: `Featured status updated`,
      description: `Job "${job?.title}" has been ${action} featured listings.`,
    });
  };

  const updateJobStatus = (id: number, status: 'active' | 'paused' | 'closed') => {
    setJobs(jobs.map(job => 
      job.id === id 
        ? { ...job, status } 
        : job
    ));

    const job = jobs.find(j => j.id === id);
    
    toast({
      title: `Job status updated`,
      description: `Job "${job?.title}" is now ${status}.`,
    });
  };
  
  const handleDeleteClick = (id: number) => {
    setJobToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (jobToDelete === null) return;
    
    const jobTitle = jobs.find(j => j.id === jobToDelete)?.title;
    setJobs(jobs.filter(job => job.id !== jobToDelete));
    
    toast({
      title: "Job deleted",
      description: `Job "${jobTitle}" has been deleted successfully.`,
      variant: "default",
    });

    // Close the dialog
    setDeleteDialogOpen(false);
    setJobToDelete(null);
  };

  const getJobStatusColor = (status: string) => {
    switch(status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-800';
      case 'paused':
        return 'bg-amber-100 text-amber-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getJobTypeColor = (type: string) => {
    switch(type) {
      case 'Full-time':
        return 'bg-blue-100 text-blue-800';
      case 'Part-time':
        return 'bg-purple-100 text-purple-800';
      case 'Contract':
        return 'bg-amber-100 text-amber-800';
      case 'Remote':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Job Management</h2>
        <div className="flex gap-2">
          <Button className="flex items-center gap-1">
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Add Job</span>
          </Button>
          <Button variant="outline" className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>
      
      {/* Search and filter area */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-1">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filter Jobs</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>All Jobs</DropdownMenuItem>
            <DropdownMenuItem>Active Jobs</DropdownMenuItem>
            <DropdownMenuItem>Paused Jobs</DropdownMenuItem>
            <DropdownMenuItem>Closed Jobs</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Featured Only</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Full-time</DropdownMenuItem>
            <DropdownMenuItem>Part-time</DropdownMenuItem>
            <DropdownMenuItem>Contract</DropdownMenuItem>
            <DropdownMenuItem>Remote</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Jobs table */}
      <Card>
        <CardHeader>
          <CardTitle>Job Listings</CardTitle>
          <CardDescription>
            Manage job postings, applications, and featured status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Title</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Posted</TableHead>
                <TableHead>Applications</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Featured</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">
                    {job.title}
                  </TableCell>
                  <TableCell>{job.companyName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getJobTypeColor(job.jobType)}>
                      {job.jobType}
                    </Badge>
                  </TableCell>
                  <TableCell>{job.location}</TableCell>
                  <TableCell>{format(job.postedDate, 'MMM d, yyyy')}</TableCell>
                  <TableCell>{job.applicationsCount}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getJobStatusColor(job.status)}>
                      {job.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleFeatured(job.id)}
                    >
                      {job.featured ? (
                        <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                      ) : (
                        <StarOff className="h-5 w-5 text-muted-foreground" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FileText className="h-4 w-4 mr-2" />
                          View Applications
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Job
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleToggleFeatured(job.id)}>
                          {job.featured ? (
                            <>
                              <StarOff className="h-4 w-4 mr-2" />
                              Remove from Featured
                            </>
                          ) : (
                            <>
                              <Star className="h-4 w-4 mr-2" />
                              Add to Featured
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {job.status === 'active' && (
                          <DropdownMenuItem onClick={() => updateJobStatus(job.id, 'paused')}>
                            <Clock className="h-4 w-4 mr-2" />
                            Pause Job
                          </DropdownMenuItem>
                        )}
                        {job.status === 'paused' && (
                          <DropdownMenuItem onClick={() => updateJobStatus(job.id, 'active')}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Activate Job
                          </DropdownMenuItem>
                        )}
                        {job.status !== 'closed' && (
                          <DropdownMenuItem onClick={() => updateJobStatus(job.id, 'closed')}>
                            <XCircle className="h-4 w-4 mr-2" />
                            Close Job
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(job.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Job
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredJobs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                    No jobs found matching your search criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Job Posting
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the job posting
              and remove all associated applications from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}