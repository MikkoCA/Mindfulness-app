'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    const doScroll = () => {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      } catch (e) {
        console.error("Failed to scroll to top:", e);
      }
    };

    // Attempt scroll immediately
    doScroll();

    // Also attempt within a requestAnimationFrame to handle potential layout shifts
    const animationFrameId = requestAnimationFrame(doScroll);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [pathname]);

  return null;
} 