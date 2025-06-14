import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, GripVertical, Trash2 } from 'lucide-react';
import { Resource } from '@shared/schema';

import { useToast } from '@/hooks/use-toast';

interface ResourceManagerProps {
  resources: Resource[];
  onResourceRemoved?: (resource: Resource) => void;
  onResourceAdded?: (resource: Resource) => void;
  onFileUpload?: (files: File[]) => Promise<void>;
}

/**
 * A component for managing resources with drag and drop functionality
 */
export function ResourceManager({
  resources,
  onResourceRemoved,
  onResourceAdded,
  onFileUpload
}: ResourceManagerProps) {
  const [items, setItems] = useState<Resource[]>(resources);
  const { toast } = useToast();

  // Handle removing resources
  const handleRemove = (resource: Resource) => {
    const updatedItems = items.filter(item => item.id !== resource.id);
    setItems(updatedItems);
    if (onResourceRemoved) {
      onResourceRemoved(resource);
    }
  };

  // Handle file uploads
  const handleFilesAdded = async (files: File[]) => {
    if (onFileUpload) {
      try {
        await onFileUpload(files);
        toast({
          title: 'Files uploaded successfully',
          description: `${files.length} file${files.length !== 1 ? 's' : ''} uploaded.`,
        });
      } catch (error) {
        toast({
          title: 'Upload failed',
          description: error instanceof Error ? error.message : 'An unknown error occurred',
          variant: 'destructive',
        });
      }
    } else {
      // Default implementation if no onFileUpload provided
      try {
        const formData = new FormData();
        
        // Append each file to the FormData object
        files.forEach(file => {
          formData.append('files', file);
        });
        
        // Make the API request to upload files
        const response = await fetch('/api/resources/upload', {
          method: 'POST',
          body: formData,
          // No need to set Content-Type header, it will be set automatically with the boundary
        });
        
        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }
        
        const uploadedResources = await response.json();
        
        // Add uploaded resources to the list
        const newItems = [...items, ...uploadedResources];
        setItems(newItems);
        
        if (onResourceAdded && uploadedResources.length > 0) {
          uploadedResources.forEach((resource: Resource) => onResourceAdded(resource));
        }
        
        toast({
          title: 'Files uploaded successfully',
          description: `${files.length} file${files.length !== 1 ? 's' : ''} uploaded.`,
        });
      } catch (error) {
        toast({
          title: 'Upload failed',
          description: error instanceof Error ? error.message : 'An unknown error occurred',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Manage Resources</CardTitle>
          <CardDescription>
            Drag and drop to reorder resources or upload new files
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* File upload area */}
          <div className="mb-6 p-6 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (onFileUpload) {
                  onFileUpload(files);
                }
              }}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Supported formats: PDF, JPEG, PNG, DOC, DOCX (max 10MB each)
            </p>
          </div>

          {/* Resource list */}
          <div className="space-y-2">
            <div className="font-medium">Current Resources</div>
            <div className="space-y-2">
              {items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <div>
                        <div className="font-medium">{item.title}</div>
                        <div className="text-sm text-gray-500">{item.resourceType}</div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onResourceRemoved) {
                          onResourceRemoved(item);
                        }
                      }}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Action button */}
          <div className="mt-4">
            <Button
              className="w-full"
              onClick={() => {
                if (onResourceAdded) {
                  // This would typically open a modal or navigate to a create resource page
                  // For now, we'll just show a toast
                  toast({
                    title: 'Create Resource',
                    description: 'This would open a modal or navigate to a create resource page.',
                  });
                }
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Add New Resource
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}