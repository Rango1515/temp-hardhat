import { Button } from "@/components/ui/button";
import { HardHat, Phone, Mail, Menu, X, User } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-secondary/95 backdrop-blur-md border-b border-border/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-lg">
              <HardHat className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <span className="font-display text-xl md:text-2xl text-secondary-foreground tracking-wider">
                HARDHAT
              </span>
              <span className="font-display text-xl md:text-2xl text-primary tracking-wider ml-1">
                HOSTING
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#services" className="text-secondary-foreground/80 hover:text-primary transition-colors font-medium">
              Services
            </a>
            <a href="#portfolio" className="text-secondary-foreground/80 hover:text-primary transition-colors font-medium">
              Portfolio
            </a>
            <a href="#pricing" className="text-secondary-foreground/80 hover:text-primary transition-colors font-medium">
              Pricing
            </a>
            <a href="#contact" className="text-secondary-foreground/80 hover:text-primary transition-colors font-medium">
              Contact
            </a>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <a href="tel:+19095551234" className="flex items-center gap-2 text-secondary-foreground/80 hover:text-primary transition-colors">
              <Phone className="w-4 h-4" />
              <span className="font-medium">(909) 555-1234</span>
            </a>
            {user ? (
              <Link to="/dashboard">
                <Button variant="default" size="lg">
                  <User className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button variant="default" size="lg">
                  Login / Sign Up
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-secondary-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/10 animate-fade-in">
            <nav className="flex flex-col gap-4">
              <a href="#services" className="text-secondary-foreground/80 hover:text-primary transition-colors font-medium py-2">
                Services
              </a>
              <a href="#portfolio" className="text-secondary-foreground/80 hover:text-primary transition-colors font-medium py-2">
                Portfolio
              </a>
              <a href="#pricing" className="text-secondary-foreground/80 hover:text-primary transition-colors font-medium py-2">
                Pricing
              </a>
              <a href="#contact" className="text-secondary-foreground/80 hover:text-primary transition-colors font-medium py-2">
                Contact
              </a>
              <div className="flex flex-col gap-3 pt-4 border-t border-border/10">
                <a href="tel:+19095551234" className="flex items-center gap-2 text-secondary-foreground/80">
                  <Phone className="w-4 h-4" />
                  <span>(909) 555-1234</span>
                </a>
                <a href="mailto:info@hardhathosting.com" className="flex items-center gap-2 text-secondary-foreground/80">
                  <Mail className="w-4 h-4" />
                  <span>info@hardhathosting.com</span>
                </a>
                {user ? (
                  <Link to="/dashboard">
                    <Button variant="default" size="lg" className="w-full mt-2">
                      <User className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  <Link to="/auth">
                    <Button variant="default" size="lg" className="w-full mt-2">
                      Login / Sign Up
                    </Button>
                  </Link>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
