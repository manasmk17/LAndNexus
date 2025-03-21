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
            <Link href="/">
              <a className="text-primary font-heading font-bold text-2xl">
                L&D Nexus
              </a>
            </Link>
            <nav className="hidden md:block ml-10">
              <ul className="flex space-x-8">
                <li>
                  <Link href="/">
                    <a className={`text-neutral-dark hover:text-primary font-medium ${location === "/" ? "text-primary" : ""}`}>
                      Home
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/professionals">
                    <a className={`text-neutral-dark hover:text-primary font-medium ${location === "/professionals" ? "text-primary" : ""}`}>
                      Find Professionals
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/jobs">
                    <a className={`text-neutral-dark hover:text-primary font-medium ${location === "/jobs" ? "text-primary" : ""}`}>
                      Job Board
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/resources">
                    <a className={`text-neutral-dark hover:text-primary font-medium ${location === "/resources" ? "text-primary" : ""}`}>
                      Resources
                    </a>
                  </Link>
                </li>
                <li>
                  <Link href="/forum">
                    <a className={`text-neutral-dark hover:text-primary font-medium ${location === "/forum" ? "text-primary" : ""}`}>
                      Community
                    </a>
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="hidden md:flex items-center space-x-4">
                {user.userType === "professional" ? (
                  <Link href="/professional-dashboard">
                    <a className="text-neutral-dark hover:text-primary">Dashboard</a>
                  </Link>
                ) : (
                  <Link href="/company-dashboard">
                    <a className="text-neutral-dark hover:text-primary">Dashboard</a>
                  </Link>
                )}
                <Link href="/messages">
                  <a className="text-neutral-dark hover:text-primary">Messages</a>
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
                    <DropdownMenuItem asChild>
                      <Link href="/edit-profile">
                        <a className="cursor-pointer w-full">Profile Settings</a>
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
                <Link href="/login">
                  <a className="text-neutral-dark hover:text-primary">Sign In</a>
                </Link>
                <Link href="/register">
                  <a className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark">Register</a>
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
                <Link href="/">
                  <a className={`block px-2 py-1 text-neutral-dark hover:text-primary ${location === "/" ? "text-primary" : ""}`}>
                    Home
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/professionals">
                  <a className={`block px-2 py-1 text-neutral-dark hover:text-primary ${location === "/professionals" ? "text-primary" : ""}`}>
                    Find Professionals
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/jobs">
                  <a className={`block px-2 py-1 text-neutral-dark hover:text-primary ${location === "/jobs" ? "text-primary" : ""}`}>
                    Job Board
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/resources">
                  <a className={`block px-2 py-1 text-neutral-dark hover:text-primary ${location === "/resources" ? "text-primary" : ""}`}>
                    Resources
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/forum">
                  <a className={`block px-2 py-1 text-neutral-dark hover:text-primary ${location === "/forum" ? "text-primary" : ""}`}>
                    Community
                  </a>
                </Link>
              </li>
              
              {user ? (
                <>
                  <li>
                    {user.userType === "professional" ? (
                      <Link href="/professional-dashboard">
                        <a className="block px-2 py-1 text-neutral-dark hover:text-primary">Dashboard</a>
                      </Link>
                    ) : (
                      <Link href="/company-dashboard">
                        <a className="block px-2 py-1 text-neutral-dark hover:text-primary">Dashboard</a>
                      </Link>
                    )}
                  </li>
                  <li>
                    <Link href="/messages">
                      <a className="block px-2 py-1 text-neutral-dark hover:text-primary">Messages</a>
                    </Link>
                  </li>
                  <li>
                    <Link href="/edit-profile">
                      <a className="block px-2 py-1 text-neutral-dark hover:text-primary">Profile Settings</a>
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
                    <Link href="/login">
                      <a className="block px-2 py-1 text-neutral-dark hover:text-primary">Sign In</a>
                    </Link>
                  </li>
                  <li>
                    <Link href="/register">
                      <a className="block bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark text-center mt-2">Register</a>
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
