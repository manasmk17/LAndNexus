import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import type { ProfessionalProfile } from "@shared/schema";

// Define schema for form validation
const applicationSchema = z.object({
  coverLetter: z.string()
    .min(50, { message: "Cover letter must be at least 50 characters" })
    .max(2000, { message: "Cover letter must not exceed 2000 characters" }),
});

interface JobApplicationFormProps {
  jobId: number;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function JobApplicationForm({ jobId, onCancel, onSuccess }: JobApplicationFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch professional profile
  const { data: profile } = useQuery<ProfessionalProfile>({
    queryKey: ["/api/professional-profiles/by-user"],
  });

  const form = useForm<z.infer<typeof applicationSchema>>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      coverLetter: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof applicationSchema>) => {
    if (!profile) {
      toast({
        title: "Profile required",
        description: "You need to complete your professional profile before applying",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Submit application
      await apiRequest("POST", `/api/job-postings/${jobId}/applications`, {
        coverLetter: data.coverLetter,
        professionalId: profile.id,
      });
      
      toast({
        title: "Application submitted",
        description: "Your job application has been sent successfully",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: [`/api/professionals/${profile.id}/applications`] 
      });
      
      // Notify parent component of success
      onSuccess();
    } catch (error) {
      console.error("Application error:", error);
      
      // Check if it's already applied error
      if (error instanceof Error && error.message.includes("already applied")) {
        toast({
          title: "Already applied",
          description: "You have already applied to this job",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed to submit application",
          description: error instanceof Error ? error.message : "Please try again later",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apply for this Position</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent>
            <FormField
              control={form.control}
              name="coverLetter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover Letter</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Introduce yourself and explain why you're a good fit for this position..."
                      className="min-h-40"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Write a personalized cover letter highlighting your relevant experience and skills.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="mt-2 text-sm text-muted-foreground">
              {form.watch("coverLetter").length}/2000 characters
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                </>
              ) : (
                "Submit Application"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
