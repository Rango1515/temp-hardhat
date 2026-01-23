import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

// Import demo images
import concreteImg from '@/assets/demo-concrete.jpg';
import electricalImg from '@/assets/demo-electrical.jpg';
import landscapingImg from '@/assets/demo-landscaping.jpg';
import generalImg from '@/assets/demo-general.jpg';
import plumbingImg from '@/assets/demo-plumbing.jpg';
import roofingImg from '@/assets/demo-roofing.jpg';

const portfolioItems = [
  {
    title: "Solid Foundation Concrete",
    category: "Concrete",
    slug: "concrete",
    description: "Professional concrete contractor website with project gallery and quote request forms.",
    image: concreteImg,
    features: ["Online Quotes", "Project Gallery", "Service Areas"],
  },
  {
    title: "Volt Electric Pro",
    category: "Electrical",
    slug: "electrical",
    description: "Modern electrical services website with emergency contact and service scheduling.",
    image: electricalImg,
    features: ["24/7 Emergency", "Online Booking", "Certifications"],
  },
  {
    title: "Green Valley Landscaping",
    category: "Landscaping",
    slug: "landscaping",
    description: "Beautiful landscaping company site showcasing outdoor transformations.",
    image: landscapingImg,
    features: ["Before/After", "Design Ideas", "Seasonal Specials"],
  },
  {
    title: "Hammer & Nail Construction",
    category: "General Contractor",
    slug: "general",
    description: "Full-service construction company with portfolio and testimonials.",
    image: generalImg,
    features: ["Video Tours", "Testimonials", "Financing"],
  },
  {
    title: "Crystal Clear Plumbing",
    category: "Plumbing",
    slug: "plumbing",
    description: "Plumbing services website with emergency booking and maintenance plans.",
    image: plumbingImg,
    features: ["Live Chat", "Maintenance Plans", "Coupons"],
  },
  {
    title: "Apex Roofing Solutions",
    category: "Roofing",
    slug: "roofing",
    description: "Roofing contractor site with storm damage assessment and financing options.",
    image: roofingImg,
    features: ["Free Inspections", "Insurance Help", "Warranties"],
  },
];

const Portfolio = () => {
  return (
    <section id="portfolio" className="py-20 md:py-32 bg-secondary/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="inline-block text-primary font-semibold tracking-wide uppercase mb-4">
            Example Websites
          </span>
          <h2 className="font-display text-4xl md:text-6xl text-foreground mb-4">
            PREVIEW OUR
            <span className="text-gradient"> DEMO SITES</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            See what your business could look like online. These example sites showcase 
            what we can build for your construction company.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {portfolioItems.map((item, index) => (
            <div
              key={item.title}
              className="group glass rounded-2xl overflow-hidden card-hover animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Preview Image */}
              <div className="h-48 relative overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                {/* Browser dots */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-white/30" />
                  <div className="w-3 h-3 rounded-full bg-white/30" />
                  <div className="w-3 h-3 rounded-full bg-white/30" />
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-primary bg-primary/20 px-3 py-1 rounded-full">
                    {item.category}
                  </span>
                </div>
                <h3 className="font-display text-xl text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {item.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {item.features.map((feature) => (
                    <span
                      key={feature}
                      className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
                <Link to={`/demo/${item.slug}`}>
                  <Button variant="outline" className="w-full group-hover:border-primary group-hover:text-primary transition-colors">
                    Preview Site
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Don't see your trade? We create custom websites for all construction industries.
          </p>
          <a href="#contact">
            <Button variant="default" size="lg" className="glow">
              Request Custom Demo
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Portfolio;
