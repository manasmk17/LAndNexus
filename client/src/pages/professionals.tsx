import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  MapPin, 
  Filter, 
  Star,
  ArrowUpDown
} from "lucide-react";
import ProfessionalCard from "@/components/home/professional-card";
import type { ProfessionalProfile, Expertise } from "@shared/schema";

export default function Professionals() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExpertise, setSelectedExpertise] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("rating");
  const [experienceLevel, setExperienceLevel] = useState<string>("");
  const [rateRange, setRateRange] = useState<[number, number]>([0, 500]);
  
  // Fetch all professionals
  const { 
    data: professionals, 
    isLoading: isLoadingProfessionals,
    error: professionalError
  } = useQuery<ProfessionalProfile[]>({
    queryKey: ["/api/professional-profiles"],
  });
  
  // Fetch all expertise areas for filtering
  const { data: expertise } = useQuery<Expertise[]>({
    queryKey: ["/api/expertise"],
  });
  
  // Filter and sort professionals
  const filteredProfessionals = professionals?.filter(professional => {
    // Search by title, bio or location
    const matchesSearch = !searchTerm || 
      professional.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      professional.bio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      professional.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by rate range
    const matchesRate = !professional.ratePerHour || 
      (professional.ratePerHour >= rateRange[0] && professional.ratePerHour <= rateRange[1]);

    // Filter by experience level
    const yearsExp = professional.yearsExperience || 0;
    const matchesExperience = !experienceLevel || 
      (experienceLevel === "junior" && (yearsExp <= 2)) ||
      (experienceLevel === "mid-level" && (yearsExp > 2 && yearsExp <= 5)) ||
      (experienceLevel === "senior" && (yearsExp > 5 && yearsExp <= 8)) ||
      (experienceLevel === "expert" && (yearsExp > 8)) ||
      professional.title.toLowerCase().includes(experienceLevel.toLowerCase());

    // For expertise, we just show all if "all" is selected
    const matchesExpertise = selectedExpertise === "all";
    
    return matchesSearch && matchesRate && matchesExperience || matchesExpertise;
  }) || [];
  
  // Sort professionals
  const sortedProfessionals = [...filteredProfessionals].sort((a, b) => {
    if (sortOrder === "rating") {
      const aRating = a.rating || 0;
      const bRating = b.rating || 0;
      return bRating - aRating;
    } else if (sortOrder === "ratePerHour") {
      const aRate = a.ratePerHour || 0;
      const bRate = b.ratePerHour || 0;
      return bRate - aRate;
    }
    // Default sorting by rating
    const aRating = a.rating || 0;
    const bRating = b.rating || 0;
    return bRating - aRating;
  });
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-gradient-to-r from-black via-blue-950 to-black p-8 rounded-xl shadow-lg border border-blue-900">
        <div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-teal-400 inline-block text-transparent bg-clip-text">Find L&D Professionals</h1>
          <p className="text-blue-300 text-lg">Connect with expert trainers and unlock your potential</p>
        </div>
      </div>
      
      {/* Search and filter section */}
      <div className="bg-black p-6 rounded-xl shadow-md mb-8 border border-blue-900">
        <h2 className="text-xl font-semibold mb-4 text-blue-400">Find Your Perfect Match</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500" />
            <Input
              placeholder="Search by title, skills, or location..."
              className="pl-10 bg-slate-900 border-blue-900 text-blue-200 focus:border-blue-700 focus:ring-blue-700 placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Experience Level filter */}
          <div>
            <Select value={experienceLevel} onValueChange={setExperienceLevel}>
              <SelectTrigger className="w-full bg-slate-900 border-blue-900 text-blue-200">
                <div className="flex items-center">
                  <Filter className="mr-2 h-4 w-4 text-blue-500" />
                  <SelectValue placeholder="Experience level" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-black border-blue-900">
                <SelectItem value="any" className="text-blue-200 focus:bg-blue-900 focus:text-blue-200">Any Experience Level</SelectItem>
                <SelectItem value="junior" className="text-blue-200 focus:bg-blue-900 focus:text-blue-200">Junior (0-2 years)</SelectItem>
                <SelectItem value="mid-level" className="text-blue-200 focus:bg-blue-900 focus:text-blue-200">Mid Level (2-5 years)</SelectItem>
                <SelectItem value="senior" className="text-blue-200 focus:bg-blue-900 focus:text-blue-200">Senior (5-8 years)</SelectItem>
                <SelectItem value="expert" className="text-blue-200 focus:bg-blue-900 focus:text-blue-200">Expert (8+ years)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Expertise filter */}
          <div>
            <Select value={selectedExpertise} onValueChange={setSelectedExpertise}>
              <SelectTrigger className="w-full bg-slate-900 border-blue-900 text-blue-200">
                <div className="flex items-center">
                  <Filter className="mr-2 h-4 w-4 text-blue-500" />
                  <SelectValue placeholder="Filter by expertise" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-black border-blue-900">
                <SelectItem value="all" className="text-blue-200 focus:bg-blue-900 focus:text-blue-200">All Expertise</SelectItem>
                {expertise?.map((exp) => (
                  <SelectItem key={exp.id} value={exp.name} className="text-blue-200 focus:bg-blue-900 focus:text-blue-200">
                    {exp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Sort options */}
          <div>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-full bg-slate-900 border-blue-900 text-blue-200">
                <div className="flex items-center">
                  <ArrowUpDown className="mr-2 h-4 w-4 text-blue-500" />
                  <SelectValue placeholder="Sort by" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-black border-blue-900">
                <SelectItem value="rating" className="text-blue-200 focus:bg-blue-900 focus:text-blue-200">Highest Rated</SelectItem>
                <SelectItem value="ratePerHour" className="text-blue-200 focus:bg-blue-900 focus:text-blue-200">Hourly Rate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {/* Rate range filter */}
      <div className="bg-black p-6 rounded-xl shadow-md mb-5 border border-blue-900">
        <label className="block text-lg font-medium mb-3 text-blue-400">Hourly Rate Range ($)</label>
        <div className="flex items-center gap-6">
          <input
            type="range"
            min="0"
            max="500"
            value={rateRange[0]}
            onChange={(e) => setRateRange([parseInt(e.target.value), rateRange[1]])}
            className="w-full accent-blue-600"
          />
          <input
            type="range"
            min="0"
            max="500"
            value={rateRange[1]}
            onChange={(e) => setRateRange([rateRange[0], parseInt(e.target.value)])}
            className="w-full accent-blue-600"
          />
          <span className="text-md font-semibold bg-blue-900 text-blue-200 px-4 py-2 rounded-md min-w-[100px] text-center">
            ${rateRange[0]} - ${rateRange[1]}
          </span>
        </div>
      </div>

      {/* Results count and filters */}
      <div className="flex justify-between items-center mb-6 bg-black p-4 rounded-lg border border-blue-900">
        <p className="text-blue-400 font-medium">
          <span className="font-bold text-lg text-blue-300">{sortedProfessionals.length}</span> professionals found
        </p>
        <Button
          variant="outline"
          onClick={() => {
            setSearchTerm("");
            setSelectedExpertise("all");
            setExperienceLevel("");
            setRateRange([0, 500]);
          }}
          className="border-blue-800 bg-blue-900/50 hover:bg-blue-800 text-blue-200"
        >
          Clear All Filters
        </Button>
      </div>
      
      {/* Professionals listing */}
      <div className="space-y-6">
        {isLoadingProfessionals ? (
          // Loading skeletons
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="h-96 bg-black border border-blue-900">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Skeleton className="h-16 w-16 rounded-full bg-slate-800" />
                    <div className="ml-4 space-y-2">
                      <Skeleton className="h-5 w-48 bg-slate-800" />
                      <Skeleton className="h-4 w-32 bg-slate-800" />
                      <Skeleton className="h-4 w-24 bg-slate-800" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full bg-slate-800" />
                    <Skeleton className="h-4 w-full bg-slate-800" />
                    <Skeleton className="h-4 w-3/4 bg-slate-800" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-20 rounded-full bg-slate-800" />
                      <Skeleton className="h-8 w-20 rounded-full bg-slate-800" />
                    </div>
                    <Skeleton className="h-10 w-full bg-slate-800" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : professionalError ? (
          // Error state
          <Card className="bg-black border border-blue-900">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-red-400 mb-4">Failed to load professionals. Please try again later.</p>
              <Button onClick={() => window.location.reload()} className="bg-blue-700 hover:bg-blue-800">Retry</Button>
            </CardContent>
          </Card>
        ) : sortedProfessionals.length > 0 ? (
          // Professional cards
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedProfessionals.map((professional) => (
              <ProfessionalCard key={professional.id} professional={professional} />
            ))}
          </div>
        ) : (
          // Empty state
          <Card className="bg-black border border-blue-900">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-blue-400 mb-4">
                No professionals found matching your criteria. Try adjusting your filters.
              </p>
              <Button 
                onClick={() => {
                  setSearchTerm("");
                  setSelectedExpertise("all");
                }}
                className="bg-blue-700 hover:bg-blue-800"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Pagination (simplified for now) */}
      {sortedProfessionals.length > 0 && (
        <div className="flex justify-center mt-10 bg-black p-5 rounded-xl shadow-md border border-blue-900">
          <div className="flex items-center space-x-3">
            <Button variant="outline" className="border-blue-900 bg-slate-950 hover:bg-blue-900 text-blue-400 font-medium">Previous</Button>
            <Button variant="outline" className="border-blue-700 bg-blue-900 text-blue-200 font-bold">1</Button>
            <Button variant="outline" className="border-blue-900 bg-slate-950 hover:bg-blue-900 text-blue-400 font-medium">2</Button>
            <Button variant="outline" className="border-blue-900 bg-slate-950 hover:bg-blue-900 text-blue-400 font-medium">3</Button>
            <Button variant="outline" className="border-blue-900 bg-slate-950 hover:bg-blue-900 text-blue-400 font-medium">Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
