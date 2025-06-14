import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, Award, Users, Briefcase, Sparkles } from "lucide-react";

export default function Hero() {
  const { user } = useAuth();

  return (
    <section className="relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-blue-900"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-700/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-slate-800/40 via-transparent to-transparent"></div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iLjUiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCIgb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNNjAgMEgwdjYwaDYweiIvPjwvZz48L3N2Zz4=')] opacity-30"></div>

      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-12 sm:py-16 lg:py-24 xl:py-32 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          <div className="lg:w-1/2 text-center lg:text-left">
            <div className="inline-block px-3 py-1.5 rounded-full bg-blue-900/60 backdrop-blur-sm text-blue-200 text-xs sm:text-sm font-medium mb-4 sm:mb-6 border border-blue-700/50">
              The AI-Powered Marketplace
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 text-white leading-tight">
              Connect with Top <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-white">Learning & Development Experts</span> - Instantly, Intelligently, with AI-Powered Matching
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-blue-100 mb-6 sm:mb-8 max-w-2xl mx-auto lg:mx-0">
              Empowering companies and L&D professionals across the UAE and beyond with AI-powered matching. Join us for corporate learning in the MENA region.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              {user ? (
                user.userType === "professional" ? (
                  <Button size="lg" className="font-medium bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 border-none shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 w-full sm:w-auto" asChild>
                    <Link href="/professional-dashboard">
                      My Dashboard
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                ) : (
                  <Button size="lg" className="font-medium bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 border-none shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 w-full sm:w-auto" asChild>
                    <Link href="/company-dashboard">
                      My Dashboard
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                )
              ) : (
                <>
                  <Button size="lg" className="font-medium bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 border-none shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 w-full sm:w-auto" asChild>
                    <Link href="/register?type=company">
                      I'm an Employer
                      <Briefcase className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="font-medium border-2 border-blue-400 text-blue-100 bg-blue-900/20 backdrop-blur-sm hover:bg-blue-800/40 hover:border-blue-300 hover:text-white transition-all duration-300 w-full sm:w-auto" asChild>
                    <Link href="/register?type=professional">
                      I'm an L&D Professional
                      <Award className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <div className="mt-4 w-full text-center sm:text-left">

                  </div>
                </>
              )}
            </div>
          </div>
          <div className="lg:w-1/2 w-full relative mt-8 lg:mt-0">
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-400 opacity-50 blur-sm"></div>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-blue-500/20">
              <img 
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                alt="L&D professionals collaborating" 
                className="w-full h-auto rounded-2xl aspect-[4/3] object-cover"
                width="600"
                height="450"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>

              {/* Feature badges - Responsive layout */}
              <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 justify-center">
                  <div className="bg-blue-900/80 backdrop-blur-sm rounded-full px-3 sm:px-4 py-1.5 sm:py-2 flex items-center text-xs sm:text-sm text-blue-100 border border-blue-700/50 justify-center">
                    <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-blue-400" />
                    AI-Powered Matching
                  </div>
                  <div className="bg-blue-900/80 backdrop-blur-sm rounded-full px-3 sm:px-4 py-1.5 sm:py-2 flex items-center text-xs sm:text-sm text-blue-100 border border-blue-700/50 justify-center">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-blue-400" />
                    Verified Experts
                  </div>
                  <div className="bg-blue-900/80 backdrop-blur-sm rounded-full px-3 sm:px-4 py-1.5 sm:py-2 flex items-center text-xs sm:text-sm text-blue-100 border border-blue-700/50 justify-center">
                    <Award className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-blue-400" />
                    Enterprise Ready
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}