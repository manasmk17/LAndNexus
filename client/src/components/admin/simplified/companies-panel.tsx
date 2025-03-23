import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueryFn, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { CompanyProfile } from '@shared/schema';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Loader2, Pencil, Eye, Search, X, MoreHorizontal, AlertCircle } from 'lucide-react';

export function CompaniesPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyProfile | null>(null);

  // Fetch companies
  const {
    data: companies = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['/api/admin/company-profiles'],
    queryFn: getQueryFn<CompanyProfile[]>({ on401: 'throw' }),
  });

  // Filter companies based on search query
  const filteredCompanies = searchQuery
    ? companies.filter(
        (company) =>
          company.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          company.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          company.location?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : companies;

  // Toggle verified status mutation
  const toggleVerifiedMutation = useMutation({
    mutationFn: async ({ id, verified }: { id: number; verified: boolean }) => {
      const response = await apiRequest('PATCH', `/api/admin/company-profiles/${id}`, {
        verified,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/company-profiles'] });
      toast({
        title: 'Verification Status Updated',
        description: 'Company verification status has been updated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update verification status',
        variant: 'destructive',
      });
    },
  });

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center text-center p-6">
            <AlertCircle className="h-10 w-10 text-destructive mb-2" />
            <h3 className="text-lg font-semibold">Error Loading Companies</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {error instanceof Error ? error.message : 'Could not load company data'}
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/company-profiles'] })}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Profiles</CardTitle>
        <CardDescription>View and manage company profiles</CardDescription>
        <div className="flex items-center mt-4 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-9 w-9"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No companies found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCompanies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">{company.companyName}</TableCell>
                      <TableCell>{company.industry}</TableCell>
                      <TableCell>{company.location}</TableCell>
                      <TableCell>
                        <Switch
                          checked={!!company.verified}
                          onCheckedChange={(checked) => 
                            toggleVerifiedMutation.mutate({ id: company.id, verified: checked })
                          }
                          aria-label="Toggle verification status"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedCompany(company);
                                setShowDetailsDialog(true);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => window.open(`/company/${company.id}`, '_blank')}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Public Profile
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Company Details Dialog */}
        {selectedCompany && (
          <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{selectedCompany.companyName}</DialogTitle>
                <DialogDescription>
                  Company profile details
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {selectedCompany.logoUrl && (
                  <div className="flex justify-center mb-4">
                    <img 
                      src={selectedCompany.logoUrl} 
                      alt={`${selectedCompany.companyName} logo`} 
                      className="h-24 w-auto object-contain"
                    />
                  </div>
                )}
                <div className="grid grid-cols-3">
                  <div className="font-semibold">Industry:</div>
                  <div className="col-span-2">{selectedCompany.industry}</div>
                </div>
                <div className="grid grid-cols-3">
                  <div className="font-semibold">Location:</div>
                  <div className="col-span-2">{selectedCompany.location}</div>
                </div>
                <div className="grid grid-cols-3">
                  <div className="font-semibold">Size:</div>
                  <div className="col-span-2">{selectedCompany.size}</div>
                </div>
                <div className="grid grid-cols-3">
                  <div className="font-semibold">Website:</div>
                  <div className="col-span-2">
                    {selectedCompany.website ? (
                      <a 
                        href={selectedCompany.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {selectedCompany.website}
                      </a>
                    ) : (
                      'N/A'
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3">
                  <div className="font-semibold">Verified:</div>
                  <div className="col-span-2">
                    <Badge variant={selectedCompany.verified ? 'default' : 'outline'}>
                      {selectedCompany.verified ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
                {selectedCompany.description && (
                  <div>
                    <div className="font-semibold mb-2">About:</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedCompany.description}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}