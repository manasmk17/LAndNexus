import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, X } from "lucide-react";
import { 
  insertProfessionalProfileSchema, 
  insertCompanyProfileSchema,
  type ProfessionalProfile,
  type CompanyProfile,
  type Expertise,
  insertCertificationSchema
} from "@shared/schema";

// Extended professional profile schema for form validation
const professionalProfileFormSchema = insertProfessionalProfileSchema.extend({
  profileImage: z.instanceof(File).optional(),
  newExpertise: z.string().optional(),
  newCertification: z.object({
    name: z.string().optional(),
    issuer: z.string().optional(),
    year: z.coerce.number().optional()
  }).optional()
});

// Extended company profile schema for form validation
const companyProfileFormSchema = insertCompanyProfileSchema.extend({
  profileImage: z.instanceof(File).optional()
});

export default function EditProfileForm() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedExpertise, setSelectedExpertise] = useState<Expertise[]>([]);
  const [showCertForm, setShowCertForm] = useState(false);

  // Fetch all available expertise areas
  const { data: expertiseAreas } = useQuery<Expertise[]>({
    queryKey: ["/api/expertise"],
    enabled: user?.userType === "professional",
  });

  // Fetch user's professional profile if it exists
  const { data: professionalProfile } = useQuery<ProfessionalProfile>({
    queryKey: ["/api/professional-profiles/by-user"],
    enabled: user?.userType === "professional",
  });

  // Fetch user's company profile if it exists
  const { data: companyProfile } = useQuery<CompanyProfile>({
    queryKey: ["/api/company-profiles/by-user"],
    enabled: user?.userType === "company",
  });

  // Fetch user's expertise if professional profile exists
  const { data: userExpertise } = useQuery<Expertise[]>({
    queryKey: [`/api/professional-profiles/${professionalProfile?.id}/expertise`],
    enabled: !!professionalProfile,
  });

  // Fetch user's certifications if professional profile exists
  const { data: certifications } = useQuery<any[]>({
    queryKey: [`/api/professional-profiles/${professionalProfile?.id}/certifications`],
    enabled: !!professionalProfile,
  });

  // Set up form for professional profile
  const professionalForm = useForm<z.infer<typeof professionalProfileFormSchema>>({
    resolver: zodResolver(professionalProfileFormSchema),
    defaultValues: {
      title: "",
      bio: "",
      location: "",
      videoIntroUrl: "",
      ratePerHour: undefined,
      profileImageUrl: "",
      userId: user?.id,
      newExpertise: "",
      newCertification: {
        name: "",
        issuer: "",
        year: undefined
      }
    },
  });

  // Set up form for company profile
  const companyForm = useForm<z.infer<typeof companyProfileFormSchema>>({
    resolver: zodResolver(companyProfileFormSchema),
    defaultValues: {
      companyName: "",
      industry: "",
      description: "",
      website: "",
      logoUrl: "",
      size: "",
      location: "",
      userId: user?.id,
    },
  });

  // Update form values when profiles are loaded
  useEffect(() => {
    if (professionalProfile && user?.userType === "professional") {
      professionalForm.reset({
        title: professionalProfile.title,
        bio: professionalProfile.bio,
        location: professionalProfile.location,
        videoIntroUrl: professionalProfile.videoIntroUrl || "",
        ratePerHour: professionalProfile.ratePerHour,
        profileImageUrl: professionalProfile.profileImageUrl || "",
        userId: user.id,
        newExpertise: "",
        newCertification: {
          name: "",
          issuer: "",
          year: undefined
        }
      });
    }

    if (companyProfile && user?.userType === "company") {
      companyForm.reset({
        companyName: companyProfile.companyName,
        industry: companyProfile.industry,
        description: companyProfile.description,
        website: companyProfile.website || "",
        logoUrl: companyProfile.logoUrl || "",
        size: companyProfile.size,
        location: companyProfile.location,
        userId: user.id,
      });
    }
  }, [professionalProfile, companyProfile, user]);

  // Update selected expertise when user expertise is loaded
  useEffect(() => {
    if (userExpertise) {
      setSelectedExpertise(userExpertise);
    }
  }, [userExpertise]);

  const handleAddExpertise = async () => {
    const expertiseValue = professionalForm.getValues("newExpertise");
    if (!expertiseValue || expertiseValue.trim() === "") return;

    // Find if this expertise already exists
    const existing = expertiseAreas?.find(
      e => e.name.toLowerCase() === expertiseValue.toLowerCase()
    );

    if (existing) {
      // Check if already selected
      if (selectedExpertise.some(e => e.id === existing.id)) {
        toast({
          title: "Already added",
          description: "This expertise is already in your profile",
          variant: "destructive"
        });
        return;
      }

      // Add to selected
      setSelectedExpertise([...selectedExpertise, existing]);
    } else {
      // Create new expertise
      try {
        const response = await apiRequest("POST", "/api/expertise", { name: expertiseValue });
        const newExpertise = await response.json();
        setSelectedExpertise([...selectedExpertise, newExpertise]);
        
        // Refresh expertise list
        queryClient.invalidateQueries({ queryKey: ["/api/expertise"] });
      } catch (error) {
        toast({
          title: "Failed to add expertise",
          description: "Please try again later",
          variant: "destructive"
        });
      }
    }

    // Clear the input
    professionalForm.setValue("newExpertise", "");
  };

  const handleRemoveExpertise = (expertiseId: number) => {
    setSelectedExpertise(selectedExpertise.filter(e => e.id !== expertiseId));
  };

  const handleAddCertification = async () => {
    if (!professionalProfile) return;
    
    const certData = professionalForm.getValues("newCertification");
    
    if (!certData || !certData.name || !certData.issuer || !certData.year) {
      toast({
        title: "Incomplete information",
        description: "Please fill in all certification fields",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await apiRequest("POST", `/api/professional-profiles/${professionalProfile.id}/certifications`, {
        ...certData,
        professionalId: professionalProfile.id
      });
      
      // Reset form fields
      professionalForm.setValue("newCertification.name", "");
      professionalForm.setValue("newCertification.issuer", "");
      professionalForm.setValue("newCertification.year", undefined);
      
      // Hide the certification form
      setShowCertForm(false);
      
      // Refresh certifications list
      queryClient.invalidateQueries({ 
        queryKey: [`/api/professional-profiles/${professionalProfile.id}/certifications`] 
      });
      
      toast({
        title: "Certification added",
        description: "Your certification has been added successfully"
      });
    } catch (error) {
      toast({
        title: "Failed to add certification",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCertification = async (certId: number) => {
    try {
      await apiRequest("DELETE", `/api/certifications/${certId}`, {});
      
      // Refresh certifications list
      queryClient.invalidateQueries({ 
        queryKey: [`/api/professional-profiles/${professionalProfile?.id}/certifications`] 
      });
      
      toast({
        title: "Certification deleted",
        description: "Your certification has been removed"
      });
    } catch (error) {
      toast({
        title: "Failed to delete certification",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  const onSubmitProfessional = async (data: z.infer<typeof professionalProfileFormSchema>) => {
    try {
      setIsSubmitting(true);
      
      // Remove additional form fields
      const { newExpertise, newCertification, profileImage, ...profileData } = data;
      
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add text fields to FormData
      Object.entries(profileData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });
      
      // Add file if provided
      if (profileImage instanceof File) {
        formData.append('profileImage', profileImage);
      }
      
      let response;
      
      if (professionalProfile) {
        // Update existing profile with FormData
        response = await fetch(
          `/api/professional-profiles/${professionalProfile.id}`, 
          {
            method: 'PUT',
            body: formData,
            credentials: 'include'
          }
        );
      } else {
        // Create new profile with FormData
        response = await fetch(
          "/api/professional-profiles", 
          {
            method: 'POST',
            body: formData,
            credentials: 'include'
          }
        );
      }
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const savedProfile = await response.json();
      
      // Add all selected expertise to the profile
      for (const expertise of selectedExpertise) {
        try {
          // Check if this expertise is already linked to the profile
          if (!userExpertise || !userExpertise.some(e => e.id === expertise.id)) {
            await apiRequest(
              "POST", 
              `/api/professional-profiles/${savedProfile.id}/expertise`, 
              { expertiseId: expertise.id }
            );
          }
        } catch (error) {
          console.error("Failed to link expertise:", error);
        }
      }
      
      toast({
        title: "Profile saved",
        description: "Your professional profile has been updated successfully",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ["/api/professional-profiles/by-user"]
      });
      
      // Redirect to dashboard
      setLocation("/professional-dashboard");
    } catch (error) {
      console.error("Profile update error:", error);
      toast({
        title: "Failed to save profile",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitCompany = async (data: z.infer<typeof companyProfileFormSchema>) => {
    try {
      setIsSubmitting(true);
      
      // Extract file from form data
      const { profileImage, ...profileData } = data;
      
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add text fields to FormData
      Object.entries(profileData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });
      
      // Add file if provided
      if (profileImage instanceof File) {
        formData.append('profileImage', profileImage);
      }
      
      let response;
      
      if (companyProfile) {
        // Update existing profile with FormData
        response = await fetch(
          `/api/company-profiles/${companyProfile.id}`, 
          {
            method: 'PUT',
            body: formData,
            credentials: 'include'
          }
        );
      } else {
        // Create new profile with FormData
        response = await fetch(
          "/api/company-profiles", 
          {
            method: 'POST',
            body: formData,
            credentials: 'include'
          }
        );
      }
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      toast({
        title: "Profile saved",
        description: "Your company profile has been updated successfully",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ["/api/company-profiles/by-user"]
      });
      
      // Redirect to dashboard
      setLocation("/company-dashboard");
    } catch (error) {
      console.error("Profile update error:", error);
      toast({
        title: "Failed to save profile",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Please Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">You need to be signed in to edit your profile.</p>
            <Button onClick={() => setLocation("/login")}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user.userType === "professional") {
    return (
      <Form {...professionalForm}>
        <form onSubmit={professionalForm.handleSubmit(onSubmitProfessional)} className="space-y-8">
          <div className="space-y-6">
            <div className="border p-6 rounded-md shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
              
              <FormField
                control={professionalForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Professional Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Leadership Development Specialist" {...field} />
                    </FormControl>
                    <FormDescription>
                      Your professional title will be displayed on your profile
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={professionalForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. New York, NY" {...field} />
                    </FormControl>
                    <FormDescription>
                      Your primary location for work
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={professionalForm.control}
                name="ratePerHour"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Hourly Rate ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="e.g. 150" 
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Your hourly rate for consultations and services
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={professionalForm.control}
                name="profileImage"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Profile Image</FormLabel>
                    <FormControl>
                      <div className="flex flex-col space-y-2">
                        <Input 
                          type="file" 
                          accept="image/*" 
                          {...fieldProps}
                          onChange={(e) => {
                            // Handle file selection for the form
                            const file = e.target.files?.[0];
                            onChange(file || null);
                          }} 
                        />
                        {/* Show selected file name or existing profile image */}
                        {(value && typeof value === 'object') && (
                          <p className="text-sm text-muted-foreground">
                            Selected: {(value as File).name}
                          </p>
                        )}
                        {professionalProfile?.profileImagePath && (
                          <div className="mt-2">
                            <p className="text-sm text-muted-foreground mb-2">Current image:</p>
                            <img 
                              src={`/${professionalProfile.profileImagePath}`} 
                              alt="Current profile" 
                              className="w-32 h-32 object-cover rounded-md border"
                            />
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription>
                      Upload a professional headshot (JPG, PNG, GIF, WEBP up to 25MB)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="border p-6 rounded-md shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Professional Details</h2>
              
              <FormField
                control={professionalForm.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Professional Bio</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your experience, skills, and what you offer to clients..." 
                        className="min-h-32"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      A detailed description of your experience and expertise
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="mt-6">
                <FormLabel>Areas of Expertise</FormLabel>
                <div className="flex flex-wrap gap-2 mt-2 mb-4">
                  {selectedExpertise.map((expertise) => (
                    <Badge key={expertise.id} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1">
                      {expertise.name}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 p-0 ml-1 text-muted-foreground hover:text-foreground"
                        onClick={() => handleRemoveExpertise(expertise.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                  {selectedExpertise.length === 0 && (
                    <div className="text-sm text-muted-foreground">No expertise areas selected yet</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <FormField
                    control={professionalForm.control}
                    name="newExpertise"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select or type a new expertise" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {expertiseAreas?.map((expertise) => (
                              <SelectItem key={expertise.id} value={expertise.name}>
                                {expertise.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="button" onClick={handleAddExpertise}>
                    <Plus className="mr-2 h-4 w-4" /> Add
                  </Button>
                </div>
              </div>
              
              <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <FormLabel>Certifications</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCertForm(!showCertForm)}
                  >
                    {showCertForm ? "Cancel" : "Add Certification"}
                  </Button>
                </div>
                
                {certifications && certifications.length > 0 ? (
                  <div className="space-y-3 mb-4">
                    {certifications.map((cert) => (
                      <div key={cert.id} className="flex justify-between items-center p-3 border rounded-md">
                        <div>
                          <p className="font-medium">{cert.name}</p>
                          <p className="text-sm text-muted-foreground">{cert.issuer} • {cert.year}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCertification(cert.id)}
                          className="text-destructive hover:text-destructive/90"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground mb-4">No certifications added yet</div>
                )}
                
                {showCertForm && (
                  <div className="p-4 border rounded-md bg-muted/50">
                    <FormField
                      control={professionalForm.control}
                      name="newCertification.name"
                      render={({ field }) => (
                        <FormItem className="mb-3">
                          <FormLabel>Certification Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Project Management Professional (PMP)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={professionalForm.control}
                      name="newCertification.issuer"
                      render={({ field }) => (
                        <FormItem className="mb-3">
                          <FormLabel>Issuing Organization</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Project Management Institute" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={professionalForm.control}
                      name="newCertification.year"
                      render={({ field }) => (
                        <FormItem className="mb-3">
                          <FormLabel>Year</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="e.g. 2022" 
                              {...field}
                              onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="button" onClick={handleAddCertification}>
                      Add Certification
                    </Button>
                  </div>
                )}
              </div>
              
              <FormField
                control={professionalForm.control}
                name="videoIntroUrl"
                render={({ field }) => (
                  <FormItem className="mt-6">
                    <FormLabel>Video Introduction URL</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com/your-video.mp4" 
                        {...field} 
                        value={field.value || ''} 
                      />
                    </FormControl>
                    <FormDescription>
                      Link to a short video introducing yourself and your services
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save Profile"
              )}
            </Button>
          </div>
        </form>
      </Form>
    );
  }

  if (user.userType === "company") {
    return (
      <Form {...companyForm}>
        <form onSubmit={companyForm.handleSubmit(onSubmitCompany)} className="space-y-8">
          <div className="space-y-6">
            <div className="border p-6 rounded-md shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Company Information</h2>
              
              <FormField
                control={companyForm.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Acme Corporation" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <FormField
                  control={companyForm.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Technology">Technology</SelectItem>
                          <SelectItem value="Finance">Finance</SelectItem>
                          <SelectItem value="Healthcare">Healthcare</SelectItem>
                          <SelectItem value="Education">Education</SelectItem>
                          <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                          <SelectItem value="Retail">Retail</SelectItem>
                          <SelectItem value="Professional Services">Professional Services</SelectItem>
                          <SelectItem value="Hospitality">Hospitality</SelectItem>
                          <SelectItem value="Non-profit">Non-profit</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={companyForm.control}
                  name="size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Size</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select company size" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="small">Small (1-50 employees)</SelectItem>
                          <SelectItem value="medium">Medium (51-500 employees)</SelectItem>
                          <SelectItem value="large">Large (501-5000 employees)</SelectItem>
                          <SelectItem value="enterprise">Enterprise (5000+ employees)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={companyForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. San Francisco, CA" {...field} />
                    </FormControl>
                    <FormDescription>
                      Your company's primary location
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={companyForm.control}
                name="website"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com" 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Your company's website URL
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={companyForm.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Logo URL</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com/logo.png" 
                        {...field}
                        value={field.value || ''} 
                      />
                    </FormControl>
                    <FormDescription>
                      URL to your company logo (optional if uploading image below)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={companyForm.control}
                name="profileImage"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Upload Company Logo</FormLabel>
                    <FormControl>
                      <div className="flex flex-col space-y-2">
                        <Input 
                          type="file" 
                          accept="image/*" 
                          {...fieldProps}
                          onChange={(e) => {
                            // Handle file selection for the form
                            const file = e.target.files?.[0];
                            onChange(file || null);
                          }} 
                        />
                        {/* Show selected file name or existing profile image */}
                        {(value && typeof value === 'object') && (
                          <p className="text-sm text-muted-foreground">
                            Selected: {(value as File).name}
                          </p>
                        )}
                        {companyProfile?.logoImagePath && (
                          <div className="mt-2">
                            <p className="text-sm text-muted-foreground mb-2">Current logo:</p>
                            <img 
                              src={`/${companyProfile.logoImagePath}`} 
                              alt="Company logo" 
                              className="w-32 h-32 object-contain rounded-md border"
                            />
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription>
                      Upload a company logo (JPG, PNG, GIF, WEBP up to 25MB)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="border p-6 rounded-md shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Company Description</h2>
              
              <FormField
                control={companyForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your company, its mission, and what types of L&D professionals you're looking for..." 
                        className="min-h-32"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      A detailed description of your company that will help L&D professionals understand your needs
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save Company Profile"
              )}
            </Button>
          </div>
        </form>
      </Form>
    );
  }

  return null;
}
