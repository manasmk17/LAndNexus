import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, getCsrfToken } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { insertResourceSchema, ResourceCategory } from '@shared/schema';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Extend the insert schema to add validation rules
const createResourceSchema = insertResourceSchema.extend({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  content: z.string().url('Please enter a valid URL'),
  contentUrl: z.string().url('Please enter a valid URL').optional().or(z.literal("")),
  resourceType: z.string().min(1, 'Resource type is required'),
  // Make sure authorId is present and valid
  authorId: z.number().int().positive('Author ID is required')
});

type FormValues = z.infer<typeof createResourceSchema>;

export default function CreateResourceForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Fetch resource categories
  const { data: categories, isLoading: isLoadingCategories } = useQuery<ResourceCategory[]>({
    queryKey: ['/api/resource-categories'],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(createResourceSchema),
    defaultValues: {
      title: '',
      description: '',
      resourceType: 'Article',
      content: '', // Content field is used for URL
      contentUrl: '', // Additional URL field
      featured: false,
      authorId: user?.id || 0,
      categoryId: undefined,
      imageUrl: null,
      filePath: null,
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      // Make sure authorId is set from the current user
      values.authorId = user?.id || 0;
      
      // Set contentUrl if it's empty
      if (!values.contentUrl) {
        values.contentUrl = values.content;
      }
      
      console.log('Submitting resource with data:', values);
      
      const response = await apiRequest('POST', '/api/resources', values);
      
      if (response.ok) {
        const resource = await response.json();
        
        toast({
          title: 'Success',
          description: 'Resource created successfully',
        });
        
        // Redirect to the resource detail page
        navigate(`/resources/${resource.id}`);
      } else {
        // Try to get error details from response
        let errorMessage = 'Failed to create resource';
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
          if (errorData.errors) {
            console.error('Validation errors:', errorData.errors);
            errorMessage += ': ' + Object.values(errorData.errors).join(', ');
          }
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error creating resource:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create resource',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Resource</CardTitle>
        <CardDescription>
          Share valuable learning and development resources with the community
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter resource title" {...field} />
                  </FormControl>
                  <FormDescription>
                    A clear, descriptive title for your resource
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the resource and its value to L&D professionals" 
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a detailed description of what the resource contains
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="resourceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resource Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select resource type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Article">Article</SelectItem>
                      <SelectItem value="Video">Video</SelectItem>
                      <SelectItem value="Ebook">Ebook</SelectItem>
                      <SelectItem value="Webinar">Webinar</SelectItem>
                      <SelectItem value="Guide">Guide</SelectItem>
                      <SelectItem value="Template">Template</SelectItem>
                      <SelectItem value="Tool">Tool</SelectItem>
                      <SelectItem value="Course">Course</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    What kind of resource are you sharing?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resource Link</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://example.com/resource" 
                      type="url"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Main URL where users can access the resource
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="contentUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alternate Content URL (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://example.com/alternate-access" 
                      type="url"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Alternative URL for accessing this resource (leave blank to use main URL)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                    defaultValue={field.value?.toString() || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        {isLoadingCategories ? (
                          <div className="flex items-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            <span>Loading categories...</span>
                          </div>
                        ) : (
                          <SelectValue placeholder="Select a category" />
                        )}
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">None</SelectItem>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Categorize your resource to help users find it more easily
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="pt-4">
              <Button type="submit" className="w-full">
                Create Resource
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}