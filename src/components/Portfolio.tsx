import { Button } from "@/components/ui/button";
import { ExternalLink, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import AnimatedSection from "@/components/ui/AnimatedSection";

// Import demo images
import concreteImg from '@/assets/demo-concrete.jpg';
import electricalImg from '@/assets/demo-electrical.jpg';
import landscapingImg from '@/assets/demo-landscaping.jpg';
import generalImg from '@/assets/demo-general.jpg';
import plumbingImg from '@/assets/demo-plumbing.jpg';
import roofingImg from '@/assets/demo-roofing.jpg';
import architectureImg from '@/assets/demo-architecture.jpg';
import engineeringImg from '@/assets/demo-engineering.jpg';
import interiorImg from '@/assets/demo-interior.jpg';
import hvacImg from '@/assets/demo-hvac.jpg';
import solarImg from '@/assets/demo-solar.jpg';
import poolImg from '@/assets/demo-pool.jpg';

const portfolioItems = [
  {
    title: "Solid Foundation Concrete",
    category: "Concrete",
    slug: "concrete",
    description: "Professional concrete contractor website with project gallery and quote request forms.",
    image: concreteImg,
    features: ["Online Quotes", "Project Gallery", "Service Areas"],
    layoutStyle: "standard",
  },
  {
    title: "Volt Electric Pro",
    category: "Electrical",
    slug: "electrical",
    description: "Modern electrical services website with emergency contact and service scheduling.",
    image: electricalImg,
    features: ["24/7 Emergency", "Online Booking", "Certifications"],
    layoutStyle: "standard",
  },
  {
    title: "Blueprint Architecture",
    category: "Architecture",
    slug: "architecture",
    description: "Stunning architecture firm portfolio showcasing modern building designs and award-winning projects.",
    image: architectureImg,
    features: ["3D Viewer", "Awards", "Project Timeline"],
    layoutStyle: "creative",
  },
  {
    title: "Precision Engineering",
    category: "Engineering",
    slug: "engineering",
    description: "Engineering consulting website with technical specifications and certification showcase.",
    image: engineeringImg,
    features: ["Tech Specs", "Certifications", "Case Studies"],
    layoutStyle: "technical",
  },
  {
    title: "Studio Luxe Interiors",
    category: "Interior Design",
    slug: "interior",
    description: "Elegant interior design studio website with before/after galleries and mood boards.",
    image: interiorImg,
    features: ["Before/After", "Mood Boards", "Virtual Tours"],
    layoutStyle: "creative",
  },
  {
    title: "Green Valley Landscaping",
    category: "Landscaping",
    slug: "landscaping",
    description: "Beautiful landscaping company site showcasing outdoor transformations.",
    image: landscapingImg,
    features: ["Before/After", "Design Ideas", "Seasonal Specials"],
    layoutStyle: "standard",
  },
  {
    title: "Climate Control HVAC",
    category: "HVAC",
    slug: "hvac",
    description: "HVAC services website with energy calculator and maintenance plan options.",
    image: hvacImg,
    features: ["Energy Calc", "Maintenance", "24/7 Service"],
    layoutStyle: "technical",
  },
  {
    title: "SunPower Solar",
    category: "Solar",
    slug: "solar",
    description: "Solar installation company with ROI calculator and environmental impact tracker.",
    image: solarImg,
    features: ["ROI Calculator", "Eco Impact", "Financing"],
    layoutStyle: "modern",
  },
  {
    title: "Hammer & Nail Construction",
    category: "General Contractor",
    slug: "general",
    description: "Full-service construction company with portfolio and testimonials.",
    image: generalImg,
    features: ["Video Tours", "Testimonials", "Financing"],
    layoutStyle: "standard",
  },
  {
    title: "Paradise Pools",
    category: "Pool Construction",
    slug: "pool",
    description: "Luxury pool construction with design gallery and financing options.",
    image: poolImg,
    features: ["Design Gallery", "Financing", "Maintenance"],
    layoutStyle: "modern",
  },
  {
    title: "Crystal Clear Plumbing",
    category: "Plumbing",
    slug: "plumbing",
    description: "Plumbing services website with emergency booking and maintenance plans.",
    image: plumbingImg,
    features: ["Live Chat", "Maintenance Plans", "Coupons"],
    layoutStyle: "standard",
  },
  {
    title: "Apex Roofing Solutions",
    category: "Roofing",
    slug: "roofing",
    description: "Roofing contractor site with storm damage assessment and financing options.",
    image: roofingImg,
    features: ["Free Inspections", "Insurance Help", "Warranties"],
    layoutStyle: "standard",
  },
];

const Portfolio = () => {
  return (
    <section id="portfolio" className="py-20 md:py-32 bg-secondary/50 section-divider">
      <div className="container mx-auto px-4">
        <AnimatedSection animation="fade-up" className="text-center mb-16">
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
        </AnimatedSection>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {portfolioItems.map((item, index) => (
            <AnimatedSection
              key={item.title}
              animation="fade-up"
              delay={index * 50}
              className="group"
            >
              <div className="glass rounded-2xl overflow-hidden card-3d h-full flex flex-col">
                {/* Preview Image */}
                <div className="h-44 relative img-zoom">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent opacity-60" />
                  {/* Browser dots */}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-white/30" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/30" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/30" />
                  </div>
                  {/* Layout style badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                      item.layoutStyle === 'creative' ? 'bg-rose-500/80 text-white' :
                      item.layoutStyle === 'technical' ? 'bg-teal-500/80 text-white' :
                      item.layoutStyle === 'modern' ? 'bg-amber-500/80 text-white' :
                      'bg-muted/80 text-muted-foreground'
                    }`}>
                      {item.layoutStyle}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-primary bg-primary/20 px-2.5 py-0.5 rounded-full">
                      {item.category}
                    </span>
                  </div>
                  <h3 className="font-display text-lg text-foreground mb-1.5 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-3 line-clamp-2 flex-1">
                    {item.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {item.features.map((feature) => (
                      <span
                        key={feature}
                        className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                  <Link to={`/demo/${item.slug}`}>
                    <Button 
                      variant="outline" 
                      className="w-full group/btn border-border/50 hover:border-primary hover:bg-primary/10 transition-all"
                    >
                      Preview Site
                      <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection animation="fade-up" delay={400} className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Don't see your trade? We create custom websites for all construction industries.
          </p>
          <a href="#contact">
            <Button variant="default" size="lg" className="glow animate-pulse-border group">
              Request Custom Demo
              <ExternalLink className="w-4 h-4 ml-2 group-hover:rotate-12 transition-transform" />
            </Button>
          </a>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default Portfolio;
