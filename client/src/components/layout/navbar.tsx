import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Bell, Menu, X, User, Settings, LogOut, Home } from "lucide-react";

export default function Navbar() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setLocation("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navItems = [
    { href: "/", label: "Home", icon: Home, show: true },
    { href: "/professionals", label: "Professionals", show: true },
    { href: "/jobs", label: "Jobs", show: true },
    { href: "/resources", label: "Resources", show: true },
    { href: "/forum", label: "Forum", show: true },
    { href: "/professional-dashboard", label: "Dashboard", show: user?.userType === "professional" },
    { href: "/company-dashboard", label: "Dashboard", show: user?.userType === "company" },
    { href: "/admin-dashboard", label: "Admin", show: user?.userType === "admin" },
  ];

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50 safe-top">
      <div className="container-responsive">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo - Responsive */}
          <Link href="/" className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs sm:text-sm">L&D</span>
            </div>
            <span className="text-lg sm:text-xl font-bold text-gray-900 hidden xs:block truncate">
              Learning & Development
            </span>
            <span className="text-lg sm:text-xl font-bold text-gray-900 block xs:hidden">
              L&D
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6 xl:space-x-8">
            {navItems
              .filter(item => item.show)
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-gray-700 hover:text-blue-600 px-2 xl:px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
                >
                  {item.label}
                </Link>
              ))}
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            {user ? (
              <>
                <Button variant="ghost" size="sm" className="relative touch-target">
                  <Bell className="h-4 w-4" />
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs">
                    3
                  </Badge>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-1 sm:space-x-2 touch-target">
                      <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                        <AvatarImage src={user.profilePicture || ""} />
                        <AvatarFallback className="text-xs">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium hidden sm:block truncate max-w-24">
                        {user.firstName}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 sm:w-56">
                    <DropdownMenuItem asChild>
                      <Link href="/edit-profile" className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-sm">
                    Sign in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="text-sm">
                    Get started
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="touch-target"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-100 max-h-[calc(100vh-3.5rem)] overflow-y-auto">
              {navItems
                .filter(item => item.show)
                .map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 block px-3 py-3 rounded-md text-base font-medium touch-target"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                ))}

              {user ? (
                <div className="border-t border-gray-100 pt-4 mt-4">
                  <div className="flex items-center px-3 py-3 mb-2">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={user.profilePicture || ""} />
                      <AvatarFallback>
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-3 min-w-0 flex-1">
                      <div className="text-base font-medium text-gray-800 truncate">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-gray-500 truncate">{user.email}</div>
                    </div>
                  </div>

                  <Link
                    href="/edit-profile"
                    className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 block px-3 py-3 rounded-md text-base font-medium touch-target"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <User className="h-5 w-5 mr-3 flex-shrink-0" />
                      <span>Profile</span>
                    </div>
                  </Link>

                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 block w-full text-left px-3 py-3 rounded-md text-base font-medium touch-target"
                  >
                    <div className="flex items-center">
                      <LogOut className="h-5 w-5 mr-3 flex-shrink-0" />
                      <span>Sign out</span>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="border-t border-gray-100 pt-4 mt-4 space-y-2">
                  <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start touch-target">
                      Sign in
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full touch-target">
                      Get started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}