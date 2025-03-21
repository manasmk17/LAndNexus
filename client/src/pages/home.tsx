
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import FeaturedJobs from "@/components/home/featured-jobs";
import { ArrowRight } from "lucide-react";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Find Your Next Learning & Development Opportunity
            </h1>
            <p className="text-xl mb-8">
              Connect with top companies and professionals in the L&D industry
            </p>
            <div className="space-x-4">
              {!user ? (
                <>
                  <Link href="/register">
                    <Button size="lg" variant="secondary">Get Started</Button>
                  </Link>
                  <Link href="/jobs">
                    <Button size="lg">Browse Jobs</Button>
                  </Link>
                </>
              ) : (
                <Link href="/jobs">
                  <Button size="lg">View All Jobs</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Jobs Section */}
      <FeaturedJobs />

      {/* Call to Action */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-gray-600 mb-8">
            {user?.userType === "company" 
              ? "Post your job openings and find the perfect L&D professional"
              : "Create your profile and start applying to L&D opportunities"}
          </p>
          {!user ? (
            <Link href="/register">
              <Button size="lg">
                Sign Up Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          ) : user.userType === "company" ? (
            <Link href="/post-job">
              <Button size="lg">
                Post a Job <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Link href="/edit-profile">
              <Button size="lg">
                Complete Your Profile <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
