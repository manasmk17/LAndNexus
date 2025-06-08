import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Save,
  Settings,
  Bell,
  Mail,
  Lock,
  CreditCard,
  PenSquare,
  Database,
  Upload,
  Download,
  Globe,
  Sparkles,
  Cloud,
  ShieldCheck
} from "lucide-react";

// Example settings
const initialGeneralSettings = {
  siteName: "L&D Nexus",
  siteUrl: "https://ldnexus.com",
  adminEmail: "admin@ldnexus.com",
  timeZone: "America/New_York",
  dateFormat: "MM/DD/YYYY",
  defaultLanguage: "en",
  maintenanceMode: false,
};

const initialEmailSettings = {
  smtpServer: "smtp.example.com",
  smtpPort: "587",
  smtpUser: "notifications@ldnexus.com",
  smtpPassword: "••••••••••••",
  fromEmail: "no-reply@ldnexus.com",
  fromName: "L&D Nexus",
  contactEmail: "support@ldnexus.com",
  enableEmailVerification: true,
  enableWelcomeEmail: true,
  enableNotificationEmails: true,
};

const initialPaymentSettings = {
  currencyCode: "USD",
  currencySymbol: "$",
  stripeEnabled: true,
  stripeMode: "sandbox",
  paypalEnabled: true,
  paypalMode: "sandbox",
  commissionRate: "10",
  minimumPayout: "50",
  invoicePrefix: "INV-",
  invoiceDueDays: "14",
  autoRenewSubscriptions: true,
};

const initialNotificationSettings = {
  enablePush: true,
  enableSiteNotifications: true,
  enableEmailNotifications: true,
  emailNewMessage: true,
  emailNewJobApplication: true,
  emailNewJobPosting: true,
  emailPaymentReceived: true,
  emailPaymentFailed: true,
  emailSubscriptionRenewal: true,
  emailWeeklySummary: true,
};

const initialSecuritySettings = {
  enableTwoFactor: true,
  requirePasswordReset: "90",
  minimumPasswordLength: "8",
  passwordStrengthLevel: "medium",
  maxLoginAttempts: "5",
  sessionTimeout: "120",
  enableCaptcha: true,
  allowedLoginIPs: "",
  enableDashboardNotices: true,
};

const initialAISettings = {
  openAIEnabled: true,
  openAIModel: "gpt-4",
  matchingThreshold: "80",
  enableAutomaticSuggestions: true,
  enableAIResourceTagging: true,
  maxTokensPerRequest: "4000",
  enableChatAssistant: true,
  enableSkillRecommendations: true,
  enableCareerPathSuggestions: true,
};

export default function SettingsManagement() {
  const [activeTab, setActiveTab] = useState("general");
  const [generalSettings, setGeneralSettings] = useState(initialGeneralSettings);
  const [emailSettings, setEmailSettings] = useState(initialEmailSettings);
  const [paymentSettings, setPaymentSettings] = useState(initialPaymentSettings);
  const [notificationSettings, setNotificationSettings] = useState(initialNotificationSettings);
  const [securitySettings, setSecuritySettings] = useState(initialSecuritySettings);
  const [aiSettings, setAISettings] = useState(initialAISettings);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSaveSettings = () => {
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      
      toast({
        title: "Settings saved",
        description: "Your changes have been saved successfully.",
      });
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Platform Settings</h2>
        <Button onClick={handleSaveSettings} disabled={isSaving} className="flex items-center gap-2">
          {isSaving ? "Saving..." : "Save All Settings"}
          <Save className="h-4 w-4" />
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 w-full">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>General</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span>Email</span>
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span>Payment</span>
          </TabsTrigger>
          <TabsTrigger value="notification" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <span>Security</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span>AI Settings</span>
          </TabsTrigger>
        </TabsList>
        
        {/* General Settings Tab */}
        <TabsContent value="general" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure basic platform settings and defaults.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={generalSettings.siteName}
                    onChange={(e) => setGeneralSettings({...generalSettings, siteName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteUrl">Site URL</Label>
                  <Input
                    id="siteUrl"
                    value={generalSettings.siteUrl}
                    onChange={(e) => setGeneralSettings({...generalSettings, siteUrl: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Admin Email</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={generalSettings.adminEmail}
                    onChange={(e) => setGeneralSettings({...generalSettings, adminEmail: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeZone">Time Zone</Label>
                  <Select 
                    value={generalSettings.timeZone} 
                    onValueChange={(value) => setGeneralSettings({...generalSettings, timeZone: value})}
                  >
                    <SelectTrigger id="timeZone">
                      <SelectValue placeholder="Select time zone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Central European Time (CET)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Japan Standard Time (JST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select 
                    value={generalSettings.dateFormat} 
                    onValueChange={(value) => setGeneralSettings({...generalSettings, dateFormat: value})}
                  >
                    <SelectTrigger id="dateFormat">
                      <SelectValue placeholder="Select date format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      <SelectItem value="MMM D, YYYY">MMM D, YYYY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultLanguage">Default Language</Label>
                  <Select 
                    value={generalSettings.defaultLanguage} 
                    onValueChange={(value) => setGeneralSettings({...generalSettings, defaultLanguage: value})}
                  >
                    <SelectTrigger id="defaultLanguage">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-4">
                <Switch
                  id="maintenanceMode"
                  checked={generalSettings.maintenanceMode}
                  onCheckedChange={(checked) => setGeneralSettings({...generalSettings, maintenanceMode: checked})}
                />
                <Label htmlFor="maintenanceMode" className="font-medium">Enable Maintenance Mode</Label>
              </div>
              <div className="pt-4 flex gap-2 justify-end">
                <Button onClick={handleSaveSettings} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Email Settings Tab */}
        <TabsContent value="email" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
              <CardDescription>
                Configure email server settings and notification templates.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="smtpServer">SMTP Server</Label>
                  <Input
                    id="smtpServer"
                    value={emailSettings.smtpServer}
                    onChange={(e) => setEmailSettings({...emailSettings, smtpServer: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input
                    id="smtpPort"
                    value={emailSettings.smtpPort}
                    onChange={(e) => setEmailSettings({...emailSettings, smtpPort: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpUser">SMTP Username</Label>
                  <Input
                    id="smtpUser"
                    value={emailSettings.smtpUser}
                    onChange={(e) => setEmailSettings({...emailSettings, smtpUser: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">SMTP Password</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    value={emailSettings.smtpPassword}
                    onChange={(e) => setEmailSettings({...emailSettings, smtpPassword: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromEmail">From Email</Label>
                  <Input
                    id="fromEmail"
                    value={emailSettings.fromEmail}
                    onChange={(e) => setEmailSettings({...emailSettings, fromEmail: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromName">From Name</Label>
                  <Input
                    id="fromName"
                    value={emailSettings.fromName}
                    onChange={(e) => setEmailSettings({...emailSettings, fromName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    value={emailSettings.contactEmail}
                    onChange={(e) => setEmailSettings({...emailSettings, contactEmail: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-4 pt-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableEmailVerification"
                    checked={emailSettings.enableEmailVerification}
                    onCheckedChange={(checked) => setEmailSettings({...emailSettings, enableEmailVerification: checked})}
                  />
                  <Label htmlFor="enableEmailVerification" className="font-medium">
                    Require Email Verification for New Users
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableWelcomeEmail"
                    checked={emailSettings.enableWelcomeEmail}
                    onCheckedChange={(checked) => setEmailSettings({...emailSettings, enableWelcomeEmail: checked})}
                  />
                  <Label htmlFor="enableWelcomeEmail" className="font-medium">
                    Send Welcome Email to New Users
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableNotificationEmails"
                    checked={emailSettings.enableNotificationEmails}
                    onCheckedChange={(checked) => setEmailSettings({...emailSettings, enableNotificationEmails: checked})}
                  />
                  <Label htmlFor="enableNotificationEmails" className="font-medium">
                    Enable System Notification Emails
                  </Label>
                </div>
              </div>
              <div className="pt-4 flex gap-2 justify-end">
                <Button variant="outline" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Test Email
                </Button>
                <Button onClick={handleSaveSettings} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Payment Settings Tab */}
        <TabsContent value="payment" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
              <CardDescription>
                Configure payment processors, currencies, and transaction settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="currencyCode">Currency Code</Label>
                  <Select 
                    value={paymentSettings.currencyCode} 
                    onValueChange={(value) => setPaymentSettings({...paymentSettings, currencyCode: value})}
                  >
                    <SelectTrigger id="currencyCode">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                      <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                      <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currencySymbol">Currency Symbol</Label>
                  <Input
                    id="currencySymbol"
                    value={paymentSettings.currencySymbol}
                    onChange={(e) => setPaymentSettings({...paymentSettings, currencySymbol: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                  <Input
                    id="commissionRate"
                    type="number"
                    min="0"
                    max="100"
                    value={paymentSettings.commissionRate}
                    onChange={(e) => setPaymentSettings({...paymentSettings, commissionRate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimumPayout">Minimum Payout Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5">{paymentSettings.currencySymbol}</span>
                    <Input
                      id="minimumPayout"
                      type="number"
                      className="pl-7"
                      min="0"
                      value={paymentSettings.minimumPayout}
                      onChange={(e) => setPaymentSettings({...paymentSettings, minimumPayout: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                  <Input
                    id="invoicePrefix"
                    value={paymentSettings.invoicePrefix}
                    onChange={(e) => setPaymentSettings({...paymentSettings, invoicePrefix: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoiceDueDays">Invoice Due Days</Label>
                  <Input
                    id="invoiceDueDays"
                    type="number"
                    min="1"
                    value={paymentSettings.invoiceDueDays}
                    onChange={(e) => setPaymentSettings({...paymentSettings, invoiceDueDays: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="border rounded-md p-4 mt-4">
                <h3 className="text-lg font-medium mb-4">Payment Processors</h3>
                <div className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="stripeEnabled" className="font-medium">Stripe</Label>
                        <div className="text-sm text-muted-foreground">
                          (Credit card payments)
                        </div>
                      </div>
                      <Switch
                        id="stripeEnabled"
                        checked={paymentSettings.stripeEnabled}
                        onCheckedChange={(checked) => setPaymentSettings({...paymentSettings, stripeEnabled: checked})}
                      />
                    </div>
                    {paymentSettings.stripeEnabled && (
                      <div className="pl-6 border-l-2 border-muted ml-2">
                        <div className="space-y-2 mb-2">
                          <Label htmlFor="stripeMode">Mode</Label>
                          <Select 
                            value={paymentSettings.stripeMode} 
                            onValueChange={(value) => setPaymentSettings({...paymentSettings, stripeMode: value})}
                          >
                            <SelectTrigger id="stripeMode">
                              <SelectValue placeholder="Select mode" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="live">Live</SelectItem>
                              <SelectItem value="sandbox">Sandbox (Test)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button variant="outline" size="sm" className="mt-2">
                          Configure API Keys
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="paypalEnabled" className="font-medium">PayPal</Label>
                        <div className="text-sm text-muted-foreground">
                          (PayPal account payments)
                        </div>
                      </div>
                      <Switch
                        id="paypalEnabled"
                        checked={paymentSettings.paypalEnabled}
                        onCheckedChange={(checked) => setPaymentSettings({...paymentSettings, paypalEnabled: checked})}
                      />
                    </div>
                    {paymentSettings.paypalEnabled && (
                      <div className="pl-6 border-l-2 border-muted ml-2">
                        <div className="space-y-2 mb-2">
                          <Label htmlFor="paypalMode">Mode</Label>
                          <Select 
                            value={paymentSettings.paypalMode} 
                            onValueChange={(value) => setPaymentSettings({...paymentSettings, paypalMode: value})}
                          >
                            <SelectTrigger id="paypalMode">
                              <SelectValue placeholder="Select mode" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="live">Live</SelectItem>
                              <SelectItem value="sandbox">Sandbox (Test)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button variant="outline" size="sm" className="mt-2">
                          Configure API Keys
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 pt-4">
                <Switch
                  id="autoRenewSubscriptions"
                  checked={paymentSettings.autoRenewSubscriptions}
                  onCheckedChange={(checked) => setPaymentSettings({...paymentSettings, autoRenewSubscriptions: checked})}
                />
                <Label htmlFor="autoRenewSubscriptions" className="font-medium">
                  Auto-renew Subscriptions
                </Label>
              </div>
              
              <div className="pt-4 flex gap-2 justify-end">
                <Button onClick={handleSaveSettings} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Notification Settings Tab */}
        <TabsContent value="notification" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure system notifications and alerts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">General Notification Settings</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enablePush"
                      checked={notificationSettings.enablePush}
                      onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, enablePush: checked})}
                    />
                    <Label htmlFor="enablePush" className="font-medium">
                      Enable Push Notifications
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableSiteNotifications"
                      checked={notificationSettings.enableSiteNotifications}
                      onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, enableSiteNotifications: checked})}
                    />
                    <Label htmlFor="enableSiteNotifications" className="font-medium">
                      Enable In-App Notifications
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableEmailNotifications"
                      checked={notificationSettings.enableEmailNotifications}
                      onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, enableEmailNotifications: checked})}
                    />
                    <Label htmlFor="enableEmailNotifications" className="font-medium">
                      Enable Email Notifications
                    </Label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 pt-4">
                <h3 className="text-lg font-medium">Email Notification Events</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="emailNewMessage"
                      checked={notificationSettings.emailNewMessage}
                      onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, emailNewMessage: checked})}
                      disabled={!notificationSettings.enableEmailNotifications}
                    />
                    <Label htmlFor="emailNewMessage" className={!notificationSettings.enableEmailNotifications ? "text-muted-foreground" : ""}>
                      New Message Received
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="emailNewJobApplication"
                      checked={notificationSettings.emailNewJobApplication}
                      onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, emailNewJobApplication: checked})}
                      disabled={!notificationSettings.enableEmailNotifications}
                    />
                    <Label htmlFor="emailNewJobApplication" className={!notificationSettings.enableEmailNotifications ? "text-muted-foreground" : ""}>
                      New Job Application
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="emailNewJobPosting"
                      checked={notificationSettings.emailNewJobPosting}
                      onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, emailNewJobPosting: checked})}
                      disabled={!notificationSettings.enableEmailNotifications}
                    />
                    <Label htmlFor="emailNewJobPosting" className={!notificationSettings.enableEmailNotifications ? "text-muted-foreground" : ""}>
                      New Job Posting
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="emailPaymentReceived"
                      checked={notificationSettings.emailPaymentReceived}
                      onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, emailPaymentReceived: checked})}
                      disabled={!notificationSettings.enableEmailNotifications}
                    />
                    <Label htmlFor="emailPaymentReceived" className={!notificationSettings.enableEmailNotifications ? "text-muted-foreground" : ""}>
                      Payment Received
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="emailPaymentFailed"
                      checked={notificationSettings.emailPaymentFailed}
                      onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, emailPaymentFailed: checked})}
                      disabled={!notificationSettings.enableEmailNotifications}
                    />
                    <Label htmlFor="emailPaymentFailed" className={!notificationSettings.enableEmailNotifications ? "text-muted-foreground" : ""}>
                      Payment Failed
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="emailSubscriptionRenewal"
                      checked={notificationSettings.emailSubscriptionRenewal}
                      onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, emailSubscriptionRenewal: checked})}
                      disabled={!notificationSettings.enableEmailNotifications}
                    />
                    <Label htmlFor="emailSubscriptionRenewal" className={!notificationSettings.enableEmailNotifications ? "text-muted-foreground" : ""}>
                      Subscription Renewal
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="emailWeeklySummary"
                      checked={notificationSettings.emailWeeklySummary}
                      onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, emailWeeklySummary: checked})}
                      disabled={!notificationSettings.enableEmailNotifications}
                    />
                    <Label htmlFor="emailWeeklySummary" className={!notificationSettings.enableEmailNotifications ? "text-muted-foreground" : ""}>
                      Weekly Activity Summary
                    </Label>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 flex gap-2 justify-end">
                <Button onClick={handleSaveSettings} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Security Settings Tab */}
        <TabsContent value="security" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure security options and authentication settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="minimumPasswordLength">Minimum Password Length</Label>
                  <Input
                    id="minimumPasswordLength"
                    type="number"
                    min="6"
                    max="32"
                    value={securitySettings.minimumPasswordLength}
                    onChange={(e) => setSecuritySettings({...securitySettings, minimumPasswordLength: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordStrengthLevel">Password Strength Requirement</Label>
                  <Select 
                    value={securitySettings.passwordStrengthLevel} 
                    onValueChange={(value) => setSecuritySettings({...securitySettings, passwordStrengthLevel: value})}
                  >
                    <SelectTrigger id="passwordStrengthLevel">
                      <SelectValue placeholder="Select strength level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (Letters and numbers)</SelectItem>
                      <SelectItem value="medium">Medium (Mixed case + numbers)</SelectItem>
                      <SelectItem value="high">High (Mixed case, numbers, symbols)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requirePasswordReset">Password Reset Interval (days)</Label>
                  <Input
                    id="requirePasswordReset"
                    type="number"
                    min="0"
                    max="365"
                    value={securitySettings.requirePasswordReset}
                    onChange={(e) => setSecuritySettings({...securitySettings, requirePasswordReset: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground">Set to 0 to disable</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    min="3"
                    max="10"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) => setSecuritySettings({...securitySettings, maxLoginAttempts: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    min="15"
                    max="1440"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="allowedLoginIPs">Allowed Admin Login IPs</Label>
                  <Textarea
                    id="allowedLoginIPs"
                    placeholder="Enter IPs separated by commas (leave blank to allow all)"
                    value={securitySettings.allowedLoginIPs}
                    onChange={(e) => setSecuritySettings({...securitySettings, allowedLoginIPs: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground">Separate multiple IPs with commas</p>
                </div>
              </div>
              
              <div className="space-y-4 pt-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableTwoFactor"
                    checked={securitySettings.enableTwoFactor}
                    onCheckedChange={(checked) => setSecuritySettings({...securitySettings, enableTwoFactor: checked})}
                  />
                  <Label htmlFor="enableTwoFactor" className="font-medium">
                    Enable Two-Factor Authentication Option for Users
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableCaptcha"
                    checked={securitySettings.enableCaptcha}
                    onCheckedChange={(checked) => setSecuritySettings({...securitySettings, enableCaptcha: checked})}
                  />
                  <Label htmlFor="enableCaptcha" className="font-medium">
                    Enable CAPTCHA on Login and Registration
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableDashboardNotices"
                    checked={securitySettings.enableDashboardNotices}
                    onCheckedChange={(checked) => setSecuritySettings({...securitySettings, enableDashboardNotices: checked})}
                  />
                  <Label htmlFor="enableDashboardNotices" className="font-medium">
                    Show Security Notices on Dashboard
                  </Label>
                </div>
              </div>
              
              <div className="pt-4 flex gap-2 justify-end">
                <Button variant="outline" className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Run Security Scan
                </Button>
                <Button onClick={handleSaveSettings} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* AI Settings Tab */}
        <TabsContent value="ai" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI and Machine Learning Settings</CardTitle>
              <CardDescription>
                Configure AI-powered features and matching algorithms.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="openAIEnabled" className="font-medium">OpenAI Integration</Label>
                  </div>
                  <Switch
                    id="openAIEnabled"
                    checked={aiSettings.openAIEnabled}
                    onCheckedChange={(checked) => setAISettings({...aiSettings, openAIEnabled: checked})}
                  />
                </div>
                
                {aiSettings.openAIEnabled && (
                  <div className="pl-6 border-l-2 border-muted ml-2 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="openAIModel">AI Model</Label>
                      <Select 
                        value={aiSettings.openAIModel} 
                        onValueChange={(value) => setAISettings({...aiSettings, openAIModel: value})}
                      >
                        <SelectTrigger id="openAIModel">
                          <SelectValue placeholder="Select AI model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gpt-4">GPT-4 (Most capable)</SelectItem>
                          <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Balanced)</SelectItem>
                          <SelectItem value="text-embedding-ada-002">Embeddings (For matching)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="maxTokensPerRequest">Max Tokens Per Request</Label>
                      <Input
                        id="maxTokensPerRequest"
                        type="number"
                        min="1000"
                        max="8000"
                        value={aiSettings.maxTokensPerRequest}
                        onChange={(e) => setAISettings({...aiSettings, maxTokensPerRequest: e.target.value})}
                      />
                    </div>
                    
                    <Button variant="outline" size="sm" className="mt-2">
                      Configure API Keys
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="space-y-4 pt-4">
                <h3 className="text-lg font-medium">Matching Algorithm Settings</h3>
                <div className="space-y-2">
                  <Label htmlFor="matchingThreshold">Matching Threshold (%)</Label>
                  <Input
                    id="matchingThreshold"
                    type="number"
                    min="50"
                    max="100"
                    value={aiSettings.matchingThreshold}
                    onChange={(e) => setAISettings({...aiSettings, matchingThreshold: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground">Minimum percentage match required for recommendations</p>
                </div>
              </div>
              
              <div className="space-y-4 pt-4">
                <h3 className="text-lg font-medium">AI Features</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableAutomaticSuggestions"
                      checked={aiSettings.enableAutomaticSuggestions}
                      onCheckedChange={(checked) => setAISettings({...aiSettings, enableAutomaticSuggestions: checked})}
                      disabled={!aiSettings.openAIEnabled}
                    />
                    <Label htmlFor="enableAutomaticSuggestions" className={!aiSettings.openAIEnabled ? "text-muted-foreground" : ""}>
                      Enable Automatic Job/Professional Suggestions
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableAIResourceTagging"
                      checked={aiSettings.enableAIResourceTagging}
                      onCheckedChange={(checked) => setAISettings({...aiSettings, enableAIResourceTagging: checked})}
                      disabled={!aiSettings.openAIEnabled}
                    />
                    <Label htmlFor="enableAIResourceTagging" className={!aiSettings.openAIEnabled ? "text-muted-foreground" : ""}>
                      Enable AI-Powered Resource Tagging
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableChatAssistant"
                      checked={aiSettings.enableChatAssistant}
                      onCheckedChange={(checked) => setAISettings({...aiSettings, enableChatAssistant: checked})}
                      disabled={!aiSettings.openAIEnabled}
                    />
                    <Label htmlFor="enableChatAssistant" className={!aiSettings.openAIEnabled ? "text-muted-foreground" : ""}>
                      Enable AI Chat Assistant
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableSkillRecommendations"
                      checked={aiSettings.enableSkillRecommendations}
                      onCheckedChange={(checked) => setAISettings({...aiSettings, enableSkillRecommendations: checked})}
                      disabled={!aiSettings.openAIEnabled}
                    />
                    <Label htmlFor="enableSkillRecommendations" className={!aiSettings.openAIEnabled ? "text-muted-foreground" : ""}>
                      Enable Skill Recommendations
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableCareerPathSuggestions"
                      checked={aiSettings.enableCareerPathSuggestions}
                      onCheckedChange={(checked) => setAISettings({...aiSettings, enableCareerPathSuggestions: checked})}
                      disabled={!aiSettings.openAIEnabled}
                    />
                    <Label htmlFor="enableCareerPathSuggestions" className={!aiSettings.openAIEnabled ? "text-muted-foreground" : ""}>
                      Enable Career Path Suggestions
                    </Label>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 flex gap-2 justify-end">
                <Button variant="outline" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Test AI Integration
                </Button>
                <Button onClick={handleSaveSettings} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}