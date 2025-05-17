import { useRef } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";

const testimonials = [
  {
    id: 1,
    content: "L&D Nexus has transformed our training programs. The experts we connected with brought fresh perspectives and innovative approaches that our team immediately responded to.",
    author: "Sarah Johnson",
    title: "Head of People Development, TechCorp",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80"
  },
  {
    id: 2,
    content: "Finding the right learning expertise used to be challenging. With L&D Nexus, we've been able to quickly connect with professionals who truly understand our industry needs.",
    author: "Michael Chen",
    title: "Chief Learning Officer, Global Finance Inc.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80"
  },
  {
    id: 3,
    content: "The quality of talent on this platform is impressive. We've utilized several L&D consultants for different projects, and each one has exceeded our expectations.",
    author: "Emma Rodriguez",
    title: "Training Director, HealthPlus",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80"
  }
];

export default function Testimonials() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -320, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 320, behavior: "smooth" });
    }
  };

  return (
    <section className="ld-section bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="ld-section-heading">What Our Clients Say</h2>
          <p className="ld-section-subheading">
            Hear from organizations that have found the perfect L&D professionals through our platform
          </p>
        </div>
        
        <div className="relative">
          <div 
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto pb-8 snap-x scroll-px-4 scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {testimonials.map((testimonial) => (
              <div 
                key={testimonial.id}
                className="ld-card-featured min-w-[320px] md:min-w-[400px] p-8 flex flex-col snap-center"
              >
                <div className="mb-6 text-primary">
                  <Quote className="h-10 w-10 fill-blue-100 stroke-primary" />
                </div>
                
                <p className="text-gray-700 mb-6 flex-grow italic">
                  "{testimonial.content}"
                </p>
                
                <div className="flex items-center mt-auto">
                  <div className="h-12 w-12 rounded-full overflow-hidden mr-4">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.author}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">{testimonial.author}</h4>
                    <p className="text-sm text-gray-600">{testimonial.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Navigation buttons */}
          <div className="flex justify-center mt-4 gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={scrollLeft}
              className="rounded-full h-10 w-10"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Previous</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={scrollRight}
              className="rounded-full h-10 w-10"
            >
              <ChevronRight className="h-5 w-5" />
              <span className="sr-only">Next</span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}