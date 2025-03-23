import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Eye,
  Trash2,
  MoreHorizontal,
  UserCog,
  RefreshCw,
  Search,
  X,
  Mail,
  ShieldAlert,
  ShieldCheck,
  Check,
  Calendar,
  Filter,
  SlidersHorizontal,
  UserPlus,
} from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function UserManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [userTypeFilter, setUserTypeFilter] = useState<string | null>(null);
  const [adminFilter, setAdminFilter] = useState<boolean | null>(null);
  const [sortField, setSortField] = useState<string | null>("createdAt");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Fetch users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: getQueryFn<User[]>({ on401: "throw" }),
  });

  // Toggle admin status mutation
  const toggleAdminMutation = useMutation({
    mutationFn: async ({ id, isAdmin }: { id: number; isAdmin: boolean }) => {
      const response = await apiRequest("PUT", `/api/admin/users/${id}/admin-status`, {
        isAdmin,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "User Updated",
        description: "Admin status has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update admin status",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/users/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      toast({
        title: "User Deleted",
        description: "The user has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete user. Make sure all associated records are handled.",
        variant: "destructive",
      });
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/admin/users/${id}/reset-password`, {});
      return response.json();
    },
    onSuccess: () => {
      setIsResetPasswordDialogOpen(false);
      toast({
        title: "Password Reset",
        description: "A password reset email has been sent to the user",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    },
  });

  // Filter and sort users
  const filteredUsers = users
    .filter(user => {
      // Text search
      const matchesSearch = !searchQuery || 
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.firstName && user.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.lastName && user.lastName.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // User type filter
      const matchesType = !userTypeFilter || user.userType === userTypeFilter;
      
      // Admin filter
      const matchesAdmin = adminFilter === null || user.isAdmin === adminFilter;
      
      return matchesSearch && matchesType && matchesAdmin;
    })
    .sort((a, b) => {
      if (!sortField) return 0;
      
      let valueA: any;
      let valueB: any;
      
      switch (sortField) {
        case 'username':
          valueA = a.username || '';
          valueB = b.username || '';
          break;
        case 'name':
          valueA = `${a.firstName || ''} ${a.lastName || ''}`.trim();
          valueB = `${b.firstName || ''} ${b.lastName || ''}`.trim();
          break;
        case 'email':
          valueA = a.email || '';
          valueB = b.email || '';
          break;
        case 'userType':
          valueA = a.userType || '';
          valueB = b.userType || '';
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

  // Handle view user details
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsViewDialogOpen(true);
  };

  // Handle delete user
  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  // Handle reset password
  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setIsResetPasswordDialogOpen(true);
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

  // Get name or username
  const getName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user.firstName) {
      return user.firstName;
    } else if (user.lastName) {
      return user.lastName;
    } else {
      return user.username;
    }
  };

  // Get initials for avatar
  const getInitials = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    } else if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    } else {
      return 'U';
    }
  };

  // Get user type badge
  const getUserTypeBadge = (userType: string) => {
    switch (userType) {
      case 'professional':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Professional
          </Badge>
        );
      case 'company':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Company
          </Badge>
        );
      case 'admin':
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            Admin
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {userType || 'Unknown'}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage users, roles, and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search users by name, email, or username..."
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
              
              <div className="flex items-center gap-2">
                <div className="w-[140px]">
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={userTypeFilter || ""}
                    onChange={(e) => setUserTypeFilter(e.target.value || null)}
                  >
                    <option value="">All Types</option>
                    <option value="professional">Professional</option>
                    <option value="company">Company</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2 border px-3 py-2 rounded-md">
                  <Checkbox
                    id="admin-filter"
                    checked={adminFilter === true}
                    onCheckedChange={(checked) => {
                      if (checked === true) setAdminFilter(true);
                      else if (adminFilter === true) setAdminFilter(null);
                      else setAdminFilter(true);
                    }}
                  />
                  <Label htmlFor="admin-filter" className="text-sm cursor-pointer">
                    Admins Only
                  </Label>
                </div>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setSearchQuery("");
                    setUserTypeFilter(null);
                    setAdminFilter(null);
                  }}
                  title="Clear Filters"
                >
                  <Filter className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] })}
                  title="Refresh"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('name')}
                    >
                      User {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('username')}
                    >
                      Username {sortField === 'username' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('email')}
                    >
                      Email {sortField === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('userType')}
                    >
                      Type {sortField === 'userType' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead>Admin</TableHead>
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
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        <div className="flex justify-center">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={user.profilePicUrl || ""} alt={getName(user)} />
                              <AvatarFallback>{getInitials(user)}</AvatarFallback>
                            </Avatar>
                            <div className="font-medium">{getName(user)}</div>
                          </div>
                        </TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Mail className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                            <span className="truncate max-w-[200px]">{user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getUserTypeBadge(user.userType)}</TableCell>
                        <TableCell>
                          {user.isAdmin ? (
                            <div className="flex justify-center">
                              <ShieldCheck className="h-5 w-5 text-green-500" />
                            </div>
                          ) : (
                            <div className="flex justify-center">
                              <ShieldAlert className="h-5 w-5 text-muted-foreground opacity-20" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : 'Unknown'}
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
                              <DropdownMenuItem onClick={() => handleViewUser(user)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View User
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  toggleAdminMutation.mutate({
                                    id: user.id,
                                    isAdmin: !user.isAdmin,
                                  })
                                }
                              >
                                <UserCog className="mr-2 h-4 w-4" />
                                {user.isAdmin ? "Remove Admin" : "Make Admin"}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDeleteUser(user)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete User
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

      {/* View User Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Complete information about the selected user
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.profilePicUrl || ""} alt={getName(selectedUser)} />
                  <AvatarFallback className="text-xl">{getInitials(selectedUser)}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold">{getName(selectedUser)}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    {getUserTypeBadge(selectedUser.userType)}
                    {selectedUser.isAdmin && (
                      <Badge className="bg-red-100 text-red-800 border-red-200">
                        <ShieldCheck className="h-3 w-3 mr-1" /> Admin
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Username</Label>
                  <div className="font-medium">{selectedUser.username}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Email</Label>
                  <div className="font-medium">{selectedUser.email}</div>
                </div>
                {(selectedUser.firstName || selectedUser.lastName) && (
                  <>
                    <div>
                      <Label className="text-sm text-muted-foreground">First Name</Label>
                      <div className="font-medium">{selectedUser.firstName || 'N/A'}</div>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Last Name</Label>
                      <div className="font-medium">{selectedUser.lastName || 'N/A'}</div>
                    </div>
                  </>
                )}
                {selectedUser.phone && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Phone</Label>
                    <div className="font-medium">{selectedUser.phone}</div>
                  </div>
                )}
                <div>
                  <Label className="text-sm text-muted-foreground">Joined</Label>
                  <div className="font-medium">
                    {selectedUser.createdAt 
                      ? format(new Date(selectedUser.createdAt), 'MMMM d, yyyy') 
                      : 'Unknown'
                    }
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Last Updated</Label>
                  <div className="font-medium">
                    {selectedUser.updatedAt 
                      ? format(new Date(selectedUser.updatedAt), 'MMMM d, yyyy') 
                      : 'Unknown'
                    }
                  </div>
                </div>
              </div>

              {selectedUser.stripeCustomerId && (
                <div>
                  <Label className="text-sm text-muted-foreground">Stripe Customer ID</Label>
                  <div className="font-mono text-sm">{selectedUser.stripeCustomerId}</div>
                </div>
              )}

              {selectedUser.stripeSubscriptionId && (
                <div>
                  <Label className="text-sm text-muted-foreground">Stripe Subscription</Label>
                  <div className="font-mono text-sm">{selectedUser.stripeSubscriptionId}</div>
                </div>
              )}

              {selectedUser.subscriptionTier && (
                <div className="flex gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Subscription Tier</Label>
                    <div className="font-medium">{selectedUser.subscriptionTier}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Status</Label>
                    <div className="font-medium">{selectedUser.subscriptionStatus || 'Unknown'}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex justify-between">
            {selectedUser && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    handleDeleteUser(selectedUser);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete User
                </Button>
                <div>
                  <Button
                    variant="outline"
                    className="mr-2"
                    onClick={() => handleResetPassword(selectedUser)}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset Password
                  </Button>
                  <Button 
                    variant={selectedUser.isAdmin ? "outline" : "default"}
                    onClick={() =>
                      toggleAdminMutation.mutate({
                        id: selectedUser.id,
                        isAdmin: !selectedUser.isAdmin,
                      })
                    }
                  >
                    <UserCog className="mr-2 h-4 w-4" />
                    {selectedUser.isAdmin ? "Remove Admin" : "Make Admin"}
                  </Button>
                </div>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user account and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedUser) {
                  deleteUserMutation.mutate(selectedUser.id);
                }
              }}
              className="bg-red-600 focus:ring-red-600"
            >
              {deleteUserMutation.isPending ? (
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

      {/* Reset Password Dialog */}
      <AlertDialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset User Password</AlertDialogTitle>
            <AlertDialogDescription>
              This will send a password reset email to the user. They will be able to set a new password using the link in the email.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedUser) {
                  resetPasswordMutation.mutate(selectedUser.id);
                }
              }}
              className="bg-blue-600 focus:ring-blue-600"
            >
              {resetPasswordMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>Send Reset Email</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}