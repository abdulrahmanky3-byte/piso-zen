import type { ReactNode } from 'react';
import LenisRoot from '@/components/lenis/LenisRoot';
import HeroSection from '@/components/hero/HeroSection';

export default function Home() {
  return (
    <LenisRoot>
      <HeroSection />
    </LenisRoot>
  );
}
