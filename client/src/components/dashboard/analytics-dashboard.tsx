
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Briefcase, MessageSquare, Star, Eye, Clock, Target } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface AnalyticsData {
  profileViews: number;
  applicationsSent: number;
  messagesReceived: number;
  averageRating: number;
  responseRate: number;
  completionRate: number;
  monthlyEarnings: number;
  activeProjects: number;
}

export default function AnalyticsDashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockData: AnalyticsData = {
        profileViews: 156,
        applicationsSent: 8,
        messagesReceived: 23,
        averageRating: 4.8,
        responseRate: 95,
        completionRate: 88,
        monthlyEarnings: 4500,
        activeProjects: 3
      };
      
      setTimeout(() => {
        setAnalytics(mockData);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div>Unable to load analytics data</div>;
  }

  const getPerformanceColor = (value: number, threshold: number = 80) => {
    if (value >= threshold) return "text-green-600";
    if (value >= threshold * 0.7) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Performance Analytics</h2>
        <Badge variant="outline" className="text-sm">
          Last 30 days
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.profileViews}</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  +12% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Applications</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.applicationsSent}</div>
                <p className="text-xs text-muted-foreground">
                  Active applications sent
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Messages</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.messagesReceived}</div>
                <p className="text-xs text-muted-foreground">
                  New inquiries received
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rating</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.averageRating}</div>
                <p className="text-xs text-muted-foreground">
                  Average client rating
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Response Rate</CardTitle>
                <CardDescription>How quickly you respond to messages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Response Rate</span>
                    <span className={`text-sm font-medium ${getPerformanceColor(analytics.responseRate)}`}>
                      {analytics.responseRate}%
                    </span>
                  </div>
                  <Progress value={analytics.responseRate} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Industry average: 75%
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Completion</CardTitle>
                <CardDescription>Successfully completed projects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Completion Rate</span>
                    <span className={`text-sm font-medium ${getPerformanceColor(analytics.completionRate)}`}>
                      {analytics.completionRate}%
                    </span>
                  </div>
                  <Progress value={analytics.completionRate} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Industry average: 85%
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Earnings</CardTitle>
                <CardDescription>Revenue for current month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${analytics.monthlyEarnings.toLocaleString()}</div>
                <div className="flex items-center gap-2 mt-2">
                  <Target className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">On track for monthly goal</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Projects</CardTitle>
                <CardDescription>Currently ongoing work</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analytics.activeProjects}</div>
                <div className="flex items-center gap-2 mt-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-600">Optimal workload</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
