import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Briefcase, MapPin, Clock, Building, CalendarClock, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import type { JobPosting, CompanyProfile } from "@shared/schema";

// Extended JobPosting type with additional properties for display
interface EnhancedJobPosting extends JobPosting {
  companyName?: string;
  contractType?: string;
  skills?: string[];
}

type MatchResult = {
  job: EnhancedJobPosting;
  score: number; // This will be the raw score from storage (0-1)
  matchScore: number; // This will be the formatted percentage from AI matching controller
  matchStrength?: string;
  matchReasons?: string[];
};

export default function ProfessionalJobMatches() {
  const { user } = useAuth();
  
  // Fetch professional profile
  const { 
    data: profile, 
    isLoading: isLoadingProfile 
  } = useQuery({
    queryKey: ["/api/professionals/me"],
    enabled: !!user,
  });
  
  // Fetch matched jobs - allow fetching without authentication for development/testing
  const { 
    data: matches, 
    isLoading: isLoadingMatches,
    error: matchError 
  } = useQuery<MatchResult[]>({
    queryKey: ["/api/professionals/me/matches"],
    queryFn: async () => {
      const response = await fetch('/api/professionals/me/matches');
      if (!response.ok) {
        throw new Error('Failed to fetch job matches');
      }
      return response.json();
    },
    // Enable even without profile for testing
    enabled: true,
  });
  
  // Fetch company profiles to get company names
  const {
    data: companies
  } = useQuery<CompanyProfile[]>({
    queryKey: ["/api/company-profiles"],
    enabled: !!matches && matches.length > 0,
  });
  
  // Format the match score as a percentage
  const formatMatchScore = (match: MatchResult) => {
    // If we have the pre-formatted matchScore from the AI controller, use it
    if (match.matchScore !== undefined) {
      return `${match.matchScore}%`;
    }
    // Otherwise, format the raw score (0-1) to percentage
    return `${Math.round(match.score * 100)}%`;
  };
  
  // Helper to get company name for a job
  const getCompanyName = (companyId: number) => {
    if (!companies) return "Company";
    const company = companies.find(c => c.id === companyId);
    return company?.companyName || "Company";
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Briefcase className="mr-2 h-5 w-5" /> AI Job Matches
        </CardTitle>
        <CardDescription>
          Jobs that match your skills and experience
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!profile && user ? (
          <div className="text-center py-4">
            <p className="text-gray-500 mb-4">Create a profile to see job matches</p>
            <Link href="/edit-profile">
              <Button>Complete Your Profile</Button>
            </Link>
          </div>
        ) : matchError ? (
          <div className="text-center py-6">
            <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-medium mb-1">Error Loading Matches</h3>
            <p className="text-gray-500 mb-4">There was a problem retrieving your job matches</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        ) : isLoadingMatches ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border rounded-md p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-64" />
                    <Skeleton className="h-4 w-48" />
                    <div className="flex items-center mt-2">
                      <Skeleton className="h-4 w-24 mr-3" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : matches && matches.length > 0 ? (
          <div className="space-y-4">
            {matches.map((match) => (
              <div key={match.job.id} className="border rounded-md p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-lg">{match.job.title}</h3>
                    <p className="text-gray-500">{match.job.companyName || getCompanyName(match.job.companyId)}</p>
                    
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                      {match.job.location && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{match.job.location}</span>
                        </div>
                      )}
                      
                      {match.job.remote && (
                        <Badge variant="outline" className="bg-blue-50">Remote</Badge>
                      )}
                      
                      {match.job.contractType ? (
                        <div className="flex items-center">
                          <CalendarClock className="h-4 w-4 mr-1" />
                          <span>{match.job.contractType}</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <CalendarClock className="h-4 w-4 mr-1" />
                          <span>{match.job.jobType}</span>
                        </div>
                      )}
                      
                      {match.job.createdAt && (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>Posted {format(new Date(match.job.createdAt), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <Badge className="mb-2 bg-emerald-100 text-emerald-800">
                      {formatMatchScore(match)} Match
                    </Badge>
                    <Link href={`/job/${match.job.id}`}>
                      <Button size="sm" className="flex items-center">
                        View Job <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
                
                {match.job.description && (
                  <p className="text-gray-700 mt-3 line-clamp-2">
                    {match.job.description}
                  </p>
                )}
                
                {match.job.skills && match.job.skills.length > 0 ? (
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-1">
                      {match.job.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="bg-gray-100">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary" className="bg-gray-100">
                        {match.job.jobType}
                      </Badge>
                      {match.job.compensationUnit && (
                        <Badge variant="secondary" className="bg-gray-100">
                          {match.job.compensationUnit} pay
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-medium mb-1">No Matches Found</h3>
            <p className="text-gray-500 mb-4">We couldn't find any jobs matching your profile</p>
            <Link href="/jobs">
              <Button>Browse All Jobs</Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}