import { MapPin, Users, Building, TrendingUp } from "lucide-react";

export default function MENARegions() {
  const regions = [
    {
      country: "United Arab Emirates",
      flag: "🇦🇪",
      cities: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman"],
      experts: 150,
      companies: 80,
      growth: "+45%"
    },
    {
      country: "Saudi Arabia",
      flag: "🇸🇦",
      cities: ["Riyadh", "Jeddah", "Dammam", "Mecca"],
      experts: 120,
      companies: 65,
      growth: "+38%"
    },
    {
      country: "Qatar",
      flag: "🇶🇦",
      cities: ["Doha", "Al Rayyan", "Al Wakrah"],
      experts: 85,
      companies: 45,
      growth: "+52%"
    },
    {
      country: "Kuwait",
      flag: "🇰🇼",
      cities: ["Kuwait City", "Hawalli", "Farwaniya"],
      experts: 70,
      companies: 35,
      growth: "+41%"
    },
    {
      country: "Oman",
      flag: "🇴🇲",
      cities: ["Muscat", "Sohar", "Salalah"],
      experts: 55,
      companies: 30,
      growth: "+35%"
    },
    {
      country: "Bahrain",
      flag: "🇧🇭",
      cities: ["Manama", "Riffa", "Muharraq"],
      experts: 45,
      companies: 25,
      growth: "+48%"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Leading the MENA Corporate Learning Revolution
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Our AI-powered platform connects learning professionals and companies across the entire MENA region, 
            with deep expertise in local markets and business cultures.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {regions.map((region, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{region.flag}</span>
                  <h3 className="text-lg font-semibold text-gray-900">{region.country}</h3>
                </div>
                <div className="flex items-center space-x-1 text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <TrendingUp className="h-3 w-3" />
                  <span className="text-xs font-semibold">{region.growth}</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  <span>{region.cities.join(", ")}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-purple-500" />
                    <div>
                      <div className="text-lg font-bold text-gray-900">{region.experts}</div>
                      <div className="text-xs text-gray-500">L&D Experts</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-green-500" />
                    <div>
                      <div className="text-lg font-bold text-gray-900">{region.companies}</div>
                      <div className="text-xs text-gray-500">Companies</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">Expanding Across MENA</h3>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Join the fastest-growing AI-powered learning marketplace in the Middle East. 
            Connect with verified experts who understand your regional business needs.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold">525+</div>
              <div className="text-blue-200 text-sm">Total Experts</div>
            </div>
            <div>
              <div className="text-3xl font-bold">280+</div>
              <div className="text-blue-200 text-sm">Companies</div>
            </div>
            <div>
              <div className="text-3xl font-bold">15+</div>
              <div className="text-blue-200 text-sm">Countries</div>
            </div>
            <div>
              <div className="text-3xl font-bold">43%</div>
              <div className="text-blue-200 text-sm">Avg Growth</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}