import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bookmark, MapPin, Calendar, Clock, DollarSign, Star, Building } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { JobPosting, CompanyProfile } from "@shared/schema";

interface JobCardProps {
  job: JobPosting;
}

export default function JobCard({ job }: JobCardProps) {
  const { data: company } = useQuery<CompanyProfile>({
    queryKey: [`/api/company-profiles/${job.companyId}`],
  });

  // Format compensation
  const formatCompensation = () => {
    if (!job.minCompensation && !job.maxCompensation) return "Not specified";
    
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
        case "hourly":
          result += "/hour";
          break;
        case "project":
          result += " per project";
          break;
        case "yearly":
          result += "/year";
          break;
      }
    }
    
    return result;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-all duration-300 border border-gray-200 h-full flex flex-col">
      <div className="flex justify-between items-start mb-3 sm:mb-4">
        <div className="flex items-start flex-1 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gray-50 p-2 border border-gray-200 flex items-center justify-center flex-shrink-0">
            {company?.logoUrl ? (
              <img 
                src={company.logoUrl?.startsWith('uploads/') ? `/${company.logoUrl}` : company.logoUrl} 
                alt={company?.companyName || "Company logo"} 
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <Building className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
            )}
          </div>
          <div className="ml-3 sm:ml-4 flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-heading font-medium text-gray-900 truncate">{job.title}</h3>
            <p className="text-primary font-medium text-sm sm:text-base truncate">{company?.companyName || "Loading..."}</p>
          </div>
        </div>
        <Badge className={`
          ml-2 text-xs sm:text-sm flex-shrink-0
          ${job.jobType === "full-time" ? "bg-blue-100 text-blue-800" : ""}
          ${job.jobType === "part-time" ? "bg-indigo-100 text-indigo-800" : ""}
          ${job.jobType === "contract" ? "bg-amber-100 text-amber-800" : ""}
          ${job.jobType === "freelance" ? "bg-green-100 text-green-800" : ""}
        `}>
          {job.jobType.charAt(0).toUpperCase() + job.jobType.slice(1)}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
        <div className="space-y-2">
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Location</h4>
            <p className="flex items-center text-gray-700 text-sm">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
              <span className="truncate">{job.location} {job.remote && "(Remote)"}</span>
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Compensation</h4>
            <p className="flex items-center text-gray-700 font-medium text-sm">
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
              <span className="truncate">{formatCompensation()}</span>
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">
              {job.jobType === "contract" || job.jobType === "freelance" ? "Duration" : "Employment"}
            </h4>
            <p className="flex items-center text-gray-700 text-sm">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
              <span className="truncate">{job.duration || "Permanent"}</span>
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Posted</h4>
            <p className="flex items-center text-gray-700 text-sm">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
              <span className="truncate">{formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}</span>
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex-1">
        <p className="text-gray-700 mb-3 sm:mb-4 text-sm sm:text-base line-clamp-3">
          {job.description.length > 100 
            ? job.description.substring(0, 100) + '...' 
            : job.description}
        </p>
      </div>
      
      <div className="mb-4 sm:mb-5">
        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Required Skills</h4>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {job.requirements.split(',').slice(0, 4).map((skill, index) => (
            <Badge key={index} variant="secondary" className="bg-teal-100 text-teal-800 text-xs">
              {skill.trim()}
            </Badge>
          ))}
          {job.requirements.split(',').length > 4 && (
            <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-xs">
              +{job.requirements.split(',').length - 4}
            </Badge>
          )}
        </div>
      </div>
      
      <div className="flex gap-2 sm:gap-3 mt-auto">
        <Link href={`/job/${job.id}`} className="flex-1">
          <Button className="w-full text-sm sm:text-base">View Details</Button>
        </Link>
        <Button variant="outline" size="sm" className="px-2 sm:px-3">
          <Bookmark className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </div>
    </div>
  );
}
