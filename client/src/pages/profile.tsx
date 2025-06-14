import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Building, 
  Edit, 
  Star,
  Award,
  Briefcase,
  Users
} from "lucide-react";

export default function Profile() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-slate-600">Please log in to view your profile.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getUserInitials = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    return user.username.charAt(0).toUpperCase();
  };

  const getUserDisplayName = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.username;
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
          <p className="text-slate-600 mt-2">View and manage your profile information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Overview */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={""} />
                    <AvatarFallback className="text-lg bg-blue-100 text-blue-700">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <h2 className="text-xl font-semibold text-slate-900 mb-1">
                    {getUserDisplayName()}
                  </h2>
                  
                  <Badge variant="outline" className="mb-4">
                    {user.userType === "professional" ? "L&D Professional" : "Company"}
                  </Badge>

                  <div className="w-full space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="h-4 w-4" />
                      <span>{user.email}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="h-4 w-4" />
                      <span>Member since {new Date(user.createdAt).getFullYear()}</span>
                    </div>

                    {user.userType === "professional" && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Award className="h-4 w-4" />
                        <span>Professional</span>
                      </div>
                    )}

                    {user.userType === "company" && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Building className="h-4 w-4" />
                        <span>Company Account</span>
                      </div>
                    )}
                  </div>

                  <Separator className="my-4" />

                  <Link href="/edit-profile" className="w-full">
                    <Button variant="outline" className="w-full">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {user.userType === "professional" && (
                    <>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm text-slate-600">Rating</span>
                        </div>
                        <span className="font-medium">4.8</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-blue-500" />
                          <span className="text-sm text-slate-600">Completed Projects</span>
                        </div>
                        <span className="font-medium">12</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-slate-600">Client Reviews</span>
                        </div>
                        <span className="font-medium">8</span>
                      </div>
                    </>
                  )}

                  {user.userType === "company" && (
                    <>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-blue-500" />
                          <span className="text-sm text-slate-600">Active Jobs</span>
                        </div>
                        <span className="font-medium">3</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-slate-600">Total Applications</span>
                        </div>
                        <span className="font-medium">24</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  Your basic account details and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-slate-900">Username</label>
                    <p className="text-slate-600 mt-1">{user.username}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-900">Email Address</label>
                    <p className="text-slate-600 mt-1">{user.email}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-900">First Name</label>
                    <p className="text-slate-600 mt-1">{user.firstName || "Not specified"}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-900">Last Name</label>
                    <p className="text-slate-600 mt-1">{user.lastName || "Not specified"}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-900">Account Type</label>
                    <p className="text-slate-600 mt-1 capitalize">{user.userType}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-900">Member Since</label>
                    <p className="text-slate-600 mt-1">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium text-slate-900 mb-4">Subscription Status</h3>
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium text-blue-900">Professional Plan</p>
                      <p className="text-sm text-blue-700">Access to all premium features</p>
                    </div>
                    <Badge className="bg-green-100 text-green-700">Active</Badge>
                  </div>
                </div>

                <Separator />

                <div className="flex gap-3">
                  <Link href="/edit-profile">
                    <Button>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </Link>
                  
                  <Link href="/settings">
                    <Button variant="outline">
                      <User className="h-4 w-4 mr-2" />
                      Account Settings
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your latest actions on the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Profile updated</p>
                      <p className="text-xs text-slate-500">2 hours ago</p>
                    </div>
                  </div>
                  
                  {user.userType === "company" && (
                    <div className="flex items-start gap-3">
                      <div className="h-2 w-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">New job posting created</p>
                        <p className="text-xs text-slate-500">1 day ago</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 bg-yellow-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Message received</p>
                      <p className="text-xs text-slate-500">3 days ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}