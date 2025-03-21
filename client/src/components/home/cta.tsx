import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function CTA() {
  const { user } = useAuth();

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="bg-gradient-to-r from-primary to-blue-500 rounded-xl shadow-lg overflow-hidden">
          <div className="md:flex">
            <div className="md:w-2/3 p-10 text-white">
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
                Ready to Transform Your L&D Career or Find the Perfect Specialist?
              </h2>
              <p className="text-white text-opacity-90 mb-8 text-lg">
                Join L&D Nexus today to connect with opportunities that match your expertise or find qualified professionals for your learning initiatives.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                {user ? (
                  <Link href={user.userType === "professional" ? "/professional-dashboard" : "/company-dashboard"}>
                    <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-gray-100 font-bold">
                      Go to Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/register">
                      <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-gray-100 font-bold">
                        Create Account
                      </Button>
                    </Link>
                    <Link href="/professionals">
                      <Button size="lg" variant="outline" className="border border-white text-white hover:bg-white hover:bg-opacity-10 font-bold">
                        Learn More
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="md:w-1/3 hidden md:block">
              <img 
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                alt="L&D professionals collaborating" 
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
