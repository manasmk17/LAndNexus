import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, Award, Users, Briefcase, Sparkles, CheckCircle } from "lucide-react";

export default function Hero() {
  const { user } = useAuth();

  return (
    <section className="ld-hero">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <div className="inline-block px-3 py-1 rounded-full bg-blue-100 text-primary text-sm font-medium mb-6">
              The Premier L&D Marketplace
            </div>
            <h1 className="ld-hero-heading">
              Connect With <span className="text-primary">Learning & Development</span> Professionals
            </h1>
            <p className="ld-hero-subheading">
              Find expert trainers, post your L&D projects, or showcase your professional expertise - all in one powerful platform built for enterprise.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              {user ? (
                user.isAdmin ? (
                  <Button className="ld-button-primary" asChild>
                    <Link href="/admin-dashboard">
                      Admin Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : user.userType === "professional" ? (
                  <Button className="ld-button-primary" asChild>
                    <Link href="/professional-dashboard">
                      My Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button className="ld-button-primary" asChild>
                    <Link href="/company-dashboard">
                      My Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )
              ) : (
                <>
                  <Button className="ld-button-primary" asChild>
                    <Link href="/register?type=company">
                      I'm an Employer
                      <Briefcase className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button className="ld-button-secondary" asChild>
                    <Link href="/register?type=professional">
                      I'm an L&D Professional
                      <Award className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </>
              )}
            </div>
            
            {/* Feature list */}
            <div className="mt-12">
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-800">AI-Powered Matching</h3>
                    <p className="text-gray-600">Find the perfect match with our intelligent recommendation system</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-800">Verified Experts</h3>
                    <p className="text-gray-600">All professionals are vetted and verified for quality assurance</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-800">Secure Payments</h3>
                    <p className="text-gray-600">Safe and transparent payment processing for all services</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="md:w-1/2 relative">
            <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-200">
              <img 
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                alt="L&D professionals collaborating" 
                className="w-full h-auto rounded-2xl"
                width="600"
                height="400"
              />
              
              {/* Stats overlay */}
              <div className="absolute bottom-8 left-8 right-8 flex justify-between">
                <div className="bg-white shadow-lg rounded-lg px-4 py-3 flex flex-col items-center">
                  <span className="text-primary font-bold text-2xl">500+</span>
                  <span className="text-gray-600 text-sm">L&D Experts</span>
                </div>
                <div className="bg-white shadow-lg rounded-lg px-4 py-3 flex flex-col items-center">
                  <span className="text-primary font-bold text-2xl">350+</span>
                  <span className="text-gray-600 text-sm">Companies</span>
                </div>
                <div className="bg-white shadow-lg rounded-lg px-4 py-3 flex flex-col items-center">
                  <span className="text-primary font-bold text-2xl">98%</span>
                  <span className="text-gray-600 text-sm">Satisfaction</span>
                </div>
              </div>
            </div>
            
            {/* Floating badge */}
            <div className="absolute -top-4 -right-4 bg-primary text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
              Enterprise Ready
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}