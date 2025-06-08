import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Menu,
  Home,
  Users,
  Briefcase,
  BookOpen,
  MessageSquare,
  Settings,
  User,
  Building,
  LogOut,
  Shield,
  TrendingUp,
  X
} from "lucide-react";

interface NavigationItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresAuth?: boolean;
  userType?: 'professional' | 'company' | 'admin';
  badge?: string;
}

const navigationItems: NavigationItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/professionals", label: "Professionals", icon: Users },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/resources", label: "Resources", icon: BookOpen },
  { href: "/forum", label: "Forum", icon: MessageSquare },
  { href: "/messages", label: "Messages", icon: MessageSquare, requiresAuth: true },
  { href: "/professional-dashboard", label: "My Dashboard", icon: User, requiresAuth: true, userType: 'professional' },
  { href: "/company-dashboard", label: "Company Dashboard", icon: Building, requiresAuth: true, userType: 'company' },
  { href: "/career-recommendations", label: "Career Growth", icon: TrendingUp, requiresAuth: true },
  { href: "/admin", label: "Admin Panel", icon: Shield, requiresAuth: true, userType: 'admin' },
];

interface MobileNavigationProps {
  user?: any;
  onLogout?: () => void;
}

export function MobileNavigation({ user, onLogout }: MobileNavigationProps) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();

  // Close mobile menu when route changes
  useEffect(() => {
    setOpen(false);
  }, [location]);

  // Close menu on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open]);

  const filteredItems = navigationItems.filter(item => {
    if (item.requiresAuth && !user) return false;
    
    if (item.userType === 'admin') {
      return user?.username === 'admin' || user?.firstName === 'Admin';
    }
    
    if (item.userType === 'professional') {
      // Show if user has professional profile or is in professional context
      return true; // Simplified for now
    }
    
    if (item.userType === 'company') {
      // Show if user has company profile or is in company context
      return true; // Simplified for now
    }
    
    return true;
  });

  const isActive = (href: string) => {
    if (href === "/") {
      return location === "/";
    }
    return location.startsWith(href);
  };

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Open navigation menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">L&D</span>
                </div>
                <span className="font-semibold text-lg">L&D Nexus</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* User Info */}
            {user && (
              <div className="p-6 border-b">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {user.firstName || user.username}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {user.email || 'Member'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Items */}
            <ScrollArea className="flex-1">
              <div className="px-3 py-2">
                <nav className="space-y-1">
                  {filteredItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    
                    return (
                      <Link key={item.href} href={item.href}>
                        <Button
                          variant={active ? "secondary" : "ghost"}
                          className={`w-full justify-start h-12 px-3 ${
                            active ? "bg-secondary text-secondary-foreground" : ""
                          }`}
                        >
                          <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                          <span className="flex-1 text-left">{item.label}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="ml-2">
                              {item.badge}
                            </Badge>
                          )}
                        </Button>
                      </Link>
                    );
                  })}
                </nav>

                {user && (
                  <>
                    <Separator className="my-4" />
                    <div className="space-y-1">
                      <Link href="/edit-profile">
                        <Button variant="ghost" className="w-full justify-start h-12 px-3">
                          <Settings className="h-5 w-5 mr-3" />
                          Settings
                        </Button>
                      </Link>
                      {onLogout && (
                        <Button
                          variant="ghost"
                          className="w-full justify-start h-12 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={onLogout}
                        >
                          <LogOut className="h-5 w-5 mr-3" />
                          Sign Out
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-6 border-t">
              <div className="text-xs text-muted-foreground text-center">
                L&D Nexus v1.0.0
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}