'use client';

import { useState, useEffect, useRef } from 'react';
import { FRAME_COUNT, FRAMES_DIR } from '@/lib/config';

function buildFramePaths(count: number): string[] {
  const paths: string[] = [];
  for (let i = 1; i <= count; i++) {
    const num = String(i).padStart(4, '0');
    paths.push(`${FRAMES_DIR}/f_${num}.webp`);
  }
  return paths;
}

export function useFramePreloader(isDesktop: boolean): number {
  const [progress, setProgress] = useState(0);
  const loadedRef = useRef(new Set<string>());
  const total = FRAME_COUNT;

  useEffect(() => {
    if (!isDesktop) return;

    const frames = buildFramePaths(total);
    let completed = 0;

    const update = () => {
      completed = loadedRef.current.size;
      setProgress(Math.round((completed / total) * 100));
    };

    // Preload all frames
    frames.forEach((src) => {
      const img = new Image();
      img.onload = () => {
        if (!loadedRef.current.has(src)) {
          loadedRef.current.add(src);
          update();
        }
      };
      img.onerror = () => {
        if (!loadedRef.current.has(src)) {
          loadedRef.current.add(src);
          update();
        }
      };
      img.src = src;
    });

    return () => {
      loadedRef.current.clear();
    };
  }, [isDesktop]);

  return progress;
}
