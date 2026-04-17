'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface CountUpProps {
  end: number;
  duration?: number;
  className?: string;
  suffix?: string;
  decimals?: number;
}

export function CountUp({
  end,
  duration = 600,
  className = '',
  suffix = '',
  decimals = 0,
}: CountUpProps) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  const animate = useCallback(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) {
      setValue(end);
      return;
    }

    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(eased * end);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setValue(end);
      }
    };
    requestAnimationFrame(step);
  }, [end, duration]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          animate();
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [animate]);

  const display = decimals > 0 ? value.toFixed(decimals) : Math.round(value);

  return (
    <span
      ref={ref}
      className={`font-[family-name:var(--font-mono)] tabular-nums ${className}`}
    >
      {display}
      {suffix}
    </span>
  );
}
