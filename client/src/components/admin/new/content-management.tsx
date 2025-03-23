import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { Resource, ResourceCategory, PageContent, User } from "@shared/schema";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Eye,
  Trash2,
  MoreHorizontal,
  Star,
  Edit,
  RefreshCw,
  Search,
  X,
  FileText,
  Plus,
  FileSymlink,
  FileVideo,
  BookOpen,
  File,
  Globe,
  ExternalLink,
  Calendar,
  User as UserIcon,
} from "lucide-react";
import { format } from "date-fns";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Resource form schema
const resourceFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  content: z.string().optional(),
  contentUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  resourceType: z.enum(["article", "template", "video", "webinar"], {
    required_error: "Please select a resource type",
  }),
  categoryId: z.number({
    required_error: "Please select a category",
  }),
  imageUrl: z.string().url("Please enter a valid image URL").optional().or(z.literal("")),
  featured: z.boolean().default(false),
});

// Page content form schema
const pageContentFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  content: z.string().min(10, "Content must be at least 10 characters"),
});

// Category form schema
const categoryFormSchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters"),
  description: z.string().optional(),
});

type ResourceFormValues = z.infer<typeof resourceFormSchema>;
type PageContentFormValues = z.infer<typeof pageContentFormSchema>;
type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export default function ContentManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const quillRef = useRef<ReactQuill>(null);
  const [activeTab, setActiveTab] = useState("resources");
  const [searchQuery, setSearchQuery] = useState("");
  const [resourceFilterType, setResourceFilterType] = useState<string | null>(null);
  const [resourceFilterCategory, setResourceFilterCategory] = useState<number | null>(null);
  
  // Dialog states
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isViewResourceDialogOpen, setIsViewResourceDialogOpen] = useState(false);
  const [isEditResourceDialogOpen, setIsEditResourceDialogOpen] = useState(false);
  const [isAddResourceDialogOpen, setIsAddResourceDialogOpen] = useState(false);
  const [isDeleteResourceDialogOpen, setIsDeleteResourceDialogOpen] = useState(false);
  
  const [selectedPage, setSelectedPage] = useState<PageContent | null>(null);
  const [isViewPageDialogOpen, setIsViewPageDialogOpen] = useState(false);
  const [isEditPageDialogOpen, setIsEditPageDialogOpen] = useState(false);
  const [isAddPageDialogOpen, setIsAddPageDialogOpen] = useState(false);
  const [isDeletePageDialogOpen, setIsDeletePageDialogOpen] = useState(false);
  
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);

  // Fetch resources
  const { data: resources = [], isLoading: isLoadingResources } = useQuery({
    queryKey: ['/api/admin/resources'],
    queryFn: getQueryFn<Resource[]>({ on401: "throw" }),
  });

  // Fetch resource categories
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['/api/admin/resource-categories'],
    queryFn: getQueryFn<ResourceCategory[]>({ on401: "throw" }),
  });

  // Fetch page contents
  const { data: pages = [], isLoading: isLoadingPages } = useQuery({
    queryKey: ['/api/admin/page-contents'],
    queryFn: getQueryFn<PageContent[]>({ on401: "throw" }),
  });

  // Fetch users for author info
  const { data: users = [] } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: getQueryFn<User[]>({ on401: "throw" }),
  });

  // Filter resources
  const filteredResources = resources
    .filter(resource => 
      (!resourceFilterType || resource.resourceType === resourceFilterType) &&
      (!resourceFilterCategory || resource.categoryId === resourceFilterCategory)
    )
    .filter(resource => 
      !searchQuery || 
      resource.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Filter pages
  const filteredPages = pages
    .filter(page => 
      !searchQuery || 
      page.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.content?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Resource form
  const resourceForm = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceFormSchema),
    defaultValues: {
      title: "",
      description: "",
      content: "",
      contentUrl: "",
      resourceType: "article",
      imageUrl: "",
      featured: false,
    },
  });

  // Page content form
  const pageForm = useForm<PageContentFormValues>({
    resolver: zodResolver(pageContentFormSchema),
    defaultValues: {
      title: "",
      slug: "",
      content: "",
    },
  });

  // Category form
  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Toggle resource featured status mutation
  const toggleResourceFeaturedMutation = useMutation({
    mutationFn: async ({ id, featured }: { id: number; featured: boolean }) => {
      const response = await apiRequest("PUT", `/api/admin/resources/${id}/featured`, {
        featured,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/resources'] });
      toast({
        title: "Resource Updated",
        description: "Featured status has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update featured status",
        variant: "destructive",
      });
    },
  });

  // Create resource mutation
  const createResourceMutation = useMutation({
    mutationFn: async (data: ResourceFormValues) => {
      const response = await apiRequest("POST", "/api/admin/resources", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/resources'] });
      setIsAddResourceDialogOpen(false);
      resourceForm.reset();
      toast({
        title: "Resource Created",
        description: "The resource has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create resource",
        variant: "destructive",
      });
    },
  });

  // Update resource mutation
  const updateResourceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ResourceFormValues> }) => {
      const response = await apiRequest("PUT", `/api/admin/resources/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/resources'] });
      setIsEditResourceDialogOpen(false);
      toast({
        title: "Resource Updated",
        description: "The resource has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update resource",
        variant: "destructive",
      });
    },
  });

  // Delete resource mutation
  const deleteResourceMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/resources/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/resources'] });
      setIsDeleteResourceDialogOpen(false);
      setSelectedResource(null);
      toast({
        title: "Resource Deleted",
        description: "The resource has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete resource",
        variant: "destructive",
      });
    },
  });

  // Create page content mutation
  const createPageContentMutation = useMutation({
    mutationFn: async (data: PageContentFormValues) => {
      const response = await apiRequest("POST", "/api/admin/page-contents", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/page-contents'] });
      setIsAddPageDialogOpen(false);
      pageForm.reset();
      toast({
        title: "Page Created",
        description: "The page content has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create page",
        variant: "destructive",
      });
    },
  });

  // Update page content mutation
  const updatePageContentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<PageContentFormValues> }) => {
      const response = await apiRequest("PUT", `/api/admin/page-contents/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/page-contents'] });
      setIsEditPageDialogOpen(false);
      toast({
        title: "Page Updated",
        description: "The page content has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update page",
        variant: "destructive",
      });
    },
  });

  // Delete page content mutation
  const deletePageContentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/page-contents/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/page-contents'] });
      setIsDeletePageDialogOpen(false);
      setSelectedPage(null);
      toast({
        title: "Page Deleted",
        description: "The page content has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete page",
        variant: "destructive",
      });
    },
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormValues) => {
      const response = await apiRequest("POST", "/api/admin/resource-categories", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/resource-categories'] });
      setIsAddCategoryDialogOpen(false);
      categoryForm.reset();
      toast({
        title: "Category Created",
        description: "The category has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create category",
        variant: "destructive",
      });
    },
  });

  // Handle view resource
  const handleViewResource = (resource: Resource) => {
    setSelectedResource(resource);
    setIsViewResourceDialogOpen(true);
  };

  // Handle edit resource
  const handleEditResource = (resource: Resource) => {
    setSelectedResource(resource);
    resourceForm.reset({
      title: resource.title,
      description: resource.description,
      content: resource.content,
      contentUrl: resource.contentUrl || "",
      resourceType: resource.resourceType as "article" | "template" | "video" | "webinar",
      categoryId: resource.categoryId || undefined,
      imageUrl: resource.imageUrl || "",
      featured: !!resource.featured,
    });
    setIsEditResourceDialogOpen(true);
  };

  // Handle delete resource
  const handleDeleteResource = (resource: Resource) => {
    setSelectedResource(resource);
    setIsDeleteResourceDialogOpen(true);
  };

  // Handle view page content
  const handleViewPage = (page: PageContent) => {
    setSelectedPage(page);
    setIsViewPageDialogOpen(true);
  };

  // Handle edit page content
  const handleEditPage = (page: PageContent) => {
    setSelectedPage(page);
    pageForm.reset({
      title: page.title,
      slug: page.slug,
      content: page.content,
    });
    setIsEditPageDialogOpen(true);
  };

  // Handle delete page content
  const handleDeletePage = (page: PageContent) => {
    setSelectedPage(page);
    setIsDeletePageDialogOpen(true);
  };

  // Get author name by ID
  const getAuthorName = (authorId: number) => {
    const author = users.find(user => user.id === authorId);
    return author ? `${author.firstName} ${author.lastName}` : `User ${authorId}`;
  };

  // Get category name by ID
  const getCategoryName = (categoryId?: number | null) => {
    if (!categoryId) return "Uncategorized";
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : "Unknown Category";
  };

  // Resource type icons
  const resourceTypeIcon = (type: string) => {
    switch (type) {
      case 'article':
        return <FileText className="h-4 w-4" />;
      case 'template':
        return <File className="h-4 w-4" />;
      case 'video':
        return <FileVideo className="h-4 w-4" />;
      case 'webinar':
        return <Globe className="h-4 w-4" />;
      default:
        return <FileSymlink className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="pages">Pages & Content</TabsTrigger>
        </TabsList>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Resource Management</CardTitle>
                <CardDescription>
                  Manage articles, templates, videos, and other learning resources
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    categoryForm.reset();
                    setIsAddCategoryDialogOpen(true);
                  }}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add Category
                </Button>
                <Button
                  onClick={() => {
                    resourceForm.reset();
                    setIsAddResourceDialogOpen(true);
                  }}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add Resource
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search resources..."
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
                  <Select 
                    value={resourceFilterType || ""} 
                    onValueChange={(value) => setResourceFilterType(value || null)}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Types</SelectItem>
                      <SelectItem value="article">Articles</SelectItem>
                      <SelectItem value="template">Templates</SelectItem>
                      <SelectItem value="video">Videos</SelectItem>
                      <SelectItem value="webinar">Webinars</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select 
                    value={resourceFilterCategory?.toString() || ""} 
                    onValueChange={(value) => setResourceFilterCategory(value ? parseInt(value) : null)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/resources'] })}
                    title="Refresh"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingResources ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            <div className="flex justify-center">
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredResources.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            No resources found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredResources.map((resource) => (
                          <TableRow key={resource.id}>
                            <TableCell>
                              <div className="font-medium flex items-center gap-1">
                                {resource.title}
                                {resource.featured && (
                                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200 ml-1">
                                    <Star className="mr-1 h-3 w-3" /> Featured
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                {resourceTypeIcon(resource.resourceType)}
                                <span className="capitalize">{resource.resourceType}</span>
                              </Badge>
                            </TableCell>
                            <TableCell>{getCategoryName(resource.categoryId)}</TableCell>
                            <TableCell>{getAuthorName(resource.authorId)}</TableCell>
                            <TableCell>
                              {resource.createdAt ? format(new Date(resource.createdAt), 'MMM d, yyyy') : 'Unknown'}
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
                                  <DropdownMenuItem onClick={() => handleViewResource(resource)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditResource(resource)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Resource
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      toggleResourceFeaturedMutation.mutate({
                                        id: resource.id,
                                        featured: !resource.featured,
                                      })
                                    }
                                  >
                                    <Star className="mr-2 h-4 w-4" />
                                    {resource.featured ? "Remove Featured" : "Mark as Featured"}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => handleDeleteResource(resource)}
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
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pages Tab */}
        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Page Content Management</CardTitle>
                <CardDescription>
                  Manage static pages and content throughout the platform
                </CardDescription>
              </div>
              <Button
                onClick={() => {
                  pageForm.reset();
                  setIsAddPageDialogOpen(true);
                }}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add Page
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search pages..."
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
                    size="icon"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/page-contents'] })}
                    title="Refresh"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead>Last Editor</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingPages ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            <div className="flex justify-center">
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredPages.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            No pages found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPages.map((page) => (
                          <TableRow key={page.id}>
                            <TableCell>
                              <div className="font-medium">{page.title}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">/{page.slug}</Badge>
                            </TableCell>
                            <TableCell>
                              {page.updatedAt ? format(new Date(page.updatedAt), 'MMM d, yyyy') : 'Unknown'}
                            </TableCell>
                            <TableCell>
                              {page.lastEditedBy ? getAuthorName(page.lastEditedBy) : 'Unknown'}
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
                                  <DropdownMenuItem onClick={() => handleViewPage(page)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Content
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditPage(page)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Content
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => window.open(`/pages/${page.slug}`, '_blank')}
                                  >
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    View Live Page
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => handleDeletePage(page)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Page
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
      </Tabs>

      {/* View Resource Dialog */}
      <Dialog open={isViewResourceDialogOpen} onOpenChange={setIsViewResourceDialogOpen}>
        <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Resource Details</DialogTitle>
            <DialogDescription>
              Complete information about the selected resource
            </DialogDescription>
          </DialogHeader>

          {selectedResource && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{selectedResource.title}</h2>
                {selectedResource.featured && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                    <Star className="mr-1 h-3 w-3" /> Featured
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Badge variant="outline" className="flex items-center gap-1">
                    {resourceTypeIcon(selectedResource.resourceType)}
                    <span className="capitalize">{selectedResource.resourceType}</span>
                  </Badge>
                </div>
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">{getCategoryName(selectedResource.categoryId)}</span>
                </div>
                <div className="flex items-center">
                  <UserIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">Author: {getAuthorName(selectedResource.authorId)}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">
                    Created: {selectedResource.createdAt ? format(new Date(selectedResource.createdAt), 'MMM d, yyyy') : 'Unknown'}
                  </span>
                </div>
              </div>

              {selectedResource.imageUrl && (
                <div>
                  <h3 className="text-base font-medium mb-1">Featured Image</h3>
                  <img 
                    src={selectedResource.imageUrl} 
                    alt={selectedResource.title}
                    className="w-full max-h-[200px] object-cover rounded-md"
                  />
                </div>
              )}

              <div>
                <h3 className="text-base font-medium mb-1">Description</h3>
                <p className="text-sm text-muted-foreground border rounded-md p-3 bg-muted/30">
                  {selectedResource.description}
                </p>
              </div>

              {selectedResource.content && (
                <div>
                  <h3 className="text-base font-medium mb-1">Content</h3>
                  <div 
                    className="text-sm border rounded-md p-3 bg-muted/30 prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedResource.content }}
                  />
                </div>
              )}

              {selectedResource.contentUrl && (
                <div>
                  <h3 className="text-base font-medium mb-1">External Content</h3>
                  <a 
                    href={selectedResource.contentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center"
                  >
                    {selectedResource.contentUrl}
                    <ExternalLink className="ml-1 h-4 w-4" />
                  </a>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex justify-between">
            {selectedResource && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setIsViewResourceDialogOpen(false);
                    handleDeleteResource(selectedResource);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsViewResourceDialogOpen(false);
                      handleEditResource(selectedResource);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsViewResourceDialogOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Resource Dialog */}
      <Dialog 
        open={isAddResourceDialogOpen || isEditResourceDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            isAddResourceDialogOpen ? setIsAddResourceDialogOpen(false) : setIsEditResourceDialogOpen(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isAddResourceDialogOpen ? "Add New Resource" : "Edit Resource"}
            </DialogTitle>
            <DialogDescription>
              {isAddResourceDialogOpen 
                ? "Create a new resource for the platform" 
                : `Edit resource: ${selectedResource?.title}`}
            </DialogDescription>
          </DialogHeader>

          <Form {...resourceForm}>
            <form onSubmit={resourceForm.handleSubmit((data) => {
              if (isAddResourceDialogOpen) {
                createResourceMutation.mutate({
                  ...data,
                  // In a real implementation, this would be the current user's ID
                  authorId: data.authorId || 1,
                });
              } else if (selectedResource) {
                updateResourceMutation.mutate({ 
                  id: selectedResource.id, 
                  data 
                });
              }
            })} className="space-y-4">
              <FormField
                control={resourceForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Resource title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={resourceForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of the resource" 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={resourceForm.control}
                  name="resourceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resource Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a resource type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="article">Article</SelectItem>
                          <SelectItem value="template">Template</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="webinar">Webinar</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={resourceForm.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem 
                              key={category.id} 
                              value={category.id.toString()}
                            >
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={resourceForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <div className="min-h-[200px] border rounded-md">
                        <ReactQuill
                          ref={quillRef}
                          theme="snow"
                          value={field.value || ""}
                          onChange={field.onChange}
                          modules={{
                            toolbar: [
                              [{ header: [1, 2, 3, false] }],
                              ["bold", "italic", "underline", "strike"],
                              [{ list: "ordered" }, { list: "bullet" }],
                              ["link", "image"],
                              ["clean"],
                            ],
                          }}
                          className="h-[200px]"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={resourceForm.control}
                name="contentUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>External Content URL (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/resource" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={resourceForm.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Featured Image URL (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/image.jpg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={resourceForm.control}
                name="featured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <div className="flex h-5 items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={field.value}
                          onChange={field.onChange}
                        />
                      </div>
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Featured Resource</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Featured resources are prominently displayed on the platform
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    isAddResourceDialogOpen ? setIsAddResourceDialogOpen(false) : setIsEditResourceDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createResourceMutation.isPending || updateResourceMutation.isPending}
                >
                  {(createResourceMutation.isPending || updateResourceMutation.isPending) && (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isAddResourceDialogOpen ? "Create Resource" : "Update Resource"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Resource Dialog */}
      <AlertDialog open={isDeleteResourceDialogOpen} onOpenChange={setIsDeleteResourceDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the resource. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedResource) {
                  deleteResourceMutation.mutate(selectedResource.id);
                }
              }}
              className="bg-red-600 focus:ring-red-600"
            >
              {deleteResourceMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>Delete</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Page Dialog */}
      <Dialog open={isViewPageDialogOpen} onOpenChange={setIsViewPageDialogOpen}>
        <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Page Content</DialogTitle>
            <DialogDescription>
              {selectedPage?.slug && (
                <span>
                  URL: <Badge variant="outline">/{selectedPage.slug}</Badge>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedPage && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{selectedPage.title}</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <UserIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">
                    Last edited by: {selectedPage.lastEditedBy ? getAuthorName(selectedPage.lastEditedBy) : 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">
                    Updated: {selectedPage.updatedAt ? format(new Date(selectedPage.updatedAt), 'MMM d, yyyy') : 'Unknown'}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-base font-medium mb-1">Content</h3>
                <div 
                  className="text-sm border rounded-md p-3 bg-muted/30 prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedPage.content }}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            {selectedPage && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setIsViewPageDialogOpen(false);
                    handleDeletePage(selectedPage);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => window.open(`/pages/${selectedPage.slug}`, '_blank')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Live
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsViewPageDialogOpen(false);
                      handleEditPage(selectedPage);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsViewPageDialogOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Page Dialog */}
      <Dialog 
        open={isAddPageDialogOpen || isEditPageDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            isAddPageDialogOpen ? setIsAddPageDialogOpen(false) : setIsEditPageDialogOpen(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isAddPageDialogOpen ? "Add New Page" : "Edit Page Content"}
            </DialogTitle>
            <DialogDescription>
              {isAddPageDialogOpen 
                ? "Create a new page for the platform" 
                : `Edit page: ${selectedPage?.title}`}
            </DialogDescription>
          </DialogHeader>

          <Form {...pageForm}>
            <form onSubmit={pageForm.handleSubmit((data) => {
              if (isAddPageDialogOpen) {
                createPageContentMutation.mutate(data);
              } else if (selectedPage) {
                updatePageContentMutation.mutate({ 
                  id: selectedPage.id, 
                  data 
                });
              }
            })} className="space-y-4">
              <FormField
                control={pageForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Page Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Page title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={pageForm.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Slug</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <span className="text-sm text-muted-foreground mr-1">/pages/</span>
                        <Input placeholder="page-slug" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={pageForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Page Content</FormLabel>
                    <FormControl>
                      <div className="min-h-[300px] border rounded-md">
                        <ReactQuill
                          ref={quillRef}
                          theme="snow"
                          value={field.value || ""}
                          onChange={field.onChange}
                          modules={{
                            toolbar: [
                              [{ header: [1, 2, 3, false] }],
                              ["bold", "italic", "underline", "strike"],
                              [{ list: "ordered" }, { list: "bullet" }],
                              ["link", "image"],
                              ["clean"],
                            ],
                          }}
                          className="h-[300px]"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    isAddPageDialogOpen ? setIsAddPageDialogOpen(false) : setIsEditPageDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createPageContentMutation.isPending || updatePageContentMutation.isPending}
                >
                  {(createPageContentMutation.isPending || updatePageContentMutation.isPending) && (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isAddPageDialogOpen ? "Create Page" : "Update Page"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Page Dialog */}
      <AlertDialog open={isDeletePageDialogOpen} onOpenChange={setIsDeletePageDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the page content. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedPage) {
                  deletePageContentMutation.mutate(selectedPage.id);
                }
              }}
              className="bg-red-600 focus:ring-red-600"
            >
              {deletePageContentMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>Delete</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Category Dialog */}
      <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a new category for organizing resources
            </DialogDescription>
          </DialogHeader>

          <Form {...categoryForm}>
            <form onSubmit={categoryForm.handleSubmit((data) => {
              createCategoryMutation.mutate(data);
            })} className="space-y-4">
              <FormField
                control={categoryForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Category name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={categoryForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of the category" 
                        {...field}
                        value={field.value || ""} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddCategoryDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createCategoryMutation.isPending}
                >
                  {createCategoryMutation.isPending && (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Category
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}