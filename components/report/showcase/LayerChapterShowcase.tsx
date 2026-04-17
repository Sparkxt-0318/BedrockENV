'use client';

import { useRef, useEffect } from 'react';
import { CountUp } from '@/components/ui/CountUp';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { ResolutionBadge } from '@/components/ui/Badge';
import { ReferenceCite } from '@/components/ui/ReferenceCite';
import type { LayerScore, ExposureLayer } from '@/types/exposure';

interface DataPoint {
  label: string;
  value: string | number;
  source: string;
  agency: string;
}

interface LayerChapterShowcaseProps {
  layer: ExposureLayer;
  title: string;
  layerScore: LayerScore;
  heroStat: { value: number; suffix?: string; label: string };
  dataPoints: DataPoint[];
  onVisible?: (layer: ExposureLayer) => void;
}

export function LayerChapterShowcase({
  layer,
  title,
  layerScore,
  heroStat,
  dataPoints,
  onVisible,
}: LayerChapterShowcaseProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !onVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onVisible(layer);
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [layer, onVisible]);

  return (
    <section
      ref={ref}
      className="min-h-[80vh] flex items-center border-t border-border"
      data-layer={layer}
    >
      <div className="w-full py-20 sm:py-28">
        <ScrollReveal>
          <div className="flex items-center gap-3">
            <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.1em] text-text-tertiary">
              {title}
            </span>
            <ResolutionBadge resolution={layerScore.confidence} />
          </div>

          <div className="mt-6 flex items-baseline gap-3">
            <CountUp
              end={heroStat.value}
              className="text-[clamp(3rem,8vw,5rem)] font-semibold leading-none text-text-primary"
            />
            {heroStat.suffix && (
              <span className="font-[family-name:var(--font-mono)] text-[clamp(1.25rem,3vw,2rem)] text-text-primary">
                {heroStat.suffix}
              </span>
            )}
            <span className="text-[clamp(1.25rem,3vw,2rem)] font-[family-name:var(--font-display)] text-text-secondary">
              / 100
            </span>
          </div>

          <p className="mt-2 text-sm text-text-tertiary font-[family-name:var(--font-mono)]">
            {heroStat.label}
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {dataPoints.map((dp, i) => (
              <div
                key={i}
                className="py-4 border-t border-border"
              >
                <span className="font-[family-name:var(--font-mono)] text-2xl tabular-nums text-text-primary">
                  {dp.value}
                </span>
                <p className="mt-1 text-sm text-text-secondary">{dp.label}</p>
                <ReferenceCite
                  source={dp.source}
                  agency={dp.agency}
                  className="mt-2"
                />
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
