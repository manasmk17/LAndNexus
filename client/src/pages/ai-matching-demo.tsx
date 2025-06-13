import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Brain, Users, Briefcase, Star, TrendingUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MatchResult {
  id: number;
  title: string;
  description: string;
  location: string;
  company?: {
    companyName: string;
  };
  professional?: {
    firstName: string;
    lastName: string;
    title: string;
    bio: string;
  };
  matchScore: number;
  matchStrength: string;
  matchReasons: string[];
}

export default function AIMatchingDemo() {
  const [selectedProfessional, setSelectedProfessional] = useState<string>("");
  const [selectedJob, setSelectedJob] = useState<string>("");

  // Fetch professionals
  const { data: professionals = [], isLoading: loadingProfessionals } = useQuery({
    queryKey: ["/api/professional-profiles"],
  });

  // Fetch jobs
  const { data: jobs = [], isLoading: loadingJobs } = useQuery({
    queryKey: ["/api/job-postings"],
  });

  // Fetch matching jobs for selected professional
  const { data: matchingJobs = [], isLoading: loadingMatches, refetch: refetchJobs } = useQuery({
    queryKey: ["/api/matching/professional", selectedProfessional, "jobs"],
    enabled: !!selectedProfessional,
  });

  // Fetch matching professionals for selected job
  const { data: matchingProfessionals = [], isLoading: loadingProfMatches, refetch: refetchProfessionals } = useQuery({
    queryKey: ["/api/matching/job", selectedJob, "professionals"],
    enabled: !!selectedJob,
  });

  const getMatchColor = (strength: string) => {
    switch (strength.toLowerCase()) {
      case "excellent": return "bg-green-100 text-green-800 border-green-300";
      case "good": return "bg-blue-100 text-blue-800 border-blue-300";
      case "fair": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <Star className="h-4 w-4 text-yellow-500" />;
    if (score >= 60) return <TrendingUp className="h-4 w-4 text-blue-500" />;
    return <Brain className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Brain className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">AI Matching Demo</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Experience intelligent professional-job matching powered by OpenAI embeddings and semantic analysis
          </p>
        </div>

        {/* Controls */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Find Jobs for Professional
              </CardTitle>
              <CardDescription>
                Select a professional to see AI-matched job opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select 
                value={selectedProfessional} 
                onValueChange={(value) => {
                  setSelectedProfessional(value);
                  setSelectedJob("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a professional" />
                </SelectTrigger>
                <SelectContent>
                  {professionals.map((prof: any) => (
                    <SelectItem key={prof.id} value={prof.id.toString()}>
                      {prof.firstName} {prof.lastName} - {prof.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Find Professionals for Job
              </CardTitle>
              <CardDescription>
                Select a job posting to see AI-matched candidates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select 
                value={selectedJob} 
                onValueChange={(value) => {
                  setSelectedJob(value);
                  setSelectedProfessional("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a job posting" />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map((job: any) => (
                    <SelectItem key={job.id} value={job.id.toString()}>
                      {job.title} - {job.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        {selectedProfessional && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Briefcase className="h-6 w-6" />
              AI-Matched Jobs
            </h2>
            {loadingMatches ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Finding best matches...</span>
              </div>
            ) : (
              <div className="grid gap-4">
                {matchingJobs.map((match: MatchResult) => (
                  <Card key={match.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{match.title}</h3>
                          <p className="text-gray-600">{match.company?.companyName} • {match.location}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getScoreIcon(match.matchScore)}
                          <Badge className={getMatchColor(match.matchStrength)}>
                            {match.matchScore}% {match.matchStrength}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-4">{match.description.substring(0, 200)}...</p>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">AI Match Reasons:</h4>
                        <div className="flex flex-wrap gap-2">
                          {match.matchReasons.map((reason, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {reason}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {matchingJobs.length === 0 && (
                  <Card>
                    <CardContent className="p-6 text-center text-gray-500">
                      No matching jobs found for this professional.
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}

        {selectedJob && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Users className="h-6 w-6" />
              AI-Matched Professionals
            </h2>
            {loadingProfMatches ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Finding best candidates...</span>
              </div>
            ) : (
              <div className="grid gap-4">
                {matchingProfessionals.map((match: MatchResult) => (
                  <Card key={match.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">
                            {match.professional?.firstName} {match.professional?.lastName}
                          </h3>
                          <p className="text-gray-600">{match.professional?.title}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getScoreIcon(match.matchScore)}
                          <Badge className={getMatchColor(match.matchStrength)}>
                            {match.matchScore}% {match.matchStrength}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-4">{match.professional?.bio}</p>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">AI Match Reasons:</h4>
                        <div className="flex flex-wrap gap-2">
                          {match.matchReasons.map((reason, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {reason}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {matchingProfessionals.length === 0 && (
                  <Card>
                    <CardContent className="p-6 text-center text-gray-500">
                      No matching professionals found for this job.
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}

        {/* Information Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Brain className="h-5 w-5" />
              How AI Matching Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-blue-800 mb-2">1. Semantic Analysis</h4>
                <p className="text-blue-700">
                  OpenAI embeddings analyze the meaning and context of job descriptions and professional profiles
                </p>
              </div>
              <div>
                <h4 className="font-medium text-blue-800 mb-2">2. Intelligent Scoring</h4>
                <p className="text-blue-700">
                  Advanced algorithms calculate compatibility scores based on skills, experience, and requirements
                </p>
              </div>
              <div>
                <h4 className="font-medium text-blue-800 mb-2">3. Smart Recommendations</h4>
                <p className="text-blue-700">
                  AI provides detailed reasoning for each match to help make informed decisions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}