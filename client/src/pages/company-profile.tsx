import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Building, MapPin, Users, Globe, Calendar, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import type { CompanyProfile as CompanyProfileType, JobPosting } from "@shared/schema";

export default function CompanyProfile() {
  const { id } = useParams();
  const companyId = parseInt(id || "0");

  const { data: company, isLoading, error } = useQuery<CompanyProfileType>({
    queryKey: [`/api/company-profiles/${companyId}`],
    enabled: !isNaN(companyId) && companyId > 0
  });

  const { data: jobs, isLoading: jobsLoading } = useQuery<JobPosting[]>({
    queryKey: [`/api/companies/${companyId}/job-postings`],
    enabled: !isNaN(companyId) && companyId > 0
  });

  if (isNaN(companyId)) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Company ID</h1>
            <Link href="/jobs">
              <Button>Browse Jobs</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Company Not Found</h1>
            <p className="text-gray-600 mb-6">The company profile you're looking for doesn't exist.</p>
            <Link href="/jobs">
              <Button>Browse Jobs</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!company && isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-16 w-16 rounded" />
                    <div>
                      <Skeleton className="h-6 w-48 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            </div>
            <div>
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Company Header */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                    {company.logoUrl ? (
                      <img 
                        src={company.logoUrl?.startsWith('uploads/') ? `/${company.logoUrl}` : company.logoUrl} 
                        alt={company.companyName} 
                        className="w-full h-full object-contain p-1" 
                      />
                    ) : (
                      <Building className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-bold text-gray-900">{company.companyName}</h1>
                      {company.verified && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      {company.featured && (
                        <Badge variant="secondary">Featured</Badge>
                      )}
                    </div>
                    <p className="text-gray-600">{company.industry}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    {company.size === "small" && "1-50 employees"}
                    {company.size === "medium" && "51-500 employees"}
                    {company.size === "large" && "501-5000 employees"}
                    {company.size === "enterprise" && "5000+ employees"}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    {company.location}
                  </div>
                  {company.website && (
                    <div className="flex items-center text-sm">
                      <Globe className="h-4 w-4 mr-2 text-gray-600" />
                      <a 
                        href={company.website} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-primary hover:underline"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>
                
                {company.description && (
                  <div>
                    <h3 className="font-semibold mb-3">About {company.companyName}</h3>
                    <p className="text-gray-700 leading-relaxed">{company.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Open Positions */}
            <Card>
              <CardHeader>
                <CardTitle>Open Positions</CardTitle>
              </CardHeader>
              <CardContent>
                {jobsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="border rounded-lg p-4">
                        <Skeleton className="h-5 w-48 mb-2" />
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    ))}
                  </div>
                ) : jobs && jobs.length > 0 ? (
                  <div className="space-y-4">
                    {jobs.map((job: any) => (
                      <div key={job.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-lg">{job.title}</h3>
                          <Badge variant={job.status === 'open' ? 'default' : 'secondary'}>
                            {job.status}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-3 line-clamp-2">{job.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{job.jobType}</span>
                            <span>{job.location}</span>
                            {job.minCompensation && job.maxCompensation && (
                              <span>
                                ${job.minCompensation.toLocaleString()} - ${job.maxCompensation.toLocaleString()} {job.compensationUnit}
                              </span>
                            )}
                          </div>
                          <Link href={`/job/${job.id}`}>
                            <Button variant="outline" size="sm">View Details</Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No open positions at the moment.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Company Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Open Positions</span>
                  <span className="font-semibold">
                    {jobs ? jobs.filter((job: any) => job.status === 'open').length : 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Company Size</span>
                  <span className="font-semibold capitalize">{company.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Industry</span>
                  <span className="font-semibold">{company.industry}</span>
                </div>
                {company.verified && (
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">Verified Company</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="mt-6">
              <Link href="/jobs">
                <Button className="w-full" variant="outline">
                  Browse All Jobs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}