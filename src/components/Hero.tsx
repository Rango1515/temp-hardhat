import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, ChevronDown } from "lucide-react";
import heroImage from "@/assets/hero-construction.jpg";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";
import AnimatedSection from "@/components/ui/AnimatedSection";

const Hero = () => {
  const { scrollToElement } = useSmoothScroll();

  return (
    <section className="relative min-h-screen flex items-center pt-20">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Construction site"
          className="w-full h-full object-cover"
          fetchPriority="high"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/60" />
        <div className="absolute inset-0 hero-bg opacity-70" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl">
          <AnimatedSection animation="fade-up" delay={0}>
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-foreground/90 text-sm font-medium">
                Rancho Cucamonga's #1 Small Business Web Hosting
              </span>
            </div>
          </AnimatedSection>

          <AnimatedSection animation="fade-up" delay={100}>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-foreground leading-none mb-6">
              WEBSITES THAT
              <span className="text-gradient block">BUILD YOUR BUSINESS</span>
            </h1>
          </AnimatedSection>

          <AnimatedSection animation="fade-up" delay={200}>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl">
              Professional web hosting and stunning websites for contractors, local businesses, 
              and entrepreneurs. From construction to retail, salons to consulting - if you have 
              a business, we build your online home.
            </p>
          </AnimatedSection>

          <AnimatedSection animation="fade-up" delay={300}>
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button 
                variant="hero" 
                size="xl"
                onClick={() => scrollToElement('portfolio')}
                className="group animate-pulse-border"
              >
                View Demo Sites
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="heroOutline" 
                size="xl"
                onClick={() => scrollToElement('contact')}
              >
                Contact Us
              </Button>
            </div>
          </AnimatedSection>

          <AnimatedSection animation="fade-up" delay={400}>
            <div className="flex flex-wrap gap-6">
              {["Fast Setup", "24/7 Support", "All Industries"].map((feature, index) => (
                <div 
                  key={feature} 
                  className="flex items-center gap-2 text-foreground/80 group"
                  style={{ animationDelay: `${400 + index * 100}ms` }}
                >
                  <CheckCircle className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                  <span className="font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </div>

      {/* Scroll Indicator */}
      <button 
        onClick={() => scrollToElement('services')}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer group"
        aria-label="Scroll to services"
      >
        <div className="w-10 h-14 border-2 border-foreground/30 rounded-full flex flex-col items-center justify-start p-2 group-hover:border-primary transition-colors">
          <div className="w-1.5 h-3 bg-primary rounded-full mb-1" />
          <ChevronDown className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </button>
    </section>
  );
};

export default Hero;
