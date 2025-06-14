import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Bell, Shield, User, Eye, Mail, Phone } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    messages: true,
    jobAlerts: true,
    marketing: false
  });

  const [privacy, setPrivacy] = useState({
    profileVisibility: true,
    showEmail: false,
    showPhone: false,
    activityStatus: true
  });

  // Fetch user preferences
  const { data: userPreferences } = useQuery({
    queryKey: ['/api/user/preferences'],
    enabled: !!user
  });

  // Update preferences mutation
  const updatePreferences = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/user/preferences', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Your preferences have been saved successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/preferences'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Load preferences from API when available
  useEffect(() => {
    if (userPreferences) {
      setNotifications(prev => ({ ...prev, ...userPreferences.notifications }));
      setPrivacy(prev => ({ ...prev, ...userPreferences.privacy }));
    }
  }, [userPreferences]);

  const handleNotificationChange = (key: string, value: boolean) => {
    const newNotifications = { ...notifications, [key]: value };
    setNotifications(newNotifications);
    updatePreferences.mutate({ notifications: newNotifications });
  };

  const handlePrivacyChange = (key: string, value: boolean) => {
    const newPrivacy = { ...privacy, [key]: value };
    setPrivacy(newPrivacy);
    updatePreferences.mutate({ privacy: newPrivacy });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-600 mt-2">Manage your account preferences and privacy settings</p>
        </div>

        <div className="space-y-6">
          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose how you want to be notified about important updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-slate-600">Receive notifications via email</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={notifications.email}
                  onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                  <p className="text-sm text-slate-600">Receive browser push notifications</p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={notifications.push}
                  onCheckedChange={(checked) => handleNotificationChange('push', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="message-notifications">New Messages</Label>
                  <p className="text-sm text-slate-600">Get notified when you receive new messages</p>
                </div>
                <Switch
                  id="message-notifications"
                  checked={notifications.messages}
                  onCheckedChange={(checked) => handleNotificationChange('messages', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="job-alerts">Job Alerts</Label>
                  <p className="text-sm text-slate-600">Receive alerts for relevant job opportunities</p>
                </div>
                <Switch
                  id="job-alerts"
                  checked={notifications.jobAlerts}
                  onCheckedChange={(checked) => handleNotificationChange('jobAlerts', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="marketing">Marketing Communications</Label>
                  <p className="text-sm text-slate-600">Receive updates about new features and promotions</p>
                </div>
                <Switch
                  id="marketing"
                  checked={notifications.marketing}
                  onCheckedChange={(checked) => handleNotificationChange('marketing', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Visibility
              </CardTitle>
              <CardDescription>
                Control who can see your information and activity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="profile-visibility">Public Profile</Label>
                  <p className="text-sm text-slate-600">Make your profile visible to other users</p>
                </div>
                <Switch
                  id="profile-visibility"
                  checked={privacy.profileVisibility}
                  onCheckedChange={(checked) => handlePrivacyChange('profileVisibility', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-500" />
                  <div>
                    <Label htmlFor="show-email">Show Email Address</Label>
                    <p className="text-sm text-slate-600">Display your email on your public profile</p>
                  </div>
                </div>
                <Switch
                  id="show-email"
                  checked={privacy.showEmail}
                  onCheckedChange={(checked) => handlePrivacyChange('showEmail', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-500" />
                  <div>
                    <Label htmlFor="show-phone">Show Phone Number</Label>
                    <p className="text-sm text-slate-600">Display your phone number on your public profile</p>
                  </div>
                </div>
                <Switch
                  id="show-phone"
                  checked={privacy.showPhone}
                  onCheckedChange={(checked) => handlePrivacyChange('showPhone', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex items-center gap-2">
                  <Eye className="h-4 w-4 text-slate-500" />
                  <div>
                    <Label htmlFor="activity-status">Activity Status</Label>
                    <p className="text-sm text-slate-600">Show when you're online or recently active</p>
                  </div>
                </div>
                <Switch
                  id="activity-status"
                  checked={privacy.activityStatus}
                  onCheckedChange={(checked) => handlePrivacyChange('activityStatus', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Management
              </CardTitle>
              <CardDescription>
                Manage your account settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="justify-start">
                  Change Password
                </Button>
                <Button variant="outline" className="justify-start">
                  Two-Factor Authentication
                </Button>
                <Button variant="outline" className="justify-start">
                  Download Data
                </Button>
                <Button variant="outline" className="justify-start text-red-600 hover:text-red-700">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Save Changes */}
          <div className="flex justify-end">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}