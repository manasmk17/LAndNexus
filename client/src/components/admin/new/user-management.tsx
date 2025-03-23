import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Search,
  MoreHorizontal,
  Trash2,
  Edit,
  UserPlus,
  Filter,
  Download,
  Mail,
  ShieldCheck,
  ShieldX,
  Eye,
  UserX,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

// Sample user data for the table
const sampleUsers = [
  {
    id: 1,
    username: "johndoe",
    email: "john.doe@example.com",
    firstName: "John",
    lastName: "Doe",
    userType: "professional",
    isAdmin: false,
    createdAt: new Date("2023-01-15"),
  },
  {
    id: 2,
    username: "janesmith",
    email: "jane.smith@techcorp.com",
    firstName: "Jane",
    lastName: "Smith",
    userType: "company",
    isAdmin: false,
    createdAt: new Date("2023-01-22"),
  },
  {
    id: 3,
    username: "admin1",
    email: "admin@ldnexus.com",
    firstName: "Admin",
    lastName: "User",
    userType: "admin",
    isAdmin: true,
    createdAt: new Date("2022-11-08"),
  },
  {
    id: 4,
    username: "sarahjones",
    email: "sarah.jones@email.com",
    firstName: "Sarah",
    lastName: "Jones",
    userType: "professional",
    isAdmin: false,
    createdAt: new Date("2023-02-10"),
  },
  {
    id: 5,
    username: "robertwilliams",
    email: "robert@trainingsolutions.co",
    firstName: "Robert",
    lastName: "Williams",
    userType: "company",
    isAdmin: false,
    createdAt: new Date("2023-02-15"),
  },
  {
    id: 6,
    username: "alexbrown",
    email: "alex.brown@ldexpert.com",
    firstName: "Alex",
    lastName: "Brown",
    userType: "professional",
    isAdmin: false,
    createdAt: new Date("2023-02-18"),
  },
  {
    id: 7,
    username: "michaeljohnson",
    email: "michael@learningco.com",
    firstName: "Michael",
    lastName: "Johnson",
    userType: "company",
    isAdmin: false,
    createdAt: new Date("2023-02-22"),
  },
  {
    id: 8,
    username: "emilydavis",
    email: "emily.davis@trainpro.com",
    firstName: "Emily",
    lastName: "Davis",
    userType: "professional",
    isAdmin: false,
    createdAt: new Date("2023-03-01"),
  },
  {
    id: 9,
    username: "davidclark",
    email: "david@skillbuilders.org",
    firstName: "David",
    lastName: "Clark",
    userType: "company",
    isAdmin: false,
    createdAt: new Date("2023-03-10"),
  },
  {
    id: 10,
    username: "oliviamartin",
    email: "olivia.martin@email.com",
    firstName: "Olivia",
    lastName: "Martin",
    userType: "professional",
    isAdmin: false,
    createdAt: new Date("2023-03-15"),
  },
];

export default function UserManagement() {
  const [users, setUsers] = useState(sampleUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<typeof sampleUsers[0] | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    userType: "professional",
    isAdmin: false,
  });
  const { toast } = useToast();

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    const searchFields = [
      user.username, 
      user.email, 
      user.firstName, 
      user.lastName, 
      user.userType
    ];
    
    return searchFields.some(field => 
      field.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleCreateUser = () => {
    const newId = Math.max(...users.map(u => u.id)) + 1;
    const userToAdd = {
      ...newUser,
      id: newId,
      createdAt: new Date(),
    };
    
    setUsers([...users, userToAdd]);
    setIsCreateDialogOpen(false);
    setNewUser({
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      password: "",
      userType: "professional",
      isAdmin: false,
    });
    
    toast({
      title: "User created",
      description: `User ${newUser.username} was successfully created.`,
    });
  };

  const handleDeleteUser = () => {
    if (selectedUser) {
      setUsers(users.filter(user => user.id !== selectedUser.id));
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      
      toast({
        title: "User deleted",
        description: `User ${selectedUser.username} was successfully deleted.`,
      });
    }
  };

  const handleUpdateUser = () => {
    if (selectedUser) {
      setUsers(users.map(user => user.id === selectedUser.id ? selectedUser : user));
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      
      toast({
        title: "User updated",
        description: `User ${selectedUser.username} was successfully updated.`,
      });
    }
  };

  const handleToggleAdmin = (user) => {
    const updatedUser = {...user, isAdmin: !user.isAdmin};
    setUsers(users.map(u => u.id === user.id ? updatedUser : u));
    
    toast({
      title: updatedUser.isAdmin ? "Admin privileges granted" : "Admin privileges revoked",
      description: `${updatedUser.username} is ${updatedUser.isAdmin ? 'now' : 'no longer'} an admin.`,
    });
  };

  const getUserTypeColor = (userType) => {
    switch(userType) {
      case 'professional':
        return 'bg-blue-100 text-blue-800';
      case 'company':
        return 'bg-emerald-100 text-emerald-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-1">
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
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-1">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filter Users</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>All Users</DropdownMenuItem>
            <DropdownMenuItem>Professionals</DropdownMenuItem>
            <DropdownMenuItem>Companies</DropdownMenuItem>
            <DropdownMenuItem>Admins</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Recently Added</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Users table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Manage user accounts, roles, and permissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getUserTypeColor(user.userType)}>
                      {user.userType}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(user.createdAt, 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    {user.isAdmin ? 
                      <ShieldCheck className="h-5 w-5 text-emerald-500" /> : 
                      <ShieldX className="h-5 w-5 text-muted-foreground" />
                    }
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => {
                          setSelectedUser(user);
                          setIsEditDialogOpen(true);
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleAdmin(user)}>
                          {user.isAdmin ? (
                            <>
                              <ShieldX className="h-4 w-4 mr-2" />
                              Remove admin
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="h-4 w-4 mr-2" />
                              Make admin
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View profile
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="h-4 w-4 mr-2" />
                          Send email
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete user
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    No users found matching your search criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Create user dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the platform. All fields are required.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium">First Name</label>
                <Input
                  id="firstName"
                  value={newUser.firstName}
                  onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium">Last Name</label>
                <Input
                  id="lastName"
                  value={newUser.lastName}
                  onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">Username</label>
              <Input
                id="username"
                value={newUser.username}
                onChange={(e) => setNewUser({...newUser, username: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="userType" className="text-sm font-medium">User Type</label>
              <select
                id="userType"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={newUser.userType}
                onChange={(e) => setNewUser({...newUser, userType: e.target.value})}
              >
                <option value="professional">Professional</option>
                <option value="company">Company</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isAdmin"
                checked={newUser.isAdmin}
                onChange={(e) => setNewUser({...newUser, isAdmin: e.target.checked})}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="isAdmin" className="text-sm font-medium">
                Grant Admin Privileges
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateUser}>Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit user dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details and permissions.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="edit-firstName" className="text-sm font-medium">First Name</label>
                  <Input
                    id="edit-firstName"
                    value={selectedUser.firstName}
                    onChange={(e) => setSelectedUser({...selectedUser, firstName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-lastName" className="text-sm font-medium">Last Name</label>
                  <Input
                    id="edit-lastName"
                    value={selectedUser.lastName}
                    onChange={(e) => setSelectedUser({...selectedUser, lastName: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-username" className="text-sm font-medium">Username</label>
                <Input
                  id="edit-username"
                  value={selectedUser.username}
                  onChange={(e) => setSelectedUser({...selectedUser, username: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-email" className="text-sm font-medium">Email</label>
                <Input
                  id="edit-email"
                  type="email"
                  value={selectedUser.email}
                  onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-userType" className="text-sm font-medium">User Type</label>
                <select
                  id="edit-userType"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={selectedUser.userType}
                  onChange={(e) => setSelectedUser({...selectedUser, userType: e.target.value})}
                >
                  <option value="professional">Professional</option>
                  <option value="company">Company</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-isAdmin"
                  checked={selectedUser.isAdmin}
                  onChange={(e) => setSelectedUser({...selectedUser, isAdmin: e.target.checked})}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="edit-isAdmin" className="text-sm font-medium">
                  Admin Privileges
                </label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="py-4">
              <p className="text-sm">
                You are about to delete the following user:
              </p>
              <div className="mt-2 p-3 bg-muted rounded-md">
                <p className="font-semibold">{selectedUser.firstName} {selectedUser.lastName}</p>
                <p className="text-sm text-muted-foreground">@{selectedUser.username}</p>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteUser}>Delete User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}