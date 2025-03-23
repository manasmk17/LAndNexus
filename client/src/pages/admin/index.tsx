import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Building2, 
  FileText, 
  MessageSquare, 
  Settings,
  CreditCard,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { User } from "@shared/schema";

import Dashboard from "@/components/admin/new/dashboard";
import UserManagement from "@/components/admin/new/user-management";
import FreelancerManagement from "@/components/admin/new/freelancer-management";
import CompanyManagement from "@/components/admin/new/company-management";
import JobManagement from "@/components/admin/new/job-management";
import ContentManagement from "@/components/admin/new/content-management";
import PaymentManagement from "@/components/admin/new/payment-management";
import SettingsManagement from "@/components/admin/new/settings-management";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { id: "users", label: "Users", icon: <Users className="h-5 w-5" /> },
  { id: "freelancers", label: "Freelancers", icon: <Briefcase className="h-5 w-5" /> },
  { id: "companies", label: "Companies", icon: <Building2 className="h-5 w-5" /> },
  { id: "jobs", label: "Jobs", icon: <Briefcase className="h-5 w-5" /> },
  { id: "content", label: "Content", icon: <FileText className="h-5 w-5" /> },
  { id: "payments", label: "Payments", icon: <CreditCard className="h-5 w-5" /> },
  { id: "settings", label: "Settings", icon: <Settings className="h-5 w-5" /> },
];

export default function AdminIndex() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState("dashboard");
  
  // Redirect if not admin
  useEffect(() => {
    if (user && !user.isAdmin) {
      setLocation("/");
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin area.",
        variant: "destructive",
      });
    }
  }, [user, setLocation, toast]);

  // Get count of users (used in several places)
  const { data: users = [] } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: getQueryFn<User[]>({ on401: "throw" }),
    enabled: !!user?.isAdmin,
  });

  if (!user || !user.isAdmin) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="mb-4">You must be an administrator to access this page.</p>
        <Button onClick={() => setLocation("/")}>Go to Home</Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Sidebar */}
      <div className="bg-card w-64 flex flex-col border-r">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="font-bold text-xl">Admin Panel</h1>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm transition-colors 
                ${
                  activeSection === item.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }
              `}
              onClick={() => setActiveSection(item.id)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary h-8 w-8 flex items-center justify-center text-primary-foreground">
              {user.firstName?.charAt(0) || user.username?.charAt(0) || "A"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">
                {user.firstName && user.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user.username}
              </p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Header */}
        <header className="border-b bg-background px-6 py-3">
          <h1 className="text-lg font-medium">
            {navItems.find(item => item.id === activeSection)?.label || "Dashboard"}
          </h1>
        </header>
        
        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          {activeSection === "dashboard" && <Dashboard />}
          {activeSection === "users" && <UserManagement />}
          {activeSection === "freelancers" && <FreelancerManagement />}
          {activeSection === "companies" && <CompanyManagement />}
          {activeSection === "jobs" && <JobManagement />}
          {activeSection === "content" && <ContentManagement />}
          {activeSection === "payments" && <PaymentManagement />}
          {activeSection === "settings" && <SettingsManagement />}
        </main>
      </div>
    </div>
  );
}