import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Building, 
  Briefcase, 
  MessageSquare, 
  Calendar, 
  Plus,
  Globe,
  Users,
  MapPin,
  ChevronRight,
  PencilIcon,
  FileText,
  User,
  CreditCard,
  Zap
} from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import SubscriptionStatus from "@/components/dashboard/subscription-status";
import JobProfessionalMatches from "@/components/dashboard/job-professional-matches";
import { JobManagementTable } from "@/components/job/job-management-table";
import type { 
  CompanyProfile, 
  JobPosting, 
  JobApplication, 
  Message,
  Consultation,
  ProfessionalProfile
} from "@shared/schema";

export default function CompanyDashboard() {
  const { user } = useAuth();
  
  // Fetch company profile
  const { 
    data: profile, 
    isLoading: isLoadingProfile 
  } = useQuery<CompanyProfile>({
    queryKey: ["/api/company-profiles/by-user"],
    enabled: !!user,
  });
  
  // Fetch company job postings - using "me" endpoint that doesn't require profile ID
  const { 
    data: jobPostings, 
    isLoading: isLoadingJobs 
  } = useQuery<JobPosting[]>({
    queryKey: ["/api/companies/me/job-postings"],
    enabled: !!profile,
  });

  const { 
    data: allApplications, 
    isLoading: isLoadingApplications 
  } = useQuery<any[]>({
    queryKey: ["/api/companies/me/applications"],
    enabled: !!profile,
  });

  const { 
    data: messages, 
    isLoading: isLoadingMessages 
  } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
    enabled: !!user,
  });

  const { 
    data: consultations, 
    isLoading: isLoadingConsultations 
  } = useQuery<Consultation[]>({
    queryKey: ["/api/consultations/company"],
    enabled: !!profile,
  });

  const { 
    data: professionals, 
    isLoading: isLoadingProfessionals 
  } = useQuery<ProfessionalProfile[]>({
    queryKey: ["/api/professional-profiles"],
    enabled: !!profile,
  });

  // Helper to get professional details by ID
  const getProfessionalDetails = (id: number) => {
    return professionals?.find(prof => prof.id === id);
  };

  // Helper to flatten all applications
  const getAllApplications = () => {
    if (!allApplications) return [];
    return allApplications.flatMap(item => item.applications);
  };
  
  // Helper to find job by id
  const getJobById = (id: number) => {
    return jobPostings?.find(job => job.id === id);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Company Dashboard</h1>
          <p className="text-gray-500">Manage your job postings, applications, and consultations</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
          {profile ? (
            <>
              <Link href="/post-job">
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Post a Job
                </Button>
              </Link>
              <Link href="/edit-profile">
                <Button variant="outline">
                  <PencilIcon className="mr-2 h-4 w-4" /> Edit Profile
                </Button>
              </Link>
            </>
          ) : (
            <Link href="/edit-profile">
              <Button>
                <PencilIcon className="mr-2 h-4 w-4" /> Create Company Profile
              </Button>
            </Link>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Company Profile Summary Card */}
        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="mr-2 h-5 w-5" /> Company Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingProfile ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex space-x-4 mt-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              ) : profile ? (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold">{profile.companyName}</h2>
                    <p className="text-gray-600 mt-2">{profile.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {profile.location}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      {profile.size} employees
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Briefcase className="h-4 w-4 mr-2" />
                      {profile.industry}
                    </div>
                    {profile.website && (
                      <div className="flex items-center text-gray-600">
                        <Globe className="h-4 w-4 mr-2" />
                        <a href={profile.website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                          Website
                        </a>
                      </div>
                    )}
                  </div>
                  
                  {profile.website && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={profile.website} target="_blank" rel="noopener noreferrer">Visit Website</a>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-4">You haven't created a company profile yet.</p>
                  <Link href="/edit-profile">
                    <Button>Complete Your Company Profile</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Subscription Status Card */}
        <div>
          <SubscriptionStatus />
        </div>
      </div>
      
      {/* AI Job Matching Section */}
      {profile && jobPostings && jobPostings.length > 0 && (
        <div className="mb-8">
          <JobProfessionalMatches />
        </div>
      )}
      
      <Tabs defaultValue="jobs">
        <TabsList className="grid grid-cols-3 w-full mb-8">
          <TabsTrigger value="jobs" className="flex items-center">
            <Briefcase className="h-4 w-4 mr-2" /> Job Postings
          </TabsTrigger>
          <TabsTrigger value="applications" className="flex items-center">
            <FileText className="h-4 w-4 mr-2" /> Applications
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center">
            <MessageSquare className="h-4 w-4 mr-2" /> Messages
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="jobs">
          {!profile ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500 mb-4">Create a company profile to post jobs</p>
                <Link href="/edit-profile">
                  <Button>Complete Your Company Profile</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <JobManagementTable companyId={profile.id} />
          )}
        </TabsContent>
        
        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>Job Applications</CardTitle>
              <CardDescription>
                Manage applications from L&D professionals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="font-medium mb-1">No Applications</h3>
                <p className="text-gray-500">You haven't received any applications yet</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <CardTitle>Messages</CardTitle>
              <CardDescription>
                Communicate with L&D professionals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="font-medium mb-1">No Messages</h3>
                <p className="text-gray-500">Your inbox is empty</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}