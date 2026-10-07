'use client';

import { useEffect, useRef, memo, ReactNode } from 'react';
import Lenis from '@studio-freight/lenis';
import { useIsDesktop } from '@/hooks/useIsDesktop';

const LenisRoot = memo(function LenisRoot({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const isDesktop = useIsDesktop();

  useEffect(() => {
    if (!isDesktop) return;

    lenisRef.current = new Lenis({
      duration: 1.8,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    function raf(time: number) {
      lenisRef.current?.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenisRef.current?.destroy();
    };
  }, [isDesktop]);

  return <>{children}</>;
});

export default LenisRoot;
