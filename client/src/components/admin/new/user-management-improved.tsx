import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Filter,
  UserPlus, 
  Download,
  Eye,
  Trash2,
  AlertTriangle,
  Edit,
  Loader2,
  MoreHorizontal,
  Ban,
  UserCheck,
  Calendar,
  Shield,
  Wallet,
  Building,
  ReceiptText,
  BriefcaseBusiness,
  RefreshCw
} from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";
import { format } from "date-fns";

// Simple utility to help with cache invalidation
function invalidateQueries(queryKeys: string[], queryClient: any) {
  queryKeys.forEach(key => {
    try {
      queryClient.invalidateQueries({ queryKey: [key] });
    } catch (error) {
      console.error(`Failed to invalidate query for key ${key}:`, error);
    }
  });
}

// Interface for user transaction
interface UserTransaction {
  id: number;
  userId: number;
  amount: number;
  date: string;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  method: string;
}

// Interface for user complaint
interface UserComplaint {
  id: number;
  userId: number;
  reporterId: number;
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'dismissed' | 'action_taken';
  createdAt: string;
}

// Interface for user activity
interface UserActivity {
  postedJobs: number;
  completedProjects: number;
  totalPayments: number;
  lastActive: string;
}

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterRegistrationDate, setFilterRegistrationDate] = useState<string | null>(null);
  const [filterActivity, setFilterActivity] = useState<string | null>(null);
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState("overview");
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [userToBlock, setUserToBlock] = useState<{id: number, action: 'block' | 'unblock'} | null>(null);
  const [blockReason, setBlockReason] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch all users from the API
  const { 
    data: users = [], 
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<User[]>({
    queryKey: ['/api/users'],
    queryFn: getQueryFn({ on401: 'throw' }),
    staleTime: 5000 // Short stale time to force refreshes
  });
  
  // Fetch user activity
  const {
    data: userActivity,
    isLoading: isLoadingActivity
  } = useQuery<UserActivity>({
    queryKey: ['/api/users', selectedUser?.id, 'activity'],
    queryFn: selectedUser ? 
      getQueryFn({ on401: 'throw' }) : 
      () => Promise.resolve({
        postedJobs: 0,
        completedProjects: 0,
        totalPayments: 0,
        lastActive: new Date().toISOString()
      }),
    enabled: !!selectedUser
  });
  
  // Fetch user transactions
  const {
    data: userTransactions = [],
    isLoading: isLoadingTransactions
  } = useQuery<UserTransaction[]>({
    queryKey: ['/api/users', selectedUser?.id, 'transactions'],
    queryFn: selectedUser ? 
      getQueryFn({ on401: 'throw' }) : 
      () => Promise.resolve([]),
    enabled: !!selectedUser && activeProfileTab === "transactions"
  });
  
  // Fetch user complaints
  const {
    data: userComplaints = [],
    isLoading: isLoadingComplaints
  } = useQuery<UserComplaint[]>({
    queryKey: ['/api/users', selectedUser?.id, 'complaints'],
    queryFn: selectedUser ? 
      getQueryFn({ on401: 'throw' }) : 
      () => Promise.resolve([]),
    enabled: !!selectedUser && activeProfileTab === "complaints"
  });
  
  // Block/unblock user mutation
  const blockUserMutation = useMutation({
    mutationFn: async ({ id, blocked, reason }: { id: number; blocked: boolean; reason: string }) => {
      const response = await apiRequest('PATCH', `/api/users/${id}`, {
        blocked,
        blockReason: reason
      });
      return response;
    },
    onSuccess: () => {
      // Invalidate multiple related queries
      invalidateQueries([
        '/api/users',
        '/api/admin/dashboard-stats'
      ], queryClient);
      
      // Force refetch of the users data
      refetch();
      
      setBlockDialogOpen(false);
      setUserToBlock(null);
      setBlockReason("");
      
      toast({
        title: "User status updated",
        description: "The user's status has been updated successfully",
      });
      
      // If we're viewing the user profile, refresh it too
      if (selectedUser) {
        const updatedUser = users.find(u => u.id === selectedUser.id);
        if (updatedUser) {
          setSelectedUser(updatedUser);
        }
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update user status',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Edit user mutation
  const editUserMutation = useMutation({
    mutationFn: async (userData: Partial<User> & { id: number }) => {
      const { id, ...rest } = userData;
      const response = await apiRequest('PATCH', `/api/users/${id}`, rest);
      return response;
    },
    onSuccess: () => {
      // Invalidate multiple related queries
      invalidateQueries([
        '/api/users',
        '/api/admin/dashboard-stats'
      ], queryClient);
      
      // Force refetch of the users data
      refetch();
      
      toast({
        title: "User updated",
        description: "The user's information has been updated successfully",
      });
      
      // If we're viewing the user profile, refresh it too
      if (selectedUser) {
        const updatedUser = users.find(u => u.id === selectedUser.id);
        if (updatedUser) {
          setSelectedUser(updatedUser);
        }
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update user',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/users/${id}`);
      return response;
    },
    onSuccess: () => {
      // Invalidate multiple related queries
      invalidateQueries([
        '/api/users',
        '/api/admin/dashboard-stats'
      ], queryClient);
      
      // Force refetch of the users data
      refetch();
      
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      
      toast({
        title: "User deleted",
        description: "The user has been deleted successfully and can be restored within 30 days",
      });
      
      // If we're viewing the deleted user profile, close it
      if (selectedUser && selectedUser.id === userToDelete) {
        setIsProfileOpen(false);
        setSelectedUser(null);
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete user',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Helper function to view user profile
  const handleViewProfile = (user: User) => {
    setSelectedUser(user);
    setIsProfileOpen(true);
    setActiveProfileTab("overview");
  };
  
  // Helper function to block/unblock user
  const handleBlockAction = (id: number, action: 'block' | 'unblock') => {
    setUserToBlock({ id, action });
    setBlockDialogOpen(true);
  };
  
  // Helper function to handle block/unblock confirmation
  const handleBlockConfirm = () => {
    if (!userToBlock) return;

    // Database schema update pending, showing temporary notification
    toast({
      title: `User ${userToBlock.action === 'block' ? 'Blocking' : 'Unblocking'} Pending`,
      description: "This feature requires database schema updates which are pending.",
      variant: "default"
    });
    
    setBlockDialogOpen(false);
    
    /* Actual implementation - will be enabled once DB schema is updated
    blockUserMutation.mutate({
      id: userToBlock.id,
      blocked: userToBlock.action === 'block',
      reason: blockReason
    });
    */
  };
  
  // Helper function to initiate user deletion
  const handleDeleteClick = (id: number) => {
    setUserToDelete(id);
    setDeleteDialogOpen(true);
  };
  
  // Helper function to handle delete confirmation
  const handleDeleteConfirm = () => {
    if (userToDelete === null) return;
    
    // Database schema update pending, showing temporary notification
    toast({
      title: "User Deletion Pending",
      description: "This feature requires database schema updates which are pending.",
      variant: "default"
    });
    
    setDeleteDialogOpen(false);
    
    /* Actual implementation - will be enabled once DB schema is updated
    deleteUserMutation.mutate(userToDelete);
    */
  };
  
  // Filter users based on search term and filters
  const filteredUsers = users.filter(user => {
    // Search term filtering
    const idMatch = user.id.toString().includes(searchTerm);
    const emailMatch = user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const nameMatch = 
      (user.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
      (user.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
      (user.username.toLowerCase()).includes(searchTerm.toLowerCase());
    
    const matchesSearch = searchTerm === "" || idMatch || emailMatch || nameMatch;
    
    // Role filtering
    const matchesRole = !filterRole || user.userType === filterRole;
    
    // Status filtering
    const matchesStatus = !filterStatus || 
      (filterStatus === 'active' && !user.blocked) || 
      (filterStatus === 'blocked' && user.blocked);
    
    // Registration date filtering - simplified for demo
    const matchesRegistration = !filterRegistrationDate || true; // Would need date range logic
    
    // Activity filtering - simplified for demo
    const matchesActivity = !filterActivity || true; // Would need activity tracking
    
    return matchesSearch && matchesRole && matchesStatus && matchesRegistration && matchesActivity;
  });
  
  // Format timestamp for display
  const formatDate = (date: Date | string) => {
    return date ? format(new Date(date), 'MMM dd, yyyy') : 'N/A';
  };
  
  // Helper to get status badge variant
  const getStatusBadge = (user: User) => {
    // Handle case where blocked field may not exist in the database yet
    const isBlocked = 'blocked' in user ? user.blocked : false;
    
    if (isBlocked) {
      return <Badge variant="destructive">Blocked</Badge>;
    } else {
      return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
    }
  };
  
  // Helper to get role badge
  const getRoleBadge = (user: User) => {
    if (user.isAdmin) {
      return <Badge className="bg-amber-500">Admin</Badge>;
    }
    
    switch(user.userType) {
      case 'professional':
        return <Badge className="bg-blue-500">Professional</Badge>;
      case 'company':
        return <Badge className="bg-emerald-500">Company</Badge>;
      default:
        return <Badge variant="outline">{user.userType}</Badge>;
    }
  };
  
  // Helper to get complaint status badge
  const getComplaintStatusBadge = (status: string) => {
    switch(status) {
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'reviewed':
        return <Badge className="bg-blue-500">Reviewed</Badge>;
      case 'dismissed':
        return <Badge variant="secondary">Dismissed</Badge>;
      case 'action_taken':
        return <Badge variant="destructive">Action Taken</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Helper to get transaction status badge
  const getTransactionStatusBadge = (status: string) => {
    switch(status) {
      case 'completed':
        return <Badge className="bg-emerald-500">Completed</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <Button variant="outline" disabled className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              Loading user data...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-full h-12 bg-muted/30 animate-pulse rounded-md"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            className="flex items-center gap-2"
          >
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Retry
          </Button>
        </div>
        
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Error Loading Data
            </CardTitle>
            <CardDescription>
              There was a problem loading user data. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">
              {error instanceof Error ? error.message : 'Unknown error occurred'}
            </pre>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} className="flex items-center gap-1">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button className="flex items-center gap-1">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Add User</span>
          </Button>
          <Button variant="outline" className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>
      
      {/* Search and filter area */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID, email, or name..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={filterRole || ""} onValueChange={(value) => setFilterRole(value || null)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="User Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="company">Company</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterStatus || ""} onValueChange={(value) => setFilterStatus(value || null)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterRegistrationDate || ""} onValueChange={(value) => setFilterRegistrationDate(value || null)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Reg. Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Dates</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="this_week">This Week</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="this_year">This Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterActivity || ""} onValueChange={(value) => setFilterActivity(value || null)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Activity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Activity</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Users table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              Manage users, profiles, access and permissions
            </CardDescription>
          </div>
          <Badge variant="outline">
            {filteredUsers.length} {filteredUsers.length === 1 ? 'User' : 'Users'}
          </Badge>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-mono text-xs">
                    {user.id}
                  </TableCell>
                  <TableCell>
                    {user.username}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell>
                    {getRoleBadge(user)}
                  </TableCell>
                  <TableCell>
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(user)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleViewProfile(user)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View Profile</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleBlockAction(user.id, user.blocked ? 'unblock' : 'block')}
                            >
                              {user.blocked ? (
                                <UserCheck className="h-4 w-4" />
                              ) : (
                                <Ban className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{user.blocked ? 'Unblock User' : 'Block User'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(user.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Delete User</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                    No users found matching your search criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* User Profile Dialog */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Shield className={`h-5 w-5 ${selectedUser?.isAdmin ? 'text-amber-500' : 'text-primary'}`} />
              User Profile
            </DialogTitle>
            <DialogDescription>
              View and manage user information, activity, and settings
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="flex flex-col space-y-4 flex-grow overflow-hidden">
              <div className="flex flex-col md:flex-row gap-4 pb-4 border-b">
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-2xl font-bold">
                    {selectedUser.firstName?.[0] || selectedUser.username[0]}
                  </div>
                </div>
                <div className="flex-grow space-y-1">
                  <h3 className="text-xl font-semibold">
                    {selectedUser.firstName} {selectedUser.lastName}
                    {selectedUser.isAdmin && (
                      <Badge className="ml-2 bg-amber-500">Admin</Badge>
                    )}
                  </h3>
                  <p className="text-muted-foreground">@{selectedUser.username}</p>
                  <p className="text-sm">{selectedUser.email}</p>
                  <div className="flex gap-2 mt-2">
                    {getStatusBadge(selectedUser)}
                    {getRoleBadge(selectedUser)}
                  </div>
                </div>
                <div className="flex-shrink-0 flex flex-col gap-2">
                  <Button 
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 w-full"
                    onClick={() => handleBlockAction(selectedUser.id, ('blocked' in selectedUser && selectedUser.blocked) ? 'unblock' : 'block')}
                  >
                    {('blocked' in selectedUser && selectedUser.blocked) ? (
                      <>
                        <UserCheck className="h-4 w-4" />
                        Unblock User
                      </>
                    ) : (
                      <>
                        <Ban className="h-4 w-4" />
                        Block User
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="destructive"
                    size="sm"
                    className="flex items-center gap-1 w-full"
                    onClick={() => handleDeleteClick(selectedUser.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Account
                  </Button>
                </div>
              </div>
              
              <Tabs value={activeProfileTab} onValueChange={setActiveProfileTab} className="flex-grow flex flex-col overflow-hidden">
                <TabsList className="grid grid-cols-4">
                  <TabsTrigger value="overview" className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span className="hidden sm:inline">Overview</span>
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span className="hidden sm:inline">Activity</span>
                  </TabsTrigger>
                  <TabsTrigger value="transactions" className="flex items-center gap-1">
                    <Wallet className="h-4 w-4" />
                    <span className="hidden sm:inline">Transactions</span>
                  </TabsTrigger>
                  <TabsTrigger value="complaints" className="flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="hidden sm:inline">Complaints</span>
                  </TabsTrigger>
                </TabsList>
                
                <div className="flex-grow overflow-y-auto mt-4 pr-1">
                  <TabsContent value="overview" className="h-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <UserPlus className="h-4 w-4" />
                            Personal Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="grid grid-cols-3 gap-1">
                            <span className="text-sm text-muted-foreground">Username:</span>
                            <span className="text-sm col-span-2">{selectedUser.username}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            <span className="text-sm text-muted-foreground">Full Name:</span>
                            <span className="text-sm col-span-2">{selectedUser.firstName} {selectedUser.lastName}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            <span className="text-sm text-muted-foreground">Email:</span>
                            <span className="text-sm col-span-2">{selectedUser.email}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            <span className="text-sm text-muted-foreground">User Type:</span>
                            <span className="text-sm col-span-2">{selectedUser.userType}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            <span className="text-sm text-muted-foreground">Admin Access:</span>
                            <span className="text-sm col-span-2">{selectedUser.isAdmin ? 'Yes' : 'No'}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            <span className="text-sm text-muted-foreground">Registered On:</span>
                            <span className="text-sm col-span-2">{formatDate(selectedUser.createdAt)}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            <span className="text-sm text-muted-foreground">Status:</span>
                            <span className="text-sm col-span-2 flex items-center">
                              {getStatusBadge(selectedUser)}
                              {('blocked' in selectedUser && selectedUser.blocked && 'blockReason' in selectedUser && selectedUser.blockReason) && (
                                <span className="ml-2 text-xs text-destructive">({selectedUser.blockReason})</span>
                              )}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <BriefcaseBusiness className="h-4 w-4" />
                            {selectedUser.userType === 'company' ? 'Company Details' : 'Professional Details'}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {selectedUser.userType === 'company' ? (
                            <>
                              <div className="grid grid-cols-3 gap-1">
                                <span className="text-sm text-muted-foreground">Company Name:</span>
                                <span className="text-sm col-span-2">-</span>
                              </div>
                              <div className="grid grid-cols-3 gap-1">
                                <span className="text-sm text-muted-foreground">Industry:</span>
                                <span className="text-sm col-span-2">-</span>
                              </div>
                              <div className="grid grid-cols-3 gap-1">
                                <span className="text-sm text-muted-foreground">Size:</span>
                                <span className="text-sm col-span-2">-</span>
                              </div>
                              <div className="grid grid-cols-3 gap-1">
                                <span className="text-sm text-muted-foreground">Location:</span>
                                <span className="text-sm col-span-2">-</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="grid grid-cols-3 gap-1">
                                <span className="text-sm text-muted-foreground">Title:</span>
                                <span className="text-sm col-span-2">-</span>
                              </div>
                              <div className="grid grid-cols-3 gap-1">
                                <span className="text-sm text-muted-foreground">Expertise:</span>
                                <span className="text-sm col-span-2">-</span>
                              </div>
                              <div className="grid grid-cols-3 gap-1">
                                <span className="text-sm text-muted-foreground">Experience:</span>
                                <span className="text-sm col-span-2">-</span>
                              </div>
                              <div className="grid grid-cols-3 gap-1">
                                <span className="text-sm text-muted-foreground">Location:</span>
                                <span className="text-sm col-span-2">-</span>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <ReceiptText className="h-4 w-4" />
                            Subscription
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="grid grid-cols-3 gap-1">
                            <span className="text-sm text-muted-foreground">Plan:</span>
                            <span className="text-sm col-span-2">{selectedUser.subscriptionTier || 'Free'}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            <span className="text-sm text-muted-foreground">Status:</span>
                            <span className="text-sm col-span-2">{selectedUser.subscriptionStatus || 'N/A'}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            <span className="text-sm text-muted-foreground">Stripe Customer:</span>
                            <span className="text-sm col-span-2">{selectedUser.stripeCustomerId || 'Not set up'}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            <span className="text-sm text-muted-foreground">Subscription ID:</span>
                            <span className="text-sm col-span-2">{selectedUser.stripeSubscriptionId || 'N/A'}</span>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            Activity Summary
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {isLoadingActivity ? (
                            <div className="flex justify-center p-4">
                              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                          ) : (
                            <>
                              <div className="grid grid-cols-3 gap-1">
                                <span className="text-sm text-muted-foreground">Posted Jobs:</span>
                                <span className="text-sm col-span-2">{userActivity?.postedJobs || 0}</span>
                              </div>
                              <div className="grid grid-cols-3 gap-1">
                                <span className="text-sm text-muted-foreground">Projects:</span>
                                <span className="text-sm col-span-2">{userActivity?.completedProjects || 0}</span>
                              </div>
                              <div className="grid grid-cols-3 gap-1">
                                <span className="text-sm text-muted-foreground">Total Payments:</span>
                                <span className="text-sm col-span-2">${userActivity?.totalPayments || 0}</span>
                              </div>
                              <div className="grid grid-cols-3 gap-1">
                                <span className="text-sm text-muted-foreground">Last Activity:</span>
                                <span className="text-sm col-span-2">{
                                  userActivity?.lastActive ? formatDate(userActivity.lastActive) : 'Never'
                                }</span>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="activity" className="h-full">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Activity Statistics
                        </CardTitle>
                        <CardDescription>
                          Summary of user's activity and engagement on the platform
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isLoadingActivity ? (
                          <div className="flex justify-center p-4">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-muted/40 p-4 rounded-lg flex flex-col items-center justify-center">
                              <span className="text-3xl font-bold">{userActivity?.postedJobs || 0}</span>
                              <span className="text-sm text-muted-foreground">Posted Jobs</span>
                            </div>
                            <div className="bg-muted/40 p-4 rounded-lg flex flex-col items-center justify-center">
                              <span className="text-3xl font-bold">{userActivity?.completedProjects || 0}</span>
                              <span className="text-sm text-muted-foreground">Completed Projects</span>
                            </div>
                            <div className="bg-muted/40 p-4 rounded-lg flex flex-col items-center justify-center">
                              <span className="text-3xl font-bold">${userActivity?.totalPayments || 0}</span>
                              <span className="text-sm text-muted-foreground">Total Payments</span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    <div className="h-4"></div>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Activity Timeline
                        </CardTitle>
                        <CardDescription>
                          A detailed history of user's interactions and activities
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="relative pl-6 border-l border-muted space-y-4">
                          <div className="relative">
                            <div className="absolute -left-[29px] w-4 h-4 rounded-full bg-primary"></div>
                            <div>
                              <p className="text-sm font-medium">Account created</p>
                              <p className="text-xs text-muted-foreground">{formatDate(selectedUser.createdAt)}</p>
                            </div>
                          </div>
                          <div className="relative">
                            <div className="absolute -left-[29px] w-4 h-4 rounded-full bg-muted"></div>
                            <div>
                              <p className="text-sm font-medium">No recent activity</p>
                              <p className="text-xs text-muted-foreground">User has no recorded activity</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="transactions" className="h-full">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Wallet className="h-4 w-4" />
                          Transaction History
                        </CardTitle>
                        <CardDescription>
                          A complete record of all financial transactions
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isLoadingTransactions ? (
                          <div className="flex justify-center p-4">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                          </div>
                        ) : userTransactions.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {userTransactions.map((transaction) => (
                                <TableRow key={transaction.id}>
                                  <TableCell className="font-mono text-xs">
                                    {transaction.id}
                                  </TableCell>
                                  <TableCell>
                                    {formatDate(transaction.date)}
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    ${transaction.amount.toFixed(2)}
                                  </TableCell>
                                  <TableCell>
                                    {transaction.description}
                                  </TableCell>
                                  <TableCell>
                                    {transaction.method}
                                  </TableCell>
                                  <TableCell>
                                    {getTransactionStatusBadge(transaction.status)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <p>No transaction history found</p>
                            <p className="text-sm">This user has not made any transactions yet</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="complaints" className="h-full">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Complaints
                        </CardTitle>
                        <CardDescription>
                          List of complaints about this user and their current status
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isLoadingComplaints ? (
                          <div className="flex justify-center p-4">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                          </div>
                        ) : userComplaints.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Reporter</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {userComplaints.map((complaint) => (
                                <TableRow key={complaint.id}>
                                  <TableCell className="font-mono text-xs">
                                    {complaint.id}
                                  </TableCell>
                                  <TableCell>
                                    {formatDate(complaint.createdAt)}
                                  </TableCell>
                                  <TableCell>
                                    {complaint.reason}
                                  </TableCell>
                                  <TableCell className="font-mono text-xs">
                                    ID: {complaint.reporterId}
                                  </TableCell>
                                  <TableCell>
                                    {getComplaintStatusBadge(complaint.status)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <p>No complaints found</p>
                            <p className="text-sm">This user has not received any complaints</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProfileOpen(false)}>
              Close
            </Button>
            {selectedUser && (
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Edit User
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Block User Dialog */}
      <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {userToBlock?.action === 'block' ? 'Block User' : 'Unblock User'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {userToBlock?.action === 'block' 
                ? 'This will prevent the user from accessing the platform. They will be logged out and unable to login until unblocked.'
                : 'This will restore the user\'s access to the platform.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {userToBlock?.action === 'block' && (
            <div className="py-4">
              <label className="text-sm font-medium" htmlFor="block-reason">
                Reason for blocking (optional):
              </label>
              <Input
                id="block-reason"
                placeholder="Enter a reason for blocking this user"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="mt-2"
              />
            </div>
          )}
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlockConfirm}
              className={userToBlock?.action === 'block' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {blockUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : userToBlock?.action === 'block' ? (
                "Block User"
              ) : (
                "Unblock User"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Delete User Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will delete the user account and all associated data. 
              The account can be restored within 30 days by an administrator.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Account"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}