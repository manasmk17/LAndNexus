import { useState } from "react";
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
  TrendingDown,
  Activity,
  UserCheck,
  AlertCircle,
} from "lucide-react";
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

// Sample data for admin dashboard
const userStats = {
  total: 348,
  growth: 12.5,
  professionals: 179,
  companies: 169,
  activeToday: 87,
  newThisWeek: 24,
};

const platformStats = {
  jobPostings: 245,
  applications: 1324,
  consultations: 79,
  resources: 156,
  forumPosts: 342,
  revenue: 45789,
};

const monthlyUsersData = [
  { name: 'Jan', professionals: 33, companies: 28 },
  { name: 'Feb', professionals: 35, companies: 30 },
  { name: 'Mar', professionals: 39, companies: 32 },
  { name: 'Apr', professionals: 45, companies: 35 },
  { name: 'May', professionals: 48, companies: 37 },
  { name: 'Jun', professionals: 52, companies: 39 },
  { name: 'Jul', professionals: 55, companies: 42 },
  { name: 'Aug', professionals: 58, companies: 44 },
  { name: 'Sep', professionals: 62, companies: 46 },
  { name: 'Oct', professionals: 68, companies: 50 },
  { name: 'Nov', professionals: 72, companies: 53 },
  { name: 'Dec', professionals: 79, companies: 59 },
];

const userTypeData = [
  { name: 'Professionals', value: userStats.professionals },
  { name: 'Companies', value: userStats.companies },
];

const COLORS = ['#4f46e5', '#10b981'];

const activityData = [
  { name: 'Mon', activity: 45 },
  { name: 'Tue', activity: 52 },
  { name: 'Wed', activity: 49 },
  { name: 'Thu', activity: 58 },
  { name: 'Fri', activity: 65 },
  { name: 'Sat', activity: 42 },
  { name: 'Sun', activity: 37 },
];

const recentAlerts = [
  { id: 1, message: 'New high-traffic resource published', level: 'info', time: '2 hours ago' },
  { id: 2, message: 'Payment processing issue detected', level: 'error', time: '5 hours ago' },
  { id: 3, message: 'Unusual login activity detected', level: 'warning', time: '1 day ago' },
  { id: 4, message: 'Database backup completed successfully', level: 'success', time: '1 day ago' },
];

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState('month');

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
      
      {/* Stats overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.total}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {userStats.growth > 0 ? (
                <TrendingUp className="mr-1 h-3 w-3 text-emerald-500" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3 text-rose-500" />
              )}
              <span className={userStats.growth > 0 ? 'text-emerald-500' : 'text-rose-500'}>
                {userStats.growth}%
              </span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{platformStats.jobPostings}</div>
            <p className="text-xs text-muted-foreground">
              {platformStats.applications} applications submitted
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resources</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{platformStats.resources}</div>
            <p className="text-xs text-muted-foreground">
              Across all categories
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${platformStats.revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From subscriptions and transactions
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>
              Monthly acquisition of professionals and companies
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyUsersData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value} users`, undefined]}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend />
                <Bar dataKey="professionals" fill="#4f46e5" name="Professionals" />
                <Bar dataKey="companies" fill="#10b981" name="Companies" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
            <CardDescription>
              Breakdown of user types
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {userTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} users`, undefined]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Platform Activity</CardTitle>
            <CardDescription>
              Daily active users and interactions
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="activity" 
                  stroke="#4f46e5" 
                  activeDot={{ r: 8 }} 
                  name="User Activity"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>System Alerts</CardTitle>
            <CardDescription>
              Recent notifications and warnings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start space-x-2">
                  {alert.level === 'info' && <Activity className="h-5 w-5 text-blue-500" />}
                  {alert.level === 'success' && <UserCheck className="h-5 w-5 text-emerald-500" />}
                  {alert.level === 'warning' && <AlertCircle className="h-5 w-5 text-amber-500" />}
                  {alert.level === 'error' && <AlertCircle className="h-5 w-5 text-rose-500" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
    </div>
  );
}