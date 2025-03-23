import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import { MoreHorizontal, Loader2, Shield, ShieldAlert, ShieldCheck, Pencil, Search, X } from "lucide-react";
import { User } from "@shared/schema";

export default function UsersManagement() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<User | null>(null);
  const [confirmCascadeDelete, setConfirmCascadeDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Fetch all users
  const { data: users, isLoading, error } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    retry: 1,
  });

  // Filter users based on search query
  const filteredUsers = users?.filter(
    (user) =>
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle user admin status
  const toggleAdminMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: number; isAdmin: boolean }) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${userId}`, {
        isAdmin,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User Updated",
        description: "User admin status has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update user",
        variant: "destructive",
      });
    },
  });

  // Update user details
  const updateUserMutation = useMutation({
    mutationFn: async (userData: Partial<User> & { id: number }) => {
      const { id, ...rest } = userData;
      const response = await apiRequest("PATCH", `/api/admin/users/${id}`, rest);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setShowEditDialog(false);
      toast({
        title: "User Updated",
        description: "User details have been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update user details",
        variant: "destructive",
      });
    },
  });

  // Delete user
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      try {
        const response = await apiRequest("DELETE", `/api/admin/users/${userId}`);
        
        // If the response is successful, parse and return the JSON
        return await response.json();
      } catch (error: any) {
        // If there's an error, handle it and extract the details from the server response
        console.error("Delete user request failed:", error);
        
        // Rethrow the error with appropriate details to be handled in onError
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setConfirmDeleteUser(null);
      toast({
        title: "User Deleted",
        description: "User has been deleted successfully",
      });
    },
    onError: (error: any) => {
      console.log("Delete error details:", { error });
      
      // Get a more user-friendly message based on the error
      let errorMessage = "Failed to delete user";
      
      if (error && error.message) {
        if (error.message.includes("company profiles")) {
          errorMessage = "This user has associated company profiles. Please delete those first.";
        } else if (error.message.includes("professional profiles")) {
          errorMessage = "This user has associated professional profiles. Please delete those first.";
        } else if (error.message.includes("associated records")) {
          errorMessage = "This user has associated records. Please delete those first.";
        } else if (error.message.includes("409:")) {
          // Extract the message from the 409 error
          errorMessage = error.message.replace("409: ", "");
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Delete Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Close the delete dialog
      setConfirmDeleteUser(null);
    },
  });

  if (error) {
    return (
      <div className="p-8 text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-xl font-semibold text-red-700">Error Loading Users</h3>
        <p className="text-muted-foreground mt-2">
          {error instanceof Error ? error.message : "Failed to load users data"}
        </p>
        <Button
          className="mt-4"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] })}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">User Management</h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search users..."
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
                <TableHead>Username</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(user.userType)}>{user.userType}</Badge>
                    </TableCell>
                    <TableCell>
                      {user.isAdmin ? (
                        <ShieldCheck className="h-5 w-5 text-green-500" />
                      ) : (
                        <Shield className="h-5 w-5 text-gray-300" />
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
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingUser(user);
                              setShowEditDialog(true);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              toggleAdminMutation.mutate({
                                userId: user.id,
                                isAdmin: !user.isAdmin,
                              })
                            }
                          >
                            {user.isAdmin ? (
                              <>
                                <Shield className="mr-2 h-4 w-4" />
                                Remove Admin
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                Make Admin
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => setConfirmDeleteUser(user)}
                          >
                            <X className="mr-2 h-4 w-4" />
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

          {/* Edit User Dialog */}
          {editingUser && (
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit User</DialogTitle>
                  <DialogDescription>
                    Update information for user {editingUser.username}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="username" className="text-right">
                      Username
                    </label>
                    <Input
                      id="username"
                      value={editingUser.username || ""}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, username: e.target.value })
                      }
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="firstName" className="text-right">
                      First Name
                    </label>
                    <Input
                      id="firstName"
                      value={editingUser.firstName || ""}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, firstName: e.target.value })
                      }
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="lastName" className="text-right">
                      Last Name
                    </label>
                    <Input
                      id="lastName"
                      value={editingUser.lastName || ""}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, lastName: e.target.value })
                      }
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="email" className="text-right">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={editingUser.email || ""}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, email: e.target.value })
                      }
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowEditDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => updateUserMutation.mutate(editingUser)}
                    disabled={updateUserMutation.isPending}
                  >
                    {updateUserMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Delete Confirmation Dialog */}
          {confirmDeleteUser && (
            <Dialog
              open={!!confirmDeleteUser}
              onOpenChange={(open) => !open && setConfirmDeleteUser(null)}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Deletion</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete user{" "}
                    <span className="font-semibold">
                      {confirmDeleteUser.username}
                    </span>
                    ? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                
                {/* Important warning for potential foreign key dependencies */}
                {confirmDeleteUser.userType === "company" && (
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-3 my-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-amber-800">Company User Warning</h3>
                        <div className="mt-2 text-sm text-amber-700">
                          <p>This user is a company user and may have associated company profiles, job postings, or other records. You'll need to delete those records first.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {confirmDeleteUser.userType === "professional" && (
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-3 my-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-amber-800">Professional User Warning</h3>
                        <div className="mt-2 text-sm text-amber-700">
                          <p>This user is a professional user and may have associated professional profiles, certifications, or expertise. You'll need to delete those records first.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setConfirmDeleteUser(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => deleteUserMutation.mutate(confirmDeleteUser.id)}
                    disabled={deleteUserMutation.isPending}
                  >
                    {deleteUserMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </>
      )}
    </div>
  );
}

// Helper function to determine badge variant based on user type
function getBadgeVariant(userType: string | undefined) {
  switch (userType) {
    case "admin":
      return "destructive";
    case "professional":
      return "default";
    case "company":
      return "secondary";
    default:
      return "outline";
  }
}