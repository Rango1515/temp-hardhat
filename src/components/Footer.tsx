import { HardHat, Phone, Mail, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-secondary py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Logo & About */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-primary p-2 rounded-lg">
                <HardHat className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <span className="font-display text-xl text-secondary-foreground tracking-wider">
                  HARDHAT
                </span>
                <span className="font-display text-xl text-primary tracking-wider ml-1">
                  HOSTING
                </span>
              </div>
            </div>
            <p className="text-secondary-foreground/70 mb-6 max-w-md">
              Professional web hosting and website design for construction companies 
              in Rancho Cucamonga and the Inland Empire. We help contractors build 
              their online presence.
            </p>
            <div className="flex flex-col gap-3">
              <a href="tel:+19095551234" className="flex items-center gap-2 text-secondary-foreground/70 hover:text-primary transition-colors">
                <Phone className="w-4 h-4" />
                <span>(909) 555-1234</span>
              </a>
              <a href="mailto:info@hardhathosting.com" className="flex items-center gap-2 text-secondary-foreground/70 hover:text-primary transition-colors">
                <Mail className="w-4 h-4" />
                <span>info@hardhathosting.com</span>
              </a>
              <div className="flex items-center gap-2 text-secondary-foreground/70">
                <MapPin className="w-4 h-4" />
                <span>Rancho Cucamonga, CA</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg text-secondary-foreground mb-4">
              Quick Links
            </h4>
            <nav className="flex flex-col gap-3">
              <a href="#services" className="text-secondary-foreground/70 hover:text-primary transition-colors">
                Services
              </a>
              <a href="#portfolio" className="text-secondary-foreground/70 hover:text-primary transition-colors">
                Portfolio
              </a>
              <a href="#pricing" className="text-secondary-foreground/70 hover:text-primary transition-colors">
                Pricing
              </a>
              <a href="#contact" className="text-secondary-foreground/70 hover:text-primary transition-colors">
                Contact
              </a>
            </nav>
          </div>

          {/* Industries */}
          <div>
            <h4 className="font-display text-lg text-secondary-foreground mb-4">
              Industries We Serve
            </h4>
            <nav className="flex flex-col gap-3">
              <span className="text-secondary-foreground/70">Concrete Contractors</span>
              <span className="text-secondary-foreground/70">Electricians</span>
              <span className="text-secondary-foreground/70">Landscaping</span>
              <span className="text-secondary-foreground/70">Plumbing</span>
              <span className="text-secondary-foreground/70">Roofing</span>
              <span className="text-secondary-foreground/70">General Contractors</span>
            </nav>
          </div>
        </div>

        <div className="border-t border-secondary-foreground/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-secondary-foreground/50 text-sm">
            © {new Date().getFullYear()} Hardhat Hosting. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-secondary-foreground/50 hover:text-primary text-sm transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-secondary-foreground/50 hover:text-primary text-sm transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
