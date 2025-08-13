import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Bell, Shield, Eye, Save, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Typing for settings
interface Settings {
  notifications: boolean;
  profileVisible: boolean;
  contactVisible: boolean;
  emailUpdates: boolean;
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // State
  const [settings, setSettings] = useState<Settings | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch settings
  const { data: userSettings } = useQuery({
    queryKey: ['/api/user-settings'],
    queryFn: async () => {
      const response = await fetch('/api/user-settings');
      if (response.ok) {
        const data = await response.json();
        console.log("User settings response", data);
        return data;
      }
      return null;
    },
    enabled: !!user,
  });

  // Apply settings
  useEffect(() => {
    if (userSettings) {
      setSettings({
        notifications: userSettings.notifications ?? true,
        profileVisible: userSettings.profileVisible ?? true,
        contactVisible: userSettings.contactVisible ?? true,
        emailUpdates: userSettings.emailUpdates ?? false
      });
    }
  }, [userSettings]);

  // Save mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (settingsData: Settings) => {
      return apiRequest('PUT', '/api/user-settings', settingsData);
    },
    onSuccess: () => {
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['/api/user-settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', '/api/delete-account');
    },
    onSuccess: () => {
      toast({
        title: "Account Deleted",
        description: "Your account has been successfully deleted.",
      });
      // Logout and redirect to home
      logout();
      setLocation('/');
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error?.message || "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    },
  });

  // If no user
  if (!user) {
    return <div>Please log in to access settings.</div>;
  }

  // If settings not yet loaded
  if (!settings) {
    return <div>Loading settings...</div>;
  }

  // Update setting
  const updateSetting = (key: keyof Settings, value: boolean) => {
    setSettings(prev => ({
      ...prev!,
      [key]: value
    }));
    setHasChanges(true);
  };

  // Save
  const handleSave = () => {
    console.log("SAVE BUTTON CLICKED", settings);
    saveSettingsMutation.mutate(settings);
  };

  // Delete account
  const handleDeleteAccount = () => {
    if (showDeleteConfirm) {
      deleteAccountMutation.mutate();
    } else {
      setShowDeleteConfirm(true);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Settings</h1>
        <p className="text-slate-600">Manage your account preferences</p>
      </div>

      <div className="space-y-6">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base">All Notifications</Label>
              <Switch
                checked={settings.notifications}
                onCheckedChange={(checked) => updateSetting('notifications', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label className="text-base">Email Updates</Label>
              <Switch
                checked={settings.emailUpdates}
                onCheckedChange={(checked) => updateSetting('emailUpdates', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base">Profile Visible</Label>
              <Switch
                checked={settings.profileVisible}
                onCheckedChange={(checked) => updateSetting('profileVisible', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-base">Contact Visible</Label>
              <Switch
                checked={settings.contactVisible}
                onCheckedChange={(checked) => updateSetting('contactVisible', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base">Edit Profile</Label>
              <Link href="/edit-profile">
                <Button variant="outline">Edit Profile</Button>
              </Link>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label className="text-base">Subscription</Label>
              <Link href="/subscription-plans">
                <Button variant="outline">Manage Plan</Button>
              </Link>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label className="text-base">Save Settings</Label>
              <Button
                onClick={handleSave}
                disabled={!hasChanges || saveSettingsMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="mr-2 h-4 w-4" />
                {saveSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
             <Separator />
                 <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Delete Account</Label>
              </div>
              <div className="flex flex-col gap-2">
                {showDeleteConfirm && (
                  <p className="text-sm text-red-600 font-medium">
                    Are you sure? Click again to confirm.
                  </p>
                )}
                <Button
                  onClick={handleDeleteAccount}
                  disabled={deleteAccountMutation.isPending}
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {deleteAccountMutation.isPending 
                    ? 'Deleting...' 
                    : showDeleteConfirm 
                      ? 'Confirm Delete' 
                      : 'Delete Account'
                  }
                </Button>
                {showDeleteConfirm && (
                  <Button
                    onClick={() => setShowDeleteConfirm(false)}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}