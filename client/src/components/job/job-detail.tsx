import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Building, 
  MapPin, 
  Briefcase, 
  Calendar, 
  DollarSign, 
  Globe, 
  Clock, 
  Users, 
  CheckCircle, 
  Bookmark,
  MessageSquare,
  ExternalLink
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import JobApplicationForm from "./job-application-form";
import JobMatches from "./job-matches";
import type { 
  JobPosting, 
  CompanyProfile,
  JobApplication,
  ProfessionalProfile
} from "@shared/schema";

interface JobDetailProps {
  jobId: number;
}

export default function JobDetail({ jobId }: JobDetailProps) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  
  // Fetch job details
  const { 
    data: job, 
    isLoading: isLoadingJob,
    error: jobError
  } = useQuery<JobPosting>({
    queryKey: [`/api/job-postings/${jobId}`],
  });

  // Fetch company details if job exists
  const { 
    data: company, 
    isLoading: isLoadingCompany 
  } = useQuery<CompanyProfile>({
    queryKey: [`/api/company-profiles/${job?.companyId}`],
    enabled: !!job,
  });

  // If user is a professional, fetch their profile
  const { 
    data: professionalProfile 
  } = useQuery<ProfessionalProfile>({
    queryKey: ["/api/professionals/me"],
    enabled: !!user && user.userType === "professional",
  });

  // Check if user has already applied for this job
  const { 
    data: userApplications 
  } = useQuery<JobApplication[]>({
    queryKey: [`/api/professionals/${professionalProfile?.id}/applications`],
    enabled: !!professionalProfile,
  });

  const hasAlreadyApplied = userApplications?.some(
    application => application.jobId === jobId
  );

  // Format compensation range
  const formatCompensation = () => {
    if (!job) return "Not specified";
    
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

  const handleApplyClick = () => {
    if (!user) {
      // Redirect to login if not authenticated
      setLocation(`/login?redirect=/job/${jobId}`);
      return;
    }
    
    if (user.userType !== "professional") {
      // Show error toast or message for company users
      return;
    }
    
    if (!professionalProfile) {
      // Redirect to profile creation
      setLocation("/edit-profile");
      return;
    }
    
    // Show application form
    setShowApplicationForm(true);
  };

  const handleMessageCompany = () => {
    if (!user) {
      // Redirect to login if not authenticated
      setLocation(`/login?redirect=/job/${jobId}`);
      return;
    }
    
    // Navigate to messages with this company
    setLocation(`/messages?company=${company?.id}`);
  };

  if (isLoadingJob) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="space-y-2">
            <Skeleton className="h-10 w-80" />
            <Skeleton className="h-6 w-64" />
          </div>
          <Skeleton className="h-10 w-32 mt-4 md:mt-0" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-7 w-40" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Skeleton className="h-7 w-40" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-7 w-40" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center">
                  <Skeleton className="h-8 w-8 rounded-full mr-3" />
                  <Skeleton className="h-6 w-40" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Skeleton className="h-7 w-40" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (jobError || !job) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold mb-4">Job Not Found</h2>
        <p className="text-gray-600 mb-6">The job posting you're looking for doesn't exist or has been removed.</p>
        <Link href="/jobs">
          <Button>Browse All Jobs</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Section with Company Branding */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="flex items-start gap-4">
              {/* Company Logo */}
              <div className="w-16 h-16 bg-white rounded-lg border border-gray-200 flex items-center justify-center shadow-sm flex-shrink-0">
                {company?.logoUrl ? (
                  <img 
                    src={company.logoUrl?.startsWith('uploads/') ? `/${company.logoUrl}` : company.logoUrl} 
                    alt={company?.companyName || "Company logo"} 
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <Building className="w-8 h-8 text-gray-400" />
                )}
              </div>
              
              {/* Job Title and Company Info */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">{job.title}</h1>
                <div className="space-y-2">
                  {company && (
                    <div className="flex items-center text-lg font-medium text-blue-700">
                      <span>{company.companyName}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-gray-600">
                    <span className="flex items-center gap-1 text-sm">
                      <MapPin className="h-4 w-4" />
                      {job.location} {job.remote && "• Remote"}
                    </span>
                    <span className="flex items-center gap-1 text-sm">
                      <Calendar className="h-4 w-4" />
                      Posted {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                    </span>
                    <Badge className={`text-xs font-medium
                      ${job.jobType === "full-time" ? "bg-blue-100 text-blue-800 border-blue-200" : ""}
                      ${job.jobType === "part-time" ? "bg-purple-100 text-purple-800 border-purple-200" : ""}
                      ${job.jobType === "contract" ? "bg-amber-100 text-amber-800 border-amber-200" : ""}
                      ${job.jobType === "freelance" ? "bg-green-100 text-green-800 border-green-200" : ""}
                    `}>
                      {job.jobType.charAt(0).toUpperCase() + job.jobType.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3 flex-shrink-0">
              <Button variant="outline" size="icon" className="border-gray-300 bg-white hover:bg-gray-50 shadow-sm">
                <Bookmark className="h-4 w-4" />
              </Button>

              {user?.userType === "professional" && !hasAlreadyApplied && (
                <Button 
                  onClick={handleApplyClick} 
                  disabled={!professionalProfile}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 shadow-sm font-medium transition-colors"
                >
                  Easy Apply
                </Button>
              )}

              {user?.userType === "professional" && hasAlreadyApplied && (
                <Button 
                  disabled
                  className="bg-green-600 text-white px-6 py-2 opacity-80 cursor-not-allowed"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Applied
                </Button>
              )}

              <Button 
                onClick={handleMessageCompany}
                variant="outline"
                className="border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 shadow-sm"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Message
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Job Description */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-8 py-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">About the job</h2>
            </div>
            <div className="px-8 py-6">
              <div className="prose prose-gray max-w-none">
                <div className="text-gray-700 leading-relaxed whitespace-pre-line text-base">
                  {job.description}
                </div>
              </div>
            </div>
          </div>
          
          {/* Skills and Requirements */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-8 py-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">Skills and qualifications</h2>
            </div>
            <div className="px-8 py-6">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {job.requirements.split(',').map((skill, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 text-sm font-medium rounded-full hover:bg-blue-100 transition-colors"
                    >
                      {skill.trim()}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {!showApplicationForm && user?.userType === "professional" && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Apply for this position</h3>
                {hasAlreadyApplied && (
                  <div className="flex items-center mt-2 text-green-600 text-sm">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    You have already applied for this job
                  </div>
                )}
              </div>
              <div className="px-6 py-5">
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {hasAlreadyApplied
                    ? "You can check the status of your application in your dashboard."
                    : "Interested in this position? Submit your application now to connect with the employer."}
                </p>
                <Button 
                  onClick={handleApplyClick} 
                  disabled={hasAlreadyApplied || !professionalProfile}
                  className={`w-full py-3 font-medium ${!hasAlreadyApplied && professionalProfile 
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors" 
                    : hasAlreadyApplied 
                      ? "bg-green-600 text-white opacity-80 cursor-not-allowed"
                      : "bg-gray-400 text-white opacity-70"}`}
                >
                  {!professionalProfile ? (
                    <>
                      <User className="mr-2 h-4 w-4" />
                      Complete Your Profile to Apply
                    </>
                  ) : hasAlreadyApplied ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Already Applied
                    </>
                  ) : (
                    <>
                      Easy Apply
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
          
          {showApplicationForm && (
            <JobApplicationForm 
              jobId={jobId} 
              onCancel={() => setShowApplicationForm(false)}
              onSuccess={() => setShowApplicationForm(false)}
            />
          )}
        </div>
        
        <div className="space-y-8">
          {/* Job Details Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm sticky top-6">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Job details</h3>
            </div>
            <div className="px-6 py-5">
              <div className="space-y-6">
                {/* Salary */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Salary</p>
                    <p className="text-base font-semibold text-gray-900">{formatCompensation()}</p>
                  </div>
                </div>
                
                {/* Job Type */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Briefcase className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Job type</p>
                    <p className="text-base font-semibold text-gray-900">
                      {job.jobType.charAt(0).toUpperCase() + job.jobType.slice(1)}
                    </p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Location</p>
                    <p className="text-base font-semibold text-gray-900">
                      {job.location} {job.remote && "• Remote"}
                    </p>
                  </div>
                </div>

                {job.duration && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Duration</p>
                      <p className="text-base font-semibold text-gray-900">{job.duration}</p>
                    </div>
                  </div>
                )}

                {job.remote && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Globe className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Remote work</p>
                      <p className="text-base font-semibold text-green-700">Available</p>
                    </div>
                  </div>
                )}
                
                <Separator />
                
                {/* Application Deadline */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Application deadline</p>
                    <p className="text-base font-semibold text-gray-900">
                      {job.expiresAt 
                        ? format(new Date(job.expiresAt), "MMM d, yyyy")
                        : "Not specified"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {isLoadingCompany ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-6 py-5 border-b border-gray-100">
                <Skeleton className="h-7 w-40" />
              </div>
              <div className="px-6 py-5 space-y-4">
                <div className="flex items-center">
                  <Skeleton className="h-16 w-16 rounded-lg mr-4" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ) : company ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">About the company</h3>
              </div>
              <div className="px-6 py-5">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-16 h-16 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0">
                    {company.logoUrl ? (
                      <img 
                        src={company.logoUrl?.startsWith('uploads/') ? `/${company.logoUrl}` : company.logoUrl} 
                        alt={company.companyName} 
                        className="w-full h-full object-contain p-2 rounded-lg" 
                      />
                    ) : (
                      <Building className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold text-gray-900 mb-1">{company.companyName}</h4>
                    <p className="text-sm text-gray-600 mb-2">{company.industry}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {company.size === "small" && "1-50 employees"}
                        {company.size === "medium" && "51-500 employees"}
                        {company.size === "large" && "501-5000 employees"}
                        {company.size === "enterprise" && "5000+ employees"}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {company.location}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed text-sm">
                    {company.description}
                  </p>
                  
                  <div className="flex gap-3 pt-2">
                    <Link href={`/company/${company.id}`}>
                      <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                        View company page
                      </Button>
                    </Link>
                    {company.website && (
                      <a 
                        href={company.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" size="sm" className="text-gray-600 border-gray-200 hover:bg-gray-50">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Website
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          
          {(user?.userType === "company" || user?.isAdmin) && (
            <JobMatches jobId={jobId} companyId={company?.id} />
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>Similar Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="border rounded-md p-3 hover:bg-gray-50">
                  <h3 className="font-medium">Similar Job Title</h3>
                  <p className="text-sm text-gray-500">Company Name</p>
                  <div className="flex justify-between items-center mt-2">
                    <Badge variant="outline" className="text-xs">Full-time</Badge>
                    <Link href="/jobs">
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </div>
                </div>
                <Link href="/jobs">
                  <Button variant="link" className="text-xs w-full">Browse More Jobs</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
