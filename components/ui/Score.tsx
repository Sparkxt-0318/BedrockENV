'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { DataResolution } from '@/types/resolution';

interface ScoreProps {
  value: number;
  confidence?: DataResolution | 'insufficient' | 'low' | 'high' | 'moderate';
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: { box: 64, stroke: 3, text: 'text-xl', ring: 26 },
  md: { box: 96, stroke: 4, text: 'text-3xl', ring: 40 },
  lg: { box: 144, stroke: 5, text: 'text-5xl', ring: 60 },
} as const;

function scoreColor(value: number): string {
  if (value >= 70) return 'var(--exposure-high)';
  if (value >= 40) return 'var(--exposure-moderate)';
  return 'var(--exposure-low)';
}

function confidenceLabel(
  c?: DataResolution | 'insufficient' | 'low' | 'high' | 'moderate'
): string {
  if (!c) return '';
  switch (c) {
    case 'property':
    case 'high':
      return 'High confidence';
    case 'neighborhood':
    case 'moderate':
      return 'Moderate';
    case 'area':
    case 'low':
      return 'Directional';
    case 'insufficient':
      return 'Insufficient data';
  }
}

export function Score({
  value,
  confidence,
  size = 'md',
  animate = true,
  className = '',
}: ScoreProps) {
  const { box, stroke, text, ring } = SIZE_MAP[size];
  const [displayValue, setDisplayValue] = useState(animate ? 0 : value);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  const circumference = 2 * Math.PI * ring;
  const progress = displayValue / 100;
  const dashOffset = circumference * (1 - progress);
  const color = scoreColor(value);

  const runAnimation = useCallback(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    const start = performance.now();
    const duration = 600;
    const step = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayValue(Math.round(eased * value));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);

  useEffect(() => {
    if (!animate) {
      setDisplayValue(value);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          runAnimation();
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [animate, value, runAnimation]);

  return (
    <div
      ref={ref}
      className={`inline-flex flex-col items-center gap-1 ${className}`}
      role="meter"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Exposure score: ${value} out of 100`}
    >
      <div className="relative" style={{ width: box, height: box }}>
        <svg
          viewBox={`0 0 ${box} ${box}`}
          className="rotate-[-90deg]"
          aria-hidden="true"
        >
          <circle
            cx={box / 2}
            cy={box / 2}
            r={ring}
            fill="none"
            stroke="var(--border)"
            strokeWidth={stroke}
          />
          <circle
            cx={box / 2}
            cy={box / 2}
            r={ring}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{
              transition: animate
                ? 'stroke-dashoffset 600ms cubic-bezier(.2,.8,.2,1)'
                : 'none',
            }}
          />
        </svg>
        <span
          className={`absolute inset-0 flex items-center justify-center font-[family-name:var(--font-mono)] tabular-nums font-semibold ${text}`}
          style={{ color }}
        >
          {displayValue}
        </span>
      </div>
      {confidence && (
        <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-text-tertiary">
          {confidenceLabel(confidence)}
        </span>
      )}
    </div>
  );
}
