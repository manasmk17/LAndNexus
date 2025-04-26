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
import { ProfessionalProfile, Expertise } from "@shared/schema";
import { Edit, Trash, Eye, Star, ExternalLink, CheckCircle2, XCircle } from "lucide-react";

export default function ProfessionalsPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<ProfessionalProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [verificationFilter, setVerificationFilter] = useState<string>("all");

  // Fetch all professional profiles
  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['/api/admin/professional-profiles'],
    queryFn: getQueryFn<ProfessionalProfile[]>({ on401: "throw" }),
  });

  // Apply filters
  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = searchQuery === "" || 
      profile.firstName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      profile.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${profile.firstName} ${profile.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesVerification = verificationFilter === "all" || 
      (verificationFilter === "verified" && profile.verified) ||
      (verificationFilter === "unverified" && !profile.verified);
    
    return matchesSearch && matchesVerification;
  });

  const handleViewDetails = async (profile: ProfessionalProfile) => {
    try {
      // Fetch expertise for this professional
      const expertise = await apiRequest("GET", `/api/professional-profiles/${profile.id}/expertise`);
      const expertiseData = await expertise.json();
      
      // Fetch certifications for this professional
      const certifications = await apiRequest("GET", `/api/professional-profiles/${profile.id}/certifications`);
      const certificationsData = await certifications.json();
      
      // Set selected profile with additional data
      setSelectedProfile({
        ...profile,
        expertise: expertiseData,
        certifications: certificationsData
      });
      setShowDetailsDialog(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load professional details",
        variant: "destructive"
      });
      console.error(error);
    }
  };

  const handleEdit = (profile: ProfessionalProfile) => {
    setSelectedProfile({...profile});
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!selectedProfile) return;
    
    try {
      await apiRequest("PATCH", `/api/admin/professional-profiles/${selectedProfile.id}`, selectedProfile);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/professional-profiles'] });
      toast({
        title: "Profile Updated",
        description: `${selectedProfile.firstName} ${selectedProfile.lastName}'s profile has been updated.`,
      });
      setShowDialog(false);
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update professional profile",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this professional profile? This action cannot be undone.")) return;
    
    try {
      await apiRequest("DELETE", `/api/admin/professional-profiles/${id}`);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/professional-profiles'] });
      toast({
        title: "Profile Deleted",
        description: "The professional profile has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete professional profile",
        variant: "destructive",
      });
    }
  };

  const toggleVerification = async (profile: ProfessionalProfile) => {
    try {
      await apiRequest("PATCH", `/api/admin/professional-profiles/${profile.id}`, {
        ...profile,
        verified: !profile.verified
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/professional-profiles'] });
      toast({
        title: profile.verified ? "Verification Removed" : "Profile Verified",
        description: `${profile.firstName} ${profile.lastName}'s profile is now ${profile.verified ? "unverified" : "verified"}.`,
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update verification status",
        variant: "destructive",
      });
    }
  };

  const toggleFeatured = async (profile: ProfessionalProfile) => {
    try {
      await apiRequest("PATCH", `/api/admin/professional-profiles/${profile.id}`, {
        ...profile,
        featured: !profile.featured
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/professional-profiles'] });
      toast({
        title: profile.featured ? "Removed from Featured" : "Added to Featured",
        description: `${profile.firstName} ${profile.lastName}'s profile is ${profile.featured ? "no longer" : "now"} featured.`,
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
        <CardTitle className="text-xl font-bold">Professionals Management</CardTitle>
        <CardDescription>
          View and manage professional profiles on the platform
        </CardDescription>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4">
          <Input
            placeholder="Search professionals..."
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
                <SelectItem value="all">All Profiles</SelectItem>
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
              <TableCaption>List of {filteredProfiles.length} professional(s)</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-center">Rating</TableHead>
                  <TableHead className="text-center">Verified</TableHead>
                  <TableHead className="text-center">Featured</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">{profile.firstName} {profile.lastName}</TableCell>
                    <TableCell>{profile.title || "No title"}</TableCell>
                    <TableCell>{profile.location || "Not specified"}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        <Star className="h-4 w-4 text-yellow-500 mr-1 fill-yellow-500" />
                        {profile.rating?.toFixed(1) || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch 
                        checked={profile.verified || false} 
                        onCheckedChange={() => toggleVerification(profile)}
                        aria-label="Toggle verification status"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch 
                        checked={profile.featured || false} 
                        onCheckedChange={() => toggleFeatured(profile)}
                        aria-label="Toggle featured status"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleViewDetails(profile)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(profile)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(profile.id)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredProfiles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No professionals found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Edit Professional Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Professional Profile</DialogTitle>
            <DialogDescription>
              Update professional profile details
            </DialogDescription>
          </DialogHeader>
          
          {selectedProfile && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="firstName" className="text-right">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  value={selectedProfile.firstName}
                  onChange={(e) => setSelectedProfile({...selectedProfile, firstName: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lastName" className="text-right">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  value={selectedProfile.lastName}
                  onChange={(e) => setSelectedProfile({...selectedProfile, lastName: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input
                  id="title"
                  value={selectedProfile.title || ""}
                  onChange={(e) => setSelectedProfile({...selectedProfile, title: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location" className="text-right">
                  Location
                </Label>
                <Input
                  id="location"
                  value={selectedProfile.location || ""}
                  onChange={(e) => setSelectedProfile({...selectedProfile, location: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="bio" className="text-right pt-2">
                  Bio
                </Label>
                <Textarea
                  id="bio"
                  value={selectedProfile.bio || ""}
                  onChange={(e) => setSelectedProfile({...selectedProfile, bio: e.target.value})}
                  className="col-span-3"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="verified" className="text-right">
                  Verified
                </Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Switch
                    id="verified"
                    checked={selectedProfile.verified || false}
                    onCheckedChange={(checked) => setSelectedProfile({...selectedProfile, verified: checked})}
                  />
                  <Label htmlFor="verified" className="cursor-pointer">
                    {selectedProfile.verified ? "Yes" : "No"}
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
                    checked={selectedProfile.featured || false}
                    onCheckedChange={(checked) => setSelectedProfile({...selectedProfile, featured: checked})}
                  />
                  <Label htmlFor="featured" className="cursor-pointer">
                    {selectedProfile.featured ? "Yes" : "No"}
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

      {/* Professional Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Professional Profile Details</DialogTitle>
            <DialogDescription>
              Complete information about the professional
            </DialogDescription>
          </DialogHeader>
          
          {selectedProfile && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3 space-y-4">
                  <div className="aspect-square rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden">
                    {selectedProfile.profileImage ? (
                      <img 
                        src={selectedProfile.profileImage} 
                        alt={`${selectedProfile.firstName} ${selectedProfile.lastName}`}
                        className="object-cover w-full h-full" 
                      />
                    ) : (
                      <div className="text-4xl font-bold text-gray-400">
                        {selectedProfile.firstName?.[0]}{selectedProfile.lastName?.[0]}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{selectedProfile.firstName} {selectedProfile.lastName}</h3>
                    <p className="text-muted-foreground">{selectedProfile.title || "No title specified"}</p>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 mr-1 fill-yellow-500" />
                      {selectedProfile.rating?.toFixed(1) || "No ratings yet"}
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedProfile.verified ? (
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
                      {selectedProfile.featured && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          Featured
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-3">
                    <h4 className="font-medium mb-2">Contact Information</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Location:</span> {selectedProfile.location || "Not specified"}</p>
                      <p><span className="font-medium">Email:</span> {selectedProfile.email}</p>
                      <p><span className="font-medium">Phone:</span> {selectedProfile.phone || "Not provided"}</p>
                      {selectedProfile.website && (
                        <p className="flex items-center">
                          <span className="font-medium mr-1">Website:</span> 
                          <a href={selectedProfile.website} target="_blank" rel="noopener noreferrer" className="text-primary flex items-center">
                            {selectedProfile.website.replace(/^https?:\/\//, '')}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="md:w-2/3 space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Professional Bio</h3>
                    <p className="text-muted-foreground whitespace-pre-line">
                      {selectedProfile.bio || "No bio provided."}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Areas of Expertise</h3>
                    {selectedProfile.expertise && selectedProfile.expertise.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedProfile.expertise.map((exp: Expertise, index: number) => (
                          <Badge key={index} variant="secondary">{exp.name}</Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No expertise specified.</p>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Certifications</h3>
                    {selectedProfile.certifications && selectedProfile.certifications.length > 0 ? (
                      <div className="space-y-2">
                        {selectedProfile.certifications.map((cert: any, index: number) => (
                          <div key={index} className="border rounded-md p-3">
                            <h4 className="font-medium">{cert.name}</h4>
                            <p className="text-sm text-muted-foreground">Issued by {cert.issuer}</p>
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                              <span>Issued: {new Date(cert.issueDate).toLocaleDateString()}</span>
                              {cert.expiryDate && (
                                <span>Expires: {new Date(cert.expiryDate).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No certifications added.</p>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Experience</h3>
                    <p className="text-muted-foreground">
                      {selectedProfile.yearsOfExperience ? 
                        `${selectedProfile.yearsOfExperience} years of experience` : 
                        "Experience details not provided."}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Rate</h3>
                    <p className="text-muted-foreground">
                      {selectedProfile.hourlyRate ? 
                        `$${selectedProfile.hourlyRate}/hour` : 
                        "Hourly rate not specified."}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4 flex justify-between">
                <Button variant="outline" onClick={() => handleEdit(selectedProfile)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant={selectedProfile.featured ? "outline" : "default"} 
                    onClick={() => {
                      toggleFeatured(selectedProfile);
                      setShowDetailsDialog(false);
                    }}
                  >
                    {selectedProfile.featured ? "Remove from Featured" : "Feature Profile"}
                  </Button>
                  <Button 
                    variant={selectedProfile.verified ? "outline" : "default"} 
                    onClick={() => {
                      toggleVerification(selectedProfile);
                      setShowDetailsDialog(false);
                    }}
                  >
                    {selectedProfile.verified ? "Remove Verification" : "Verify Profile"}
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