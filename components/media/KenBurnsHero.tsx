'use client';

import { useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { placeholders } from '@/lib/media/placeholders';

interface KenBurnsHeroProps {
  image: string;
  children: ReactNode;
  className?: string;
}

export function KenBurnsHero({ image, children, className = '' }: KenBurnsHeroProps) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const handleLoad = useCallback(() => setLoaded(true), []);

  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setLoaded(true);
    }
  }, []);

  const key = image.replace(/\.(webp|jpg)$/, '');
  const lqip = placeholders[key];

  return (
    <section className={`relative flex min-h-screen items-end overflow-hidden ${className}`}>
      {lqip && (
        <img
          src={lqip}
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 motion-reduce:transition-none ${loaded ? 'opacity-0' : 'opacity-100'}`}
          style={{ filter: 'blur(20px)', transform: 'scale(1.1)' }}
        />
      )}

      <div className="absolute inset-0 overflow-hidden">
        <picture>
          <source srcSet={`/media/${key}.webp`} type="image/webp" />
          <img
            ref={imgRef}
            src={`/media/${key}.jpg`}
            alt=""
            aria-hidden="true"
            onLoad={handleLoad}
            loading="eager"
            decoding="sync"
            className="ken-burns-animate h-full w-full object-cover"
            style={{ filter: 'grayscale(100%) sepia(100%) hue-rotate(115deg) saturate(0.4) brightness(0.65) contrast(1.2)' }}
          />
        </picture>
      </div>

      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(13,31,28,0.92) 0%, rgba(13,31,28,0.3) 40%, transparent 70%)',
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-16 pt-48 sm:px-6 sm:pb-24 lg:px-8">
        {children}
      </div>
    </section>
  );
}
