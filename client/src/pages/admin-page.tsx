import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Briefcase,
  FileText,
  Settings,
  LogOut,
  Shield,
  BookOpen,
  DollarSign,
  BarChart3,
  Building,
  Bell,
  List,
  Award,
  AlertTriangle,
} from "lucide-react";

// Placeholder for admin components (these would normally be imported)
const UsersManagement = () => (
  <div className="space-y-4">
    <h2 className="text-xl font-semibold">Users Management</h2>
    <Card>
      <CardContent className="p-4">
        <p className="text-center py-8 text-muted-foreground">
          User management features will be implemented here
        </p>
      </CardContent>
    </Card>
  </div>
);

const ProfessionalsManagement = () => (
  <div className="space-y-4">
    <h2 className="text-xl font-semibold">Professionals Management</h2>
    <Card>
      <CardContent className="p-4">
        <p className="text-center py-8 text-muted-foreground">
          Professional management features will be implemented here
        </p>
      </CardContent>
    </Card>
  </div>
);

const CompaniesManagement = () => (
  <div className="space-y-4">
    <h2 className="text-xl font-semibold">Companies Management</h2>
    <Card>
      <CardContent className="p-4">
        <p className="text-center py-8 text-muted-foreground">
          Company management features will be implemented here
        </p>
      </CardContent>
    </Card>
  </div>
);

const JobsManagement = () => (
  <div className="space-y-4">
    <h2 className="text-xl font-semibold">Jobs Management</h2>
    <Card>
      <CardContent className="p-4">
        <p className="text-center py-8 text-muted-foreground">
          Job posting management features will be implemented here
        </p>
      </CardContent>
    </Card>
  </div>
);

const ResourcesManagement = () => (
  <div className="space-y-4">
    <h2 className="text-xl font-semibold">Resources Management</h2>
    <Card>
      <CardContent className="p-4">
        <p className="text-center py-8 text-muted-foreground">
          Resource management features will be implemented here
        </p>
      </CardContent>
    </Card>
  </div>
);

const FinancialManagement = () => (
  <div className="space-y-4">
    <h2 className="text-xl font-semibold">Financial Management</h2>
    <Card>
      <CardContent className="p-4">
        <p className="text-center py-8 text-muted-foreground">
          Financial management features will be implemented here
        </p>
      </CardContent>
    </Card>
  </div>
);

const AnalyticsView = () => (
  <div className="space-y-4">
    <h2 className="text-xl font-semibold">Analytics & Reporting</h2>
    <Card>
      <CardContent className="p-4">
        <p className="text-center py-8 text-muted-foreground">
          Analytics and reporting features will be implemented here
        </p>
      </CardContent>
    </Card>
  </div>
);

const SystemSettings = () => (
  <div className="space-y-4">
    <h2 className="text-xl font-semibold">System Settings</h2>
    <Card>
      <CardContent className="p-4">
        <p className="text-center py-8 text-muted-foreground">
          System settings and configuration options will be implemented here
        </p>
      </CardContent>
    </Card>
  </div>
);

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminData, setAdminData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Verify admin authentication on component mount
  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("adminToken");
        
        // If no token is found, redirect to login
        if (!token) {
          throw new Error("No admin token found");
        }
        
        // Create headers with JWT token
        const headers = {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        };
        
        // Verify token with backend
        try {
          const response = await fetch("/api/admin/auth/verify-token", {
            method: "GET",
            headers
          });
          
          if (!response.ok) {
            throw new Error("Admin authentication failed: " + response.statusText);
          }
        } catch (tokenError) {
          console.error("Token verification error:", tokenError);
          throw new Error("Authentication error: Unable to verify admin token");
        }
        
        // Get admin data
        try {
          const adminDataResponse = await fetch("/api/admin/auth/me", {
            method: "GET",
            headers
          });
          
          if (!adminDataResponse.ok) {
            throw new Error("Failed to fetch admin data: " + adminDataResponse.statusText);
          }
          
          const data = await adminDataResponse.json();
          console.log("Admin data received:", data);
          setAdminData(data);
        } catch (dataError) {
          console.error("Admin data fetch error:", dataError);
          toast({
            variant: "destructive",
            title: "Data Error",
            description: "Could not load admin dashboard data. The server may be experiencing issues.",
          });
          // We still set isAuthenticated to true since the token was valid
        }
        
        setIsAuthenticated(true);
      } catch (err: any) {
        console.error("Admin authentication error:", err);
        setError(err.message);
        
        // Clear any invalid tokens
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminRefreshToken");
        
        // Redirect to login page after a short delay
        setTimeout(() => {
          toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "Please login to access the admin panel",
          });
          setLocation("/admin-login");
        }, 1500);
      } finally {
        setIsLoading(false);
      }
    };
    
    verifyAdmin();
  }, [setLocation, toast]);

  // Sample summary data for the dashboard (would be replaced with real data from API)
  const summaryData = {
    users: adminData?.stats?.totalUsers || 0,
    professionals: adminData?.stats?.totalProfessionals || 0,
    companies: adminData?.stats?.totalCompanies || 0,
    jobs: adminData?.stats?.totalJobs || 0,
    resources: adminData?.stats?.totalResources || 0,
    revenue: adminData?.stats?.monthlyRevenue || "$0",
  };

  const handleLogout = async () => {
    // Clear admin tokens
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminRefreshToken");
    
    // Show logout notification
    toast({
      title: "Logged out",
      description: "You have been logged out of the admin panel",
    });
    
    // Redirect to login page
    setLocation("/admin-login");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4"></div>
        <h2 className="text-xl font-semibold mb-2">Verifying Admin Access</h2>
        <p className="text-muted-foreground">Please wait while we authenticate your credentials...</p>
      </div>
    );
  }
  
  // Error state
  if (error && !isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
          <div className="flex items-center justify-center mb-6 text-rose-500">
            <AlertTriangle className="h-12 w-12" />
          </div>
          <h2 className="text-2xl font-bold text-center mb-4">Authentication Error</h2>
          <p className="text-center text-muted-foreground mb-6">{error}</p>
          <Button 
            className="w-full" 
            onClick={() => setLocation("/admin-login")}
          >
            Return to Login
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <div className="w-64 bg-white border-r shadow-sm p-4 hidden md:block">
        <div className="flex items-center gap-2 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-xl font-bold tracking-tight">Admin Panel</h1>
          {adminData && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              {adminData.role || 'Admin'}
            </span>
          )}
        </div>
        
        <nav className="space-y-1">
          {/* Desktop menu */}
          <div onClick={() => setActiveTab("dashboard")} className="cursor-pointer">
            <div className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${activeTab === "dashboard" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}>
              <BarChart3 className="h-5 w-5 mr-2" />
              Dashboard
            </div>
          </div>
          
          <div onClick={() => setActiveTab("users")} className="cursor-pointer">
            <div className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${activeTab === "users" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}>
              <Users className="h-5 w-5 mr-2" />
              Users
            </div>
          </div>
          
          <div onClick={() => setActiveTab("professionals")} className="cursor-pointer">
            <div className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${activeTab === "professionals" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}>
              <Award className="h-5 w-5 mr-2" />
              Professionals
            </div>
          </div>
          
          <div onClick={() => setActiveTab("companies")} className="cursor-pointer">
            <div className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${activeTab === "companies" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}>
              <Building className="h-5 w-5 mr-2" />
              Companies
            </div>
          </div>
          
          <div onClick={() => setActiveTab("jobs")} className="cursor-pointer">
            <div className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${activeTab === "jobs" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}>
              <Briefcase className="h-5 w-5 mr-2" />
              Jobs
            </div>
          </div>
          
          <div onClick={() => setActiveTab("resources")} className="cursor-pointer">
            <div className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${activeTab === "resources" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}>
              <BookOpen className="h-5 w-5 mr-2" />
              Resources
            </div>
          </div>
          
          <div onClick={() => setActiveTab("finances")} className="cursor-pointer">
            <div className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${activeTab === "finances" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}>
              <DollarSign className="h-5 w-5 mr-2" />
              Finances
            </div>
          </div>
          
          <div onClick={() => setActiveTab("analytics")} className="cursor-pointer">
            <div className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${activeTab === "analytics" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}>
              <BarChart3 className="h-5 w-5 mr-2" />
              Analytics
            </div>
          </div>
          
          <div onClick={() => setActiveTab("settings")} className="cursor-pointer">
            <div className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${activeTab === "settings" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}>
              <Settings className="h-5 w-5 mr-2" />
              Settings
            </div>
          </div>

          <hr className="my-4" />
          
          <div onClick={handleLogout} className="cursor-pointer">
            <div className="flex items-center w-full px-3 py-2 text-sm font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-md">
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </div>
          </div>
        </nav>
      </div>

      {/* Mobile Sidebar - Shown when mobileMenuOpen is true */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-64 h-full bg-white p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Shield className="h-8 w-8 text-primary" />
                <h1 className="text-xl font-bold tracking-tight">Admin Panel</h1>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </Button>
            </div>
            
            <nav className="space-y-1">
              {/* Mobile menu - same items as desktop but with setMobileMenuOpen(false) added */}
              <div 
                onClick={() => {
                  setActiveTab("dashboard");
                  setMobileMenuOpen(false);
                }} 
                className="cursor-pointer"
              >
                <div className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${activeTab === "dashboard" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}>
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Dashboard
                </div>
              </div>
              
              <div 
                onClick={() => {
                  setActiveTab("users");
                  setMobileMenuOpen(false);
                }} 
                className="cursor-pointer"
              >
                <div className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${activeTab === "users" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}>
                  <Users className="h-5 w-5 mr-2" />
                  Users
                </div>
              </div>
              
              <div 
                onClick={() => {
                  setActiveTab("professionals");
                  setMobileMenuOpen(false);
                }} 
                className="cursor-pointer"
              >
                <div className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${activeTab === "professionals" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}>
                  <Award className="h-5 w-5 mr-2" />
                  Professionals
                </div>
              </div>
              
              <div 
                onClick={() => {
                  setActiveTab("companies");
                  setMobileMenuOpen(false);
                }} 
                className="cursor-pointer"
              >
                <div className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${activeTab === "companies" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}>
                  <Building className="h-5 w-5 mr-2" />
                  Companies
                </div>
              </div>
              
              <div 
                onClick={() => {
                  setActiveTab("jobs");
                  setMobileMenuOpen(false);
                }} 
                className="cursor-pointer"
              >
                <div className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${activeTab === "jobs" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}>
                  <Briefcase className="h-5 w-5 mr-2" />
                  Jobs
                </div>
              </div>
              
              <div 
                onClick={() => {
                  setActiveTab("resources");
                  setMobileMenuOpen(false);
                }} 
                className="cursor-pointer"
              >
                <div className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${activeTab === "resources" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}>
                  <BookOpen className="h-5 w-5 mr-2" />
                  Resources
                </div>
              </div>
              
              <hr className="my-4" />
              
              <div 
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }} 
                className="cursor-pointer"
              >
                <div className="flex items-center w-full px-3 py-2 text-sm font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-md">
                  <LogOut className="h-5 w-5 mr-2" />
                  Logout
                </div>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Mobile menu button */}
      <Button 
        variant="outline" 
        size="icon" 
        className="fixed top-4 left-4 z-40 md:hidden"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        <List className="h-4 w-4" />
      </Button>

      {/* Main content */}
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-gray-500">Overview of the L&D Nexus platform</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Users
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {adminData ? (
                      <div className="text-2xl font-bold">{summaryData.users}</div>
                    ) : (
                      <Skeleton className="h-8 w-16" />
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Professionals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {adminData ? (
                      <div className="text-2xl font-bold">{summaryData.professionals}</div>
                    ) : (
                      <Skeleton className="h-8 w-16" />
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Companies
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {adminData ? (
                      <div className="text-2xl font-bold">{summaryData.companies}</div>
                    ) : (
                      <Skeleton className="h-8 w-16" />
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Active Jobs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {adminData ? (
                      <div className="text-2xl font-bold">{summaryData.jobs}</div>
                    ) : (
                      <Skeleton className="h-8 w-16" />
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Resources
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {adminData ? (
                      <div className="text-2xl font-bold">{summaryData.resources}</div>
                    ) : (
                      <Skeleton className="h-8 w-16" />
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Monthly Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {adminData ? (
                      <div className="text-2xl font-bold">{summaryData.revenue}</div>
                    ) : (
                      <Skeleton className="h-8 w-20" />
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {adminData ? (
                    <p className="text-center py-8 text-muted-foreground">
                      Activity feed will be displayed here
                    </p>
                  ) : (
                    <div className="space-y-4">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          
          {activeTab === "users" && <UsersManagement />}
          {activeTab === "professionals" && <ProfessionalsManagement />}
          {activeTab === "companies" && <CompaniesManagement />}
          {activeTab === "jobs" && <JobsManagement />}
          {activeTab === "resources" && <ResourcesManagement />}
          {activeTab === "finances" && <FinancialManagement />}
          {activeTab === "analytics" && <AnalyticsView />}
          {activeTab === "settings" && <SystemSettings />}
        </div>
      </div>
    </div>
  );
}