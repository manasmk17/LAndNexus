import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Resource, User } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { 
  ArrowLeft, 
  Download, 
  Eye, 
  Calendar, 
  User as UserIcon, 
  Tag,
  ExternalLink 
} from 'lucide-react';
import { Link } from 'wouter';

export default function ResourceDetail() {
  const { id } = useParams<{ id: string }>();
  const resourceId = parseInt(id || '0');

  // Fetch resource details
  const { 
    data: resource, 
    isLoading: isLoadingResource,
    error: resourceError 
  } = useQuery<Resource>({
    queryKey: ['/api/resources', resourceId],
    queryFn: async () => {
      const response = await fetch(`/api/resources/${resourceId}`);
      if (!response.ok) {
        throw new Error('Resource not found');
      }
      return response.json();
    },
    enabled: !!resourceId && !isNaN(resourceId),
  });

  // Fetch author details
  const { 
    data: author 
  } = useQuery<User>({
    queryKey: ['/api/me', resource?.authorId],
    queryFn: async () => {
      const response = await fetch(`/api/me/${resource?.authorId}`);
      if (!response.ok) {
        throw new Error('Author not found');
      }
      return response.json();
    },
    enabled: !!resource?.authorId,
  });

  // Helper to get resource type icon and color
  const getResourceTypeInfo = (type: string) => {
    switch (type) {
      case "article":
        return { color: "bg-teal-100 text-teal-800", label: "Article" };
      case "template":
        return { color: "bg-blue-100 text-blue-800", label: "Template" };
      case "video":
        return { color: "bg-amber-100 text-amber-800", label: "Video" };
      case "webinar":
        return { color: "bg-purple-100 text-purple-800", label: "Webinar" };
      default:
        return { color: "bg-gray-100 text-gray-800", label: "Resource" };
    }
  };

  if (isNaN(resourceId)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-red-500 mb-4">Invalid resource ID</p>
            <Button asChild>
              <Link href="/resources">Back to Resources</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoadingResource) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Skeleton className="h-4 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (resourceError || !resource) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-red-500 mb-4">Resource not found</p>
            <Button asChild>
              <Link href="/resources">Back to Resources</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const typeInfo = getResourceTypeInfo(resource.resourceType);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/resources">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Resources
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={typeInfo.color}>
                      <Tag className="mr-1 h-3 w-3" />
                      {typeInfo.label}
                    </Badge>
                    {resource.featured && (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        Featured
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-2xl mb-2 break-words">{resource.title}</CardTitle>
                  <p className="text-muted-foreground break-words">{resource.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Resource Image */}
              {resource.imageUrl && (
                <div className="mb-6">
                  <ImageWithFallback
                    src={resource.imageUrl}
                    alt={resource.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Resource Content */}
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed break-words whitespace-pre-wrap">
                  {resource.content || "No detailed content available for this resource."}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-8">
                {resource.contentUrl && (
                  <Button asChild>
                    <a href={resource.contentUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="mr-2 h-4 w-4" />
                      Download Resource
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Author Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">About the Author</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-gray-500" />
                </div>
                <div>
                  <p className="font-medium">
                    {author ? `${author.firstName} ${author.lastName}` : 'Unknown Author'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {author?.userType === 'professional' ? 'Professional' : 'Author'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resource Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resource Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Published {new Date(resource.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center text-sm">
                <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Resource Type: {typeInfo.label}</span>
              </div>

            </CardContent>
          </Card>

          {/* Related Resources */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">More Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/resources">
                  Browse All Resources
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}