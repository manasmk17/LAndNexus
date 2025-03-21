import { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { 
  User,
  ProfessionalProfile,
  CompanyProfile,
  JobPosting,
  Resource,
  ResourceCategory,
  ForumPost,
  Expertise,
  InsertResourceCategory,
  InsertExpertise,
} from "@shared/schema";
import { 
  ChevronDown, 
  ChevronUp, 
  Edit, 
  Eye, 
  Trash, 
  Plus, 
  Save, 
  Check, 
  X, 
  AlertTriangle,
  Filter,
  ChevronsUpDown,
  Download,
  Upload,
  Settings,
  MoreHorizontal,
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("users");

  // Redirect if not admin
  useEffect(() => {
    if (user && !user.isAdmin) {
      setLocation("/");
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin dashboard.",
        variant: "destructive",
      });
    }
  }, [user, setLocation, toast]);

  if (!user || !user.isAdmin) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="mb-4">You must be an administrator to access this page.</p>
        <Button onClick={() => setLocation("/")}>Go to Home</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-500">Manage all aspects of the L&D Nexus platform</p>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-7 md:w-auto w-full">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="professionals">Professionals</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="expertise">Expertise</TabsTrigger>
          <TabsTrigger value="forum">Forum</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <UsersTab />
        </TabsContent>

        <TabsContent value="professionals" className="mt-6">
          <ProfessionalsTab />
        </TabsContent>

        <TabsContent value="companies" className="mt-6">
          <CompaniesTab />
        </TabsContent>

        <TabsContent value="jobs" className="mt-6">
          <JobsTab />
        </TabsContent>

        <TabsContent value="resources" className="mt-6">
          <ResourcesTab />
        </TabsContent>

        <TabsContent value="expertise" className="mt-6">
          <ExpertiseTab />
        </TabsContent>

        <TabsContent value="forum" className="mt-6">
          <ForumTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UsersTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: getQueryFn<User[]>({ on401: "throw" }),
  });

  const filteredUsers = searchQuery 
    ? users.filter(user => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  const handleEdit = (user: User) => {
    setEditingUser({...user});
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!editingUser) return;
    
    try {
      await apiRequest("PUT", `/api/admin/users/${editingUser.id}`, editingUser);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "User Updated",
        description: `User ${editingUser.username} has been updated.`,
      });
      setShowDialog(false);
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update user",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    
    try {
      await apiRequest("DELETE", `/api/admin/users/${id}`, {});
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "User Deleted",
        description: "The user has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const toggleAdmin = async (user: User) => {
    try {
      await apiRequest("PUT", `/api/admin/users/${user.id}`, {
        ...user,
        isAdmin: !user.isAdmin
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: user.isAdmin ? "Admin Rights Removed" : "Admin Rights Granted",
        description: `${user.username} is ${user.isAdmin ? "no longer" : "now"} an administrator.`,
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update user permissions",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold">User Management</CardTitle>
        <CardDescription>
          View and manage all users on the platform
        </CardDescription>
        <div className="flex items-center gap-4 mt-4">
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <Button variant="outline" onClick={() => setSearchQuery("")}>
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <Table>
            <TableCaption>List of all registered users</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.firstName} {user.lastName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.userType === "professional" ? "default" : "secondary"}>
                      {user.userType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch 
                      checked={user.isAdmin} 
                      onCheckedChange={() => toggleAdmin(user)}
                      aria-label="Toggle admin status"
                    />
                  </TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(user)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(user.id)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details and permissions
            </DialogDescription>
          </DialogHeader>
          
          {editingUser && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="text-right">
                  Username
                </Label>
                <Input
                  id="username"
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="firstName" className="text-right">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  value={editingUser.firstName}
                  onChange={(e) => setEditingUser({...editingUser, firstName: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lastName" className="text-right">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  value={editingUser.lastName}
                  onChange={(e) => setEditingUser({...editingUser, lastName: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="userType" className="text-right">
                  User Type
                </Label>
                <Select 
                  value={editingUser.userType}
                  onValueChange={(value) => setEditingUser({...editingUser, userType: value as "professional" | "company" | "admin"})}
                >
                  <SelectTrigger className="col-span-3" id="userType">
                    <SelectValue placeholder="Select user type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="admin" className="text-right">
                  Admin
                </Label>
                <div className="col-span-3 flex items-center">
                  <Switch 
                    id="admin"
                    checked={editingUser.isAdmin} 
                    onCheckedChange={(checked) => setEditingUser({...editingUser, isAdmin: checked})}
                  />
                  <span className="ml-2">{editingUser.isAdmin ? "Yes" : "No"}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function ProfessionalsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<ProfessionalProfile | null>(null);
  const [showProfileSheet, setShowProfileSheet] = useState(false);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['/api/admin/professional-profiles'],
    queryFn: getQueryFn<ProfessionalProfile[]>({ on401: "throw" }),
  });

  const filteredProfiles = searchQuery 
    ? profiles.filter(profile => 
        profile.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : profiles;

  const toggleFeatured = async (profile: ProfessionalProfile) => {
    try {
      await apiRequest("PUT", `/api/admin/professional-profiles/${profile.id}/featured`, {
        featured: !profile.featured
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/professional-profiles'] });
      toast({
        title: profile.featured ? "Profile Unfeatured" : "Profile Featured",
        description: `The professional profile is ${profile.featured ? "no longer" : "now"} featured.`,
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const viewProfile = (profile: ProfessionalProfile) => {
    setSelectedProfile(profile);
    setShowProfileSheet(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold">Professional Management</CardTitle>
        <CardDescription>
          Manage professional profiles
        </CardDescription>
        <div className="flex items-center gap-4 mt-4">
          <Input
            placeholder="Search professional profiles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <Button variant="outline" onClick={() => setSearchQuery("")}>
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <Table>
            <TableCaption>List of professional profiles</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Rate/Hour</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProfiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell>{profile.id}</TableCell>
                  <TableCell>{profile.title}</TableCell>
                  <TableCell>{profile.location}</TableCell>
                  <TableCell>{profile.ratePerHour ? `$${profile.ratePerHour}` : "Not set"}</TableCell>
                  <TableCell>{profile.rating} ({profile.reviewCount} reviews)</TableCell>
                  <TableCell>
                    <Switch 
                      checked={!!profile.featured} 
                      onCheckedChange={() => toggleFeatured(profile)}
                      aria-label="Toggle featured status"
                    />
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => viewProfile(profile)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm">
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredProfiles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No professional profiles found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Sheet open={showProfileSheet} onOpenChange={setShowProfileSheet}>
        <SheetContent className="sm:max-w-md" side="right">
          <SheetHeader>
            <SheetTitle>Professional Profile</SheetTitle>
            <SheetDescription>
              Detailed view of the professional profile
            </SheetDescription>
          </SheetHeader>
          
          {selectedProfile && (
            <ScrollArea className="h-[calc(100vh-12rem)] pr-4 mt-6">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold">User ID</h3>
                  <p className="text-sm">{selectedProfile.userId}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Title</h3>
                  <p className="text-sm">{selectedProfile.title}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Bio</h3>
                  <p className="text-sm">{selectedProfile.bio}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Location</h3>
                  <p className="text-sm">{selectedProfile.location}</p>
                </div>
                {selectedProfile.videoIntroUrl && (
                  <div>
                    <h3 className="font-semibold">Video Introduction</h3>
                    <a href={selectedProfile.videoIntroUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 underline">
                      {selectedProfile.videoIntroUrl}
                    </a>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold">Rate Per Hour</h3>
                  <p className="text-sm">{selectedProfile.ratePerHour ? `$${selectedProfile.ratePerHour}` : "Not specified"}</p>
                </div>
                {selectedProfile.profileImageUrl && (
                  <div>
                    <h3 className="font-semibold">Profile Image</h3>
                    <img 
                      src={selectedProfile.profileImageUrl} 
                      alt="Profile" 
                      className="w-32 h-32 object-cover rounded-full mt-2"
                    />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold">Rating</h3>
                  <p className="text-sm">{selectedProfile.rating} stars ({selectedProfile.reviewCount} reviews)</p>
                </div>
                <div className="pt-4">
                  <Button 
                    onClick={() => {
                      toggleFeatured(selectedProfile);
                      setShowProfileSheet(false);
                    }}
                    variant={selectedProfile.featured ? "destructive" : "default"}
                  >
                    {selectedProfile.featured ? "Remove from Featured" : "Add to Featured"}
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>
    </Card>
  );
}

function CompaniesTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<CompanyProfile | null>(null);
  const [showProfileSheet, setShowProfileSheet] = useState(false);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['/api/admin/company-profiles'],
    queryFn: getQueryFn<CompanyProfile[]>({ on401: "throw" }),
  });

  const filteredProfiles = searchQuery 
    ? profiles.filter(profile => 
        profile.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : profiles;

  const viewProfile = (profile: CompanyProfile) => {
    setSelectedProfile(profile);
    setShowProfileSheet(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold">Company Management</CardTitle>
        <CardDescription>
          Manage company profiles
        </CardDescription>
        <div className="flex items-center gap-4 mt-4">
          <Input
            placeholder="Search company profiles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <Button variant="outline" onClick={() => setSearchQuery("")}>
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <Table>
            <TableCaption>List of company profiles</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Company Name</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProfiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell>{profile.id}</TableCell>
                  <TableCell>{profile.companyName}</TableCell>
                  <TableCell>{profile.industry}</TableCell>
                  <TableCell>{profile.size}</TableCell>
                  <TableCell>{profile.location}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => viewProfile(profile)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm">
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredProfiles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No company profiles found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Sheet open={showProfileSheet} onOpenChange={setShowProfileSheet}>
        <SheetContent className="sm:max-w-md" side="right">
          <SheetHeader>
            <SheetTitle>Company Profile</SheetTitle>
            <SheetDescription>
              Detailed view of the company profile
            </SheetDescription>
          </SheetHeader>
          
          {selectedProfile && (
            <ScrollArea className="h-[calc(100vh-12rem)] pr-4 mt-6">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold">User ID</h3>
                  <p className="text-sm">{selectedProfile.userId}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Company Name</h3>
                  <p className="text-sm">{selectedProfile.companyName}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Industry</h3>
                  <p className="text-sm">{selectedProfile.industry}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Description</h3>
                  <p className="text-sm">{selectedProfile.description}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Size</h3>
                  <p className="text-sm">{selectedProfile.size}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Location</h3>
                  <p className="text-sm">{selectedProfile.location}</p>
                </div>
                {selectedProfile.website && (
                  <div>
                    <h3 className="font-semibold">Website</h3>
                    <a href={selectedProfile.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 underline">
                      {selectedProfile.website}
                    </a>
                  </div>
                )}
                {selectedProfile.logoUrl && (
                  <div>
                    <h3 className="font-semibold">Logo</h3>
                    <img 
                      src={selectedProfile.logoUrl} 
                      alt="Company Logo" 
                      className="w-32 h-32 object-contain mt-2"
                    />
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>
    </Card>
  );
}

function JobsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['/api/admin/job-postings'],
    queryFn: getQueryFn<JobPosting[]>({ on401: "throw" }),
  });

  let filteredJobs = jobs;
  
  // Apply status filter
  if (statusFilter !== "all") {
    filteredJobs = filteredJobs.filter(job => job.status === statusFilter);
  }
  
  // Apply search filter
  if (searchQuery) {
    filteredJobs = filteredJobs.filter(job => 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  const toggleFeatured = async (job: JobPosting) => {
    try {
      await apiRequest("PUT", `/api/admin/job-postings/${job.id}/featured`, {
        featured: !job.featured
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/job-postings'] });
      toast({
        title: job.featured ? "Job Unfeatured" : "Job Featured",
        description: `The job posting is ${job.featured ? "no longer" : "now"} featured.`,
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update job posting",
        variant: "destructive",
      });
    }
  };

  const updateJobStatus = async (job: JobPosting, status: string) => {
    try {
      await apiRequest("PUT", `/api/admin/job-postings/${job.id}/status`, { status });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/job-postings'] });
      toast({
        title: "Job Status Updated",
        description: `The job posting status is now "${status}".`,
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update job status",
        variant: "destructive",
      });
    }
  };

  const deleteJob = async (id: number) => {
    if (!confirm("Are you sure you want to delete this job posting? This action cannot be undone.")) return;
    
    try {
      await apiRequest("DELETE", `/api/admin/job-postings/${id}`, {});
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold">Job Postings Management</CardTitle>
        <CardDescription>
          Manage all job postings
        </CardDescription>
        <div className="flex flex-col md:flex-row gap-4 mt-4">
          <Input
            placeholder="Search job postings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="filled">Filled</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => {
            setSearchQuery("");
            setStatusFilter("all");
          }}>
            Clear Filters
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableCaption>List of job postings</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>{job.id}</TableCell>
                    <TableCell>{job.title}</TableCell>
                    <TableCell>{job.companyId}</TableCell>
                    <TableCell>{job.jobType}</TableCell>
                    <TableCell>
                      {job.remote ? "Remote" : job.location}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        job.status === "open" ? "default" :
                        job.status === "filled" ? "outline" : "secondary"
                      }>
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch 
                        checked={!!job.featured} 
                        onCheckedChange={() => toggleFeatured(job)}
                        aria-label="Toggle featured status"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Select
                          defaultValue={job.status}
                          onValueChange={(value) => updateJobStatus(job, value)}
                        >
                          <SelectTrigger className="w-24 h-8">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                            <SelectItem value="filled">Filled</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => deleteJob(job.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredJobs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No job postings found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ResourcesTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<number | "all">("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showResourceDialog, setShowResourceDialog] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  const { data: resources = [], isLoading: resourcesLoading } = useQuery({
    queryKey: ['/api/admin/resources'],
    queryFn: getQueryFn<Resource[]>({ on401: "throw" }),
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/resource-categories'],
    queryFn: getQueryFn<ResourceCategory[]>({ on401: "returnNull" }),
  });

  let filteredResources = resources;
  
  // Apply category filter
  if (categoryFilter !== "all") {
    filteredResources = filteredResources.filter(resource => 
      resource.categoryId === categoryFilter
    );
  }
  
  // Apply type filter
  if (typeFilter !== "all") {
    filteredResources = filteredResources.filter(resource => 
      resource.resourceType === typeFilter
    );
  }
  
  // Apply search filter
  if (searchQuery) {
    filteredResources = filteredResources.filter(resource => 
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  const toggleFeatured = async (resource: Resource) => {
    try {
      const featured = resource.featured === true ? false : true; // Convert possible null/undefined to boolean
      await apiRequest("PUT", `/api/admin/resources/${resource.id}/featured`, {
        featured: featured
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/resources'] });
      toast({
        title: resource.featured ? "Resource Unfeatured" : "Resource Featured",
        description: `The resource is ${resource.featured ? "no longer" : "now"} featured.`,
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update resource",
        variant: "destructive",
      });
    }
  };

  const deleteResource = async (id: number) => {
    if (!confirm("Are you sure you want to delete this resource? This action cannot be undone.")) return;
    
    try {
      await apiRequest("DELETE", `/api/admin/resources/${id}`, {});
      queryClient.invalidateQueries({ queryKey: ['/api/admin/resources'] });
      toast({
        title: "Resource Deleted",
        description: "The resource has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete resource",
        variant: "destructive",
      });
    }
  };

  const createNewCategory = async () => {
    if (!newCategory.name) {
      toast({
        title: "Validation Error",
        description: "Category name is required",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await apiRequest("POST", `/api/admin/resource-categories`, newCategory);
      queryClient.invalidateQueries({ queryKey: ['/api/resource-categories'] });
      setNewCategory({ name: "", description: "" });
      setShowCategoryDialog(false);
      toast({
        title: "Category Created",
        description: "New resource category has been created successfully.",
      });
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create category",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Resource Categories</CardTitle>
          <CardDescription>
            Manage resource categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categoriesLoading ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="mb-4">
              <div className="flex gap-2 flex-wrap">
                {categories.map((category) => (
                  <Badge key={category.id} variant="outline" className="p-2 text-sm">
                    {category.name}
                    {category.description && <span className="text-xs text-gray-500 ml-2">- {category.description}</span>}
                  </Badge>
                ))}
                <Button variant="outline" onClick={() => setShowCategoryDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Resources Management</CardTitle>
          <CardDescription>
            Manage all resources
          </CardDescription>
          <div className="flex flex-col md:flex-row gap-4 mt-4">
            <Input
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            <Select 
              value={categoryFilter === "all" ? "all" : categoryFilter.toString()} 
              onValueChange={(value) => setCategoryFilter(value === "all" ? "all" : parseInt(value))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="article">Article</SelectItem>
                <SelectItem value="template">Template</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="webinar">Webinar</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => {
              setSearchQuery("");
              setCategoryFilter("all");
              setTypeFilter("all");
            }}>
              Clear Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {resourcesLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableCaption>List of resources</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Featured</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResources.map((resource) => (
                    <TableRow key={resource.id}>
                      <TableCell>{resource.id}</TableCell>
                      <TableCell className="max-w-xs truncate">{resource.title}</TableCell>
                      <TableCell>
                        <Badge>
                          {resource.resourceType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {resource.categoryId ? (
                          categories.find(c => c.id === resource.categoryId)?.name || "Unknown"
                        ) : (
                          "Uncategorized"
                        )}
                      </TableCell>
                      <TableCell>{resource.authorId}</TableCell>
                      <TableCell>
                        <Switch 
                          checked={!!resource.featured} 
                          onCheckedChange={() => toggleFeatured(resource)}
                          aria-label="Toggle featured status"
                        />
                      </TableCell>
                      <TableCell>{new Date(resource.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(`/resource/${resource.id}`, '_blank')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => deleteResource(resource.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredResources.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        No resources found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Resource Category</DialogTitle>
            <DialogDescription>
              Create a new category for resources
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newCategory.name}
                onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={newCategory.description}
                onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                className="col-span-3"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createNewCategory}>Create Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ExpertiseTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [newExpertise, setNewExpertise] = useState("");
  const [editingExpertise, setEditingExpertise] = useState<Expertise | null>(null);

  const { data: expertise = [], isLoading } = useQuery({
    queryKey: ['/api/admin/expertise'],
    queryFn: getQueryFn<Expertise[]>({ on401: "throw" }),
  });

  const filteredExpertise = searchQuery 
    ? expertise.filter(exp => 
        exp.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : expertise;

  const createExpertise = async () => {
    if (!newExpertise.trim()) {
      toast({
        title: "Validation Error",
        description: "Expertise name is required",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await apiRequest("POST", `/api/admin/expertise`, { name: newExpertise });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/expertise'] });
      setNewExpertise("");
      toast({
        title: "Expertise Created",
        description: "New expertise area has been created successfully.",
      });
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create expertise",
        variant: "destructive",
      });
    }
  };

  const updateExpertise = async () => {
    if (!editingExpertise || !editingExpertise.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Expertise name is required",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await apiRequest("PUT", `/api/admin/expertise/${editingExpertise.id}`, { name: editingExpertise.name });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/expertise'] });
      setEditingExpertise(null);
      toast({
        title: "Expertise Updated",
        description: "Expertise has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update expertise",
        variant: "destructive",
      });
    }
  };

  const deleteExpertise = async (id: number) => {
    if (!confirm("Are you sure you want to delete this expertise? This will affect professional profiles that use it.")) return;
    
    try {
      await apiRequest("DELETE", `/api/admin/expertise/${id}`, {});
      queryClient.invalidateQueries({ queryKey: ['/api/admin/expertise'] });
      toast({
        title: "Expertise Deleted",
        description: "The expertise has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete expertise",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold">Expertise Management</CardTitle>
        <CardDescription>
          Manage expertise areas for professional profiles
        </CardDescription>
        <div className="flex items-center gap-4 mt-4">
          <Input
            placeholder="Search expertise..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <Button variant="outline" onClick={() => setSearchQuery("")}>
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-6">
          <Input
            placeholder="New expertise area"
            value={newExpertise}
            onChange={(e) => setNewExpertise(e.target.value)}
            className="max-w-sm"
          />
          <Button onClick={createExpertise}>Add Expertise</Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <Table>
            <TableCaption>List of expertise areas</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpertise.map((exp) => (
                <TableRow key={exp.id}>
                  <TableCell>{exp.id}</TableCell>
                  <TableCell>
                    {editingExpertise?.id === exp.id ? (
                      <Input
                        value={editingExpertise.name}
                        onChange={(e) => setEditingExpertise({...editingExpertise, name: e.target.value})}
                        className="max-w-sm"
                      />
                    ) : (
                      exp.name
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {editingExpertise?.id === exp.id ? (
                        <>
                          <Button variant="outline" size="sm" onClick={updateExpertise}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditingExpertise(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="outline" size="sm" onClick={() => setEditingExpertise({...exp})}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => deleteExpertise(exp.id)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredExpertise.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    No expertise areas found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function ForumTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [showPostContent, setShowPostContent] = useState(false);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['/api/admin/forum-posts'],
    queryFn: getQueryFn<ForumPost[]>({ on401: "throw" }),
  });

  const filteredPosts = searchQuery 
    ? posts.filter(post => 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : posts;

  const viewPost = (post: ForumPost) => {
    setSelectedPost(post);
    setShowPostContent(true);
  };

  const deletePost = async (id: number) => {
    if (!confirm("Are you sure you want to delete this forum post? This action cannot be undone.")) return;
    
    try {
      await apiRequest("DELETE", `/api/admin/forum-posts/${id}`, {});
      queryClient.invalidateQueries({ queryKey: ['/api/admin/forum-posts'] });
      toast({
        title: "Post Deleted",
        description: "The forum post has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete forum post",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold">Forum Management</CardTitle>
        <CardDescription>
          Manage forum posts and comments
        </CardDescription>
        <div className="flex items-center gap-4 mt-4">
          <Input
            placeholder="Search forums..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <Button variant="outline" onClick={() => setSearchQuery("")}>
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <Table>
            <TableCaption>List of forum posts</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPosts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>{post.id}</TableCell>
                  <TableCell className="max-w-xs truncate">{post.title}</TableCell>
                  <TableCell>{post.authorId}</TableCell>
                  <TableCell>{new Date(post.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => viewPost(post)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => deletePost(post.id)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPosts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No forum posts found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Sheet open={showPostContent} onOpenChange={setShowPostContent}>
        <SheetContent className="sm:max-w-lg" side="right">
          <SheetHeader>
            <SheetTitle>Forum Post</SheetTitle>
            <SheetDescription>
              Detailed view of the forum post
            </SheetDescription>
          </SheetHeader>
          
          {selectedPost && (
            <ScrollArea className="h-[calc(100vh-12rem)] pr-4 mt-6">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold">Post ID</h3>
                  <p className="text-sm">{selectedPost.id}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Author ID</h3>
                  <p className="text-sm">{selectedPost.authorId}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Creation Date</h3>
                  <p className="text-sm">{new Date(selectedPost.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Title</h3>
                  <p className="text-sm font-medium">{selectedPost.title}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Content</h3>
                  <div className="text-sm mt-2 p-3 bg-gray-50 rounded-md whitespace-pre-wrap">
                    {selectedPost.content}
                  </div>
                </div>
                <div className="pt-4">
                  <Button 
                    variant="destructive" 
                    onClick={() => {
                      deletePost(selectedPost.id);
                      setShowPostContent(false);
                    }}
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Delete Post
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>
    </Card>
  );
}