import { useEffect, useRef, useState } from 'react';

// ── Shared IntersectionObserver (one per threshold) ─────────────────────────
type ObserverCallback = (entry: IntersectionObserverEntry) => void;

const observerMap = new Map<number, {
  observer: IntersectionObserver;
  callbacks: Map<Element, ObserverCallback>;
}>();

function getSharedObserver(threshold: number, rootMargin: string) {
  const key = threshold;
  if (observerMap.has(key)) return observerMap.get(key)!;

  const callbacks = new Map<Element, ObserverCallback>();
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const cb = callbacks.get(entry.target);
        if (cb) cb(entry);
      });
    },
    { threshold, rootMargin }
  );

  const entry = { observer, callbacks };
  observerMap.set(key, entry);
  return entry;
}

interface UseScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export const useScrollAnimation = (options: UseScrollAnimationOptions = {}) => {
  const { threshold = 0.1, rootMargin = '0px', triggerOnce = true } = options;
  const elementRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Respect reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsVisible(true);
      setHasAnimated(true);
      return;
    }

    const { observer, callbacks } = getSharedObserver(threshold, rootMargin);

    const handleEntry = (entry: IntersectionObserverEntry) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        if (triggerOnce) {
          setHasAnimated(true);
          observer.unobserve(element);
          callbacks.delete(element);
        }
      } else if (!triggerOnce) {
        setIsVisible(false);
      }
    };

    callbacks.set(element, handleEntry);
    observer.observe(element);

    return () => {
      observer.unobserve(element);
      callbacks.delete(element);
    };
  }, [threshold, rootMargin, triggerOnce]);

  return { elementRef, isVisible, hasAnimated };
};

// Hook for detecting active section during scroll
export const useActiveSection = (sectionIds: string[]) => {
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      
      for (const id of sectionIds) {
        const element = document.getElementById(id);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    // Debounce scroll events
    let ticking = false;
    const scrollHandler = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', scrollHandler, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', scrollHandler);
  }, [sectionIds]);

  return activeSection;
};

// Hook for header scroll behavior
export const useHeaderScroll = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return isScrolled;
};
