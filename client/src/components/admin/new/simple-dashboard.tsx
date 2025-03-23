import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  Briefcase,
  Building2,
  FileText,
  BookOpen,
  CreditCard,
  TrendingUp,
  Activity,
} from "lucide-react";

// Sample statistics for the admin dashboard
const stats = [
  {
    title: "Total Users",
    value: "348",
    description: "+12.5% from last month",
    icon: <Users className="h-4 w-4 text-muted-foreground" />,
    trend: "up"
  },
  {
    title: "Professionals",
    value: "179",
    description: "Active L&D experts",
    icon: <Briefcase className="h-4 w-4 text-muted-foreground" />,
    trend: "neutral"
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
    description: "Total platform revenue",
    icon: <CreditCard className="h-4 w-4 text-muted-foreground" />,
    trend: "up"
  }
];

// Recent activity entries
const recentActivity = [
  { id: 1, message: "New professional profile created by John Doe", time: "2 hours ago" },
  { id: 2, message: "TechCorp posted a new job: Learning Experience Designer", time: "5 hours ago" },
  { id: 3, message: "New resource published: 'The Future of Corporate Training'", time: "1 day ago" },
  { id: 4, message: "Sarah Johnson upgraded to Premium subscription", time: "1 day ago" },
  { id: 5, message: "New forum discussion started: 'Best practices for virtual learning'", time: "2 days ago" },
];

export default function SimpleDashboard() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
      
      {/* Stats overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                {stat.trend === "up" && (
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                )}
                <span>{stat.description}</span>
              </div>
            </CardContent>
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
            {recentActivity.map((activity) => (
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