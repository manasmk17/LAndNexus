import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Settings, Bell, Shield, CreditCard, Users, Eye, Download, HelpCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State for various settings
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [jobAlerts, setJobAlerts] = useState(true);
  const [applicationAlerts, setApplicationAlerts] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(false);
  const [profileVisible, setProfileVisible] = useState(true);
  const [contactInfoVisible, setContactInfoVisible] = useState(false);

  if (!user) {
    return <div>Please log in to access settings.</div>;
  }

  const isCompany = user.userType === "company";
  const isProfessional = user.userType === "professional";

  // Handler functions
  const handleChangePassword = () => {
    toast({
      title: "Change Password",
      description: "Password change feature will be implemented soon.",
    });
  };

  const handleManagePlan = () => {
    toast({
      title: "Manage Plan",
      description: "Redirecting to subscription management...",
    });
  };

  const handleManagePayment = () => {
    toast({
      title: "Payment Methods",
      description: "Payment management feature will be implemented soon.",
    });
  };

  const handleManageTeam = () => {
    toast({
      title: "Team Management",
      description: "Team management feature will be implemented soon.",
    });
  };

  const handleConfigureDefaults = () => {
    toast({
      title: "Job Posting Defaults",
      description: "Configuration feature will be implemented soon.",
    });
  };

  const handleExportData = () => {
    toast({
      title: "Export Data",
      description: "Data export will begin shortly...",
    });
  };

  const handleDeleteAccount = () => {
    toast({
      title: "Delete Account",
      description: "Account deletion requires additional verification.",
      variant: "destructive",
    });
  };

  const handleContactSupport = () => {
    toast({
      title: "Contact Support",
      description: "Redirecting to support page...",
    });
  };

  const handleViewTerms = () => {
    toast({
      title: "Terms & Privacy",
      description: "Opening legal documents...",
    });
  };

  const handleSwitchChange = (setter: (value: boolean) => void, settingName: string) => {
    return (checked: boolean) => {
      setter(checked);
      toast({
        title: "Settings Updated",
        description: `${settingName} ${checked ? 'enabled' : 'disabled'}`,
      });
    };
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Settings</h1>
        <p className="text-slate-600">Manage your account preferences and settings</p>
      </div>

      <div className="space-y-6">
        {/* Account Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Security
            </CardTitle>
            <CardDescription>
              Manage your password and security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Change Password</Label>
                <p className="text-sm text-slate-500">Update your account password</p>
              </div>
              <Button variant="outline" onClick={handleChangePassword}>Change Password</Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Two-Factor Authentication</Label>
                <p className="text-sm text-slate-500">Add an extra layer of security</p>
              </div>
              <Switch 
                checked={twoFactorEnabled}
                onCheckedChange={handleSwitchChange(setTwoFactorEnabled, "Two-Factor Authentication")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Choose what notifications you'd like to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isProfessional && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Job Alerts</Label>
                    <p className="text-sm text-slate-500">Get notified about new job opportunities</p>
                  </div>
                  <Switch 
                    checked={jobAlerts}
                    onCheckedChange={handleSwitchChange(setJobAlerts, "Job Alerts")}
                  />
                </div>
                <Separator />
              </>
            )}
            {isCompany && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Application Alerts</Label>
                    <p className="text-sm text-slate-500">Get notified when someone applies to your jobs</p>
                  </div>
                  <Switch 
                    checked={applicationAlerts}
                    onCheckedChange={handleSwitchChange(setApplicationAlerts, "Application Alerts")}
                  />
                </div>
                <Separator />
              </>
            )}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Message Notifications</Label>
                <p className="text-sm text-slate-500">Get notified about new messages</p>
              </div>
              <Switch 
                checked={messageNotifications}
                onCheckedChange={handleSwitchChange(setMessageNotifications, "Message Notifications")}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Email Updates</Label>
                <p className="text-sm text-slate-500">Receive platform updates via email</p>
              </div>
              <Switch 
                checked={emailUpdates}
                onCheckedChange={handleSwitchChange(setEmailUpdates, "Email Updates")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Privacy Settings
            </CardTitle>
            <CardDescription>
              Control who can see your information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Profile Visibility</Label>
                <p className="text-sm text-slate-500">Make your profile visible to others</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Contact Information</Label>
                <p className="text-sm text-slate-500">Allow others to see your contact details</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Billing & Subscription */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Billing & Subscription
            </CardTitle>
            <CardDescription>
              Manage your subscription and payment methods
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Current Plan</Label>
                <p className="text-sm text-slate-500">Professional Plan - Active</p>
              </div>
              <Button variant="outline">Manage Plan</Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Payment Methods</Label>
                <p className="text-sm text-slate-500">Manage your payment methods</p>
              </div>
              <Button variant="outline">Manage</Button>
            </div>
          </CardContent>
        </Card>

        {/* Company-specific settings */}
        {isCompany && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Management
              </CardTitle>
              <CardDescription>
                Manage team members and permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Team Members</Label>
                  <p className="text-sm text-slate-500">Add or remove team members</p>
                </div>
                <Button variant="outline">Manage Team</Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Job Posting Defaults</Label>
                  <p className="text-sm text-slate-500">Set default preferences for job postings</p>
                </div>
                <Button variant="outline">Configure</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Data Management
            </CardTitle>
            <CardDescription>
              Export or manage your data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Export Data</Label>
                <p className="text-sm text-slate-500">Download a copy of your data</p>
              </div>
              <Button variant="outline">Export</Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base text-red-600">Delete Account</Label>
                <p className="text-sm text-slate-500">Permanently delete your account and data</p>
              </div>
              <Button variant="destructive">Delete Account</Button>
            </div>
          </CardContent>
        </Card>

        {/* Help & Support */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Help & Support
            </CardTitle>
            <CardDescription>
              Get help and view legal information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Contact Support</Label>
                <p className="text-sm text-slate-500">Get help from our support team</p>
              </div>
              <Button variant="outline">Contact Us</Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Terms & Privacy</Label>
                <p className="text-sm text-slate-500">Review our terms and privacy policy</p>
              </div>
              <Button variant="outline">View</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}