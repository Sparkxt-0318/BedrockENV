'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { DuotoneImage } from '@/components/media/DuotoneImage';

interface ScrollChapterProps {
  image?: string;
  duotone?: boolean;
  children: ReactNode;
  className?: string;
  light?: boolean;
}

export function ScrollChapter({
  image,
  duotone = false,
  children,
  className = '',
  light = false,
}: ScrollChapterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const hasImage = image && duotone;

  return (
    <section
      ref={ref}
      className={`relative flex min-h-screen items-center overflow-hidden ${className}`}
    >
      {hasImage && (
        <DuotoneImage
          src={image}
          alt=""
          intensity={0.82}
          className="absolute inset-0 h-full w-full"
        />
      )}

      {hasImage && (
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to bottom, rgba(13,31,28,0.3) 0%, rgba(13,31,28,0.6) 100%)',
        }} />
      )}

      <div
        className={`relative z-10 mx-auto w-full max-w-4xl px-4 py-24 sm:px-6 lg:px-8 text-center transition-all duration-700 motion-reduce:transition-none ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className={hasImage || !light ? 'text-[var(--media-text-on-dark)]' : 'text-text-primary'}>
          {children}
        </div>
      </div>
    </section>
  );
}
