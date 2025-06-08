import { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, Building, FileText, Briefcase, LayoutDashboard } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

import { UsersPanel } from "@/components/admin/simplified/users-panel";
import { CompaniesPanel } from "@/components/admin/simplified/companies-panel";
import { ProfessionalsPanel } from "@/components/admin/simplified/professionals-panel";
import { JobsPanel } from "@/components/admin/simplified/jobs-panel";
import { ResourcesPanel } from "@/components/admin/simplified/resources-panel";
import { ContentPanel } from "@/components/admin/simplified/content-panel";

import { User, ProfessionalProfile, CompanyProfile, JobPosting, Resource } from "@shared/schema";

export default function AdminPanel() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Fetch data for dashboard stats
  const { data: profiles = [] } = useQuery({
    queryKey: ['/api/admin/professional-profiles'],
    queryFn: getQueryFn<ProfessionalProfile[]>({ on401: "throw" }),
    enabled: !!user?.isAdmin,
  });
  
  const { data: companies = [] } = useQuery({
    queryKey: ['/api/admin/company-profiles'],
    queryFn: getQueryFn<CompanyProfile[]>({ on401: "throw" }),
    enabled: !!user?.isAdmin,
  });
  
  const { data: jobs = [] } = useQuery({
    queryKey: ['/api/admin/job-postings'],
    queryFn: getQueryFn<JobPosting[]>({ on401: "throw" }),
    enabled: !!user?.isAdmin,
  });
  
  const { data: resources = [] } = useQuery({
    queryKey: ['/api/admin/resources'],
    queryFn: getQueryFn<Resource[]>({ on401: "throw" }),
    enabled: !!user?.isAdmin,
  });
  
  const { data: users = [] } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: getQueryFn<User[]>({ on401: "throw" }),
    enabled: !!user?.isAdmin,
  });

  // Redirect if not admin
  useEffect(() => {
    if (user && !user.isAdmin) {
      setLocation("/");
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin panel.",
        variant: "destructive",
      });
    }
  }, [user, setLocation, toast]);

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
    <div className="container mx-auto py-6 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center">
          <Shield className="h-8 w-8 mr-2 text-primary" />
          Admin Panel
        </h1>
        <p className="text-muted-foreground">Simplified management interface for L&D Nexus platform</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-6 w-full md:w-auto">
          <TabsTrigger value="dashboard" className="flex items-center">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="professionals" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Professionals</span>
          </TabsTrigger>
          <TabsTrigger value="companies" className="flex items-center">
            <Building className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Companies</span>
          </TabsTrigger>
          <TabsTrigger value="jobs" className="flex items-center">
            <Briefcase className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Jobs</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Content</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Overview</CardTitle>
                <CardDescription>Key metrics and statistics about the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted p-4 rounded-lg text-center">
                    <h3 className="text-3xl font-bold text-primary">
                      {users?.length || 0}
                    </h3>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg text-center">
                    <h3 className="text-3xl font-bold text-primary">
                      {profiles?.length || 0}
                    </h3>
                    <p className="text-sm text-muted-foreground">Professionals</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg text-center">
                    <h3 className="text-3xl font-bold text-primary">
                      {companies?.length || 0}
                    </h3>
                    <p className="text-sm text-muted-foreground">Companies</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg text-center">
                    <h3 className="text-3xl font-bold text-primary">
                      {jobs?.length || 0}
                    </h3>
                    <p className="text-sm text-muted-foreground">Active Jobs</p>
                  </div>
                </div>
                
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab("users")}
                    >
                      Manage Users
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab("professionals")}
                    >
                      Manage Professionals
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab("companies")}
                    >
                      Manage Companies
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab("jobs")}
                    >
                      Manage Jobs
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab("content")}
                    >
                      Manage Content
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <UsersPanel />
        </TabsContent>

        <TabsContent value="professionals" className="mt-6">
          <ProfessionalsPanel />
        </TabsContent>

        <TabsContent value="companies" className="mt-6">
          <CompaniesPanel />
        </TabsContent>

        <TabsContent value="jobs" className="mt-6">
          <JobsPanel />
        </TabsContent>

        <TabsContent value="content" className="mt-6">
          <ContentPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}