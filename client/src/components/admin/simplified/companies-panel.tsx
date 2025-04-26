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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CompanyProfile } from "@shared/schema";
import { Edit, Trash, Eye, Building2, ExternalLink, CheckCircle2, XCircle } from "lucide-react";

export default function CompaniesPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [verificationFilter, setVerificationFilter] = useState<string>("all");

  // Fetch all company profiles
  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['/api/admin/company-profiles'],
    queryFn: getQueryFn<CompanyProfile[]>({ on401: "throw" }),
  });

  // Apply filters
  const filteredCompanies = companies.filter(company => {
    const matchesSearch = searchQuery === "" || 
      company.companyName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      company.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.location?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesVerification = verificationFilter === "all" || 
      (verificationFilter === "verified" && company.verified) ||
      (verificationFilter === "unverified" && !company.verified);
    
    return matchesSearch && matchesVerification;
  });

  const handleViewDetails = (company: CompanyProfile) => {
    setSelectedCompany(company);
    setShowDetailsDialog(true);
  };

  const handleEdit = (company: CompanyProfile) => {
    setSelectedCompany({...company});
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!selectedCompany) return;
    
    try {
      await apiRequest("PATCH", `/api/admin/company-profiles/${selectedCompany.id}`, selectedCompany);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/company-profiles'] });
      toast({
        title: "Company Updated",
        description: `${selectedCompany.companyName}'s profile has been updated.`,
      });
      setShowDialog(false);
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update company profile",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this company profile? This action cannot be undone.")) return;
    
    try {
      await apiRequest("DELETE", `/api/admin/company-profiles/${id}`);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/company-profiles'] });
      toast({
        title: "Company Deleted",
        description: "The company profile has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete company profile",
        variant: "destructive",
      });
    }
  };

  const toggleVerification = async (company: CompanyProfile) => {
    try {
      await apiRequest("PATCH", `/api/admin/company-profiles/${company.id}`, {
        ...company,
        verified: !company.verified
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/company-profiles'] });
      toast({
        title: company.verified ? "Verification Removed" : "Company Verified",
        description: `${company.companyName}'s profile is now ${company.verified ? "unverified" : "verified"}.`,
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update verification status",
        variant: "destructive",
      });
    }
  };

  const toggleFeatured = async (company: CompanyProfile) => {
    try {
      await apiRequest("PATCH", `/api/admin/company-profiles/${company.id}`, {
        ...company,
        featured: !company.featured
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/company-profiles'] });
      toast({
        title: company.featured ? "Removed from Featured" : "Added to Featured",
        description: `${company.companyName}'s profile is ${company.featured ? "no longer" : "now"} featured.`,
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update featured status",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold">Companies Management</CardTitle>
        <CardDescription>
          View and manage company profiles on the platform
        </CardDescription>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4">
          <Input
            placeholder="Search companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:max-w-xs"
          />
          <div className="flex items-center gap-2">
            <Select value={verificationFilter} onValueChange={setVerificationFilter}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Verification Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                <SelectItem value="verified">Verified Only</SelectItem>
                <SelectItem value="unverified">Unverified Only</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => {
              setSearchQuery("");
              setVerificationFilter("all");
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
              <TableCaption>List of {filteredCompanies.length} company profiles</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Company Size</TableHead>
                  <TableHead className="text-center">Verified</TableHead>
                  <TableHead className="text-center">Featured</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.companyName}</TableCell>
                    <TableCell>{company.industry || "Not specified"}</TableCell>
                    <TableCell>{company.location || "Not specified"}</TableCell>
                    <TableCell>{company.companySize || "Not specified"}</TableCell>
                    <TableCell className="text-center">
                      <Switch 
                        checked={company.verified || false} 
                        onCheckedChange={() => toggleVerification(company)}
                        aria-label="Toggle verification status"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch 
                        checked={company.featured || false} 
                        onCheckedChange={() => toggleFeatured(company)}
                        aria-label="Toggle featured status"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleViewDetails(company)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(company)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(company.id)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredCompanies.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No companies found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Edit Company Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Company Profile</DialogTitle>
            <DialogDescription>
              Update company profile details
            </DialogDescription>
          </DialogHeader>
          
          {selectedCompany && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="companyName" className="text-right">
                  Company Name
                </Label>
                <Input
                  id="companyName"
                  value={selectedCompany.companyName}
                  onChange={(e) => setSelectedCompany({...selectedCompany, companyName: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="industry" className="text-right">
                  Industry
                </Label>
                <Input
                  id="industry"
                  value={selectedCompany.industry || ""}
                  onChange={(e) => setSelectedCompany({...selectedCompany, industry: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location" className="text-right">
                  Location
                </Label>
                <Input
                  id="location"
                  value={selectedCompany.location || ""}
                  onChange={(e) => setSelectedCompany({...selectedCompany, location: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="companySize" className="text-right">
                  Size
                </Label>
                <Input
                  id="companySize"
                  value={selectedCompany.companySize || ""}
                  onChange={(e) => setSelectedCompany({...selectedCompany, companySize: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="description" className="text-right pt-2">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={selectedCompany.description || ""}
                  onChange={(e) => setSelectedCompany({...selectedCompany, description: e.target.value})}
                  className="col-span-3"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="website" className="text-right">
                  Website
                </Label>
                <Input
                  id="website"
                  type="url"
                  value={selectedCompany.website || ""}
                  onChange={(e) => setSelectedCompany({...selectedCompany, website: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="verified" className="text-right">
                  Verified
                </Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Switch
                    id="verified"
                    checked={selectedCompany.verified || false}
                    onCheckedChange={(checked) => setSelectedCompany({...selectedCompany, verified: checked})}
                  />
                  <Label htmlFor="verified" className="cursor-pointer">
                    {selectedCompany.verified ? "Yes" : "No"}
                  </Label>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="featured" className="text-right">
                  Featured
                </Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Switch
                    id="featured"
                    checked={selectedCompany.featured || false}
                    onCheckedChange={(checked) => setSelectedCompany({...selectedCompany, featured: checked})}
                  />
                  <Label htmlFor="featured" className="cursor-pointer">
                    {selectedCompany.featured ? "Yes" : "No"}
                  </Label>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Company Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Company Profile Details</DialogTitle>
            <DialogDescription>
              Complete information about the company
            </DialogDescription>
          </DialogHeader>
          
          {selectedCompany && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3 space-y-4">
                  <div className="aspect-square rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden">
                    {selectedCompany.logo ? (
                      <img 
                        src={selectedCompany.logo} 
                        alt={selectedCompany.companyName}
                        className="object-cover w-full h-full" 
                      />
                    ) : (
                      <Building2 className="h-16 w-16 text-gray-400" />
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{selectedCompany.companyName}</h3>
                    <p className="text-muted-foreground">{selectedCompany.industry || "Industry not specified"}</p>
                    <div className="flex items-center gap-2">
                      {selectedCompany.verified ? (
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300 flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          Unverified
                        </Badge>
                      )}
                      {selectedCompany.featured && (
                        <Badge variant="secondary">
                          Featured
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-3">
                    <h4 className="font-medium mb-2">Company Information</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Location:</span> {selectedCompany.location || "Not specified"}</p>
                      <p><span className="font-medium">Company Size:</span> {selectedCompany.companySize || "Not specified"}</p>
                      {selectedCompany.website && (
                        <p className="flex items-center">
                          <span className="font-medium mr-1">Website:</span> 
                          <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" className="text-primary flex items-center">
                            {selectedCompany.website.replace(/^https?:\/\//, '')}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </p>
                      )}
                      <p><span className="font-medium">Founded:</span> {selectedCompany.foundedYear || "Not specified"}</p>
                    </div>
                  </div>
                </div>
                
                <div className="md:w-2/3 space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Company Description</h3>
                    <p className="text-muted-foreground whitespace-pre-line">
                      {selectedCompany.description || "No description provided."}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">L&D Focus Areas</h3>
                    {selectedCompany.trainingFocus ? (
                      <p className="text-muted-foreground">{selectedCompany.trainingFocus}</p>
                    ) : (
                      <p className="text-muted-foreground">No focus areas specified.</p>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border rounded-md p-3">
                        <h4 className="font-medium mb-1">Primary Contact</h4>
                        <p className="text-sm">
                          {selectedCompany.contactName || "Not specified"}
                        </p>
                        <p className="text-sm">
                          {selectedCompany.contactEmail || "No email specified"}
                        </p>
                        <p className="text-sm">
                          {selectedCompany.contactPhone || "No phone specified"}
                        </p>
                      </div>
                      
                      <div className="border rounded-md p-3">
                        <h4 className="font-medium mb-1">Address</h4>
                        <p className="text-sm whitespace-pre-line">
                          {selectedCompany.address || "No address specified"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4 flex justify-between">
                <Button variant="outline" onClick={() => handleEdit(selectedCompany)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Company
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant={selectedCompany.featured ? "outline" : "default"} 
                    onClick={() => {
                      toggleFeatured(selectedCompany);
                      setShowDetailsDialog(false);
                    }}
                  >
                    {selectedCompany.featured ? "Remove from Featured" : "Feature Company"}
                  </Button>
                  <Button 
                    variant={selectedCompany.verified ? "outline" : "default"} 
                    onClick={() => {
                      toggleVerification(selectedCompany);
                      setShowDetailsDialog(false);
                    }}
                  >
                    {selectedCompany.verified ? "Remove Verification" : "Verify Company"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}