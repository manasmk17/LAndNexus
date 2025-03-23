import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Filter,
  Plus,
  Star, 
  StarOff, 
  MoreHorizontal,
  Download,
  Eye,
  Edit,
  Trash2,
  FileText,
  BookOpen,
  Video,
  FileQuestion,
  Book,
  CalendarDays,
  ExternalLink,
  Images,
  CheckSquare
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
import { Checkbox } from "@/components/ui/checkbox";
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

// Sample resources data
const sampleResources = [
  {
    id: 1,
    title: "The Complete L&D Strategy Guide",
    description: "Comprehensive guide to developing an effective learning and development strategy for your organization",
    content: "This is a long-form article...",
    resourceType: "article",
    categoryId: 1,
    categoryName: "Strategy",
    authorId: 1,
    authorName: "John Doe",
    featured: true,
    createdAt: new Date("2023-01-15"),
    publishedAt: new Date("2023-01-20"),
    imageUrl: null,
    downloadCount: 356,
    viewCount: 2451,
    duration: "25 min read",
    level: "Intermediate",
  },
  {
    id: 2,
    title: "Employee Onboarding Template",
    description: "Ready-to-use template for creating effective employee onboarding programs",
    content: "Template content...",
    resourceType: "template",
    categoryId: 2,
    categoryName: "Onboarding",
    authorId: 2,
    authorName: "Sarah Johnson",
    featured: false,
    createdAt: new Date("2023-01-22"),
    publishedAt: new Date("2023-01-25"),
    imageUrl: null,
    downloadCount: 428,
    viewCount: 1876,
    duration: "N/A",
    level: "Beginner",
  },
  {
    id: 3,
    title: "Leadership Development Best Practices",
    description: "Video course exploring best practices in developing leadership skills",
    content: null,
    resourceType: "video",
    categoryId: 3,
    categoryName: "Leadership",
    authorId: 3,
    authorName: "Michael Rodriguez",
    featured: true,
    createdAt: new Date("2023-02-01"),
    publishedAt: new Date("2023-02-05"),
    imageUrl: null,
    contentUrl: "https://example.com/videos/leadership",
    downloadCount: 0,
    viewCount: 689,
    duration: "45 minutes",
    level: "Advanced",
  },
  {
    id: 4,
    title: "Diversity & Inclusion Training Workshop",
    description: "Interactive webinar on implementing effective D&I training programs",
    content: null,
    resourceType: "webinar",
    categoryId: 4,
    categoryName: "Diversity & Inclusion",
    authorId: 4,
    authorName: "Emma Chen",
    featured: false,
    createdAt: new Date("2023-02-10"),
    publishedAt: new Date("2023-02-15"),
    imageUrl: null,
    contentUrl: "https://example.com/webinars/diversity",
    downloadCount: 0,
    viewCount: 512,
    duration: "60 minutes",
    level: "Intermediate",
  },
  {
    id: 5,
    title: "Sales Training Methodology Guide",
    description: "Article on developing effective sales training programs",
    content: "This article explores...",
    resourceType: "article",
    categoryId: 5,
    categoryName: "Sales Training",
    authorId: 5,
    authorName: "David Wilson",
    featured: false,
    createdAt: new Date("2023-02-18"),
    publishedAt: new Date("2023-02-20"),
    imageUrl: null,
    downloadCount: 187,
    viewCount: 890,
    duration: "15 min read",
    level: "Beginner",
  },
  {
    id: 6,
    title: "Executive Coaching Framework",
    description: "Template for implementing executive coaching programs",
    content: "Framework content...",
    resourceType: "template",
    categoryId: 3,
    categoryName: "Leadership",
    authorId: 6,
    authorName: "Olivia Martinez",
    featured: true,
    createdAt: new Date("2023-02-25"),
    publishedAt: new Date("2023-03-01"),
    imageUrl: null,
    downloadCount: 245,
    viewCount: 1203,
    duration: "N/A",
    level: "Advanced",
  },
];

// Sample page contents
const samplePages = [
  {
    id: 1,
    title: "About Us",
    slug: "about-us",
    content: "<h1>About L&D Nexus</h1><p>We are a marketplace connecting learning and development professionals with companies...</p>",
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2023-01-15"),
    lastEditedBy: 3,
  },
  {
    id: 2,
    title: "Privacy Policy",
    slug: "privacy-policy",
    content: "<h1>Privacy Policy</h1><p>This privacy policy explains how we collect, use, and protect your personal information...</p>",
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2023-01-05"),
    lastEditedBy: 3,
  },
  {
    id: 3,
    title: "Terms of Service",
    slug: "terms-of-service",
    content: "<h1>Terms of Service</h1><p>By using our platform, you agree to the following terms...</p>",
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2023-01-05"),
    lastEditedBy: 3,
  },
  {
    id: 4,
    title: "How It Works",
    slug: "how-it-works",
    content: "<h1>How L&D Nexus Works</h1><p>Learn how our platform connects professionals and companies...</p>",
    createdAt: new Date("2023-01-10"),
    updatedAt: new Date("2023-02-15"),
    lastEditedBy: 1,
  },
  {
    id: 5,
    title: "FAQ",
    slug: "faq",
    content: "<h1>Frequently Asked Questions</h1><div class='faq-item'><h3>How do I sign up?</h3><p>Simply click the register button...</p></div>",
    createdAt: new Date("2023-01-15"),
    updatedAt: new Date("2023-02-20"),
    lastEditedBy: 1,
  },
];

// Sample categories
const sampleCategories = [
  { id: 1, name: "Strategy", resourceCount: 18 },
  { id: 2, name: "Onboarding", resourceCount: 24 },
  { id: 3, name: "Leadership", resourceCount: 32 },
  { id: 4, name: "Diversity & Inclusion", resourceCount: 15 },
  { id: 5, name: "Sales Training", resourceCount: 20 },
  { id: 6, name: "Technical Skills", resourceCount: 28 },
  { id: 7, name: "Soft Skills", resourceCount: 22 },
  { id: 8, name: "Compliance", resourceCount: 17 },
];

export default function ContentManagement() {
  const [activeTab, setActiveTab] = useState("resources");
  const [resources, setResources] = useState(sampleResources);
  const [pages, setPages] = useState(samplePages);
  const [categories, setCategories] = useState(sampleCategories);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedResources, setSelectedResources] = useState<number[]>([]);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [bulkDeleteType, setBulkDeleteType] = useState<"resources" | "pages" | "categories">("resources");
  const { toast } = useToast();

  // Filter resources based on search term
  const filteredResources = resources.filter(resource => {
    const searchFields = [
      resource.title,
      resource.description,
      resource.categoryName,
      resource.authorName,
      resource.resourceType,
    ];
    
    return searchFields.some(field => 
      field.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Filter pages based on search term
  const filteredPages = pages.filter(page => {
    const searchFields = [
      page.title,
      page.slug,
    ];
    
    return searchFields.some(field => 
      field.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Filter categories based on search term
  const filteredCategories = categories.filter(category => {
    return category.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleToggleFeatured = (id: number) => {
    setResources(resources.map(resource => 
      resource.id === id 
        ? { ...resource, featured: !resource.featured } 
        : resource
    ));

    const resource = resources.find(r => r.id === id);
    const action = resource?.featured ? "removed from" : "added to";
    
    toast({
      title: `Featured status updated`,
      description: `"${resource?.title}" has been ${action} featured resources.`,
    });
  };

  const getResourceTypeIcon = (type: string) => {
    switch(type) {
      case 'article':
        return <FileText className="h-4 w-4 mr-2" />;
      case 'template':
        return <FileQuestion className="h-4 w-4 mr-2" />;
      case 'video':
        return <Video className="h-4 w-4 mr-2" />;
      case 'webinar':
        return <CalendarDays className="h-4 w-4 mr-2" />;
      default:
        return <Book className="h-4 w-4 mr-2" />;
    }
  };

  const getResourceTypeColor = (type: string) => {
    switch(type) {
      case 'article':
        return 'bg-blue-100 text-blue-800';
      case 'template':
        return 'bg-purple-100 text-purple-800';
      case 'video':
        return 'bg-amber-100 text-amber-800';
      case 'webinar':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Selection and bulk delete handlers
  const toggleSelectResource = (id: number) => {
    setSelectedResources(prev => 
      prev.includes(id) 
        ? prev.filter(resourceId => resourceId !== id)
        : [...prev, id]
    );
  };
  
  const toggleSelectPage = (id: number) => {
    setSelectedPages(prev => 
      prev.includes(id) 
        ? prev.filter(pageId => pageId !== id)
        : [...prev, id]
    );
  };
  
  const toggleSelectCategory = (id: number) => {
    setSelectedCategories(prev => 
      prev.includes(id) 
        ? prev.filter(categoryId => categoryId !== id)
        : [...prev, id]
    );
  };
  
  const toggleSelectAll = () => {
    if (activeTab === "resources") {
      if (selectedResources.length === filteredResources.length) {
        setSelectedResources([]);
      } else {
        setSelectedResources(filteredResources.map(r => r.id));
      }
    } else if (activeTab === "pages") {
      if (selectedPages.length === filteredPages.length) {
        setSelectedPages([]);
      } else {
        setSelectedPages(filteredPages.map(p => p.id));
      }
    } else if (activeTab === "categories") {
      if (selectedCategories.length === filteredCategories.length) {
        setSelectedCategories([]);
      } else {
        setSelectedCategories(filteredCategories.map(c => c.id));
      }
    }
  };
  
  const handleBulkDelete = () => {
    setBulkDeleteType(activeTab as any);
    setConfirmDialogOpen(true);
  };
  
  const confirmBulkDelete = () => {
    if (bulkDeleteType === "resources" && selectedResources.length > 0) {
      setResources(resources.filter(r => !selectedResources.includes(r.id)));
      setSelectedResources([]);
      toast({
        title: "Resources deleted",
        description: `Successfully deleted ${selectedResources.length} resources.`,
      });
    } else if (bulkDeleteType === "pages" && selectedPages.length > 0) {
      setPages(pages.filter(p => !selectedPages.includes(p.id)));
      setSelectedPages([]);
      toast({
        title: "Pages deleted",
        description: `Successfully deleted ${selectedPages.length} pages.`,
      });
    } else if (bulkDeleteType === "categories" && selectedCategories.length > 0) {
      setCategories(categories.filter(c => !selectedCategories.includes(c.id)));
      setSelectedCategories([]);
      toast({
        title: "Categories deleted",
        description: `Successfully deleted ${selectedCategories.length} categories.`,
      });
    }
    setConfirmDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Content Management</h2>
        <div className="flex gap-2">
          <Button className="flex items-center gap-1">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Content</span>
          </Button>
          <Button variant="outline" className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>
      
      {/* Tabs for different content types */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full md:w-[500px]">
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>Resources</span>
          </TabsTrigger>
          <TabsTrigger value="pages" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Pages</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Book className="h-4 w-4" />
            <span>Categories</span>
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
              {activeTab === "resources" && (
                <>
                  <DropdownMenuItem>All Resources</DropdownMenuItem>
                  <DropdownMenuItem>Featured Only</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Articles</DropdownMenuItem>
                  <DropdownMenuItem>Templates</DropdownMenuItem>
                  <DropdownMenuItem>Videos</DropdownMenuItem>
                  <DropdownMenuItem>Webinars</DropdownMenuItem>
                </>
              )}
              {activeTab === "pages" && (
                <>
                  <DropdownMenuItem>All Pages</DropdownMenuItem>
                  <DropdownMenuItem>Recently Updated</DropdownMenuItem>
                </>
              )}
              {activeTab === "categories" && (
                <>
                  <DropdownMenuItem>All Categories</DropdownMenuItem>
                  <DropdownMenuItem>Most Resources</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      
        {/* Resources Tab Content */}
        <TabsContent value="resources" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Resources</CardTitle>
                <CardDescription>
                  Manage learning resources, articles, templates, videos, and webinars.
                </CardDescription>
              </div>
              {selectedResources.length > 0 && (
                <Button 
                  variant="destructive" 
                  className="flex items-center gap-2"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Selected ({selectedResources.length})
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={selectedResources.length === filteredResources.length && filteredResources.length > 0}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all resources"
                      />
                    </TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead className="text-center">Featured</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResources.map((resource) => (
                    <TableRow key={resource.id} className={selectedResources.includes(resource.id) ? "bg-muted/30" : ""}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedResources.includes(resource.id)}
                          onCheckedChange={() => toggleSelectResource(resource.id)}
                          aria-label={`Select ${resource.title}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {resource.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getResourceTypeColor(resource.resourceType)}>
                          <div className="flex items-center">
                            {getResourceTypeIcon(resource.resourceType)}
                            <span>{resource.resourceType}</span>
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>{resource.categoryName}</TableCell>
                      <TableCell>{resource.authorName}</TableCell>
                      <TableCell>{format(resource.publishedAt, 'MMM d, yyyy')}</TableCell>
                      <TableCell>{resource.viewCount}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleFeatured(resource.id)}
                        >
                          {resource.featured ? (
                            <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                          ) : (
                            <StarOff className="h-5 w-5 text-muted-foreground" />
                          )}
                        </Button>
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
                              View Resource
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Resource
                            </DropdownMenuItem>
                            {resource.contentUrl && (
                              <DropdownMenuItem>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Open External Link
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleToggleFeatured(resource.id)}>
                              {resource.featured ? (
                                <>
                                  <StarOff className="h-4 w-4 mr-2" />
                                  Remove from Featured
                                </>
                              ) : (
                                <>
                                  <Star className="h-4 w-4 mr-2" />
                                  Add to Featured
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Resource
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredResources.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                        No resources found matching your search criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            {selectedResources.length > 0 && (
              <CardFooter className="border-t bg-muted/30 justify-between py-2">
                <div className="text-sm text-muted-foreground">
                  {selectedResources.length} resources selected
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Selected
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
        
        {/* Pages Tab Content */}
        <TabsContent value="pages" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pages</CardTitle>
                <CardDescription>
                  Manage static pages and content for the platform.
                </CardDescription>
              </div>
              {selectedPages.length > 0 && (
                <Button 
                  variant="destructive" 
                  className="flex items-center gap-2"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Selected ({selectedPages.length})
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={selectedPages.length === filteredPages.length && filteredPages.length > 0}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all pages"
                      />
                    </TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPages.map((page) => (
                    <TableRow key={page.id} className={selectedPages.includes(page.id) ? "bg-muted/30" : ""}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedPages.includes(page.id)}
                          onCheckedChange={() => toggleSelectPage(page.id)}
                          aria-label={`Select ${page.title}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {page.title}
                      </TableCell>
                      <TableCell>/{page.slug}</TableCell>
                      <TableCell>{format(page.createdAt, 'MMM d, yyyy')}</TableCell>
                      <TableCell>{format(page.updatedAt, 'MMM d, yyyy')}</TableCell>
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
                              View Page
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Page
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Page
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredPages.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                        No pages found matching your search criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            {selectedPages.length > 0 && (
              <CardFooter className="border-t bg-muted/30 justify-between py-2">
                <div className="text-sm text-muted-foreground">
                  {selectedPages.length} pages selected
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Selected
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
        
        {/* Categories Tab Content */}
        <TabsContent value="categories" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Resource Categories</CardTitle>
                <CardDescription>
                  Manage resource categories and classifications.
                </CardDescription>
              </div>
              {selectedCategories.length > 0 && (
                <Button 
                  variant="destructive" 
                  className="flex items-center gap-2"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Selected ({selectedCategories.length})
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={selectedCategories.length === filteredCategories.length && filteredCategories.length > 0}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all categories"
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Resources</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map((category) => (
                    <TableRow key={category.id} className={selectedCategories.includes(category.id) ? "bg-muted/30" : ""}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedCategories.includes(category.id)}
                          onCheckedChange={() => toggleSelectCategory(category.id)}
                          aria-label={`Select ${category.name}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {category.name}
                      </TableCell>
                      <TableCell>{category.resourceCount}</TableCell>
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
                              View Resources
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Category
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Category
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredCategories.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                        No categories found matching your search criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            {selectedCategories.length > 0 && (
              <CardFooter className="border-t bg-muted/30 justify-between py-2">
                <div className="text-sm text-muted-foreground">
                  {selectedCategories.length} categories selected
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Selected
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
      </Tabs>
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the selected items? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmBulkDelete} 
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}