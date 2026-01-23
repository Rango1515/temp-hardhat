import { Globe, Palette, Wrench, Shield, Zap, Headphones } from "lucide-react";

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
    <section id="services" className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
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
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <div
              key={service.title}
              className="group bg-card rounded-xl p-8 card-hover border border-border/50 hover:border-primary/30 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <service.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display text-2xl text-foreground mb-3">
                {service.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
