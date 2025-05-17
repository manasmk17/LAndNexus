import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  ArrowRight, 
  FileText, 
  BookOpen, 
  Video, 
  MessageSquare,
  Download,
  BarChart,
  PresentationIcon
} from "lucide-react";
import ResourceCard from "./resource-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { Resource } from "@shared/schema";

export default function ResourceHub() {
  const { data: resources, isLoading, error } = useQuery<Resource[]>({
    queryKey: ["/api/resources/featured?limit=3"],
  });

  return (
    <section className="ld-section bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="ld-section-heading">Resource Hub</h2>
          <p className="ld-section-subheading">
            Access curated learning materials, templates, and insights from top L&D professionals
          </p>
        </div>
        
        {/* Resource Categories */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <Link href="/resources?type=template" className="ld-card flex flex-col items-center py-8 hover:border-primary hover:-translate-y-1 transition-all duration-300">
            <div className="bg-blue-100 text-primary p-5 rounded-xl mb-4">
              <FileText className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-medium text-gray-800">Templates</h3>
            <p className="text-gray-600 text-sm text-center mt-2">
              Ready-to-use professional templates
            </p>
          </Link>
          
          <Link href="/resources?type=article" className="ld-card flex flex-col items-center py-8 hover:border-primary hover:-translate-y-1 transition-all duration-300">
            <div className="bg-green-100 text-green-600 p-5 rounded-xl mb-4">
              <BookOpen className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-medium text-gray-800">Articles</h3>
            <p className="text-gray-600 text-sm text-center mt-2">
              In-depth articles and guides
            </p>
          </Link>
          
          <Link href="/resources?type=video" className="ld-card flex flex-col items-center py-8 hover:border-primary hover:-translate-y-1 transition-all duration-300">
            <div className="bg-amber-100 text-amber-600 p-5 rounded-xl mb-4">
              <Video className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-medium text-gray-800">Videos</h3>
            <p className="text-gray-600 text-sm text-center mt-2">
              Engaging video tutorials
            </p>
          </Link>
          
          <Link href="/resources?type=webinar" className="ld-card flex flex-col items-center py-8 hover:border-primary hover:-translate-y-1 transition-all duration-300">
            <div className="bg-purple-100 text-purple-600 p-5 rounded-xl mb-4">
              <PresentationIcon className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-medium text-gray-800">Webinars</h3>
            <p className="text-gray-600 text-sm text-center mt-2">
              Recorded expert sessions
            </p>
          </Link>
        </div>
        
        {/* Featured Resources */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800">Featured Resources</h3>
            <Link href="/resources" className="text-primary hover:text-primary/80 flex items-center text-sm font-medium">
              View all resources
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="ld-card">
                  <Skeleton className="w-full h-48 rounded-lg" />
                  <div className="p-6 space-y-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <div className="flex justify-between">
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500">Failed to load resources. Please try again later.</p>
            </div>
          ) : resources && resources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {resources.map((resource) => (
                <div key={resource.id} className="ld-card group">
                  <div className="w-full h-48 overflow-hidden rounded-lg mb-4 bg-gray-100 flex items-center justify-center">
                    {resource.imageUrl ? (
                      <img 
                        src={resource.imageUrl} 
                        alt={resource.title} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="text-gray-400">
                        {resource.resourceType === "article" && <BookOpen className="h-12 w-12" />}
                        {resource.resourceType === "template" && <FileText className="h-12 w-12" />}
                        {resource.resourceType === "video" && <Video className="h-12 w-12" />}
                        {resource.resourceType === "webinar" && <PresentationIcon className="h-12 w-12" />}
                        {resource.resourceType === "course" && <BarChart className="h-12 w-12" />}
                        {resource.resourceType === "ebook" && <BookOpen className="h-12 w-12" />}
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-3 flex">
                    <span className={`
                      ${resource.resourceType === "article" ? "bg-green-100 text-green-800" : ""}
                      ${resource.resourceType === "template" ? "bg-blue-100 text-blue-800" : ""}
                      ${resource.resourceType === "video" ? "bg-amber-100 text-amber-800" : ""}
                      ${resource.resourceType === "webinar" ? "bg-purple-100 text-purple-800" : ""}
                      ${resource.resourceType === "course" ? "bg-indigo-100 text-indigo-800" : ""}
                      ${resource.resourceType === "ebook" ? "bg-emerald-100 text-emerald-800" : ""}
                      px-2.5 py-0.5 rounded-full text-xs font-medium
                    `}>
                      {resource.resourceType.charAt(0).toUpperCase() + resource.resourceType.slice(1)}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-primary transition-colors">
                    {resource.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {resource.description}
                  </p>
                  
                  <Link href={`/resource/${resource.id}`} className="ld-button-secondary text-sm w-full justify-center">
                    <Download className="h-4 w-4 mr-2" />
                    Access Resource
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No featured resources yet. Check back soon!</p>
            </div>
          )}
        </div>
        
        {/* CTA */}
        <div className="ld-card-featured mt-16 p-10 text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Ready to share your expertise?</h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Contribute to our resource library and establish yourself as a thought leader in the L&D community
          </p>
          <Button className="ld-button-primary" asChild>
            <Link href="/create-resource">
              Create a Resource
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
