'use client';

import { useEffect, useRef, type ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  stagger?: boolean;
  threshold?: number;
}

export function ScrollReveal({
  children,
  className = '',
  stagger = false,
  threshold = 0.15,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) {
      el.classList.add('revealed');
      el.style.opacity = '1';
      return;
    }

    el.style.opacity = stagger ? '1' : '0';

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (stagger) {
            el.classList.add('revealed');
          } else {
            el.classList.add('animate-reveal');
          }
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [stagger, threshold]);

  return (
    <div
      ref={ref}
      className={`${stagger ? 'stagger-children' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
