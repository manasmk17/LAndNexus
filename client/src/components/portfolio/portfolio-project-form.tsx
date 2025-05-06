import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { insertPortfolioProjectSchema } from "@shared/schema";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { Loader2, Upload, Youtube, Video } from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// Extend the schema to add client-side validation
const projectFormSchema = insertPortfolioProjectSchema.extend({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  industry: z.string().min(2, "Industry must be at least 2 characters"),
  outcomes: z.string().min(10, "Outcomes must be at least 10 characters"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  clientName: z.string().optional(),
  challenges: z.string().optional(),
  solutions: z.string().optional(),
  mediaType: z.enum(["image", "video", "mixed"]).default("image"),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface PortfolioProjectFormProps {
  professionalId: number;
  onSuccess?: () => void;
  defaultValues?: Partial<ProjectFormValues>;
  projectId?: number;
}

export function PortfolioProjectForm({ 
  professionalId, 
  onSuccess, 
  defaultValues, 
  projectId 
}: PortfolioProjectFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [images, setImages] = useState<File[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>(defaultValues?.videoUrls as string[] || []);
  const [videoEmbedCodes, setVideoEmbedCodes] = useState<string[]>(defaultValues?.videoEmbedCodes as string[] || []);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newEmbedCode, setNewEmbedCode] = useState("");
  const [mediaTab, setMediaTab] = useState<string>("images");
  
  // Process default values to handle date conversions
  const processedDefaults = defaultValues ? {
    ...defaultValues,
    // Convert string dates to Date objects if needed
    startDate: defaultValues.startDate instanceof Date 
      ? defaultValues.startDate 
      : defaultValues.startDate ? new Date(defaultValues.startDate) : undefined,
    endDate: defaultValues.endDate instanceof Date 
      ? defaultValues.endDate 
      : defaultValues.endDate ? new Date(defaultValues.endDate) : undefined
  } : undefined;
  
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      professionalId,
      title: "",
      description: "",
      industry: "",
      outcomes: "",
      clientName: "",
      challenges: "",
      solutions: "",
      mediaType: "image",
      ...processedDefaults
    }
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormValues) => {
      const formData = new FormData();
      
      // Determine media type based on content
      const hasImages = images.length > 0;
      const hasVideos = videoUrls.length > 0 || videoEmbedCodes.length > 0;
      let mediaType = "image";
      
      if (hasImages && hasVideos) {
        mediaType = "mixed";
      } else if (hasVideos) {
        mediaType = "video";
      }
      
      // Update the form data with the calculated media type
      const updatedData = {
        ...data,
        mediaType,
        videoUrls,
        videoEmbedCodes
      };
      
      // Add project data
      formData.append("project", JSON.stringify(updatedData));
      
      // Add images
      images.forEach((image, index) => {
        formData.append(`image_${index}`, image);
      });
      
      const url = projectId 
        ? `/api/portfolio-projects/${projectId}` 
        : "/api/portfolio-projects";
      
      const method = projectId ? "PATCH" : "POST";
      
      // Use true for isFormData parameter to handle file uploads correctly
      const response = await apiRequest(method, url, formData, true);
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: projectId ? "Project updated" : "Project added",
        description: projectId 
          ? "Your portfolio project has been updated successfully." 
          : "Your portfolio project has been added to your profile.",
      });
      
      // Invalidate portfolio projects query to refresh the list
      queryClient.invalidateQueries({ queryKey: [`/api/portfolio-projects/professional/${professionalId}`] });
      
      if (onSuccess) {
        onSuccess();
      }
      
      form.reset();
      setImages([]);
      setVideoUrls([]);
      setVideoEmbedCodes([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to ${projectId ? "update" : "add"} portfolio project: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  function onSubmit(data: ProjectFormValues) {
    createProjectMutation.mutate(data);
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setImages(Array.from(e.target.files));
    }
  }
  
  function addVideoUrl() {
    if (newVideoUrl.trim()) {
      setVideoUrls([...videoUrls, newVideoUrl.trim()]);
      setNewVideoUrl("");
    }
  }
  
  function removeVideoUrl(index: number) {
    setVideoUrls(videoUrls.filter((_, i) => i !== index));
  }
  
  function addEmbedCode() {
    if (newEmbedCode.trim()) {
      setVideoEmbedCodes([...videoEmbedCodes, newEmbedCode.trim()]);
      setNewEmbedCode("");
    }
  }
  
  function removeEmbedCode(index: number) {
    setVideoEmbedCodes(videoEmbedCodes.filter((_, i) => i !== index));
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>{projectId ? "Edit Portfolio Project" : "Add Portfolio Project"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Title*</FormLabel>
                  <FormControl>
                    <Input placeholder="Leadership Development Program" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="clientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Name</FormLabel>
                    <FormControl>
                      <Input placeholder="ABC Corporation" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry*</FormLabel>
                    <FormControl>
                      <Input placeholder="Technology" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date*</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field}
                        value={field.value instanceof Date 
                          ? format(field.value, 'yyyy-MM-dd') 
                          : field.value
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field}
                        value={field.value instanceof Date && field.value 
                          ? format(field.value, 'yyyy-MM-dd') 
                          : field.value || ''
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Description*</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the project, its goals, and your role..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="outcomes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Outcomes and Results*</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the measurable outcomes and results achieved..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="challenges"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Challenges Faced</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe any challenges faced during the project..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="solutions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Solutions Implemented</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the solutions you implemented to overcome challenges..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-4">
              <div className="border rounded-md p-4">
                <FormLabel className="text-lg font-semibold block mb-4">Project Media</FormLabel>
                
                <Tabs value={mediaTab} onValueChange={setMediaTab}>
                  <TabsList className="grid grid-cols-3 mb-4">
                    <TabsTrigger value="images" className="flex items-center">
                      <Upload className="mr-2 h-4 w-4" /> Images
                    </TabsTrigger>
                    <TabsTrigger value="videos" className="flex items-center">
                      <Youtube className="mr-2 h-4 w-4" /> Videos
                    </TabsTrigger>
                    <TabsTrigger value="embeds" className="flex items-center">
                      <Video className="mr-2 h-4 w-4" /> Embed Codes
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="images" className="space-y-4">
                    <div>
                      <Input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        onChange={handleImageChange}
                      />
                      <FormDescription className="mt-1">
                        Upload project images and screenshots (.jpg, .png, .gif)
                      </FormDescription>
                    </div>
                    {images.length > 0 && (
                      <div className="p-2 border rounded bg-muted/20">
                        <p className="text-sm font-medium mb-2">Selected Files:</p>
                        <ul className="text-sm space-y-1">
                          {Array.from(images).map((image, index) => (
                            <li key={index} className="flex items-center">
                              <span className="truncate">{image.name}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="videos" className="space-y-4">
                    <div className="flex space-x-2">
                      <Input 
                        placeholder="Paste YouTube or Vimeo URL" 
                        value={newVideoUrl}
                        onChange={(e) => setNewVideoUrl(e.target.value)}
                      />
                      <Button 
                        type="button" 
                        onClick={addVideoUrl}
                        variant="outline"
                      >
                        Add
                      </Button>
                    </div>
                    <FormDescription>
                      Add links to videos hosted on platforms like YouTube or Vimeo
                    </FormDescription>
                    
                    {videoUrls.length > 0 && (
                      <div className="p-2 border rounded bg-muted/20">
                        <p className="text-sm font-medium mb-2">Video URLs:</p>
                        <ul className="text-sm space-y-2">
                          {videoUrls.map((url, index) => (
                            <li key={index} className="flex items-center justify-between">
                              <span className="truncate flex-1">{url}</span>
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm"
                                onClick={() => removeVideoUrl(index)}
                              >
                                Remove
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="embeds" className="space-y-4">
                    <div className="space-y-2">
                      <Textarea 
                        placeholder="Paste video embed code from YouTube, Vimeo, or other platforms" 
                        value={newEmbedCode}
                        onChange={(e) => setNewEmbedCode(e.target.value)}
                      />
                      <div className="flex justify-end">
                        <Button 
                          type="button" 
                          onClick={addEmbedCode}
                          variant="outline"
                        >
                          Add Embed Code
                        </Button>
                      </div>
                    </div>
                    <FormDescription>
                      Add embed codes for videos that allow more customization options
                    </FormDescription>
                    
                    {videoEmbedCodes.length > 0 && (
                      <div className="p-2 border rounded bg-muted/20">
                        <p className="text-sm font-medium mb-2">Embed Codes:</p>
                        <ul className="text-sm space-y-2">
                          {videoEmbedCodes.map((code, index) => (
                            <li key={index} className="flex items-center justify-between">
                              <span className="truncate flex-1 font-mono text-xs">
                                {code.length > 50 ? code.substring(0, 50) + "..." : code}
                              </span>
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm"
                                onClick={() => removeEmbedCode(index)}
                              >
                                Remove
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={createProjectMutation.isPending}
            >
              {createProjectMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {projectId ? "Update Project" : "Add Project"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}