import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function Hero() {
  const { user } = useAuth();

  return (
    <section className="bg-gradient-to-r from-primary to-blue-500 text-white py-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
              Connect With Learning & Development Professionals
            </h1>
            <p className="text-lg mb-6">
              Find expert trainers, post your L&D projects, or showcase your professional expertise - all in one platform.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              {user ? (
                user.isAdmin ? (
                  <Link href="/admin-dashboard">
                    <Button size="lg" className="font-bold bg-amber-500 hover:bg-amber-600">
                      Admin Dashboard
                    </Button>
                  </Link>
                ) : user.userType === "professional" ? (
                  <Link href="/professional-dashboard">
                    <Button size="lg" className="font-bold bg-amber-500 hover:bg-amber-600">
                      My Dashboard
                    </Button>
                  </Link>
                ) : (
                  <Link href="/company-dashboard">
                    <Button size="lg" className="font-bold bg-amber-500 hover:bg-amber-600">
                      My Dashboard
                    </Button>
                  </Link>
                )
              ) : (
                <>
                  <Link href="/register?type=company">
                    <Button size="lg" className="font-bold bg-amber-500 hover:bg-amber-600">
                      I'm an Employer
                    </Button>
                  </Link>
                  <Link href="/register?type=professional">
                    <Button size="lg" variant="outline" className="font-bold border-2">
                      I'm an L&D Professional
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="md:w-1/2">
            <img 
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
              alt="L&D professionals collaborating" 
              className="rounded-lg shadow-lg"
              width="600"
              height="400"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
