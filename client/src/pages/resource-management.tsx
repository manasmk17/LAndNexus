import { useQuery, useMutation } from '@tanstack/react-query';
import { Resource } from '@shared/schema';
import { ResourceManager } from '@/components/resources/resource-manager';
import { apiRequest, secureFileUpload, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

export default function ResourceManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch user's resources
  const {
    data: resources,
    isLoading,
    error
  } = useQuery<Resource[]>({
    queryKey: ['/api/me/resources'],
    enabled: !!user,
  });

  // Fetch all resources for admins
  const {
    data: allResources,
    isLoading: isLoadingAll,
  } = useQuery<Resource[]>({
    queryKey: ['/api/resources'],
    enabled: !!user?.isAdmin,
  });

  // Handle file upload
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await secureFileUpload('POST', '/api/resources/upload', formData);
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: (result, files) => {
      toast({
        title: 'Success',
        description: `Uploaded ${files.length} file(s) successfully`,
      });

      // Refresh resources
      queryClient.invalidateQueries({ queryKey: ['/api/me/resources'] });
      if (user?.isAdmin) {
        queryClient.invalidateQueries({ queryKey: ['/api/resources'] });
      }
    },
    onError: (error: any) => {
      console.error('Error uploading files:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload files',
        variant: 'destructive',
      });
    },
  });

  const handleFileUpload = (files: File[]) => {
    if (!user) return;
    uploadMutation.mutate(files);
  };

  // Handle resource removal
  const removeMutation = useMutation({
    mutationFn: async (resourceId: number) => {
      const response = await apiRequest('DELETE', `/api/resources/${resourceId}`);
      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Resource removed successfully',
      });

      // Refresh resources
      queryClient.invalidateQueries({ queryKey: ['/api/me/resources'] });
      if (user?.isAdmin) {
        queryClient.invalidateQueries({ queryKey: ['/api/resources'] });
      }
    },
    onError: (error: any) => {
      console.error('Error removing resource:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove resource',
        variant: 'destructive',
      });
    },
  });

  const handleResourceRemoved = (resource: Resource) => {
    removeMutation.mutate(resource.id);
  };

  if (isLoading) {
    return (
      <div className="container py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Resource Management</h1>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p>Loading your resources...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Resource Management</h1>
        <Card>
          <CardHeader>
            <CardTitle>Error Loading Resources</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <p className="text-red-500 mb-4">
              {(error as any)?.status === 401 
                ? 'Authentication required. Please log in again.' 
                : 'Failed to load resources. Please try again later.'}
            </p>
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/me/resources'] })}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If the user isn't logged in, show a message
  if (!user) {
    return (
      <Card className="mx-auto max-w-4xl">
        <CardHeader>
          <CardTitle className="text-center">
            Please log in to manage resources
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="container py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Resource Management</h1>

      {user.isAdmin ? (
        <Tabs defaultValue="my-resources">
          <TabsList className="grid w-full grid-cols-2 mb-6 h-auto gap-1 p-1">
            <TabsTrigger value="my-resources" className="text-xs sm:text-sm px-2 py-2">
              <span className="hidden sm:inline">My Resources</span>
              <span className="sm:hidden">Mine</span>
            </TabsTrigger>
            <TabsTrigger value="all-resources" className="text-xs sm:text-sm px-2 py-2">
              <span className="hidden sm:inline">All Resources</span>
              <span className="sm:hidden">All</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-resources" className="space-y-4">
            <ResourceManager
              resources={resources || []}
              onFileUpload={handleFileUpload}
              onResourceRemoved={handleResourceRemoved}
            />
          </TabsContent>

          <TabsContent value="all-resources" className="space-y-4">
            {isLoadingAll ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <ResourceManager
                resources={allResources || []}
                onFileUpload={handleFileUpload}
                onResourceRemoved={handleResourceRemoved}
              />
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <ResourceManager
          resources={resources || []}
          onFileUpload={handleFileUpload}
          onResourceRemoved={handleResourceRemoved}
        />
      )}
    </div>
  );
}