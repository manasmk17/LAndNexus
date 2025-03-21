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
  const [selectedExpertise, setSelectedExpertise] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<string>("rating");
  
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
    // Search by title or location
    const matchesSearch = !searchTerm || 
      professional.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      professional.bio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      professional.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    // For exact expertise matching, we'd need to fetch expertise for each professional
    // In a real app, this would be done on the server side
    // For now, we'll skip expertise filtering if no expertise is selected
    return matchesSearch;
  }) || [];
  
  // Sort professionals
  const sortedProfessionals = [...filteredProfessionals].sort((a, b) => {
    if (sortOrder === "rating") {
      return b.rating - a.rating;
    } else if (sortOrder === "ratePerHour") {
      const aRate = a.ratePerHour || 0;
      const bRate = b.ratePerHour || 0;
      return bRate - aRate;
    }
    // Default sorting by rating
    return b.rating - a.rating;
  });
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Find L&D Professionals</h1>
          <p className="text-gray-500">Connect with expert trainers and consultants</p>
        </div>
      </div>
      
      {/* Search and filter section */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by title, skills, or location..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Expertise filter */}
          <div>
            <Select value={selectedExpertise} onValueChange={setSelectedExpertise}>
              <SelectTrigger className="w-full">
                <div className="flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by expertise" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Expertise</SelectItem>
                {expertise?.map((exp) => (
                  <SelectItem key={exp.id} value={exp.name}>
                    {exp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Sort options */}
          <div>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-full">
                <div className="flex items-center">
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Sort by" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="ratePerHour">Hourly Rate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {/* Results count and info */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-500">
          {sortedProfessionals.length} professionals found
        </p>
      </div>
      
      {/* Professionals listing */}
      <div className="space-y-6">
        {isLoadingProfessionals ? (
          // Loading skeletons
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="h-96">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="ml-4 space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-20 rounded-full" />
                      <Skeleton className="h-8 w-20 rounded-full" />
                    </div>
                    <Skeleton className="h-10 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : professionalError ? (
          // Error state
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-red-500 mb-4">Failed to load professionals. Please try again later.</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
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
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-500 mb-4">
                No professionals found matching your criteria. Try adjusting your filters.
              </p>
              <Button onClick={() => {
                setSearchTerm("");
                setSelectedExpertise("");
              }}>
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Pagination (simplified for now) */}
      {sortedProfessionals.length > 0 && (
        <div className="flex justify-center mt-8">
          <Button variant="outline" className="mx-1">1</Button>
          <Button variant="outline" className="mx-1">2</Button>
          <Button variant="outline" className="mx-1">3</Button>
          <Button variant="outline" className="mx-1">Next</Button>
        </div>
      )}
    </div>
  );
}
