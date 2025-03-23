import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  RefreshCw,
  Save,
  Mail,
  Bell,
  ShieldCheck,
  Percent,
  Globe,
  CreditCard,
  FileImage,
  Workflow,
  FileCode,
  Check,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Form schemas
const emailSettingsSchema = z.object({
  supportEmail: z.string().email("Must be a valid email address"),
  notificationEmail: z.string().email("Must be a valid email address"),
  emailFooter: z.string(),
  enableWelcomeEmail: z.boolean().default(true),
  enableApplicationNotifications: z.boolean().default(true),
  enablePaymentNotifications: z.boolean().default(true),
});

const platformSettingsSchema = z.object({
  platformName: z.string().min(2, "Platform name must be at least 2 characters"),
  platformDescription: z.string().min(10, "Description must be at least 10 characters"),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email("Must be a valid email address"),
  logoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  faviconUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  defaultLanguage: z.string().default("en"),
});

const paymentSettingsSchema = z.object({
  commissionRate: z.number().min(0, "Must be at least 0").max(100, "Must be at most 100"),
  minimumWithdrawal: z.number().min(0, "Must be at least 0"),
  payoutSchedule: z.enum(["weekly", "biweekly", "monthly"]),
  paymentProcessors: z.array(z.string()).default([]),
  taxRate: z.number().min(0, "Must be at least 0").max(100, "Must be at most 100"),
  currency: z.string().default("USD"),
});

const securitySettingsSchema = z.object({
  sessionTimeoutMinutes: z.number().min(5, "Must be at least 5 minutes").max(1440, "Cannot exceed 24 hours"),
  maxLoginAttempts: z.number().min(3, "Must be at least 3").max(10, "Cannot exceed 10"),
  enableTwoFactor: z.boolean().default(false),
  passwordMinLength: z.number().min(8, "Must be at least 8 characters").max(32, "Cannot exceed 32 characters"),
  passwordRequireSpecial: z.boolean().default(true),
  passwordRequireNumbers: z.boolean().default(true),
});

const integrationSettingsSchema = z.object({
  openaiApiKey: z.string().optional(),
  googleApiKey: z.string().optional(),
  linkedinApiKey: z.string().optional(),
  githubToken: z.string().optional(),
  enableAiFeatures: z.boolean().default(true),
});

type EmailSettingsFormValues = z.infer<typeof emailSettingsSchema>;
type PlatformSettingsFormValues = z.infer<typeof platformSettingsSchema>;
type PaymentSettingsFormValues = z.infer<typeof paymentSettingsSchema>;
type SecuritySettingsFormValues = z.infer<typeof securitySettingsSchema>;
type IntegrationSettingsFormValues = z.infer<typeof integrationSettingsSchema>;

export default function SettingsManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("platform");

  // Default form values - in a real app, these would be loaded from the server
  const defaultEmailSettings: EmailSettingsFormValues = {
    supportEmail: "support@example.com",
    notificationEmail: "notifications@example.com",
    emailFooter: "© 2025 L&D Nexus. All rights reserved.",
    enableWelcomeEmail: true,
    enableApplicationNotifications: true,
    enablePaymentNotifications: true,
  };

  const defaultPlatformSettings: PlatformSettingsFormValues = {
    platformName: "L&D Nexus",
    platformDescription: "A marketplace connecting L&D professionals with companies.",
    contactPhone: "+1 (555) 123-4567",
    contactEmail: "contact@example.com",
    logoUrl: "https://example.com/logo.png",
    faviconUrl: "https://example.com/favicon.ico",
    defaultLanguage: "en",
  };

  const defaultPaymentSettings: PaymentSettingsFormValues = {
    commissionRate: 15,
    minimumWithdrawal: 50,
    payoutSchedule: "biweekly",
    paymentProcessors: ["stripe", "paypal"],
    taxRate: 8.5,
    currency: "USD",
  };

  const defaultSecuritySettings: SecuritySettingsFormValues = {
    sessionTimeoutMinutes: 60,
    maxLoginAttempts: 5,
    enableTwoFactor: false,
    passwordMinLength: 8,
    passwordRequireSpecial: true,
    passwordRequireNumbers: true,
  };

  const defaultIntegrationSettings: IntegrationSettingsFormValues = {
    openaiApiKey: "••••••••••••••••••••••••••••••",
    googleApiKey: "••••••••••••••••••••••••••••••",
    linkedinApiKey: "••••••••••••••••••••••••••••••",
    githubToken: "••••••••••••••••••••••••••••••",
    enableAiFeatures: true,
  };

  // Forms
  const emailForm = useForm<EmailSettingsFormValues>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: defaultEmailSettings,
  });

  const platformForm = useForm<PlatformSettingsFormValues>({
    resolver: zodResolver(platformSettingsSchema),
    defaultValues: defaultPlatformSettings,
  });

  const paymentForm = useForm<PaymentSettingsFormValues>({
    resolver: zodResolver(paymentSettingsSchema),
    defaultValues: defaultPaymentSettings,
  });

  const securityForm = useForm<SecuritySettingsFormValues>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: defaultSecuritySettings,
  });

  const integrationForm = useForm<IntegrationSettingsFormValues>({
    resolver: zodResolver(integrationSettingsSchema),
    defaultValues: defaultIntegrationSettings,
  });

  // Save mutations
  const saveEmailSettingsMutation = useMutation({
    mutationFn: async (data: EmailSettingsFormValues) => {
      // In a real app, this would save to the server
      // const response = await apiRequest("PUT", "/api/admin/settings/email", data);
      // return response.json();
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Email Settings Saved",
        description: "Your email configuration has been updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save email settings",
        variant: "destructive",
      });
    },
  });

  const savePlatformSettingsMutation = useMutation({
    mutationFn: async (data: PlatformSettingsFormValues) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Platform Settings Saved",
        description: "Your platform configuration has been updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save platform settings",
        variant: "destructive",
      });
    },
  });

  const savePaymentSettingsMutation = useMutation({
    mutationFn: async (data: PaymentSettingsFormValues) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Payment Settings Saved",
        description: "Your payment configuration has been updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save payment settings",
        variant: "destructive",
      });
    },
  });

  const saveSecuritySettingsMutation = useMutation({
    mutationFn: async (data: SecuritySettingsFormValues) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Security Settings Saved",
        description: "Your security configuration has been updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save security settings",
        variant: "destructive",
      });
    },
  });

  const saveIntegrationSettingsMutation = useMutation({
    mutationFn: async (data: IntegrationSettingsFormValues) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Integration Settings Saved",
        description: "Your integration configuration has been updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save integration settings",
        variant: "destructive",
      });
    },
  });

  // Handle form submissions
  const onSubmitEmailSettings = (data: EmailSettingsFormValues) => {
    saveEmailSettingsMutation.mutate(data);
  };

  const onSubmitPlatformSettings = (data: PlatformSettingsFormValues) => {
    savePlatformSettingsMutation.mutate(data);
  };

  const onSubmitPaymentSettings = (data: PaymentSettingsFormValues) => {
    savePaymentSettingsMutation.mutate(data);
  };

  const onSubmitSecuritySettings = (data: SecuritySettingsFormValues) => {
    saveSecuritySettingsMutation.mutate(data);
  };

  const onSubmitIntegrationSettings = (data: IntegrationSettingsFormValues) => {
    saveIntegrationSettingsMutation.mutate(data);
  };

  // Reset to defaults
  const resetToDefaults = (formType: string) => {
    switch (formType) {
      case "email":
        emailForm.reset(defaultEmailSettings);
        break;
      case "platform":
        platformForm.reset(defaultPlatformSettings);
        break;
      case "payment":
        paymentForm.reset(defaultPaymentSettings);
        break;
      case "security":
        securityForm.reset(defaultSecuritySettings);
        break;
      case "integration":
        integrationForm.reset(defaultIntegrationSettings);
        break;
    }
    
    toast({
      title: "Settings Reset",
      description: "Settings have been reset to default values",
    });
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5">
          <TabsTrigger value="platform">
            <Globe className="h-4 w-4 mr-2" />
            Platform
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="h-4 w-4 mr-2" />
            Email
          </TabsTrigger>
          <TabsTrigger value="payment">
            <CreditCard className="h-4 w-4 mr-2" />
            Payment
          </TabsTrigger>
          <TabsTrigger value="security">
            <ShieldCheck className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="integration">
            <Workflow className="h-4 w-4 mr-2" />
            Integrations
          </TabsTrigger>
        </TabsList>

        {/* Platform Settings */}
        <TabsContent value="platform">
          <Card>
            <CardHeader>
              <CardTitle>Platform Settings</CardTitle>
              <CardDescription>
                Configure basic platform information and appearance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...platformForm}>
                <form onSubmit={platformForm.handleSubmit(onSubmitPlatformSettings)} className="space-y-4">
                  <FormField
                    control={platformForm.control}
                    name="platformName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Platform Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          The name displayed in the browser title and various places throughout the platform
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={platformForm.control}
                    name="platformDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Platform Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} className="min-h-[100px]" />
                        </FormControl>
                        <FormDescription>
                          A brief description used for SEO and the platform's meta description
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={platformForm.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Email</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={platformForm.control}
                      name="contactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Phone (optional)</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={platformForm.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo URL</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <Input {...field} value={field.value || ""} className="rounded-r-none" />
                            <Button
                              type="button"
                              variant="secondary"
                              className="rounded-l-none"
                              onClick={() => {
                                // In a real app, this would trigger a file upload dialog
                                toast({
                                  title: "Upload Feature",
                                  description: "File upload would be activated here in a real app",
                                });
                              }}
                            >
                              <FileImage className="h-4 w-4" />
                            </Button>
                          </div>
                        </FormControl>
                        <FormDescription>
                          URL to the platform logo image (recommended size: 200x50px)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={platformForm.control}
                    name="faviconUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Favicon URL</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <Input {...field} value={field.value || ""} className="rounded-r-none" />
                            <Button
                              type="button"
                              variant="secondary"
                              className="rounded-l-none"
                              onClick={() => {
                                // In a real app, this would trigger a file upload dialog
                                toast({
                                  title: "Upload Feature",
                                  description: "File upload would be activated here in a real app",
                                });
                              }}
                            >
                              <FileImage className="h-4 w-4" />
                            </Button>
                          </div>
                        </FormControl>
                        <FormDescription>
                          URL to the favicon (recommended size: 32x32px)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={platformForm.control}
                    name="defaultLanguage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Language</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Spanish</SelectItem>
                            <SelectItem value="fr">French</SelectItem>
                            <SelectItem value="de">German</SelectItem>
                            <SelectItem value="zh">Chinese</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Default language for the platform
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => resetToDefaults("platform")}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reset to Defaults
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={savePlatformSettingsMutation.isPending}
                    >
                      {savePlatformSettingsMutation.isPending ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
              <CardDescription>
                Configure email notifications and templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit(onSubmitEmailSettings)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={emailForm.control}
                      name="supportEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Support Email</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            Email for user support inquiries
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={emailForm.control}
                      name="notificationEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notification Email</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            From address for system notifications
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={emailForm.control}
                    name="emailFooter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Footer</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormDescription>
                          Footer text included in all system emails
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4 pt-2">
                    <h3 className="text-sm font-medium">Notification Settings</h3>
                    
                    <FormField
                      control={emailForm.control}
                      name="enableWelcomeEmail"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Welcome Email</FormLabel>
                            <FormDescription>
                              Send welcome email when new users register
                            </FormDescription>
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
                      control={emailForm.control}
                      name="enableApplicationNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Job Application Notifications</FormLabel>
                            <FormDescription>
                              Notify users of job application updates
                            </FormDescription>
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
                      control={emailForm.control}
                      name="enablePaymentNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Payment Notifications</FormLabel>
                            <FormDescription>
                              Send emails for payment events and receipts
                            </FormDescription>
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

                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => resetToDefaults("email")}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reset to Defaults
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={saveEmailSettingsMutation.isPending}
                    >
                      {saveEmailSettingsMutation.isPending ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
              <CardDescription>
                Configure payment options, commissions, and processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...paymentForm}>
                <form onSubmit={paymentForm.handleSubmit(onSubmitPaymentSettings)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={paymentForm.control}
                      name="commissionRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Commission Rate (%)</FormLabel>
                          <FormControl>
                            <div className="flex">
                              <Input 
                                type="number" 
                                min="0" 
                                max="100" 
                                step="0.1"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                              <div className="flex items-center justify-center px-3 border border-l-0 rounded-r-md bg-muted">
                                <Percent className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Platform fee charged on transactions
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={paymentForm.control}
                      name="taxRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax Rate (%)</FormLabel>
                          <FormControl>
                            <div className="flex">
                              <Input 
                                type="number" 
                                min="0" 
                                max="100" 
                                step="0.1"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                              <div className="flex items-center justify-center px-3 border border-l-0 rounded-r-md bg-muted">
                                <Percent className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Default tax rate applied to transactions
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={paymentForm.control}
                      name="minimumWithdrawal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Withdrawal</FormLabel>
                          <FormControl>
                            <div className="flex">
                              <div className="flex items-center justify-center px-3 border border-r-0 rounded-l-md bg-muted">
                                <span className="text-muted-foreground">$</span>
                              </div>
                              <Input 
                                type="number"
                                min="0"
                                step="0.01"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Minimum amount users can withdraw
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={paymentForm.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Currency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="USD">USD - US Dollar</SelectItem>
                              <SelectItem value="EUR">EUR - Euro</SelectItem>
                              <SelectItem value="GBP">GBP - British Pound</SelectItem>
                              <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                              <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Primary currency used on the platform
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={paymentForm.control}
                    name="payoutSchedule"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payout Schedule</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select schedule" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="biweekly">Bi-weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          How frequently payouts are processed
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={paymentForm.control}
                    name="paymentProcessors"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Processors</FormLabel>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="stripe"
                              checked={field.value?.includes("stripe")}
                              onCheckedChange={(checked) => {
                                const current = field.value || [];
                                if (checked) {
                                  field.onChange([...current, "stripe"].filter((v, i, a) => a.indexOf(v) === i));
                                } else {
                                  field.onChange(current.filter(v => v !== "stripe"));
                                }
                              }}
                            />
                            <label
                              htmlFor="stripe"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Stripe
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="paypal"
                              checked={field.value?.includes("paypal")}
                              onCheckedChange={(checked) => {
                                const current = field.value || [];
                                if (checked) {
                                  field.onChange([...current, "paypal"].filter((v, i, a) => a.indexOf(v) === i));
                                } else {
                                  field.onChange(current.filter(v => v !== "paypal"));
                                }
                              }}
                            />
                            <label
                              htmlFor="paypal"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              PayPal
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="bankTransfer"
                              checked={field.value?.includes("bankTransfer")}
                              onCheckedChange={(checked) => {
                                const current = field.value || [];
                                if (checked) {
                                  field.onChange([...current, "bankTransfer"].filter((v, i, a) => a.indexOf(v) === i));
                                } else {
                                  field.onChange(current.filter(v => v !== "bankTransfer"));
                                }
                              }}
                            />
                            <label
                              htmlFor="bankTransfer"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Bank Transfer
                            </label>
                          </div>
                        </div>
                        <FormDescription>
                          Payment methods enabled on the platform
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Payment Processor Configuration</AlertTitle>
                    <AlertDescription>
                      Additional configuration for payment processors can be set up in their respective dashboards.
                      <Button
                        variant="link"
                        className="p-0 h-auto ml-1"
                        onClick={() => window.open("https://dashboard.stripe.com", "_blank")}
                      >
                        Go to Stripe Dashboard <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </AlertDescription>
                  </Alert>

                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => resetToDefaults("payment")}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reset to Defaults
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={savePaymentSettingsMutation.isPending}
                    >
                      {savePaymentSettingsMutation.isPending ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure security options, authentication, and compliance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...securityForm}>
                <form onSubmit={securityForm.handleSubmit(onSubmitSecuritySettings)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={securityForm.control}
                      name="sessionTimeoutMinutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Session Timeout (minutes)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="5" 
                              max="1440"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            How long before inactive users are logged out
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={securityForm.control}
                      name="maxLoginAttempts"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Login Attempts</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="3" 
                              max="10"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Maximum failed login attempts before lockout
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={securityForm.control}
                    name="enableTwoFactor"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Two-Factor Authentication</FormLabel>
                          <FormDescription>
                            Require two-factor authentication for admin users
                          </FormDescription>
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

                  <div className="border rounded-lg p-4 space-y-4">
                    <h3 className="text-sm font-medium">Password Requirements</h3>
                    
                    <FormField
                      control={securityForm.control}
                      name="passwordMinLength"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Password Length</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="8" 
                              max="32"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={securityForm.control}
                        name="passwordRequireSpecial"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Require Special Characters</FormLabel>
                              <FormDescription>
                                Require at least one special character
                              </FormDescription>
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
                        control={securityForm.control}
                        name="passwordRequireNumbers"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Require Numbers</FormLabel>
                              <FormDescription>
                                Require at least one number
                              </FormDescription>
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
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => resetToDefaults("security")}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reset to Defaults
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={saveSecuritySettingsMutation.isPending}
                    >
                      {saveSecuritySettingsMutation.isPending ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integration Settings */}
        <TabsContent value="integration">
          <Card>
            <CardHeader>
              <CardTitle>Integration Settings</CardTitle>
              <CardDescription>
                Configure third-party integrations and API keys
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...integrationForm}>
                <form onSubmit={integrationForm.handleSubmit(onSubmitIntegrationSettings)} className="space-y-4">
                  <FormField
                    control={integrationForm.control}
                    name="enableAiFeatures"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Enable AI Features</FormLabel>
                          <FormDescription>
                            Enable AI-powered features throughout the platform
                          </FormDescription>
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

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>API Keys</AlertTitle>
                    <AlertDescription>
                      Keep your API keys secure. Never expose these keys in client-side code.
                    </AlertDescription>
                  </Alert>

                  <FormField
                    control={integrationForm.control}
                    name="openaiApiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>OpenAI API Key</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="password" 
                            value={field.value || ""} 
                          />
                        </FormControl>
                        <FormDescription>
                          Required for AI skill matching and recommendations
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={integrationForm.control}
                    name="googleApiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Google API Key</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="password" 
                            value={field.value || ""} 
                          />
                        </FormControl>
                        <FormDescription>
                          Required for Google Maps integration and OAuth
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={integrationForm.control}
                    name="linkedinApiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LinkedIn API Key</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="password" 
                            value={field.value || ""} 
                          />
                        </FormControl>
                        <FormDescription>
                          Required for LinkedIn OAuth and profile imports
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={integrationForm.control}
                    name="githubToken"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GitHub Access Token</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="password" 
                            value={field.value || ""} 
                          />
                        </FormControl>
                        <FormDescription>
                          Required for GitHub integration
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Alert className="bg-blue-50 border-blue-200 text-blue-700">
                    <FileCode className="h-4 w-4" />
                    <AlertTitle>Advanced Integration</AlertTitle>
                    <AlertDescription>
                      For custom integrations and webhooks, configure the
                      <Code className="mx-1">server/integrations</Code>
                      directory.
                    </AlertDescription>
                  </Alert>

                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => resetToDefaults("integration")}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reset to Defaults
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={saveIntegrationSettingsMutation.isPending}
                    >
                      {saveIntegrationSettingsMutation.isPending ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Simple code component
function Code({ className, children }: { className?: string, children: React.ReactNode }) {
  return (
    <code className={`bg-muted px-1 py-0.5 rounded text-sm font-mono ${className || ""}`}>
      {children}
    </code>
  );
}

// Simple checkbox component
function Checkbox({ id, checked, onCheckedChange }: { id: string, checked?: boolean, onCheckedChange?: (checked: boolean) => void }) {
  return (
    <div className="h-4 w-4 flex items-center justify-center border rounded">
      {checked && <Check className="h-3 w-3" />}
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        className="opacity-0 absolute h-4 w-4 cursor-pointer"
      />
    </div>
  );
}