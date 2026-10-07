'use client';
import React, { useRef, useState, useEffect, memo } from 'react';
import { FRAME_COUNT, FRAMES_DIR, POSTER_PATH } from '@/lib/config';
import { useFramePreloader } from '@/hooks/useFramePreloader';
import { useIsDesktop } from '@/hooks/useIsDesktop';

const START_FRAME_COUNT = 20;
const SCROLL_VH = 400;
const DPR = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

function buildFramePaths(count: number): string[] {
  const paths: string[] = [];
  for (let i = 1; i <= count; i++) {
    const num = String(i).padStart(4, '0');
    paths.push(`${FRAMES_DIR}/f_${num}.webp`);
  }
  return paths;
}

const DesktopScrollHero = memo(function DesktopScrollHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameIndexRef = useRef(0);
  const [frameIndex, setFrameIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [usePoster, setUsePoster] = useState(false);
  const isDesktop = useIsDesktop();
  const preloadProgress = useFramePreloader(isDesktop ?? false);
  const imgRefs = useRef<HTMLImageElement[]>([]);
  const loadedCountRef = useRef(0);

  useEffect(() => {
    if (!isDesktop) return;

    // Check prefers-reduced-motion
    if (typeof window !== 'undefined') {
      const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
      setUsePoster(mql.matches);
      const listener = (e: MediaQueryListEvent) => setUsePoster(e.matches);
      mql.addEventListener('change', listener);
      return () => mql.removeEventListener('change', listener);
    }
  }, [isDesktop]);

  useEffect(() => {
    if (!isDesktop || usePoster) return;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const frames = buildFramePaths(FRAME_COUNT);
    const total = frames.length;

    // Set canvas resolution
    canvas.width = window.innerWidth * DPR;
    canvas.height = window.innerHeight * DPR;
    const ctx = canvas.getContext('2d')!;

    // Draw with cover-fit
    const drawCover = (img: HTMLImageElement) => {
      const srcRatio = img.naturalWidth / img.naturalHeight;
      const viewRatio = window.innerWidth / window.innerHeight;
      let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
      if (srcRatio > viewRatio) {
        sh = img.naturalHeight * (viewRatio / srcRatio);
        sy = (img.naturalHeight - sh) / 2;
      } else {
        sw = img.naturalWidth * (srcRatio / viewRatio);
        sx = (img.naturalWidth - sw) / 2;
      }
      ctx.clearRect(0, 0, canvas.width / DPR, canvas.height / DPR);
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width / DPR, canvas.height / DPR);
    };

    // Preload frames in batches
    const preloadBatch = (start: number, end: number) => {
      for (let i = start; i < end && i < total; i++) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          imgRefs.current[i] = img;
          loadedCountRef.current++;
          if (loadedCountRef.current === START_FRAME_COUNT && !isReady) {
            setIsReady(true);
          }
          if (i === frameIndexRef.current) drawCover(img);
        };
        img.onerror = () => {
          // Silently skip failed frames
          loadedCountRef.current++;
        };
        img.src = frames[i];
      }
    };

    // Preload first 20 frames immediately
    preloadBatch(0, Math.min(START_FRAME_COUNT, total));
    // Preload remaining frames in background
    if (total > START_FRAME_COUNT) {
      preloadBatch(START_FRAME_COUNT, total);
    }

    // Draw first frame immediately if available
    if (imgRefs.current[0]) {
      drawCover(imgRefs.current[0]);
      setIsReady(true);
    }

    // Set container height
    container.style.height = `${SCROLL_VH}vh`;

    // Scroll handler
    const onScroll = () => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const scrolled = -rect.top;
      const maxScroll = (SCROLL_VH - 100) * (window.innerHeight / 100);
      const progress = Math.min(Math.max(scrolled / maxScroll, 0), 1);
      const index = Math.min(Math.floor(progress * total), total - 1);

      if (index !== frameIndexRef.current) {
        frameIndexRef.current = index;
        setFrameIndex(index);
        const img = imgRefs.current[index];
        if (img) drawCover(img);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Resize handler
    const onResize = () => {
      canvas.width = window.innerWidth * DPR;
      canvas.height = window.innerHeight * DPR;
      const img = imgRefs.current[frameIndexRef.current];
      if (img) drawCover(img);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [isDesktop, usePoster, isReady]);

  // Show poster while loading or for reduced-motion
  if (usePoster || !isReady) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 1,
          pointerEvents: 'none',
          backgroundColor: '#0a0a0a',
        }}
      >
        <img
          src={POSTER_PATH}
          alt="Zen Garden"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      </div>
    );
  }

  return (
    <>
      {/* Fixed canvas layer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 1,
          pointerEvents: 'none',
          backgroundColor: '#0a0a0a',
          overflow: 'hidden',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
          }}
        />
      </div>

      {/* Scroll container */}
      <div
        ref={containerRef}
        style={{
          height: `${SCROLL_VH}vh`,
          position: 'relative',
        }}
      />
    </>
  );
});

export default DesktopScrollHero;
