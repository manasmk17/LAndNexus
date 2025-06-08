import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  MoreHorizontal,
  Loader2,
  Star,
  Eye,
  Pencil,
  Trash2,
  Search,
  X,
  BookOpen,
  FileText,
  Link as LinkIcon,
} from "lucide-react";
import { format } from "date-fns";
import { Resource, ResourceCategory } from "@shared/schema";

export default function ResourcesManagement() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Resource | null>(null);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [showResourceDetailDialog, setShowResourceDetailDialog] = useState(false);

  // Fetch all resources
  const { data: resources, isLoading, error } = useQuery<Resource[]>({
    queryKey: ["/api/admin/resources"],
    retry: 1,
  });

  // Fetch resource categories for filtering and display
  const { data: categories } = useQuery<ResourceCategory[]>({
    queryKey: ["/api/resource-categories"],
    retry: 1,
  });

  // Filter resources based on search query
  const filteredResources = resources?.filter(
    (resource) =>
      resource.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle featured status
  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({
      resourceId,
      featured,
    }: {
      resourceId: number;
      featured: boolean;
    }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/admin/resources/${resourceId}/featured`,
        { featured }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resources"] });
      toast({
        title: "Resource Updated",
        description: "Featured status has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update featured status",
        variant: "destructive",
      });
    },
  });

  // Delete resource
  const deleteResourceMutation = useMutation({
    mutationFn: async (resourceId: number) => {
      const response = await apiRequest("DELETE", `/api/admin/resources/${resourceId}`);
      if (!response.ok) {
        throw new Error("Failed to delete resource");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resources"] });
      setConfirmDelete(null);
      toast({
        title: "Resource Deleted",
        description: "Resource has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete resource",
        variant: "destructive",
      });
    },
  });

  // Helper function to format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (error) {
      return "Invalid date";
    }
  };

  // Helper function to get category name by ID
  const getCategoryName = (categoryId: number | null | undefined) => {
    if (!categoryId || !categories) return "Uncategorized";
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.name : "Uncategorized";
  };

  // Helper function to get resource type badge
  const getResourceTypeBadge = (type: string | undefined) => {
    switch (type?.toLowerCase()) {
      case "article":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Article</Badge>;
      case "video":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Video</Badge>;
      case "course":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Course</Badge>;
      case "ebook":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">E-Book</Badge>;
      case "template":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Template</Badge>;
      case "tool":
        return <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">Tool</Badge>;
      default:
        return <Badge variant="outline">Other</Badge>;
    }
  };

  // Helper function to get resource icon by type
  const getResourceIcon = (type: string | undefined) => {
    switch (type?.toLowerCase()) {
      case "article":
        return <FileText className="h-5 w-5 text-blue-500" />;
      case "video":
        return <BookOpen className="h-5 w-5 text-red-500" />;
      case "course":
        return <BookOpen className="h-5 w-5 text-green-500" />;
      case "ebook":
        return <FileText className="h-5 w-5 text-purple-500" />;
      case "template":
        return <FileText className="h-5 w-5 text-amber-500" />;
      case "tool":
        return <LinkIcon className="h-5 w-5 text-cyan-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  if (error) {
    return (
      <div className="p-8 text-center">
        <X className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-xl font-semibold text-red-700">Error Loading Resources</h3>
        <p className="text-muted-foreground mt-2">
          {error instanceof Error ? error.message : "Failed to load resources data"}
        </p>
        <Button
          className="mt-4"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/resources"] })}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Resources Management</h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search resources..."
            className="w-[250px] pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-9 w-9"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResources?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No resources found
                  </TableCell>
                </TableRow>
              ) : (
                filteredResources?.map((resource) => (
                  <TableRow key={resource.id}>
                    <TableCell>{resource.id}</TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate" title={resource.title || ""}>
                      <div className="flex items-center">
                        {getResourceIcon(resource.type)}
                        <span className="ml-2">{resource.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getResourceTypeBadge(resource.type)}</TableCell>
                    <TableCell>{getCategoryName(resource.categoryId)}</TableCell>
                    <TableCell>{formatDate(resource.createdAt)}</TableCell>
                    <TableCell>
                      <Switch
                        checked={!!resource.featured}
                        onCheckedChange={() =>
                          toggleFeaturedMutation.mutate({
                            resourceId: resource.id,
                            featured: !resource.featured,
                          })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => navigate(`/resource-detail/${resource.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Resource
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedResource(resource);
                            setShowResourceDetailDialog(true);
                          }}>
                            <BookOpen className="mr-2 h-4 w-4" />
                            Quick View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/edit-resource/${resource.id}`)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Resource
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              toggleFeaturedMutation.mutate({
                                resourceId: resource.id,
                                featured: !resource.featured,
                              })
                            }
                          >
                            <Star className="mr-2 h-4 w-4" />
                            {resource.featured ? "Unfeature Resource" : "Feature Resource"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => setConfirmDelete(resource)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Resource
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Resource Detail Dialog */}
          {selectedResource && (
            <Dialog open={showResourceDetailDialog} onOpenChange={setShowResourceDetailDialog}>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>{selectedResource.title}</DialogTitle>
                  <DialogDescription>
                    Created {formatDate(selectedResource.createdAt)} • {getResourceTypeBadge(selectedResource.type)}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Category</Label>
                      <div className="mt-1">{getCategoryName(selectedResource.categoryId)}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Author</Label>
                      <div className="mt-1">ID: {selectedResource.authorId || "Unknown"}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Featured</Label>
                      <div className="mt-1">{selectedResource.featured ? "Yes" : "No"}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Views</Label>
                      <div className="mt-1">{selectedResource.views || 0}</div>
                    </div>
                  </div>
                  
                  {selectedResource.url && (
                    <div>
                      <Label className="text-sm font-medium">URL</Label>
                      <div className="mt-1">
                        <a 
                          href={selectedResource.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center"
                        >
                          <LinkIcon className="h-3.5 w-3.5 mr-1" />
                          {selectedResource.url}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <div className="mt-1 text-sm border rounded-md p-3 bg-muted/30 max-h-[200px] overflow-y-auto">
                      {selectedResource.description || "No description provided."}
                    </div>
                  </div>
                  
                  {selectedResource.content && (
                    <div>
                      <Label className="text-sm font-medium">Content Preview</Label>
                      <div className="mt-1 text-sm border rounded-md p-3 bg-muted/30 max-h-[200px] overflow-y-auto">
                        {selectedResource.content.length > 500 
                          ? `${selectedResource.content.substring(0, 500)}...` 
                          : selectedResource.content}
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter className="sm:justify-between">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        toggleFeaturedMutation.mutate({
                          resourceId: selectedResource.id,
                          featured: !selectedResource.featured,
                        })
                      }
                      disabled={toggleFeaturedMutation.isPending}
                    >
                      {toggleFeaturedMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Star className="mr-2 h-4 w-4" />
                      )}
                      {selectedResource.featured ? "Unfeature" : "Feature"}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setConfirmDelete(selectedResource);
                        setShowResourceDetailDialog(false);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowResourceDetailDialog(false)}
                  >
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Delete Confirmation Dialog */}
          {confirmDelete && (
            <Dialog
              open={!!confirmDelete}
              onOpenChange={(open) => !open && setConfirmDelete(null)}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Resource</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete "{confirmDelete.title}"?
                    This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setConfirmDelete(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => deleteResourceMutation.mutate(confirmDelete.id)}
                    disabled={deleteResourceMutation.isPending}
                  >
                    {deleteResourceMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Delete Resource
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </>
      )}
    </div>
  );
}