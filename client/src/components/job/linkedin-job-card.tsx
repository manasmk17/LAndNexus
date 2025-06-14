import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Building, 
  MapPin, 
  Clock, 
  Users, 
  Bookmark,
  MoreHorizontal,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import type { JobPosting, CompanyProfile } from "@shared/schema";

interface LinkedInJobCardProps {
  job: JobPosting;
}

export default function LinkedInJobCard({ job }: LinkedInJobCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);

  const { data: company } = useQuery<CompanyProfile>({
    queryKey: [`/api/company-profiles/${job.companyId}`],
  });

  const formatCompensation = () => {
    if (!job.minCompensation && !job.maxCompensation) return null;
    
    let result = "";
    if (job.minCompensation && job.maxCompensation) {
      result = `$${job.minCompensation.toLocaleString()} - $${job.maxCompensation.toLocaleString()}`;
    } else if (job.minCompensation) {
      result = `$${job.minCompensation.toLocaleString()}+`;
    } else if (job.maxCompensation) {
      result = `Up to $${job.maxCompensation.toLocaleString()}`;
    }
    
    if (job.compensationUnit) {
      switch (job.compensationUnit) {
        case "hourly": result += "/hr"; break;
        case "project": result += "/project"; break;
        case "yearly": result += "/year"; break;
      }
    }
    return result;
  };

  const timeAgo = formatDistanceToNow(new Date(job.createdAt), { addSuffix: true });

  return (
    <div className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200">
      {/* Header with company logo and job title */}
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3">
          {/* Company Logo */}
          <div className="w-12 h-12 rounded bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
            {company?.logoUrl ? (
              <img 
                src={company.logoUrl?.startsWith('uploads/') ? `/${company.logoUrl}` : company.logoUrl} 
                alt={company?.companyName || "Company logo"} 
                className="w-10 h-10 object-contain rounded"
              />
            ) : (
              <Building className="w-6 h-6 text-gray-400" />
            )}
          </div>

          {/* Job Title and Company Info */}
          <div className="flex-1 min-w-0">
            <Link href={`/job/${job.id}`}>
              <h3 className="text-base font-semibold text-gray-900 hover:text-blue-600 cursor-pointer line-clamp-2 leading-tight mb-1">
                {job.title}
              </h3>
            </Link>
            <p className="text-sm text-gray-700 font-medium mb-1">
              {company?.companyName || "Loading..."}
            </p>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="w-3 h-3" />
              <span>{job.location}</span>
              <span className="mx-1">•</span>
              <Clock className="w-3 h-3" />
              <span>{timeAgo}</span>
            </div>
          </div>

          {/* Action Menu */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-gray-100"
              onClick={() => setIsBookmarked(!isBookmarked)}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current text-blue-600' : 'text-gray-500'}`} />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
              <MoreHorizontal className="w-4 h-4 text-gray-500" />
            </Button>
          </div>
        </div>
      </div>

      {/* Job Details */}
      <div className="px-4 pb-2">
        {/* Job Type and Compensation */}
        <div className="flex items-center gap-2 mb-2">
          <Badge 
            variant="secondary" 
            className="text-xs bg-green-50 text-green-700 border-green-200"
          >
            {job.jobType.charAt(0).toUpperCase() + job.jobType.slice(1)}
          </Badge>
          {formatCompensation() && (
            <span className="text-sm text-gray-600 font-medium">
              {formatCompensation()}
            </span>
          )}
        </div>

        {/* Description Preview */}
        {job.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3 leading-relaxed">
            {job.description.replace(/<[^>]*>/g, '').substring(0, 150)}
            {job.description.length > 150 && '...'}
          </p>
        )}

        {/* Skills Tags */}
        {job.requirements && (
          <div className="flex flex-wrap gap-1 mb-3">
            {job.requirements.split(',').slice(0, 3).map((skill, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="text-xs bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
              >
                {skill.trim()}
              </Badge>
            ))}
            {job.requirements.split(',').length > 3 && (
              <span className="text-xs text-gray-500 self-center">
                +{job.requirements.split(',').length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="border-t border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Users className="w-3 h-3" />
            <span>Be among the first 25 applicants</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/job/${job.id}`}>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs h-7 px-3 hover:bg-gray-50 border-gray-300"
              >
                View details
              </Button>
            </Link>
            <Link href={`/job/${job.id}#apply`}>
              <Button 
                size="sm" 
                className="text-xs h-7 px-4 bg-blue-600 hover:bg-blue-700"
              >
                Easy Apply
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}