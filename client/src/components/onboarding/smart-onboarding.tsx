import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  ChevronRight,
  CheckCircle,
  ArrowRight,
  Zap
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface OnboardingData {
  companyName: string;
  sector: string;
  trainingType: string;
  preferredLanguage: string;
  format: string;
  experienceLevel: string;
  urgency: string;
  teamSize: number;
  budget: number;
}

interface SmartSuggestion {
  professionalId: number;
  score: number;
  reasons: string[];
  name: string;
  title: string;
  rating: number;
  ratePerHour: number;
  location: string;
}

export default function SmartOnboarding({ onComplete }: { onComplete?: (data: OnboardingData) => void }) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    companyName: "",
    sector: "",
    trainingType: "",
    preferredLanguage: "ENGLISH",
    format: "HYBRID",
    experienceLevel: "intermediate",
    urgency: "1-3 months",
    teamSize: 10,
    budget: 150
  });

  const steps = [
    { id: "company", title: "Company Info", description: "Tell us about your organization" },
    { id: "training", title: "Training Needs", description: "What kind of training do you need?" },
    { id: "preferences", title: "Preferences", description: "Your training preferences" },
    { id: "details", title: "Project Details", description: "Budget and timeline" },
    { id: "recommendations", title: "AI Recommendations", description: "Perfect trainers for you" }
  ];

  // Get available sectors
  const { data: sectorsData } = useQuery({
    queryKey: ["/api/recommendations/sectors"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/recommendations/sectors");
      return res.json();
    }
  });

  // Real-time suggestions based on current input
  const { data: realtimeSuggestions, isLoading: loadingSuggestions } = useQuery({
    queryKey: ["/api/recommendations/realtime", data.sector, data.trainingType, data.preferredLanguage, data.format],
    queryFn: async () => {
      if (!data.sector || !data.trainingType) return { suggestions: [] };
      
      const res = await apiRequest("POST", "/api/recommendations/realtime", {
        sector: data.sector,
        trainingType: data.trainingType,
        preferredLanguage: data.preferredLanguage,
        format: data.format,
        experienceLevel: data.experienceLevel
      });
      return res.json();
    },
    enabled: !!data.sector && !!data.trainingType,
    refetchInterval: 2000
  });

  const updateData = (field: keyof OnboardingData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return data.companyName.trim().length > 0;
      case 1: return data.sector && data.trainingType.trim().length > 0;
      case 2: return true;
      case 3: return true;
      case 4: return true;
      default: return false;
    }
  };

  const handleComplete = () => {
    onComplete?.(data);
    toast({
      title: "Onboarding Complete!",
      description: "You can now explore your personalized trainer recommendations"
    });
  };

  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Smart Training Setup</h2>
            <p className="text-slate-600">AI-powered trainer matching in real-time</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Brain className="h-4 w-4 text-blue-600" />
            <span>Step {currentStep + 1} of {steps.length}</span>
          </div>
        </div>
        
        <Progress value={progressPercentage} className="h-2 bg-slate-200" />
        
        <div className="flex justify-between mt-4">
          {steps.map((step, index) => (
            <div key={step.id} className={`flex flex-col items-center ${index <= currentStep ? 'text-blue-600' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium mb-2 ${
                index < currentStep 
                  ? 'bg-blue-600 text-white' 
                  : index === currentStep 
                    ? 'bg-blue-100 text-blue-600 border-2 border-blue-600' 
                    : 'bg-slate-200 text-slate-500'
              }`}>
                {index < currentStep ? <CheckCircle className="h-4 w-4" /> : index + 1}
              </div>
              <div className="text-xs text-center">
                <div className="font-medium">{step.title}</div>
                <div className="text-slate-500">{step.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {currentStep === 0 && <Building className="h-5 w-5" />}
                {currentStep === 1 && <Users className="h-5 w-5" />}
                {currentStep === 2 && <Languages className="h-5 w-5" />}
                {currentStep === 3 && <DollarSign className="h-5 w-5" />}
                {currentStep === 4 && <Sparkles className="h-5 w-5" />}
                {steps[currentStep].title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 0: Company Info */}
              {currentStep === 0 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      value={data.companyName}
                      onChange={(e) => updateData("companyName", e.target.value)}
                      placeholder="Enter your company name"
                      className="mt-2"
                    />
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Brain className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-900 mb-1">AI-Powered Matching</h4>
                        <p className="text-sm text-blue-700">
                          Our intelligent system will analyze your requirements and match you with certified UAE trainers in real-time as you complete this form.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1: Training Needs */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label>Industry Sector *</Label>
                    <Select value={data.sector} onValueChange={(value) => updateData("sector", value)}>
                      <SelectTrigger className="mt-2">
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

                  <div>
                    <Label htmlFor="trainingType">Training Type *</Label>
                    <Input
                      id="trainingType"
                      value={data.trainingType}
                      onChange={(e) => updateData("trainingType", e.target.value)}
                      placeholder="e.g., Leadership Development, Digital Marketing, Sales Training"
                      className="mt-2"
                    />
                    <p className="text-xs text-slate-600 mt-1">
                      Be specific - this helps our AI find the best matches
                    </p>
                  </div>
                </div>
              )}

              {/* Step 2: Preferences */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label>Language Preference</Label>
                    <Select value={data.preferredLanguage} onValueChange={(value) => updateData("preferredLanguage", value)}>
                      <SelectTrigger className="mt-2">
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

                  <div>
                    <Label>Training Format</Label>
                    <Select value={data.format} onValueChange={(value) => updateData("format", value)}>
                      <SelectTrigger className="mt-2">
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

                  <div>
                    <Label>Experience Level Required</Label>
                    <Select value={data.experienceLevel} onValueChange={(value) => updateData("experienceLevel", value)}>
                      <SelectTrigger className="mt-2">
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
                </div>
              )}

              {/* Step 3: Project Details */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <Label>Project Timeline</Label>
                    <Select value={data.urgency} onValueChange={(value) => updateData("urgency", value)}>
                      <SelectTrigger className="mt-2">
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

                  <div>
                    <Label>Team Size</Label>
                    <Input
                      type="number"
                      value={data.teamSize}
                      onChange={(e) => updateData("teamSize", parseInt(e.target.value) || 0)}
                      placeholder="Number of participants"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Budget per Hour (AED)</Label>
                    <div className="mt-2">
                      <Input
                        type="number"
                        value={data.budget}
                        onChange={(e) => updateData("budget", parseInt(e.target.value) || 0)}
                        placeholder="150"
                        className="mb-2"
                      />
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>AED 50</span>
                        <span>AED 500+</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Recommendations Preview */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Setup Complete!</h3>
                    <p className="text-slate-600 mb-6">
                      Your AI-powered trainer recommendations are ready. Click below to explore your personalized matches.
                    </p>
                    <Button onClick={handleComplete} size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                      <Sparkles className="h-5 w-5 mr-2" />
                      View AI Recommendations
                    </Button>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-6 border-t border-slate-200">
                <Button 
                  variant="outline" 
                  onClick={prevStep}
                  disabled={currentStep === 0}
                >
                  Previous
                </Button>
                <Button 
                  onClick={nextStep}
                  disabled={!canProceed() || currentStep === steps.length - 1}
                  className="flex items-center gap-2"
                >
                  {currentStep === steps.length - 2 ? "Complete Setup" : "Next"}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Real-time Suggestions Sidebar */}
        <div className="lg:col-span-1">
          {currentStep >= 1 && (
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Live AI Matches
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingSuggestions ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-sm text-slate-600">Finding matches...</p>
                  </div>
                ) : realtimeSuggestions?.suggestions?.length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-600 mb-4">
                      Real-time matches based on your requirements:
                    </p>
                    {realtimeSuggestions.suggestions.slice(0, 3).map((suggestion: SmartSuggestion) => (
                      <div key={suggestion.professionalId} className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-slate-900 text-sm">{suggestion.name}</h4>
                            <p className="text-xs text-slate-600 mb-1">{suggestion.title}</p>
                            <div className="flex items-center gap-3 text-xs text-slate-600">
                              {suggestion.rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  <span>{suggestion.rating.toFixed(1)}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                <span>AED {suggestion.ratePerHour}/hr</span>
                              </div>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                            {Math.round(suggestion.score * 100)}%
                          </Badge>
                        </div>
                        {suggestion.reasons.length > 0 && (
                          <div className="text-xs text-slate-600">
                            <div className="flex items-center gap-1 mb-1">
                              <CheckCircle className="h-3 w-3 text-green-600" />
                              <span>{suggestion.reasons[0]}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    <div className="text-center pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setCurrentStep(4)}
                        className="text-xs"
                      >
                        <ArrowRight className="h-3 w-3 mr-1" />
                        See All Matches
                      </Button>
                    </div>
                  </div>
                ) : data.sector && data.trainingType ? (
                  <div className="text-center py-8">
                    <Brain className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">
                      No immediate matches found. Continue setup for more options.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Sparkles className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">
                      Complete training needs to see AI-powered matches
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}