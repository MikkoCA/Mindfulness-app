'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    try {
      window.scrollTo(0, 0);
    } catch (e) {
      console.error("Failed to scroll to top:", e);
    }
  }, [pathname]);

  return null;
} 