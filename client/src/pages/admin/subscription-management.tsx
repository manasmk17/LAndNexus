import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, DollarSign, RefreshCw, AlertTriangle, TrendingUp, Calendar } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Subscription {
  id: number;
  userId: number;
  user: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  planName: string;
  status: string;
  stripeSubscriptionId: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  amount: number;
  currency: string;
  createdAt: string;
  lastPaymentDate: string | null;
  nextBillingDate: string;
}

interface RevenueMetrics {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  averageRevenuePerUser: number;
  churnRate: number;
  growthRate: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  cancelledSubscriptions: number;
}

export default function SubscriptionManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPlan, setFilterPlan] = useState("all");
  const { toast } = useToast();

  const { data: subscriptions = [], isLoading, refetch } = useQuery<Subscription[]>({
    queryKey: ["/api/admin/subscriptions", searchTerm, filterStatus, filterPlan],
  });

  const { data: metrics } = useQuery<RevenueMetrics>({
    queryKey: ["/api/admin/revenue-metrics"],
  });

  const { data: plans = [] } = useQuery<any[]>({
    queryKey: ["/api/subscription-plans"],
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: number) => {
      const res = await apiRequest("POST", `/api/admin/subscriptions/${subscriptionId}/cancel`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Subscription cancelled successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions"] });
    },
    onError: () => {
      toast({ title: "Failed to cancel subscription", variant: "destructive" });
    }
  });

  const refundPaymentMutation = useMutation({
    mutationFn: async ({ subscriptionId, amount }: { subscriptionId: number; amount: number }) => {
      const res = await apiRequest("POST", `/api/admin/subscriptions/${subscriptionId}/refund`, { amount });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Refund processed successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions"] });
    },
    onError: () => {
      toast({ title: "Failed to process refund", variant: "destructive" });
    }
  });

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = 
      sub.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.planName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || sub.status === filterStatus;
    const matchesPlan = filterPlan === "all" || sub.planName === filterPlan;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Active</Badge>;
      case "canceled":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "past_due":
        return <Badge variant="secondary">Past Due</Badge>;
      case "unpaid":
        return <Badge variant="destructive">Unpaid</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Subscription Management</h1>
          <p className="text-muted-foreground">Monitor subscriptions, revenue, and billing</p>
        </div>
        <Button onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics?.totalRevenue || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{metrics?.growthRate || 0}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics?.monthlyRecurringRevenue || 0}</div>
            <p className="text-xs text-muted-foreground">
              Monthly Recurring Revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeSubscriptions || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.churnRate || 0}% churn rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ARPU</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics?.averageRevenuePerUser || 0}</div>
            <p className="text-xs text-muted-foreground">
              Average Revenue Per User
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search by user or plan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="canceled">Cancelled</SelectItem>
                <SelectItem value="past_due">Past Due</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPlan} onValueChange={setFilterPlan}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                {plans.map(plan => (
                  <SelectItem key={plan.id} value={plan.name}>{plan.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Subscriptions ({filteredSubscriptions.length})</CardTitle>
          <CardDescription>
            Manage user subscriptions and billing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Next Billing</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {subscription.user.firstName} {subscription.user.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {subscription.user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{subscription.planName}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                    <TableCell>
                      <div className="font-medium">
                        ${(subscription.amount / 100).toFixed(2)} {subscription.currency.toUpperCase()}
                      </div>
                      {subscription.cancelAtPeriodEnd && (
                        <div className="text-xs text-destructive">
                          <AlertTriangle className="inline h-3 w-3 mr-1" />
                          Cancels at period end
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-3 w-3" />
                        {new Date(subscription.nextBillingDate).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">Manage</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Manage Subscription</DialogTitle>
                            <DialogDescription>
                              Administrative actions for {subscription.user.firstName} {subscription.user.lastName}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Plan:</span> {subscription.planName}
                              </div>
                              <div>
                                <span className="font-medium">Status:</span> {subscription.status}
                              </div>
                              <div>
                                <span className="font-medium">Started:</span> {new Date(subscription.createdAt).toLocaleDateString()}
                              </div>
                              <div>
                                <span className="font-medium">Period End:</span> {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="space-y-2">
                              {subscription.status === "active" && (
                                <Button
                                  variant="destructive"
                                  onClick={() => cancelSubscriptionMutation.mutate(subscription.id)}
                                  disabled={cancelSubscriptionMutation.isPending}
                                  className="w-full"
                                >
                                  Cancel Subscription
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                onClick={() => refundPaymentMutation.mutate({
                                  subscriptionId: subscription.id,
                                  amount: subscription.amount
                                })}
                                disabled={refundPaymentMutation.isPending}
                                className="w-full"
                              >
                                Process Refund
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}