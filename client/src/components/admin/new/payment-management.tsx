import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { User, Consultation } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  Download,
  MoreHorizontal,
  RefreshCw,
  Search,
  X,
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  DollarSign,
  Receipt,
  ArrowUpDown,
  Clock,
  BarChart3,
  TrendingUp,
  TrendingDown,
  User as UserIcon,
  CalendarX,
  CheckSquare,
  CreditCard as CreditCardIcon
} from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, isSameMonth } from "date-fns";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Line, LineChart } from "recharts";

const subscriptionData = [
  { month: "Jan", active: 12, canceled: 2, new: 4 },
  { month: "Feb", active: 14, canceled: 1, new: 3 },
  { month: "Mar", active: 16, canceled: 3, new: 5 },
  { month: "Apr", active: 18, canceled: 2, new: 4 },
  { month: "May", active: 20, canceled: 1, new: 3 },
  { month: "Jun", active: 22, canceled: 2, new: 4 },
];

const revenueData = [
  { month: "Jan", subscriptions: 1200, consultations: 800, total: 2000 },
  { month: "Feb", subscriptions: 1300, consultations: 750, total: 2050 },
  { month: "Mar", subscriptions: 1400, consultations: 900, total: 2300 },
  { month: "Apr", subscriptions: 1500, consultations: 850, total: 2350 },
  { month: "May", subscriptions: 1600, consultations: 1000, total: 2600 },
  { month: "Jun", subscriptions: 1700, consultations: 1100, total: 2800 },
];

const paymentHistory = [
  {
    id: 'pi_123456',
    type: 'subscription',
    status: 'succeeded',
    amount: 49.99,
    date: '2025-03-15T10:24:00Z',
    userId: 1,
    description: 'Monthly professional subscription'
  },
  {
    id: 'pi_123457',
    type: 'subscription',
    status: 'succeeded',
    amount: 29.99,
    date: '2025-03-14T14:56:00Z',
    userId: 2,
    description: 'Monthly company basic subscription'
  },
  {
    id: 'pi_123458',
    type: 'consultation',
    status: 'succeeded',
    amount: 125.00,
    date: '2025-03-13T11:32:00Z',
    userId: 3,
    description: 'Consultation payment for 2-hour session'
  },
  {
    id: 'pi_123459',
    type: 'subscription',
    status: 'failed',
    amount: 49.99,
    date: '2025-03-12T09:15:00Z',
    userId: 4,
    description: 'Monthly professional subscription (failed)'
  },
  {
    id: 'pi_123460',
    type: 'consultation',
    status: 'refunded',
    amount: 75.00,
    date: '2025-03-10T15:45:00Z',
    userId: 5,
    description: 'Consultation payment refund'
  },
  {
    id: 'pi_123461',
    type: 'subscription',
    status: 'succeeded',
    amount: 99.99,
    date: '2025-03-09T08:30:00Z',
    userId: 6,
    description: 'Annual company premium subscription'
  },
];

// Simulated data - would be fetched from the server in a real application
const subscriptionPlans = [
  {
    id: 'basic_professional',
    name: 'Basic Professional',
    price: 29.99,
    interval: 'month',
    currency: 'usd',
    features: [
      'Profile visibility',
      'Apply to jobs',
      'Basic analytics'
    ],
    type: 'professional',
    active: true
  },
  {
    id: 'premium_professional',
    name: 'Premium Professional',
    price: 49.99,
    interval: 'month',
    currency: 'usd',
    features: [
      'Featured profile',
      'Priority applications',
      'Advanced analytics',
      'Unlimited resources'
    ],
    type: 'professional',
    active: true
  },
  {
    id: 'basic_company',
    name: 'Basic Company',
    price: 99.99,
    interval: 'month',
    currency: 'usd',
    features: [
      'Company profile',
      'Post up to 5 jobs',
      'Basic candidate search'
    ],
    type: 'company',
    active: true
  },
  {
    id: 'premium_company',
    name: 'Premium Company',
    price: 199.99,
    interval: 'month',
    currency: 'usd',
    features: [
      'Featured company profile',
      'Unlimited job postings',
      'Advanced candidate search',
      'Priority support'
    ],
    type: 'company',
    active: true
  }
];

export default function PaymentManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isViewPaymentDialogOpen, setIsViewPaymentDialogOpen] = useState(false);
  const [selectedSubscriptionPlan, setSelectedSubscriptionPlan] = useState<any>(null);
  const [isEditPlanDialogOpen, setIsEditPlanDialogOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Fetch users for additional info
  const { data: users = [] } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: getQueryFn<User[]>({ on401: "throw" }),
  });

  // Get user name by ID
  const getUserName = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : `User ${userId}`;
  };

  // Filter and sort payment history
  const filteredPayments = paymentHistory
    .filter(payment => 
      !searchQuery || 
      payment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getUserName(payment.userId).toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.status.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortColumn) return new Date(b.date).getTime() - new Date(a.date).getTime();
      
      switch (sortColumn) {
        case 'date':
          return sortDirection === 'asc' 
            ? new Date(a.date).getTime() - new Date(b.date).getTime()
            : new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'amount':
          return sortDirection === 'asc' 
            ? a.amount - b.amount
            : b.amount - a.amount;
        case 'status':
          return sortDirection === 'asc'
            ? a.status.localeCompare(b.status)
            : b.status.localeCompare(a.status);
        case 'type':
          return sortDirection === 'asc'
            ? a.type.localeCompare(b.type)
            : b.type.localeCompare(a.type);
        default:
          return 0;
      }
    });

  // Handle view payment details
  const handleViewPayment = (payment: any) => {
    setSelectedPayment(payment);
    setIsViewPaymentDialogOpen(true);
  };

  // Handle sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // Handle edit subscription plan
  const handleEditPlan = (plan: any) => {
    setSelectedSubscriptionPlan(plan);
    setIsEditPlanDialogOpen(true);
  };

  // Payment type badge
  const getPaymentTypeBadge = (type: string) => {
    switch (type) {
      case 'subscription':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <CreditCardIcon className="h-3 w-3 mr-1" /> Subscription
          </Badge>
        );
      case 'consultation':
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            <Calendar className="h-3 w-3 mr-1" /> Consultation
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <DollarSign className="h-3 w-3 mr-1" /> {type}
          </Badge>
        );
    }
  };

  // Payment status badge
  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'succeeded':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" /> Succeeded
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="h-3 w-3 mr-1" /> Failed
          </Badge>
        );
      case 'refunded':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <ArrowUpDown className="h-3 w-3 mr-1" /> Refunded
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            <Clock className="h-3 w-3 mr-1" /> Pending
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  // Calculate monthly stats
  const currentMonth = new Date();
  const previousMonth = subMonths(currentMonth, 1);

  const currentMonthPayments = paymentHistory.filter(payment => 
    isSameMonth(new Date(payment.date), currentMonth) && 
    payment.status === 'succeeded'
  );

  const previousMonthPayments = paymentHistory.filter(payment => 
    isSameMonth(new Date(payment.date), previousMonth) && 
    payment.status === 'succeeded'
  );

  const currentMonthRevenue = currentMonthPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const previousMonthRevenue = previousMonthPayments.reduce((sum, payment) => sum + payment.amount, 0);
  
  const revenueChange = previousMonthRevenue === 0 
    ? 100 
    : ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;

  const currentMonthSubscriptions = currentMonthPayments.filter(payment => payment.type === 'subscription');
  const previousMonthSubscriptions = previousMonthPayments.filter(payment => payment.type === 'subscription');
  
  const subscriptionChange = previousMonthSubscriptions.length === 0 
    ? 100 
    : ((currentMonthSubscriptions.length - previousMonthSubscriptions.length) / previousMonthSubscriptions.length) * 100;

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
          <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue (Current Month)
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${currentMonthRevenue.toFixed(2)}</div>
                <div className="flex items-center pt-1 text-xs text-muted-foreground">
                  {revenueChange >= 0 ? (
                    <>
                      <TrendingUp className="mr-1 h-3.5 w-3.5 text-green-500" />
                      <span className="text-green-500">+{revenueChange.toFixed(1)}%</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="mr-1 h-3.5 w-3.5 text-red-500" />
                      <span className="text-red-500">{revenueChange.toFixed(1)}%</span>
                    </>
                  )}
                  <span className="ml-1">vs last month</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Subscriptions
                </CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentMonthSubscriptions.length}</div>
                <div className="flex items-center pt-1 text-xs text-muted-foreground">
                  {subscriptionChange >= 0 ? (
                    <>
                      <TrendingUp className="mr-1 h-3.5 w-3.5 text-green-500" />
                      <span className="text-green-500">+{subscriptionChange.toFixed(1)}%</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="mr-1 h-3.5 w-3.5 text-red-500" />
                      <span className="text-red-500">{subscriptionChange.toFixed(1)}%</span>
                    </>
                  )}
                  <span className="ml-1">vs last month</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Recent Transactions
                </CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {paymentHistory.filter(p => {
                    const date = new Date(p.date);
                    const now = new Date();
                    const diffTime = Math.abs(now.getTime() - date.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays <= 7;
                  }).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  transactions in the last 7 days
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
                <CardDescription>
                  Monthly revenue by type
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`$${value}`, 'Revenue']}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Legend />
                    <Bar 
                      dataKey="subscriptions" 
                      name="Subscriptions" 
                      stackId="a" 
                      fill="#4f46e5" 
                    />
                    <Bar 
                      dataKey="consultations" 
                      name="Consultations" 
                      stackId="a" 
                      fill="#0ea5e9" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subscription Trend</CardTitle>
                <CardDescription>
                  Monthly subscription metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={subscriptionData}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="active" 
                      name="Active Subscriptions" 
                      stroke="#4f46e5" 
                      strokeWidth={2} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="new" 
                      name="New Subscriptions" 
                      stroke="#10b981" 
                      strokeWidth={2} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="canceled" 
                      name="Canceled" 
                      stroke="#f43f5e" 
                      strokeWidth={2} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                View all transactions across the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search payments by ID, user, or status..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // In a real app, this would refresh the payment data
                      toast({
                        title: "Data Refreshed",
                        description: "Payment history has been updated",
                      });
                    }}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // In a real app, this would download a CSV
                      toast({
                        title: "Export Started",
                        description: "Your payment data export is being prepared",
                      });
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px] cursor-pointer" onClick={() => handleSort('date')}>
                          <div className="flex items-center">
                            Date
                            {sortColumn === 'date' && (
                              <ArrowUpDown className="ml-1 h-3 w-3" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('type')}>
                          <div className="flex items-center">
                            Type
                            {sortColumn === 'type' && (
                              <ArrowUpDown className="ml-1 h-3 w-3" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead>User</TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('amount')}>
                          <div className="flex items-center">
                            Amount
                            {sortColumn === 'amount' && (
                              <ArrowUpDown className="ml-1 h-3 w-3" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                          <div className="flex items-center">
                            Status
                            {sortColumn === 'status' && (
                              <ArrowUpDown className="ml-1 h-3 w-3" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                            No payments found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPayments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell className="font-medium">
                              {format(new Date(payment.date), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {payment.id}
                            </TableCell>
                            <TableCell>
                              {getPaymentTypeBadge(payment.type)}
                            </TableCell>
                            <TableCell>{getUserName(payment.userId)}</TableCell>
                            <TableCell>${payment.amount.toFixed(2)}</TableCell>
                            <TableCell>
                              {getPaymentStatusBadge(payment.status)}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => handleViewPayment(payment)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  {payment.status === 'succeeded' && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        // In a real app, this would open a refund dialog
                                        toast({
                                          title: "Refund Initiated",
                                          description: `Refund for transaction ${payment.id} has been initiated`,
                                        });
                                      }}
                                    >
                                      <ArrowUpDown className="mr-2 h-4 w-4" />
                                      Issue Refund
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => {
                                    // In a real app, this would download a receipt
                                    toast({
                                      title: "Receipt Downloaded",
                                      description: `Receipt for transaction ${payment.id} has been downloaded`,
                                    });
                                  }}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download Receipt
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Plans Tab */}
        <TabsContent value="plans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Plans</CardTitle>
              <CardDescription>
                Manage platform subscription plans and pricing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {subscriptionPlans.map((plan) => (
                  <Card key={plan.id} className={plan.active ? "" : "opacity-60"}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle>{plan.name}</CardTitle>
                        <Badge variant={plan.type === 'professional' ? 'default' : 'secondary'}>
                          {plan.type}
                        </Badge>
                      </div>
                      <CardDescription>
                        ${plan.price}/{plan.interval}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {plan.features.map((feature, index) => (
                          <li key={index}>{feature}</li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // In a real app, this would toggle the plan's active status
                          toast({
                            title: plan.active ? "Plan Deactivated" : "Plan Activated",
                            description: `${plan.name} is now ${plan.active ? 'inactive' : 'active'}`,
                          });
                        }}
                      >
                        {plan.active ? (
                          <><CalendarX className="mr-2 h-4 w-4" /> Deactivate</>
                        ) : (
                          <><CheckSquare className="mr-2 h-4 w-4" /> Activate</>
                        )}
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleEditPlan(plan)}
                      >
                        <Edit className="mr-2 h-4 w-4" /> Edit Plan
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              
              <Button
                onClick={() => {
                  // In a real app, this would open a dialog to add a new plan
                  toast({
                    title: "Coming Soon",
                    description: "Adding new plans will be available soon",
                  });
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Add New Plan
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Payment Dialog */}
      <Dialog open={isViewPaymentDialogOpen} onOpenChange={setIsViewPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              Complete information about the transaction
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Transaction ID</Label>
                  <div className="font-mono text-sm mt-1">{selectedPayment.id}</div>
                </div>
                <div>
                  <Label>Date</Label>
                  <div className="text-sm mt-1">
                    {format(new Date(selectedPayment.date), 'MMM d, yyyy h:mm a')}
                  </div>
                </div>
                <div>
                  <Label>Type</Label>
                  <div className="mt-1">{getPaymentTypeBadge(selectedPayment.type)}</div>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">{getPaymentStatusBadge(selectedPayment.status)}</div>
                </div>
                <div>
                  <Label>Amount</Label>
                  <div className="text-sm font-medium mt-1">${selectedPayment.amount.toFixed(2)}</div>
                </div>
                <div>
                  <Label>User</Label>
                  <div className="text-sm mt-1">{getUserName(selectedPayment.userId)}</div>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <div className="text-sm mt-1 border rounded-md p-2 bg-muted/30">
                  {selectedPayment.description}
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                {selectedPayment.status === 'succeeded' && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      // In a real app, this would process a refund
                      toast({
                        title: "Refund Initiated",
                        description: `Refund for transaction ${selectedPayment.id} has been initiated`,
                      });
                      setIsViewPaymentDialogOpen(false);
                    }}
                  >
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    Issue Refund
                  </Button>
                )}
                <Button
                  onClick={() => {
                    // In a real app, this would download a receipt
                    toast({
                      title: "Receipt Downloaded",
                      description: `Receipt for transaction ${selectedPayment.id} has been downloaded`,
                    });
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Receipt
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Plan Dialog */}
      <Dialog open={isEditPlanDialogOpen} onOpenChange={setIsEditPlanDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Subscription Plan</DialogTitle>
            <DialogDescription>
              Update the plan details and pricing
            </DialogDescription>
          </DialogHeader>

          {selectedSubscriptionPlan && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="planName">Plan Name</Label>
                <Input
                  id="planName"
                  defaultValue={selectedSubscriptionPlan.name}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="planPrice">Price</Label>
                  <div className="flex items-center mt-1">
                    <span className="mr-1">$</span>
                    <Input
                      id="planPrice"
                      type="number"
                      step="0.01"
                      defaultValue={selectedSubscriptionPlan.price}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="planInterval">Billing Interval</Label>
                  <Select defaultValue={selectedSubscriptionPlan.interval}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Monthly</SelectItem>
                      <SelectItem value="year">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="planType">Plan Type</Label>
                <Select defaultValue={selectedSubscriptionPlan.type}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="planFeatures">Features (one per line)</Label>
                <Textarea
                  id="planFeatures"
                  className="mt-1 min-h-[100px]"
                  defaultValue={selectedSubscriptionPlan.features.join('\n')}
                />
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditPlanDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    toast({
                      title: "Plan Updated",
                      description: `${selectedSubscriptionPlan.name} has been updated successfully`,
                    });
                    setIsEditPlanDialogOpen(false);
                  }}
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}