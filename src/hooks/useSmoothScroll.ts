import { useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const HEADER_OFFSET = 80;

export const useSmoothScroll = () => {
  const location = useLocation();

  // Scroll to element with offset for sticky header
  const scrollToElement = useCallback((elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - HEADER_OFFSET;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }, []);

  // Scroll to top of page
  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  // Handle hash navigation on route change
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      setTimeout(() => scrollToElement(id), 100);
    }
  }, [location.hash, scrollToElement]);

  // Handle anchor clicks with smooth scroll
  const handleAnchorClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const id = href.replace('#', '');
      scrollToElement(id);
    } else if (href.includes('#')) {
      // Handle links like "/#contact"
      const [, hash] = href.split('#');
      if (window.location.pathname === '/' || href.startsWith('/#')) {
        e.preventDefault();
        scrollToElement(hash);
      }
    }
  }, [scrollToElement]);

  return {
    scrollToElement,
    scrollToTop,
    handleAnchorClick
  };
};

export const useScrollToTop = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
};
