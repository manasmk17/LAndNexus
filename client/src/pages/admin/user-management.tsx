import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, MoreHorizontal, UserCheck, UserX, Mail, Shield } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AdminUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: string;
  isAdmin: boolean;
  createdAt: string;
  subscriptionTier: string | null;
  subscriptionStatus: string | null;
  lastLoginAt: string | null;
  isActive: boolean;
}

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const { toast } = useToast();

  const { data: users = [], isLoading, refetch } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users", searchTerm, filterType, filterStatus],
  });

  const suspendUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/suspend`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "User suspended successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: () => {
      toast({ title: "Failed to suspend user", variant: "destructive" });
    }
  });

  const activateUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/activate`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "User activated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: () => {
      toast({ title: "Failed to activate user", variant: "destructive" });
    }
  });

  const makeAdminMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/make-admin`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Admin privileges granted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: () => {
      toast({ title: "Failed to grant admin privileges", variant: "destructive" });
    }
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || user.userType === filterType;
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "active" && user.isActive) ||
      (filterStatus === "suspended" && !user.isActive);

    return matchesSearch && matchesType && matchesStatus;
  });

  const getUserStatusBadge = (user: AdminUser) => {
    if (!user.isActive) return <Badge variant="destructive">Suspended</Badge>;
    if (user.isAdmin) return <Badge variant="default">Admin</Badge>;
    if (user.subscriptionStatus === "active") return <Badge variant="default">Active</Badge>;
    return <Badge variant="secondary">Free</Badge>;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage platform users and permissions</p>
        </div>
        <Button onClick={() => refetch()}>Refresh</Button>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="User Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="company">Company</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* User Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Manage user accounts, subscriptions, and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.firstName} {user.lastName}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                        <div className="text-xs text-muted-foreground">@{user.username}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.userType}</Badge>
                    </TableCell>
                    <TableCell>{getUserStatusBadge(user)}</TableCell>
                    <TableCell>
                      {user.subscriptionTier ? (
                        <div>
                          <div className="font-medium">{user.subscriptionTier}</div>
                          <div className="text-xs text-muted-foreground">{user.subscriptionStatus}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No subscription</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.lastLoginAt ? (
                        new Date(user.lastLoginAt).toLocaleDateString()
                      ) : (
                        <span className="text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Manage User: {user.firstName} {user.lastName}</DialogTitle>
                            <DialogDescription>
                              Perform administrative actions on this user account
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            {user.isActive ? (
                              <Button
                                variant="destructive"
                                onClick={() => suspendUserMutation.mutate(user.id)}
                                disabled={suspendUserMutation.isPending}
                                className="w-full"
                              >
                                <UserX className="mr-2 h-4 w-4" />
                                Suspend User
                              </Button>
                            ) : (
                              <Button
                                variant="default"
                                onClick={() => activateUserMutation.mutate(user.id)}
                                disabled={activateUserMutation.isPending}
                                className="w-full"
                              >
                                <UserCheck className="mr-2 h-4 w-4" />
                                Activate User
                              </Button>
                            )}
                            {!user.isAdmin && (
                              <Button
                                variant="outline"
                                onClick={() => makeAdminMutation.mutate(user.id)}
                                disabled={makeAdminMutation.isPending}
                                className="w-full"
                              >
                                <Shield className="mr-2 h-4 w-4" />
                                Make Admin
                              </Button>
                            )}
                            <Button variant="outline" className="w-full">
                              <Mail className="mr-2 h-4 w-4" />
                              Send Email
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}