import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PageContent } from "@shared/schema";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Trash2, Edit, Plus, Eye } from "lucide-react";
import { ConfirmDialog } from "../../components/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ContentManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<PageContent | null>(null);
  const [previewContent, setPreviewContent] = useState<PageContent | null>(null);
  const [deleteContentId, setDeleteContentId] = useState<number | null>(null);
  
  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");

  const resetForm = () => {
    setTitle("");
    setSlug("");
    setContent("");
  };

  // Fetch all page contents
  const {
    data: pageContents,
    isLoading,
    isError,
    error,
  } = useQuery<PageContent[]>({
    queryKey: ["/api/page-contents"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/page-contents");
      const data = await res.json();
      return data;
    },
  });

  // Create new page content
  const createMutation = useMutation({
    mutationFn: async (newContent: { title: string; slug: string; content: string }) => {
      const res = await apiRequest("POST", "/api/page-contents", newContent);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Page created",
        description: "The page has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/page-contents"] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast({
        title: "Failed to create page",
        description: err.message || "An error occurred while creating the page",
        variant: "destructive",
      });
    },
  });

  // Update existing page content
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: { title: string; slug: string; content: string };
    }) => {
      const res = await apiRequest("PUT", `/api/page-contents/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Page updated",
        description: "The page has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/page-contents"] });
      setIsEditDialogOpen(false);
      setEditingContent(null);
    },
    onError: (err: any) => {
      toast({
        title: "Failed to update page",
        description: err.message || "An error occurred while updating the page",
        variant: "destructive",
      });
    },
  });

  // Delete page content
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      console.log(`Frontend: Attempting to delete page content with ID: ${id}`);
      
      try {
        const response = await apiRequest("DELETE", `/api/page-contents/${id}`);
        console.log(`Delete response status: ${response.status}`);
        
        if (response.status === 200) {
          const result = await response.json();
          console.log("Delete success response:", result);
          return result;
        } else if (response.status === 204) {
          // Handle 204 No Content response (success with no body)
          console.log("Delete success with no content");
          return { message: "Page deleted successfully" };
        } else {
          console.error(`Unexpected success status code: ${response.status}`);
          return { message: "Unknown response from server" };
        }
      } catch (error) {
        console.error("Delete request error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Delete mutation succeeded:", data);
      toast({
        title: "Page deleted",
        description: data.message || "The page has been deleted successfully",
      });
      
      // Force immediate refetch the data with both invalidate and refetch
      console.log("Forcing refetch of page content data");
      queryClient.invalidateQueries({ queryKey: ["/api/page-contents"] });
      queryClient.refetchQueries({ queryKey: ["/api/page-contents"] });
      
      // Clear UI state
      setIsDeleteDialogOpen(false);
      setDeleteContentId(null);
    },
    onError: (err: any) => {
      console.error("Delete mutation error:", err);
      
      // More detailed error message
      const errorMessage = err.message || "An error occurred while deleting the page";
      console.error("Error message:", errorMessage);
      
      toast({
        title: "Failed to delete page",
        description: errorMessage,
        variant: "destructive",
      });
    },
    // Add retry behavior for network errors
    retry: (failureCount, error: any) => {
      // Only retry for network-related errors, not for 4xx responses
      const isNetworkError = error.message && 
        (error.message.includes('network') || 
         error.message.includes('connection') ||
         error.message.includes('offline'));
         
      if (isNetworkError && failureCount < 2) {
        console.log(`Retrying delete operation, attempt ${failureCount + 1}`);
        return true;
      }
      return false;
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug || !content) {
      toast({
        title: "Incomplete form",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate({ title, slug, content });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContent) return;
    
    updateMutation.mutate({
      id: editingContent.id,
      data: {
        title,
        slug,
        content,
      },
    });
  };

  const openEditDialog = (content: PageContent) => {
    setEditingContent(content);
    setTitle(content.title);
    setSlug(content.slug);
    setContent(content.content);
    setIsEditDialogOpen(true);
  };

  const openPreviewDialog = (content: PageContent) => {
    setPreviewContent(content);
    setIsPreviewDialogOpen(true);
  };

  const openDeleteDialog = (id: number) => {
    setDeleteContentId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deleteContentId !== null) {
      deleteMutation.mutate(deleteContentId);
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  // Editor toolbar options
  const editorModules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ indent: "-1" }, { indent: "+1" }],
      [{ align: [] }],
      ["link", "image"],
      ["clean"],
    ],
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Page Content Management</CardTitle>
          <CardDescription>
            Create and manage pages for your platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-4">
            <Skeleton className="h-10 w-28" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Content</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">
            {error instanceof Error
              ? error.message
              : "An error occurred while loading page content"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Page Content Management</CardTitle>
        <CardDescription>
          Create and manage pages for your platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end mb-4">
          <Button onClick={openCreateDialog} className="flex items-center">
            <Plus className="mr-2 h-4 w-4" /> Create New Page
          </Button>
        </div>

        {pageContents && pageContents.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="w-36">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageContents.map((page) => (
                <TableRow key={page.id}>
                  <TableCell className="font-medium">{page.title}</TableCell>
                  <TableCell>/pages/{page.slug}</TableCell>
                  <TableCell>
                    {new Date(page.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openPreviewDialog(page)}
                      title="Preview"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openEditDialog(page)}
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openDeleteDialog(page.id)}
                      title="Delete"
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No pages created yet</p>
            <Button onClick={openCreateDialog} className="mt-4">
              Create your first page
            </Button>
          </div>
        )}

        {/* Create Page Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Page</DialogTitle>
              <DialogDescription>
                Create a new page for your platform.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Title
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="slug" className="text-right">
                    Slug
                  </Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="col-span-3"
                    placeholder="my-page-slug"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="content" className="text-right pt-2">
                    Content
                  </Label>
                  <div className="col-span-3 h-96 overflow-y-auto">
                    <ReactQuill
                      theme="snow"
                      value={content}
                      onChange={setContent}
                      modules={editorModules}
                      placeholder="Write your page content here..."
                      className="h-80"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Page"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Page Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Page</DialogTitle>
              <DialogDescription>
                Make changes to the page content.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-title" className="text-right">
                    Title
                  </Label>
                  <Input
                    id="edit-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-slug" className="text-right">
                    Slug
                  </Label>
                  <Input
                    id="edit-slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="col-span-3"
                    placeholder="my-page-slug"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="edit-content" className="text-right pt-2">
                    Content
                  </Label>
                  <div className="col-span-3 h-96 overflow-y-auto">
                    <ReactQuill
                      theme="snow"
                      value={content}
                      onChange={setContent}
                      modules={editorModules}
                      className="h-80"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Updating..." : "Update Page"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Preview Page Dialog */}
        <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{previewContent?.title}</DialogTitle>
              <DialogDescription>
                Page slug: /pages/{previewContent?.slug}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 prose max-w-none">
              <div
                dangerouslySetInnerHTML={{ __html: previewContent?.content || "" }}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                onClick={() => setIsPreviewDialogOpen(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          title="Delete Page"
          description="Are you sure you want to delete this page? This action cannot be undone."
          onConfirm={confirmDelete}
          confirmText={deleteMutation.isPending ? "Deleting..." : "Delete"}
          isLoading={deleteMutation.isPending}
        />
      </CardContent>
    </Card>
  );
}