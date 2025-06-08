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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
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

interface ActivityItem {
  id: number;
  type: string;
  description: string;
  timestamp: string;
}

interface DashboardStats {
  totalUsers: number;
  professionals: number;
  companies: number;
  jobPostings: number;
  resources: number;
  revenue: number;
  recentActivity: ActivityItem[];
}

export default function SimpleDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statsData, setStatsData] = useState<StatData[]>([]);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  
  // Fetch dashboard stats from API
  const { 
    data: dashboardStats, 
    isLoading, 
    refetch, 
    error 
  } = useQuery<DashboardStats>({
    queryKey: ['/api/admin/dashboard-stats'],
    queryFn: getQueryFn({ on401: 'throw' }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1
  });
  
  // Handle error cases with a separate effect
  useEffect(() => {
    if (error) {
      console.error('Failed to fetch dashboard stats:', error);
      // Fallback to sample data
      initializeSampleData();
      toast({
        title: "Failed to load dashboard stats",
        description: "Using sample data instead. Please try again later.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Format timestamps to relative time
  const formatRelativeTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return date.toLocaleDateString();
  };

  // Initialize sample data as fallback
  const initializeSampleData = () => {
    // For static demo data
    const sampleStats: StatData[] = [
      {
        title: "Total Users",
        value: "15",
        description: "Registered platform users",
        icon: <Users className="h-4 w-4 text-muted-foreground" />,
        trend: "up"
      },
      {
        title: "Professionals",
        value: "8",
        description: "Active L&D experts",
        icon: <Briefcase className="h-4 w-4 text-muted-foreground" />,
        trend: "up"
      },
      {
        title: "Companies",
        value: "7",
        description: "Registered businesses",
        icon: <Building2 className="h-4 w-4 text-muted-foreground" />,
        trend: "up"
      },
      {
        title: "Job Postings",
        value: "5",
        description: "Active opportunities",
        icon: <FileText className="h-4 w-4 text-muted-foreground" />,
        trend: "up"
      },
      {
        title: "Resources",
        value: "12",
        description: "Published materials",
        icon: <BookOpen className="h-4 w-4 text-muted-foreground" />,
        trend: "up"
      },
      {
        title: "Revenue",
        value: "$1,250",
        description: "Platform revenue",
        icon: <CreditCard className="h-4 w-4 text-muted-foreground" />,
        trend: "up"
      }
    ];
    
    setStatsData(sampleStats);
    
    // Sample activity data
    const sampleActivity: ActivityData[] = [
      { id: 1, message: "New professional profile created by John Doe", time: "2 hours ago" },
      { id: 2, message: "TechCorp posted a new job: Learning Experience Designer", time: "5 hours ago" },
      { id: 3, message: "New resource published: 'The Future of Corporate Training'", time: "1 day ago" },
      { id: 4, message: "Sarah Johnson upgraded to Premium subscription", time: "1 day ago" },
      { id: 5, message: "New forum discussion started: 'Best practices for virtual learning'", time: "2 days ago" },
    ];
    
    setActivityData(sampleActivity);
  };

  // Process dashboard stats when they arrive
  useEffect(() => {
    if (dashboardStats) {
      // Type assertion to handle TypeScript error
      const stats = dashboardStats as DashboardStats;
      
      const newStatsData: StatData[] = [
        {
          title: "Total Users",
          value: stats.totalUsers.toString(),
          description: "Registered platform users",
          icon: <Users className="h-4 w-4 text-muted-foreground" />,
          trend: "up"
        },
        {
          title: "Professionals",
          value: stats.professionals.toString(),
          description: "Active L&D experts",
          icon: <Briefcase className="h-4 w-4 text-muted-foreground" />,
          trend: "up"
        },
        {
          title: "Companies",
          value: stats.companies.toString(),
          description: "Registered businesses",
          icon: <Building2 className="h-4 w-4 text-muted-foreground" />,
          trend: "up"
        },
        {
          title: "Job Postings",
          value: stats.jobPostings.toString(),
          description: "Active opportunities",
          icon: <FileText className="h-4 w-4 text-muted-foreground" />,
          trend: "up"
        },
        {
          title: "Resources",
          value: stats.resources.toString(),
          description: "Published materials",
          icon: <BookOpen className="h-4 w-4 text-muted-foreground" />,
          trend: "up"
        },
        {
          title: "Revenue",
          value: `$${stats.revenue.toLocaleString()}`,
          description: "Platform revenue",
          icon: <CreditCard className="h-4 w-4 text-muted-foreground" />,
          trend: "up"
        }
      ];
      
      setStatsData(newStatsData);
      
      // Format activity data
      if (stats.recentActivity) {
        const newActivityData: ActivityData[] = stats.recentActivity.map((activity: ActivityItem) => ({
          id: activity.id,
          message: activity.description,
          time: formatRelativeTime(activity.timestamp)
        }));
        
        setActivityData(newActivityData);
      }
    } else if (!isLoading) {
      // Initialize with sample data if no data is available and not loading
      initializeSampleData();
    }
  }, [dashboardStats, isLoading]);

  // Function to refresh stats
  const refreshStats = () => {
    refetch();
    toast({
      title: "Refreshing dashboard data",
      description: "Fetching the latest platform statistics",
    });
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