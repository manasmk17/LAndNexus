import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueryFn, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Resource, ResourceCategory } from '@shared/schema';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Loader2, Eye, Star, Search, X, MoreHorizontal, AlertCircle, FileText, ExternalLink } from 'lucide-react';

export function ResourcesPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  // Fetch resources
  const {
    data: resources = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['/api/admin/resources'],
    queryFn: getQueryFn<Resource[]>({ on401: 'throw' }),
  });

  // Fetch resource categories
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/admin/resource-categories'],
    queryFn: getQueryFn<ResourceCategory[]>({ on401: 'throw' }),
  });

  // Filter resources based on search query
  const filteredResources = searchQuery
    ? resources.filter(
        (resource) =>
          resource.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          resource.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          resource.type?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : resources;

  // Toggle featured status mutation
  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, featured }: { id: number; featured: boolean }) => {
      const response = await apiRequest('PATCH', `/api/admin/resources/${id}`, {
        featured,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/resources'] });
      toast({
        title: 'Featured Status Updated',
        description: 'Resource featured status has been updated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update featured status',
        variant: 'destructive',
      });
    },
  });

  // Get category name by id
  const getCategoryName = (categoryId: number) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center text-center p-6">
            <AlertCircle className="h-10 w-10 text-destructive mb-2" />
            <h3 className="text-lg font-semibold">Error Loading Resources</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {error instanceof Error ? error.message : 'Could not load resource data'}
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/resources'] })}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resource Management</CardTitle>
        <CardDescription>View and manage learning resources</CardDescription>
        <div className="flex items-center mt-4 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search resources..."
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
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResources.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No resources found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredResources.map((resource) => (
                    <TableRow key={resource.id}>
                      <TableCell className="font-medium">{resource.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {resource.type || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>{getCategoryName(resource.categoryId)}</TableCell>
                      <TableCell>
                        <Switch
                          checked={!!resource.featured}
                          onCheckedChange={(checked) => 
                            toggleFeaturedMutation.mutate({ id: resource.id, featured: checked })
                          }
                          aria-label="Toggle featured status"
                        />
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
                                setSelectedResource(resource);
                                setShowDetailsDialog(true);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {resource.url && (
                              <DropdownMenuItem
                                onClick={() => window.open(resource.url, '_blank')}
                              >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Open URL
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => window.open(`/resources/${resource.id}`, '_blank')}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              View Page
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

        {/* Resource Details Dialog */}
        {selectedResource && (
          <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{selectedResource.title}</DialogTitle>
                <DialogDescription>
                  Resource details
                </DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="info">Information</TabsTrigger>
                  <TabsTrigger value="content">Content</TabsTrigger>
                </TabsList>
                <TabsContent value="info" className="pt-4">
                  <div className="grid gap-2">
                    <div className="grid grid-cols-3">
                      <div className="font-semibold">Type:</div>
                      <div className="col-span-2">
                        <Badge variant="outline">{selectedResource.type || 'Unknown'}</Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-3">
                      <div className="font-semibold">Category:</div>
                      <div className="col-span-2">{getCategoryName(selectedResource.categoryId)}</div>
                    </div>
                    <div className="grid grid-cols-3">
                      <div className="font-semibold">Author:</div>
                      <div className="col-span-2">{selectedResource.authorName || 'Unknown'}</div>
                    </div>
                    <div className="grid grid-cols-3">
                      <div className="font-semibold">Featured:</div>
                      <div className="col-span-2">
                        <Badge variant={selectedResource.featured ? 'default' : 'outline'}>
                          {selectedResource.featured ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                    </div>
                    {selectedResource.url && (
                      <div className="grid grid-cols-3">
                        <div className="font-semibold">URL:</div>
                        <div className="col-span-2">
                          <a
                            href={selectedResource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center"
                          >
                            {selectedResource.url}
                            <ExternalLink className="ml-1 h-4 w-4" />
                          </a>
                        </div>
                      </div>
                    )}
                    {selectedResource.publishedDate && (
                      <div className="grid grid-cols-3">
                        <div className="font-semibold">Published:</div>
                        <div className="col-span-2">
                          {new Date(selectedResource.publishedDate).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                    {selectedResource.duration && (
                      <div className="grid grid-cols-3">
                        <div className="font-semibold">Duration:</div>
                        <div className="col-span-2">{selectedResource.duration}</div>
                      </div>
                    )}
                    {selectedResource.level && (
                      <div className="grid grid-cols-3">
                        <div className="font-semibold">Level:</div>
                        <div className="col-span-2">{selectedResource.level}</div>
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="content" className="pt-4">
                  {selectedResource.description && (
                    <div className="mb-4">
                      <div className="font-semibold mb-2">Description:</div>
                      <div className="text-sm text-muted-foreground">
                        {selectedResource.description}
                      </div>
                    </div>
                  )}
                  {selectedResource.imageUrl && (
                    <div className="mb-4">
                      <div className="font-semibold mb-2">Image:</div>
                      <img
                        src={selectedResource.imageUrl}
                        alt={selectedResource.title}
                        className="max-h-48 object-contain border rounded"
                      />
                    </div>
                  )}
                  {selectedResource.content && (
                    <div>
                      <div className="font-semibold mb-2">Content:</div>
                      <div className="border rounded-md p-4 max-h-[200px] overflow-y-auto">
                        <div 
                          dangerouslySetInnerHTML={{ __html: selectedResource.content }} 
                          className="prose prose-sm max-w-none"
                        />
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}