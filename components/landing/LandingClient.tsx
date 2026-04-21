'use client';

import { KenBurnsHero } from '@/components/media/KenBurnsHero';
import { ScrollChapter } from '@/components/landing/ScrollChapter';
import { AddressSearchDock } from '@/components/landing/AddressSearchDock';
import { CountUp } from '@/components/ui/CountUp';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import Link from 'next/link';

const AGENCIES = [
  { name: 'NASA', full: 'Earth Observations' },
  { name: 'EPA', full: 'Environmental Protection' },
  { name: 'USDA', full: 'Soil & Agriculture' },
  { name: 'USGS', full: 'Geological Survey' },
  { name: 'FEMA', full: 'Flood Hazards' },
  { name: 'Census', full: 'Demographics' },
  { name: 'CDC', full: 'Social Vulnerability' },
];

export function LandingClient() {
  return (
    <>
      {/* Hero — Ken Burns delta satellite */}
      <KenBurnsHero image="hero-delta">
        <p className="font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[3px] text-white/60 mb-6">
          Environmental Exposure Intelligence
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.12] tracking-[-0.02em] text-white max-w-2xl">
          Know what you&rsquo;re breathing, drinking, and standing on.
        </h1>
        <div className="mt-12 max-w-2xl">
          <AddressSearchDock variant="hero" />
        </div>
      </KenBurnsHero>

      {/* Chapter: Soil */}
      <ScrollChapter image="chapter-soil" duotone>
        <p className="font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[3px] text-white/70 mb-4">
          Soil & Land
        </p>
        <div className="flex items-baseline justify-center gap-2">
          <CountUp
            end={3140}
            className="text-[clamp(4rem,10vw,6rem)] font-medium leading-none"
          />
        </div>
        <p className="mt-4 font-[family-name:var(--font-sans)] text-[clamp(1rem,2.5vw,1.25rem)] leading-relaxed max-w-xl mx-auto text-white/90">
          counties scored for soil contamination vulnerability — a first.
        </p>
        <cite className="mt-6 block not-italic font-[family-name:var(--font-mono)] text-[11px] text-white/60">
          USDA SSURGO · EPA Brownfields · FEMA NFHL
        </cite>
      </ScrollChapter>

      {/* Chapter: Water/Air */}
      <ScrollChapter image="chapter-air" duotone>
        <p className="font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[3px] text-white/70 mb-4">
          Water & Air
        </p>
        <div className="flex items-baseline justify-center gap-2">
          <CountUp
            end={176}
            className="text-[clamp(4rem,10vw,6rem)] font-medium leading-none"
          />
          <span className="font-[family-name:var(--font-mono)] text-[clamp(2rem,5vw,3rem)]">M</span>
        </div>
        <p className="mt-4 font-[family-name:var(--font-sans)] text-[clamp(1rem,2.5vw,1.25rem)] leading-relaxed max-w-xl mx-auto text-white/90">
          Americans with PFAS-contaminated drinking water systems.
        </p>
        <cite className="mt-6 block not-italic font-[family-name:var(--font-mono)] text-[11px] text-white/60">
          EPA UCMR 5 · SDWIS · USGS Water Quality Portal
        </cite>
      </ScrollChapter>

      {/* Chapter: Redlining — dark background, no image */}
      <ScrollChapter className="bg-[#0D1F1C]">
        <p className="font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[3px] text-white/70 mb-4">
          Environmental Justice
        </p>
        <div className="flex items-baseline justify-center gap-2">
          <CountUp
            end={90}
            className="text-[clamp(4rem,10vw,6rem)] font-medium leading-none"
          />
        </div>
        <p className="mt-4 font-[family-name:var(--font-sans)] text-[clamp(1rem,2.5vw,1.25rem)] leading-relaxed max-w-xl mx-auto text-white/90">
          years later, redlined neighborhoods still have 2.3&times; the poverty rate.
        </p>
        <div className="mt-8 flex items-center justify-center gap-6">
          {['A', 'B', 'C', 'D'].map((grade) => (
            <div key={grade} className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{
                  background:
                    grade === 'A' ? '#4daf4a' : grade === 'B' ? '#377eb8' : grade === 'C' ? '#ffbf00' : '#e41a1c',
                }}
              />
              <span className="font-[family-name:var(--font-mono)] text-sm text-white/80">
                Grade {grade}
              </span>
            </div>
          ))}
        </div>
        <cite className="mt-6 block not-italic font-[family-name:var(--font-mono)] text-[11px] text-white/60">
          U. Richmond Mapping Inequality · Census ACS 2022 · 300 cities
        </cite>
      </ScrollChapter>

      {/* Chapter: Data Sources */}
      <section className="relative min-h-[70vh] flex items-center bg-bg-elevated">
        <div className="mx-auto w-full max-w-4xl px-4 py-24 sm:px-6 lg:px-8 text-center">
          <ScrollReveal>
            <p className="font-[family-name:var(--font-mono)] text-[12px] uppercase tracking-[3px] text-text-tertiary mb-8">
              Data from
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-6 sm:gap-8">
              {AGENCIES.map((a) => (
                <div key={a.name} className="flex flex-col items-center gap-1">
                  <span className="font-[family-name:var(--font-mono)] text-lg font-semibold text-text-primary">
                    {a.name}
                  </span>
                  <span className="text-[11px] text-text-tertiary">{a.full}</span>
                </div>
              ))}
            </div>
            <p className="mt-10 font-[family-name:var(--font-display)] text-[clamp(1.25rem,3vw,1.75rem)] leading-[1.3] text-text-primary">
              15 federal databases. 5 contamination layers. One search.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative min-h-[60vh] flex items-center border-t border-border bg-bg-surface">
        <div className="mx-auto w-full max-w-3xl px-4 py-24 sm:px-6 lg:px-8 text-center">
          <ScrollReveal>
            <h2 className="font-[family-name:var(--font-display)] text-[clamp(2rem,5vw,3rem)] leading-[1.12] tracking-[-0.02em] text-text-primary mb-10">
              Check your address.
            </h2>
            <AddressSearchDock variant="cta" />
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
              <Link
                href="/intelligence"
                className="text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                View research briefs &rarr;
              </Link>
              <Link
                href="/auth/signup"
                className="text-sm text-accent hover:underline"
              >
                Pro accounts from $99/mo
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
