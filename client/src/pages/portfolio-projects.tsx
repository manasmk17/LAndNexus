import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { PortfolioProject } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { PortfolioProjectForm } from "@/components/portfolio/portfolio-project-form";
import { PortfolioProjectCard } from "@/components/portfolio/portfolio-project-card";
import { Plus, Briefcase, ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export default function PortfolioProjectsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<PortfolioProject | null>(null);
  
  // Get the professional profile ID for the current user
  const { data: profile = null, isLoading: profileLoading } = useQuery<any>({
    queryKey: [`/api/professional-profiles/user/${user?.id}`],
    enabled: !!user?.id,
  });
  
  // Fetch portfolio projects for the professional
  const { 
    data: projects = [], 
    isLoading: projectsLoading,
    isError,
    error
  } = useQuery<PortfolioProject[]>({
    queryKey: [`/api/portfolio-projects/professional/${profile?.id}`],
    enabled: !!profile?.id,
  });

  const handleAddProject = () => {
    setCurrentProject(null);
    setIsFormOpen(true);
  };

  const handleEditProject = (project: PortfolioProject) => {
    setCurrentProject(project);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setCurrentProject(null);
  };

  if (profileLoading) {
    return (
      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-12 w-64 mb-6" />
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Portfolio Projects</h1>
          <p className="mb-6">You need to create a professional profile before adding portfolio projects.</p>
          <Button asChild>
            <Link to="/edit-profile">Create Professional Profile</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" asChild className="mr-2">
              <Link to="/professional-profile">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Profile
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Portfolio Projects</h1>
          </div>
          <Button onClick={handleAddProject}>
            <Plus className="h-4 w-4 mr-1" />
            Add Project
          </Button>
        </div>

        {isError && (
          <div className="p-4 mb-6 bg-destructive/10 text-destructive rounded-md">
            <p>Error loading portfolio projects: {error?.message || "Unknown error"}</p>
          </div>
        )}
        
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Projects</TabsTrigger>
            <TabsTrigger value="featured">Featured Projects</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            {projectsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            ) : projects?.length ? (
              <div>
                {projects.map((project: PortfolioProject) => (
                  <PortfolioProjectCard 
                    key={project.id} 
                    project={project} 
                    onEdit={handleEditProject} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border rounded-lg">
                <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No portfolio projects yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start building your portfolio by adding your first project
                </p>
                <Button onClick={handleAddProject}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Your First Project
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="featured">
            {projectsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-48 w-full" />
              </div>
            ) : projects?.filter((p: PortfolioProject) => p.featured)?.length ? (
              <div>
                {projects
                  .filter((project: PortfolioProject) => project.featured)
                  .map((project: PortfolioProject) => (
                    <PortfolioProjectCard 
                      key={project.id} 
                      project={project} 
                      onEdit={handleEditProject} 
                    />
                  ))
                }
              </div>
            ) : (
              <div className="text-center py-12 border rounded-lg">
                <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No featured projects</h3>
                <p className="text-muted-foreground mb-4">
                  Mark your best projects as featured to showcase them to potential clients
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{currentProject ? "Edit Project" : "Add New Project"}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <PortfolioProjectForm 
              professionalId={profile.id}
              onSuccess={handleFormClose}
              defaultValues={currentProject ? {
                // Extract only the properties needed by the form schema
                title: currentProject.title,
                professionalId: currentProject.professionalId,
                description: currentProject.description,
                industry: currentProject.industry,
                outcomes: currentProject.outcomes,
                // Handle nullable fields
                clientName: currentProject.clientName || undefined,
                challenges: currentProject.challenges || undefined,
                solutions: currentProject.solutions || undefined,
                featured: currentProject.featured || undefined,
                // Convert dates
                startDate: currentProject.startDate ? new Date(currentProject.startDate) : undefined,
                endDate: currentProject.endDate ? new Date(currentProject.endDate) : undefined
              } : undefined}
              projectId={currentProject?.id}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}