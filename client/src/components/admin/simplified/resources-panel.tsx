import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
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
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Resource, ResourceCategory } from "@shared/schema";
import { Edit, Trash, Eye, FileText, ExternalLink, Star, Search } from "lucide-react";

export default function ResourcesPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch all resources and categories
  const { data: resources = [], isLoading } = useQuery({
    queryKey: ['/api/admin/resources'],
    queryFn: getQueryFn<Resource[]>({ on401: "throw" }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/resource-categories'],
    queryFn: getQueryFn<ResourceCategory[]>({ on401: "returnNull" }),
  });

  // Get category names by ID
  const getCategoryName = (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : "Unknown";
  };

  // Apply filters
  const filteredResources = resources.filter(resource => {
    const matchesSearch = searchQuery === "" || 
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      resource.summary?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || resource.categoryId === parseInt(categoryFilter);
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "approved" && resource.status === "approved") ||
      (statusFilter === "pending" && resource.status === "pending") ||
      (statusFilter === "rejected" && resource.status === "rejected");
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleViewDetails = (resource: Resource) => {
    setSelectedResource(resource);
    setShowDetailsDialog(true);
  };

  const handleEdit = (resource: Resource) => {
    setSelectedResource({...resource});
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!selectedResource) return;
    
    try {
      await apiRequest("PATCH", `/api/admin/resources/${selectedResource.id}`, selectedResource);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/resources'] });
      toast({
        title: "Resource Updated",
        description: `"${selectedResource.title}" has been updated.`,
      });
      setShowDialog(false);
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update resource",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this resource? This action cannot be undone.")) return;
    
    try {
      await apiRequest("DELETE", `/api/admin/resources/${id}`);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/resources'] });
      toast({
        title: "Resource Deleted",
        description: "The resource has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete resource",
        variant: "destructive",
      });
    }
  };

  const updateResourceStatus = async (resource: Resource, status: string) => {
    try {
      await apiRequest("PATCH", `/api/admin/resources/${resource.id}`, {
        ...resource,
        status
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/resources'] });
      toast({
        title: "Status Updated",
        description: `Resource "${resource.title}" is now ${status}.`,
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update resource status",
        variant: "destructive",
      });
    }
  };

  const toggleFeatured = async (resource: Resource) => {
    try {
      await apiRequest("PATCH", `/api/admin/resources/${resource.id}`, {
        ...resource,
        featured: !resource.featured
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/resources'] });
      toast({
        title: resource.featured ? "Removed from Featured" : "Added to Featured",
        description: `"${resource.title}" is ${resource.featured ? "no longer" : "now"} featured.`,
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update featured status",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  // Get badge variant based on status
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return "outline" as const;
      case 'pending':
        return "secondary" as const;
      case 'rejected':
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold">Resources Management</CardTitle>
        <CardDescription>
          View and manage learning resources on the platform
        </CardDescription>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => {
              setSearchQuery("");
              setCategoryFilter("all");
              setStatusFilter("all");
            }}>
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableCaption>List of {filteredResources.length} resources</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Featured</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResources.map((resource) => (
                  <TableRow key={resource.id}>
                    <TableCell className="font-medium">{resource.title}</TableCell>
                    <TableCell>{getCategoryName(resource.categoryId)}</TableCell>
                    <TableCell>
                      {resource.authorName || `User #${resource.authorId}`}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getStatusBadgeVariant(resource.status)}>
                        {resource.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch 
                        checked={resource.featured || false} 
                        onCheckedChange={() => toggleFeatured(resource)}
                        aria-label="Toggle featured status"
                      />
                    </TableCell>
                    <TableCell>{formatDate(resource.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleViewDetails(resource)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(resource)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(resource.id)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredResources.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No resources found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Edit Resource Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
            <DialogDescription>
              Update resource details
            </DialogDescription>
          </DialogHeader>
          
          {selectedResource && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input
                  id="title"
                  value={selectedResource.title}
                  onChange={(e) => setSelectedResource({...selectedResource, title: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="categoryId" className="text-right">
                  Category
                </Label>
                <Select 
                  value={selectedResource.categoryId.toString()} 
                  onValueChange={(value) => setSelectedResource({
                    ...selectedResource, 
                    categoryId: parseInt(value)
                  })}
                >
                  <SelectTrigger id="categoryId" className="col-span-3">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="summary" className="text-right pt-2">
                  Summary
                </Label>
                <Textarea
                  id="summary"
                  value={selectedResource.summary || ""}
                  onChange={(e) => setSelectedResource({...selectedResource, summary: e.target.value})}
                  className="col-span-3"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="url" className="text-right">
                  URL
                </Label>
                <Input
                  id="url"
                  type="url"
                  value={selectedResource.url || ""}
                  onChange={(e) => setSelectedResource({...selectedResource, url: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select 
                  value={selectedResource.status} 
                  onValueChange={(value) => setSelectedResource({...selectedResource, status: value})}
                >
                  <SelectTrigger id="status" className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="featured" className="text-right">
                  Featured
                </Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Switch
                    id="featured"
                    checked={selectedResource.featured || false}
                    onCheckedChange={(checked) => setSelectedResource({...selectedResource, featured: checked})}
                  />
                  <Label htmlFor="featured" className="cursor-pointer">
                    {selectedResource.featured ? "Yes" : "No"}
                  </Label>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resource Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Resource Details</DialogTitle>
            <DialogDescription>
              Complete information about the resource
            </DialogDescription>
          </DialogHeader>
          
          {selectedResource && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3 space-y-4">
                  <div className="aspect-square rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden">
                    {selectedResource.image ? (
                      <img 
                        src={selectedResource.image} 
                        alt={selectedResource.title}
                        className="object-cover w-full h-full" 
                      />
                    ) : (
                      <FileText className="h-16 w-16 text-gray-400" />
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant={getStatusBadgeVariant(selectedResource.status)}>
                        {selectedResource.status}
                      </Badge>
                      {selectedResource.featured && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          Featured
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-lg">{selectedResource.title}</h3>
                    <div className="flex items-center text-muted-foreground text-sm">
                      <span className="mr-1">Category:</span>
                      <Badge variant="outline">{getCategoryName(selectedResource.categoryId)}</Badge>
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-3">
                    <h4 className="font-medium mb-2">Resource Information</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Author:</span> {selectedResource.authorName || `User #${selectedResource.authorId}`}</p>
                      <p><span className="font-medium">Created:</span> {formatDate(selectedResource.createdAt)}</p>
                      {selectedResource.updatedAt && (
                        <p><span className="font-medium">Last Updated:</span> {formatDate(selectedResource.updatedAt)}</p>
                      )}
                      {selectedResource.views && (
                        <p><span className="font-medium">Views:</span> {selectedResource.views}</p>
                      )}
                      {selectedResource.downloads && (
                        <p><span className="font-medium">Downloads:</span> {selectedResource.downloads}</p>
                      )}
                    </div>
                  </div>

                  {selectedResource.url && (
                    <div className="border rounded-md p-3">
                      <h4 className="font-medium mb-2">Resource Link</h4>
                      <a 
                        href={selectedResource.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary flex items-center text-sm hover:underline"
                      >
                        {selectedResource.url.replace(/^https?:\/\//, '')}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                  )}
                </div>
                
                <div className="md:w-2/3 space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Summary</h3>
                    <p className="text-muted-foreground whitespace-pre-line">
                      {selectedResource.summary || "No summary provided."}
                    </p>
                  </div>
                  
                  {selectedResource.content && (
                    <div>
                      <h3 className="font-semibold mb-2">Content</h3>
                      <div className="border rounded-md p-4 max-h-80 overflow-y-auto">
                        <div className="prose prose-sm max-w-none">
                          <div dangerouslySetInnerHTML={{ __html: selectedResource.content }} />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {selectedResource.tags && selectedResource.tags.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedResource.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="border-t pt-4 flex justify-between">
                <Button variant="outline" onClick={() => handleEdit(selectedResource)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Resource
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant={selectedResource.featured ? "outline" : "default"} 
                    onClick={() => {
                      toggleFeatured(selectedResource);
                      setShowDetailsDialog(false);
                    }}
                  >
                    {selectedResource.featured ? "Remove from Featured" : "Feature Resource"}
                  </Button>
                  {selectedResource.status !== "approved" && (
                    <Button 
                      variant="default" 
                      onClick={() => {
                        updateResourceStatus(selectedResource, "approved");
                        setShowDetailsDialog(false);
                      }}
                    >
                      Approve Resource
                    </Button>
                  )}
                  {selectedResource.status !== "rejected" && (
                    <Button 
                      variant="destructive" 
                      onClick={() => {
                        updateResourceStatus(selectedResource, "rejected");
                        setShowDetailsDialog(false);
                      }}
                    >
                      Reject Resource
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}