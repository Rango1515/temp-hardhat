import { Button } from "@/components/ui/button";
import { HardHat, Phone, Mail, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";
import { useActiveSection, useHeaderScroll } from "@/hooks/useScrollAnimation";
import { cn } from "@/lib/utils";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { handleAnchorClick } = useSmoothScroll();
  const activeSection = useActiveSection(['services', 'portfolio', 'contact']);
  const isScrolled = useHeaderScroll();

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isMenuOpen && !(e.target as Element).closest('header')) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMenuOpen]);

  // Close menu on scroll
  useEffect(() => {
    if (isMenuOpen) {
      const handleScroll = () => setIsMenuOpen(false);
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [isMenuOpen]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    handleAnchorClick(e, href);
    setIsMenuOpen(false);
  };

  const navLinks = [
    { href: '#services', label: 'Services' },
    { href: '#portfolio', label: 'Portfolio' },
    { href: '#contact', label: 'Contact' },
  ];

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled 
          ? "bg-background/98 backdrop-blur-lg border-b border-border/40 shadow-lg" 
          : "bg-background/80 backdrop-blur-md border-b border-border/20"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-primary p-2 rounded-lg glow group-hover:scale-105 transition-transform">
              <HardHat className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <span className="font-display text-xl md:text-2xl text-foreground tracking-wider">
                HARDHAT
              </span>
              <span className="font-display text-xl md:text-2xl text-primary tracking-wider ml-1">
                HOSTING
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={cn(
                  "nav-link py-2 font-medium transition-colors",
                  activeSection === link.href.replace('#', '')
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary"
                )}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <a href="tel:+19096874971" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group">
              <Phone className="w-4 h-4 group-hover:animate-pulse" />
              <span className="font-medium">(909) 687-4971</span>
            </a>
            <a href="#contact" onClick={(e) => handleNavClick(e, '#contact')}>
              <Button variant="default" size="lg" className="glow animate-pulse-border">
                Get Started
              </Button>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground hover:text-primary transition-colors touch-feedback"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div 
          className={cn(
            "md:hidden overflow-hidden transition-all duration-300 ease-out",
            isMenuOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="py-4 border-t border-border/20">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link, index) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={cn(
                    "py-3 px-4 rounded-lg font-medium transition-all duration-300 touch-feedback",
                    activeSection === link.href.replace('#', '')
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-primary hover:bg-muted/50"
                  )}
                  style={{ 
                    animationDelay: `${index * 50}ms`,
                    opacity: isMenuOpen ? 1 : 0,
                    transform: isMenuOpen ? 'translateX(0)' : 'translateX(-20px)',
                    transition: 'opacity 0.3s ease, transform 0.3s ease'
                  }}
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-3 pt-4 mt-2 border-t border-border/20">
                <a href="tel:+19096874971" className="flex items-center gap-2 text-muted-foreground px-4 py-2">
                  <Phone className="w-4 h-4" />
                  <span>(909) 687-4971</span>
                </a>
                <a href="mailto:admin@hardhathosting.work" className="flex items-center gap-2 text-muted-foreground px-4 py-2">
                  <Mail className="w-4 h-4" />
                  <span>admin@hardhathosting.work</span>
                </a>
                <a href="#contact" onClick={(e) => handleNavClick(e, '#contact')} className="px-4">
                  <Button variant="default" size="lg" className="w-full mt-2 glow">
                    Get Started
                  </Button>
                </a>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
