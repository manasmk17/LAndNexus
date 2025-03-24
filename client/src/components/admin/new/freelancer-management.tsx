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
  UserPlus, 
  Star, 
  StarOff, 
  CheckCircle2, 
  XCircle, 
  MoreHorizontal,
  Download,
  Eye,
  Trash2,
  AlertTriangle,
  Edit,
  Loader2
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { ProfessionalProfile } from "@shared/schema";

export default function FreelancerManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [freelancerToDelete, setFreelancerToDelete] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch all professional profiles from the API
  const { 
    data: freelancers = [], 
    isLoading,
    isError,
    error
  } = useQuery<ProfessionalProfile[]>({
    queryKey: ['/api/professional-profiles'],
    queryFn: getQueryFn({ on401: 'throw' })
  });
  
  // Toggle featured status mutation
  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, featured }: { id: number, featured: boolean }) => {
      return await apiRequest('PATCH', `/api/professional-profiles/${id}`, {
        featured
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/professional-profiles'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update featured status',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Toggle verified status mutation
  const toggleVerifiedMutation = useMutation({
    mutationFn: async ({ id, verified }: { id: number, verified: boolean }) => {
      return await apiRequest('PATCH', `/api/professional-profiles/${id}`, {
        verified
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/professional-profiles'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update verification status',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Delete professional profile mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/professional-profiles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/professional-profiles'] });
      setDeleteDialogOpen(false);
      setFreelancerToDelete(null);
      
      toast({
        title: "Professional profile deleted",
        description: "The profile has been removed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete profile',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Filter freelancers based on search term
  const filteredFreelancers = freelancers.filter(freelancer => {
    const searchFields = [
      freelancer.firstName || '',
      freelancer.lastName || '',
      freelancer.title || '',
      freelancer.location || '',
      freelancer.bio || '',
    ];
    
    return searchFields.some(field => 
      field.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleToggleFeatured = (id: number) => {
    const freelancer = freelancers.find(f => f.id === id);
    if (!freelancer) return;
    
    // Using the new value (opposite of current value)
    const newFeaturedValue = !freelancer.featured;
    
    toggleFeaturedMutation.mutate({ 
      id, 
      featured: newFeaturedValue 
    });
    
    const action = freelancer.featured ? "removed from" : "added to";
    toast({
      title: `Featured status updated`,
      description: `${freelancer?.firstName || 'Professional'} ${freelancer?.lastName || ''} has been ${action} featured professionals.`,
    });
  };

  const handleToggleVerified = (id: number) => {
    const freelancer = freelancers.find(f => f.id === id);
    if (!freelancer) return;
    
    // Using the new value (opposite of current value)
    const newVerifiedValue = !freelancer.verified;
    
    toggleVerifiedMutation.mutate({ 
      id, 
      verified: newVerifiedValue 
    });
    
    const action = freelancer.verified ? "unverified" : "verified";
    toast({
      title: `Verification status updated`,
      description: `${freelancer?.firstName || 'Professional'} ${freelancer?.lastName || ''} has been ${action}.`,
    });
  };

  const handleDeleteClick = (id: number) => {
    setFreelancerToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (freelancerToDelete === null) return;
    
    // Call the delete mutation
    deleteMutation.mutate(freelancerToDelete);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">Freelancer Management</h2>
          <Button variant="outline" disabled className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>L&D Professionals</CardTitle>
            <CardDescription>
              Loading professional profiles...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-full h-12 bg-muted/30 animate-pulse rounded-md"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">Freelancer Management</h2>
          <Button 
            variant="outline" 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/professional-profiles'] })}
            className="flex items-center gap-2"
          >
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Retry
          </Button>
        </div>
        
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Error Loading Data
            </CardTitle>
            <CardDescription>
              There was a problem loading professional profiles. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">
              {error instanceof Error ? error.message : 'Unknown error occurred'}
            </pre>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Freelancer Management</h2>
        <div className="flex gap-2">
          <Button className="flex items-center gap-1">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Freelancer</span>
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
            placeholder="Search freelancers..."
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
            <DropdownMenuLabel>Filter Freelancers</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>All Freelancers</DropdownMenuItem>
            <DropdownMenuItem>Featured Only</DropdownMenuItem>
            <DropdownMenuItem>Verified Only</DropdownMenuItem>
            <DropdownMenuItem>Full-time</DropdownMenuItem>
            <DropdownMenuItem>Part-time</DropdownMenuItem>
            <DropdownMenuItem>Contract</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Freelancers table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>L&D Professionals</CardTitle>
            <CardDescription>
              Manage professional profiles, verification, and featured status.
            </CardDescription>
          </div>
          <Badge variant="outline">
            {freelancers.length} {freelancers.length === 1 ? 'Professional' : 'Professionals'}
          </Badge>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead className="text-center">Featured</TableHead>
                <TableHead className="text-center">Verified</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFreelancers.map((freelancer) => (
                <TableRow key={freelancer.id}>
                  <TableCell className="font-medium">
                    {freelancer.firstName || 'Unnamed'} {freelancer.lastName || 'Professional'}
                  </TableCell>
                  <TableCell>{freelancer.title || 'No title'}</TableCell>
                  <TableCell>{freelancer.location || 'No location'}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500 mr-1" />
                      <span>{freelancer.rating || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>{freelancer.yearsExperience || 0} years</TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleFeatured(freelancer.id)}
                      disabled={toggleFeaturedMutation.isPending}
                    >
                      {freelancer.featured ? (
                        <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                      ) : (
                        <StarOff className="h-5 w-5 text-muted-foreground" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleVerified(freelancer.id)}
                      disabled={toggleVerifiedMutation.isPending}
                    >
                      {freelancer.verified ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground" />
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
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleToggleFeatured(freelancer.id)}>
                          {freelancer.featured ? (
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
                        <DropdownMenuItem onClick={() => handleToggleVerified(freelancer.id)}>
                          {freelancer.verified ? (
                            <>
                              <XCircle className="h-4 w-4 mr-2" />
                              Unverify Professional
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Verify Professional
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(freelancer.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Freelancer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredFreelancers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                    No professionals found matching your search criteria.
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
              Delete Professional
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the professional profile
              and remove all associated data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}