import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Menu, User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout } = useAuth();

  // Close mobile menu when changing routes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link href="/" className="text-primary font-heading font-bold text-2xl">
              L&D Nexus
            </Link>
            <nav className="hidden md:block ml-10">
              <ul className="flex space-x-8">
                <li>
                  <Link href="/" className={`text-neutral-dark hover:text-primary font-medium ${location === "/" ? "text-primary" : ""}`}>
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/professionals" className={`text-neutral-dark hover:text-primary font-medium ${location === "/professionals" ? "text-primary" : ""}`}>
                    Find Professionals
                  </Link>
                </li>
                <li>
                  <Link href="/jobs" className={`text-neutral-dark hover:text-primary font-medium ${location === "/jobs" ? "text-primary" : ""}`}>
                    Job Board
                  </Link>
                </li>
                <li>
                  <Link href="/resources" className={`text-neutral-dark hover:text-primary font-medium ${location === "/resources" ? "text-primary" : ""}`}>
                    Resources
                  </Link>
                </li>
                <li>
                  <Link href="/forum" className={`text-neutral-dark hover:text-primary font-medium ${location === "/forum" ? "text-primary" : ""}`}>
                    Community
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="hidden md:flex items-center space-x-4">
                {user.isAdmin ? (
                  <Link href="/admin-dashboard" className="text-neutral-dark hover:text-primary">
                    Admin Dashboard
                  </Link>
                ) : user.userType === "professional" ? (
                  <Link href="/professional-dashboard" className="text-neutral-dark hover:text-primary">
                    Dashboard
                  </Link>
                ) : (
                  <Link href="/company-dashboard" className="text-neutral-dark hover:text-primary">
                    Dashboard
                  </Link>
                )}
                <Link href="/messages" className="text-neutral-dark hover:text-primary">
                  Messages
                </Link>
                <Link href="/subscribe" className="text-neutral-dark hover:text-primary">
                  Subscribe
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="font-normal p-2">
                      <div className="text-sm font-medium leading-none">{user.username}</div>
                      <div className="text-xs text-muted-foreground leading-none mt-1">
                        {user.userType === "professional" ? "L&D Professional" : "Company"}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Link href="/edit-profile">
                        Profile Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href="/manage-resources">
                        Manage Resources
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-500 cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-4">
                <Link href="/login" className="text-neutral-dark hover:text-primary">
                  Sign In
                </Link>
                <Link href="/register" className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark">
                  Register
                </Link>
              </div>
            )}
            <button 
              className="md:hidden text-neutral-dark" 
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4">
            <ul className="space-y-2">
              <li>
                <Link href="/" className={`block px-2 py-1 text-neutral-dark hover:text-primary ${location === "/" ? "text-primary" : ""}`}>
                  Home
                </Link>
              </li>
              <li>
                <Link href="/professionals" className={`block px-2 py-1 text-neutral-dark hover:text-primary ${location === "/professionals" ? "text-primary" : ""}`}>
                  Find Professionals
                </Link>
              </li>
              <li>
                <Link href="/jobs" className={`block px-2 py-1 text-neutral-dark hover:text-primary ${location === "/jobs" ? "text-primary" : ""}`}>
                  Job Board
                </Link>
              </li>
              <li>
                <Link href="/resources" className={`block px-2 py-1 text-neutral-dark hover:text-primary ${location === "/resources" ? "text-primary" : ""}`}>
                  Resources
                </Link>
              </li>
              <li>
                <Link href="/forum" className={`block px-2 py-1 text-neutral-dark hover:text-primary ${location === "/forum" ? "text-primary" : ""}`}>
                  Community
                </Link>
              </li>
              
              {user ? (
                <>
                  <li>
                    {user.isAdmin ? (
                      <Link href="/admin-dashboard" className="block px-2 py-1 text-neutral-dark hover:text-primary">
                        Admin Dashboard
                      </Link>
                    ) : user.userType === "professional" ? (
                      <Link href="/professional-dashboard" className="block px-2 py-1 text-neutral-dark hover:text-primary">
                        Dashboard
                      </Link>
                    ) : (
                      <Link href="/company-dashboard" className="block px-2 py-1 text-neutral-dark hover:text-primary">
                        Dashboard
                      </Link>
                    )}
                  </li>
                  <li>
                    <Link href="/messages" className="block px-2 py-1 text-neutral-dark hover:text-primary">
                      Messages
                    </Link>
                  </li>
                  <li>
                    <Link href="/subscribe" className="block px-2 py-1 text-neutral-dark hover:text-primary">
                      Subscribe
                    </Link>
                  </li>
                  <li>
                    <Link href="/edit-profile" className="block px-2 py-1 text-neutral-dark hover:text-primary">
                      Profile Settings
                    </Link>
                  </li>
                  <li>
                    <Link href="/manage-resources" className="block px-2 py-1 text-neutral-dark hover:text-primary">
                      Manage Resources
                    </Link>
                  </li>
                  <li>
                    <button 
                      onClick={handleLogout}
                      className="block w-full text-left px-2 py-1 text-red-500 hover:text-red-700"
                    >
                      Log Out
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link href="/login" className="block px-2 py-1 text-neutral-dark hover:text-primary">
                      Sign In
                    </Link>
                  </li>
                  <li>
                    <Link href="/register" className="block bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark text-center mt-2">
                      Register
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}
