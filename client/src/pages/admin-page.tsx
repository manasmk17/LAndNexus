import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  BarChart3,
  Users,
  Briefcase,
  Building2,
  FileText,
  BookOpen,
  CreditCard,
  Settings,
  LogOut,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getQueryFn } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

// Direct import with explicit path to ensure the component is found
import SimpleDashboard from "../components/admin/new/simple-dashboard";
import UserManagement from "../components/admin/new/user-management";
import FreelancerManagement from "../components/admin/new/freelancer-management";
import CompanyManagement from "../components/admin/new/company-management";
import JobManagement from "../components/admin/new/job-management";
import ContentManagement from "../components/admin/new/content-management";
import PaymentManagement from "../components/admin/new/payment-management";
import SettingsManagement from "../components/admin/new/settings-management";

export default function AdminPage() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Redirect if not admin
  useEffect(() => {
    if (user && !user.isAdmin) {
      setLocation("/");
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin dashboard.",
        variant: "destructive",
      });
    }
  }, [user, setLocation, toast]);

  const handleLogout = async () => {
    await logout();
    setLocation("/admin-login");
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
  };

  if (!user || !user.isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to access this area.</p>
        <Button 
          className="mt-4" 
          onClick={() => setLocation("/")}
        >
          Return to Home
        </Button>
      </div>
    );
  }

  // Render the admin interface with a simpler structure to avoid layout issues
  return (
    <div className="bg-background min-h-screen">
      {/* Admin Header */}
      <header className="border-b border-border/40 py-3 px-4 bg-background/95 sticky top-0 z-30">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden md:inline-block">
              Logged in as <span className="font-medium">{user.username}</span>
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row">
        {/* Sidebar navigation */}
        <aside className="w-full md:w-64 border-r border-border/40 p-4 md:h-[calc(100vh-61px)] md:sticky md:top-[61px]">
          <div className="space-y-1">
            <Button 
              variant={activeTab === "dashboard" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("dashboard")}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button 
              variant={activeTab === "users" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("users")}
            >
              <Users className="h-4 w-4 mr-2" />
              Users
            </Button>
            <Button 
              variant={activeTab === "freelancers" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("freelancers")}
            >
              <Briefcase className="h-4 w-4 mr-2" />
              Freelancers
            </Button>
            <Button 
              variant={activeTab === "companies" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("companies")}
            >
              <Building2 className="h-4 w-4 mr-2" />
              Companies
            </Button>
            <Button 
              variant={activeTab === "jobs" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("jobs")}
            >
              <FileText className="h-4 w-4 mr-2" />
              Jobs
            </Button>
            <Button 
              variant={activeTab === "content" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("content")}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Content
            </Button>
            <Button 
              variant={activeTab === "payments" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("payments")}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Payments
            </Button>
            <Button 
              variant={activeTab === "settings" ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("settings")}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </aside>

        {/* Main content area */}
        <main className="flex-1 p-4">
          {activeTab === "dashboard" && (
            <div className="w-full">
              <SimpleDashboard />
            </div>
          )}
          {activeTab === "users" && <UserManagement />}
          {activeTab === "freelancers" && <FreelancerManagement />}
          {activeTab === "companies" && <CompanyManagement />}
          {activeTab === "jobs" && <JobManagement />}
          {activeTab === "content" && <ContentManagement />}
          {activeTab === "payments" && <PaymentManagement />}
          {activeTab === "settings" && <SettingsManagement />}
        </main>
      </div>
    </div>
  );
}