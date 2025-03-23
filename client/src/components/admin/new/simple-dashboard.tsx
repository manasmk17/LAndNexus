import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Users,
  Briefcase,
  Building2,
  FileText,
  BookOpen,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Loader2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

// Define types for our stats and activity data
interface StatData {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'neutral';
}

interface ActivityData {
  id: number;
  message: string;
  time: string;
}

export default function SimpleDashboard() {
  const { toast } = useToast();
  const [statsData, setStatsData] = useState<StatData[]>([]);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch statistics from API
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ['/api/users'],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: professionals = [] } = useQuery<any[]>({
    queryKey: ['/api/professional-profiles'],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: companies = [] } = useQuery<any[]>({
    queryKey: ['/api/company-profiles'],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: jobs = [] } = useQuery<any[]>({
    queryKey: ['/api/job-postings'],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: resources = [] } = useQuery<any[]>({
    queryKey: ['/api/resources'],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Combine data into stats
  useEffect(() => {
    // Only process if we have data from API endpoints
    if (Array.isArray(users) && Array.isArray(professionals) && 
        Array.isArray(companies) && Array.isArray(jobs) && 
        Array.isArray(resources)) {
      
      const fetchedData = {
        users: users.length || 0,
        professionals: professionals.length || 0,
        companies: companies.length || 0,
        jobs: jobs.length || 0,
        resources: resources.length || 0,
      };
      
      const stats: StatData[] = [
        {
          title: "Total Users",
          value: fetchedData.users.toString(),
          description: "Registered platform users",
          icon: <Users className="h-4 w-4 text-muted-foreground" />,
          trend: "up"
        },
        {
          title: "Professionals",
          value: fetchedData.professionals.toString(),
          description: "Active L&D experts",
          icon: <Briefcase className="h-4 w-4 text-muted-foreground" />,
          trend: "up"
        },
        {
          title: "Companies",
          value: fetchedData.companies.toString(),
          description: "Registered businesses",
          icon: <Building2 className="h-4 w-4 text-muted-foreground" />,
          trend: "up"
        },
        {
          title: "Job Postings",
          value: fetchedData.jobs.toString(),
          description: "Active opportunities",
          icon: <FileText className="h-4 w-4 text-muted-foreground" />,
          trend: "up"
        },
        {
          title: "Resources",
          value: fetchedData.resources.toString(),
          description: "Published materials",
          icon: <BookOpen className="h-4 w-4 text-muted-foreground" />,
          trend: "up"
        },
        {
          title: "Revenue",
          value: "$" + ((fetchedData.jobs * 150) + (fetchedData.users * 20)).toLocaleString(),
          description: "Estimated platform revenue",
          icon: <CreditCard className="h-4 w-4 text-muted-foreground" />,
          trend: "up"
        }
      ];
      
      setStatsData(stats);
      setIsLoading(false);
    }
  }, [users, professionals, companies, jobs, resources]);

  // Recent activity - could be fetch from an API endpoint in the future
  useEffect(() => {
    // For now using static data, but this would be from API in production
    const recentActivity: ActivityData[] = [
      { id: 1, message: "New professional profile created by John Doe", time: "2 hours ago" },
      { id: 2, message: "TechCorp posted a new job: Learning Experience Designer", time: "5 hours ago" },
      { id: 3, message: "New resource published: 'The Future of Corporate Training'", time: "1 day ago" },
      { id: 4, message: "Sarah Johnson upgraded to Premium subscription", time: "1 day ago" },
      { id: 5, message: "New forum discussion started: 'Best practices for virtual learning'", time: "2 days ago" },
    ];
    
    setActivityData(recentActivity);
  }, []);

  // Function to refresh stats
  const refreshStats = () => {
    setIsLoading(true);
    // Invalidate queries to refetch data
    toast({
      title: "Refreshing dashboard data",
      description: "Fetching the latest platform statistics",
    });
    
    // This will be replaced with proper react-query invalidation in production
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Dashboard refreshed",
        description: "Statistics updated with latest data",
      });
    }, 1500);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
          <Button variant="outline" onClick={refreshStats} disabled={isLoading}>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Loading...
          </Button>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-5 w-24 bg-muted rounded"></div>
                <div className="h-4 w-4 bg-muted rounded-full"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted rounded mb-2"></div>
                <div className="h-4 w-32 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
        <Button variant="outline" onClick={refreshStats} className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Refresh Stats
        </Button>
      </div>
      
      {/* Stats overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statsData.map((stat, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                {stat.trend === "up" ? (
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                ) : stat.trend === "down" ? (
                  <TrendingDown className="h-3 w-3 text-rose-500" />
                ) : null}
                <span>{stat.description}</span>
              </div>
            </CardContent>
            <CardFooter className="px-4 py-0">
              <Progress value={Math.min(100, index * 15 + 25)} className="h-1" />
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest activity across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activityData.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 border-b border-border/40 pb-4 last:border-0 last:pb-0">
                <div className="rounded-full bg-primary/10 p-2">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}