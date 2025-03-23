import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueryFn, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ProfessionalProfile } from '@shared/schema';

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
import { Loader2, Eye, Star, Search, X, MoreHorizontal, AlertCircle } from 'lucide-react';

export function ProfessionalsPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<ProfessionalProfile | null>(null);

  // Fetch professional profiles
  const {
    data: profiles = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['/api/admin/professional-profiles'],
    queryFn: getQueryFn<ProfessionalProfile[]>({ on401: 'throw' }),
  });

  // Filter profiles based on search query
  const filteredProfiles = searchQuery
    ? profiles.filter(
        (profile) =>
          profile.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          profile.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          profile.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          profile.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          profile.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (profile.firstName + ' ' + profile.lastName)
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      )
    : profiles;

  // Toggle featured status mutation
  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, featured }: { id: number; featured: boolean }) => {
      const response = await apiRequest('PATCH', `/api/admin/professional-profiles/${id}`, {
        featured,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/professional-profiles'] });
      toast({
        title: 'Featured Status Updated',
        description: 'Professional profile featured status has been updated.',
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

  // Toggle verified status mutation
  const toggleVerifiedMutation = useMutation({
    mutationFn: async ({ id, verified }: { id: number; verified: boolean }) => {
      const response = await apiRequest('PATCH', `/api/admin/professional-profiles/${id}`, {
        verified,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/professional-profiles'] });
      toast({
        title: 'Verification Status Updated',
        description: 'Professional profile verification status has been updated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update verification status',
        variant: 'destructive',
      });
    },
  });

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center text-center p-6">
            <AlertCircle className="h-10 w-10 text-destructive mb-2" />
            <h3 className="text-lg font-semibold">Error Loading Professionals</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {error instanceof Error ? error.message : 'Could not load professional profiles'}
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/professional-profiles'] })}
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
        <CardTitle>Professional Profiles</CardTitle>
        <CardDescription>View and manage professional profiles</CardDescription>
        <div className="flex items-center mt-4 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search professionals..."
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
                  <TableHead>Name</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No professionals found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProfiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">{profile.firstName} {profile.lastName}</TableCell>
                      <TableCell>{profile.title || 'N/A'}</TableCell>
                      <TableCell>{profile.location || 'N/A'}</TableCell>
                      <TableCell>
                        <Switch
                          checked={!!profile.featured}
                          onCheckedChange={(checked) => 
                            toggleFeaturedMutation.mutate({ id: profile.id, featured: checked })
                          }
                          aria-label="Toggle featured status"
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={!!profile.verified}
                          onCheckedChange={(checked) => 
                            toggleVerifiedMutation.mutate({ id: profile.id, verified: checked })
                          }
                          aria-label="Toggle verification status"
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
                                setSelectedProfile(profile);
                                setShowDetailsDialog(true);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => window.open(`/professional/${profile.id}`, '_blank')}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Public Profile
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

        {/* Professional Details Dialog */}
        {selectedProfile && (
          <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{selectedProfile.firstName} {selectedProfile.lastName}</DialogTitle>
                <DialogDescription>
                  Professional profile details
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {selectedProfile.profileImageUrl && (
                  <div className="flex justify-center mb-4">
                    <img 
                      src={selectedProfile.profileImageUrl} 
                      alt={`${selectedProfile.firstName} ${selectedProfile.lastName}`} 
                      className="h-24 w-24 rounded-full object-cover"
                    />
                  </div>
                )}
                <div className="grid grid-cols-3">
                  <div className="font-semibold">Title:</div>
                  <div className="col-span-2">{selectedProfile.title || 'N/A'}</div>
                </div>
                <div className="grid grid-cols-3">
                  <div className="font-semibold">Email:</div>
                  <div className="col-span-2">{selectedProfile.email || 'N/A'}</div>
                </div>
                <div className="grid grid-cols-3">
                  <div className="font-semibold">Location:</div>
                  <div className="col-span-2">{selectedProfile.location || 'N/A'}</div>
                </div>
                <div className="grid grid-cols-3">
                  <div className="font-semibold">Experience:</div>
                  <div className="col-span-2">{selectedProfile.yearsOfExperience ? `${selectedProfile.yearsOfExperience} years` : 'N/A'}</div>
                </div>
                <div className="grid grid-cols-3">
                  <div className="font-semibold">Status:</div>
                  <div className="col-span-2">
                    <div className="flex space-x-2">
                      {selectedProfile.featured && (
                        <Badge variant="default" className="bg-amber-500">
                          Featured
                        </Badge>
                      )}
                      {selectedProfile.verified && (
                        <Badge variant="default">
                          Verified
                        </Badge>
                      )}
                      {!selectedProfile.featured && !selectedProfile.verified && 'Standard'}
                    </div>
                  </div>
                </div>
                {selectedProfile.bio && (
                  <div>
                    <div className="font-semibold mb-2">Bio:</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedProfile.bio}
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