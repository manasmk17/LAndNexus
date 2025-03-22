import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  MoreHorizontal,
  Loader2,
  Star,
  Eye,
  Check,
  X,
  Search,
  Plus,
  Trash2,
  UserPlus,
} from "lucide-react";
import { ProfessionalProfile, User } from "@shared/schema";

export default function ProfessionalsManagement() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmVerify, setConfirmVerify] = useState<ProfessionalProfile | null>(null);
  const [confirmUnverify, setConfirmUnverify] = useState<ProfessionalProfile | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ProfessionalProfile | null>(null);
  const [isAddProfileDialogOpen, setIsAddProfileDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);

  // Fetch all professional profiles
  const { data: profiles, isLoading, error } = useQuery<ProfessionalProfile[]>({
    queryKey: ["/api/admin/professional-profiles"],
    retry: 1,
  });

  // Filter professionals based on search query
  const filteredProfiles = profiles?.filter(
    (profile) =>
      profile.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.services?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle featured status
  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({
      profileId,
      featured,
    }: {
      profileId: number;
      featured: boolean;
    }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/admin/professional-profiles/${profileId}/featured`,
        { featured }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/professional-profiles"] });
      toast({
        title: "Profile Updated",
        description: "Featured status has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update featured status",
        variant: "destructive",
      });
    },
  });

  // Verify professional profile
  const verifyProfileMutation = useMutation({
    mutationFn: async (profileId: number) => {
      const response = await apiRequest(
        "PATCH",
        `/api/admin/professional-profiles/${profileId}/verify`,
        { verified: true }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/professional-profiles"] });
      setConfirmVerify(null);
      toast({
        title: "Profile Verified",
        description: "Professional profile has been verified successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Failed to verify profile",
        variant: "destructive",
      });
    },
  });

  // Unverify professional profile
  const unverifyProfileMutation = useMutation({
    mutationFn: async (profileId: number) => {
      const response = await apiRequest(
        "PATCH",
        `/api/admin/professional-profiles/${profileId}/verify`,
        { verified: false }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/professional-profiles"] });
      setConfirmUnverify(null);
      toast({
        title: "Profile Unverified",
        description: "Professional profile has been unverified",
      });
    },
    onError: (error) => {
      toast({
        title: "Unverification Failed",
        description: error instanceof Error ? error.message : "Failed to unverify profile",
        variant: "destructive",
      });
    },
  });

  // Delete professional profile
  const deleteProfileMutation = useMutation({
    mutationFn: async (profileId: number) => {
      const response = await apiRequest(
        "DELETE",
        `/api/admin/professional-profiles/${profileId}`
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/professional-profiles"] });
      setConfirmDelete(null);
      toast({
        title: "Profile Deleted",
        description: "Professional profile has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Deletion Failed",
        description: error instanceof Error ? error.message : "Failed to delete profile",
        variant: "destructive",
      });
    },
  });

  // Get users without professional profiles for the add profile functionality
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/users");
      return response.json();
    },
    enabled: isAddProfileDialogOpen, // Only fetch when dialog is open
  });

  // Filter users who don't have a professional profile
  const usersWithoutProfile = users?.filter(user => 
    !profiles?.some(profile => profile.userId === user.id) && 
    user.userType === "professional"
  );

  // Create professional profile
  const createProfileMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest(
        "POST",
        `/api/admin/professional-profiles`,
        { 
          userId,
          firstName: "",
          lastName: "",
          title: "New Professional Profile",
          bio: "",
          services: "",
          ratePerHour: 0,
          availability: "Available",
          location: "",
          featured: false,
          verified: false
        }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/professional-profiles"] });
      setIsAddProfileDialogOpen(false);
      setSelectedUser(null);
      toast({
        title: "Profile Created",
        description: "New professional profile has been created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create profile",
        variant: "destructive",
      });
    },
  });

  if (error) {
    return (
      <div className="p-8 text-center">
        <X className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-xl font-semibold text-red-700">Error Loading Professionals</h3>
        <p className="text-muted-foreground mt-2">
          {error instanceof Error ? error.message : "Failed to load professional profiles"}
        </p>
        <Button
          className="mt-4"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/professional-profiles"] })}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Professional Profiles Management</h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-1"
            onClick={() => setIsAddProfileDialogOpen(true)}
          >
            <UserPlus className="h-4 w-4" />
            Add Profile
          </Button>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search professionals..."
              className="w-[250px] pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-9 w-9"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProfiles?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No professional profiles found
                  </TableCell>
                </TableRow>
              ) : (
                filteredProfiles?.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>{profile.id}</TableCell>
                    <TableCell>{profile.userId}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={profile.title || ""}>
                      {profile.title || "No title"}
                    </TableCell>
                    <TableCell>{profile.location || "Not specified"}</TableCell>
                    <TableCell>
                      <Switch
                        checked={!!profile.featured}
                        onCheckedChange={() =>
                          toggleFeaturedMutation.mutate({
                            profileId: profile.id,
                            featured: !profile.featured,
                          })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {profile.verified ? (
                        <Badge className="bg-green-500 text-white">
                          <Check className="h-3 w-3 mr-1" /> Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline">Unverified</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => navigate(`/professional-profile/${profile.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              toggleFeaturedMutation.mutate({
                                profileId: profile.id,
                                featured: !profile.featured,
                              })
                            }
                          >
                            <Star className="mr-2 h-4 w-4" />
                            {profile.featured ? "Unfeature Profile" : "Feature Profile"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {profile.verified ? (
                            <DropdownMenuItem onClick={() => setConfirmUnverify(profile)}>
                              <X className="mr-2 h-4 w-4" />
                              Remove Verification
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => setConfirmVerify(profile)}>
                              <Check className="mr-2 h-4 w-4" />
                              Verify Profile
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => setConfirmDelete(profile)}
                            className="text-red-600"
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

          {/* Verify Confirmation Dialog */}
          {confirmVerify && (
            <Dialog
              open={!!confirmVerify}
              onOpenChange={(open) => !open && setConfirmVerify(null)}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Verification</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to verify this professional profile?
                    Verification indicates that you have reviewed this profile and confirm it meets platform standards.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setConfirmVerify(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => verifyProfileMutation.mutate(confirmVerify.id)}
                    disabled={verifyProfileMutation.isPending}
                  >
                    {verifyProfileMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Verify Profile
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Unverify Confirmation Dialog */}
          {confirmUnverify && (
            <Dialog
              open={!!confirmUnverify}
              onOpenChange={(open) => !open && setConfirmUnverify(null)}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Unverification</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to remove verification from this professional profile?
                    This will indicate that the profile requires review.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setConfirmUnverify(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => unverifyProfileMutation.mutate(confirmUnverify.id)}
                    disabled={unverifyProfileMutation.isPending}
                  >
                    {unverifyProfileMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Remove Verification
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Delete Confirmation Dialog */}
          {confirmDelete && (
            <Dialog
              open={!!confirmDelete}
              onOpenChange={(open) => !open && setConfirmDelete(null)}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Deletion</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this professional profile?
                    This action cannot be undone, and will remove all associated data.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setConfirmDelete(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => deleteProfileMutation.mutate(confirmDelete.id)}
                    disabled={deleteProfileMutation.isPending}
                  >
                    {deleteProfileMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Delete Profile
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Add Profile Dialog */}
          <Dialog
            open={isAddProfileDialogOpen}
            onOpenChange={(open) => {
              setIsAddProfileDialogOpen(open);
              if (!open) setSelectedUser(null);
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Professional Profile</DialogTitle>
                <DialogDescription>
                  Select a user to create a professional profile for.
                  Only users without an existing profile are shown.
                </DialogDescription>
              </DialogHeader>
              
              {usersWithoutProfile?.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">
                    All professional users already have profiles.
                  </p>
                </div>
              ) : (
                <div className="py-4">
                  <Label htmlFor="user-select">Select User</Label>
                  <div className="grid gap-4 mt-2">
                    {usersWithoutProfile?.map(user => (
                      <div 
                        key={user.id}
                        className={`p-3 border rounded-md flex justify-between items-center cursor-pointer hover:bg-accent ${
                          selectedUser === user.id ? 'border-primary bg-accent/50' : ''
                        }`}
                        onClick={() => setSelectedUser(user.id)}
                      >
                        <div>
                          <p className="font-medium">{user.username}</p>
                          <p className="text-sm text-muted-foreground">{user.email || 'No email'}</p>
                        </div>
                        {selectedUser === user.id && <Check className="h-5 w-5 text-primary" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddProfileDialogOpen(false);
                    setSelectedUser(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => selectedUser && createProfileMutation.mutate(selectedUser)}
                  disabled={!selectedUser || createProfileMutation.isPending}
                >
                  {createProfileMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Profile
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}