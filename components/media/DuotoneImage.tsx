'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { placeholders } from '@/lib/media/placeholders';

interface DuotoneImageProps {
  src: string;
  alt: string;
  intensity?: number;
  className?: string;
  priority?: boolean;
}

export function DuotoneImage({
  src,
  alt,
  intensity = 0.85,
  className = '',
  priority = false,
}: DuotoneImageProps) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const handleLoad = useCallback(() => setLoaded(true), []);

  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setLoaded(true);
    }
  }, []);

  const key = src.replace(/^\/media\//, '').replace(/\.(webp|jpg)$/, '');
  const lqip = placeholders[key];

  return (
    <div className={`duotone-wrap overflow-hidden ${className}`} aria-hidden="true"
      style={{
        '--dt-intensity': intensity,
        '--dt-intensity-dark': Math.min(intensity + 0.1, 0.98),
      } as React.CSSProperties}
    >
      {lqip && !priority && (
        <img
          src={lqip}
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 motion-reduce:transition-none ${loaded ? 'opacity-0' : 'opacity-100'}`}
          style={{ filter: 'blur(20px)', transform: 'scale(1.1)' }}
        />
      )}

      <picture>
        <source srcSet={`/media/${key}.webp`} type="image/webp" />
        <img
          ref={imgRef}
          src={`/media/${key}.jpg`}
          alt={alt}
          onLoad={handleLoad}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 motion-reduce:transition-none ${loaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ filter: 'grayscale(100%) sepia(100%) hue-rotate(115deg) saturate(0.4) brightness(0.65) contrast(1.2)' }}
        />
      </picture>
    </div>
  );
}
