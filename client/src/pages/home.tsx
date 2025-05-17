import Hero from "@/components/home/hero";
import FeaturedProfessionals from "@/components/home/featured-professionals";
import ResourceHub from "@/components/home/resource-hub";
import Testimonials from "@/components/home/testimonials";
import LatestJobs from "@/components/home/latest-jobs";
import CTASection from "@/components/home/cta-section";

export default function Home() {
  return (
    <div>
      <Hero />
      <FeaturedProfessionals />
      <ResourceHub />
      <Testimonials />
      <LatestJobs />
      <CTASection />
    </div>
  );
}
