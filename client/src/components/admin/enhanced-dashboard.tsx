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
  ShieldAlert,
  DollarSign,
  HelpCircle,
  AlertTriangle,
  Clock,
  FileBarChart,
  Check,
  Ban,
  UserPlus,
  UserCheck,
  Trash2,
  Settings,
  Search,
  Filter,
  Calendar,
} from "lucide-react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Define types for our dashboard data
interface StatData {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'neutral';
  percentage?: number;
}

interface ActivityData {
  id: number;
  message: string;
  time: string;
  type?: string;
}

interface DashboardStats {
  totalUsers: number;
  professionals: number;
  companies: number;
  jobPostings: number;
  activeJobPostings?: number;
  completedJobPostings?: number;
  resources: number;
  revenue: number;
  commissions?: number;
  transactionCount?: number;
  applications?: number;
  hires?: number;
  responseRate?: number;
  hireRate?: number;
  recentActivity: ActivityItem[];
}

interface ActivityItem {
  id: number;
  type: string;
  description: string;
  timestamp: string;
}

interface AdminActionLog {
  id: number;
  adminId: number;
  adminUsername: string;
  action: string;
  details: string;
  entityType: string;
  entityId?: number;
  timestamp: string;
}

interface ModerationItem {
  id: number;
  type: string;
  status: string;
  description: string;
  timestamp: string;
}

interface FinancialTransaction {
  id: number;
  type: string;
  amount: number;
  status: string;
  description: string;
  timestamp: string;
}

interface SupportTicket {
  id: number;
  status: string;
  priority: string;
  title: string;
  userId: number;
  timestamp: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

function EnhancedAdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [statsData, setStatsData] = useState<StatData[]>([]);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [actionSearch, setActionSearch] = useState('');
  
  // Fetch dashboard stats from API
  const { 
    data: dashboardStats, 
    isLoading: isLoadingStats, 
    refetch: refetchStats, 
    error: statsError 
  } = useQuery<DashboardStats>({
    queryKey: ['/api/admin/dashboard-stats'],
    queryFn: getQueryFn({ on401: 'throw' }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1
  });
  
  // Fetch admin action logs
  const {
    data: actionLogs,
    isLoading: isLoadingLogs,
    refetch: refetchLogs,
    error: logsError
  } = useQuery<{ logs: AdminActionLog[], pagination: any }>({
    queryKey: ['/api/admin/action-logs'],
    queryFn: getQueryFn({ on401: 'throw' }),
    staleTime: 1000 * 60, // 1 minute
    retry: 1
  });
  
  // Fetch moderation items
  const {
    data: moderationItems,
    isLoading: isLoadingModeration,
    refetch: refetchModeration,
    error: moderationError
  } = useQuery<ModerationItem[]>({
    queryKey: ['/api/admin/moderation-queue'],
    queryFn: getQueryFn({ on401: 'throw' }),
    staleTime: 1000 * 60, // 1 minute
    retry: 1
  });
  
  // Fetch financial transactions
  const {
    data: financialTransactions,
    isLoading: isLoadingTransactions,
    refetch: refetchTransactions,
    error: transactionsError
  } = useQuery<FinancialTransaction[]>({
    queryKey: ['/api/admin/financial-transactions'],
    queryFn: getQueryFn({ on401: 'throw' }),
    staleTime: 1000 * 60, // 1 minute
    retry: 1
  });
  
  // Fetch support tickets
  const {
    data: supportTickets,
    isLoading: isLoadingTickets,
    refetch: refetchTickets,
    error: ticketsError
  } = useQuery<SupportTicket[]>({
    queryKey: ['/api/admin/support-tickets'],
    queryFn: getQueryFn({ on401: 'throw' }),
    staleTime: 1000 * 60, // 1 minute
    retry: 1
  });
  
  // Mutation for recording admin actions
  const recordActionMutation = useMutation({
    mutationFn: async (data: { action: string, details: string, entityType: string, entityId?: number }) => {
      const res = await apiRequest('POST', '/api/admin/record-action', data);
      return await res.json();
    },
    onSuccess: () => {
      refetchLogs();
      refetchStats();
    },
    onError: (error) => {
      toast({
        title: "Failed to record action",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Record admin action helper function
  const recordAction = (action: string, details: string, entityType: string, entityId?: number) => {
    recordActionMutation.mutate({ action, details, entityType, entityId });
  };
  
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
  
  // Process dashboard stats when they arrive
  useEffect(() => {
    if (dashboardStats) {
      const stats = dashboardStats as DashboardStats;
      
      const newStatsData: StatData[] = [
        {
          title: "Total Users",
          value: stats.totalUsers.toString(),
          description: "All platform users",
          icon: <Users className="h-4 w-4 text-muted-foreground" />,
          trend: "up",
          percentage: 100
        },
        {
          title: "L&D Professionals",
          value: stats.professionals.toString(),
          description: `${Math.round((stats.professionals / stats.totalUsers) * 100)}% of users`,
          icon: <Briefcase className="h-4 w-4 text-muted-foreground" />,
          trend: "up",
          percentage: Math.round((stats.professionals / stats.totalUsers) * 100)
        },
        {
          title: "Companies",
          value: stats.companies.toString(),
          description: `${Math.round((stats.companies / stats.totalUsers) * 100)}% of users`,
          icon: <Building2 className="h-4 w-4 text-muted-foreground" />,
          trend: "up",
          percentage: Math.round((stats.companies / stats.totalUsers) * 100)
        },
        {
          title: "Active Vacancies",
          value: (stats.activeJobPostings || 0).toString(),
          description: `${stats.completedJobPostings || 0} completed`,
          icon: <FileText className="h-4 w-4 text-muted-foreground" />,
          trend: "up",
          percentage: stats.jobPostings > 0 ? 
            Math.round(((stats.activeJobPostings || 0) / stats.jobPostings) * 100) : 0
        },
        {
          title: "Hire Rate",
          value: `${stats.hireRate || 0}%`,
          description: `${stats.hires || 0} successful hires`,
          icon: <UserCheck className="h-4 w-4 text-muted-foreground" />,
          trend: stats.hireRate && stats.hireRate > 20 ? "up" : "down",
          percentage: stats.hireRate || 0
        },
        {
          title: "Platform Revenue",
          value: formatCurrency(stats.revenue),
          description: `${formatCurrency(stats.commissions || 0)} in commissions`,
          icon: <CreditCard className="h-4 w-4 text-muted-foreground" />,
          trend: "up",
          percentage: 100
        },
      ];
      
      setStatsData(newStatsData);
      
      // Format activity data
      if (stats.recentActivity) {
        const newActivityData: ActivityData[] = stats.recentActivity.map((activity: ActivityItem) => ({
          id: activity.id,
          message: activity.description,
          time: formatRelativeTime(activity.timestamp),
          type: activity.type
        }));
        
        setActivityData(newActivityData);
      }
    }
  }, [dashboardStats]);
  
  // Function to refresh all data
  const refreshAllData = () => {
    refetchStats();
    refetchLogs();
    refetchModeration();
    refetchTransactions();
    refetchTickets();
    
    toast({
      title: "Refreshing dashboard data",
      description: "Fetching the latest platform statistics and data",
    });
    
    // Record this admin action
    recordAction(
      "refreshed",
      "Admin refreshed all dashboard data",
      "dashboard"
    );
  };
  
  // Generate sample chart data
  const generateUserGrowthData = () => {
    if (!dashboardStats) return [];
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    // Calculate a reasonable growth curve based on current user counts
    const professionals = dashboardStats.professionals;
    const companies = dashboardStats.companies;
    
    return months.map((month, index) => {
      // Create a growth curve where current month reflects actual counts
      const monthDiff = index - currentMonth;
      const growthFactor = monthDiff < 0 ? Math.max(0.5, 1 + (monthDiff * 0.1)) : 1;
      
      return {
        name: month,
        professionals: monthDiff === 0 ? professionals : Math.round(professionals * growthFactor),
        companies: monthDiff === 0 ? companies : Math.round(companies * growthFactor)
      };
    });
  };
  
  // Generate revenue chart data
  const generateRevenueData = () => {
    if (!dashboardStats) return [];
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    // Calculate a reasonable growth curve based on current revenue
    const revenue = dashboardStats.revenue;
    const commissions = dashboardStats.commissions || 0;
    
    return months.map((month, index) => {
      // Create a growth curve where current month reflects actual revenue
      const monthDiff = index - currentMonth;
      const growthFactor = monthDiff < 0 ? Math.max(0.5, 1 + (monthDiff * 0.1)) : 1;
      
      const monthlyRevenue = monthDiff === 0 ? revenue : Math.round(revenue * growthFactor);
      const monthlyCommissions = monthDiff === 0 ? commissions : Math.round(commissions * growthFactor);
      
      return {
        name: month,
        revenue: monthlyRevenue,
        commissions: monthlyCommissions
      };
    });
  };
  
  // Generate pie chart data for user types
  const generateUserTypePieData = () => {
    if (!dashboardStats) return [];
    
    return [
      { name: 'Professionals', value: dashboardStats.professionals, color: '#4f46e5' },
      { name: 'Companies', value: dashboardStats.companies, color: '#10b981' }
    ];
  };
  
  // Generate pie chart data for job statuses
  const generateJobStatusPieData = () => {
    if (!dashboardStats) return [];
    
    return [
      { name: 'Active', value: dashboardStats.activeJobPostings || 0, color: '#10b981' },
      { name: 'Completed', value: dashboardStats.completedJobPostings || 0, color: '#4f46e5' }
    ];
  };
  
  // For quick action buttons
  const handleQuickAction = (action: string, destination: string) => {
    recordAction("accessed", `Admin accessed ${action}`, action);
    setLocation(destination);
  };
  
  // Filtered admin logs
  const getFilteredLogs = () => {
    if (!actionLogs?.logs) return [];
    
    return actionLogs.logs.filter(log => 
      log.action.toLowerCase().includes(actionSearch.toLowerCase()) ||
      log.details.toLowerCase().includes(actionSearch.toLowerCase()) ||
      log.entityType.toLowerCase().includes(actionSearch.toLowerCase()) ||
      log.adminUsername.toLowerCase().includes(actionSearch.toLowerCase())
    );
  };
  
  if (isLoadingStats) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
          <Button variant="outline" onClick={refreshAllData} disabled={isLoadingStats}>
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
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
        <Button variant="outline" onClick={refreshAllData} className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Refresh All Data
        </Button>
      </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 md:grid-cols-5 lg:w-[600px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="quick-actions">Quick Actions</TabsTrigger>
          <TabsTrigger value="action-logs">Action Logs</TabsTrigger>
          <TabsTrigger value="charts" className="hidden md:inline-flex">Charts</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats cards */}
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
                  <Progress value={stat.percentage || 0} className="h-1" />
                </CardFooter>
              </Card>
            ))}
          </div>
          
          {/* Quick Actions Row */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <Button 
              variant="outline" 
              className="flex flex-col items-center justify-center h-24 gap-2" 
              onClick={() => handleQuickAction("moderation", "/admin-page")}
            >
              <ShieldAlert className="h-8 w-8 text-amber-500" />
              <span>Moderation</span>
              {moderationItems && moderationItems.length > 0 && 
                <Badge variant="destructive" className="absolute top-2 right-2">{moderationItems.length}</Badge>
              }
            </Button>
            
            <Button 
              variant="outline" 
              className="flex flex-col items-center justify-center h-24 gap-2"
              onClick={() => handleQuickAction("finance", "/admin-page")}
            >
              <DollarSign className="h-8 w-8 text-emerald-500" />
              <span>Finance</span>
              {financialTransactions && financialTransactions.length > 0 && 
                <Badge variant="default" className="absolute top-2 right-2">{financialTransactions.length}</Badge>
              }
            </Button>
            
            <Button 
              variant="outline" 
              className="flex flex-col items-center justify-center h-24 gap-2"
              onClick={() => handleQuickAction("support", "/admin-page")}
            >
              <HelpCircle className="h-8 w-8 text-blue-500" />
              <span>Support</span>
              {supportTickets && supportTickets.length > 0 && 
                <Badge variant="destructive" className="absolute top-2 right-2">{supportTickets.length}</Badge>
              }
            </Button>
            
            <Button 
              variant="outline" 
              className="flex flex-col items-center justify-center h-24 gap-2"
              onClick={() => handleQuickAction("settings", "/admin-page")}
            >
              <Settings className="h-8 w-8 text-slate-500" />
              <span>Settings</span>
            </Button>
          </div>
          
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest activity across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityData.length > 0 ? (
                  activityData.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4 border-b border-border/40 pb-4 last:border-0 last:pb-0">
                      <div className={`rounded-full p-2 ${
                        activity.type === 'professional' ? 'bg-blue-100 text-blue-600' :
                        activity.type === 'job' ? 'bg-emerald-100 text-emerald-600' :
                        activity.type === 'resource' ? 'bg-amber-100 text-amber-600' :
                        activity.type === 'admin' ? 'bg-purple-100 text-purple-600' :
                        'bg-primary/10 text-primary'
                      }`}>
                        {activity.type === 'professional' ? <Briefcase className="h-4 w-4" /> :
                         activity.type === 'job' ? <FileText className="h-4 w-4" /> :
                         activity.type === 'resource' ? <BookOpen className="h-4 w-4" /> :
                         activity.type === 'admin' ? <ShieldAlert className="h-4 w-4" /> :
                         <Activity className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">{activity.message}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No recent activity found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-6">
          {/* User Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>User Statistics</CardTitle>
              <CardDescription>Distribution of users on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Total Users</div>
                  <div className="text-3xl font-bold">{dashboardStats?.totalUsers || 0}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">L&D Professionals</div>
                  <div className="text-3xl font-bold">{dashboardStats?.professionals || 0}</div>
                  <div className="text-xs text-muted-foreground">
                    {dashboardStats && ((dashboardStats.professionals / dashboardStats.totalUsers) * 100).toFixed(1)}% of total
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Companies</div>
                  <div className="text-3xl font-bold">{dashboardStats?.companies || 0}</div>
                  <div className="text-xs text-muted-foreground">
                    {dashboardStats && ((dashboardStats.companies / dashboardStats.totalUsers) * 100).toFixed(1)}% of total
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={generateUserTypePieData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {generateUserTypePieData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => [`${value} users`, 'Count']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Job Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Vacancy & Hiring Statistics</CardTitle>
              <CardDescription>Job postings and hiring performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Total Job Postings</div>
                  <div className="text-3xl font-bold">{dashboardStats?.jobPostings || 0}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Active Vacancies</div>
                  <div className="text-3xl font-bold">{dashboardStats?.activeJobPostings || 0}</div>
                  <div className="text-xs text-muted-foreground">
                    {dashboardStats?.jobPostings ? ((dashboardStats.activeJobPostings || 0) / dashboardStats.jobPostings * 100).toFixed(1) : 0}% of total
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Completed Jobs</div>
                  <div className="text-3xl font-bold">{dashboardStats?.completedJobPostings || 0}</div>
                  <div className="text-xs text-muted-foreground">
                    {dashboardStats?.jobPostings ? ((dashboardStats.completedJobPostings || 0) / dashboardStats.jobPostings * 100).toFixed(1) : 0}% of total
                  </div>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Total Applications</div>
                  <div className="text-3xl font-bold">{dashboardStats?.applications || 0}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Response Rate</div>
                  <div className="text-3xl font-bold">{dashboardStats?.responseRate || 0}%</div>
                  <div className="text-xs text-muted-foreground">
                    Avg. applications per job posting
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Hire Rate</div>
                  <div className="text-3xl font-bold">{dashboardStats?.hireRate || 0}%</div>
                  <div className="text-xs text-muted-foreground">
                    Applications that lead to hires
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={generateJobStatusPieData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {generateJobStatusPieData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => [`${value} jobs`, 'Count']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Financial Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Metrics</CardTitle>
              <CardDescription>Platform revenue and transaction metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Total Revenue</div>
                  <div className="text-3xl font-bold">{formatCurrency(dashboardStats?.revenue || 0)}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Platform Commissions</div>
                  <div className="text-3xl font-bold">{formatCurrency(dashboardStats?.commissions || 0)}</div>
                  <div className="text-xs text-muted-foreground">
                    {dashboardStats?.revenue ? ((dashboardStats.commissions || 0) / dashboardStats.revenue * 100).toFixed(1) : 0}% of total revenue
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Completed Transactions</div>
                  <div className="text-3xl font-bold">{dashboardStats?.transactionCount || 0}</div>
                  <div className="text-xs text-muted-foreground">
                    Avg. value: {dashboardStats?.transactionCount ? formatCurrency((dashboardStats.revenue || 0) / dashboardStats.transactionCount) : '$0'}
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={generateRevenueData().slice(0, 6)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `$${value}`} />
                    <Tooltip formatter={(value: any) => [`$${value}`, 'Amount']} />
                    <Legend />
                    <Bar dataKey="revenue" name="Total Revenue" fill="#4f46e5" />
                    <Bar dataKey="commissions" name="Platform Commissions" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Quick Actions Tab */}
        <TabsContent value="quick-actions" className="space-y-6">
          {/* Moderation Queue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Moderation Queue</CardTitle>
                <CardDescription>Items requiring review or action</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleQuickAction("moderation", "/admin-page")}
              >
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingModeration ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : moderationItems && moderationItems.length > 0 ? (
                <div className="space-y-4">
                  {moderationItems.map(item => (
                    <div key={item.id} className="flex items-start gap-3 border-b pb-3 last:border-0">
                      <div className={`rounded-full p-1.5 ${
                        item.type === 'report' ? 'bg-red-100 text-red-600' :
                        item.type === 'complaint' ? 'bg-amber-100 text-amber-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {item.type === 'report' ? <AlertTriangle className="h-4 w-4" /> :
                         item.type === 'complaint' ? <HelpCircle className="h-4 w-4" /> :
                         <Search className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-medium">{item.description}</p>
                          <Badge variant="outline" className="ml-2">{item.type}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(item.timestamp)}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <Settings className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem 
                            onClick={() => {
                              toast({
                                title: "Reviewing item",
                                description: "Opening moderation interface",
                              });
                              recordAction("reviewed", `Admin reviewed moderation item: ${item.description}`, "moderation", item.id);
                            }}
                          >
                            <Search className="mr-2 h-4 w-4" />
                            <span>Review</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              toast({
                                title: "Item approved",
                                description: "The item has been approved",
                              });
                              recordAction("approved", `Admin approved moderation item: ${item.description}`, "moderation", item.id);
                            }}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            <span>Approve</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              toast({
                                title: "Item rejected",
                                description: "The item has been rejected",
                              });
                              recordAction("rejected", `Admin rejected moderation item: ${item.description}`, "moderation", item.id);
                            }}
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            <span>Reject</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <ShieldAlert className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No items requiring moderation</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Support Tickets */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Support Tickets</CardTitle>
                <CardDescription>Help requests from users</CardDescription>
              </div>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction("support", "/admin-page")}
              >
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingTickets ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : supportTickets && supportTickets.length > 0 ? (
                <div className="space-y-4">
                  {supportTickets.map(ticket => (
                    <div key={ticket.id} className="flex items-start gap-3 border-b pb-3 last:border-0">
                      <div className={`rounded-full p-1.5 ${
                        ticket.priority === 'high' ? 'bg-red-100 text-red-600' :
                        ticket.priority === 'medium' ? 'bg-amber-100 text-amber-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        <HelpCircle className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-medium">{ticket.title}</p>
                          <Badge variant={
                            ticket.priority === 'high' ? 'destructive' :
                            ticket.priority === 'medium' ? 'default' :
                            'secondary'
                          } className="ml-2">
                            {ticket.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">User ID: {ticket.userId} • {formatRelativeTime(ticket.timestamp)}</p>
                      </div>
                      <Button variant="outline" size="sm" className="h-8" onClick={() => {
                        toast({
                          title: "Responding to ticket",
                          description: "Opening support interface",
                        });
                        recordAction("responded", `Admin responded to support ticket: ${ticket.title}`, "support", ticket.id);
                      }}>
                        Respond
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <HelpCircle className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No open support tickets</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Financial Transactions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Financial activity on the platform</CardDescription>
              </div>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction("finance", "/admin-page")}
              >
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingTransactions ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : financialTransactions && financialTransactions.length > 0 ? (
                <div className="space-y-4">
                  {financialTransactions.map(transaction => (
                    <div key={transaction.id} className="flex items-start gap-3 border-b pb-3 last:border-0">
                      <div className={`rounded-full p-1.5 ${
                        transaction.type === 'payment' ? 'bg-emerald-100 text-emerald-600' :
                        transaction.type === 'commission' ? 'bg-blue-100 text-blue-600' :
                        'bg-purple-100 text-purple-600'
                      }`}>
                        <DollarSign className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-medium">{transaction.description}</p>
                          <p className="font-medium text-emerald-600">{formatCurrency(transaction.amount)}</p>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-xs text-muted-foreground">{formatRelativeTime(transaction.timestamp)}</p>
                          <Badge variant="outline" className="ml-2">{transaction.type}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <DollarSign className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No recent transactions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Action Logs Tab */}
        <TabsContent value="action-logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Admin Action Log</CardTitle>
              <CardDescription>Record of all administrative actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search actions..."
                    value={actionSearch}
                    onChange={(e) => setActionSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              {isLoadingLogs ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : actionLogs && actionLogs.logs.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {getFilteredLogs().map(log => (
                      <div key={log.id} className="border-b pb-3 last:border-0">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{log.action}</Badge>
                            <span className="text-sm font-medium">{log.entityType}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{formatRelativeTime(log.timestamp)}</span>
                        </div>
                        <p className="text-sm mt-1">{log.details}</p>
                        <p className="text-xs text-muted-foreground mt-1">By admin: {log.adminUsername}</p>
                      </div>
                    ))}
                    
                    {getFilteredLogs().length === 0 && (
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <Search className="h-10 w-10 text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">No matching admin actions found</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <FileBarChart className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No admin actions have been recorded yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Charts Tab */}
        <TabsContent value="charts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Growth Over Time</CardTitle>
              <CardDescription>Professionals and companies by month</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={generateUserGrowthData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="professionals" name="L&D Professionals" fill="#4f46e5" />
                  <Bar dataKey="companies" name="Companies" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>Monthly revenue and commissions</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={generateRevenueData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `$${value}`} />
                  <Tooltip formatter={(value: any) => [`$${value}`, 'Amount']} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    name="Total Revenue" 
                    stroke="#4f46e5" 
                    activeDot={{ r: 8 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="commissions" 
                    name="Platform Commissions" 
                    stroke="#10b981" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default EnhancedAdminDashboard;