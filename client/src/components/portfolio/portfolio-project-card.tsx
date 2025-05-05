import { useState } from "react";
import { format } from "date-fns";
import { PortfolioProject } from "@shared/schema";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Eye, ChevronDown, ChevronUp, CalendarDays, Building, Award } from "lucide-react";
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

  const handleDelete = () => {
    deleteProjectMutation.mutate();
  };

  // Format dates for display
  const startDate = project.startDate ? format(new Date(project.startDate), 'MMM yyyy') : '';
  const endDate = project.endDate ? format(new Date(project.endDate), 'MMM yyyy') : 'Present';
  const dateRange = `${startDate} - ${endDate}`;

  // Parse image URLs
  const images = project.imageUrls ? (Array.isArray(project.imageUrls) ? project.imageUrls : []) : [];

  return (
    <>
      <Card className="w-full mb-4 overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{project.title}</CardTitle>
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
              
              {images.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Project Images</h4>
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
        
        <CardFooter className="flex justify-end pt-0">
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
              
              {images.length > 0 && (
                <div>
                  <h3 className="font-medium text-lg mb-2">Project Gallery</h3>
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
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}