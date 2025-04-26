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
import { Textarea } from "@/components/ui/textarea";
import { Edit, Trash, Eye, FileText, ExternalLink, Plus, Search } from "lucide-react";

// Interface for content pages
interface Page {
  id: number;
  slug: string;
  title: string;
  content: string;
  metaDescription?: string;
  published: boolean;
  createdAt: string;
  updatedAt?: string;
  createdBy: number;
  lastEditedBy?: number;
}

export default function ContentPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [newPage, setNewPage] = useState<Partial<Page>>({
    title: "",
    slug: "",
    content: "",
    metaDescription: "",
    published: false
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [publishedFilter, setPublishedFilter] = useState<boolean | null>(null);

  // Fetch all pages
  const { data: pages = [], isLoading } = useQuery({
    queryKey: ['/api/admin/pages'],
    queryFn: getQueryFn<Page[]>({ on401: "throw" }),
  });

  // Apply filters
  const filteredPages = pages.filter(page => {
    const matchesSearch = searchQuery === "" || 
      page.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      page.slug.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPublished = publishedFilter === null || 
      page.published === publishedFilter;
    
    return matchesSearch && matchesPublished;
  });

  const handleViewDetails = (page: Page) => {
    setSelectedPage(page);
    setShowDetailsDialog(true);
  };

  const handleEdit = (page: Page) => {
    setSelectedPage({...page});
    setShowDialog(true);
  };

  const handleCreate = () => {
    setNewPage({
      title: "",
      slug: "",
      content: "",
      metaDescription: "",
      published: false
    });
    setShowCreateDialog(true);
  };

  const handleSave = async () => {
    if (!selectedPage) return;
    
    try {
      await apiRequest("PATCH", `/api/admin/pages/${selectedPage.id}`, selectedPage);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pages'] });
      toast({
        title: "Page Updated",
        description: `Page "${selectedPage.title}" has been updated.`,
      });
      setShowDialog(false);
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update page",
        variant: "destructive",
      });
    }
  };

  const handleSaveNew = async () => {
    try {
      await apiRequest("POST", "/api/admin/pages", newPage);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pages'] });
      toast({
        title: "Page Created",
        description: `Page "${newPage.title}" has been created.`,
      });
      setShowCreateDialog(false);
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create page",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this page? This action cannot be undone.")) return;
    
    try {
      await apiRequest("DELETE", `/api/admin/pages/${id}`);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pages'] });
      toast({
        title: "Page Deleted",
        description: "The page has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete page",
        variant: "destructive",
      });
    }
  };

  const togglePublished = async (page: Page) => {
    try {
      await apiRequest("PATCH", `/api/admin/pages/${page.id}`, {
        ...page,
        published: !page.published
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pages'] });
      toast({
        title: page.published ? "Page Unpublished" : "Page Published",
        description: `"${page.title}" is now ${page.published ? "unpublished" : "published"}.`,
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update page status",
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

  // Generate a slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')     // Replace spaces with hyphens
      .replace(/-+/g, '-');     // Remove consecutive hyphens
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">Content Management</CardTitle>
            <CardDescription>
              Manage website pages and static content
            </CardDescription>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Page
          </Button>
        </div>
        <div className="flex items-center gap-4 mt-4">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="published-all" className="cursor-pointer">All</Label>
            <Input 
              id="published-all" 
              type="radio" 
              className="w-4 h-4" 
              checked={publishedFilter === null}
              onChange={() => setPublishedFilter(null)}
            />
            
            <Label htmlFor="published-yes" className="cursor-pointer">Published</Label>
            <Input 
              id="published-yes" 
              type="radio" 
              className="w-4 h-4" 
              checked={publishedFilter === true}
              onChange={() => setPublishedFilter(true)}
            />
            
            <Label htmlFor="published-no" className="cursor-pointer">Unpublished</Label>
            <Input 
              id="published-no" 
              type="radio" 
              className="w-4 h-4" 
              checked={publishedFilter === false}
              onChange={() => setPublishedFilter(false)}
            />
          </div>
          <Button 
            variant="outline" 
            onClick={() => {
              setSearchQuery("");
              setPublishedFilter(null);
            }}
          >
            Reset
          </Button>
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
              <TableCaption>List of {filteredPages.length} pages</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-center">Published</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPages.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell className="font-medium">{page.title}</TableCell>
                    <TableCell>/{page.slug}</TableCell>
                    <TableCell className="text-center">
                      <Switch 
                        checked={page.published} 
                        onCheckedChange={() => togglePublished(page)}
                        aria-label="Toggle published status"
                      />
                    </TableCell>
                    <TableCell>{formatDate(page.createdAt)}</TableCell>
                    <TableCell>{page.updatedAt ? formatDate(page.updatedAt) : "Never"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleViewDetails(page)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(page)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(page.id)}
                          disabled={page.slug === 'home' || page.slug === 'about' || page.slug === 'terms' || page.slug === 'privacy'}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                        <a 
                          href={`/pages/${page.slug}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center h-8 w-8 rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredPages.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No pages found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Edit Page Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Page</DialogTitle>
            <DialogDescription>
              Update page content and settings
            </DialogDescription>
          </DialogHeader>
          
          {selectedPage && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input
                  id="title"
                  value={selectedPage.title}
                  onChange={(e) => setSelectedPage({...selectedPage, title: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="slug" className="text-right">
                  Slug
                </Label>
                <div className="col-span-3 flex items-center">
                  <span className="mr-2">/</span>
                  <Input
                    id="slug"
                    value={selectedPage.slug}
                    onChange={(e) => setSelectedPage({...selectedPage, slug: e.target.value})}
                    className="flex-1"
                    disabled={selectedPage.slug === 'home' || selectedPage.slug === 'about' || selectedPage.slug === 'terms' || selectedPage.slug === 'privacy'}
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="metaDescription" className="text-right pt-2">
                  Meta Description
                </Label>
                <Textarea
                  id="metaDescription"
                  value={selectedPage.metaDescription || ""}
                  onChange={(e) => setSelectedPage({...selectedPage, metaDescription: e.target.value})}
                  className="col-span-3"
                  rows={2}
                  placeholder="Brief description for search engines"
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="content" className="text-right pt-2">
                  Content
                </Label>
                <Textarea
                  id="content"
                  value={selectedPage.content}
                  onChange={(e) => setSelectedPage({...selectedPage, content: e.target.value})}
                  className="col-span-3"
                  rows={15}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="published" className="text-right">
                  Published
                </Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Switch
                    id="published"
                    checked={selectedPage.published}
                    onCheckedChange={(checked) => setSelectedPage({...selectedPage, published: checked})}
                  />
                  <Label htmlFor="published" className="cursor-pointer">
                    {selectedPage.published ? "Public" : "Draft"}
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

      {/* Create Page Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Page</DialogTitle>
            <DialogDescription>
              Create a new page for your website
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-title" className="text-right">
                Title
              </Label>
              <Input
                id="new-title"
                value={newPage.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setNewPage({
                    ...newPage, 
                    title,
                    slug: newPage.slug || generateSlug(title)
                  });
                }}
                className="col-span-3"
                placeholder="Page Title"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-slug" className="text-right">
                Slug
              </Label>
              <div className="col-span-3 flex items-center">
                <span className="mr-2">/</span>
                <Input
                  id="new-slug"
                  value={newPage.slug}
                  onChange={(e) => setNewPage({...newPage, slug: e.target.value})}
                  className="flex-1"
                  placeholder="page-url-slug"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="new-metaDescription" className="text-right pt-2">
                Meta Description
              </Label>
              <Textarea
                id="new-metaDescription"
                value={newPage.metaDescription || ""}
                onChange={(e) => setNewPage({...newPage, metaDescription: e.target.value})}
                className="col-span-3"
                rows={2}
                placeholder="Brief description for search engines"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="new-content" className="text-right pt-2">
                Content
              </Label>
              <Textarea
                id="new-content"
                value={newPage.content || ""}
                onChange={(e) => setNewPage({...newPage, content: e.target.value})}
                className="col-span-3"
                rows={15}
                placeholder="Page content goes here..."
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-published" className="text-right">
                Published
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch
                  id="new-published"
                  checked={newPage.published || false}
                  onCheckedChange={(checked) => setNewPage({...newPage, published: checked})}
                />
                <Label htmlFor="new-published" className="cursor-pointer">
                  {newPage.published ? "Publish immediately" : "Save as draft"}
                </Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              onClick={handleSaveNew}
              disabled={!newPage.title || !newPage.slug || !newPage.content}
            >
              Create Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Page Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Page Details</DialogTitle>
            <DialogDescription>
              Preview of how the page will look
            </DialogDescription>
          </DialogHeader>
          
          {selectedPage && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{selectedPage.title}</h2>
                  <p className="text-muted-foreground">/{selectedPage.slug}</p>
                </div>
                <Badge variant={selectedPage.published ? "outline" : "secondary"}>
                  {selectedPage.published ? "Published" : "Draft"}
                </Badge>
              </div>
              
              <div className="border-t border-b py-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold">Created:</span>{' '}
                    {formatDate(selectedPage.createdAt)}
                  </div>
                  {selectedPage.updatedAt && (
                    <div>
                      <span className="font-semibold">Last Updated:</span>{' '}
                      {formatDate(selectedPage.updatedAt)}
                    </div>
                  )}
                  {selectedPage.metaDescription && (
                    <div className="col-span-2">
                      <span className="font-semibold">SEO Description:</span>{' '}
                      {selectedPage.metaDescription}
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Content Preview</h3>
                <div className="border rounded-md p-6 prose max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: selectedPage.content }} />
                </div>
              </div>
              
              <div className="border-t pt-4 flex justify-between">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleEdit(selectedPage)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Page
                  </Button>
                  <a 
                    href={`/pages/${selectedPage.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Page
                  </a>
                </div>
                <Button 
                  variant={selectedPage.published ? "outline" : "default"} 
                  onClick={() => {
                    togglePublished(selectedPage);
                    setShowDetailsDialog(false);
                  }}
                >
                  {selectedPage.published ? "Unpublish" : "Publish"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}