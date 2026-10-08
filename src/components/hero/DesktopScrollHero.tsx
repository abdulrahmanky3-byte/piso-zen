'use client';
import React, { useRef, useEffect, memo } from 'react';
import { FRAME_COUNT, FRAMES_DIR } from '@/lib/config';
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
  const imgRefs = useRef<HTMLImageElement[]>([]);
  const isDesktop = useIsDesktop();

  useEffect(() => {
    if (!isDesktop) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // Check prefers-reduced-motion
    if (typeof window !== 'undefined') {
      const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mql.matches) return;
    }

    const frames = buildFramePaths(FRAME_COUNT);
    const total = frames.length;

    // Set canvas resolution
    const updateCanvasSize = () => {
      canvas.width = window.innerWidth * DPR;
      canvas.height = window.innerHeight * DPR;
    };
    updateCanvasSize();
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

    // Preload all frames
    frames.forEach((src, i) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imgRefs.current[i] = img;
        // Draw first frame immediately
        if (i === 0) drawCover(img);
      };
      img.src = src;
    });

    // Scroll handler
    const onScroll = () => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const scrolled = -rect.top;
      const maxScroll = container.offsetHeight - window.innerHeight;
      const progress = Math.min(Math.max(scrolled / maxScroll, 0), 1);
      const index = Math.min(Math.floor(progress * total), total - 1);

      const img = imgRefs.current[index];
      if (img) drawCover(img);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Resize handler
    const onResize = () => {
      updateCanvasSize();
      const img = imgRefs.current[0];
      if (img) drawCover(img);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [isDesktop]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: `${SCROLL_VH}vh`,
        backgroundColor: '#0a0a0a',
      }}
    >
      <div
        style={{
          position: 'sticky',
          top: 0,
          width: '100%',
          height: '100vh',
          overflow: 'hidden',
          backgroundColor: '#0a0a0a',
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
    </div>
  );
});

export default DesktopScrollHero;
