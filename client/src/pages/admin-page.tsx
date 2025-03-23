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

import Dashboard from "@/components/admin/new/dashboard";
import UserManagement from "@/components/admin/new/user-management";
import FreelancerManagement from "@/components/admin/new/freelancer-management";
import CompanyManagement from "@/components/admin/new/company-management";
import JobManagement from "@/components/admin/new/job-management";
import ContentManagement from "@/components/admin/new/content-management";
import PaymentManagement from "@/components/admin/new/payment-management";
import SettingsManagement from "@/components/admin/new/settings-management";

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
    setLocation("/login");
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

  return (
    <div className="bg-background min-h-screen">
      <div className="flex flex-col h-screen">
        {/* Admin Header */}
        <header className="border-b border-border/40 py-3 px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
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

        <div className="flex flex-grow overflow-hidden">
          {/* Sidebar navigation */}
          <aside className="w-64 border-r border-border/40 p-4 hidden md:block overflow-y-auto">
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

          {/* Mobile tabs for small screens */}
          <div className="md:hidden w-full border-b border-border/40">
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full overflow-x-auto flex gap-0 justify-start px-2 h-12">
                <TabsTrigger value="dashboard" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 py-1.5">
                  <BarChart3 className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 py-1.5">
                  <Users className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="freelancers" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 py-1.5">
                  <Briefcase className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="companies" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 py-1.5">
                  <Building2 className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="jobs" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 py-1.5">
                  <FileText className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="content" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 py-1.5">
                  <BookOpen className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="payments" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 py-1.5">
                  <CreditCard className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-2 py-1.5">
                  <Settings className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Main content area */}
          <main className="flex-1 p-4 overflow-y-auto">
            {activeTab === "dashboard" && <Dashboard />}
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
    </div>
  );
}