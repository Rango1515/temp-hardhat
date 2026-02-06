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
            <p className="text-muted-foreground mb-4 max-w-md">
              Professional web hosting and website design for contractors and small businesses 
              in Rancho Cucamonga and the Inland Empire. From construction trades to retail shops, 
              salons to professional services - we help every business build their online presence.
            </p>
            <p className="text-sm text-primary/80 italic mb-6 max-w-md">
              Not a contractor? No problem. We build high-performance sites for every industry.
            </p>
            <div className="flex flex-col gap-3">
              <a href="tel:+19096874971" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group touch-feedback">
                <Phone className="w-4 h-4 group-hover:animate-pulse" />
                <span>(909) 687-4971</span>
              </a>
              <a href="mailto:admin@hardhathosting.work" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group touch-feedback">
                <Mail className="w-4 h-4 group-hover:animate-pulse" />
                <span>admin@hardhathosting.work</span>
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

          {/* Services */}
          <AnimatedSection animation="fade-up" delay={200}>
            <h4 className="font-display text-lg text-foreground mb-4">
              Website Design
            </h4>
            <nav className="flex flex-col gap-3">
              <Link to="/services/electrician-website-design" className="text-muted-foreground hover:text-primary transition-colors">Electrician Websites</Link>
              <Link to="/services/plumber-website-design" className="text-muted-foreground hover:text-primary transition-colors">Plumber Websites</Link>
              <Link to="/services/roofing-website-design" className="text-muted-foreground hover:text-primary transition-colors">Roofing Websites</Link>
              <Link to="/services/hvac-website-design" className="text-muted-foreground hover:text-primary transition-colors">HVAC Websites</Link>
              <Link to="/services/contractor-website-design" className="text-muted-foreground hover:text-primary transition-colors">Contractor Websites</Link>
              <Link to="/services/salon-website-design" className="text-muted-foreground hover:text-primary transition-colors">Salon Websites</Link>
              <Link to="/services/web-design-rancho-cucamonga" className="text-muted-foreground hover:text-primary transition-colors">Rancho Cucamonga</Link>
              <Link to="/services/web-design-inland-empire" className="text-muted-foreground hover:text-primary transition-colors">Inland Empire</Link>
            </nav>
          </AnimatedSection>
        </div>

        <AnimatedSection animation="fade-up" delay={300}>
          <div className="border-t border-border/30 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-muted-foreground/70 text-sm">
              © {new Date().getFullYear()} Hardhat Hosting. All rights reserved.
            </p>
            <div className="flex gap-6">
                <Link to="/privacy" className="text-muted-foreground/70 hover:text-primary text-sm transition-colors">
                Privacy Policy
                </Link>
                <Link to="/terms" className="text-muted-foreground/70 hover:text-primary text-sm transition-colors">
                Terms of Service
                </Link>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </footer>
  );
};

export default Footer;
