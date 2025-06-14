import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  FileText, 
  BookOpen, 
  Video, 
  HeadphonesIcon,
  User,
  Calendar,
  Eye,
  Tag,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import type { Resource, User as UserType, ResourceCategory } from "@shared/schema";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";

// Custom hook for debounced search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function Resources() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [resourceType, setResourceType] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);
  
  // Debounce search term to prevent excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  // Get type and category from query parameters if any
  const params = new URLSearchParams(window.location.search);
  const typeParam = params.get("type");
  const categoryParam = params.get("category");
  
  // Update resourceType and selectedCategory if specified in URL
  useEffect(() => {
    if (typeParam) {
      setResourceType(typeParam);
    }
    
    if (categoryParam) {
      setSelectedCategory(parseInt(categoryParam));
    }
  }, [typeParam, categoryParam]);
  
  // Fetch resource categories
  const {
    data: categories,
    isLoading: isLoadingCategories,
  } = useQuery<ResourceCategory[]>({
    queryKey: ["/api/resource-categories"],
  });
  
  // Fetch resources with search and filter using debounced search term
  const { 
    data: resources, 
    isLoading: isLoadingResources,
    error: resourcesError
  } = useQuery<Resource[]>({
    queryKey: ["/api/resources/search", { 
      query: debouncedSearchTerm, 
      type: resourceType === "all" ? undefined : resourceType,
      categoryId: selectedCategory 
    }],
    queryFn: async ({ queryKey }) => {
      const [path, params] = queryKey;
      const { query, type, categoryId } = params as { 
        query: string, 
        type: string | undefined,
        categoryId: number | null 
      };
      
      const searchParams = new URLSearchParams();
      if (query && query.trim()) searchParams.append('query', query.trim());
      if (type && type !== 'all') searchParams.append('type', type);
      if (categoryId) searchParams.append('categoryId', categoryId.toString());
      
      const url = `/api/resources/search${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      console.log('Fetching resources with URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch resources: ${response.status}`);
      }
      
      return response.json();
    },
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('401')) return false;
      return failureCount < 2;
    },
  });
  
  // Fetch user details for resources
  const { data: users } = useQuery<UserType[]>({
    queryKey: ["/api/users/batch"],
    enabled: !!resources && resources.length > 0,
    queryFn: async () => {
      // Extract unique author IDs from resources
      const authorIds = resources
        ? Array.from(new Set(resources.map(resource => resource.authorId)))
        : [];
      
      if (authorIds.length === 0) return [];
      
      // Fetch user details for all authors
      const response = await fetch(`/api/users/batch?userIds=${JSON.stringify(authorIds)}`, {
        credentials: "include"
      });
      
      if (!response.ok) {
        console.error("Error fetching resource authors:", await response.text());
        return [];
      }
      
      return await response.json();
    }
  });
  
  // Sort resources by created date (newest first)
  const sortedResources = resources 
    ? [...resources].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : [];

  // Calculate pagination
  const totalItems = sortedResources.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentResources = sortedResources.slice(startIndex, endIndex);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, resourceType, selectedCategory]);
  
  // Helper to get resource type icon
  const getResourceTypeIcon = (type: string) => {
    switch (type) {
      case "article":
        return <BookOpen className="h-5 w-5" />;
      case "template":
        return <FileText className="h-5 w-5" />;
      case "video":
        return <Video className="h-5 w-5" />;
      case "webinar":
        return <HeadphonesIcon className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };
  
  // Helper to get author name
  const getAuthorName = (authorId: number) => {
    const author = users?.find(u => u.id === authorId);
    return author ? `${author.firstName} ${author.lastName}` : "Unknown Author";
  };
  
  // Helper to get resource type badge color
  const getResourceTypeBadgeClass = (type: string) => {
    switch (type) {
      case "article":
        return "bg-teal-100 text-teal-800";
      case "template":
        return "bg-blue-100 text-blue-800";
      case "video":
        return "bg-amber-100 text-amber-800";
      case "webinar":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Resource Hub</h1>
          <p className="text-gray-500">Access L&D materials, templates, and knowledge</p>
        </div>
        
        {user && (
          <Link href="/create-resource">
            <Button className="mt-4 md:mt-0">
              Share a Resource
            </Button>
          </Link>
        )}
      </div>
      
      {/* Resource type tabs */}
      <Tabs defaultValue={resourceType || "all"} onValueChange={setResourceType} className="mb-6">
        <TabsList className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto gap-1 p-1">
          <TabsTrigger value="all" className="text-xs sm:text-sm px-2 py-2">All</TabsTrigger>
          <TabsTrigger value="article" className="text-xs sm:text-sm px-2 py-2">
            <span className="hidden sm:flex items-center">
              <BookOpen className="mr-1 h-3 w-3" /> Articles
            </span>
            <span className="sm:hidden">Articles</span>
          </TabsTrigger>
          <TabsTrigger value="template" className="text-xs sm:text-sm px-2 py-2">
            <span className="hidden sm:flex items-center">
              <FileText className="mr-1 h-3 w-3" /> Templates
            </span>
            <span className="sm:hidden">Templates</span>
          </TabsTrigger>
          <TabsTrigger value="video" className="text-xs sm:text-sm px-2 py-2">
            <span className="hidden sm:flex items-center">
              <Video className="mr-1 h-3 w-3" /> Videos
            </span>
            <span className="sm:hidden">Videos</span>
          </TabsTrigger>
          <TabsTrigger value="webinar" className="text-xs sm:text-sm px-2 py-2">
            <span className="hidden sm:flex items-center">
              <HeadphonesIcon className="mr-1 h-3 w-3" /> Webinars
            </span>
            <span className="sm:hidden">Webinars</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* Search and filter section */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-8">
        <div className="space-y-4">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search resources by title or description..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Category filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/2">
              <Select 
                value={selectedCategory?.toString() || "0"} 
                onValueChange={(value) => setSelectedCategory(value === "0" ? null : parseInt(value))}
              >
                <SelectTrigger className="w-full">
                  <div className="flex items-center">
                    <Tag className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by category" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Categories</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Reset filters button */}
            {(searchTerm || resourceType !== "all" || selectedCategory) && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setResourceType("all");
                  setSelectedCategory(null);
                  setCurrentPage(1);
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Active filters display */}
      <div className="flex flex-wrap gap-2 mb-4">
        {selectedCategory && categories && (
          <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
            <Tag className="h-3 w-3" />
            <span>{categories.find(cat => cat.id === selectedCategory)?.name}</span>
            <button 
              className="ml-1 text-gray-500 hover:text-gray-700" 
              onClick={() => setSelectedCategory(null)}
            >
              ×
            </button>
          </Badge>
        )}
        
        {resourceType && resourceType !== "all" && (
          <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
            {getResourceTypeIcon(resourceType)}
            <span>{resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}</span>
            <button 
              className="ml-1 text-gray-500 hover:text-gray-700" 
              onClick={() => setResourceType("all")}
            >
              ×
            </button>
          </Badge>
        )}
        
        {searchTerm && (
          <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
            <Search className="h-3 w-3" />
            <span>"{searchTerm}"</span>
            <button 
              className="ml-1 text-gray-500 hover:text-gray-700" 
              onClick={() => setSearchTerm("")}
            >
              ×
            </button>
          </Badge>
        )}
      </div>
      
      {/* Results count */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-500">
          {sortedResources.length} resources found
        </p>
      </div>
      
      {/* Resource listings */}
      <div className="space-y-6">
        {isLoadingResources ? (
          // Loading skeletons
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <Card key={index}>
                <Skeleton className="w-full h-48" />
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex justify-between">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : resourcesError ? (
          // Error state
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-red-500 mb-4">Failed to load resources. Please try again later.</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </CardContent>
          </Card>
        ) : currentResources.length > 0 ? (
          // Resource cards
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentResources.map((resource) => (
              <Card key={resource.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="w-full h-48 overflow-hidden">
                  <ImageWithFallback
                    src={resource.imageUrl}
                    alt={resource.title}
                    className="w-full h-full object-cover"
                    fallbackClassName="w-full h-48 flex items-center justify-center bg-gray-100"
                    fallbackContent={getResourceTypeIcon(resource.resourceType)}
                  />
                </div>
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Badge className={`flex items-center ${getResourceTypeBadgeClass(resource.resourceType)}`}>
                      {getResourceTypeIcon(resource.resourceType)}
                      <span className="ml-1">{resource.resourceType.charAt(0).toUpperCase() + resource.resourceType.slice(1)}</span>
                    </Badge>
                    
                    {resource.categoryId && categories?.some(cat => cat.id === resource.categoryId) && (
                      <Badge variant="outline" className="flex items-center">
                        <Tag className="h-3 w-3 mr-1" />
                        <span>{categories?.find(cat => cat.id === resource.categoryId)?.name || "Uncategorized"}</span>
                      </Badge>
                    )}
                    
                    <span className="text-gray-500 text-sm">
                      {format(new Date(resource.createdAt), "MMM d, yyyy")}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-medium mb-2">{resource.title}</h3>
                  <p className="text-gray-700 mb-4 line-clamp-2">{resource.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-500" />
                      </div>
                      <span className="ml-2 text-sm text-gray-500">
                        By {getAuthorName(resource.authorId)}
                      </span>
                    </div>
                    
                    <Link href={`/resource/${resource.id}`}>
                      <Button variant="ghost" size="sm" className="text-primary">
                        <Eye className="mr-1 h-4 w-4" />
                        View
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // Empty state
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-500 mb-4">
                No resources found matching your criteria. Try adjusting your search.
              </p>
              <Button onClick={() => {
                setSearchTerm("");
                setResourceType("all");
                setSelectedCategory(null);
                setCurrentPage(1);
              }}>
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="flex items-center"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => {
                // Show first page, last page, current page, and pages around current
                if (page === 1 || page === totalPages || 
                    Math.abs(page - currentPage) <= 1) {
                  return true;
                }
                return false;
              })
              .map((page, index, array) => {
                // Add ellipsis if there's a gap
                const showEllipsis = index > 0 && array[index - 1] < page - 1;
                return (
                  <div key={page} className="flex items-center">
                    {showEllipsis && <span className="px-2 text-gray-500">...</span>}
                    <Button
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-10 h-10"
                    >
                      {page}
                    </Button>
                  </div>
                );
              })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="flex items-center"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
      
      {/* Results summary */}
      {totalItems > 0 && (
        <div className="text-center text-sm text-gray-500 mt-4">
          Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} resources
        </div>
      )}
    </div>
  );
}
