'use client';

import { CountUp } from '@/components/ui/CountUp';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

interface LayerChapter {
  label: string;
  stat: number;
  statSuffix: string;
  headline: string;
  attribution: string;
}

const chapters: LayerChapter[] = [
  {
    label: 'Water',
    stat: 176,
    statSuffix: 'M',
    headline: 'Americans drink from water systems with detected PFAS.',
    attribution: 'USGS, 2023 — EPA UCMR 5 / SDWIS',
  },
  {
    label: 'Air',
    stat: 40,
    statSuffix: '%',
    headline: 'of Americans live in counties that fail federal air quality standards.',
    attribution: 'American Lung Association, 2024 — EPA AQS / Green Book',
  },
  {
    label: 'Toxic Proximity',
    stat: 1336,
    statSuffix: '',
    headline: 'active Superfund sites on the National Priorities List.',
    attribution: 'EPA FRS / SEMS — ECHO facility data',
  },
  {
    label: 'Soil & Land',
    stat: 450,
    statSuffix: 'K+',
    headline: 'brownfield sites with known or suspected contamination.',
    attribution: 'EPA Brownfields / USDA SSURGO / FEMA NFHL',
  },
  {
    label: 'Environmental Justice',
    stat: 46,
    statSuffix: '%',
    headline: 'more pollution burden in communities of color than white communities.',
    attribution: 'EPA EJScreen / CDC Social Vulnerability Index',
  },
];

export function LayerChapters() {
  return (
    <>
      {chapters.map((ch) => (
        <section
          key={ch.label}
          className="min-h-[80vh] flex items-center border-t border-border"
        >
          <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-24">
            <ScrollReveal>
              <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.1em] text-text-tertiary">
                {ch.label}
              </span>
              <div className="mt-6 flex items-baseline gap-3">
                <CountUp
                  end={ch.stat}
                  className="text-[clamp(3rem,8vw,6rem)] font-semibold leading-none text-text-primary"
                />
                {ch.statSuffix && (
                  <span className="font-[family-name:var(--font-mono)] text-[clamp(1.5rem,4vw,3rem)] text-text-primary">
                    {ch.statSuffix}
                  </span>
                )}
              </div>
              <p className="mt-4 font-[family-name:var(--font-display)] text-[clamp(1.25rem,3vw,2rem)] leading-[1.3] text-text-primary max-w-xl">
                {ch.headline}
              </p>
              <cite className="mt-6 block not-italic font-[family-name:var(--font-mono)] text-xs text-text-tertiary">
                {ch.attribution}
              </cite>
            </ScrollReveal>
          </div>
        </section>
      ))}
    </>
  );
}
