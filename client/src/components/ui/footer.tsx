import { Link } from "wouter";
import { Facebook, Twitter, Linkedin, Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-neutral-dark text-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="text-2xl font-heading font-bold mb-4">L&D Nexus</div>
            <p className="text-white text-opacity-70 mb-4">
              Connecting learning professionals and organizations to create impactful training solutions.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-white text-opacity-70 hover:text-opacity-100">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-white text-opacity-70 hover:text-opacity-100">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-white text-opacity-70 hover:text-opacity-100">
                <Linkedin size={20} />
              </a>
              <a href="#" className="text-white text-opacity-70 hover:text-opacity-100">
                <Instagram size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-heading font-medium mb-4">Platform</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/professionals">
                  <a className="text-white text-opacity-70 hover:text-opacity-100">For Professionals</a>
                </Link>
              </li>
              <li>
                <Link href="/jobs">
                  <a className="text-white text-opacity-70 hover:text-opacity-100">For Companies</a>
                </Link>
              </li>
              <li>
                <Link href="/#pricing">
                  <a className="text-white text-opacity-70 hover:text-opacity-100">Pricing</a>
                </Link>
              </li>
              <li>
                <Link href="/#testimonials">
                  <a className="text-white text-opacity-70 hover:text-opacity-100">Success Stories</a>
                </Link>
              </li>
              <li>
                <Link href="/resources">
                  <a className="text-white text-opacity-70 hover:text-opacity-100">Resources</a>
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-heading font-medium mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-white text-opacity-70 hover:text-opacity-100">About Us</a>
              </li>
              <li>
                <a href="#" className="text-white text-opacity-70 hover:text-opacity-100">Careers</a>
              </li>
              <li>
                <a href="#" className="text-white text-opacity-70 hover:text-opacity-100">Blog</a>
              </li>
              <li>
                <a href="#" className="text-white text-opacity-70 hover:text-opacity-100">Press</a>
              </li>
              <li>
                <a href="#" className="text-white text-opacity-70 hover:text-opacity-100">Contact</a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-heading font-medium mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-white text-opacity-70 hover:text-opacity-100">Help Center</a>
              </li>
              <li>
                <a href="#" className="text-white text-opacity-70 hover:text-opacity-100">Privacy Policy</a>
              </li>
              <li>
                <a href="#" className="text-white text-opacity-70 hover:text-opacity-100">Terms of Service</a>
              </li>
              <li>
                <a href="#" className="text-white text-opacity-70 hover:text-opacity-100">Trust & Safety</a>
              </li>
              <li>
                <a href="#" className="text-white text-opacity-70 hover:text-opacity-100">Accessibility</a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white border-opacity-20 pt-6 mt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-white text-opacity-60 text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} L&D Nexus. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-white text-opacity-60 hover:text-opacity-100 text-sm">Privacy Policy</a>
              <a href="#" className="text-white text-opacity-60 hover:text-opacity-100 text-sm">Terms of Service</a>
              <a href="#" className="text-white text-opacity-60 hover:text-opacity-100 text-sm">Cookies</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
