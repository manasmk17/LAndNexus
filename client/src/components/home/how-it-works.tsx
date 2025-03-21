import { CheckCircle, Building, User, Settings } from "lucide-react";

export default function HowItWorks() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-heading font-bold text-center mb-12">How L&D Nexus Works</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* For Companies */}
          <div className="bg-gray-50 rounded-lg p-6 shadow-md">
            <div className="bg-blue-400 text-white rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Building className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-heading font-medium mb-3">For Companies</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <CheckCircle className="text-primary mr-2 text-sm mt-1 h-5 w-5 flex-shrink-0" />
                <span>Post L&D job opportunities and projects</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="text-primary mr-2 text-sm mt-1 h-5 w-5 flex-shrink-0" />
                <span>Find specialized training professionals</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="text-primary mr-2 text-sm mt-1 h-5 w-5 flex-shrink-0" />
                <span>Book consultations and direct services</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="text-primary mr-2 text-sm mt-1 h-5 w-5 flex-shrink-0" />
                <span>Access training resources and materials</span>
              </li>
            </ul>
          </div>
          
          {/* For L&D Professionals */}
          <div className="bg-gray-50 rounded-lg p-6 shadow-md">
            <div className="bg-teal-400 text-white rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <User className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-heading font-medium mb-3">For L&D Professionals</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <CheckCircle className="text-teal-600 mr-2 text-sm mt-1 h-5 w-5 flex-shrink-0" />
                <span>Create professional showcase profiles</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="text-teal-600 mr-2 text-sm mt-1 h-5 w-5 flex-shrink-0" />
                <span>Display certifications and expertise</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="text-teal-600 mr-2 text-sm mt-1 h-5 w-5 flex-shrink-0" />
                <span>Offer consultation services</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="text-teal-600 mr-2 text-sm mt-1 h-5 w-5 flex-shrink-0" />
                <span>Apply to targeted job opportunities</span>
              </li>
            </ul>
          </div>
          
          {/* Platform Features */}
          <div className="bg-gray-50 rounded-lg p-6 shadow-md">
            <div className="bg-amber-400 text-white rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Settings className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-heading font-medium mb-3">Platform Features</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <CheckCircle className="text-amber-600 mr-2 text-sm mt-1 h-5 w-5 flex-shrink-0" />
                <span>AI-powered matching system</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="text-amber-600 mr-2 text-sm mt-1 h-5 w-5 flex-shrink-0" />
                <span>Secure payment processing</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="text-amber-600 mr-2 text-sm mt-1 h-5 w-5 flex-shrink-0" />
                <span>Community forums and networking</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="text-amber-600 mr-2 text-sm mt-1 h-5 w-5 flex-shrink-0" />
                <span>Resource hub and knowledge sharing</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
