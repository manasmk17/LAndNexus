import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Filter,
  Download,
  Eye,
  MoreHorizontal,
  ReceiptText,
  FileBarChart,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
  DollarSign,
  Clock,
  Calendar,
  BarChart3,
  ArrowUpRight,
  CalendarRange
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// Sample data for payments
const sampleTransactions = [
  {
    id: "TX-98765",
    userId: 1,
    userName: "John Smith",
    userType: "professional",
    type: "subscription",
    plan: "Premium",
    amount: 79.99,
    status: "completed",
    date: new Date("2023-03-01"),
    paymentMethod: "credit_card",
    lastFour: "4242",
    invoiceId: "INV-87654",
    description: "Premium plan - Monthly subscription"
  },
  {
    id: "TX-98764",
    userId: 2,
    userName: "TechCorp Innovations",
    userType: "company",
    type: "job_posting",
    amount: 199.99,
    status: "completed",
    date: new Date("2023-03-02"),
    paymentMethod: "credit_card",
    lastFour: "5555",
    invoiceId: "INV-87653",
    description: "Featured job posting - 30 days"
  },
  {
    id: "TX-98763",
    userId: 3,
    userName: "Sarah Johnson",
    userType: "professional",
    type: "subscription",
    plan: "Basic",
    amount: 29.99,
    status: "completed",
    date: new Date("2023-03-03"),
    paymentMethod: "paypal",
    invoiceId: "INV-87652",
    description: "Basic plan - Monthly subscription"
  },
  {
    id: "TX-98762",
    userId: 4,
    userName: "HealthPlus",
    userType: "company",
    type: "consultation",
    amount: 350.00,
    status: "pending",
    date: new Date("2023-03-04"),
    paymentMethod: "bank_transfer",
    invoiceId: "INV-87651",
    description: "2-hour training consultation"
  },
  {
    id: "TX-98761",
    userId: 5,
    userName: "Michael Rodriguez",
    userType: "professional",
    type: "resource_purchase",
    amount: 49.99,
    status: "completed",
    date: new Date("2023-03-05"),
    paymentMethod: "credit_card",
    lastFour: "1234",
    invoiceId: "INV-87650",
    description: "Training materials package - Leadership essentials"
  },
  {
    id: "TX-98760",
    userId: 6,
    userName: "Global Finance Group",
    userType: "company",
    type: "subscription",
    plan: "Enterprise",
    amount: 999.99,
    status: "failed",
    date: new Date("2023-03-06"),
    paymentMethod: "credit_card",
    lastFour: "9876",
    invoiceId: "INV-87649",
    description: "Enterprise plan - Annual subscription"
  },
  {
    id: "TX-98759",
    userId: 7,
    userName: "Emma Chen",
    userType: "professional",
    type: "profile_boost",
    amount: 59.99,
    status: "completed",
    date: new Date("2023-03-07"),
    paymentMethod: "credit_card",
    lastFour: "4321",
    invoiceId: "INV-87648",
    description: "Profile boost - 30 days featured"
  },
  {
    id: "TX-98758",
    userId: 8,
    userName: "EduLearn Solutions",
    userType: "company",
    type: "job_posting",
    amount: 149.99,
    status: "completed",
    date: new Date("2023-03-08"),
    paymentMethod: "paypal",
    invoiceId: "INV-87647",
    description: "Standard job posting - 14 days"
  }
];

// Sample data for payouts
const samplePayouts = [
  {
    id: "PO-12345",
    professionalId: 1,
    professionalName: "John Smith",
    amount: 450.00,
    status: "completed",
    date: new Date("2023-03-05"),
    method: "bank_transfer",
    bankLast4: "5678",
    invoiceId: "INV-PO-12345",
    serviceFee: 45.00,
    totalAmount: 495.00,
    description: "Consultation services - February 2023"
  },
  {
    id: "PO-12346",
    professionalId: 3,
    professionalName: "Sarah Johnson",
    amount: 275.00,
    status: "pending",
    date: new Date("2023-03-07"),
    method: "paypal",
    invoiceId: "INV-PO-12346",
    serviceFee: 27.50,
    totalAmount: 302.50,
    description: "Training workshop - March 2023"
  },
  {
    id: "PO-12347",
    professionalId: 5,
    professionalName: "Michael Rodriguez",
    amount: 620.00,
    status: "processing",
    date: new Date("2023-03-08"),
    method: "bank_transfer",
    bankLast4: "9012",
    invoiceId: "INV-PO-12347",
    serviceFee: 62.00,
    totalAmount: 682.00,
    description: "Course development - Q1 2023"
  },
  {
    id: "PO-12348",
    professionalId: 7,
    professionalName: "Emma Chen",
    amount: 880.00,
    status: "completed",
    date: new Date("2023-03-02"),
    method: "bank_transfer",
    bankLast4: "3456",
    invoiceId: "INV-PO-12348",
    serviceFee: 88.00,
    totalAmount: 968.00,
    description: "Executive coaching - February 2023"
  },
  {
    id: "PO-12349",
    professionalId: 9,
    professionalName: "David Wilson",
    amount: 345.00,
    status: "failed",
    date: new Date("2023-03-06"),
    method: "paypal",
    invoiceId: "INV-PO-12349",
    serviceFee: 34.50,
    totalAmount: 379.50,
    description: "Training materials - March 2023"
  },
  {
    id: "PO-12350",
    professionalId: 11,
    professionalName: "Olivia Martinez",
    amount: 590.00,
    status: "completed",
    date: new Date("2023-03-04"),
    method: "bank_transfer",
    bankLast4: "7890",
    invoiceId: "INV-PO-12350",
    serviceFee: 59.00,
    totalAmount: 649.00,
    description: "Workshop facilitation - February 2023"
  }
];

// Sample data for invoices
const sampleInvoices = [
  {
    id: "INV-87654",
    userId: 1,
    userName: "John Smith",
    userType: "professional",
    amount: 79.99,
    status: "paid",
    issueDate: new Date("2023-03-01"),
    dueDate: new Date("2023-03-15"),
    paidDate: new Date("2023-03-01"),
    items: [
      {
        description: "Premium plan - Monthly subscription",
        amount: 79.99,
        quantity: 1
      }
    ]
  },
  {
    id: "INV-87653",
    userId: 2,
    userName: "TechCorp Innovations",
    userType: "company",
    amount: 199.99,
    status: "paid",
    issueDate: new Date("2023-03-02"),
    dueDate: new Date("2023-03-16"),
    paidDate: new Date("2023-03-02"),
    items: [
      {
        description: "Featured job posting - 30 days",
        amount: 199.99,
        quantity: 1
      }
    ]
  },
  {
    id: "INV-PO-12345",
    userId: 1,
    userName: "John Smith",
    userType: "professional",
    amount: 450.00,
    status: "paid",
    issueDate: new Date("2023-03-05"),
    dueDate: new Date("2023-03-19"),
    paidDate: new Date("2023-03-05"),
    items: [
      {
        description: "Consultation services - February 2023",
        amount: 450.00,
        quantity: 1
      }
    ]
  },
  {
    id: "INV-87651",
    userId: 4,
    userName: "HealthPlus",
    userType: "company",
    amount: 350.00,
    status: "unpaid",
    issueDate: new Date("2023-03-04"),
    dueDate: new Date("2023-03-18"),
    items: [
      {
        description: "2-hour training consultation",
        amount: 350.00,
        quantity: 1
      }
    ]
  },
  {
    id: "INV-87649",
    userId: 6,
    userName: "Global Finance Group",
    userType: "company",
    amount: 999.99,
    status: "overdue",
    issueDate: new Date("2023-03-06"),
    dueDate: new Date("2023-03-13"),
    items: [
      {
        description: "Enterprise plan - Annual subscription",
        amount: 999.99,
        quantity: 1
      }
    ]
  },
  {
    id: "INV-PO-12347",
    userId: 5,
    userName: "Michael Rodriguez",
    userType: "professional",
    amount: 620.00,
    status: "processing",
    issueDate: new Date("2023-03-08"),
    dueDate: new Date("2023-03-22"),
    items: [
      {
        description: "Course development - Q1 2023",
        amount: 620.00,
        quantity: 1
      }
    ]
  }
];

// Main component
export default function PaymentManagement() {
  const [activeTab, setActiveTab] = useState("transactions");
  const [transactions, setTransactions] = useState(sampleTransactions);
  const [payouts, setPayouts] = useState(samplePayouts);
  const [invoices, setInvoices] = useState(sampleInvoices);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // Filter transactions based on search term
  const filteredTransactions = transactions.filter(transaction => {
    const searchFields = [
      transaction.id,
      transaction.userName,
      transaction.type,
      transaction.plan,
      transaction.status,
      transaction.description,
    ];
    
    return searchFields.some(field => 
      field?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Filter payouts based on search term
  const filteredPayouts = payouts.filter(payout => {
    const searchFields = [
      payout.id,
      payout.professionalName,
      payout.status,
      payout.method,
      payout.description,
    ];
    
    return searchFields.some(field => 
      field?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Filter invoices based on search term
  const filteredInvoices = invoices.filter(invoice => {
    const searchFields = [
      invoice.id,
      invoice.userName,
      invoice.status,
      invoice.items[0]?.description,
    ];
    
    return searchFields.some(field => 
      field?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Helper function to get transaction type badge style
  const getTransactionTypeColor = (type: string) => {
    switch(type) {
      case 'subscription':
        return 'bg-purple-100 text-purple-800';
      case 'job_posting':
        return 'bg-blue-100 text-blue-800';
      case 'consultation':
        return 'bg-amber-100 text-amber-800';
      case 'resource_purchase':
        return 'bg-emerald-100 text-emerald-800';
      case 'profile_boost':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to get status badge style
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed':
      case 'paid':
        return 'bg-emerald-100 text-emerald-800';
      case 'pending':
      case 'processing':
        return 'bg-amber-100 text-amber-800';
      case 'failed':
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'unpaid':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to get payment method icon
  const getPaymentMethodIcon = (method: string) => {
    switch(method) {
      case 'credit_card':
        return <CreditCard className="h-4 w-4 mr-2" />;
      case 'paypal':
        return <DollarSign className="h-4 w-4 mr-2" />;
      case 'bank_transfer':
        return <ArrowUpRight className="h-4 w-4 mr-2" />;
      default:
        return <DollarSign className="h-4 w-4 mr-2" />;
    }
  };

  // Helper function to get status icon
  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'completed':
      case 'paid':
        return <CheckCircle className="h-4 w-4 mr-2" />;
      case 'pending':
      case 'processing':
        return <Clock className="h-4 w-4 mr-2" />;
      case 'failed':
      case 'overdue':
        return <XCircle className="h-4 w-4 mr-2" />;
      case 'unpaid':
        return <AlertCircle className="h-4 w-4 mr-2" />;
      default:
        return <AlertCircle className="h-4 w-4 mr-2" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Payment Management</h2>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-1">
            <FileBarChart className="h-4 w-4" />
            <span className="hidden sm:inline">Generate Report</span>
          </Button>
          <Button variant="outline" className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>
      
      {/* Financial overview cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <ArrowUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$24,565.00</div>
            <p className="text-xs text-muted-foreground">
              +12.5% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payouts</CardTitle>
            <ArrowDown className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$3,160.00</div>
            <p className="text-xs text-muted-foreground">
              +8.2% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">245</div>
            <p className="text-xs text-muted-foreground">
              +18.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
            <CalendarRange className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              -3 from last month
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs for different payment sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full md:w-[500px]">
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span>Transactions</span>
          </TabsTrigger>
          <TabsTrigger value="payouts" className="flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4" />
            <span>Payouts</span>
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <ReceiptText className="h-4 w-4" />
            <span>Invoices</span>
          </TabsTrigger>
        </TabsList>
      
        {/* Search and filter area */}
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${activeTab}...`}
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-1">
                <Filter className="h-4 w-4" />
                <span>Filter</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter {activeTab}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {activeTab === "transactions" && (
                <>
                  <DropdownMenuItem>All Transactions</DropdownMenuItem>
                  <DropdownMenuItem>Subscriptions Only</DropdownMenuItem>
                  <DropdownMenuItem>Job Postings Only</DropdownMenuItem>
                  <DropdownMenuItem>Consultations Only</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Completed</DropdownMenuItem>
                  <DropdownMenuItem>Pending</DropdownMenuItem>
                  <DropdownMenuItem>Failed</DropdownMenuItem>
                </>
              )}
              {activeTab === "payouts" && (
                <>
                  <DropdownMenuItem>All Payouts</DropdownMenuItem>
                  <DropdownMenuItem>Completed</DropdownMenuItem>
                  <DropdownMenuItem>Pending</DropdownMenuItem>
                  <DropdownMenuItem>Failed</DropdownMenuItem>
                </>
              )}
              {activeTab === "invoices" && (
                <>
                  <DropdownMenuItem>All Invoices</DropdownMenuItem>
                  <DropdownMenuItem>Paid</DropdownMenuItem>
                  <DropdownMenuItem>Unpaid</DropdownMenuItem>
                  <DropdownMenuItem>Overdue</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      
        {/* Transactions Tab Content */}
        <TabsContent value="transactions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Transactions</CardTitle>
              <CardDescription>
                View all payment transactions on the platform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.id}</TableCell>
                      <TableCell>{transaction.userName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getTransactionTypeColor(transaction.type)}>
                          {transaction.type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">${transaction.amount.toFixed(2)}</TableCell>
                      <TableCell>{format(transaction.date, 'MMM d, yyyy')}</TableCell>
                      <TableCell className="capitalize">
                        <div className="flex items-center">
                          {getPaymentMethodIcon(transaction.paymentMethod)}
                          <span>{transaction.paymentMethod.replace('_', ' ')}</span>
                          {transaction.lastFour && <span className="ml-1 text-muted-foreground text-xs">×{transaction.lastFour}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(transaction.status)}>
                          <div className="flex items-center">
                            {getStatusIcon(transaction.status)}
                            <span>{transaction.status}</span>
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <ReceiptText className="h-4 w-4 mr-2" />
                              View Invoice
                            </DropdownMenuItem>
                            {transaction.status === 'pending' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Mark as Completed
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Mark as Failed
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Download Receipt
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                        No transactions found matching your search criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Payouts Tab Content */}
        <TabsContent value="payouts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Professional Payouts</CardTitle>
              <CardDescription>
                Manage payouts to learning and development professionals.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payout ID</TableHead>
                    <TableHead>Professional</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell className="font-medium">{payout.id}</TableCell>
                      <TableCell>{payout.professionalName}</TableCell>
                      <TableCell>${payout.amount.toFixed(2)}</TableCell>
                      <TableCell className="text-muted-foreground">${payout.serviceFee.toFixed(2)}</TableCell>
                      <TableCell className="font-semibold">${payout.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>{format(payout.date, 'MMM d, yyyy')}</TableCell>
                      <TableCell className="capitalize">
                        <div className="flex items-center">
                          {getPaymentMethodIcon(payout.method)}
                          <span>{payout.method.replace('_', ' ')}</span>
                          {payout.bankLast4 && <span className="ml-1 text-muted-foreground text-xs">×{payout.bankLast4}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(payout.status)}>
                          <div className="flex items-center">
                            {getStatusIcon(payout.status)}
                            <span>{payout.status}</span>
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <ReceiptText className="h-4 w-4 mr-2" />
                              View Invoice
                            </DropdownMenuItem>
                            {payout.status === 'pending' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Process Payout
                                </DropdownMenuItem>
                              </>
                            )}
                            {payout.status === 'processing' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Mark as Completed
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Mark as Failed
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Download Statement
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredPayouts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                        No payouts found matching your search criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Invoices Tab Content */}
        <TabsContent value="invoices" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>
                Manage invoices and billing documents.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.id}</TableCell>
                      <TableCell>{invoice.userName}</TableCell>
                      <TableCell className="capitalize">{invoice.userType}</TableCell>
                      <TableCell className="font-semibold">${invoice.amount.toFixed(2)}</TableCell>
                      <TableCell>{format(invoice.issueDate, 'MMM d, yyyy')}</TableCell>
                      <TableCell>{format(invoice.dueDate, 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(invoice.status)}>
                          <div className="flex items-center">
                            {getStatusIcon(invoice.status)}
                            <span>{invoice.status}</span>
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Invoice
                            </DropdownMenuItem>
                            {(invoice.status === 'unpaid' || invoice.status === 'overdue') && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Mark as Paid
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Download Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Calendar className="h-4 w-4 mr-2" />
                              Send Reminder
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredInvoices.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                        No invoices found matching your search criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}