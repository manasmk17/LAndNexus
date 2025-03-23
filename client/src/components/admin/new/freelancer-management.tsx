import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Filter,
  UserPlus, 
  Star, 
  StarOff, 
  CheckCircle2, 
  XCircle, 
  MoreHorizontal,
  Download,
  Eye
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// Sample freelancer data
const sampleFreelancers = [
  {
    id: 1,
    userId: 101,
    firstName: "John",
    lastName: "Doe",
    title: "Leadership Development Specialist",
    bio: "Experienced leadership trainer with 10+ years in corporate settings",
    location: "New York, USA",
    featured: true,
    verified: true,
    contactEmail: "john.doe@example.com",
    profilePictureUrl: null,
    availability: "Full-time",
    avgRating: 4.8,
    experienceYears: 10,
  },
  {
    id: 2,
    userId: 102,
    firstName: "Sarah",
    lastName: "Johnson",
    title: "Corporate Training Consultant",
    bio: "Specializing in corporate training programs and team building",
    location: "Chicago, USA",
    featured: false,
    verified: true,
    contactEmail: "sarah.j@example.com",
    profilePictureUrl: null,
    availability: "Part-time",
    avgRating: 4.5,
    experienceYears: 8,
  },
  {
    id: 3,
    userId: 103,
    firstName: "Michael",
    lastName: "Rodriguez",
    title: "E-Learning Designer",
    bio: "Creative instructional designer with expertise in digital learning",
    location: "Austin, USA",
    featured: true,
    verified: true,
    contactEmail: "michael.r@example.com",
    profilePictureUrl: null,
    availability: "Contract",
    avgRating: 4.9,
    experienceYears: 7,
  },
  {
    id: 4,
    userId: 104,
    firstName: "Emma",
    lastName: "Chen",
    title: "Diversity & Inclusion Trainer",
    bio: "Specializing in diversity programs and inclusive workplace strategies",
    location: "San Francisco, USA",
    featured: false,
    verified: true,
    contactEmail: "emma.c@example.com",
    profilePictureUrl: null,
    availability: "Full-time",
    avgRating: 4.7,
    experienceYears: 9,
  },
  {
    id: 5,
    userId: 105,
    firstName: "David",
    lastName: "Wilson",
    title: "Sales Training Specialist",
    bio: "Expert in sales methodology and performance enhancement",
    location: "Miami, USA",
    featured: false,
    verified: false,
    contactEmail: "david.w@example.com",
    profilePictureUrl: null,
    availability: "Contract",
    avgRating: 4.4,
    experienceYears: 6,
  },
  {
    id: 6,
    userId: 106,
    firstName: "Olivia",
    lastName: "Martinez",
    title: "Executive Coach",
    bio: "Certified executive coach with focus on leadership development",
    location: "Denver, USA",
    featured: true,
    verified: true,
    contactEmail: "olivia.m@example.com",
    profilePictureUrl: null,
    availability: "Part-time",
    avgRating: 5.0,
    experienceYears: 12,
  },
];

export default function FreelancerManagement() {
  const [freelancers, setFreelancers] = useState(sampleFreelancers);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // Filter freelancers based on search term
  const filteredFreelancers = freelancers.filter(freelancer => {
    const searchFields = [
      freelancer.firstName,
      freelancer.lastName,
      freelancer.title,
      freelancer.location,
      freelancer.bio,
    ];
    
    return searchFields.some(field => 
      field.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleToggleFeatured = (id: number) => {
    setFreelancers(freelancers.map(freelancer => 
      freelancer.id === id 
        ? { ...freelancer, featured: !freelancer.featured } 
        : freelancer
    ));

    const freelancer = freelancers.find(f => f.id === id);
    const action = freelancer?.featured ? "removed from" : "added to";
    
    toast({
      title: `Featured status updated`,
      description: `${freelancer?.firstName} ${freelancer?.lastName} has been ${action} featured professionals.`,
    });
  };

  const handleToggleVerified = (id: number) => {
    setFreelancers(freelancers.map(freelancer => 
      freelancer.id === id 
        ? { ...freelancer, verified: !freelancer.verified } 
        : freelancer
    ));

    const freelancer = freelancers.find(f => f.id === id);
    const action = freelancer?.verified ? "unverified" : "verified";
    
    toast({
      title: `Verification status updated`,
      description: `${freelancer?.firstName} ${freelancer?.lastName} has been ${action}.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Freelancer Management</h2>
        <div className="flex gap-2">
          <Button className="flex items-center gap-1">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Freelancer</span>
          </Button>
          <Button variant="outline" className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>
      
      {/* Search and filter area */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search freelancers..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-1">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filter Freelancers</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>All Freelancers</DropdownMenuItem>
            <DropdownMenuItem>Featured Only</DropdownMenuItem>
            <DropdownMenuItem>Verified Only</DropdownMenuItem>
            <DropdownMenuItem>Full-time</DropdownMenuItem>
            <DropdownMenuItem>Part-time</DropdownMenuItem>
            <DropdownMenuItem>Contract</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Freelancers table */}
      <Card>
        <CardHeader>
          <CardTitle>L&D Professionals</CardTitle>
          <CardDescription>
            Manage professional profiles, verification, and featured status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead className="text-center">Featured</TableHead>
                <TableHead className="text-center">Verified</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFreelancers.map((freelancer) => (
                <TableRow key={freelancer.id}>
                  <TableCell className="font-medium">
                    {freelancer.firstName} {freelancer.lastName}
                  </TableCell>
                  <TableCell>{freelancer.title}</TableCell>
                  <TableCell>{freelancer.location}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500 mr-1" />
                      <span>{freelancer.avgRating}</span>
                    </div>
                  </TableCell>
                  <TableCell>{freelancer.experienceYears} years</TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleFeatured(freelancer.id)}
                    >
                      {freelancer.featured ? (
                        <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                      ) : (
                        <StarOff className="h-5 w-5 text-muted-foreground" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleVerified(freelancer.id)}
                    >
                      {freelancer.verified ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleToggleFeatured(freelancer.id)}>
                          {freelancer.featured ? (
                            <>
                              <StarOff className="h-4 w-4 mr-2" />
                              Remove from Featured
                            </>
                          ) : (
                            <>
                              <Star className="h-4 w-4 mr-2" />
                              Add to Featured
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleVerified(freelancer.id)}>
                          {freelancer.verified ? (
                            <>
                              <XCircle className="h-4 w-4 mr-2" />
                              Unverify Professional
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Verify Professional
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredFreelancers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                    No professionals found matching your search criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}