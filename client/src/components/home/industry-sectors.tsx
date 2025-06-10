import { Building2, Zap, Shield, Stethoscope, Landmark, Globe, Cpu, Factory } from "lucide-react";

export default function IndustrySectors() {
  const industries = [
    {
      icon: Zap,
      name: "Oil & Gas",
      description: "Specialized training for energy sector professionals across UAE, Saudi Arabia, and Kuwait",
      expertise: ["Safety Training", "Technical Skills", "Leadership Development", "Regulatory Compliance"],
      companies: 45,
      color: "from-orange-500 to-red-500"
    },
    {
      icon: Landmark,
      name: "Banking & Finance",
      description: "Islamic banking expertise and international finance training across MENA region",
      expertise: ["Digital Banking", "Risk Management", "Compliance", "Customer Service"],
      companies: 60,
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Stethoscope,
      name: "Healthcare",
      description: "Medical training and healthcare management solutions for regional healthcare systems",
      expertise: ["Patient Care", "Medical Technology", "Healthcare Management", "Quality Assurance"],
      companies: 35,
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Cpu,
      name: "Technology",
      description: "Digital transformation and tech skills development for MENA's growing tech sector",
      expertise: ["Digital Skills", "AI & Data", "Cybersecurity", "Software Development"],
      companies: 55,
      color: "from-purple-500 to-indigo-500"
    },
    {
      icon: Building2,
      name: "Government",
      description: "Public sector training and leadership development for government entities",
      expertise: ["Public Administration", "Leadership", "Digital Government", "Policy Development"],
      companies: 25,
      color: "from-gray-600 to-slate-600"
    },
    {
      icon: Factory,
      name: "Manufacturing",
      description: "Industrial training and operational excellence for manufacturing companies",
      expertise: ["Lean Manufacturing", "Quality Control", "Safety", "Supply Chain"],
      companies: 40,
      color: "from-amber-500 to-orange-500"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 rounded-full bg-purple-100 text-purple-800 text-sm font-semibold mb-4">
            Industry-Specific Expertise
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            AI-Powered Learning Solutions for Every MENA Industry
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Our intelligent matching system connects you with L&D experts who understand your industry's 
            unique challenges, regulatory requirements, and cultural nuances across the MENA region.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {industries.map((industry, index) => {
            const Icon = industry.icon;
            return (
              <div key={index} className="group bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div className="mb-4">
                  <div className={`w-14 h-14 bg-gradient-to-r ${industry.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{industry.name}</h3>
                    <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                      {industry.companies} Companies
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4 leading-relaxed">{industry.description}</p>
                </div>
                
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Key Training Areas</h4>
                  <div className="flex flex-wrap gap-2">
                    {industry.expertise.map((skill, skillIndex) => (
                      <span 
                        key={skillIndex} 
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <button className="w-full text-blue-600 hover:text-blue-700 font-semibold text-sm group-hover:underline transition-colors">
                    Find {industry.name} Experts →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-16 bg-gradient-to-r from-slate-900 to-blue-900 rounded-2xl p-8 text-white">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Don't See Your Industry?</h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Our AI-powered platform serves dozens of industries across the MENA region. 
              Connect with us to find specialized experts for your specific sector.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-blue-900 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                Explore All Industries
              </button>
              <button className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors">
                Request Custom Matching
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}