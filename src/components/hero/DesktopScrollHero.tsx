'use client';
import React, { useRef, useState, useEffect, memo } from 'react';
import { FRAME_COUNT, FRAMES_DIR, POSTER_PATH } from '@/lib/config';
import { useFramePreloader } from '@/hooks/useFramePreloader';
import { useIsDesktop } from '@/hooks/useIsDesktop';

const SCROLL_VH = 300;
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
  const isDesktop = useIsDesktop();
  const preloadProgress = useFramePreloader(isDesktop ?? false);
  const imgRefs = useRef<HTMLImageElement[]>([]);

  useEffect(() => {
    if (!isDesktop) return;

    // Check prefers-reduced-motion
    if (typeof window !== 'undefined') {
      const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mql.matches) return;
    }

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

    // Preload ALL frames immediately
    frames.forEach((src, i) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imgRefs.current[i] = img;
        // Draw if this is current frame
        if (i === frameIndexRef.current) drawCover(img);
      };
      img.onerror = () => {
        // Skip failed frames silently
      };
      img.src = src;
    });

    // Draw first frame immediately if available
    if (imgRefs.current[0]) {
      drawCover(imgRefs.current[0]);
    }

    // Set container height
    container.style.height = `${SCROLL_VH}vh`;

    // Scroll handler — uses refs, no state in dependency array
    const onScroll = () => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const scrolled = -rect.top;
      const maxScroll = SCROLL_VH * (window.innerHeight / 100);
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
  }, [isDesktop]); // Only depends on isDesktop

  return (
    <>
      {/* FIXED canvas layer — stays locked to viewport */}
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
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      </div>

      {/* SCROLL TRACK — provides scroll distance */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          height: `${SCROLL_VH}vh`,
          zIndex: 0,
        }}
      />
    </>
  );
});

export default DesktopScrollHero;
