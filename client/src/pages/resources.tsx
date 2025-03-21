import { useState } from "react";
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
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import type { Resource, User as UserType } from "@shared/schema";

export default function Resources() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [resourceType, setResourceType] = useState<string>("");
  
  // Get type from query parameters if any
  const params = new URLSearchParams(window.location.search);
  const typeParam = params.get("type");
  
  // Update resourceType if specified in URL
  useState(() => {
    if (typeParam) {
      setResourceType(typeParam);
    }
  });
  
  // Fetch resources with search and filter
  const { 
    data: resources, 
    isLoading: isLoadingResources,
    error: resourcesError
  } = useQuery<Resource[]>({
    queryKey: ["/api/resources", { query: searchTerm, type: resourceType }],
    queryFn: async ({ queryKey }) => {
      const [path, params] = queryKey;
      const { query, type } = params as { query: string, type: string };
      
      const searchParams = new URLSearchParams();
      if (query) searchParams.append('query', query);
      if (type && type !== 'all') searchParams.append('type', type);
      
      const url = `${path}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch resources');
      }
      
      return response.json();
    },
  });
  
  // Fetch user details for resources
  const { data: users } = useQuery<UserType[]>({
    queryKey: ["/api/users/batch"],
    enabled: !!resources && resources.length > 0,
  });
  
  // Sort resources by created date (newest first)
  const sortedResources = resources 
    ? [...resources].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : [];
  
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
        <TabsList className="w-full md:w-auto grid grid-cols-5 md:inline-flex">
          <TabsTrigger value="all" className="flex items-center">All</TabsTrigger>
          <TabsTrigger value="article" className="flex items-center">
            <BookOpen className="mr-2 h-4 w-4" /> Articles
          </TabsTrigger>
          <TabsTrigger value="template" className="flex items-center">
            <FileText className="mr-2 h-4 w-4" /> Templates
          </TabsTrigger>
          <TabsTrigger value="video" className="flex items-center">
            <Video className="mr-2 h-4 w-4" /> Videos
          </TabsTrigger>
          <TabsTrigger value="webinar" className="flex items-center">
            <HeadphonesIcon className="mr-2 h-4 w-4" /> Webinars
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* Search section */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search resources by title or description..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
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
        ) : sortedResources.length > 0 ? (
          // Resource cards
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedResources.map((resource) => (
              <Card key={resource.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {resource.imageUrl ? (
                  <div className="w-full h-48 overflow-hidden">
                    <img 
                      src={resource.imageUrl} 
                      alt={resource.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                    {getResourceTypeIcon(resource.resourceType)}
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="flex items-center mb-3">
                    <Badge className={`flex items-center ${getResourceTypeBadgeClass(resource.resourceType)}`}>
                      {getResourceTypeIcon(resource.resourceType)}
                      <span className="ml-1">{resource.resourceType.charAt(0).toUpperCase() + resource.resourceType.slice(1)}</span>
                    </Badge>
                    <span className="text-gray-500 text-sm ml-3">
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
                setResourceType("");
              }}>
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Pagination (simplified for now) */}
      {sortedResources.length > 0 && (
        <div className="flex justify-center mt-8">
          <Button variant="outline" className="mx-1">1</Button>
          <Button variant="outline" className="mx-1">2</Button>
          <Button variant="outline" className="mx-1">3</Button>
          <Button variant="outline" className="mx-1">Next</Button>
        </div>
      )}
    </div>
  );
}
