import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

const portfolioItems = [
  {
    title: "Solid Foundation Concrete",
    category: "Concrete",
    slug: "concrete",
    description: "Professional concrete contractor website with project gallery and quote request forms.",
    color: "from-slate-600 to-slate-800",
    features: ["Online Quotes", "Project Gallery", "Service Areas"],
  },
  {
    title: "Volt Electric Pro",
    category: "Electrical",
    slug: "electrical",
    description: "Modern electrical services website with emergency contact and service scheduling.",
    color: "from-amber-500 to-orange-600",
    features: ["24/7 Emergency", "Online Booking", "Certifications"],
  },
  {
    title: "Green Valley Landscaping",
    category: "Landscaping",
    slug: "landscaping",
    description: "Beautiful landscaping company site showcasing outdoor transformations.",
    color: "from-emerald-500 to-green-700",
    features: ["Before/After", "Design Ideas", "Seasonal Specials"],
  },
  {
    title: "Hammer & Nail Construction",
    category: "General Contractor",
    slug: "general",
    description: "Full-service construction company with portfolio and testimonials.",
    color: "from-orange-500 to-red-600",
    features: ["Video Tours", "Testimonials", "Financing"],
  },
  {
    title: "Crystal Clear Plumbing",
    category: "Plumbing",
    slug: "plumbing",
    description: "Plumbing services website with emergency booking and maintenance plans.",
    color: "from-blue-500 to-cyan-600",
    features: ["Live Chat", "Maintenance Plans", "Coupons"],
  },
  {
    title: "Apex Roofing Solutions",
    category: "Roofing",
    slug: "roofing",
    description: "Roofing contractor site with storm damage assessment and financing options.",
    color: "from-gray-700 to-gray-900",
    features: ["Free Inspections", "Insurance Help", "Warranties"],
  },
];

const Portfolio = () => {
  return (
    <section id="portfolio" className="py-20 md:py-32 bg-muted/50">
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
              className="group bg-card rounded-2xl overflow-hidden card-hover border border-border/50 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Preview Header */}
              <div className={`h-48 bg-gradient-to-br ${item.color} relative overflow-hidden`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-card/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                    <span className="font-display text-2xl text-white">{item.title}</span>
                  </div>
                </div>
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
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
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
                    <ExternalLink className="w-4 h-4" />
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
          <Button variant="default" size="lg">
            Request Custom Demo
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Portfolio;
