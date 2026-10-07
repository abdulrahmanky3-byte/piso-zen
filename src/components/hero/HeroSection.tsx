'use client';

import { memo, lazy, Suspense } from 'react';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import MobileHero from './MobileHero';

// Lazy load DesktopScrollHero — sirf desktop par load hoga
const DesktopScrollHero = lazy(() => import('./DesktopScrollHero'));

const HeroSection = memo(function HeroSection() {
  const isDesktop = useIsDesktop();

  if (isDesktop === undefined) {
    // SSR ya initial load — loading state
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          backgroundColor: '#0a0a0a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ color: '#666', fontFamily: 'monospace', fontSize: 14 }}>
          Loading...
        </span>
      </div>
    );
  }

  if (isDesktop) {
    return (
      <Suspense
        fallback={
          <div
            style={{
              width: '100vw',
              height: '100vh',
              backgroundColor: '#0a0a0a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: '#666', fontFamily: 'monospace', fontSize: 14 }}>
              Loading frames...
            </span>
          </div>
        }
      >
        <DesktopScrollHero />
      </Suspense>
    );
  }

  // Mobile — sirf video, frames bilkul nahi load honge
  return <MobileHero />;
});

export default HeroSection;
