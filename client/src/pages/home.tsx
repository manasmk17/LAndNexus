import Hero from "@/components/home/hero";
import HowItWorks from "@/components/home/how-it-works";
import { MENAMarketplace } from "@/components/home/mena-marketplace";
import MENAFeatures from "@/components/home/mena-features";
import MENARegions from "@/components/home/mena-regions";
import FeaturedProfessionals from "@/components/home/featured-professionals";
import FeaturedJobs from "@/components/home/featured-jobs";
import ResourceHub from "@/components/home/resource-hub";
import Testimonials from "@/components/home/testimonials";
import Pricing from "@/components/home/pricing";
import CTA from "@/components/home/cta";

export default function Home() {
  return (
    <div>
      <Hero />
      <HowItWorks />
      <MENAMarketplace />
      <FeaturedProfessionals />
      <FeaturedJobs />
      <ResourceHub />
      <Testimonials />
      <Pricing />
      <CTA />
    </div>
  );
}
