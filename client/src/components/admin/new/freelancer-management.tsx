import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { ProfessionalProfile, User, Expertise, Certification } from "@shared/schema";
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
  Check,
  ExternalLink,
  Map,
  User as UserIcon,
  Briefcase,
  VideoIcon,
  Award,
  MailIcon,
  Phone,
  Filter,
} from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function FreelancerManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfessional, setSelectedProfessional] = useState<ProfessionalProfile | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Fetch professionals
  const { data: professionals = [], isLoading: isLoadingProfessionals } = useQuery({
    queryKey: ['/api/admin/professional-profiles'],
    queryFn: getQueryFn<ProfessionalProfile[]>({ on401: "throw" }),
  });

  // Fetch users for additional info
  const { data: users = [] } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: getQueryFn<User[]>({ on401: "throw" }),
  });

  // Fetch expertise data for selected professional
  const { data: expertise = [] } = useQuery({
    queryKey: ['/api/professional-profiles', selectedProfessional?.id, 'expertise'],
    queryFn: getQueryFn<Expertise[]>({ on401: "throw" }),
    enabled: !!selectedProfessional,
  });

  // Fetch certifications for selected professional
  const { data: certifications = [] } = useQuery({
    queryKey: ['/api/professional-profiles', selectedProfessional?.id, 'certifications'],
    queryFn: getQueryFn<Certification[]>({ on401: "throw" }),
    enabled: !!selectedProfessional,
  });

  // Toggle featured status mutation
  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, featured }: { id: number; featured: boolean }) => {
      const response = await apiRequest("PUT", `/api/admin/professional-profiles/${id}/featured`, {
        featured,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/professional-profiles'] });
      toast({
        title: "Profile Updated",
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

  // Verify profile mutation
  const verifyProfileMutation = useMutation({
    mutationFn: async ({ id, verified }: { id: number; verified: boolean }) => {
      const response = await apiRequest("PUT", `/api/admin/professional-profiles/${id}/verify`, {
        verified,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/professional-profiles'] });
      toast({
        title: "Profile Updated",
        description: "Verification status has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update verification status",
        variant: "destructive",
      });
    },
  });

  // Delete professional mutation
  const deleteProfessionalMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/professional-profiles/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/professional-profiles'] });
      setIsDeleteDialogOpen(false);
      setSelectedProfessional(null);
      toast({
        title: "Profile Deleted",
        description: "The professional profile has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete profile",
        variant: "destructive",
      });
    },
  });

  // Sort and filter professionals
  const filteredProfessionals = professionals
    .filter(
      (professional) =>
        !searchQuery ||
        professional.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        professional.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        professional.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        professional.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        professional.skills?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        professional.industryFocus?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortField) return 0;

      let valueA: any;
      let valueB: any;

      switch (sortField) {
        case 'firstName':
          valueA = a.firstName || '';
          valueB = b.firstName || '';
          break;
        case 'lastName':
          valueA = a.lastName || '';
          valueB = b.lastName || '';
          break;
        case 'title':
          valueA = a.title || '';
          valueB = b.title || '';
          break;
        case 'location':
          valueA = a.location || '';
          valueB = b.location || '';
          break;
        case 'hourlyRate':
          valueA = a.hourlyRate || 0;
          valueB = b.hourlyRate || 0;
          break;
        case 'createdAt':
          valueA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          valueB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });

  // View professional details
  const handleViewProfessional = (professional: ProfessionalProfile) => {
    setSelectedProfessional(professional);
    setIsViewDialogOpen(true);
  };

  // Handle delete professional
  const handleDeleteProfessional = (professional: ProfessionalProfile) => {
    setSelectedProfessional(professional);
    setIsDeleteDialogOpen(true);
  };

  // Handle sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get user email by professional's userId
  const getUserEmail = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user?.email || 'No email found';
  };

  // Get initials for avatar
  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last || 'N/A';
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Freelancer Management</CardTitle>
          <CardDescription>
            Manage and monitor professional profiles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search professionals..."
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
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/professional-profiles'] })}
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                title="Filter"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Professional</TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('title')}
                    >
                      Title {sortField === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('location')}
                    >
                      Location {sortField === 'location' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('hourlyRate')}
                    >
                      Rate {sortField === 'hourlyRate' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('createdAt')}
                    >
                      Joined {sortField === 'createdAt' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingProfessionals ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        <div className="flex justify-center">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredProfessionals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No professionals found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProfessionals.map((professional) => (
                      <TableRow key={professional.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={professional.profileImageUrl || ""} alt={professional.firstName || ""} />
                              <AvatarFallback>{getInitials(professional.firstName, professional.lastName)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{professional.firstName} {professional.lastName}</div>
                              <div className="text-sm text-muted-foreground truncate max-w-[150px]">
                                {getUserEmail(professional.userId)}
                              </div>
                            </div>
                            {professional.featured && (
                              <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                                <Star className="mr-1 h-3 w-3" /> Featured
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{professional.title || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Map className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                            {professional.location || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {professional.hourlyRate ? `$${professional.hourlyRate}/hr` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {professional.verified ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                              <Check className="mr-1 h-3 w-3" /> Verified
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              Unverified
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {professional.createdAt ? format(new Date(professional.createdAt), 'MMM d, yyyy') : 'Unknown'}
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
                              <DropdownMenuItem onClick={() => handleViewProfessional(professional)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  toggleFeaturedMutation.mutate({
                                    id: professional.id,
                                    featured: !professional.featured,
                                  })
                                }
                              >
                                <Star className="mr-2 h-4 w-4" />
                                {professional.featured ? "Remove Featured" : "Mark as Featured"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  verifyProfileMutation.mutate({
                                    id: professional.id,
                                    verified: !professional.verified,
                                  })
                                }
                              >
                                <Check className="mr-2 h-4 w-4" />
                                {professional.verified ? "Remove Verification" : "Verify Profile"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDeleteProfessional(professional)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Profile
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

      {/* View Professional Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Professional Profile</DialogTitle>
            <DialogDescription>
              Detailed information about the selected professional
            </DialogDescription>
          </DialogHeader>

          {selectedProfessional && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3 flex flex-col items-center text-center">
                  <Avatar className="h-24 w-24 mb-3">
                    <AvatarImage src={selectedProfessional.profileImageUrl || ""} alt={selectedProfessional.firstName || ""} />
                    <AvatarFallback className="text-2xl">
                      {getInitials(selectedProfessional.firstName, selectedProfessional.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-bold">
                    {selectedProfessional.firstName} {selectedProfessional.lastName}
                  </h2>
                  <p className="text-muted-foreground">{selectedProfessional.title}</p>
                  
                  <div className="flex items-center justify-center mt-2 gap-1">
                    {selectedProfessional.featured && (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                        <Star className="mr-1 h-3 w-3" /> Featured
                      </Badge>
                    )}
                    {selectedProfessional.verified ? (
                      <Badge className="bg-green-100 text-green-800">
                        <Check className="mr-1 h-3 w-3" /> Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        Unverified
                      </Badge>
                    )}
                  </div>
                  
                  <div className="mt-4 space-y-2 w-full">
                    <div className="flex items-center gap-2 justify-center">
                      <MailIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{getUserEmail(selectedProfessional.userId)}</span>
                    </div>
                    {selectedProfessional.phone && (
                      <div className="flex items-center gap-2 justify-center">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedProfessional.phone}</span>
                      </div>
                    )}
                    {selectedProfessional.location && (
                      <div className="flex items-center gap-2 justify-center">
                        <Map className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedProfessional.location}</span>
                      </div>
                    )}
                    {selectedProfessional.hourlyRate && (
                      <div className="flex items-center gap-2 justify-center">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">${selectedProfessional.hourlyRate}/hr</span>
                      </div>
                    )}
                  </div>
                  
                  {selectedProfessional.videoIntroUrl && (
                    <div className="mt-4 w-full">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => window.open(selectedProfessional.videoIntroUrl!, '_blank')}
                      >
                        <VideoIcon className="mr-2 h-4 w-4" />
                        Watch Video Introduction
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="md:w-2/3 space-y-4">
                  {selectedProfessional.bio && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Biography</h3>
                      <p className="text-sm">{selectedProfessional.bio}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedProfessional.skills && (
                      <div>
                        <h3 className="text-sm font-medium mb-2 flex items-center">
                          <Briefcase className="h-4 w-4 mr-1" /> 
                          Skills
                        </h3>
                        <div className="flex flex-wrap gap-1">
                          {selectedProfessional.skills.split(',').map((skill, index) => (
                            <Badge key={index} variant="outline">
                              {skill.trim()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedProfessional.industryFocus && (
                      <div>
                        <h3 className="text-sm font-medium mb-2">Industry Focus</h3>
                        <div className="flex flex-wrap gap-1">
                          {selectedProfessional.industryFocus.split(',').map((industry, index) => (
                            <Badge key={index} variant="outline">
                              {industry.trim()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {expertise.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Expertise</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {expertise.map((exp) => (
                          <li key={exp.id}>{exp.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {certifications.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-2 flex items-center">
                        <Award className="h-4 w-4 mr-1" /> Certifications
                      </h3>
                      <div className="space-y-2">
                        {certifications.map((cert) => (
                          <div key={cert.id} className="border rounded-md p-2">
                            <div className="font-medium">{cert.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Issued by: {cert.issuingOrganization}
                              {cert.issueDate && ` • Issued: ${format(new Date(cert.issueDate), 'MMM yyyy')}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedProfessional.workExperience && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Work Experience</h3>
                      <div className="text-sm">{selectedProfessional.workExperience}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t">
                <div>
                  <Button
                    variant="outline"
                    onClick={() => window.open(`/professional-profile/${selectedProfessional.id}`, '_blank')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Public Profile
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={selectedProfessional.featured ? "outline" : "default"}
                    onClick={() =>
                      toggleFeaturedMutation.mutate({
                        id: selectedProfessional.id,
                        featured: !selectedProfessional.featured,
                      })
                    }
                  >
                    <Star className="mr-2 h-4 w-4" />
                    {selectedProfessional.featured ? "Remove Featured" : "Mark as Featured"}
                  </Button>
                  <Button
                    variant={selectedProfessional.verified ? "outline" : "default"}
                    onClick={() =>
                      verifyProfileMutation.mutate({
                        id: selectedProfessional.id,
                        verified: !selectedProfessional.verified,
                      })
                    }
                  >
                    <Check className="mr-2 h-4 w-4" />
                    {selectedProfessional.verified ? "Remove Verification" : "Verify Profile"}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setIsViewDialogOpen(false);
                      handleDeleteProfessional(selectedProfessional);
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground pt-2 border-t">
                <div className="flex justify-between">
                  <span>Joined: {selectedProfessional.createdAt ? format(new Date(selectedProfessional.createdAt), 'MMMM d, yyyy') : 'Unknown'}</span>
                  <span>Last Updated: {selectedProfessional.updatedAt ? format(new Date(selectedProfessional.updatedAt), 'MMMM d, yyyy') : 'Unknown'}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Professional Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the professional profile and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedProfessional) {
                  deleteProfessionalMutation.mutate(selectedProfessional.id);
                }
              }}
              className="bg-red-600 focus:ring-red-600"
            >
              {deleteProfessionalMutation.isPending ? (
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