import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, FileText, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { useEffect } from "react";

interface JobApplication {
  id: number;
  jobId: number;
  professionalId: number;
  coverLetter?: string;
  appliedAt: string;
  createdAt:string;
  status: string;
  professional?: {
    id: number;
    userId: number;
    firstName: string;
    lastName: string;
    title: string;
    location: string;
    email: string;
    phone?: string;
    profileImageUrl?: string;
    bio?: string;
  };
}

interface JobPosting {
  id: number;
  title: string;
  companyId: number;
  location: string;
  jobType: string;
  status: string;
}

export default function JobApplications() {
  const { id } = useParams<{ id: string }>();
  const jobId = parseInt(id || "0");

  // Fetch job details
  const { data: job, isLoading: jobLoading } = useQuery<JobPosting>({
    queryKey: [`/api/job-postings/${jobId}`],
    enabled: !!jobId,
  });

  // Fetch applications for this job
  const { data: applications, isLoading: applicationsLoading } = useQuery<JobApplication[]>({
    queryKey: [`/api/job-postings/${jobId}/applications`],
    enabled: !!jobId,
  });
  console.log("Applications data:", applications);

  if (jobLoading || applicationsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Job Not Found</h2>
            <p className="text-gray-600 mb-4">The job posting you're looking for doesn't exist.</p>
            <Link href="/company-dashboard">
              <Button>Return to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/company-dashboard">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Job Applications</h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-gray-600">
            <h2 className="text-lg sm:text-xl truncate" title={job.title}>{job.title}</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">{job.jobType}</Badge>
              <span className="flex items-center gap-1 text-sm">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">{job.location}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-gray-600 text-sm sm:text-base">
            {applications?.length || 0} application{applications?.length !== 1 ? 's' : ''} received
          </p>

          <Link href={`/job/${jobId}`}>
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <ExternalLink className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">View Job Posting</span>
              <span className="sm:hidden">View Job</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Applications List */}
      {!applications || applications.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Applications Yet</h3>
            <p className="text-gray-600">
              No candidates have applied to this job posting yet. Applications will appear here when professionals submit them.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {applications.map((application) => (
            <Card key={application.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={application.professional?.profileImageUrl} />
                      <AvatarFallback>
                        {application.professional?.firstName?.[0]}
                        {application.professional?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <h3 className="text-lg font-semibold">
                        {application.professional?.firstName} {application.professional?.lastName}
                      </h3>
                      {application.professional?.title && (
                        <p className="text-gray-600">{application.professional.title}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {application.createdAt && !isNaN(new Date(application.createdAt).getTime())
                            ? `Applied ${format(new Date(application.createdAt), 'MMM d, yyyy')}`
                            : 'Date unavailable'}

                        </span>
                        {application.professional?.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {application.professional.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Badge className={getStatusColor(application.status)}>
                    {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {application.professional?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <a
                        href={`mailto:${application.professional.email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {application.professional.email}
                      </a>
                    </div>
                  )}

                  {application.professional?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <a
                        href={`tel:${application.professional.phone}`}
                        className="text-blue-600 hover:underline"
                      >
                        {application.professional.phone}
                      </a>
                    </div>
                  )}
                </div>

                {/* Professional Bio */}
                {application.professional?.bio && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">About</h4>
                    <p className="text-gray-700 text-sm break-words">
                      {application.professional.bio}
                    </p>

                  </div>
                )}

                {/* Cover Letter */}
                {application.coverLetter && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Cover Letter
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700 text-sm whitespace-pre-wrap break-words">
                        {application.coverLetter}
                      </p>

                    </div>
                  </div>
                )}

                <Separator className="my-4" />
                {/* Actions */}
                <div className="flex items-center justify-between">
                  <Link href={`/professional/${application.professional?.userId}`}>
                    <Button variant="outline" size="sm">
                      View Full Profile
                    </Button>
                  </Link>

                  <div className="flex gap-2">
                    {application.status === 'pending' && (
                      <>
                        <Button variant="outline" size="sm">
                          Reject
                        </Button>
                        <Button size="sm">
                          Accept
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}