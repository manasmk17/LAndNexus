import { useState, useEffect } from "react";
import { Route, Switch, useLocation, useRoute } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  Layout,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
} from "@/components/layout";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Menu } from "lucide-react";

// Admin components
import Dashboard from "@/components/admin/new/dashboard";
import UserManagement from "@/components/admin/new/user-management";
import FreelancerManagement from "@/components/admin/new/freelancer-management";
import CompanyManagement from "@/components/admin/new/company-management";
import JobManagement from "@/components/admin/new/job-management";
import ContentManagement from "@/components/admin/new/content-management";
import PaymentManagement from "@/components/admin/new/payment-management";
import SettingsManagement from "@/components/admin/new/settings-management";

export default function AdminIndex() {
  const { user } = useAuth();
  const [match, params] = useRoute("/admin/:section");
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Handle tab changes and URL sync
  useEffect(() => {
    if (match && params && params.section) {
      setActiveTab(params.section);
    } else {
      setLocation("/admin/dashboard");
    }
  }, [match, params, setLocation]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setLocation(`/admin/${value}`);
    setIsMobileMenuOpen(false);
  };

  if (!user || !user.isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to access this area.</p>
        <Button 
          className="mt-4" 
          onClick={() => setLocation("/")}
        >
          Return to Home
        </Button>
      </div>
    );
  }

  return (
    <Layout>
      <LayoutHeader>
        <div className="flex justify-between items-center">
          <LayoutTitle>Admin Dashboard</LayoutTitle>
          <div className="sm:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <div className="py-4">
                  <h2 className="text-lg font-semibold mb-2">Navigation</h2>
                  <Separator className="my-2" />
                  <div className="flex flex-col space-y-2">
                    <Button 
                      variant={activeTab === "dashboard" ? "default" : "ghost"} 
                      className="justify-start"
                      onClick={() => handleTabChange("dashboard")}
                    >
                      Dashboard
                    </Button>
                    <Button 
                      variant={activeTab === "users" ? "default" : "ghost"} 
                      className="justify-start"
                      onClick={() => handleTabChange("users")}
                    >
                      Users
                    </Button>
                    <Button 
                      variant={activeTab === "freelancers" ? "default" : "ghost"} 
                      className="justify-start"
                      onClick={() => handleTabChange("freelancers")}
                    >
                      Freelancers
                    </Button>
                    <Button 
                      variant={activeTab === "companies" ? "default" : "ghost"} 
                      className="justify-start"
                      onClick={() => handleTabChange("companies")}
                    >
                      Companies
                    </Button>
                    <Button 
                      variant={activeTab === "jobs" ? "default" : "ghost"} 
                      className="justify-start"
                      onClick={() => handleTabChange("jobs")}
                    >
                      Jobs
                    </Button>
                    <Button 
                      variant={activeTab === "content" ? "default" : "ghost"} 
                      className="justify-start"
                      onClick={() => handleTabChange("content")}
                    >
                      Content
                    </Button>
                    <Button 
                      variant={activeTab === "payments" ? "default" : "ghost"} 
                      className="justify-start"
                      onClick={() => handleTabChange("payments")}
                    >
                      Payments
                    </Button>
                    <Button 
                      variant={activeTab === "settings" ? "default" : "ghost"} 
                      className="justify-start"
                      onClick={() => handleTabChange("settings")}
                    >
                      Settings
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <div className="hidden sm:block">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    className={navigationMenuTriggerStyle({ className: activeTab === "dashboard" ? "bg-accent" : "" })}
                    onClick={() => handleTabChange("dashboard")}
                  >
                    Dashboard
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    className={navigationMenuTriggerStyle({ className: activeTab === "users" ? "bg-accent" : "" })}
                    onClick={() => handleTabChange("users")}
                  >
                    Users
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    className={navigationMenuTriggerStyle({ className: activeTab === "freelancers" ? "bg-accent" : "" })}
                    onClick={() => handleTabChange("freelancers")}
                  >
                    Freelancers
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    className={navigationMenuTriggerStyle({ className: activeTab === "companies" ? "bg-accent" : "" })}
                    onClick={() => handleTabChange("companies")}
                  >
                    Companies
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    className={navigationMenuTriggerStyle({ className: activeTab === "jobs" ? "bg-accent" : "" })}
                    onClick={() => handleTabChange("jobs")}
                  >
                    Jobs
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    className={navigationMenuTriggerStyle({ className: activeTab === "content" ? "bg-accent" : "" })}
                    onClick={() => handleTabChange("content")}
                  >
                    Content
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    className={navigationMenuTriggerStyle({ className: activeTab === "payments" ? "bg-accent" : "" })}
                    onClick={() => handleTabChange("payments")}
                  >
                    Payments
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    className={navigationMenuTriggerStyle({ className: activeTab === "settings" ? "bg-accent" : "" })}
                    onClick={() => handleTabChange("settings")}
                  >
                    Settings
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>
      </LayoutHeader>
      <LayoutContent>
        <Switch>
          <Route path="/admin/dashboard">
            <Dashboard />
          </Route>
          <Route path="/admin/users">
            <UserManagement />
          </Route>
          <Route path="/admin/freelancers">
            <FreelancerManagement />
          </Route>
          <Route path="/admin/companies">
            <CompanyManagement />
          </Route>
          <Route path="/admin/jobs">
            <JobManagement />
          </Route>
          <Route path="/admin/content">
            <ContentManagement />
          </Route>
          <Route path="/admin/payments">
            <PaymentManagement />
          </Route>
          <Route path="/admin/settings">
            <SettingsManagement />
          </Route>
          <Route>
            <Dashboard />
          </Route>
        </Switch>
      </LayoutContent>
    </Layout>
  );
}