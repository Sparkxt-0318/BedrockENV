'use client';

import { useEffect, useRef, useState } from 'react';

interface CoverageMeterProps {
  coverage: number;
  sufficient?: boolean;
  className?: string;
  showLabel?: boolean;
}

export function CoverageMeter({
  coverage,
  sufficient = true,
  className = '',
  showLabel = true,
}: CoverageMeterProps) {
  const pct = Math.round(coverage * 100);
  const [animatedWidth, setAnimatedWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) {
      setAnimatedWidth(pct);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimatedWidth(pct);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [pct]);

  const barColor = !sufficient
    ? 'var(--exposure-high)'
    : coverage >= 0.6
      ? 'var(--accent)'
      : 'var(--exposure-moderate)';

  return (
    <div ref={ref} className={`flex items-center gap-3 ${className}`}>
      <div
        className="flex-1 h-2 rounded-[var(--radius-full)] overflow-hidden"
        style={{ background: 'var(--border)' }}
        role="meter"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Data coverage: ${pct}%`}
      >
        <div
          className="h-full rounded-[var(--radius-full)]"
          style={{
            width: `${animatedWidth}%`,
            background: barColor,
            transition: `width 500ms cubic-bezier(.2,.8,.2,1)`,
          }}
        />
      </div>
      {showLabel && (
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-[family-name:var(--font-mono)] text-sm tabular-nums text-text-primary">
            {pct}%
          </span>
          {!sufficient && (
            <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded-[var(--radius-sm)] bg-exposure-high/10 text-exposure-high">
              Insufficient
            </span>
          )}
        </div>
      )}
    </div>
  );
}
