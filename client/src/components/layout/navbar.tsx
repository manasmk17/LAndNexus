import { Link, useLocation } from "wouter";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  User, 
  LogOut, 
  Settings, 
  Briefcase, 
  MessageSquare,
  Home,
  Users,
  BookOpen,
  MessageCircle,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";

function Navbar() {
  // Simple text instead of translation for now
  const t = (key: string) => {
    const translations: { [key: string]: string } = {
      'nav.home': 'Home',
      'nav.professionals': 'Professionals', 
      'nav.jobs': 'Jobs',
      'nav.resources': 'Resources',
      'nav.forum': 'Forum',
      'nav.dashboard': 'Dashboard',
      'nav.login': 'Login',
      'nav.register': 'Register',
      'nav.profile': 'Profile',
      'nav.settings': 'Settings',
      'nav.logout': 'Logout'
    };
    return translations[key] || key;
  };
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navigationItems = [
    { href: "/", label: t("nav.home"), icon: Home },
    { href: "/professionals", label: t("nav.professionals"), icon: Users },
    { href: "/jobs", label: t("nav.jobs"), icon: Briefcase },
    { href: "/resources", label: t("nav.resources"), icon: BookOpen },
    { href: "/forum", label: t("nav.forum"), icon: MessageCircle },
  ];

  const isActive = (path: string) => location === path;

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo - Responsive sizing */}
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs sm:text-sm">L&D</span>
            </div>
            <span className="font-semibold text-lg sm:text-xl hidden xs:block">L&D Nexus</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6 nav-menu">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-1 px-2 lg:px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "text-primary bg-primary/10"
                    : "text-gray-700 hover:text-primary hover:bg-primary/5"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-primary hover:bg-gray-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>

          {/* Right side - User Menu */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>
                        {user?.firstName?.[0] || user?.username?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}`
                          : user.username
                        }
                      </p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem asChild>
                    <Link 
                      href={user.userType === "professional" 
                        ? "/professional-dashboard" 
                        : "/company-dashboard"
                      }
                      className="cursor-pointer"
                    >
                      <User className="me-2 h-4 w-4" />
                      <span>{t("nav.dashboard")}</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="me-2 h-4 w-4" />
                      <span>Account</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link href="/messages" className="cursor-pointer">
                      <MessageSquare className="me-2 h-4 w-4" />
                      <span>{t("nav.messages")}</span>
                    </Link>
                  </DropdownMenuItem>

                  {user.userType === "company" && (
                    <DropdownMenuItem asChild>
                      <Link href="/post-job" className="cursor-pointer">
                        <Briefcase className="me-2 h-4 w-4" />
                        <span>{t("nav.postJob")}</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem 
                    className="cursor-pointer text-red-600 focus:text-red-600"
                    onClick={handleLogout}
                  >
                    <LogOut className="me-2 h-4 w-4" />
                    <span>{t("nav.logout")}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/login">{t("nav.login")}</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">{t("nav.register")}</Link>
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation - Slide-out Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 top-14 sm:top-16 z-40 bg-white shadow-lg transform transition-transform duration-300 ease-in-out mobile-nav">
            <div className="flex flex-col h-full overflow-y-auto">
              {/* Navigation Items */}
              <div className="flex flex-col space-y-1 p-4">
                {navigationItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-colors min-h-[44px] ${
                      isActive(item.href)
                        ? "text-primary bg-primary/10"
                        : "text-gray-700 hover:text-primary hover:bg-primary/5 active:bg-primary/10"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>

              {/* Mobile User Menu */}
              <div className="border-t p-4 mt-auto">
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 px-4 py-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-white text-sm">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-sm">
                        <div className="font-medium">{user.firstName} {user.lastName}</div>
                        <div className="text-gray-500">{user.email}</div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Link
                        href="/profile"
                        className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-primary hover:bg-primary/5 rounded-lg min-h-[44px]"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <User className="h-5 w-5" />
                        <span>Profile</span>
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-primary hover:bg-primary/5 rounded-lg min-h-[44px]"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Settings className="h-5 w-5" />
                        <span>Account</span>
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center space-x-3 px-4 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg w-full text-left min-h-[44px]"
                      >
                        <LogOut className="h-5 w-5" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      href="/login"
                      className="block w-full px-4 py-3 text-center text-primary border border-primary rounded-lg hover:bg-primary/5 min-h-[44px] flex items-center justify-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="block w-full px-4 py-3 text-center text-white bg-primary rounded-lg hover:bg-primary/90 min-h-[44px] flex items-center justify-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black bg-opacity-20 z-30"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </div>
    </nav>
  );
}

export default Navbar;