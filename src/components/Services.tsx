import { Globe, Palette, Wrench, Shield, Zap, Headphones } from "lucide-react";
import AnimatedSection from "@/components/ui/AnimatedSection";

const services = [
  {
    icon: Globe,
    title: "Custom Domains",
    description: "Get your own professional domain like yourcompany.com with free SSL certificates.",
  },
  {
    icon: Palette,
    title: "Industry Templates",
    description: "Pre-built templates designed for concrete, electrical, landscaping, and more.",
  },
  {
    icon: Wrench,
    title: "Easy Management",
    description: "Simple dashboard to update your site, add photos, and manage content.",
  },
  {
    icon: Shield,
    title: "Secure Hosting",
    description: "Enterprise-grade security to protect your website and customer data.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Optimized servers ensure your site loads quickly on any device.",
  },
  {
    icon: Headphones,
    title: "Local Support",
    description: "Based in Rancho Cucamonga - real people you can call for help.",
  },
];

const Services = () => {
  return (
    <section id="services" className="py-20 md:py-32 bg-background section-divider">
      <div className="container mx-auto px-4">
        <AnimatedSection animation="fade-up" className="text-center mb-16">
          <span className="inline-block text-primary font-semibold tracking-wide uppercase mb-4">
            Our Services
          </span>
          <h2 className="font-display text-4xl md:text-6xl text-foreground mb-4">
            EVERYTHING YOU NEED TO
            <span className="text-gradient"> SUCCEED ONLINE</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From website design to hosting and maintenance, we handle it all so you can 
            focus on what you do best – building and growing your business.
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <AnimatedSection
              key={service.title}
              animation="fade-up"
              delay={index * 100}
            >
              <div className="group glass rounded-xl p-8 card-3d hover:border-primary/30 h-full">
                <div className="w-14 h-14 bg-primary/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/30 group-hover:glow group-hover:scale-110 transition-all duration-300">
                  <service.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display text-2xl text-foreground mb-3 group-hover:text-primary transition-colors">
                  {service.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {service.description}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
