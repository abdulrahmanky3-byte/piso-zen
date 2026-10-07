'use client';

import { memo } from 'react';
import { MOBILE_VIDEO_PATH, POSTER_PATH } from '@/lib/config';

const MobileHero = memo(function MobileHero() {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#0a0a0a',
      }}
    >
      <video
        src={MOBILE_VIDEO_PATH}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={POSTER_PATH}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />
    </div>
  );
});

export default MobileHero;
