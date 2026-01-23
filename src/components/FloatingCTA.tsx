import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, X } from 'lucide-react';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';

const FloatingCTA = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { scrollToElement } = useSmoothScroll();

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past hero section (roughly 80vh)
      const heroHeight = window.innerHeight * 0.8;
      setIsVisible(window.scrollY > heroHeight);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isDismissed || !isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2 animate-fade-in">
      <button
        onClick={() => setIsDismissed(true)}
        className="p-1.5 rounded-full bg-muted/80 text-muted-foreground hover:bg-muted transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
      <Button
        onClick={() => scrollToElement('contact')}
        size="lg"
        className="glow-intense shadow-2xl animate-bounce-subtle group"
      >
        <MessageCircle className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
        Get Started
      </Button>
    </div>
  );
};

export default FloatingCTA;
