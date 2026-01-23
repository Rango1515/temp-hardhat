import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";
import heroImage from "@/assets/hero-construction.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-20">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Construction site"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 hero-bg opacity-85" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 rounded-full px-4 py-2 mb-6 animate-fade-in">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-primary-foreground/90 text-sm font-medium">
              Rancho Cucamonga's #1 Construction Web Hosting
            </span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-primary-foreground leading-none mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            WEBSITES THAT
            <span className="text-gradient block">BUILD YOUR BUSINESS</span>
          </h1>

          <p className="text-lg md:text-xl text-primary-foreground/70 mb-8 max-w-xl animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Professional web hosting and stunning websites designed specifically for 
            construction companies. Concrete, electrical, landscaping, and more.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-12 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Button variant="hero" size="xl">
              View Demo Sites
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="heroOutline" size="xl">
              Contact Us
            </Button>
          </div>

          <div className="flex flex-wrap gap-6 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            {["Fast Setup", "24/7 Support", "Mobile Optimized"].map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-primary-foreground/80">
                <CheckCircle className="w-5 h-5 text-primary" />
                <span className="font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary-foreground/30 rounded-full flex items-start justify-center p-2">
          <div className="w-1.5 h-3 bg-primary rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
