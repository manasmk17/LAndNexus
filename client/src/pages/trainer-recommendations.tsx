import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Brain, 
  Star, 
  MapPin, 
  Clock, 
  DollarSign, 
  Users, 
  Languages, 
  Monitor,
  Building,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  X
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TrainingRequirement {
  sector: string;
  trainingType: string;
  preferredLanguage: string;
  format: string;
  experienceLevel: string;
  budget?: number;
  timeframe?: string;
  specificSkills?: string[];
  location?: string;
}

interface MatchingScore {
  professionalId: number;
  score: number;
  reasons: string[];
  sectorMatch: number;
  languageMatch: number;
  formatMatch: number;
  experienceMatch: number;
  locationMatch: number;
  culturalFit: number;
  professional: any;
  expertise: any[];
  certifications: any[];
}

interface RecommendationResponse {
  recommendations: MatchingScore[];
  totalFound: number;
  searchCriteria: any;
}

export default function TrainerRecommendations() {
  const { toast } = useToast();
  
  const [requirement, setRequirement] = useState<TrainingRequirement>({
    sector: "",
    trainingType: "",
    preferredLanguage: "ENGLISH",
    format: "HYBRID",
    experienceLevel: "intermediate",
    budget: 150,
    timeframe: "1-3 months",
    specificSkills: [],
    location: "United Arab Emirates"
  });

  const [skillInput, setSkillInput] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  // Get available sectors
  const { data: sectorsData } = useQuery({
    queryKey: ["/api/recommendations/sectors"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/recommendations/sectors");
      return res.json();
    }
  });

  // Get trainer recommendations
  const { 
    data: recommendationsData, 
    isLoading: isLoadingRecommendations,
    refetch: refetchRecommendations 
  } = useQuery<RecommendationResponse>({
    queryKey: ["/api/recommendations/trainers", requirement],
    queryFn: async () => {
      if (!requirement.sector || !requirement.trainingType) {
        return { recommendations: [], totalFound: 0, searchCriteria: {} };
      }
      
      const res = await apiRequest("POST", "/api/recommendations/trainers", requirement);
      return res.json();
    },
    enabled: !!requirement.sector && !!requirement.trainingType
  });

  // Real-time suggestions as user types
  const { data: realtimeSuggestions } = useQuery({
    queryKey: ["/api/recommendations/realtime", requirement.sector, requirement.trainingType],
    queryFn: async () => {
      if (!requirement.sector) return { suggestions: [] };
      
      const res = await apiRequest("POST", "/api/recommendations/realtime", {
        sector: requirement.sector,
        trainingType: requirement.trainingType,
        preferredLanguage: requirement.preferredLanguage,
        format: requirement.format
      });
      return res.json();
    },
    enabled: !!requirement.sector,
    refetchInterval: 3000 // Update every 3 seconds for real-time feel
  });

  // Submit feedback mutation
  const feedbackMutation = useMutation({
    mutationFn: async (feedback: { professionalId: number; bookingSuccess: boolean; rating?: number; feedback?: string }) => {
      const res = await apiRequest("POST", "/api/recommendations/feedback", feedback);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Feedback Submitted",
        description: "Thank you for helping improve our recommendations"
      });
    }
  });

  const addSkill = () => {
    if (skillInput.trim() && !requirement.specificSkills?.includes(skillInput.trim())) {
      setRequirement(prev => ({
        ...prev,
        specificSkills: [...(prev.specificSkills || []), skillInput.trim()]
      }));
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setRequirement(prev => ({
      ...prev,
      specificSkills: prev.specificSkills?.filter(s => s !== skill) || []
    }));
  };

  const getMatchStrengthColor = (score: number) => {
    if (score >= 0.8) return "bg-green-500";
    if (score >= 0.6) return "bg-blue-500";
    if (score >= 0.4) return "bg-yellow-500";
    return "bg-gray-400";
  };

  const getMatchStrengthLabel = (score: number) => {
    if (score >= 0.8) return "Excellent Match";
    if (score >= 0.6) return "Good Match";
    if (score >= 0.4) return "Fair Match";
    return "Basic Match";
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-100">
              <Brain className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">AI Trainer Recommendations</h1>
              <p className="text-slate-600">Find the perfect UAE-certified trainers for your organization</p>
            </div>
          </div>
          
          {/* Real-time suggestions */}
          {realtimeSuggestions?.suggestions?.length > 0 && (
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Live Suggestions</span>
                </div>
                <div className="flex gap-3">
                  {realtimeSuggestions.suggestions.map((suggestion: any) => (
                    <div key={suggestion.professionalId} className="flex items-center gap-2 bg-white rounded-lg p-2 border border-blue-200">
                      <div className="text-sm">
                        <div className="font-medium">{suggestion.name}</div>
                        <div className="text-slate-600 text-xs">{suggestion.title}</div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(suggestion.score * 100)}% match
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Search Criteria */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Training Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Sector Selection */}
                <div>
                  <Label htmlFor="sector">Industry Sector *</Label>
                  <Select value={requirement.sector} onValueChange={(value) => 
                    setRequirement(prev => ({ ...prev, sector: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {sectorsData?.sectors?.map((sector: any) => (
                        <SelectItem key={sector.id} value={sector.id}>
                          <div>
                            <div className="font-medium">{sector.name}</div>
                            <div className="text-xs text-slate-600">{sector.nameArabic}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Training Type */}
                <div>
                  <Label htmlFor="trainingType">Training Type *</Label>
                  <Input
                    id="trainingType"
                    value={requirement.trainingType}
                    onChange={(e) => setRequirement(prev => ({ ...prev, trainingType: e.target.value }))}
                    placeholder="e.g., Leadership Development, Digital Marketing"
                  />
                </div>

                {/* Language Preference */}
                <div>
                  <Label>Language Preference</Label>
                  <Select value={requirement.preferredLanguage} onValueChange={(value) => 
                    setRequirement(prev => ({ ...prev, preferredLanguage: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ENGLISH">
                        <div className="flex items-center gap-2">
                          <Languages className="h-4 w-4" />
                          English
                        </div>
                      </SelectItem>
                      <SelectItem value="ARABIC">
                        <div className="flex items-center gap-2">
                          <Languages className="h-4 w-4" />
                          Arabic (العربية)
                        </div>
                      </SelectItem>
                      <SelectItem value="BILINGUAL">
                        <div className="flex items-center gap-2">
                          <Languages className="h-4 w-4" />
                          Bilingual (English + Arabic)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Training Format */}
                <div>
                  <Label>Training Format</Label>
                  <Select value={requirement.format} onValueChange={(value) => 
                    setRequirement(prev => ({ ...prev, format: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ONLINE">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4" />
                          Online/Virtual
                        </div>
                      </SelectItem>
                      <SelectItem value="IN_PERSON">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          In-Person
                        </div>
                      </SelectItem>
                      <SelectItem value="HYBRID">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Hybrid (Both)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Experience Level */}
                <div>
                  <Label>Experience Level</Label>
                  <Select value={requirement.experienceLevel} onValueChange={(value) => 
                    setRequirement(prev => ({ ...prev, experienceLevel: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry">Entry Level (1-2 years)</SelectItem>
                      <SelectItem value="junior">Junior (2-4 years)</SelectItem>
                      <SelectItem value="intermediate">Intermediate (5-7 years)</SelectItem>
                      <SelectItem value="senior">Senior (8+ years)</SelectItem>
                      <SelectItem value="expert">Expert (12+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Advanced Options Toggle */}
                <Button
                  variant="outline"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {showAdvanced ? "Hide" : "Show"} Advanced Options
                </Button>

                {showAdvanced && (
                  <div className="space-y-4 pt-4 border-t border-slate-200">
                    {/* Budget Range */}
                    <div>
                      <Label>Budget (AED per hour)</Label>
                      <div className="mt-2">
                        <Slider
                          value={[requirement.budget || 150]}
                          onValueChange={(value) => setRequirement(prev => ({ ...prev, budget: value[0] }))}
                          max={500}
                          min={50}
                          step={25}
                          className="w-full"
                        />
                        <div className="flex justify-between text-sm text-slate-600 mt-1">
                          <span>AED 50</span>
                          <span className="font-medium">AED {requirement.budget}</span>
                          <span>AED 500+</span>
                        </div>
                      </div>
                    </div>

                    {/* Specific Skills */}
                    <div>
                      <Label>Specific Skills Required</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          placeholder="Add a skill..."
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                        />
                        <Button onClick={addSkill} size="sm">Add</Button>
                      </div>
                      
                      {requirement.specificSkills && requirement.specificSkills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {requirement.specificSkills.map((skill) => (
                            <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                              {skill}
                              <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => removeSkill(skill)}
                              />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Location */}
                    <div>
                      <Label htmlFor="location">Preferred Location</Label>
                      <Input
                        id="location"
                        value={requirement.location}
                        onChange={(e) => setRequirement(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="City or Emirates"
                      />
                    </div>

                    {/* Timeframe */}
                    <div>
                      <Label>Project Timeframe</Label>
                      <Select value={requirement.timeframe} onValueChange={(value) => 
                        setRequirement(prev => ({ ...prev, timeframe: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="immediate">Immediate (within 1 week)</SelectItem>
                          <SelectItem value="1-month">Within 1 month</SelectItem>
                          <SelectItem value="1-3 months">1-3 months</SelectItem>
                          <SelectItem value="3-6 months">3-6 months</SelectItem>
                          <SelectItem value="flexible">Flexible timeline</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={() => refetchRecommendations()} 
                  className="w-full"
                  disabled={!requirement.sector || !requirement.trainingType || isLoadingRecommendations}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  {isLoadingRecommendations ? "Finding Matches..." : "Get AI Recommendations"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            {isLoadingRecommendations ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-slate-600">AI is analyzing trainers...</p>
                </div>
              </div>
            ) : recommendationsData?.recommendations && recommendationsData.recommendations.length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-900">
                    Found {recommendationsData?.totalFound || 0} Recommended Trainers
                  </h2>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    AI-Powered Matching
                  </Badge>
                </div>

                {recommendationsData?.recommendations?.map((match) => (
                  <Card key={match.professionalId} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center">
                            <Users className="h-8 w-8 text-slate-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-slate-900">
                              {match.professional?.firstName} {match.professional?.lastName}
                            </h3>
                            <p className="text-slate-600 mb-2">{match.professional?.title}</p>
                            
                            <div className="flex items-center gap-4 text-sm text-slate-600">
                              {match.professional?.rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span>{match.professional.rating.toFixed(1)}</span>
                                </div>
                              )}
                              {match.professional?.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  <span>{match.professional.location}</span>
                                </div>
                              )}
                              {match.professional?.ratePerHour && (
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-4 w-4" />
                                  <span>AED {match.professional.ratePerHour}/hour</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{match.professional?.yearsExperience} years exp</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white ${getMatchStrengthColor(match.score)}`}>
                            {Math.round(match.score * 100)}% Match
                          </div>
                          <p className="text-xs text-slate-600 mt-1">{getMatchStrengthLabel(match.score)}</p>
                        </div>
                      </div>

                      {/* Match Reasons */}
                      {match.reasons.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-slate-700 mb-2">Why this trainer matches:</p>
                          <div className="flex flex-wrap gap-2">
                            {match.reasons.map((reason, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                                {reason}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Detailed Scores */}
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-slate-900">{Math.round(match.sectorMatch * 100)}%</div>
                          <div className="text-xs text-slate-600">Sector</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-slate-900">{Math.round(match.languageMatch * 100)}%</div>
                          <div className="text-xs text-slate-600">Language</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-slate-900">{Math.round(match.formatMatch * 100)}%</div>
                          <div className="text-xs text-slate-600">Format</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-slate-900">{Math.round(match.experienceMatch * 100)}%</div>
                          <div className="text-xs text-slate-600">Experience</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-slate-900">{Math.round(match.locationMatch * 100)}%</div>
                          <div className="text-xs text-slate-600">Location</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-slate-900">{Math.round(match.culturalFit * 100)}%</div>
                          <div className="text-xs text-slate-600">Cultural Fit</div>
                        </div>
                      </div>

                      {/* Expertise */}
                      {match.expertise.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-slate-700 mb-2">Expertise Areas:</p>
                          <div className="flex flex-wrap gap-2">
                            {match.expertise.map((exp) => (
                              <Badge key={exp.id} variant="outline">{exp.name}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4 border-t border-slate-200">
                        <Button className="flex-1">
                          View Full Profile
                        </Button>
                        <Button variant="outline" className="flex-1">
                          Contact Trainer
                        </Button>
                        <Button variant="outline" size="sm">
                          Save
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : requirement.sector && requirement.trainingType ? (
              <Card className="flex items-center justify-center h-64">
                <CardContent className="text-center">
                  <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Matches Found</h3>
                  <p className="text-slate-600 mb-4">
                    No trainers match your current criteria. Try adjusting your requirements.
                  </p>
                  <Button variant="outline" onClick={() => setShowAdvanced(true)}>
                    Adjust Search Criteria
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="flex items-center justify-center h-64">
                <CardContent className="text-center">
                  <Brain className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">AI Trainer Matching</h3>
                  <p className="text-slate-600">
                    Select your industry sector and training type to get AI-powered trainer recommendations
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}