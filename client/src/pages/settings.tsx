import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Bell, Shield, Eye } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Simplified settings state
  const [settings, setSettings] = useState({
    notifications: true,
    profileVisible: true,
    emailUpdates: false
  });

  if (!user) {
    return <div>Please log in to access settings.</div>;
  }

  // Simple setting update function
  const updateSetting = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    toast({
      title: "Setting Updated",
      description: `${key.charAt(0).toUpperCase() + key.slice(1)} ${value ? 'enabled' : 'disabled'}`,
    });
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
          </CardContent>
        </Card>

        {/* Account Actions */}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}