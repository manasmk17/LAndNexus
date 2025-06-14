
import { useState } from "react";
import { Search, Filter, X, MapPin, DollarSign, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

interface SearchFilters {
  query: string;
  location: string;
  experienceLevel: string;
  industry: string;
  salaryRange: [number, number];
  availability: string;
  skills: string[];
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  searchType: 'jobs' | 'professionals';
}

export default function AdvancedSearch({ onSearch, searchType }: AdvancedSearchProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    location: '',
    experienceLevel: '',
    industry: '',
    salaryRange: [0, 200000],
    availability: '',
    skills: []
  });

  const experienceLevels = [
    'Entry Level',
    'Mid Level',
    'Senior Level',
    'Executive Level'
  ];

  const industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'Education',
    'Manufacturing',
    'Retail',
    'Consulting',
    'Non-profit'
  ];

  const commonSkills = [
    'Leadership Development',
    'Change Management',
    'Performance Management',
    'Team Building',
    'Strategic Planning',
    'Training Design',
    'Coaching',
    'Project Management'
  ];

  const handleSearch = () => {
    onSearch(filters);
  };

  const addSkill = (skill: string) => {
    if (!filters.skills.includes(skill)) {
      setFilters(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    }
  };

  const removeSkill = (skill: string) => {
    setFilters(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      location: '',
      experienceLevel: '',
      industry: '',
      salaryRange: [0, 200000],
      availability: '',
      skills: []
    });
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        {/* Main Search Bar */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={`Search ${searchType}...`}
              value={filters.query}
              onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Button onClick={handleSearch}>
            Search
          </Button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Location */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Location
                </label>
                <Input
                  placeholder="City, Country"
                  value={filters.location}
                  onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>

              {/* Experience Level */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Experience Level
                </label>
                <Select
                  value={filters.experienceLevel}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, experienceLevel: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {experienceLevels.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Industry */}
              <div>
                <label className="text-sm font-medium mb-2 block">Industry</label>
                <Select
                  value={filters.industry}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, industry: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map(industry => (
                      <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Salary Range */}
            {searchType === 'jobs' && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Salary Range: ${filters.salaryRange[0].toLocaleString()} - ${filters.salaryRange[1].toLocaleString()}
                </label>
                <Slider
                  value={filters.salaryRange}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, salaryRange: value as [number, number] }))}
                  max={200000}
                  min={0}
                  step={5000}
                  className="w-full"
                />
              </div>
            )}

            {/* Skills */}
            <div>
              <label className="text-sm font-medium mb-2 block">Skills</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {filters.skills.map(skill => (
                  <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                    {skill}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeSkill(skill)}
                    />
                  </Badge>
                ))}
              </div>
              <Select onValueChange={addSkill}>
                <SelectTrigger>
                  <SelectValue placeholder="Add skills" />
                </SelectTrigger>
                <SelectContent>
                  {commonSkills
                    .filter(skill => !filters.skills.includes(skill))
                    .map(skill => (
                      <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>

            {/* Filter Actions */}
            <div className="flex justify-between items-center pt-4">
              <Button variant="outline" onClick={clearFilters}>
                Clear All Filters
              </Button>
              <div className="text-sm text-gray-500">
                {Object.values(filters).some(v => v !== '' && !(Array.isArray(v) && v.length === 0)) 
                  ? 'Filters applied' 
                  : 'No filters applied'
                }
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
