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
  DialogTrigger,
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
import { User } from "@shared/schema";
import { Edit, Trash, Eye, Plus, AlertTriangle, Filter } from "lucide-react";

export default function UsersPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [userTypeFilter, setUserTypeFilter] = useState<string>("all");

  // Fetch all users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['/api/users'],
    queryFn: getQueryFn<User[]>({ on401: "returnNull" }),
  });

  // Apply filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery === "" || 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && !user.blocked) ||
      (statusFilter === "blocked" && user.blocked);
    
    const matchesType = userTypeFilter === "all" || user.userType === userTypeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setShowDetailsDialog(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser({...user});
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    
    try {
      await apiRequest("PATCH", `/api/users/${selectedUser.id}`, selectedUser);
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "User Updated",
        description: `User ${selectedUser.username} has been updated.`,
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
      await apiRequest("DELETE", `/api/users/${id}`);
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
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
      await apiRequest("PATCH", `/api/users/${user.id}`, {
        ...user,
        isAdmin: !user.isAdmin
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
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

  const toggleBlocked = async (user: User) => {
    try {
      await apiRequest("PATCH", `/api/users/${user.id}`, {
        ...user,
        blocked: !user.blocked
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: user.blocked ? "User Unblocked" : "User Blocked",
        description: `${user.username} has been ${user.blocked ? "unblocked" : "blocked"}.`,
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update user status",
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4">
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:max-w-xs"
          />
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
            <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="company">Company</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
              setUserTypeFilter("all");
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
              <TableCaption>List of {filteredUsers.length} user(s)</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">Admin</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.firstName} {user.lastName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={
                        user.userType === "professional" ? "default" : 
                        user.userType === "company" ? "secondary" :
                        "outline"
                      }>
                        {user.userType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch 
                        checked={user.isAdmin} 
                        onCheckedChange={() => toggleAdmin(user)}
                        aria-label="Toggle admin status"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      {user.blocked ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Blocked
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleViewDetails(user)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Edit User Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details and permissions
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="text-right">
                  Username
                </Label>
                <Input
                  id="username"
                  value={selectedUser.username}
                  onChange={(e) => setSelectedUser({...selectedUser, username: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="firstName" className="text-right">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  value={selectedUser.firstName || ""}
                  onChange={(e) => setSelectedUser({...selectedUser, firstName: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lastName" className="text-right">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  value={selectedUser.lastName || ""}
                  onChange={(e) => setSelectedUser({...selectedUser, lastName: e.target.value})}
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
                  value={selectedUser.email}
                  onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="userType" className="text-right">
                  User Type
                </Label>
                <Select 
                  value={selectedUser.userType} 
                  onValueChange={(value) => setSelectedUser({...selectedUser, userType: value})}
                >
                  <SelectTrigger id="userType" className="col-span-3">
                    <SelectValue placeholder="Select a user type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="isAdmin" className="text-right">
                  Admin
                </Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Switch
                    id="isAdmin"
                    checked={selectedUser.isAdmin}
                    onCheckedChange={(checked) => setSelectedUser({...selectedUser, isAdmin: checked})}
                  />
                  <Label htmlFor="isAdmin" className="cursor-pointer">
                    {selectedUser.isAdmin ? "Yes" : "No"}
                  </Label>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="blocked" className="text-right">
                  Blocked
                </Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Switch
                    id="blocked"
                    checked={selectedUser.blocked || false}
                    onCheckedChange={(checked) => setSelectedUser({...selectedUser, blocked: checked})}
                  />
                  <Label htmlFor="blocked" className="cursor-pointer">
                    {selectedUser.blocked ? "Yes" : "No"}
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

      {/* User Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Complete information about the user
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-1">
                <div className="font-semibold">Username:</div>
                <div className="col-span-2">{selectedUser.username}</div>
                
                <div className="font-semibold">Name:</div>
                <div className="col-span-2">
                  {selectedUser.firstName} {selectedUser.lastName}
                </div>
                
                <div className="font-semibold">Email:</div>
                <div className="col-span-2">{selectedUser.email}</div>
                
                <div className="font-semibold">User Type:</div>
                <div className="col-span-2">
                  <Badge variant={
                    selectedUser.userType === "professional" ? "default" : 
                    selectedUser.userType === "company" ? "secondary" :
                    "outline"
                  }>
                    {selectedUser.userType}
                  </Badge>
                </div>
                
                <div className="font-semibold">Admin:</div>
                <div className="col-span-2">
                  {selectedUser.isAdmin ? "Yes" : "No"}
                </div>
                
                <div className="font-semibold">Status:</div>
                <div className="col-span-2">
                  {selectedUser.blocked ? (
                    <Badge variant="destructive">Blocked</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                      Active
                    </Badge>
                  )}
                </div>

                <div className="font-semibold">Joined:</div>
                <div className="col-span-2">
                  {new Date(selectedUser.createdAt).toLocaleDateString()}
                </div>

                <div className="font-semibold">Subscription:</div>
                <div className="col-span-2">
                  {selectedUser.subscriptionTier ? (
                    <Badge>
                      {selectedUser.subscriptionTier} - {selectedUser.subscriptionStatus}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">No subscription</span>
                  )}
                </div>
              </div>
              
              <div className="border-t pt-4 flex justify-between">
                <Button variant="outline" onClick={() => handleEdit(selectedUser)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit User
                </Button>
                <Button 
                  variant={selectedUser.blocked ? "outline" : "destructive"} 
                  onClick={() => {
                    toggleBlocked(selectedUser);
                    setShowDetailsDialog(false);
                  }}
                >
                  {selectedUser.blocked ? "Unblock User" : "Block User"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}