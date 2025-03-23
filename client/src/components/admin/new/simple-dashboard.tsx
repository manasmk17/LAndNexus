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

  // Use static stats for stability while testing
  const useStaticData = true;

  // For static demo data
  const staticStats: StatData[] = [
    {
      title: "Total Users",
      value: "348",
      description: "Registered platform users",
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
      trend: "up"
    },
    {
      title: "Professionals",
      value: "179",
      description: "Active L&D experts",
      icon: <Briefcase className="h-4 w-4 text-muted-foreground" />,
      trend: "up"
    },
    {
      title: "Companies",
      value: "169",
      description: "Registered businesses",
      icon: <Building2 className="h-4 w-4 text-muted-foreground" />,
      trend: "up"
    },
    {
      title: "Job Postings",
      value: "245",
      description: "Active opportunities",
      icon: <FileText className="h-4 w-4 text-muted-foreground" />,
      trend: "up"
    },
    {
      title: "Resources",
      value: "156",
      description: "Published materials",
      icon: <BookOpen className="h-4 w-4 text-muted-foreground" />,
      trend: "up"
    },
    {
      title: "Revenue",
      value: "$45,789",
      description: "Platform revenue",
      icon: <CreditCard className="h-4 w-4 text-muted-foreground" />,
      trend: "up"
    }
  ];

  // Init static data
  useEffect(() => {
    if (useStaticData) {
      // Use static data for demo purposes
      setStatsData(staticStats);
      setIsLoading(false);
    }
  }, []);

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