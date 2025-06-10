import { Globe, Zap, Users, Award, Target, Building2 } from "lucide-react";

export default function MENAFeatures() {
  const features = [
    {
      icon: Globe,
      title: "MENA Region Coverage",
      description: "Serving UAE, Saudi Arabia, Qatar, Kuwait, Oman, Bahrain, and beyond with localized expertise",
      stats: "15+ Countries"
    },
    {
      icon: Zap,
      title: "AI-Powered Instant Matching",
      description: "Advanced algorithms connect you with the perfect L&D expert in under 24 hours",
      stats: "< 24 Hours"
    },
    {
      icon: Users,
      title: "Verified Regional Experts",
      description: "Pre-screened L&D professionals with proven track records in MENA corporate environments",
      stats: "500+ Experts"
    },
    {
      icon: Award,
      title: "Cultural Intelligence",
      description: "Experts understand regional business culture, languages, and corporate learning preferences",
      stats: "Arabic & English"
    },
    {
      icon: Target,
      title: "Industry-Specific Solutions",
      description: "Specialized training for Oil & Gas, Banking, Healthcare, Technology, and Government sectors",
      stats: "10+ Industries"
    },
    {
      icon: Building2,
      title: "Enterprise-Ready Platform",
      description: "Scalable solutions for SMEs to Fortune 500 companies across the MENA region",
      stats: "All Company Sizes"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-semibold mb-4">
            Why Choose L&D Nexus for MENA
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            The Leading AI-Powered Learning Marketplace in the Middle East
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Designed specifically for the MENA region's unique corporate learning landscape, 
            combining cutting-edge AI technology with deep regional expertise.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="group bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                      <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        {feature.stats}
                      </span>
                    </div>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Corporate Learning?</h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Join leading MENA companies who trust L&D Nexus for their training and development needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-blue-900 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                Find L&D Experts
              </button>
              <button className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors">
                Join as Expert
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}