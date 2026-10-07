'use client';
import React, { useRef, useState, useEffect, memo } from 'react';
import { FRAME_COUNT, FRAMES_DIR } from '@/lib/config';
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

    // Set canvas resolution to match viewport at DPR
    const setCanvasSize = () => {
      canvas.width = window.innerWidth * DPR;
      canvas.height = window.innerHeight * DPR;
    };
    setCanvasSize();

    const ctx = canvas.getContext('2d')!;

    // Draw with cover-fit (maintains aspect ratio, no stretch)
    const drawCover = (img: HTMLImageElement) => {
      const srcRatio = img.naturalWidth / img.naturalHeight;
      const viewRatio = window.innerWidth / window.innerHeight;
      let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
      if (srcRatio > viewRatio) {
        // Source is wider — crop sides
        sh = img.naturalHeight * (viewRatio / srcRatio);
        sy = (img.naturalHeight - sh) / 2;
      } else {
        // Source is taller — crop top/bottom
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
        // Draw if this is the current frame
        if (i === frameIndexRef.current) drawCover(img);
      };
      img.onerror = () => {
        // Silently skip failed frames
      };
      img.src = src;
    });

    // Draw first frame immediately if available
    if (imgRefs.current[0]) {
      drawCover(imgRefs.current[0]);
    }

    // Scroll container provides the scroll distance
    container.style.height = `${SCROLL_VH}vh`;

    // Scroll handler — calculates progress and updates frame
    const onScroll = () => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      // How far have we scrolled into the container?
      const scrolled = -rect.top;
      // Max scroll = container height - viewport height
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

    // Handle resize
    const onResize = () => {
      setCanvasSize();
      const img = imgRefs.current[frameIndexRef.current];
      if (img) drawCover(img);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      imgRefs.current = [];
    };
  }, [isDesktop]);

  return (
    // OUTER TRACK: 300vh tall scroll container
    <section
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: `${SCROLL_VH}vh`,
        backgroundColor: '#0a0a0a',
      }}
    >
      {/* STICKY VIEWPORT: locks to screen while scrolling */}
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
        {/* CANVAS: fills the sticky viewport */}
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
          }}
        />
      </div>
    </section>
  );
});

export default DesktopScrollHero;
