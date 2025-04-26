import { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { getQueryFn } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Import admin components
import UsersPanel from "@/components/admin/users-panel";
import ProfessionalsPanel from "@/components/admin/professionals-panel";
import CompaniesPanel from "@/components/admin/companies-panel";
import JobsPanel from "@/components/admin/jobs-panel";
import ResourcesPanel from "@/components/admin/resources-panel";
import ContentPanel from "@/components/admin/content-panel";

import { 
  ProfessionalProfile,
  CompanyProfile,
  JobPosting,
  Resource,
} from "@shared/schema";

import { 
  BarChart4,
  Users,
  Briefcase,
  Building,
  FileText,
  Tags,
  MessageSquare,
  Shield,
} from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  
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

  // Fetch dashboard statistics 
  const { data: stats } = useQuery({
    queryKey: ['/api/admin/dashboard-stats'],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user?.isAdmin,
  });

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
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center">
          <Shield className="h-8 w-8 mr-2 text-primary" />
          Admin Dashboard
        </h1>
        <p className="text-gray-500">Manage all aspects of the L&D Nexus platform</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-7 md:w-auto w-full">
          <TabsTrigger value="overview" className="flex items-center">
            <BarChart4 className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="professionals" className="flex items-center">
            <Briefcase className="h-4 w-4 mr-2" />
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
          <TabsTrigger value="resources" className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Resources</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Pages</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Platform Statistics</CardTitle>
                <CardDescription>Key metrics for the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted p-4 rounded-lg text-center">
                    <h3 className="text-3xl font-bold text-primary">
                      {stats?.totalUsers || 0}
                    </h3>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg text-center">
                    <h3 className="text-3xl font-bold text-primary">
                      {stats?.professionals || profiles?.length || 0}
                    </h3>
                    <p className="text-sm text-muted-foreground">Active Professionals</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg text-center">
                    <h3 className="text-3xl font-bold text-primary">
                      {stats?.companies || companies?.length || 0}
                    </h3>
                    <p className="text-sm text-muted-foreground">Registered Companies</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg text-center">
                    <h3 className="text-3xl font-bold text-primary">
                      {stats?.jobs || jobs?.length || 0}
                    </h3>
                    <p className="text-sm text-muted-foreground">Active Jobs</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg text-center">
                    <h3 className="text-3xl font-bold text-primary">
                      {stats?.resources || resources?.length || 0}
                    </h3>
                    <p className="text-sm text-muted-foreground">Published Resources</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg text-center">
                    <h3 className="text-3xl font-bold text-primary">
                      {stats?.totalApplications || 0}
                    </h3>
                    <p className="text-sm text-muted-foreground">Job Applications</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg text-center">
                    <h3 className="text-3xl font-bold text-primary">
                      {stats?.completedJobs || 0}
                    </h3>
                    <p className="text-sm text-muted-foreground">Completed Jobs</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg text-center">
                    <h3 className="text-3xl font-bold text-primary">
                      ${stats?.totalRevenue?.toFixed(2) || "0.00"}
                    </h3>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest platform events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.recentActivity?.length > 0 ? (
                    stats.recentActivity.map((activity, index) => (
                      <div key={index} className="border-b pb-3 last:border-b-0">
                        <p className="font-medium">{activity.type}</p>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      No recent activity found
                    </div>
                  )}
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

        <TabsContent value="resources" className="mt-6">
          <ResourcesPanel />
        </TabsContent>
        
        <TabsContent value="content" className="mt-6">
          <ContentPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}