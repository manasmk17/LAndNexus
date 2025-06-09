import { Mail, MapPin, ExternalLink, Linkedin, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-900 to-slate-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">About L&D Nexus</h1>
            <p className="text-xl text-blue-100 mb-8">
              The premier marketplace connecting Learning & Development professionals with organizations worldwide
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-slate-900">Our Mission</h2>
              <div className="h-1 w-20 bg-blue-600 mx-auto mb-6 rounded-full"></div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <p className="text-lg text-slate-600 mb-6">
                  L&D Nexus bridges the gap between talented Learning & Development professionals and organizations seeking expert training solutions. Our platform revolutionizes how companies find, engage, and collaborate with L&D experts.
                </p>
                <p className="text-lg text-slate-600">
                  Founded with a vision to transform professional development, we provide cutting-edge tools for AI-powered matching, secure payment processing, and seamless project management.
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-slate-50 p-8 rounded-xl">
                <h3 className="text-xl font-semibold mb-4 text-slate-800">What We Offer</h3>
                <ul className="space-y-3 text-slate-600">
                  <li className="flex items-start">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5">1</span>
                    AI-powered professional matching
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5">2</span>
                    Secure escrow payment system
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5">3</span>
                    Comprehensive resource library
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5">4</span>
                    Professional community platform
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Company Information */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center text-slate-900">Company Information</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="mr-2 h-5 w-5 text-blue-600" />
                    Registered Office
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">
                    71–75 Shelton Street<br />
                    Covent Garden<br />
                    London, United Kingdom<br />
                    WC2H 9JQ
                  </p>
                  <p className="mt-4 text-sm text-slate-500">
                    Company Registration Number: 16450617
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Mail className="mr-2 h-5 w-5 text-blue-600" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-slate-500">Primary Email</p>
                      <a href="mailto:official.ldnexus@gmail.com" className="text-blue-600 hover:text-blue-800">
                        official.ldnexus@gmail.com
                      </a>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Business Email</p>
                      <a href="mailto:official@ldnexus.com" className="text-blue-600 hover:text-blue-800">
                        official@ldnexus.com
                      </a>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Website</p>
                      <a href="https://www.ldnexus.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 flex items-center">
                        www.ldnexus.com
                        <ExternalLink className="ml-1 h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Social Media & Resources */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-12 text-slate-900">Connect With Us</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-center">
                    <Linkedin className="mr-2 h-6 w-6 text-blue-600" />
                    LinkedIn
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4">Follow our company updates and industry insights</p>
                  <Button asChild className="w-full">
                    <a href="https://www.linkedin.com/company/l-d-nexus/" target="_blank" rel="noopener noreferrer">
                      Follow Us
                    </a>
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-center">
                    <Youtube className="mr-2 h-6 w-6 text-red-600" />
                    YouTube
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4">Subscribe for L&D tutorials and expert interviews</p>
                  <Button asChild className="w-full bg-red-600 hover:bg-red-700">
                    <a href="https://youtube.com/@ldnexus?si=uZTNebnLMOL1Bf8e" target="_blank" rel="noopener noreferrer">
                      Subscribe
                    </a>
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-center">
                    <ExternalLink className="mr-2 h-6 w-6 text-green-600" />
                    Official Magazine
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4">Read our latest articles and industry reports</p>
                  <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                    <a href="https://ldnmag.com" target="_blank" rel="noopener noreferrer">
                      Visit ldnmag.com
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-blue-900 to-slate-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Transform Your L&D Journey?</h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of professionals and companies already using L&D Nexus to create exceptional learning experiences.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50">
                <a href="/register?type=professional">Join as Professional</a>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-900">
                <a href="/register?type=company">Post a Project</a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}