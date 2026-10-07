'use client';

import { useState, useEffect } from 'react';

export function useIsDesktop(): boolean | undefined {
  const [isDesktop, setIsDesktop] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)');
    setIsDesktop(mql.matches);

    const listener = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener('change', listener);
    return () => mql.removeEventListener('change', listener);
  }, []);

  return isDesktop;
}
