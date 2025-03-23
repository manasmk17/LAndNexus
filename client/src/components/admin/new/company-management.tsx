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
  Building2,
  Star, 
  StarOff, 
  CheckCircle2, 
  XCircle, 
  MoreHorizontal,
  Download,
  Eye,
  Link as LinkIcon,
  FileText
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

// Sample company data
const sampleCompanies = [
  {
    id: 1,
    userId: 201,
    companyName: "TechCorp Innovations",
    description: "Leading tech company focused on employee development",
    industry: "Technology",
    size: "Large Enterprise",
    location: "San Francisco, USA",
    featured: true,
    verified: true,
    website: "https://techcorp.example.com",
    logoUrl: null,
    employeeCount: 2500,
  },
  {
    id: 2,
    userId: 202,
    companyName: "HealthPlus",
    description: "Healthcare provider with focus on staff training",
    industry: "Healthcare",
    size: "Medium Business",
    location: "Boston, USA",
    featured: false,
    verified: true,
    website: "https://healthplus.example.com",
    logoUrl: null,
    employeeCount: 500,
  },
  {
    id: 3,
    userId: 203,
    companyName: "EduLearn Solutions",
    description: "Education technology company specializing in corporate training",
    industry: "Education",
    size: "Small Business",
    location: "Austin, USA",
    featured: true,
    verified: true,
    website: "https://edulearn.example.com",
    logoUrl: null,
    employeeCount: 75,
  },
  {
    id: 4,
    userId: 204,
    companyName: "Global Finance Group",
    description: "International financial services corporation",
    industry: "Finance",
    size: "Large Enterprise",
    location: "New York, USA",
    featured: false,
    verified: true,
    website: "https://globalfinance.example.com",
    logoUrl: null,
    employeeCount: 5000,
  },
  {
    id: 5,
    userId: 205,
    companyName: "Retail Ventures",
    description: "Retail chain focusing on employee growth and development",
    industry: "Retail",
    size: "Medium Business",
    location: "Chicago, USA",
    featured: false,
    verified: false,
    website: "https://retailventures.example.com",
    logoUrl: null,
    employeeCount: 350,
  },
  {
    id: 6,
    userId: 206,
    companyName: "Manufacturing Excellence",
    description: "Leading manufacturing company with innovative training programs",
    industry: "Manufacturing",
    size: "Large Enterprise",
    location: "Detroit, USA",
    featured: true,
    verified: true,
    website: "https://mfgexcellence.example.com",
    logoUrl: null,
    employeeCount: 1800,
  },
];

export default function CompanyManagement() {
  const [companies, setCompanies] = useState(sampleCompanies);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // Filter companies based on search term
  const filteredCompanies = companies.filter(company => {
    const searchFields = [
      company.companyName,
      company.industry,
      company.location,
      company.description,
      company.size,
    ];
    
    return searchFields.some(field => 
      field.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleToggleFeatured = (id: number) => {
    setCompanies(companies.map(company => 
      company.id === id 
        ? { ...company, featured: !company.featured } 
        : company
    ));

    const company = companies.find(c => c.id === id);
    const action = company?.featured ? "removed from" : "added to";
    
    toast({
      title: `Featured status updated`,
      description: `${company?.companyName} has been ${action} featured companies.`,
    });
  };

  const handleToggleVerified = (id: number) => {
    setCompanies(companies.map(company => 
      company.id === id 
        ? { ...company, verified: !company.verified } 
        : company
    ));

    const company = companies.find(c => c.id === id);
    const action = company?.verified ? "unverified" : "verified";
    
    toast({
      title: `Verification status updated`,
      description: `${company?.companyName} has been ${action}.`,
    });
  };

  const getCompanySizeColor = (size: string) => {
    switch(size) {
      case 'Small Business':
        return 'bg-blue-100 text-blue-800';
      case 'Medium Business':
        return 'bg-purple-100 text-purple-800';
      case 'Large Enterprise':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Company Management</h2>
        <div className="flex gap-2">
          <Button className="flex items-center gap-1">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Add Company</span>
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
            placeholder="Search companies..."
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
            <DropdownMenuLabel>Filter Companies</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>All Companies</DropdownMenuItem>
            <DropdownMenuItem>Featured Only</DropdownMenuItem>
            <DropdownMenuItem>Verified Only</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Small Business</DropdownMenuItem>
            <DropdownMenuItem>Medium Business</DropdownMenuItem>
            <DropdownMenuItem>Large Enterprise</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Companies table */}
      <Card>
        <CardHeader>
          <CardTitle>Companies</CardTitle>
          <CardDescription>
            Manage company profiles, verification, and featured status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company Name</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Website</TableHead>
                <TableHead className="text-center">Featured</TableHead>
                <TableHead className="text-center">Verified</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">
                    {company.companyName}
                  </TableCell>
                  <TableCell>{company.industry}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getCompanySizeColor(company.size)}>
                      {company.size}
                    </Badge>
                  </TableCell>
                  <TableCell>{company.location}</TableCell>
                  <TableCell>
                    {company.website && (
                      <a 
                        href={company.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:underline"
                      >
                        <LinkIcon className="h-3 w-3 mr-1" />
                        Website
                      </a>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleFeatured(company.id)}
                    >
                      {company.featured ? (
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
                      onClick={() => handleToggleVerified(company.id)}
                    >
                      {company.verified ? (
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
                          <FileText className="h-4 w-4 mr-2" />
                          View Job Postings
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleToggleFeatured(company.id)}>
                          {company.featured ? (
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
                        <DropdownMenuItem onClick={() => handleToggleVerified(company.id)}>
                          {company.verified ? (
                            <>
                              <XCircle className="h-4 w-4 mr-2" />
                              Unverify Company
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Verify Company
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredCompanies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                    No companies found matching your search criteria.
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