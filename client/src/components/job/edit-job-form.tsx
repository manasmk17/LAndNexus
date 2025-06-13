import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { JobPosting } from "@shared/schema";

const editJobSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  location: z.string().min(1, "Location is required"),
  jobType: z.enum(["full-time", "part-time", "contract", "freelance"]),
  minCompensation: z.number().optional(),
  maxCompensation: z.number().optional(),
  compensationUnit: z.enum(["hourly", "project", "yearly"]).optional(),
  duration: z.string().optional(),
  requirements: z.string().min(1, "Requirements are required"),
  remote: z.boolean().default(false),
  featured: z.boolean().default(false),
  status: z.enum(["open", "closed", "filled"]).default("open"),
  expiresInDays: z.number().min(1).max(365).optional(),
});

type EditJobFormData = z.infer<typeof editJobSchema>;

interface EditJobFormProps {
  jobId: number;
}

export function EditJobForm({ jobId }: EditJobFormProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: job, isLoading, error } = useQuery({
    queryKey: ['/api/job-postings', jobId],
    queryFn: () => apiRequest("GET", `/api/job-postings/${jobId}`)
  });

  const form = useForm<EditJobFormData>({
    resolver: zodResolver(editJobSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      jobType: "full-time",
      minCompensation: undefined,
      maxCompensation: undefined,
      compensationUnit: undefined,
      duration: "",
      requirements: "",
      remote: false,
      featured: false,
      status: "open",
      expiresInDays: undefined,
    }
  });

  // Pre-populate form when job data is loaded
  useEffect(() => {
    if (job) {
      const formData: Partial<EditJobFormData> = {
        title: job.title,
        description: job.description,
        location: job.location,
        jobType: job.jobType as "full-time" | "part-time" | "contract" | "freelance",
        minCompensation: job.minCompensation || undefined,
        maxCompensation: job.maxCompensation || undefined,
        compensationUnit: job.compensationUnit as "hourly" | "project" | "yearly" | undefined,
        duration: job.duration || "",
        requirements: job.requirements,
        remote: job.remote || false,
        featured: job.featured || false,
        status: job.status as "open" | "closed" | "filled",
      };

      // Calculate days until expiration
      if (job.expiresAt) {
        const now = new Date();
        const expirationDate = new Date(job.expiresAt);
        const diffTime = expirationDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 0) {
          formData.expiresInDays = diffDays;
        }
      }

      // Reset form with job data
      form.reset(formData);
    }
  }, [job, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: EditJobFormData) => {
      const updateData = {
        ...data,
        minCompensation: data.minCompensation || null,
        maxCompensation: data.maxCompensation || null,
        compensationUnit: data.compensationUnit || null,
        duration: data.duration || null,
      };

      // Handle expiration date
      if (data.expiresInDays) {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + data.expiresInDays);
        updateData.expiresAt = expirationDate.toISOString();
      }

      // Remove expiresInDays from the data sent to server
      delete updateData.expiresInDays;

      return apiRequest("PUT", `/api/job-postings/${jobId}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/job-postings', jobId] });
      queryClient.invalidateQueries({ queryKey: ['/api/companies/me/job-postings'] });
      toast({
        title: "Job Updated",
        description: "Your job posting has been updated successfully.",
      });
      setLocation("/company-dashboard");
    },
    onError: (error) => {
      console.error("Job update error:", error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update job posting",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: EditJobFormData) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading job posting...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive mb-4">Failed to load job posting</p>
            <Button onClick={() => setLocation("/company-dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Edit Job Posting</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Senior Learning & Development Manager" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., San Francisco, CA or Remote" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the role, responsibilities, and what makes this opportunity unique..."
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requirements</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="List the required qualifications, skills, and experience..."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="jobType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select job type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="full-time">Full-time</SelectItem>
                        <SelectItem value="part-time">Part-time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="freelance">Freelance</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="compensationUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Compensation Unit</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="project">Per Project</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                        <SelectItem value="filled">Filled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="minCompensation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Compensation</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="e.g., 50000"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxCompensation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Compensation</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="e.g., 75000"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (for contracts)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 6 months, 1 year" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiresInDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Posting Duration (days)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="e.g., 30"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="remote"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Remote Work</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Allow remote work for this position
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="featured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Feature this job posting</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Featured job postings appear at the top of search results
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-4">
              <Button 
                type="submit" 
                disabled={updateMutation.isPending}
                className="flex-1"
              >
                {updateMutation.isPending ? "Updating..." : "Update Job Posting"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setLocation("/company-dashboard")}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}