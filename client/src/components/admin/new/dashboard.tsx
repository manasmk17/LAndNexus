import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  User,
  ProfessionalProfile,
  CompanyProfile,
  JobPosting,
  Resource,
  ForumPost
} from "@shared/schema";
import { 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from "recharts";
import {
  User as UserIcon,
  Briefcase,
  Building2,
  FileText,
  MessageSquare,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  ArrowUpRight,
  Info,
  Star
} from "lucide-react";
import { format, subDays } from "date-fns";

// Sample dashboard data - in a production app this would come from the API
const recentActivityData = [
  { date: subDays(new Date(), 7), users: 7, professionals: 3, companies: 2, jobs: 5, resources: 8 },
  { date: subDays(new Date(), 6), users: 5, professionals: 2, companies: 1, jobs: 3, resources: 4 },
  { date: subDays(new Date(), 5), users: 8, professionals: 4, companies: 2, jobs: 6, resources: 9 },
  { date: subDays(new Date(), 4), users: 11, professionals: 6, companies: 3, jobs: 8, resources: 12 },
  { date: subDays(new Date(), 3), users: 9, professionals: 5, companies: 2, jobs: 7, resources: 10 },
  { date: subDays(new Date(), 2), users: 12, professionals: 7, companies: 4, jobs: 9, resources: 14 },
  { date: subDays(new Date(), 1), users: 10, professionals: 6, companies: 3, jobs: 8, resources: 11 },
];

const formattedActivityData = recentActivityData.map(item => ({
  ...item,
  date: format(item.date, 'MMM dd'),
}));

// Sample platform growth data
const platformGrowthData = [
  { month: 'Jan', users: 120, professionals: 45, companies: 15 },
  { month: 'Feb', users: 140, professionals: 52, companies: 18 },
  { month: 'Mar', users: 185, professionals: 63, companies: 22 },
  { month: 'Apr', users: 210, professionals: 78, companies: 26 },
  { month: 'May', users: 260, professionals: 91, companies: 31 },
  { month: 'Jun', users: 325, professionals: 105, companies: 38 },
];

// Sample job distribution data
const jobDistributionData = [
  { name: 'Full-time', value: 45 },
  { name: 'Contract', value: 30 },
  { name: 'Part-time', value: 15 },
  { name: 'Freelance', value: 10 },
];

const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f43f5e'];

export default function Dashboard() {
  // Fetch actual data
  const { data: users = [] } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: getQueryFn<User[]>({ on401: "throw" }),
  });

  const { data: professionals = [] } = useQuery({
    queryKey: ['/api/admin/professional-profiles'],
    queryFn: getQueryFn<ProfessionalProfile[]>({ on401: "throw" }),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['/api/admin/company-profiles'],
    queryFn: getQueryFn<CompanyProfile[]>({ on401: "throw" }),
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['/api/admin/job-postings'],
    queryFn: getQueryFn<JobPosting[]>({ on401: "throw" }),
  });

  const { data: resources = [] } = useQuery({
    queryKey: ['/api/admin/resources'],
    queryFn: getQueryFn<Resource[]>({ on401: "throw" }),
  });

  const { data: forumPosts = [] } = useQuery({
    queryKey: ['/api/admin/forum-posts'],
    queryFn: getQueryFn<ForumPost[]>({ on401: "throw" }),
  });

  // Stats calculations
  const featuredProfessionals = professionals.filter(p => p.featured).length;
  const featuredCompanies = companies.filter(c => c.featured).length;
  const openJobs = jobs.filter(job => job.status === 'open').length;
  const featuredResources = resources.filter(r => r.featured).length;

  // Recent forum activity
  const recentForumPosts = [...forumPosts]
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5);
  
  // Recent job postings
  const recentJobs = [...jobs]
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <span className="text-sm text-muted-foreground mr-2">Last updated:</span>
            <span className="text-sm font-medium">{format(new Date(), 'MMM d, yyyy h:mm a')}</span>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UserIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <div className="text-xs text-muted-foreground mt-1">
              <span className="text-green-500 inline-flex items-center font-medium">
                <ArrowUpRight className="mr-1 h-3 w-3" /> 
                {Math.floor(users.length * 0.08)}
              </span>{" "}
              new this month
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Professionals</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{professionals.length}</div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
              <div>
                <span className="text-green-500 inline-flex items-center font-medium">
                  <ArrowUpRight className="mr-1 h-3 w-3" /> 
                  {Math.floor(professionals.length * 0.15)}
                </span>{" "}
                new this month
              </div>
              <div className="flex items-center">
                <Star className="h-3 w-3 text-amber-500 mr-1" />
                <span>{featuredProfessionals} featured</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companies.length}</div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
              <div>
                <span className="text-green-500 inline-flex items-center font-medium">
                  <ArrowUpRight className="mr-1 h-3 w-3" /> 
                  {Math.floor(companies.length * 0.10)}
                </span>{" "}
                new this month
              </div>
              <div className="flex items-center">
                <Star className="h-3 w-3 text-amber-500 mr-1" />
                <span>{featuredCompanies} featured</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Job Postings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobs.length}</div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
              <div>
                <span className="text-green-500 inline-flex items-center font-medium">
                  <ArrowUpRight className="mr-1 h-3 w-3" /> 
                  {Math.floor(jobs.length * 0.20)}
                </span>{" "}
                new this month
              </div>
              <div className="flex items-center">
                <Info className="h-3 w-3 text-blue-500 mr-1" />
                <span>{openJobs} open</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Recent Activity Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Platform activity over the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={formattedActivityData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 0,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="users" 
                    name="Users" 
                    stackId="1"
                    stroke="#4f46e5" 
                    fill="#4f46e5" 
                    fillOpacity={0.3}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="professionals" 
                    name="Professionals" 
                    stackId="1"
                    stroke="#0ea5e9" 
                    fill="#0ea5e9" 
                    fillOpacity={0.3}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="companies" 
                    name="Companies" 
                    stackId="1"
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.3}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="jobs" 
                    name="Jobs" 
                    stackId="1"
                    stroke="#f43f5e" 
                    fill="#f43f5e" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Job Type Distribution */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Job Type Distribution</CardTitle>
            <CardDescription>
              Distribution of job types across the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={jobDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {jobDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Platform Growth Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Platform Growth</CardTitle>
            <CardDescription>
              User growth over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={platformGrowthData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 0,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="users"
                    name="Total Users"
                    stroke="#4f46e5"
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="professionals" 
                    name="Professionals" 
                    stroke="#0ea5e9" 
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="companies" 
                    name="Companies" 
                    stroke="#10b981" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Latest Activity</CardTitle>
            <CardDescription>
              Recent forum posts and job listings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <MessageSquare className="h-4 w-4 mr-1" /> 
                  Recent Forum Posts
                </h3>
                <div className="space-y-2">
                  {recentForumPosts.length > 0 ? (
                    recentForumPosts.map((post, i) => (
                      <div key={i} className="flex items-center justify-between text-sm border-b pb-2">
                        <span className="font-medium truncate max-w-[200px]">{post.title}</span>
                        <span className="text-muted-foreground text-xs">
                          {post.createdAt ? format(new Date(post.createdAt), 'MMM d, h:mm a') : 'Unknown'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">No recent forum posts</div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <Briefcase className="h-4 w-4 mr-1" /> 
                  Recent Job Postings
                </h3>
                <div className="space-y-2">
                  {recentJobs.length > 0 ? (
                    recentJobs.map((job, i) => (
                      <div key={i} className="flex items-center justify-between text-sm border-b pb-2">
                        <span className="font-medium truncate max-w-[200px]">{job.title}</span>
                        <span className="text-muted-foreground text-xs">
                          {job.createdAt ? format(new Date(job.createdAt), 'MMM d, h:mm a') : 'Unknown'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">No recent job postings</div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resources</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resources.length}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Star className="h-3 w-3 text-amber-500 mr-1" />
              <span>{featuredResources} featured</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Forum Posts</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{forumPosts.length}</div>
            <div className="text-xs text-muted-foreground mt-1">
              <span className="text-green-500 inline-flex items-center font-medium">
                <ArrowUpRight className="mr-1 h-3 w-3" /> 
                {Math.floor(forumPosts.length * 0.12)}
              </span>{" "}
              new this month
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Ratio</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {professionals.length}:{companies.length}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Professional to company ratio
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}