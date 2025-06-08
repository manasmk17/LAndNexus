import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  MoreHorizontal,
  Loader2,
  Building,
  Eye,
  Check,
  X,
  Search,
  Briefcase,
} from "lucide-react";
import { CompanyProfile } from "@shared/schema";

export default function CompaniesManagement() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmVerify, setConfirmVerify] = useState<CompanyProfile | null>(null);
  const [confirmUnverify, setConfirmUnverify] = useState<CompanyProfile | null>(null);

  // Fetch all company profiles
  const { data: companies, isLoading, error } = useQuery<CompanyProfile[]>({
    queryKey: ["/api/admin/company-profiles"],
    retry: 1,
  });

  // Filter companies based on search query
  const filteredCompanies = companies?.filter(
    (company) =>
      company.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle verified status
  const verifyCompanyMutation = useMutation({
    mutationFn: async ({
      companyId,
      verified,
    }: {
      companyId: number;
      verified: boolean;
    }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/admin/company-profiles/${companyId}/verify`,
        { verified }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/company-profiles"] });
      setConfirmVerify(null);
      setConfirmUnverify(null);
      toast({
        title: "Company Updated",
        description: "Verification status has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update verification status",
        variant: "destructive",
      });
    },
  });

  // Toggle featured status
  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({
      companyId,
      featured,
    }: {
      companyId: number;
      featured: boolean;
    }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/admin/company-profiles/${companyId}/featured`,
        { featured }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/company-profiles"] });
      toast({
        title: "Company Updated",
        description: "Featured status has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update featured status",
        variant: "destructive",
      });
    },
  });

  if (error) {
    return (
      <div className="p-8 text-center">
        <X className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-xl font-semibold text-red-700">Error Loading Companies</h3>
        <p className="text-muted-foreground mt-2">
          {error instanceof Error ? error.message : "Failed to load company profiles"}
        </p>
        <Button
          className="mt-4"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/company-profiles"] })}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Company Profiles Management</h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search companies..."
            className="w-[250px] pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-9 w-9"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Company Name</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No company profiles found
                  </TableCell>
                </TableRow>
              ) : (
                filteredCompanies?.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>{company.id}</TableCell>
                    <TableCell className="font-medium">{company.companyName}</TableCell>
                    <TableCell>{company.industry || "Not specified"}</TableCell>
                    <TableCell>{company.location || "Not specified"}</TableCell>
                    <TableCell>
                      <Switch
                        checked={!!company.featured}
                        onCheckedChange={() =>
                          toggleFeaturedMutation.mutate({
                            companyId: company.id,
                            featured: !company.featured,
                          })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {company.verified ? (
                        <Badge variant="success" className="bg-green-500">
                          <Check className="h-3 w-3 mr-1" /> Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline">Unverified</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => navigate(`/company-profile/${company.userId}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/company-jobs/${company.id}`)}>
                            <Briefcase className="mr-2 h-4 w-4" />
                            View Jobs
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              toggleFeaturedMutation.mutate({
                                companyId: company.id,
                                featured: !company.featured,
                              })
                            }
                          >
                            <Building className="mr-2 h-4 w-4" />
                            {company.featured ? "Unfeature Company" : "Feature Company"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {company.verified ? (
                            <DropdownMenuItem onClick={() => setConfirmUnverify(company)}>
                              <X className="mr-2 h-4 w-4" />
                              Remove Verification
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => setConfirmVerify(company)}>
                              <Check className="mr-2 h-4 w-4" />
                              Verify Company
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Verify Confirmation Dialog */}
          {confirmVerify && (
            <Dialog
              open={!!confirmVerify}
              onOpenChange={(open) => !open && setConfirmVerify(null)}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Verification</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to verify {confirmVerify.companyName}?
                    Verification indicates that you have confirmed this is a legitimate company.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setConfirmVerify(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() =>
                      verifyCompanyMutation.mutate({
                        companyId: confirmVerify.id,
                        verified: true,
                      })
                    }
                    disabled={verifyCompanyMutation.isPending}
                  >
                    {verifyCompanyMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Verify Company
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Unverify Confirmation Dialog */}
          {confirmUnverify && (
            <Dialog
              open={!!confirmUnverify}
              onOpenChange={(open) => !open && setConfirmUnverify(null)}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Remove Verification</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to remove verification from {confirmUnverify.companyName}?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setConfirmUnverify(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() =>
                      verifyCompanyMutation.mutate({
                        companyId: confirmUnverify.id,
                        verified: false,
                      })
                    }
                    disabled={verifyCompanyMutation.isPending}
                  >
                    {verifyCompanyMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Remove Verification
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </>
      )}
    </div>
  );
}