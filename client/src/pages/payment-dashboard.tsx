import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation, formatCurrency, formatDate } from "@/lib/i18n";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react";

interface EscrowTransaction {
  id: number;
  companyId: number;
  trainerId: number;
  amount: number;
  currency: string;
  platformCommissionAmount: number;
  trainerPayoutAmount: number;
  status: string;
  description: string;
  createdAt: string;
  escrowReleaseDate: string;
  serviceCompletionConfirmed: boolean;
}

interface TransactionHistory {
  id: number;
  action: string;
  previousStatus: string;
  newStatus: string;
  actionReason: string;
  createdAt: string;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4" />;
    case 'in_escrow':
      return <DollarSign className="h-4 w-4" />;
    case 'released':
      return <CheckCircle className="h-4 w-4" />;
    case 'refunded':
      return <XCircle className="h-4 w-4" />;
    case 'disputed':
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return <RefreshCw className="h-4 w-4" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'in_escrow':
      return 'bg-blue-100 text-blue-800';
    case 'released':
      return 'bg-green-100 text-green-800';
    case 'refunded':
      return 'bg-red-100 text-red-800';
    case 'disputed':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function PaymentDashboard() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedTransaction, setSelectedTransaction] = useState<EscrowTransaction | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const { data: transactions, isLoading } = useQuery<EscrowTransaction[]>({
    queryKey: ["/api/payments/transactions"],
  });

  const { data: transactionDetails } = useQuery<{
    transaction: EscrowTransaction;
    history: TransactionHistory[];
  }>({
    queryKey: ["/api/payments/transactions", selectedTransaction?.id],
    enabled: !!selectedTransaction,
  });

  const handleReleaseFunds = async (transactionId: number) => {
    try {
      const response = await apiRequest("POST", `/api/payments/release-funds/${transactionId}`, {
        reason: "Service completed successfully"
      });
      
      if (response.ok) {
        toast({
          title: t("payment.success"),
          description: t("payment.fundsReleased"),
        });
        queryClient.invalidateQueries({ queryKey: ["/api/payments/transactions"] });
      }
    } catch (error) {
      toast({
        title: t("payment.error"),
        description: t("payment.releaseError"),
        variant: "destructive",
      });
    }
  };

  const handleRequestRefund = async (transactionId: number) => {
    try {
      const response = await apiRequest("POST", `/api/payments/request-refund/${transactionId}`, {
        reason: "Service not delivered as expected"
      });
      
      if (response.ok) {
        toast({
          title: t("payment.success"),
          description: t("payment.refundRequested"),
        });
        queryClient.invalidateQueries({ queryKey: ["/api/payments/transactions"] });
      }
    } catch (error) {
      toast({
        title: t("payment.error"),
        description: t("payment.refundError"),
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const completedTransactions = transactions?.filter(t => t.status === 'released') || [];
  const activeTransactions = transactions?.filter(t => ['pending', 'in_escrow'].includes(t.status)) || [];
  const totalEarnings = completedTransactions.reduce((sum, t) => sum + t.trainerPayoutAmount, 0);
  const pendingAmount = activeTransactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t("payment.dashboard")}</h1>
        <Button
          onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/payments/transactions"] })}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {t("common.refresh")}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("payment.totalEarnings")}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalEarnings / 100)}
            </div>
            <p className="text-xs text-muted-foreground">
              {completedTransactions.length} {t("payment.completedTransactions")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("payment.pendingAmount")}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(pendingAmount / 100)}
            </div>
            <p className="text-xs text-muted-foreground">
              {activeTransactions.length} {t("payment.activeTransactions")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("payment.totalTransactions")}</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions?.length || 0}</div>
            <p className="text-xs text-muted-foreground">{t("payment.allTime")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">{t("payment.allTransactions")}</TabsTrigger>
          <TabsTrigger value="active">{t("payment.active")}</TabsTrigger>
          <TabsTrigger value="completed">{t("payment.completed")}</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {transactions?.map((transaction) => (
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
              onViewDetails={() => {
                setSelectedTransaction(transaction);
                setShowDetails(true);
              }}
              onReleaseFunds={handleReleaseFunds}
              onRequestRefund={handleRequestRefund}
            />
          ))}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {activeTransactions.map((transaction) => (
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
              onViewDetails={() => {
                setSelectedTransaction(transaction);
                setShowDetails(true);
              }}
              onReleaseFunds={handleReleaseFunds}
              onRequestRefund={handleRequestRefund}
            />
          ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedTransactions.map((transaction) => (
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
              onViewDetails={() => {
                setSelectedTransaction(transaction);
                setShowDetails(true);
              }}
              onReleaseFunds={handleReleaseFunds}
              onRequestRefund={handleRequestRefund}
            />
          ))}
        </TabsContent>
      </Tabs>

      {/* Transaction Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("payment.transactionDetails")}</DialogTitle>
            <DialogDescription>
              {t("payment.transactionId")}: {selectedTransaction?.id}
            </DialogDescription>
          </DialogHeader>
          
          {transactionDetails && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">{t("payment.amount")}</h4>
                  <p className="text-2xl font-bold">
                    {formatCurrency(transactionDetails.transaction.amount / 100)}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">{t("payment.status")}</h4>
                  <Badge className={getStatusColor(transactionDetails.transaction.status)}>
                    {getStatusIcon(transactionDetails.transaction.status)}
                    <span className="ml-1">{t(`payment.status.${transactionDetails.transaction.status}`)}</span>
                  </Badge>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">{t("payment.paymentBreakdown")}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{t("payment.totalAmount")}:</span>
                    <span>{formatCurrency(transactionDetails.transaction.amount / 100)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("payment.platformFee")}:</span>
                    <span>-{formatCurrency(transactionDetails.transaction.platformCommissionAmount / 100)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>{t("payment.trainerPayout")}:</span>
                    <span>{formatCurrency(transactionDetails.transaction.trainerPayoutAmount / 100)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">{t("payment.transactionHistory")}</h4>
                <div className="space-y-2">
                  {transactionDetails.history.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm border-l-2 border-gray-200 pl-3">
                      <div>
                        <p className="font-medium">{t(`payment.action.${item.action}`)}</p>
                        {item.actionReason && (
                          <p className="text-gray-600">{item.actionReason}</p>
                        )}
                      </div>
                      <div className="text-gray-500">
                        {formatDate(item.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface TransactionCardProps {
  transaction: EscrowTransaction;
  onViewDetails: () => void;
  onReleaseFunds: (id: number) => void;
  onRequestRefund: (id: number) => void;
}

function TransactionCard({ transaction, onViewDetails, onReleaseFunds, onRequestRefund }: TransactionCardProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              {formatCurrency(transaction.amount / 100)}
            </CardTitle>
            <CardDescription>{transaction.description || t("payment.noDescription")}</CardDescription>
          </div>
          <Badge className={getStatusColor(transaction.status)}>
            {getStatusIcon(transaction.status)}
            <span className="ml-1">{t(`payment.status.${transaction.status}`)}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <p>{t("payment.created")}: {formatDate(transaction.createdAt)}</p>
            {transaction.escrowReleaseDate && (
              <p>{t("payment.autoRelease")}: {formatDate(transaction.escrowReleaseDate)}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onViewDetails}>
              {t("common.viewDetails")}
            </Button>
            {transaction.status === 'in_escrow' && (
              <>
                <Button size="sm" onClick={() => onReleaseFunds(transaction.id)}>
                  {t("payment.releaseFunds")}
                </Button>
                <Button variant="destructive" size="sm" onClick={() => onRequestRefund(transaction.id)}>
                  {t("payment.requestRefund")}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}