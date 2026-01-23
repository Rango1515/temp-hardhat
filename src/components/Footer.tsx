import { HardHat, Phone, Mail, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";

const Footer = () => {
  const { handleAnchorClick } = useSmoothScroll();

  return (
    <footer className="bg-card border-t border-border/30 py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Logo & About */}
          <AnimatedSection animation="fade-up" delay={0} className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4 group">
              <div className="bg-primary p-2 rounded-lg glow group-hover:scale-105 transition-transform">
                <HardHat className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <span className="font-display text-xl text-foreground tracking-wider">
                  HARDHAT
                </span>
                <span className="font-display text-xl text-primary tracking-wider ml-1">
                  HOSTING
                </span>
              </div>
            </Link>
            <p className="text-muted-foreground mb-6 max-w-md">
              Professional web hosting and website design for construction companies 
              in Rancho Cucamonga and the Inland Empire. We help contractors build 
              their online presence.
            </p>
            <div className="flex flex-col gap-3">
              <a href="tel:+19095551234" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group touch-feedback">
                <Phone className="w-4 h-4 group-hover:animate-pulse" />
                <span>(909) 555-1234</span>
              </a>
              <a href="mailto:info@hardhathosting.com" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group touch-feedback">
                <Mail className="w-4 h-4 group-hover:animate-pulse" />
                <span>info@hardhathosting.com</span>
              </a>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>Rancho Cucamonga, CA</span>
              </div>
            </div>
          </AnimatedSection>

          {/* Quick Links */}
          <AnimatedSection animation="fade-up" delay={100}>
            <h4 className="font-display text-lg text-foreground mb-4">
              Quick Links
            </h4>
            <nav className="flex flex-col gap-3">
              <a 
                href="#services" 
                onClick={(e) => handleAnchorClick(e, '#services')}
                className="text-muted-foreground hover:text-primary transition-colors nav-link inline-block"
              >
                Services
              </a>
              <a 
                href="#portfolio" 
                onClick={(e) => handleAnchorClick(e, '#portfolio')}
                className="text-muted-foreground hover:text-primary transition-colors nav-link inline-block"
              >
                Portfolio
              </a>
              <a 
                href="#contact" 
                onClick={(e) => handleAnchorClick(e, '#contact')}
                className="text-muted-foreground hover:text-primary transition-colors nav-link inline-block"
              >
                Contact
              </a>
            </nav>
          </AnimatedSection>

          {/* Industries */}
          <AnimatedSection animation="fade-up" delay={200}>
            <h4 className="font-display text-lg text-foreground mb-4">
              Industries We Serve
            </h4>
            <nav className="flex flex-col gap-3">
              <Link to="/demo/concrete" className="text-muted-foreground hover:text-primary transition-colors">Concrete Contractors</Link>
              <Link to="/demo/electrical" className="text-muted-foreground hover:text-primary transition-colors">Electricians</Link>
              <Link to="/demo/landscaping" className="text-muted-foreground hover:text-primary transition-colors">Landscaping</Link>
              <Link to="/demo/plumbing" className="text-muted-foreground hover:text-primary transition-colors">Plumbing</Link>
              <Link to="/demo/roofing" className="text-muted-foreground hover:text-primary transition-colors">Roofing</Link>
              <Link to="/demo/general" className="text-muted-foreground hover:text-primary transition-colors">General Contractors</Link>
            </nav>
          </AnimatedSection>
        </div>

        <AnimatedSection animation="fade-up" delay={300}>
          <div className="border-t border-border/30 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-muted-foreground/70 text-sm">
              © {new Date().getFullYear()} Hardhat Hosting. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-muted-foreground/70 hover:text-primary text-sm transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-muted-foreground/70 hover:text-primary text-sm transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </footer>
  );
};

export default Footer;
