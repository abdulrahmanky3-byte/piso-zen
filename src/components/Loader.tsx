'use client';

import { useEffect, useState } from 'react';
import { useFramePreloader } from '@/hooks/useFramePreloader';
import { useIsDesktop } from '@/hooks/useIsDesktop';

const Loader = () => {
  const isDesktop = useIsDesktop();
  const progress = useFramePreloader(isDesktop ?? false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (progress >= 100) {
      const timer = setTimeout(() => setHidden(true), 300);
      return () => clearTimeout(timer);
    }
  }, [progress]);

  if (isDesktop === undefined) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: hidden ? 0 : 1,
        pointerEvents: hidden ? 'none' : 'all',
        transition: 'opacity 0.5s ease',
      }}
    >
      <div
        style={{
          width: '200px',
          height: '2px',
          backgroundColor: '#333',
          borderRadius: 1,
          overflow: 'hidden',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: '#fff',
            transition: 'width 0.1s ease',
          }}
        />
      </div>
      <span style={{ color: '#888', fontSize: 12, fontFamily: 'monospace' }}>
        {progress}%
      </span>
    </div>
  );
};

export default Loader;
