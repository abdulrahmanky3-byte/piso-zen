# CLAUDE.md — apple-3d

## Project rules (strict)

1. **Desktop code must live only in `src/components/hero/DesktopScrollHero.tsx`.**
   Mobile-only code must NOT be present in this file.

2. **Mobile code must live only in `src/components/hero/MobileHero.tsx`.**
   Desktop-only code must NOT be present in this file.

3. **On mobile, frame images must never be downloaded.**
   `MobileHero.tsx` should not reference any frame image imports — use a placeholder
   or skip image rendering entirely on mobile breakpoints.

4. **Currently only animation is in scope.**
   Do NOT implement navbar, text overlays, section layouts, or any non-animation
   UI. Hero scroll animation is the only feature being built right now.

5. **Framework & dependencies:** Next.js App Router (TypeScript), gsap +
   `gsap/ScrollTrigger`, `@studio-freight/lenis` for smooth scrolling.
   No Tailwind. No build tools beyond what Next.js provides.

## Folder structure

```
src/
  app/
    globals.css
    layout.tsx
    page.tsx
  components/
    hero/
      DesktopScrollHero.tsx   ← desktop only
      MobileHero.tsx          ← mobile only
      HeroSection.tsx         ← toggles between the two
    lenis/
      LenisRoot.tsx           ← Lenis provider
  lib/
    shared.ts                 ← shared helpers (isMobile)
  types/
    images.d.ts               ← image module declaration
public/
  images/
    scroll-{1..4}.jpg
```
