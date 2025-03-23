import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { CompanyProfile, User } from "@shared/schema";
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
  Users,
  Mail,
  Phone,
  Globe,
  ExternalLink,
  Filter,
} from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function CompanyManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<CompanyProfile | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Fetch companies
  const { data: companies = [], isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['/api/admin/company-profiles'],
    queryFn: getQueryFn<CompanyProfile[]>({ on401: "throw" }),
  });

  // Fetch users for additional info
  const { data: users = [] } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: getQueryFn<User[]>({ on401: "throw" }),
  });

  // Toggle featured status mutation
  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, featured }: { id: number; featured: boolean }) => {
      const response = await apiRequest("PUT", `/api/admin/company-profiles/${id}/featured`, {
        featured,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/company-profiles'] });
      toast({
        title: "Company Updated",
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

  // Verify company mutation
  const verifyCompanyMutation = useMutation({
    mutationFn: async ({ id, verified }: { id: number; verified: boolean }) => {
      const response = await apiRequest("PUT", `/api/admin/company-profiles/${id}/verify`, {
        verified,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/company-profiles'] });
      toast({
        title: "Company Updated",
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

  // Delete company mutation
  const deleteCompanyMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/company-profiles/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/company-profiles'] });
      setIsDeleteDialogOpen(false);
      setSelectedCompany(null);
      toast({
        title: "Company Deleted",
        description: "The company profile has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete company",
        variant: "destructive",
      });
    },
  });

  // Sort and filter companies
  const filteredCompanies = companies
    .filter(
      (company) =>
        !searchQuery ||
        company.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortField) return 0;

      let valueA: any;
      let valueB: any;

      switch (sortField) {
        case 'companyName':
          valueA = a.companyName || '';
          valueB = b.companyName || '';
          break;
        case 'industry':
          valueA = a.industry || '';
          valueB = b.industry || '';
          break;
        case 'location':
          valueA = a.location || '';
          valueB = b.location || '';
          break;
        case 'size':
          valueA = a.employeeCount || 0;
          valueB = b.employeeCount || 0;
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

  // View company details
  const handleViewCompany = (company: CompanyProfile) => {
    setSelectedCompany(company);
    setIsViewDialogOpen(true);
  };

  // Handle delete company
  const handleDeleteCompany = (company: CompanyProfile) => {
    setSelectedCompany(company);
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

  // Get user email by company's userId
  const getUserEmail = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user?.email || 'No email found';
  };

  // Get company size label
  const getCompanySize = (employeeCount?: number | null) => {
    if (!employeeCount) return 'Unknown';
    if (employeeCount < 10) return 'Micro (1-9)';
    if (employeeCount < 50) return 'Small (10-49)';
    if (employeeCount < 250) return 'Medium (50-249)';
    return 'Large (250+)';
  };

  // Get company logo initials
  const getCompanyInitials = (companyName?: string | null) => {
    if (!companyName) return 'CO';
    const words = companyName.split(' ');
    if (words.length === 1) {
      return companyName.substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Company Management</CardTitle>
          <CardDescription>
            Manage company profiles and verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search companies..."
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
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/company-profiles'] })}
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
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('companyName')}
                    >
                      Company {sortField === 'companyName' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('industry')}
                    >
                      Industry {sortField === 'industry' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('location')}
                    >
                      Location {sortField === 'location' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('size')}
                    >
                      Size {sortField === 'size' && (sortDirection === 'asc' ? '↑' : '↓')}
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
                  {isLoadingCompanies ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        <div className="flex justify-center">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredCompanies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No companies found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCompanies.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={company.logoUrl || ""} alt={company.companyName || ""} />
                              <AvatarFallback>{getCompanyInitials(company.companyName)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{company.companyName}</div>
                              <div className="text-sm text-muted-foreground truncate max-w-[150px]">
                                {getUserEmail(company.userId)}
                              </div>
                            </div>
                            {company.featured && (
                              <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                                <Star className="mr-1 h-3 w-3" /> Featured
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{company.industry || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <MapPin className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                            {company.location || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Users className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                            {getCompanySize(company.employeeCount)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {company.verified ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              Unverified
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {company.createdAt ? format(new Date(company.createdAt), 'MMM d, yyyy') : 'Unknown'}
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
                              <DropdownMenuItem onClick={() => handleViewCompany(company)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  toggleFeaturedMutation.mutate({
                                    id: company.id,
                                    featured: !company.featured,
                                  })
                                }
                              >
                                <Star className="mr-2 h-4 w-4" />
                                {company.featured ? "Remove Featured" : "Mark as Featured"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  verifyCompanyMutation.mutate({
                                    id: company.id,
                                    verified: !company.verified,
                                  })
                                }
                              >
                                <Building2 className="mr-2 h-4 w-4" />
                                {company.verified ? "Remove Verification" : "Verify Company"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDeleteCompany(company)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Company
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

      {/* View Company Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Company Profile</DialogTitle>
            <DialogDescription>
              Detailed information about the selected company
            </DialogDescription>
          </DialogHeader>

          {selectedCompany && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedCompany.logoUrl || ""} alt={selectedCompany.companyName || ""} />
                  <AvatarFallback className="text-xl">{getCompanyInitials(selectedCompany.companyName)}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold">{selectedCompany.companyName}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedCompany.featured && (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                        <Star className="mr-1 h-3 w-3" /> Featured
                      </Badge>
                    )}
                    {selectedCompany.verified ? (
                      <Badge className="bg-green-100 text-green-800">
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        Unverified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Industry: {selectedCompany.industry || 'Not specified'}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Location: {selectedCompany.location || 'Not specified'}</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Size: {getCompanySize(selectedCompany.employeeCount)}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Contact: {getUserEmail(selectedCompany.userId)}</span>
                </div>
                {selectedCompany.phone && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{selectedCompany.phone}</span>
                  </div>
                )}
                {selectedCompany.website && (
                  <div className="flex items-center">
                    <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                    <a 
                      href={selectedCompany.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center"
                    >
                      {selectedCompany.website}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                )}
              </div>

              {selectedCompany.description && (
                <div>
                  <h3 className="text-lg font-medium mb-2">About</h3>
                  <p className="text-sm text-muted-foreground border rounded-md p-3 bg-muted/30">
                    {selectedCompany.description}
                  </p>
                </div>
              )}

              {selectedCompany.mission && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Mission</h3>
                  <p className="text-sm text-muted-foreground border rounded-md p-3 bg-muted/30">
                    {selectedCompany.mission}
                  </p>
                </div>
              )}

              <div className="flex justify-between pt-4 border-t">
                <Button
                  variant="destructive"
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    handleDeleteCompany(selectedCompany);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant={selectedCompany.featured ? "outline" : "default"}
                    onClick={() =>
                      toggleFeaturedMutation.mutate({
                        id: selectedCompany.id,
                        featured: !selectedCompany.featured,
                      })
                    }
                  >
                    <Star className="mr-2 h-4 w-4" />
                    {selectedCompany.featured ? "Remove Featured" : "Mark as Featured"}
                  </Button>
                  <Button
                    variant={selectedCompany.verified ? "outline" : "default"}
                    onClick={() =>
                      verifyCompanyMutation.mutate({
                        id: selectedCompany.id,
                        verified: !selectedCompany.verified,
                      })
                    }
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    {selectedCompany.verified ? "Remove Verification" : "Verify Company"}
                  </Button>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground pt-2 border-t">
                <div className="flex justify-between">
                  <span>Joined: {selectedCompany.createdAt ? format(new Date(selectedCompany.createdAt), 'MMMM d, yyyy') : 'Unknown'}</span>
                  <span>Last Updated: {selectedCompany.updatedAt ? format(new Date(selectedCompany.updatedAt), 'MMMM d, yyyy') : 'Unknown'}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Company Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the company profile and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedCompany) {
                  deleteCompanyMutation.mutate(selectedCompany.id);
                }
              }}
              className="bg-red-600 focus:ring-red-600"
            >
              {deleteCompanyMutation.isPending ? (
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