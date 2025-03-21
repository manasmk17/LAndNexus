import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { FileText, BookOpen, Video, HeadphonesIcon, User } from "lucide-react";
import type { Resource, User } from "@shared/schema";

interface ResourceCardProps {
  resource: Resource;
}

export default function ResourceCard({ resource }: ResourceCardProps) {
  const { data: author } = useQuery<User>({
    queryKey: [`/api/me/${resource.authorId}`],
  });

  const getResourceTypeIcon = () => {
    switch (resource.resourceType) {
      case "article":
        return <BookOpen className="h-4 w-4" />;
      case "template":
        return <FileText className="h-4 w-4" />;
      case "video":
        return <Video className="h-4 w-4" />;
      case "webinar":
        return <HeadphonesIcon className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getResourceTypeColor = () => {
    switch (resource.resourceType) {
      case "article":
        return "bg-teal-100 text-teal-600";
      case "template":
        return "bg-blue-100 text-blue-600";
      case "video":
        return "bg-amber-100 text-amber-600";
      case "webinar":
        return "bg-purple-100 text-purple-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  // Determine resource reading time or duration text
  const getResourceMeta = () => {
    switch (resource.resourceType) {
      case "article":
        const wordCount = resource.content.split(/\s+/).length;
        const readingTime = Math.max(1, Math.ceil(wordCount / 200)); // Assuming 200 words per minute
        return `${readingTime} min read`;
      case "video":
      case "webinar":
        return "45 min"; // Mock duration
      default:
        return "";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {resource.imageUrl ? (
        <img 
          src={resource.imageUrl} 
          alt={resource.title} 
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
          {getResourceTypeIcon()}
        </div>
      )}
      <div className="p-6">
        <div className="flex items-center mb-3">
          <Badge className={`flex items-center space-x-1 ${getResourceTypeColor()}`}>
            {getResourceTypeIcon()}
            <span className="ml-1">{resource.resourceType.charAt(0).toUpperCase() + resource.resourceType.slice(1)}</span>
          </Badge>
          {getResourceMeta() && (
            <span className="text-gray-500 text-sm ml-3">{getResourceMeta()}</span>
          )}
        </div>
        <h3 className="text-xl font-heading font-medium mb-2">{resource.title}</h3>
        <p className="text-gray-700 mb-4 line-clamp-2">
          {resource.description}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {author?.firstName ? (
                <span className="font-medium text-sm">
                  {author.firstName.charAt(0)}{author.lastName.charAt(0)}
                </span>
              ) : (
                <User className="w-4 h-4 text-gray-400" />
              )}
            </div>
            <span className="ml-2 text-sm text-gray-500">
              By {author ? `${author.firstName} ${author.lastName}` : "Unknown Author"}
            </span>
          </div>
          <Link href={`/resource/${resource.id}`}>
            <a className="text-primary hover:text-primary-dark text-sm font-medium">
              {resource.resourceType === "template" ? "Download" : 
               resource.resourceType === "video" ? "Watch" : 
               resource.resourceType === "webinar" ? "Watch" : "Read More"}
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}
