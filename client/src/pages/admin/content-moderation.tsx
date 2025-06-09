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
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, AlertTriangle, FileText, Briefcase, Users, MessageSquare } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ContentItem {
  id: number;
  type: 'job_posting' | 'resource' | 'profile' | 'review';
  title: string;
  content: string;
  authorId: number;
  authorName: string;
  status: 'pending' | 'approved' | 'rejected';
  reportCount: number;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reason?: string;
}

interface ModerationStats {
  pending: number;
  approved: number;
  rejected: number;
  totalReports: number;
}

export default function ContentModeration() {
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [reviewReason, setReviewReason] = useState("");
  const { toast } = useToast();

  const { data: contentItems = [], isLoading, refetch } = useQuery<ContentItem[]>({
    queryKey: ["/api/admin/content", filterType, filterStatus, searchTerm],
  });

  const { data: stats } = useQuery<ModerationStats>({
    queryKey: ["/api/admin/moderation-stats"],
  });

  const approveContentMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason?: string }) => {
      const res = await apiRequest("POST", `/api/admin/content/${id}/approve`, { reason });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Content approved successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content"] });
      setSelectedItem(null);
      setReviewReason("");
    },
    onError: () => {
      toast({ title: "Failed to approve content", variant: "destructive" });
    }
  });

  const rejectContentMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const res = await apiRequest("POST", `/api/admin/content/${id}/reject`, { reason });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Content rejected successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content"] });
      setSelectedItem(null);
      setReviewReason("");
    },
    onError: () => {
      toast({ title: "Failed to reject content", variant: "destructive" });
    }
  });

  const filteredContent = contentItems.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.authorName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || item.type === filterType;
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="default">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending Review</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "job_posting":
        return <Briefcase className="h-4 w-4" />;
      case "resource":
        return <FileText className="h-4 w-4" />;
      case "profile":
        return <Users className="h-4 w-4" />;
      case "review":
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Content Moderation</h1>
          <p className="text-muted-foreground">Review and manage platform content</p>
        </div>
        <Button onClick={() => refetch()}>Refresh</Button>
      </div>

      {/* Moderation Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting moderation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.approved || 0}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.rejected || 0}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalReports || 0}</div>
            <p className="text-xs text-muted-foreground">User reports</p>
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
                placeholder="Search content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Content Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="job_posting">Job Postings</SelectItem>
                <SelectItem value="resource">Resources</SelectItem>
                <SelectItem value="profile">Profiles</SelectItem>
                <SelectItem value="review">Reviews</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content Table */}
      <Card>
        <CardHeader>
          <CardTitle>Content Items ({filteredContent.length})</CardTitle>
          <CardDescription>
            Review content submissions and user reports
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
                  <TableHead>Content</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reports</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContent.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="max-w-xs">
                        <div className="font-medium truncate">{item.title}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {item.content.substring(0, 100)}...
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.type)}
                        <Badge variant="outline">
                          {item.type.replace('_', ' ')}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{item.authorName}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      {item.reportCount > 0 ? (
                        <Badge variant="destructive">{item.reportCount}</Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedItem(item)}
                          >
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Review Content</DialogTitle>
                            <DialogDescription>
                              Moderate this {item.type.replace('_', ' ')} submission
                            </DialogDescription>
                          </DialogHeader>
                          {selectedItem && (
                            <div className="space-y-4">
                              <div>
                                <h3 className="font-medium mb-2">Content Details</h3>
                                <div className="bg-muted p-4 rounded-lg">
                                  <h4 className="font-medium">{selectedItem.title}</h4>
                                  <p className="text-sm text-muted-foreground mt-2">
                                    {selectedItem.content}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="font-medium">Author:</span> {selectedItem.authorName}
                                </div>
                                <div>
                                  <span className="font-medium">Reports:</span> {selectedItem.reportCount}
                                </div>
                                <div>
                                  <span className="font-medium">Created:</span> {new Date(selectedItem.createdAt).toLocaleDateString()}
                                </div>
                                <div>
                                  <span className="font-medium">Status:</span> {selectedItem.status}
                                </div>
                              </div>

                              <div>
                                <label className="text-sm font-medium">Review Notes (Optional)</label>
                                <Textarea
                                  placeholder="Add notes about your moderation decision..."
                                  value={reviewReason}
                                  onChange={(e) => setReviewReason(e.target.value)}
                                  className="mt-1"
                                />
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  onClick={() => approveContentMutation.mutate({
                                    id: selectedItem.id,
                                    reason: reviewReason
                                  })}
                                  disabled={approveContentMutation.isPending}
                                  className="flex-1"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Approve
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => rejectContentMutation.mutate({
                                    id: selectedItem.id,
                                    reason: reviewReason || "Content violates community guidelines"
                                  })}
                                  disabled={rejectContentMutation.isPending}
                                  className="flex-1"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          )}
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