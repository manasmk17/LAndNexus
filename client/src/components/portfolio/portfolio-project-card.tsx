import { useState } from "react";
import { format } from "date-fns";
import { PortfolioProject } from "@shared/schema";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Eye, ChevronDown, ChevronUp, CalendarDays, Building, Award, Star, Video, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PortfolioProjectCardProps {
  project: PortfolioProject;
  onEdit: (project: PortfolioProject) => void;
}

export function PortfolioProjectCard({ project, onEdit }: PortfolioProjectCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/portfolio-projects/${project.id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Project deleted",
        description: "The portfolio project has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/portfolio-projects/professional/${project.professionalId}`] });
      setDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete portfolio project: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const toggleFeatureMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "PATCH", 
        `/api/portfolio-projects/${project.id}/featured`, 
        { featured: !project.featured }
      );
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.featured ? "Project featured" : "Project unfeatured",
        description: data.featured 
          ? "This project will be highlighted on your profile" 
          : "This project has been removed from featured projects",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/portfolio-projects/professional/${project.professionalId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update featured status: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleDelete = () => {
    deleteProjectMutation.mutate();
  };

  // Format dates for display
  const startDate = project.startDate ? format(new Date(project.startDate), 'MMM yyyy') : '';
  const endDate = project.endDate ? format(new Date(project.endDate), 'MMM yyyy') : 'Present';
  const dateRange = `${startDate} - ${endDate}`;

  // Parse media content
  const images = project.imageUrls ? (Array.isArray(project.imageUrls) ? project.imageUrls : []) : [];
  const videoUrls = project.videoUrls ? (Array.isArray(project.videoUrls) ? project.videoUrls : []) : [];
  const videoEmbedCodes = project.videoEmbedCodes ? (Array.isArray(project.videoEmbedCodes) ? project.videoEmbedCodes : []) : [];
  const hasVideos = videoUrls.length > 0 || videoEmbedCodes.length > 0;
  
  // Determine media type display
  const mediaType = project.mediaType || (hasVideos ? (images.length > 0 ? "mixed" : "video") : "image");
  
  // Function to render a video from URL or embed code
  const renderVideo = (video: string, isEmbedCode = false) => {
    if (isEmbedCode) {
      return (
        <div 
          dangerouslySetInnerHTML={{ __html: video }}
          className="rounded-md overflow-hidden w-full aspect-video"
        />
      );
    }
    
    // Handle YouTube URLs
    if (video.includes('youtube.com') || video.includes('youtu.be')) {
      const videoId = video.includes('youtube.com/watch?v=') 
        ? video.split('v=')[1].split('&')[0]
        : video.includes('youtu.be/')
          ? video.split('youtu.be/')[1].split('?')[0]
          : '';
          
      if (videoId) {
        return (
          <iframe 
            src={`https://www.youtube.com/embed/${videoId}`}
            className="rounded-md w-full aspect-video"
            allowFullScreen
          />
        );
      }
    }
    
    // Handle Vimeo URLs
    if (video.includes('vimeo.com')) {
      const videoId = video.split('vimeo.com/')[1];
      if (videoId) {
        return (
          <iframe 
            src={`https://player.vimeo.com/video/${videoId}`}
            className="rounded-md w-full aspect-video"
            allowFullScreen
          />
        );
      }
    }
    
    // Fallback for other video URLs
    return (
      <div className="rounded-md bg-muted flex items-center justify-center h-24">
        <Video className="h-8 w-8 text-muted-foreground" />
        <span className="text-sm ml-2">Video</span>
      </div>
    );
  };

  return (
    <>
      <Card className="w-full mb-4 overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">
                {project.title}
                {mediaType === "video" && (
                  <Badge variant="outline" className="ml-2">
                    <Video className="h-3 w-3 mr-1" />
                    Video
                  </Badge>
                )}
                {mediaType === "mixed" && (
                  <Badge variant="outline" className="ml-2">
                    <ImageIcon className="h-3 w-3 mr-1" />
                    <Video className="h-3 w-3 mx-1" />
                    Mixed Media
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="flex items-center mt-1">
                <Building className="h-4 w-4 mr-1" />
                {project.clientName || "Confidential Client"} • {project.industry}
              </CardDescription>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <CalendarDays className="h-4 w-4 mr-1" />
                {dateRange}
              </div>
            </div>
            {project.featured && (
              <Badge variant="secondary" className="ml-2">
                <Award className="h-3 w-3 mr-1" /> Featured
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <p className="text-sm mb-2 line-clamp-2">{project.description}</p>
          
          {expanded && (
            <div className="mt-4 space-y-4">
              <div>
                <h4 className="font-medium mb-1">Outcomes</h4>
                <p className="text-sm">{project.outcomes}</p>
              </div>
              
              {project.challenges && (
                <div>
                  <h4 className="font-medium mb-1">Challenges</h4>
                  <p className="text-sm">{project.challenges}</p>
                </div>
              )}
              
              {project.solutions && (
                <div>
                  <h4 className="font-medium mb-1">Solutions</h4>
                  <p className="text-sm">{project.solutions}</p>
                </div>
              )}
              
              {(images.length > 0 || hasVideos) && (
                <div>
                  <h4 className="font-medium mb-2">Project Media</h4>
                  
                  {hasVideos && videoUrls.length > 0 && (
                    <div className="mb-3">
                      {renderVideo(videoUrls[0])}
                      {videoUrls.length > 1 && (
                        <div className="mt-2 text-center">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setViewDialogOpen(true)}
                          >
                            View All Videos ({videoUrls.length})
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {hasVideos && videoUrls.length === 0 && videoEmbedCodes.length > 0 && (
                    <div className="mb-3">
                      {renderVideo(videoEmbedCodes[0], true)}
                      {videoEmbedCodes.length > 1 && (
                        <div className="mt-2 text-center">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setViewDialogOpen(true)}
                          >
                            View All Videos ({videoEmbedCodes.length})
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {images.slice(0, 3).map((image, index) => (
                        <img 
                          key={index}
                          src={image}
                          alt={`Project image ${index + 1}`}
                          className="rounded-md object-cover h-24 w-full"
                        />
                      ))}
                      {images.length > 3 && (
                        <div 
                          className="rounded-md bg-muted flex items-center justify-center h-24"
                          onClick={() => setViewDialogOpen(true)}
                        >
                          <span className="text-sm">+{images.length - 3} more</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-2 px-0"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Show more
              </>
            )}
          </Button>
        </CardContent>
        
        <CardFooter className="flex justify-between pt-0">
          <Button
            variant={project.featured ? "secondary" : "outline"}
            size="sm"
            onClick={() => toggleFeatureMutation.mutate()}
            disabled={toggleFeatureMutation.isPending}
            className="mr-auto"
          >
            <Star className={`h-4 w-4 mr-1 ${project.featured ? "fill-current" : ""}`} />
            {project.featured ? "Featured" : "Mark as featured"}
          </Button>
          
          <div className="flex">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewDialogOpen(true)}
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(project)}
            >
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this portfolio project? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleteProjectMutation.isPending}
            >
              {deleteProjectMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Project Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{project.title}</DialogTitle>
            <DialogDescription>
              {project.clientName || "Confidential Client"} • {project.industry} • {dateRange}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[calc(90vh-10rem)]">
            <div className="space-y-6 p-1">
              <div>
                <h3 className="font-medium text-lg mb-2">Description</h3>
                <p>{project.description}</p>
              </div>
              
              <div>
                <h3 className="font-medium text-lg mb-2">Outcomes</h3>
                <p>{project.outcomes}</p>
              </div>
              
              {project.challenges && (
                <div>
                  <h3 className="font-medium text-lg mb-2">Challenges</h3>
                  <p>{project.challenges}</p>
                </div>
              )}
              
              {project.solutions && (
                <div>
                  <h3 className="font-medium text-lg mb-2">Solutions</h3>
                  <p>{project.solutions}</p>
                </div>
              )}
              
              {(images.length > 0 || hasVideos) && (
                <div className="pt-4">
                  <h3 className="font-medium text-lg mb-4">Project Media</h3>
                  
                  {(images.length > 0 && hasVideos) ? (
                    <Tabs defaultValue="images" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="images" className="flex items-center gap-2">
                          <ImageIcon className="h-4 w-4" /> Images ({images.length})
                        </TabsTrigger>
                        <TabsTrigger value="videos" className="flex items-center gap-2">
                          <Video className="h-4 w-4" /> Videos ({videoUrls.length + videoEmbedCodes.length})
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="images" className="mt-0">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {images.map((image, index) => (
                            <img 
                              key={index}
                              src={image}
                              alt={`Project image ${index + 1}`}
                              className="rounded-md object-cover h-48 w-full"
                            />
                          ))}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="videos" className="mt-0">
                        <div className="space-y-6">
                          {videoUrls.map((url, index) => (
                            <div key={`url-${index}`} className="mb-4">
                              <p className="text-sm text-muted-foreground mb-2">Video {index + 1}</p>
                              {renderVideo(url)}
                            </div>
                          ))}
                          
                          {videoEmbedCodes.map((code, index) => (
                            <div key={`embed-${index}`} className="mb-4">
                              <p className="text-sm text-muted-foreground mb-2">Embedded Video {index + 1}</p>
                              {renderVideo(code, true)}
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    </Tabs>
                  ) : images.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {images.map((image, index) => (
                        <img 
                          key={index}
                          src={image}
                          alt={`Project image ${index + 1}`}
                          className="rounded-md object-cover h-48 w-full"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {videoUrls.map((url, index) => (
                        <div key={`url-${index}`} className="mb-4">
                          <p className="text-sm text-muted-foreground mb-2">Video {index + 1}</p>
                          {renderVideo(url)}
                        </div>
                      ))}
                      
                      {videoEmbedCodes.map((code, index) => (
                        <div key={`embed-${index}`} className="mb-4">
                          <p className="text-sm text-muted-foreground mb-2">Embedded Video {index + 1}</p>
                          {renderVideo(code, true)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}