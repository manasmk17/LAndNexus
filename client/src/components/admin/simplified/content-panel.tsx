import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueryFn, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { PageContent } from '@shared/schema';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Eye, Search, X, MoreHorizontal, AlertCircle, Edit, FileText, Plus, Trash } from 'lucide-react';

export function ContentPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedContent, setSelectedContent] = useState<PageContent | null>(null);
  const [newContent, setNewContent] = useState<Partial<PageContent>>({
    title: '',
    slug: '',
    content: '',
    description: '',
    published: true,
  });

  // Fetch content
  const {
    data: contents = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['/api/admin/page-contents'],
    queryFn: getQueryFn<PageContent[]>({ on401: 'throw' }),
  });

  // Filter content based on search query
  const filteredContents = searchQuery
    ? contents.filter(
        (content) =>
          content.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          content.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          content.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : contents;

  // Create content mutation
  const createContentMutation = useMutation({
    mutationFn: async (contentData: Partial<PageContent>) => {
      const response = await apiRequest('POST', '/api/admin/page-contents', contentData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/page-contents'] });
      setShowCreateDialog(false);
      setNewContent({
        title: '',
        slug: '',
        content: '',
        description: '',
        published: true,
      });
      toast({
        title: 'Content Created',
        description: 'New page content has been created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Creation Failed',
        description: error.message || 'Failed to create new content',
        variant: 'destructive',
      });
    },
  });

  // Update content mutation
  const updateContentMutation = useMutation({
    mutationFn: async (contentData: PageContent) => {
      const response = await apiRequest('PATCH', `/api/admin/page-contents/${contentData.id}`, contentData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/page-contents'] });
      setShowEditDialog(false);
      toast({
        title: 'Content Updated',
        description: 'Page content has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update content',
        variant: 'destructive',
      });
    },
  });

  // Delete content mutation
  const deleteContentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/admin/page-contents/${id}`);
      return response.status === 204 ? {} : response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/page-contents'] });
      setShowDeleteDialog(false);
      setSelectedContent(null);
      toast({
        title: 'Content Deleted',
        description: 'Page content has been deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete content',
        variant: 'destructive',
      });
    },
  });

  const handleCreateContent = () => {
    // Validate fields
    if (!newContent.title || !newContent.slug || !newContent.content) {
      toast({
        title: 'Validation Error',
        description: 'Title, slug, and content are required fields.',
        variant: 'destructive',
      });
      return;
    }

    createContentMutation.mutate(newContent);
  };

  const handleEditContent = () => {
    if (!selectedContent) return;

    // Validate fields
    if (!selectedContent.title || !selectedContent.slug || !selectedContent.content) {
      toast({
        title: 'Validation Error',
        description: 'Title, slug, and content are required fields.',
        variant: 'destructive',
      });
      return;
    }

    updateContentMutation.mutate(selectedContent);
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center text-center p-6">
            <AlertCircle className="h-10 w-10 text-destructive mb-2" />
            <h3 className="text-lg font-semibold">Error Loading Content</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {error instanceof Error ? error.message : 'Could not load page content data'}
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/page-contents'] })}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Function to convert slug to URL
  const getPageUrl = (slug: string) => {
    return `/page/${slug}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Page Content Management</CardTitle>
            <CardDescription>Create and manage content pages</CardDescription>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-1">
            <Plus className="h-4 w-4" /> Add New Page
          </Button>
        </div>
        <div className="flex items-center mt-4 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-9 w-9"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No content pages found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContents.map((content) => (
                    <TableRow key={content.id}>
                      <TableCell className="font-medium">{content.title}</TableCell>
                      <TableCell className="font-mono text-xs">{content.slug}</TableCell>
                      <TableCell>
                        <Badge variant={content.published ? 'default' : 'outline'}>
                          {content.published ? 'Published' : 'Draft'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {content.createdAt ? new Date(content.createdAt).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {content.updatedAt ? new Date(content.updatedAt).toLocaleDateString() : 'N/A'}
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
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedContent(content);
                                setShowDetailsDialog(true);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedContent(content);
                                setShowEditDialog(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => window.open(getPageUrl(content.slug), '_blank')}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              View Page
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                setSelectedContent(content);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
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
        )}

        {/* Create Content Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Page</DialogTitle>
              <DialogDescription>
                Add a new content page to the website
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Page Title
                </Label>
                <Input
                  id="title"
                  value={newContent.title || ''}
                  onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                  className="col-span-3"
                  placeholder="Enter page title"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="slug" className="text-right">
                  URL Slug
                </Label>
                <Input
                  id="slug"
                  value={newContent.slug || ''}
                  onChange={(e) => setNewContent({ ...newContent, slug: e.target.value })}
                  className="col-span-3"
                  placeholder="enter-url-slug"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Input
                  id="description"
                  value={newContent.description || ''}
                  onChange={(e) => setNewContent({ ...newContent, description: e.target.value })}
                  className="col-span-3"
                  placeholder="Brief description of the page"
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="content" className="text-right pt-2">
                  Content
                </Label>
                <Textarea
                  id="content"
                  value={newContent.content || ''}
                  onChange={(e) => setNewContent({ ...newContent, content: e.target.value })}
                  className="col-span-3 min-h-[200px]"
                  placeholder="Enter page content in HTML format"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateContent}
                disabled={createContentMutation.isPending}
              >
                {createContentMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Page
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Content Dialog */}
        {selectedContent && (
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Page</DialogTitle>
                <DialogDescription>
                  Edit content for "{selectedContent.title}"
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-title" className="text-right">
                    Page Title
                  </Label>
                  <Input
                    id="edit-title"
                    value={selectedContent.title || ''}
                    onChange={(e) =>
                      setSelectedContent({ ...selectedContent, title: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-slug" className="text-right">
                    URL Slug
                  </Label>
                  <Input
                    id="edit-slug"
                    value={selectedContent.slug || ''}
                    onChange={(e) =>
                      setSelectedContent({ ...selectedContent, slug: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-description" className="text-right">
                    Description
                  </Label>
                  <Input
                    id="edit-description"
                    value={selectedContent.description || ''}
                    onChange={(e) =>
                      setSelectedContent({ ...selectedContent, description: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="edit-content" className="text-right pt-2">
                    Content
                  </Label>
                  <Textarea
                    id="edit-content"
                    value={selectedContent.content || ''}
                    onChange={(e) =>
                      setSelectedContent({ ...selectedContent, content: e.target.value })
                    }
                    className="col-span-3 min-h-[200px]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleEditContent}
                  disabled={updateContentMutation.isPending}
                >
                  {updateContentMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Confirmation Dialog */}
        {selectedContent && (
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete the page "{selectedContent.title}"? This action
                  cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteContentMutation.mutate(selectedContent.id)}
                  disabled={deleteContentMutation.isPending}
                >
                  {deleteContentMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Content Details Dialog */}
        {selectedContent && (
          <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{selectedContent.title}</DialogTitle>
                <DialogDescription>
                  Page content details
                </DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="info">Information</TabsTrigger>
                  <TabsTrigger value="preview">Content Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="info" className="pt-4">
                  <div className="grid gap-2">
                    <div className="grid grid-cols-3">
                      <div className="font-semibold">URL Slug:</div>
                      <div className="col-span-2 font-mono text-sm">{selectedContent.slug}</div>
                    </div>
                    <div className="grid grid-cols-3">
                      <div className="font-semibold">Status:</div>
                      <div className="col-span-2">
                        <Badge variant={selectedContent.published ? 'default' : 'outline'}>
                          {selectedContent.published ? 'Published' : 'Draft'}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-3">
                      <div className="font-semibold">Created:</div>
                      <div className="col-span-2">
                        {selectedContent.createdAt
                          ? new Date(selectedContent.createdAt).toLocaleString()
                          : 'N/A'}
                      </div>
                    </div>
                    <div className="grid grid-cols-3">
                      <div className="font-semibold">Last Updated:</div>
                      <div className="col-span-2">
                        {selectedContent.updatedAt
                          ? new Date(selectedContent.updatedAt).toLocaleString()
                          : 'N/A'}
                      </div>
                    </div>
                    {selectedContent.description && (
                      <div className="grid grid-cols-3">
                        <div className="font-semibold">Description:</div>
                        <div className="col-span-2">{selectedContent.description}</div>
                      </div>
                    )}
                    <div className="grid grid-cols-3 pt-2">
                      <div className="font-semibold">Public URL:</div>
                      <div className="col-span-2">
                        <a
                          href={getPageUrl(selectedContent.slug)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center"
                        >
                          {getPageUrl(selectedContent.slug).replace(/^\//, '')}
                          <Eye className="ml-1 h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="preview" className="pt-4">
                  <div className="border rounded-md p-4 max-h-[300px] overflow-y-auto">
                    <div 
                      dangerouslySetInnerHTML={{ __html: selectedContent.content || '' }} 
                      className="prose prose-sm max-w-none"
                    />
                  </div>
                </TabsContent>
              </Tabs>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setShowDetailsDialog(false);
                    setShowEditDialog(true);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}